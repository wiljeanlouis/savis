# Audit — demandes de soumission publiques vers SAVIS Admin

Date : 31 octobre 2026. Référence analysée : branche `main`, commit `538f11f`.
Le répertoire de travail était propre au début de l'audit. Ce document propose
des changements ; aucun comportement applicatif ni schéma n'est implémenté.

## 1. Décision architecturale proposée

Introduire **un agrégat `QuoteRequest` dans le module existant `quotation`**.
Il représente le besoin à qualifier, indépendamment de l'agrégat `Quotation`,
qui représente l'offre commerciale tarifée. Aucun module Java `sales` à créer.
Le dossier frontend `features/sales` existe déjà et reste une organisation de
navigation, sans responsabilité métier serveur.

Une demande publique ne doit devenir ni un devis automatiquement, ni une
commande importée. Elle peut être générique, sans articles, et ses configurations
ne sont pas nécessairement suffisantes pour établir un prix. Réutiliser
`QuotationService` pour créer le devis après qualification, `CatalogOrderingApi`
pour valider et tarifer, puis le parcours existant de conversion vers Order.

## 2. Inventaire fondé sur le code

Les chemins Java ci-dessous sont relatifs à
`savis-api/src/main/java/com/savouretplus/savis/`.

| Zone | Sources principales | Comportement constaté |
| --- | --- | --- |
| Devis | `quotation/domain/Quotation.java`, `QuotationItem.java`, `QuotationStatus.java` | Numéro, contact, adresse facultative, validité, ajustements, total en cents, dates et snapshots d'articles. Au moins une ligne obligatoire. |
| Orchestration | `quotation/usecase/QuotationService.java` | Création et remplacement en brouillon depuis les prix actuels du catalogue ; transitions explicites ; conversion transactionnelle. |
| HTTP devis | `quotation/adapter/web/QuotationController.java` | Liste/détail/création/modification, `PUT /api/quotations/{id}/status`, `POST /{id}/convert`, `GET /{id}/pdf`. |
| Persistance devis | `quotation/adapter/persistence/{QuotationEntity,QuotationJpaRepository,QuotationRepositoryAdapter}.java` | Articles JSONB, `@Version`, lectures pour modification sous verrou pessimiste. |
| Contrat Order | `order/api/QuotationOrderApi.java`, `order/usecase/QuotationOrderService.java` | Crée une commande `ACCEPTED`, source `QUOTATION`, depuis les snapshots, sans recalcul Catalog. L'UUID du devis devient `externalOrderId`. |
| Contrat Catalog | `catalog/api/CatalogOrderingApi.java`, `catalog/usecase/CatalogOrderingService.java` | `snapshot(ProductSelection)` valide disponibilité, mode et options et calcule le prix ; `bomPlan` expose les contributions BOM. |
| Publication | `catalog/usecase/PublishedCatalogProductMapper.java` | ID publié = UUID public du produit sous forme de texte ; IDs de mode/choix/ingrédient = codes métier. |
| Import web | `order/usecase/ImportOrdersUseCase.java`, `order/adapter/supabase/SupabaseOrderInboxAdapter.java` | Déclenchement manuel, lecture des commandes `pending`, sauvegarde locale avant acquittement distant, bilan par ligne. |
| Facturation | `invoice/usecase/InvoiceService.java`, `order/api/OrderInvoicingApi.java`, `order/usecase/OrderInvoicingService.java` | Facture issue d'une commande éligible verrouillée ; snapshots persistés. Pas de relation directe demande → facture à ajouter. |

Interfaces Modulith : `catalog/api/package-info.java` déclare
`@NamedInterface("catalog")`, `order/api/package-info.java` déclare
`@NamedInterface("order")`. `quotation` consomme déjà ces interfaces et ne possède
pas de package `api` exposé. Le nouvel agrégat restant dans ce module, aucune
nouvelle interface intermodule n'est nécessaire. Ne pas exposer ses repositories
ou ses services internes à Order. `SavisApiModularityTests` appelle
`ApplicationModules.of(...).verify()`.

Migrations métier existantes : `V5__create_order_schema.sql` impose l'unicité
`(source, external_order_id)` ; `V8__create_quotation_schema.sql` impose les UUID
et numéros uniques, les statuts, et un `converted_order_id` unique référençant
`orders(public_id)`. Cette référence SQL existe sans relation JPA intermodule.
La dernière migration présente est V13 ; réserver les numéros suivants au moment
du développement, sans réécrire V5/V8.

### Cycle commercial effectivement disponible

`DRAFT → SENT → ACCEPTED | REJECTED`. Seul `DRAFT` est modifiable. Réappliquer le
même statut est sans effet métier ; les dates initiales sont conservées.
`validUntil` est requis, mais aucune expiration automatique ou interdiction
d'accepter après cette date n'est implémentée. Ne pas ajouter cette règle
implicitement dans l'intégration des demandes.

`QuotationService.convert` verrouille le devis, retourne la commande déjà liée
le cas échéant, sinon exige `ACCEPTED`, appelle `QuotationOrderApi.create`, puis
enregistre le lien. Les transactions Spring participent normalement à la même
transaction locale. La protection principale des conversions concurrentes par
ce chemin est le verrou du devis, complété par l'unicité côté Order.
`QuotationOrderService.create` effectue lui-même une recherche puis une insertion :
son unicité protège les données, mais ce service seul ne résout pas explicitement
une course d'insertion en retournant systématiquement l'UUID existant.

L'Admin affiche **« Marquer envoyée »** : il change le statut, sans transport
courriel. L'acceptation est également saisie par l'opérateur ; aucun portail
d'acceptation publique n'existe dans ce parcours. Le PDF est généré à la demande.

## 3. Contrat Supabase et écarts avec une commande web

Sources : [schéma initial](../../supabase/migrations/20260606000000_initial_commerce_schema.sql),
[RPC sécurisée](../../supabase/migrations/20261023120000_secure_mixed_quote_requests.sql),
[contrat d'intégration](mixed-event-quote-request-rpc.md),
[documentation Supabase](../../supabase/README.md).

`quote_requests` contient seulement `id UUID`, `payload JSONB objet`,
`status TEXT DEFAULT 'new'`, `source TEXT DEFAULT 'savouretplus'`, `created_at`.
Pas de `sync_status`, `synced_at`, `sync_error`, ni de contrainte d'énumération sur
`status`. Aucun DTO, adaptateur ou import Java de cette table n'existe.

La RPC `submit_quote_request(jsonb) returns uuid` reçoit :

| Champ | Sémantique à préserver |
| --- | --- |
| `request_id` | UUID de tentative logique côté public ; différent de l'UUID de réception retourné. |
| `type` | Valeur attendue `QUOTE_REQUEST`. |
| `customer` | Nom et téléphone requis ; courriel et note facultatifs. |
| `requested_services` | Ensemble exact correspondant à `event_details.request_type`. |
| `event_details` | Type d'événement, date, adresse libre et budget textuel requis ; heure, invités, allergies et note facultatifs. |
| `items[]` | 0 à 100 lignes ; `offering_id`, nom, quantité demandée (1–1000), configuration, note facultative. |
| `configuration` | Slug/catégorie et éventuels sous-type, type de produit, mode, sélection, allocations, ingrédients ; les identifiants sont confrontés à la projection disponible. |

Types de demande : `traiteur`, `decoration`, `organisation`,
`decoration-organisation`, `traiteur-decoration`,
`traiteur-decoration-organisation`. Ne pas inventer d'autre combinaison.
Le budget est du texte ; l'adresse événementielle n'est pas l'adresse structurée
du client. Les prix et libellés imbriqués reçus ne sont pas une offre commerciale.

La RPC limite le payload à 128 Kio et utilise un registre privé
`quote_request_receipts` : clé `(scope, request_id)`, empreinte SHA-256 du JSONB,
verrou de reçu, UUID de réception et insertion atomique. Même contenu rejoué :
même réception ; contenu différent : `QUOTE_IDEMPOTENCY_CONFLICT`.
La FK du reçu interdit la suppression isolée de la demande référencée.

**Limites à connaître avant développement :**

- La validation contre le catalogue intervient avant la lecture du reçu : un
  rejeu identique après retrait/renommage d'un produit peut échouer avant de
  retrouver sa réception. C'est une limite du contrat public, indépendante de
  l'idempotence de l'import local. Ajouter un test de rejeu après évolution de
  catalogue et décider d'une correction forward-only séparée.
- Le test SQL `payload ->> 'type' <> 'QUOTE_REQUEST'` ne rejette pas à lui seul
  un champ absent/null en logique SQL à trois valeurs. Prévoir un cas de test
  avec client valide et `type` absent/null, et une correction ciblée si confirmé
  à l'exécution. L'importeur ne doit pas supposer que toute ligne historique
  respecte intégralement le contrat récent.
- Les champs de configuration sont partiellement facultatifs : la RPC n'exige
  pas toutes les sélections et répartitions requises par Catalog pour tarifer.
  Les fixtures SQL incluent même des produits sans mode d'achat.

### Réutiliser le principe d'import, pas le mapper Order

`ImportOrdersUseCase` lit uniquement `pending`, détecte le doublon local, traite
chaque ligne, et distingue échec métier et échec d'acquittement après sauvegarde.
`OrderRepositoryAdapter.save` ouvre sa transaction et fait `saveAndFlush` : le
commit local précède le PATCH distant quand l'importeur non transactionnel
l'appelle. L'adaptateur Supabase utilise la clé service-role côté serveur.
Une ligne `failed` nécessite actuellement une remise à `pending` manuelle.

Limites observées : pas de pagination explicite ; conversion des DTO de tout le
lot avant la boucle (une erreur du mapper adaptateur peut interrompre le lot) ;
PATCH avec `return=minimal`, sans vérifier qu'une ligne a été modifiée ; branches
d'échec d'acquittement et de collision d'unicité peu couvertes. Le nouveau flux
doit traiter ces cas explicitement, sans changer celui des commandes existantes.
Ne pas copier `CustomerOrderImportMapper` : l'import Order conserve des prix
soumis, tandis que la demande n'en possède pas d'autoritatifs.

## 4. Modèle proposé

Deux agrégats et deux machines d'état dans `quotation` :

| Objet | Responsabilité | Données proposées |
| --- | --- | --- |
| `QuoteRequest` | Réception locale, qualification et traçabilité du besoin | PK interne Long, UUID public, source, `externalRequestId = quote_requests.id`, `submissionRequestId = payload.request_id` facultatif pour historique, empreinte/version de contrat, payload original immuable, date source, date d'import, statut métier, données de qualification, dates, version de concurrence. |
| Lignes demandées | Conserver le besoin original sans lui attribuer de prix | Identité locale stable (UUID), position source, UUID d'offre, nom/configuration/quantité/notes originales. Leur correction est une donnée de qualification distincte. |
| Qualification | Décisions de l'opérateur | Contact corrigé, événement conservé, notes internes, configuration commerciale retenue, traitement motivé des lignes et services non repris. Aucun prix calculé ici. |
| `Quotation` | Offre ferme tarifée | Modèle actuel conservé ; lien d'origine facultatif `sourceQuoteRequestId` unique pour la première phase. |

Le payload original peut rester JSONB ; exposer un DTO métier typé pour
l'affichage et indexer les champs nécessaires aux recherches. Ne pas faire
circuler des `JsonNode` ou DTO Supabase dans les invariants métier. Les lignes
doivent être identifiables même si un même produit apparaît plusieurs fois.

Proposition initiale : **0 ou 1 devis par demande**. La FK locale facultative
`quotations.source_quote_request_id` vers l'UUID de la demande, unique, garantit
la cardinalité ; les devis autonomes gardent `NULL`. Le détail demande retrouve
son devis par ce lien plutôt que de maintenir deux références réciproques.
Le refus d'un devis ne rouvre pas automatiquement la demande. Si des variantes
ou révisions multiples sont nécessaires, valider un modèle 1:N et une clé de
création/révision avant d'adopter cette contrainte.

Statuts proposés de demande : `RECEIVED → QUALIFYING → QUALIFIED → QUOTED`,
avec `CLOSED` depuis les états précédant `QUOTED`, motif obligatoire. Passer de
`QUALIFIED` à `QUALIFYING` pour corriger est permis avant création du devis.
`QUOTED` signifie qu'un devis existe, pas qu'il est envoyé, accepté ou commandé.
Afficher ensuite les statuts du devis et son `convertedOrderId`, sans les
dupliquer dans l'état demande. Un refus public initial ou une demande abandonnée
n'est pas un `Quotation.REJECTED`.

L'état technique de synchronisation reste distinct : ajouter à Supabase
`sync_status pending|synced|failed`, `synced_at`, `sync_error`, index partiel et
privilèges backend explicites. Conserver le `status='new'` public actuel.
Les lignes historiques deviennent importables via la valeur par défaut `pending`.
Éviter d'attribuer un `request_id` inventé aux anciennes demandes.

## 5. Workflow cible et contrats HTTP proposés

1. **Réception publique** : RPC existante, aucun calcul ni accès à SAVIS Admin.
2. **Récupération manuelle** : Admin appelle `POST /api/quote-requests/import` ;
   API lit l'inbox, valide la forme, persiste la demande, puis acquitte Supabase.
   Un catalogue devenu indisponible ne doit pas empêcher de recevoir le besoin.
3. **Consultation** : `GET /api/quote-requests` paginé, filtres/statut/services,
   recherche et tri bornés ; `GET /api/quote-requests/{id}` avec détail complet.
4. **Qualification** : `PUT /api/quote-requests/{id}/qualification` et
   `PUT /api/quote-requests/{id}/status`, avec version attendue. L'opérateur
   complète les modes/options, corrige le contact et motive les exclusions.
   Ne pas transformer automatiquement l'adresse événement en adresse client.
5. **Création explicite** : `POST /api/quote-requests/{id}/quotation` avec termes
   commerciaux et version attendue ; exige `QUALIFIED`, au moins une ligne
   Catalog valide, une validité et le traitement de tous les besoins. Sous verrou
   demande, appelle `QuotationService.create`, lie le devis et passe à `QUOTED`
   dans la même transaction. Un rejeu retrouve le même devis. Un payload de
   création contradictoire doit produire 409, pas remplacer silencieusement
   l'offre ; conserver l'empreinte de commande initiale pour cette comparaison.
6. **Envoi** : PDF et « Marquer envoyée » existants ; puis acceptation/refus par
   l'opérateur, sans inventer de preuve d'envoi ou de consentement client.
7. **Commande** : `POST /api/quotations/{id}/convert` existant ; commande
   `QUOTATION/ACCEPTED`, montants capturés conservés. La chaîne demande → devis →
   commande assure la provenance sans changer `externalOrderId` côté Order.

Mapping de configuration après qualification : `offering_id → productId`,
`purchase_mode.id → purchaseModeCode`, `selection.choice_id → choiceCode`,
`allocation[].choice_id/quantity → allocations`,
`ingredients[].id/quantity → ingredients`. Ne pas confondre `requested_quantity`
et quantité interne du mode (ex. 4 douzaines = quantité 4, mode de 12).
Les enums publics en minuscules sont traduits à la frontière ; la tarification
relit les valeurs courantes via Catalog, jamais les prix/libellés publics.

Les demandes d'organisation ou sur mesure sans produit vendable restent
qualifiables mais ne peuvent produire aujourd'hui un devis à lignes libres.
Choix recommandé pour cette phase : configurer un produit/service dans Catalog
ou clôturer avec motif. Ajouter des lignes libres et prix négociés serait une
évolution commerciale distincte, à propager jusqu'à Order et Invoice.

## 6. Idempotence, transactions, sécurité et erreurs

| Risque | Règle proposée |
| --- | --- |
| Double import | Contrainte locale unique `(source, external_request_id)` ; ne pas dédupliquer par courriel, date d'événement ou contenu. Conserver les deux UUID externes distincts. |
| Crash après commit local | Au rejeu, retrouver la demande puis refaire seulement l'acquittement. Ne jamais réinitialiser sa qualification. |
| Course d'import | Insertion dans une transaction par ligne ; après violation d'unicité, relire dans une transaction saine. Ne pas continuer dans une transaction marquée rollback-only. |
| Modification distante du même UUID | Comparer l'empreinte ; conflit explicite et audit, aucun écrasement local silencieux. |
| Double création de devis | Verrou demande + unicité du lien + empreinte de la commande de création. Vérifier le rejeu avant le refus lié au statut `QUOTED`. |
| Échec du devis | Rollback du lien et du passage à `QUOTED` ; aucune demande marquée traitée sans devis durable. |
| Concurrence de qualification | Version attendue exposée au client, contrôle sous verrou ou verrou optimiste réellement comparé ; 409 en cas de formulaire périmé. Un `@Version` JPA seul ne compare pas la version du formulaire. |
| Échec Supabase | Aucun appel distant dans la transaction métier de qualification/création. Pas de transaction distribuée ; acquittement après commit uniquement. |
| Lot partiellement invalide | Décodage et validation par ligne ; bilan `fetched/imported/alreadyImported/failed/acknowledgmentFailed`, identifiant externe et code d'erreur. |
| Échec de PATCH | Vérifier la représentation/les lignes affectées, distinguer déjà acquitté et ligne absente ; ne pas assimiler HTTP 2xx à une modification effective. |
| Reprise des échecs | Procédure privilégiée explicite pour remettre `failed` à `pending`, puis réimport manuel ; pas de boucle automatique sur erreur de validation. |

Importer par lots bornés et ordonnés `(created_at,id)`, sans pagination par offset
sur un ensemble dont les acquittements retirent des lignes. Préférer un curseur
stable ou un lot unique borné par action, sans bloquer les anciennes lignes sur
un lot en échec. Timeouts et erreurs réseau doivent laisser le besoin récupérable.

Sécurité constatée : RLS et RPC `SECURITY DEFINER`, `search_path` vide,
`EXECUTE` public contrôlé, registre privé révoqué. La migration des demandes ne
déclare pas de grant backend SELECT/UPDATE aussi explicitement que celle de
suivi des commandes : ajouter des privilèges explicites et tester les privilèges
effectifs, qui peuvent aussi dépendre des droits par défaut de l'environnement.
Ne jamais ajouter une policy de lecture publique des demandes.

Admin et API n'ont actuellement pas d'authentification/autorisation configurée
(README et absence de configuration Spring Security dans le code examiné).
Avant exposition de données personnelles, valider la protection opérationnelle
de l'accès interne ou une slice d'authentification dédiée. Ne pas prétendre qu'un
nouveau bouton ou CORS protège l'endpoint. Les rôles métier éventuels restent à
définir ; ne pas inventer d'identité opérateur dans l'audit tant qu'elle n'existe pas.

La clé service-role reste uniquement en backend. Aucun appel Supabase depuis
Admin, aucun accès au schéma d'un autre service, aucun besoin RabbitMQ/Executor.
Échapper l'affichage des notes, éviter les logs de payload/contact/allergies et
les messages PostgREST bruts dans `sync_error` ; utiliser codes stables et
diagnostics internes corrélés par UUID. Séparer notes internes et notes destinées
au PDF, limiter la conservation des données personnelles et coordonner la purge
avec le registre de reçus. Les données originales complètes restent consultables
par le seul parcours interne autorisé.

Pour les nouveaux endpoints : Problem Details en français, 400 validation,
404 UUID inconnu, 409 transition/version/idempotence contradictoire, 503 inbox
désactivée ou indisponible avant traitement ; bilan explicite pour un lot partiel.
Ne pas modifier les codes actuels des endpoints Order/Quotation à cette occasion.

## 7. Réutilisation Admin

Chemins relatifs à `savis-admin/src/` :

| Élément existant | Usage proposé |
| --- | --- |
| `features/sales/pages/SalesLayout.tsx` | Ajouter « Demandes » et `/sales/quote-requests` ; adapter la grille actuellement à trois colonnes. Garder le défaut `/sales/orders`. |
| `features/quotations/pages/QuotationDetailsPage.tsx` | Conserver l'édition, PDF, transitions et conversion ; ajouter la provenance et un retour vers la demande. |
| `features/quotations/hooks/useQuotationEditor.ts`, `model/quotationDraft.ts` | Base des termes commerciaux ; initialiser un brouillon issu de qualification sans écraser le brouillon autonome. |
| `features/orders/components/OrderEditorForm.tsx` | Déjà utilisé par Quotation, prop `documentContext="soumission"`, contact, ajustements et configurations ; ne pas le réutiliser pour tarifer une demande non qualifiée. |
| `features/orders/components/CatalogProductDropdown.tsx`, `features/catalog/hooks/useCatalogApi.ts` | Recherche et chargement des produits retenus, remplacement explicite d'un produit retiré. |
| `features/orders/components/OrderItemsDetails.tsx` | Détail tarifé du devis existant ; créer un détail propre aux lignes demandées sans prix. |
| `shared/components/{DataTable,ListFilters,ListFilterPopover,DetailSheet,ApiErrorAlert,NoData,PageNavigator}.tsx` | Liste, filtres, détail et erreurs ; URL pour page/recherche/statut/services/tri/sélection. |
| `features/quotations/hooks/useQuotationApi.ts`, `shared/api`, `shared/lib/openPdfInNewTab.ts` | Conventions Axios, Query et PDF. Nouvelle clé `['quote-requests', ...params]` ; invalider demandes et devis après création liée. |

Créer `features/quote-requests` avec sections nommées (client, événement,
services, lignes, qualification) ; éviter d'agrandir la page de devis en écran
universel. Les dépendances frontend vers Orders existent déjà ; aucune extraction
générique vers `shared` n'est indispensable pour cette phase.
Le brouillon actuel des nouveaux devis est stocké en `sessionStorage` sous une
clé unique : ne pas y déposer automatiquement les demandes/allergies importées.
Préférer une qualification persistée côté API et un état d'édition local borné.

## 8. Tests existants et incohérences documentaires

| Couverture inspectée | Limite / ajout nécessaire |
| --- | --- |
| `QuotationTest` : transitions, dates, montants et overflow | Pas de couverture exhaustive de toutes transitions, ni politique d'expiration à supposer. |
| `QuotationServiceTest` : snapshots, édition réservée au brouillon, conversion répétée | Rejeu simulé avec Mockito ; pas une preuve de concurrence ni de rollback intermodule réel. |
| `QuotationRepositoryAdapterTest` : persistance des snapshots | H2 `create-drop`, Flyway désactivé ; ne vérifie pas V8 ni les verrous PostgreSQL en concurrence. |
| `QuotationOrderServiceTest` : copie sans recalcul | Ajouter scénario déjà existant et concurrence via le parcours réel de conversion. |
| `ImportOrdersUseCaseTest` : nouveau, doublon, erreur de mapping | Ajouter perte d'acquittement, collision d'unicité, erreur d'acquittement d'échec et panne avant lecture. |
| `SupabaseOrderInboxAdapterTest` : contrat HTTP et credentials serveur | Ne prouve pas un PATCH affectant zéro ligne, pagination, données invalides dans un lot ou droits RLS réels. |
| `CatalogOrderingServiceTest` et tests prix/publication | À compléter avec mapping de demande et catalogue modifié depuis la réception. |
| Admin : `quotations/api/quotationApi.test.ts`, `quotations/model/quotationDraft.test.ts`, tests SalesLayout et AppRouter | Pas de test dédié trouvé pour pages/hooks du parcours Quotation ; ajouter qualification → devis et transitions observables. |
| Supabase : `submit_quote_request_test.sql` (22 assertions), script concurrence | RPC mixte/générique, privilèges anon, rejouabilité, conflit, validation, rollback ; compléter authenticated, droits backend, type absent et rejeu après changement catalogue. |

La CI `.github/workflows/ci.yml` lance Maven, Vitest et le lint Supabase, mais
**ne lance pas ces tests SQL ni le script de concurrence**. Ajouter une exécution
sur base jetable ; le script concurrence insère des fixtures persistantes.

Documentation : la limite « demandes Supabase non gérées par SAVIS » dans
`docs/ARCHITECTURE.md` et le contrat RPC est exacte. En revanche, le README racine
présente surtout Catalog/Order et omet Quotation/Invoice ; les listes d'endpoints,
modules et tests du README API et du README Admin sont incomplètes concernant
les devis/factures présents dans le code. Le README Admin décrit encore le BOM
comme dialogue toujours ouvert dans sa section Routing, alors que d'autres
sections décrivent l'éditeur pleine page : nettoyer cette dérive documentaire
dans une tâche distincte. Les documents doivent présenter « envoi » comme
marquage manuel, sans laisser entendre qu'un courriel a été transmis.

## 9. Plan incrémental en vertical slices

Tous les noms nouveaux ci-dessous sont proposés. Chaque slice livre un parcours
utilisable avec tests, contrat HTTP et documentation à jour. Racines Java :
`savis-api/src/main/java/com/savouretplus/savis/quotation/` ; tests Java sous
`src/test/java/.../quotation/`. Ne pas modifier Order/Invoice sauf ajout de tests
de non-régression motivés.

### Slice 1 — récupérer et consulter les demandes

Créer :

- `domain/{QuoteRequest,QuoteRequestStatus,QuoteRequestItem,QuoteRequestEvent}.java` ;
  `port/{QuoteRequestInbox,QuoteRequestRepository,PendingQuoteRequest}.java`.
- `adapter/supabase/{SupabaseQuoteRequestInboxAdapter,SupabaseQuoteRequestResponse,`
  `SupabaseQuoteRequestMapper,NoOpQuoteRequestInbox}.java`.
- `usecase/{ImportQuoteRequestsUseCase,QuoteRequestImportService,QuoteRequestQueryService}.java` ;
  service d'import transactionnel par ligne appelé via un bean distinct.
- `adapter/persistence/{QuoteRequestEntity,QuoteRequestJpaRepository,QuoteRequestRepositoryAdapter}.java` ;
  `adapter/web/{QuoteRequestController,QuoteRequestResponse,ImportQuoteRequestsResponse,QuoteRequestExceptionHandler}.java`.
- Flyway `V14__create_quote_request_schema.sql` si disponible ; migration
  Supabase horodatée `*_add_quote_request_sync_tracking.sql`.
- Admin `features/quote-requests/{types.ts,api/quoteRequestApi.ts,hooks/useQuoteRequestApi.ts,`
  `hooks/useQuoteRequestList.ts,pages/QuoteRequestsPage.tsx,pages/QuoteRequestDetailsPage.tsx,`
  `components/QuoteRequestsTable.tsx,components/QuoteRequestEventDetails.tsx,components/QuoteRequestItemsDetails.tsx}`.

Modifier `features/sales/pages/SalesLayout.tsx` et `app/router/AppRouter.tsx`.
Tests miroirs : import, mapper historique/récent, persistence/unicité, WireMock,
contrôleur, liste/détail Admin et navigation. Étendre les tests de privilèges SQL.

Acceptation : demande mixte ou sans articles visible sans tarification ; payload,
notes et UUID préservés ; deux imports ne créent qu'une demande ; panne après
commit rattrapable ; une ligne malformée n'empêche pas les suivantes ; bilan
partiel visible ; accès public Supabase refusé ; inbox désactivée expliquée.

### Slice 2 — qualifier un besoin réel

Créer `usecase/{QualifyQuoteRequestCommand,QuoteRequestQualificationService}.java`,
DTOs `adapter/web/{SaveQuoteRequestQualificationRequest,UpdateQuoteRequestStatusRequest}.java` ;
Admin `hooks/useQuoteRequestQualification.ts`,
`components/{QuoteRequestQualificationForm,QuoteRequestCustomerSection,QuoteRequestServicesSection}.tsx`.
Modifier agrégat, persistence, contrôleur et détail ; ajouter une migration
forward-only pour les champs non livrés en slice 1.

Acceptation : transitions contrôlées côté API ; générique et produit retiré
qualifiables ; client/événement/notes conservés séparément ; besoins écartés
motivés ; formulaire périmé refusé sans perte de la saisie ; rechargement retrouve
la qualification ; aucun devis/commande créé par la simple qualification.

### Slice 3 — créer exactement un devis lié

Créer `usecase/{CreateQuotationFromQuoteRequestUseCase,CreateQuotationFromQuoteRequestCommand}.java`
et DTO HTTP associé ; ajouter lien source facultatif et empreinte initiale via
une nouvelle migration. Modifier `Quotation`, `QuotationEntity`, son adapter,
`QuotationRepository`, `QuotationJpaRepository`, `QuotationResponse` et le service
de création pour transporter/préserver cette provenance, y compris lors de
`update` qui reconstruit actuellement un nouveau record. L'orchestration reste
dans Quotation ; aucun accès aux tables Catalog/Order.

Admin : nouvelle section `components/QuoteRequestQuotationSection.tsx`, hook
de création liée, adaptation explicite de `useQuotationEditor.ts` si nécessaire,
types et détail Quotation pour afficher l'origine. Réutiliser le formulaire
commercial actuel sans écraser le brouillon autonome.

Acceptation : un clic produit un brouillon tarifé par Catalog ; deux clics/rejeu
réseau/concurrence produisent le même UUID ; commande de création contradictoire
→ 409 ; prix publics ignorés ; options invalides à corriger ; erreur Catalog
annule création et transition ; aucune ligne/service perdu silencieusement ;
devis autonome et modifications de brouillon conservent leur comportement.

### Slice 4 — parcourir le cycle commercial existant

Modifier le détail demande pour afficher le devis, son état et le lien commande ;
compléter les tests de `QuotationDetailsPage`, `useQuotationApi` et du retour à
la demande. Étendre `QuotationServiceTest`, `QuotationOrderServiceTest` et ajouter
un test d'intégration PostgreSQL demande → devis → commande, incluant accès
concurrents et rollback. Conserver contrôleur et règles de conversion actuels.

Acceptation : PDF puis marquage envoyé, acceptation/refus et conversion
fonctionnent ; même commande sur rejeu ; prix capturés inchangés malgré une
modification Catalog ; refus et conversion prématurée bloqués ; facturation de
la commande reste disponible ; aucun automatisme d'envoi ni acceptation publique.

### Slice 5 — reprises opérationnelles et validation de déploiement

Documenter et tester réinitialisation privilégiée des lignes `failed`, échecs
d'acquittement, pagination, diagnostics et déploiement Supabase avant API.
Ajouter les tests SQL à `.github/workflows/ci.yml`. Mettre à jour
`supabase/README.md`, `savis-api/README.md`, `savis-admin/README.md`,
`docs/ARCHITECTURE.md`, le contrat RPC et le README racine.
Si une migration Supabase manque, le nouveau parcours doit signaler son
indisponibilité sans perturber Catalog, devis ou commandes.

Acceptation : crash après commit, timeout distant, import concurrent et reprise
après correction couverts sur PostgreSQL ; aucun secret dans le bundle ou les
logs ; volume supérieur à un lot récupéré intégralement ; documentation de
reprise exécutable et statuts techniques distincts des statuts commerciaux.

Validation de chaque application touchée : tests ciblés pendant la slice puis
`./mvnw test`, `npm run lint`, `npm test -- --run`, `npm run build` ;
Supabase local : migrations complètes, `supabase db lint --local --level warning`,
tests SQL et concurrence sur base jetable. H2 ne remplace pas les tests de
contraintes/verrous/migrations PostgreSQL. Pas de smoke Executor nécessaire.

## 10. Décisions à valider avant développement

1. Propriété de `QuoteRequest` dans Quotation, deux agrégats distincts.
2. Cardinalité 0..1 devis par demande pour commencer, ou besoin immédiat de révisions.
3. Import manuel et acquittement technique séparé du traitement commercial.
4. Statuts et motifs de qualification/clôture, critères de passage à `QUALIFIED`.
5. Traitement des services non catalogués : blocage explicite et passage par
   Catalog recommandé ; pas de lignes libres/prix manuels dans cette phase.
6. Conservation et visibilité des informations événementielles/allergies ;
   transfert éventuel vers le document client et la préparation de commande à
   définir. Le lien de provenance les conserve, mais n'en fait pas un snapshot
   opérationnel de commande : si nécessaire, prévoir un contrat additif dédié.
7. Envoi/acceptation manuels conservés ; email, preuve d'acceptation et expiration
   automatique hors périmètre, sauf demande métier explicite.
8. Protection de l'accès interne, identité opérateur et politique de conservation.
9. Politique de reprise des erreurs et correction séparée des limites de la RPC
   publique (type absent et rejeu après évolution catalogue).

Ces décisions conditionnent le schéma et les critères métier ; elles ne demandent
aucune modification préalable des commandes ou des devis autonomes.

## 11. Vérifications exécutées pour cet audit

- Admin : `npm test -- --run test/features/quotations test/features/orders/hooks/useOrderManagement.test.tsx`
  sous Node 24 : **3 fichiers, 6 tests réussis**.
- API : `./mvnw -Dtest=QuotationTest,QuotationServiceTest,QuotationRepositoryAdapterTest,QuotationOrderServiceTest,ImportOrdersUseCaseTest,SupabaseOrderInboxAdapterTest,CatalogOrderingServiceTest,SavisApiModularityTests test` :
  **19 tests réussis**, dont vérification des frontières Spring Modulith ;
  aucune erreur, aucun test ignoré dans cette sélection.
- Tests SQL, concurrence Supabase, lint/build complets et suites complètes :
  non exécutés pour cet audit documentaire. Aucune migration appliquée.
