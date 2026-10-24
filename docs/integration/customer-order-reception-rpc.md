# Réception sécurisée des demandes de commande

## Statut et frontière métier

`receive_customer_order(payload jsonb)` reçoit une **demande de commande**. Son
succès ne signifie ni acceptation, ni vente, ni validation d'un prix. PostgreSQL
valide uniquement la forme technique et conserve les estimations envoyées.
L'import manuel existant de SAVIS API demeure responsable de la normalisation;
SAVIS Admin demeure responsable de l'acceptation ou du rejet.

Cette phase ne modifie ni le DTO, ni le mapper, ni le workflow d'import SAVIS.

## Audit du dépôt

La structure reconstruite exclusivement depuis les migrations est la suivante :

| Colonne `public.customer_orders` | Type / règle utile |
| --- | --- |
| `id` | `uuid`, PK, généré côté serveur |
| `customer_name` | `text not null` |
| `customer_phone` | `text not null` |
| `customer_email` | `text`, nullable |
| `customer_address` | `jsonb`, objet ou null |
| `note` | `text`, nullable |
| `status` | `text not null`, défaut `new` |
| `source` | `text not null`, défaut `savouretplus` |
| `discount_cents` | entier positif ou nul, défaut `0` |
| `delivery_fee_cents` | entier positif ou nul, défaut `0` |
| `total_cents` | entier positif ou nul |
| `items` | `jsonb not null`, tableau |
| `created_at` | `timestamptz`, généré côté serveur |
| `sync_status` | `pending`, `synced` ou `failed` |
| `synced_at`, `sync_error`, `notified_at` | suivi interne nullable |

Avant la nouvelle migration, RLS est activé mais une politique autorise les
insertions `anon` et `authenticated` lorsque `source`, `status`, le nom et le
téléphone satisfont un contrôle minimal. Les mêmes rôles ont un privilège
`INSERT` par colonne, y compris sur les ajustements. `service_role` possède les
droits de lecture et mise à jour requis par l'importateur. La migration
`20261022000000_receive_customer_orders_rpc.sql` :

- crée une table d'idempotence dans le schéma non exposé `private`;
- crée une RPC `SECURITY DEFINER` avec `search_path = ''`;
- accorde seulement `EXECUTE` à `anon` et `authenticated`;
- révoque leur droit `INSERT` sur `customer_orders`;
- supprime la politique RLS d'insertion publique;
- ne change pas les privilèges de `service_role` utilisés par SAVIS API.

La seule autre RPC du dépôt est `submit_quote_request(jsonb)`. Elle est aussi
`SECURITY DEFINER` avec un `search_path` vide, mais son contrat et sa table sont
indépendants de la réception de commandes.

### Compatibilité importateur

`SupabaseCustomerOrderResponse` lit toutes les colonnes ci-dessus. Le mapper
attend, dans chaque entrée de `items`, les clés suivantes :

- obligatoires : `product_id`, `name`, `product_type`, `quantity`,
  `unit_price_cents`;
- facultatives : `key`, `image_url`, `base_price_cents`, `purchase_mode`,
  `selection`, `allocation`, `ingredients`;
- dans les configurations : les noms, identifiants, quantités,
  `allocation_type`, `default_quantity` et `extra_price_cents` documentés plus
  bas.

La nouvelle clé `category` est conservée dans le snapshot JSON et ignorée par
le mapper actuel. Elle n'impose donc aucun changement au DTO SAVIS. Le mapper
vérifie déjà que `source = savouretplus`, `status = new`, que la commande a au
moins un item et que `total_cents` égale la somme `quantity * unit_price_cents`
des lignes. La RPC respecte exactement ces invariants et force les ajustements
à zéro.

Le snapshot d'audit SAVIS reste construit à partir de la ligne Supabase
complète; `items` est conservé sans transformation et les colonnes internes
continuent d'être présentes. Les estimations ne sont jamais relues dans le
catalogue ni remplacées par PostgreSQL.

## Contrat RPC v1

### Appel

- Nom : `public.receive_customer_order`
- Signature PostgreSQL : `receive_customer_order(payload jsonb) returns uuid`
- Supabase JS : `supabase.rpc('receive_customer_order', { payload })`
- Authentification : clé publique avec rôle `anon`, ou session
  `authenticated`; jamais la clé `service_role` dans le frontend.

Exemple minimal :

```json
{
  "request_id": "018f6f4e-8dd2-7c19-bf4b-4bb0a28b2e78",
  "customer_name": "Ada Lovelace",
  "customer_phone": "514-555-0100",
  "customer_email": "ada@example.com",
  "customer_address": {
    "line1": "1 rue Exemple",
    "line2": null,
    "city": "Montréal",
    "province": "QC",
    "postal_code": "H0H 0H0"
  },
  "note": "Sonnez à la porte",
  "total_cents": 2850,
  "items": [
    {
      "key": "cookie:unit:none::sprinkles:2",
      "product_id": "20000000-0000-4000-8000-000000000002",
      "name": "Biscuit personnalisé",
      "category": "tasting",
      "product_type": "ingredient_customization",
      "image_url": "/cookie.jpg",
      "quantity": 3,
      "base_price_cents": 800,
      "unit_price_cents": 950,
      "purchase_mode": {
        "id": "unit",
        "label": "À l'unité",
        "quantity": 1,
        "allocation_type": "none"
      },
      "selection": null,
      "allocation": [],
      "ingredients": [
        {
          "id": "sprinkles",
          "name": "Confettis",
          "quantity": 2,
          "default_quantity": 1,
          "extra_price_cents": 150
        }
      ]
    }
  ]
}
```

Les noms de clés sont stricts. Les clés inconnues sont refusées, ce qui inclut
les champs internes falsifiés (`id`, `status`, `source`, `discount_cents`,
`delivery_fee_cents`, `created_at`, `sync_status`, `synced_at`, `sync_error`,
`notified_at`). Les champs internes sont toujours produits par le serveur.

### Règles de validation

- `request_id` et chaque `product_id` sont des UUID PostgreSQL valides.
- Le payload encodé ne dépasse pas 65 536 octets.
- `customer_name` : 1 à 200 caractères après trim.
- `customer_phone` : 1 à 50 caractères après trim.
- `customer_email` : null ou au plus 254 caractères.
- `note` : null ou au plus 2 000 caractères.
- Une adresse est null ou un objet limité à `line1`, `line2`, `city`,
  `province`, `postal_code`; chaque valeur non nulle fait au plus 200 caractères.
- `items` contient de 1 à 100 objets.
- `category` vaut `tasting` ou `decoration`.
- `product_type` vaut `standard`, `single_choice`, `single_choice_bundle` ou
  `ingredient_customization`.
- Une quantité d'item, de mode d'achat ou d'allocation est un entier de 1 à
  1 000. Une quantité d'ingrédient est un entier de 0 à 1 000.
- `allocation` et `ingredients` contiennent chacun au plus 100 objets.
- Les identifiants de configuration font au plus 100 caractères, les libellés
  au plus 200, `key` au plus 1 000 et `image_url` au plus 2 048.
- Les montants sont des entiers positifs ou nuls. Une estimation unitaire est
  limitée à 100 000 000 cents et le total à la capacité d'un entier signé
  32 bits.
- `allocation_type` vaut `none`, `single_choice` ou `choice_allocation`.
- `total_cents` doit égaler la somme technique des
  `quantity * unit_price_cents`. Ce contrôle protège la compatibilité de
  l'import; il ne certifie aucun prix.

### Réponse et persistance

Le résultat est l'UUID de `customer_orders.id`. Avec `supabase-js`, `data` est
donc une chaîne UUID. La ligne est persistée avec :

- les coordonnées, la note, `total_cents` et `items` reçus;
- `status = new`, `source = savouretplus`, `sync_status = pending`;
- `discount_cents = 0`, `delivery_fee_cents = 0`;
- les dates et l'identifiant générés par PostgreSQL;
- les champs de synchronisation et notification à null.

Les prix `base_price_cents`, `unit_price_cents`, `extra_price_cents` et
`total_cents` restent des estimations non validées jusqu'au traitement métier.

### Idempotence et retry

Le frontend génère un UUID une seule fois au début d'une tentative logique et
le conserve jusqu'à obtention d'une réponse définitive. Un UUID v4 ou v7 est
adapté; il doit être envoyé sous forme canonique avec tirets.

La table privée impose l'unicité `(scope, request_id)`, conserve une empreinte
SHA-256 du `jsonb` canonique et référence la commande créée. L'insertion
`ON CONFLICT`, le verrou `FOR UPDATE`, la création de commande et la mise à jour
du registre partagent une transaction : deux appels concurrents identiques ne
créent qu'une ligne et reçoivent le même UUID.

- Après une coupure réseau, un timeout ou une réponse 5xx : renvoyer le **même
  payload** avec le **même `request_id`**, avec backoff exponentiel borné.
- `ORDER_IDEMPOTENCY_CONFLICT` : ne pas retenter automatiquement; journaliser
  et démarrer une nouvelle demande seulement après décision explicite.
- Erreur `ORDER_INVALID_*`, `ORDER_LIMIT_EXCEEDED` ou
  `ORDER_ESTIMATE_MISMATCH` : corriger le payload; aucune ligne n'a été créée.
- Ne jamais générer un nouvel identifiant uniquement parce que la réponse du
  premier appel a été perdue.

Les erreurs publiques contrôlées sont :

| Message | SQLSTATE | Sens |
| --- | --- | --- |
| `ORDER_INVALID_PAYLOAD` | `22023` | forme, champ ou longueur invalide |
| `ORDER_INVALID_REQUEST_ID` | `22023` | `request_id` invalide |
| `ORDER_INVALID_PRODUCT_ID` | `22023` | UUID produit invalide |
| `ORDER_INVALID_CATEGORY_OR_TYPE` | `22023` | catégorie/type inconnu |
| `ORDER_INVALID_CONFIGURATION` | `22023` | configuration mal formée |
| `ORDER_LIMIT_EXCEEDED` | `22023` | quantité, nombre ou montant hors limite |
| `ORDER_ESTIMATE_MISMATCH` | `22023` | somme des lignes incohérente |
| `ORDER_IDEMPOTENCY_CONFLICT` | `23505` | identifiant déjà associé à un autre contenu |

Le client doit piloter son comportement avec le code PostgreSQL et le message
retournés par PostgREST, sans afficher `detail` directement au client final.

### Conservation

Le registre d'idempotence contient une empreinte, les identifiants et les dates,
mais pas une seconde copie du payload personnel. Une entrée doit être conservée
au moins aussi longtemps que sa `customer_orders` liée. Elle ne doit jamais être
purgée indépendamment : archiver ou supprimer les deux selon la politique de
conservation SAVIS. La FK `ON DELETE RESTRICT` protège cette règle.

## Tests PostgreSQL

`supabase/tests/receive_customer_order_test.sql` est une suite pgTAP réelle qui
couvre validation, champs obligatoires, UUID, limites, catégories,
configurations, champs internes, estimations, rejeu, conflit, rollback,
permissions anonymes et forme consommée par le mapper SAVIS. Toute la suite est
encapsulée dans une transaction annulée.

`supabase/tests/receive_customer_order_concurrency.sh` lance deux connexions
`psql` en parallèle et vérifie qu'elles retournent la même référence et ne
créent qu'une commande. Il est réservé à une base jetable migrée et exige
`DATABASE_URL`.

Commandes à exécuter seulement après autorisation :

```bash
supabase db reset
supabase test db
DATABASE_URL='postgresql://...' supabase/tests/receive_customer_order_concurrency.sh
```

## Déploiement coordonné avec savouretplus.com

Le projet n'étant pas encore en production, il n'y a pas de période legacy ni
de double écriture.

1. Sur une base locale/éphémère, reconstruire le schéma, lancer pgTAP puis le
   test de concurrence. Ne jamais pointer le script de concurrence vers une
   base contenant des données à conserver.
2. Adapter savouretplus.com pour générer et mémoriser `request_id`, construire
   exactement le payload v1, appeler la RPC et appliquer les règles de retry.
3. Vérifier en environnement intégré qu'une soumission crée une ligne
   `pending`, déclenche les mécanismes de notification attendus et s'importe
   sans modification dans SAVIS API.
4. Dans une même fenêtre de livraison, appliquer la migration Supabase puis
   déployer immédiatement le frontend RPC. L'ancien `insert(customer_orders)`
   échouera dès la migration.
5. Effectuer un smoke test : soumission, rejeu avec la même référence, import
   manuel SAVIS, puis vérification de l'accusé `synced`.
6. Contrôler que `anon`/`authenticated` n'ont plus `INSERT`, n'ont aucun accès
   au schéma `private`, mais ont `EXECUTE` sur la RPC.

La migration et le déploiement ne sont pas exécutés dans cette phase.

## Vérifications de dérive avant application

Le dépôt ne donne pas accès au schéma Supabase distant. Il faut donc comparer
les résultats ci-dessous à cette reconstruction avant toute application :

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'customer_orders'
order by ordinal_position;

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'customer_orders';

select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'customer_orders'
order by grantee, privilege_type, column_name;

select routine_schema, routine_name, routine_type, security_type
from information_schema.routines
where routine_schema in ('public', 'private')
order by routine_schema, routine_name;
```

Le seed du dépôt utilise maintenant des UUID stables, la catégorie `tasting` et
le type commercial `goods`, conformément à la projection SAVIS. Si une base a
déjà reçu une ancienne version du seed, vérifier qu'elle ne contient plus les
anciennes lignes `pate-four` et `pate-kode` : le changement d'identifiant ne les
met pas à jour automatiquement. La migration de réception ne supprime aucune
donnée existante.

