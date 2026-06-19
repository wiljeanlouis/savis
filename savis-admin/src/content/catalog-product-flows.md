## Qu'est-ce que SAVIS ?

SAVIS Admin est l'outil métier de SAVOUR ET PLUS qui centralise les données de catalogue, les compositions de fabrication, les coûts, les prix et la publication vers la vitrine publique [savouretplus.com](https://savouretplus.com).

Le principe général est simple :

- le produit décrit ce qui sera vendu au client ;
- les BOM décrivent comment le produit est fabriqué et combien il coûte à fabriquer ;
- les Taux horaires définissent le taux horaire des activités des BOMs;
- la Catégorie d'un produit organise le catalogue ;
- le Prix de vente et la Marge cible servent à vérifier la rentabilité ;
- la Publication envoie les produits visibles vers la projection publique.

## Avant de créer un produit

Préparez ces éléments avant d'ouvrir le formulaire produit :

- Les taux horaires des activités. C'est la première étape, car les activités des BOMs utilisent ces taux pour calculer correctement le coût de fabrication.
- Les composants (offres fournisseurs) qui serviront à construire les BOMs. Ces offres sont nécessaires pour calculer le coût des BOMs. Ces composants peuvent être: farine, sucre ou beurre pour une recette de gâteau ; ballons, ruban ou structure pour une arche de ballons.
- Un ou plusieurs BOMs avec composants, activités et rendement. Un BOM peut représenter une recette, une composition, un assemblage ou toute structure nécessaire pour fabriquer le produit.
- Savoir dans quelle catégorie ranger le produit. Si elle n'existe pas encore, elle peut être créée depuis le formulaire produit.
- Une idée claire du prix de vente, de la marge cible et du format vendu.
- Les images publiques du produit : image principale obligatoire, galerie optionnelle.

Un produit peut être sauvegardé même si certains coûts sont incomplets, mais l'analyse affichera `INCOMPLETE` tant que tous les BOMs nécessaires ne peuvent pas être calculés.

## Flows de création produit

Cette section aide un admin métier à créer des produits catalogue dans SAVIS Admin. Il explique quoi mettre dans les champs, dans quel ordre travailler, et comment lire les analyses de prix.

### Flow 1 : produit Standard

Utilisez Standard pour un produit simple dont le client ne choisit pas de variante au moment de l'achat.

Exemple : un pâté simple vendu à l'unité.

#### Champs à remplir

| Champ dans l'interface | Quoi mettre                                                   |
| ---------------------- | ------------------------------------------------------------- |
| Code                   | Code interne stable, par exemple `pate-simple`.               |
| Slug                   | Identifiant URL public, par exemple `pate-simple`.            |
| Nom                    | Nom lisible par le client.                                    |
| Description            | Description courte du produit.                                |
| Type                   | Standard.                                                     |
| Catégorie              | Catégorie active du catalogue.                                |
| BOM communs            | BOMs communs du produit, avec quantité et ordre d'affichage.  |
| Prix de base           | Prix de vente de base en CAD.                                 |
| Marge cible (%)        | Marge cible affichée en pourcentage : `30` signifie 30 %.     |
| Unité                  | Libellé d'unité, par exemple `unité`, `boîte`, `portion`.     |
| Image principale       | URL de l'image principale.                                    |
| Disponible             | Produit achetable ou non.                                     |
| Publier                | Produit à envoyer au catalogue public lors de la publication. |

#### Règles à respecter

- Catégorie, Prix de base, Marge cible (%) et Image principale sont requis.
- Marge cible (%) doit être supérieure ou égale à 0 % et strictement inférieure à 100 %.
- BOM communs représente la composition commune du produit.
- Saveurs et choix et Ingrédients et extras ne sont pas utiles pour un produit Standard.

#### Exemple de configuration

Pour analyser un produit standard, aucune sélection client n'est nécessaire :

- Mode d'achat : aucun.
- Choix : aucun.
- Répartition : aucune.
- Ingrédients : aucun.

#### Erreurs fréquentes

- Mettre une marge comme `30` au lieu de `0.30`.
- Oublier le BOM principal : le produit sera vendable, mais l'analyse de coût risque d'être incomplète.
- Cocher Publier en pensant que la publication est immédiate : il faut ensuite lancer la publication catalogue.

### Flow 2 : produit Choix unique

Utilisez Choix unique quand le client choisit une seule option dans un groupe.

Exemple : un pâté avec choix de farce : poulet, bœuf, morue.

#### Champs à remplir

| Champ dans l'interface | Quoi mettre                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| Type                   | Choix unique.                                                          |
| BOM communs            | BOMs communs à toutes les options, par exemple la pâte ou l'emballage. |
| Saveurs et choix       | Section qui contient les options disponibles.                          |
| Libellé du groupe      | Nom du choix affiché, par exemple `Farce`.                             |
| Choix obligatoire      | Cocher si le client doit choisir une option.                           |
| Code                   | Code unique de l'option, par exemple `poulet`.                         |
| Nom                    | Nom affiché, par exemple `Poulet`.                                     |
| BOM                    | BOM qui représente le coût spécifique de cette option.                 |

#### Règles à respecter

- Un produit Choix unique doit avoir une section Saveurs et choix.
- Si Choix obligatoire est coché, l'analyse de prix doit fournir un choix.
- Le choix sélectionné doit correspondre à une option active.
- Les BOMs des options ajoutent le coût de la variante choisie au coût commun du produit.

#### Exemple de configuration

- Mode d'achat : aucun.
- Choix : poulet.
- Répartition : aucune.
- Ingrédients : aucun.

#### Erreurs fréquentes

- Créer le groupe de choix sans options actives.
- Mettre le BOM de l'option dans BOM communs au lieu de l'attacher à l'option.
- Réutiliser le même Code pour deux options.

### Flow 3 : produit Formats composables

Utilisez Formats composables pour un format vendu en lot, par exemple une boîte de 12, avec un choix unique ou une répartition entre plusieurs choix.

Exemple : une boîte de 12 pâtés où le client choisit 6 poulet et 6 bœuf.

#### Champs à remplir

| Champ dans l'interface | Quoi mettre                                                 |
| ---------------------- | ----------------------------------------------------------- |
| Type                   | Formats composables.                                        |
| Modes d'achat          | Formats vendus, par exemple unité, demi-douzaine, douzaine. |
| Code                   | Code unique du mode, par exemple `dozen`.                   |
| Libellé                | Libellé affiché, par exemple `Boîte de 12`.                 |
| Quantité               | Nombre d'unités dans ce format, par exemple `12`.           |
| Prix                   | Prix de vente du format.                                    |
| Répartition            | `Choix unique` ou `Composition`.                            |
| Saveurs et choix       | Groupe des options possibles pour le lot.                   |

#### Règles à respecter

- Un produit Formats composables doit avoir une section Saveurs et choix.
- Le Mode d'achat utilisé pour l'analyse doit correspondre à un mode actif.
- Avec Répartition = Choix unique, un seul choix est appliqué à toute la quantité du mode.
- Avec Répartition = Composition, la somme des quantités réparties doit être égale à la Quantité du mode d'achat.
- Les Codes des modes d'achat doivent être uniques.

#### Exemple de configuration

Pour une boîte de 12 répartie entre deux choix :

- Mode d'achat : Boîte de 12.
- Choix : aucun choix unique, car le client répartit le lot.
- Répartition : 6 poulet et 6 bœuf.
- Ingrédients : aucun.

#### Erreurs fréquentes

- Oublier de sélectionner le Mode d'achat lors de l'analyse.
- Avoir des allocations qui totalisent `10` pour une boîte de `12`.
- Utiliser Répartition = Composition alors que l'interface client ne permet pas encore de répartir les choix.
- Confondre le prix du mode d'achat avec le coût calculé depuis les BOMs.

### Flow 4 : produit Ingrédients personnalisables

Utilisez Ingrédients personnalisables quand le client peut ajuster des ingrédients ou extras.

Exemple : un bol avec extra poulet ou fromage, avec quantité minimale, par défaut et maximale.

#### Champs à remplir

| Champ dans l'interface | Quoi mettre                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| Type                   | Ingrédients personnalisables.                                       |
| BOM communs            | BOMs communs du produit de base.                                    |
| Ingrédients et extras  | Section qui contient les ingrédients personnalisables.              |
| Code                   | Code unique, par exemple `poulet`.                                  |
| Nom                    | Nom affiché, par exemple `Poulet`.                                  |
| BOM extra              | BOM ajouté quand la quantité dépasse la quantité incluse.           |
| Défaut                 | Quantité incluse par défaut.                                        |
| Minimum                | Quantité minimale permise.                                          |
| Maximum                | Quantité maximale permise.                                          |
| Prix extra             | Prix facturé pour chaque unité au-dessus de la quantité par défaut. |

#### Règles à respecter

- Un produit Ingrédients personnalisables doit avoir au moins un ingrédient ou extra.
- Les codes d'ingrédients doivent être uniques.
- Une sélection doit rester entre Minimum et Maximum.
- Si le client ne sélectionne rien, Défaut est utilisé.
- Seule la quantité au-dessus de Défaut ajoute Prix extra au prix de vente.
- Le coût du BOM d'ingrédient est ajouté seulement pour la quantité extra.

#### Exemple de configuration

Pour demander deux portions de poulet alors qu'une portion est incluse par défaut :

- Mode d'achat : aucun.
- Choix : aucun.
- Répartition : aucune.
- Ingrédients : poulet, quantité 2.

#### Erreurs fréquentes

- Mettre Défaut hors de la plage Minimum/Maximum.
- Oublier le BOM extra : l'analyse peut devenir incomplète ou sous-estimer le coût.
- Croire que Prix extra remplace le prix de base : il s'ajoute seulement pour les quantités extra.

### Analyse de prix

L'analyse compare le prix de vente configuré avec le coût calculé depuis les BOMs.

| Champ dans l'interface | Signification                                          |
| ---------------------- | ------------------------------------------------------ |
| Prix de vente          | Prix de vente utilisé pour cette analyse.              |
| Coût                   | Coût total calculé depuis les BOMs requis.             |
| Coût unitaire          | Coût ramené à une unité analysée.                      |
| Marge réelle           | Marge réelle calculée quand les coûts sont complets.   |
| Marge cible            | Marge cible définie dans le produit.                   |
| Prix recommandé        | Prix conseillé pour atteindre la marge cible.          |
| Analyse complète       | Indique si tous les coûts nécessaires ont été trouvés. |
| BOMs manquants         | BOMs manquants ou non calculables.                     |

#### Statuts

| Statut       | Interprétation                                            |
| ------------ | --------------------------------------------------------- |
| `GOOD`       | La marge réelle atteint ou dépasse la marge cible.        |
| `REVIEW`     | Le produit est rentable, mais la marge est sous la cible. |
| `LOSS`       | Le coût est plus élevé que le prix de vente.              |
| `INCOMPLETE` | Le coût ne peut pas être calculé complètement.            |

Le prix recommandé est indicatif. Il n'est jamais copié automatiquement dans le prix de vente.

### Publication catalogue

La publication envoie les produits marqués comme publiés vers la projection publique lue par la vitrine.

| Champ dans l'interface | Rôle                                                                  |
| ---------------------- | --------------------------------------------------------------------- |
| Disponible             | Indique si le produit est disponible pour le client.                  |
| Publier                | Indique si le produit doit être inclus dans la publication catalogue. |

Points importants :

- Sauvegarder un produit ne publie pas automatiquement le catalogue.
- La projection publique inclut les informations client, les modes d'achat actifs, les choix actifs, les ingrédients actifs, les images et les prix.
- La projection publique exclut les coûts internes, les marges cibles, les diagnostics et les prix recommandés.
- L'action actuelle publie les produits encore marqués Publier ; elle ne réconcilie pas automatiquement les produits qui viennent d'être décochés.

### Glossaire des champs

| Champ dans l'interface  | Description                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Code                    | Code interne stable. Utilisez un format court et lisible, par exemple `pate-poulet`.                 |
| Slug                    | Identifiant URL public. Il doit rester stable autant que possible.                                   |
| Nom                     | Nom affiché du produit.                                                                              |
| Description             | Description client ou admin du produit.                                                              |
| Type                    | Type de flow produit : Standard, Choix unique, Formats composables ou Ingrédients personnalisables.  |
| Catégorie               | Catégorie du catalogue.                                                                              |
| BOM communs             | BOMs communs au produit, toujours inclus dans le coût.                                               |
| Prix de base            | Prix de vente par défaut.                                                                            |
| Marge cible (%)         | Marge cible affichée en pourcentage. Entrez `30` pour 30 %.                                          |
| Unité                   | Libellé de l'unité vendue.                                                                           |
| Image principale        | Image principale publique.                                                                           |
| Galerie                 | Images supplémentaires.                                                                              |
| Note                    | Texte de disponibilité affiché au client.                                                            |
| Disponible              | Disponibilité commerciale.                                                                           |
| Publier                 | Inclusion dans la prochaine publication catalogue.                                                   |
| Ordre                   | Ordre d'affichage. Plus petit signifie plus haut dans la liste.                                      |
| Modes d'achat           | Formats de vente avec prix et quantité.                                                              |
| Répartition             | Règle de choix pour un mode d'achat : aucune, choix unique ou composition.                           |
| Saveurs et choix        | Groupe de choix affiché au client.                                                                   |
| Ingrédients et extras   | Ingrédients ou extras personnalisables.                                                              |
| Configuration d'analyse | Sélection temporaire utilisée pour analyser un prix ; ce n'est pas encore un panier ou une commande. |
