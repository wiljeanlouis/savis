# Demandes de soumission dans Sales

## Architecture et décisions

`Sales` reste structurel. `QuoteRequest` et `Quotation` sont deux agrégats dans
`sales.quotation`, module imbriqué natif Modulith 2.1.0. Catalog reste indépendant ;
Order et Invoice conservent leurs contrats et workflows. L'audit
`quote-request-admin-audit.md` est historique : ses chemins Java ont été déplacés,
sa cardinalité 0..1 est remplacée par 1:N, et `QUALIFIED` n'est pas introduit.

Le besoin original JSONB est conservé sans modification. Les UUID de réception
Supabase (`externalId`), de soumission logique (`submissionRequestId`, facultatif
pour l'historique) et local (`publicId`) sont distincts. Les PK Long ne sont pas
exposées par HTTP. Les prix publics ne servent jamais à tarifer les propositions.

La qualification contient un contact corrigé, des notes internes, des lignes
Catalog et des exclusions motivées. Chaque article original possède une référence
stable `item:0`, `item:1`, etc. Chaque service est un besoin `service:traiteur`,
`service:decoration` ou `service:organisation`. Une ligne commerciale peut couvrir
plusieurs besoins sans facturation dupliquée. La qualification peut être partielle ;
la proposition doit couvrir exactement tous les besoins par ses lignes retenues
ou ses exclusions explicites. Une exclusion et une inclusion simultanées sont
refusées. Les configurations sont validées et tarifées par le `QuotationService`
existant lors de la création, via `CatalogOrderingApi`.

Workflow : `RECEIVED → IN_PROGRESS → QUOTED`, puis clôture possible avec motif.
`QUOTED` n'est pas terminal. La qualification reste modifiable et d'autres devis
peuvent être créés. `CLOSED` bloque les nouvelles modifications et propositions,
mais pas le rejeu identique d'une proposition déjà créée. Pas de réouverture ni
de versionnement commercial des devis dans cette phase. L'historique conserve les
qualifications et changements de statut ; aucune identité opérateur n'est inventée.

## Transactions et idempotence

L'import manuel lit au plus 100 réceptions `pending`, ordonnées `(created_at,id)`.
Chaque ligne est décodée et validée indépendamment. L'insertion locale possède sa
transaction, terminée avant le PATCH distant. L'unicité `(source,external_id)`
protège les imports concurrents. Après collision, la relecture utilise une
transaction saine. Une empreinte canonique du payload détecte une réception
contradictoire, sans écrasement du contenu ou de la qualification existante.

Après échec d'acquittement, la réception reste récupérable : relancer l'import
retrouve l'agrégat et acquitte seulement. Le PATCH demande `return=representation`
et vérifie l'UUID affecté. Les erreurs stockées sont des codes, sans payload,
coordonnées, allergies ou messages PostgREST bruts. Connexion HTTP limitée à 5 s,
lecture à 15 s. Aucun appel réseau Supabase dans une transaction métier locale.

Pour les propositions, le verrou pessimiste de la demande sérialise qualification
et créations. La clé UUID `proposalRequestId` identifie une intention, pas la
demande. Une empreinte SHA-256 canonique inclut version attendue, ordre des lignes,
exclusions, validité et termes commerciaux. Même clé et même contenu : même devis.
Même clé et contenu différent : 409. Nouvelle clé : nouvelle proposition, avec
version actuelle obligatoire. Le rejeu est vérifié avant le statut et la version.
La contrainte unique `(source_quote_request_id,proposal_request_id)` est persistante.
La création, le lien et le passage à `QUOTED` sont atomiques. Les exclusions de la
proposition sont capturées sur le devis ; les qualifications antérieures restent
dans l'historique. Un devis existant ne change pas si la demande est requalifiée.

## Contrats HTTP

Les routes suivantes sont enregistrées dès le démarrage de l'API. Il n'y a
plus de flag `QUOTE_REQUESTS_ENABLED` dans la configuration actuelle.
`SUPABASE_ENABLED` active l'accès distant à l'inbox, pas l'existence des routes :

| Méthode | Route | Contrat |
| --- | --- | --- |
| POST | `/api/quote-requests/import` | Bilan `fetched`, `imported`, `alreadyImported`, `failed`, `acknowledgmentFailed`, `failures[]` (UUID externe, code et `reason`) |
| GET | `/api/quote-requests` | `page` 0..100000, `size` 1..100, `search` nom (200 caractères), `status` optionnel, `sort=receivedAt,asc\|desc` ; page de résumés, départage UUID |
| GET | `/api/quote-requests/{id}` | Original, qualification, besoins, historique, statut et version |
| PUT | `/api/quote-requests/{id}/qualification` | `{expectedVersion, qualification:{customerName,customerPhone,customerEmail,internalNotes,lines,exclusions}}` |
| PUT | `/api/quote-requests/{id}/status` | `{expectedVersion,status,reason}` ; motif requis pour `CLOSED` |
| GET | `/api/quote-requests/{id}/quotations` | Tous les devis associés, dans un ordre stable |
| POST | `/api/quote-requests/{id}/quotations` | `{proposalRequestId,expectedVersion,lineIds,exclusions,validUntil,note,discountCents,deliveryFeeCents}` |

Une ligne qualifiée contient `id` UUID, `productId`, `quantity`,
`purchaseModeCode`, `choiceCode`, `allocations[{choiceCode,quantity}]`,
`ingredients[{ingredientCode,quantity}]` et `needKeys[]`. `exclusions` est un objet
clé de besoin → motif. Une proposition choisit les UUID de lignes persistées,
et ne peut pas fournir des prix autoritatifs ou d'autres coordonnées client.

Les erreurs utilisent Problem Details : 400 saisie invalide, 404 demande inconnue,
409 version/statut/idempotence incompatible, 503 inbox indisponible. Les erreurs
métier contrôlées transmettent leur motif dans `detail` (par exemple demande
clôturée, exclusion non motivée ou configuration Catalog invalide), y compris
lorsqu’une validation échoue à la construction du DTO JSON. Les exceptions
techniques non identifiées conservent un message générique, sans corps distant,
stack trace ou données personnelles. Les réponses
de demandes portent `Cache-Control: no-store`. `sourceQuoteRequestId` est ajouté
aux réponses Quotation ; les devis autonomes gardent `null`. Les modifications,
transitions et conversions conservent cette origine.

## Admin

`features/sales/quote-requests` contient API, hooks Query, modèle, composants et
pages. L'onglet « Demandes » mène à la liste avec pagination/recherche/statut/tri
en URL. Le détail affiche client, événement, services, articles/configurations,
notes/allergies, original, qualification et tous les devis associés avec liens.
La liste réutilise les filtres partagés, les badges, le tableau et la pagination
SAVIS. Le détail s’ouvre hors du conteneur de listes Sales, comme les devis et
commandes, avec les onglets « Demande originale », « Qualification » et « Devis
associés ». La qualification passe par une action d’édition avec Annuler/Enregistrer ;
la création de devis et la clôture utilisent les dialogues partagés. Les onglets
conservent les formulaires et la clé de proposition en mémoire pendant la navigation.
Les configurations sont présentées par leurs libellés ; les données JSON originales
restent disponibles dans une section repliée. Les ajustements sont saisis en dollars
et transmis en cents.
Les retours serveur sont affichés dans des alertes : succès, bilan d’import,
échec partiel ou erreur. Les erreurs affichent le champ `detail` du serveur ;
le bilan d’import liste la raison de chaque réception en échec (`reason`), avec
un libellé de repli pour les réponses plus anciennes ne fournissant que le code.
Le formulaire de proposition garde la commande et sa clé lors d'une erreur réseau
pour permettre un rejeu identique. Il faut conserver la page pour ce rejeu ; la
commande n'est pas persistée dans le navigateur. Après rechargement, consulter les
devis associés avant de préparer une nouvelle intention.

Les formulaires issus des demandes n'utilisent aucun stockage navigateur.
Les sauvegardes du brouillon autonome conservent les lignes commerciales et
termes, mais retirent coordonnées, adresse et notes du `sessionStorage` ; ces
champs restent en mémoire pendant l'édition. Un brouillon existant est chargé
avant cette réduction, et n'est jamais remplacé par les données d'une demande.

## Sécurité : protections à vérifier avant exposition

Le code actuel ne fournit aucune authentification/autorisation applicative.
Le Nginx Admin transmet les appels sans authentification. Le Compose de production
limite le port à localhost par défaut ; une éventuelle protection du proxy externe
ou du réseau de production n'a pas été démontrée par le dépôt. CORS n'est pas une
protection d'accès. Le contrôleur est actuellement enregistré sans condition :
aucun flag ne bloque automatiquement la lecture ou la modification des demandes.

**L'exposition hors du réseau interne reste bloquée tant que les protections
ne sont pas vérifiées. Ce blocage est une exigence opérationnelle, pas un
contrôle implémenté dans le contrôleur.**
Correction opérationnelle minimale proposée : accès Admin exclusivement via un VPN
réservé aux opérateurs, port Admin lié à localhost derrière le point d'accès privé,
API et Executor non publiés, et interdiction de contournement par le proxy externe.
Si un accès Internet est nécessaire, ajouter un proxy authentifié sur TLS protégeant
l'Admin et tous ses chemins API (ou une authentification applicative adaptée).
Valider qu'un client non autorisé ne peut ni lire ni importer ni modifier une
demande. Le choix et la configuration de cette protection restent à confirmer.

Écart de journalisation constaté dans le code actuel : les méthodes
`SupabaseQuoteRequestInbox.receptionId` et `decode` journalisent la ligne
complète au niveau INFO. Celle-ci contient potentiellement coordonnées, notes
et allergies. `pending` journalise également l'exception technique avec sa
trace. Avant toute utilisation avec des données réelles, remplacer ces logs de
contenu par des identifiants techniques et des codes d'erreur, et vérifier que
les exceptions HTTP ne divulguent pas le corps distant. La documentation ne
considère donc pas l'absence de données personnelles dans les logs comme acquise.

Les migrations Supabase retirent les accès directs de `anon`/`authenticated` aux
demandes ; aucune policy publique de lecture n'est ajoutée. Le service-role reçoit
SELECT sur la table et UPDATE uniquement sur les colonnes de synchronisation. La RPC publique existante
reste disponible. La clé service-role demeure backend. Ne pas activer la journalisation
HTTP des corps ni les traces SQL contenant des paramètres. Définir avant production
la durée de conservation, les sauvegardes et la procédure de purge coordonnée avec
le registre de reçus ; aucune purge automatique n'est implémentée ici.

## Migrations, déploiement et reprise

Flyway : V14 réception, V15 qualification/version/historique, V16 lien 1:N et clés
par proposition. Supabase : `20261031120000_quote_request_sync.sql` ajoute les
colonnes techniques et privilèges ; `20261031130000_fix_quote_request_replays.sql`
rejette `type` absent/null et résout les reçus avant de revalider le catalogue.
Les migrations historiques ne sont pas modifiées.

1. Sauvegarder les bases et vérifier les protections d'accès avant de démarrer
   l'API compatible : ses nouvelles routes seront immédiatement enregistrées.
2. Corriger la journalisation des lignes complètes avant tout import de données
   personnelles, selon les points de sécurité ci-dessus.
3. Appliquer les migrations Supabase forward-only, puis démarrer l'API (Flyway).
4. Configurer `SUPABASE_ENABLED=true`, `SUPABASE_URL` et
   `SUPABASE_SERVICE_ROLE_KEY` exclusivement côté API, et déployer l'Admin compatible.
5. Vérifier les privilèges, importer manuellement un lot, contrôler bilan et détail,
   puis répéter pour les lots suivants. Il n'y a plus de flag d'activation QuoteRequest.

Une migration Supabase absente rend l'import indisponible (503) sans arrêter les
autres fonctions commerciales. Pour une ligne `failed`, corriger la cause puis
réinitialiser uniquement la réception concernée avec un rôle privilégié :

```sql
UPDATE public.quote_requests
SET sync_status='pending', synced_at=NULL, sync_error=NULL
WHERE id='<UUID de réception vérifié>'::uuid AND sync_status='failed';
```

Ne pas réinitialiser la qualification locale. Pour un échec d'acquittement après
commit, relancer simplement l'import ; ne pas supprimer l'agrégat local. Une
empreinte contradictoire exige une investigation, pas un écrasement automatique.

## Vérification

```bash
(cd savis-api && ./mvnw test)
(cd savis-admin && npm run lint && npm test -- --run && npm run build)
# Depuis la racine, Docker local disponible : bases créées puis supprimées.
python3 test/integration/quote_requests_postgres.py
python3 test/integration/quote_requests_supabase.py
SAVIS_TEST_SUPABASE_LINT=1 python3 test/integration/quote_requests_supabase.py
```

La suite PostgreSQL est conditionnée par `SAVIS_TEST_POSTGRES_URL`,
`SAVIS_TEST_POSTGRES_USER`, `SAVIS_TEST_POSTGRES_PASSWORD`. Sans ces variables,
elle est **ignorée**, pas réussie ; le runner local les fournit sans afficher
les secrets. CI fournit un PostgreSQL jetable et exécute ces tests. Le runner
Supabase applique toute la chaîne dans une base dédiée du conteneur local et
vérifie les suites SQL et les soumissions concurrentes, sans réinitialiser les
données locales. Lint optionnel sur l'URL de cette base.

Points de validation :

- `QuoteRequestExposureTest.quoteRequestRoutesAreRegisteredAtStartup` vérifie
  l’enregistrement inconditionnel du contrôleur. Ce test ne valide aucune
  authentification ou protection réseau.
- Les tests HTTP vérifient les motifs métier des réponses 400/409, les validations
  de construction JSON et le masquage des erreurs techniques. Les tests d’import
  et d’interface vérifient les raisons par réception et leur affichage en alerte.
- En cas de contention locale, la suite frontend peut être exécutée avec
  `npm test -- --run --maxWorkers=2`.

Les prestations hors Catalog restent à créer dans Catalog ou à exclure avec
motif. Une future évolution vers des lignes personnalisées devra définir validation
des prix manuels et snapshots jusqu'à Order et Invoice ; elle n'est pas implémentée.
Envoi et acceptation restent manuels. Pas d'envoi courriel, de portail public,
d'exclusivité entre devis ou de recalcul automatique après création.
