# Politique monétaire SAVIS V1

## Principes

- `Money` associe toujours un `BigDecimal` non nul à un code ISO 4217 valide. Il normalise le code en majuscules, mais n'effectue jamais de conversion de devise.
- Les calculs `Money` entre devises différentes sont refusés.
- Supply, BOM et Catalog conservent des montants en dollars avec `BigDecimal`. Les coûts dérivés gardent leur précision intermédiaire.
- Quotation, Order et Invoice conservent leurs montants commerciaux en cents `int`, persistés en `INTEGER`.
- Les transactions commerciales SAVIS sont en CAD. Catalog vérifie CAD à la frontière qui crée un snapshot commercial ou une projection Supabase.
- Les documents successifs copient leurs snapshots; ils ne recalculent pas les prix depuis le catalogue.

## Représentation par module

| Module | Montants | Persistance | Règle |
| --- | --- | --- | --- |
| Supply | `Money(BigDecimal, devise)` en dollars | prix fournisseur `NUMERIC(38,2)` | Le prix facturé doit être exactement représentable au cent. |
| BOM | `Money(BigDecimal, devise)` en dollars | taux horaire `NUMERIC(38,2)` | Le taux doit être positif ou nul et exactement représentable au cent; les coûts dérivés ne sont pas ramenés au cent. |
| Catalog | `Money(BigDecimal, devise)` en dollars | modes et suppléments `NUMERIC(14,2)` | Les prix saisis doivent être exactement représentables au cent. Les coûts calculés conservent une précision supérieure. |
| Quotation | `int` en cents CAD | `INTEGER` | Lignes, rabais, livraison et total sont validés par arithmétique exacte. |
| Order | `int` en cents CAD | `INTEGER` | Même règle; le total est revalidé lors de toute construction, y compris depuis la persistance ou un import. |
| Invoice | `int` en cents CAD | `INTEGER` | Lignes, rabais, livraison, TPS, TVQ et total sont validés par arithmétique exacte. |

Les colonnes `NUMERIC(...,2)` représentent des unités monétaires majeures (dollars). Les colonnes suffixées `_cents` représentent exclusivement des cents.

## Frontières de précision et d'arrondi

### Prix fournisseur et coûts BOM

- Un prix fournisseur entrant dans Supply doit déjà être exact au cent. Supply refuse une fraction de cent au lieu de laisser la base l'arrondir.
- Le prix normalisé par unité de base est calculé avec une échelle technique de 10 et `HALF_UP`.
- Le ratio entre une quantité BOM et le paquet fournisseur est calculé avec une échelle technique de 10 et `HALF_UP`. Le montant obtenu reste un coût intermédiaire `BigDecimal` et n'est pas ramené au cent.
- Les heures dérivées des minutes d'activité utilisent une échelle technique de 10 et `HALF_UP`; la multiplication par le taux horaire conserve le résultat décimal.

Les échelles de 10 ci-dessus sont des choix techniques de précision actuels, pas des unités monétaires ni des règles de facturation.

### Coût BOM et analyse Catalog

- Le coût unitaire d'un BOM et celui d'un produit utilisent une division à l'échelle 10 avec `HALF_UP`.
- Le taux de marge affiché utilise une échelle 6 avec `HALF_UP`.
- Le prix recommandé divise à l'échelle 10 avec `UP`, puis est arrondi au prochain multiple de 0,25 CAD avec `CEILING`. Cette règle métier est conservée.
- Les prix des modes d'achat et les suppléments d'ingrédients persistés doivent être exactement représentables au cent; aucune correction silencieuse n'est appliquée.

### Catalog vers les cents commerciaux

Une seule conversion Catalog applique la règle suivante :

1. exiger une devise CAD;
2. refuser un montant négatif;
3. multiplier le montant en dollars par 100;
4. arrondir à l'entier avec `HALF_UP`;
5. convertir avec `intValueExact`, qui détecte tout dépassement.

Cette conversion est utilisée par les snapshots de commande/soumission et par la projection publiée vers Supabase. Elle ne constitue pas une conversion de devise.

### Totaux, rabais, frais et taxes

- Quotation et Order calculent `total = somme des lignes - rabais + livraison`.
- Invoice calcule `total = somme des lignes - rabais + livraison + TPS + TVQ`.
- Le rabais et les frais sont déjà des cents entiers; aucun arrondi n'est nécessaire. Le rabais ne peut pas dépasser le sous-total.
- Les lignes vérifient `lineTotalCents = unitPriceCents × quantity` avec `Math.multiplyExact`.
- Les sous-totaux et totaux utilisent `Math.addExact` et `Math.subtractExact`.
- SAVIS ne calcule actuellement aucun taux fiscal. Les montants TPS et TVQ d'une facture brouillon sont saisis en cents et validés, mais aucun moteur fiscal n'est défini.

### Snapshots commerciaux

- Quotation capture les prix et configurations retournés par Catalog.
- Quotation → Order recopie les lignes, rabais, frais et total acceptés sans consulter Catalog.
- Order → Invoice recopie les mêmes snapshots et initialise TPS et TVQ à zéro.
- Une modification ultérieure du catalogue ne modifie donc pas un document existant.

## `savis-executor`

L'exécuteur persiste actuellement les offres dans `NUMERIC(12,4)`. Lorsqu'une offre est reconstruite pour être transmise à Supply, le montant est quantifié explicitement à `0.01` avec `Decimal` et `ROUND_HALF_EVEN`, puis sérialisé avec deux décimales. Cela rend déterministe le comportement historique du formatage Python sans passer par `float`.

Le parseur Maxi utilise séparément `Decimal` et `ROUND_HALF_UP` pour produire un prix calculé au cent. Ces deux règles ont des contextes différents.

Décision métier encore ouverte : conserver l'arrondi `HALF_EVEN` des valeurs historiques à quatre décimales, adopter une autre règle, ou refuser ces valeurs avant transmission. V1 conserve le comportement existant en le rendant explicite.

## Frontend

Les aperçus React convertissent les dollars en cents avec `Math.round(amount * 100)`, soit la règle positive équivalente à `HALF_UP` utilisée par la frontière Catalog. Les conversions, additions et multiplications vérifient `Number.isSafeInteger`. Un aperçu invalide est signalé et n'est pas envoyé; le backend demeure autoritaire.

## Limites

- Le maximum d'un montant commercial est `Integer.MAX_VALUE`, soit 21 474 836,47 CAD pour une valeur non négative isolée. Les opérations peuvent atteindre cette limite avant la persistance et sont alors rejetées.
- Le contrôle `Number.isSafeInteger` du navigateur évite une perte de précision JavaScript, mais ne remplace pas la limite `int` plus stricte du contrat backend.
- Aucune conversion multidevise n'existe en V1.
- Aucun changement de schéma n'est requis par cette politique.
