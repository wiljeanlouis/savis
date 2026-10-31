# Réception des demandes de soumission événementielles mixtes

## Portée

`public.submit_quote_request(payload jsonb) returns uuid` est la frontière
publique de réception de SavouretPlus. Elle reçoit une **demande** et non une
soumission commerciale acceptée. Elle ne calcule aucun prix, ne crée aucune
soumission métier SAVIS et ne déclenche aucun workflow Admin.

Une seule demande peut contenir des offres publiées de catégories `tasting`
et `decoration`. Le parcours `traiteur-decoration` demande exactement les
services `traiteur` et `decoration`; `organisation` n'est pas ajouté.

## Contrat

Le frontend appelle :

```text
supabase.rpc("submit_quote_request", { payload })
```

Payload minimal :

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "QUOTE_REQUEST",
  "customer": {
    "name": "Marie Tremblay",
    "phone": "+15145551234",
    "email": "marie@example.com"
  },
  "requested_services": ["traiteur", "decoration"],
  "event_details": {
    "request_type": "traiteur-decoration",
    "event_type": "Mariage",
    "event_date": "2027-06-12",
    "event_time": "18:30",
    "event_address": "Montréal",
    "guest_count": 80,
    "budget": "À discuter",
    "allergies": "Noix",
    "note": null
  },
  "items": [
    {
      "offering_id": "UUID publié réel",
      "name": "Nom publié",
      "requested_quantity": 1,
      "configuration": {
        "catalog_slug": "slug-publie",
        "category": "decoration",
        "subcategory": "decorative-arch"
      },
      "note": "Fleurs blanches"
    }
  ]
}
```

Les types de demande acceptés sont `traiteur`, `decoration`, `organisation`,
`decoration-organisation`, `traiteur-decoration` et
`traiteur-decoration-organisation`. Le tableau `requested_services` doit
correspondre exactement au type.

Chaque ligne conserve la quantité, la note et le snapshot de configuration.
Pour une ligne issue de la sélection, le snapshot peut contenir
`product_type`, `purchase_mode`, `selection`, `allocation` et `ingredients`.
Les identifiants, slug, nom, catégorie et options sont vérifiés contre
`published_catalog_products` et l'offre doit être disponible. Une demande sans
ligne reste autorisée pour les formulaires événementiels génériques.

La réponse de succès est l'UUID de `quote_requests.id`. Les données complètes
sont conservées telles quelles dans `quote_requests.payload`, avec
`status = 'new'` et `source = 'savouretplus'`.

## Idempotence et reprises

`request_id` est un UUID généré une seule fois par tentative logique. Le
frontend conserve uniquement cet UUID et l'empreinte du payload localement;
les données personnelles restent dans le panier/formulaire existant. Il efface
la référence après une réponse de succès confirmée.

- Même `request_id` et même payload : même UUID de réception.
- Même `request_id` et payload différent : `QUOTE_IDEMPOTENCY_CONFLICT`.
- Appels concurrents identiques : une seule ligne `quote_requests`.
- Erreur réseau ou HTTP 5xx : jusqu'à trois tentatives avec le même payload et
  le même `request_id`.
- Erreur de validation, conflit ou erreur 4xx : ne pas réessayer
  automatiquement; conserver la sélection et afficher une erreur.

Le registre `private.quote_request_receipts` n'est accessible à aucun rôle
public. Sa clé est `(scope, request_id)` et son empreinte SHA-256 porte sur la
représentation canonique JSONB. Conserver un reçu au moins aussi longtemps que
la demande liée. Une éventuelle purge future doit supprimer la demande et son
reçu dans une procédure administrative coordonnée; aucune purge automatique
n'est incluse dans cette phase.

## Erreurs publiques

Les validations utilisent SQLSTATE `22023` avec l'un des messages suivants :

- `QUOTE_INVALID_PAYLOAD`
- `QUOTE_INVALID_REQUEST_ID`
- `QUOTE_INVALID_CUSTOMER`
- `QUOTE_INVALID_EVENT`
- `QUOTE_INVALID_ITEM`
- `QUOTE_INVALID_CONFIGURATION`
- `QUOTE_INCOHERENT_SERVICES`
- `QUOTE_UNKNOWN_OFFERING`
- `QUOTE_LIMIT_EXCEEDED`

Le conflit d'idempotence utilise SQLSTATE `23505` et
`QUOTE_IDEMPOTENCY_CONFLICT`. Les autres erreurs doivent être présentées comme
des erreurs techniques sans exposer le détail PostgreSQL.

## Sécurité

La fonction est `SECURITY DEFINER` avec un `search_path` vide et tous ses
objets sont qualifiés. Seuls `anon` et `authenticated` ont `EXECUTE`. Ils ne
peuvent ni lire ni insérer directement dans `quote_requests`, et n'ont aucun
accès au registre privé. Les données personnelles ne doivent pas être loguées
par le frontend.

## Limite SAVIS actuelle

Le dépôt ne contient aucun DTO, mapper ou workflow d'importation de
`quote_requests`. Le module `quotation` de SAVIS représente une soumission
commerciale interne et tarifée; le relier directement à cette boîte de
réception modifierait la logique métier et sort de cette phase. La réception
Supabase est donc sécurisée, mais la reprise manuelle ou l'import métier des
demandes reste à concevoir.

## Déploiement coordonné

1. Exécuter les tests frontend et les tests SQL sur une base locale jetable.
2. Déployer le frontend qui génère `request_id`; l'ancienne RPC tolère ce champ.
3. Sans délai, appliquer les migrations SAVIS en ordre jusqu'à
   `20261023120000_secure_mixed_quote_requests.sql` inclus. Cela applique
   notamment le renommage antérieur `decorative-arch` avant la validation des
   snapshots de catalogue.
4. Vérifier les privilèges puis effectuer le smoke test ci-dessous.
5. Surveiller les erreurs RPC et confirmer qu'une seule demande est créée.

Pour éliminer entièrement la courte fenêtre où le nouveau frontend peut parler
à l'ancienne RPC moins stricte, suspendre temporairement l'envoi des demandes
pendant les étapes 2 et 3. La migration n'est pas appliquée par ce livrable.

## Smoke test

1. Ajouter au panier une arche décorative et au moins un produit Dégustation.
2. Ouvrir la soumission depuis la sélection et vérifier le type
   `Traiteur + décoration`, sans Organisation.
3. Remplir les coordonnées et l'événement puis envoyer une fois.
4. Vérifier que l'interface confirme la réception et vide la sélection.
5. Vérifier dans un accès privilégié Supabase une seule ligne
   `quote_requests`, avec les deux catégories et leurs configurations.
6. Rejouer le même payload et confirmer que le même UUID est retourné sans
   nouvelle ligne.
7. Couper le réseau lors d'un nouvel envoi et confirmer que la sélection reste
   disponible pour réessai.

Tests PostgreSQL : `supabase/tests/submit_quote_request_test.sql` et
`supabase/tests/submit_quote_request_concurrency.sh`. Le second exige
`DATABASE_URL` vers une base jetable déjà migrée.
