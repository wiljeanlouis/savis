# Préparation des soumissions — bilan de réalisation

## Comportement et décisions

- Préparation calculée côté serveur, sans mutation lors du GET, à partir du payload original.
- Contrat vérifié dans `PublishedCatalogProductMapper` : `offering_id` est le UUID public Catalog ; les identifiants publiés de modes, choix et ingrédients sont les codes Catalog. Aucune résolution par nom, slug ou prix.
- Le mapper Supabase traduit la sélection sans transporter de prix. `CatalogOrderingApi.identify(UUID)` distingue identité/disponibilité et configuration, puis `snapshot` valide la sélection actuelle. `QuotationService` tarife à nouveau au moment de la création.
- UUID de ligne déterministe depuis le UUID de demande et `item:N`, sans identifiant Catalog inventé. Une qualification enregistrée reste prioritaire en totalité : aucun écrasement, ajout ou fusion automatique.
- L’Admin présente la demande originale, les lignes courantes, les diagnostics et les interventions. Il réutilise l’éditeur de produits existant. Une configuration problématique peut être reprise explicitement pour correction.
- Les formulaires conservent leur version d’ouverture et la même intention de proposition lors d’un rejeu. Les sauvegardes et créations sont explicites.
- Une soumission peut inclure une partie des besoins. Les absents restent ouverts ; les exclusions explicites demandent un motif. Une référence inconnue ou une inclusion/exclusion contradictoire reste refusée.
- Les associations des lignes et besoins inclus et les exclusions sont capturées par soumission. Ce snapshot décrit les décisions à la création, sans recalcul des soumissions historiques ni des préparations antérieures.

## Contrats HTTP

- `GET /api/quote-requests/{id}` ajoute `preparation: {qualification, needs, saved}`. Les diagnostics contiennent `needKey`, `requestedName`, `productName`, `state`, `issue`, `requestedLine` ; états `RECOGNIZED`, `REVIEW`, `UNRESOLVED`, `CUSTOM`.
- Le corps de `POST /api/quote-requests/{id}/quotations` reste inchangé. Sans qualification sauvegardée, `lineIds` peut sélectionner les lignes préparées déterministes. Le verrou, la transaction, `expectedVersion`, `proposalRequestId` et son empreinte restent en place.
- Les réponses Quotation ajoutent `proposalCoverage`, avec `inclusions` (UUID de ligne de la soumission → clés de besoins) et `exclusions` (clé → motif). Les exclusions historiques restent consultables ; aucune inclusion historique n’est inventée.
- Aucune nouvelle route, dépendance UI, infrastructure ou modification Executor/Supabase.

## Migration

`V17__capture_proposal_inclusions.sql` ajoute `quotations.proposal_inclusions` JSONB nullable. Aucun backfill ni changement des lignes existantes. La chaîne Flyway est vérifiée sur PostgreSQL jetable ; aucune migration n’est appliquée aux bases de développement existantes par cette tâche.

## Validation

- API : suite complète `./mvnw -q -Dspring.rabbitmq.port=1 test`, avec `SAVIS_TEST_POSTGRES_URL`, utilisateur et mot de passe de test pointant uniquement vers le PostgreSQL jetable. **275 tests recensés : 258 réussis, 17 ignorés, aucun échec ni erreur**. Cela inclut les **10 tests PostgreSQL**, les **5 tests Modulith**, les **8 tests de préparation** et les **6 tests du contrôleur QuoteRequest**.
- Admin : `npm test -- --run --maxWorkers=2 --testTimeout=20000` : **65 fichiers, 272 tests réussis**. La concurrence réduite et le délai adapté évitent les dépassements liés à la charge locale.
- Admin : `npm run lint`, sans erreur ni avertissement ; `npm run build` et vérification Prettier réussis.
- Contrat public : `python3 test/integration/quote_requests_supabase.py` réussi, avec chaîne de migrations, assertions SQL, privilèges et soumissions concurrentes sur base jetable.
- Les tests vérifient le mapping/configuration, les produits absents ou indisponibles, la configuration obsolète, les besoins libres, la conservation des corrections, les réouvertures, les soumissions partielles et multiples, les contradictions, le rejeu, les conflits de version, le rollback et les liens jusqu’à la facture. Les suites existantes couvrent aussi les soumissions autonomes.
- Le premier passage PostgreSQL a été empêché par le sandbox réseau, puis relancé avec l’accès local nécessaire. Pour la suite complète, `spring.rabbitmq.port=1` empêche le redémarrage des contextes de tests de joindre le broker local existant ; aucune file réelle n’est consommée.
- Conteneur PostgreSQL de test arrêté et supprimé après validation. Les bases jetables du script Supabase ont été supprimées par son nettoyage.
- `git diff --check` réussi.

## Limites

- Les configurations incomplètes ou devenues invalides nécessitent une correction commerciale explicite. Aucun produit Catalog n’est créé automatiquement.
- Les besoins de service libres restent personnalisés ; aucune correspondance métier n’est inférée depuis les noms ou catégories.
- Les tests couvrent séparément la soumission RPC Supabase et le parcours d’import/préparation/soumission/commande/facture sur PostgreSQL avec Catalog et inbox simulés. Le parcours depuis l’interface du site public n’a pas été rejoué dans un navigateur.
- La compétence [Browser](/Users/wgandy/.codex/plugins/cache/openai-bundled/browser/26.623.41415/skills/control-in-app-browser/SKILL.md) exige : « Only the Node REPL `js` tool (`mcp__node_repl__js`) can be used to control the in-app browser. » Cet outil n’est pas disponible dans la session ; aucune vérification visuelle n’est revendiquée.
- Aucun commit ni déploiement effectué.

## Fichiers modifiés

- [README.md](../../README.md)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- [docs/integration/quote-request-implementation.md](../../docs/integration/quote-request-implementation.md)
- [docs/integration/quote-request-preparation-validation.md](../../docs/integration/quote-request-preparation-validation.md)
- [savis-admin/README.md](../../savis-admin/README.md)
- [savis-admin/src/features/sales/quotations/types.ts](../../savis-admin/src/features/sales/quotations/types.ts)
- [savis-admin/src/features/sales/quote-requests/components/PreparationNeeds.tsx](../../savis-admin/src/features/sales/quote-requests/components/PreparationNeeds.tsx)
- [savis-admin/src/features/sales/quote-requests/components/PreparedLines.tsx](../../savis-admin/src/features/sales/quote-requests/components/PreparedLines.tsx)
- [savis-admin/src/features/sales/quote-requests/components/ProposalForm.tsx](../../savis-admin/src/features/sales/quote-requests/components/ProposalForm.tsx)
- [savis-admin/src/features/sales/quote-requests/components/QualificationForm.tsx](../../savis-admin/src/features/sales/quote-requests/components/QualificationForm.tsx)
- [savis-admin/src/features/sales/quote-requests/components/QualificationPanel.tsx](../../savis-admin/src/features/sales/quote-requests/components/QualificationPanel.tsx)
- [savis-admin/src/features/sales/quote-requests/model/types.ts](../../savis-admin/src/features/sales/quote-requests/model/types.ts)
- [savis-admin/src/features/sales/quote-requests/pages/QuoteRequestDetailsPage.tsx](../../savis-admin/src/features/sales/quote-requests/pages/QuoteRequestDetailsPage.tsx)
- [savis-admin/test/features/sales/quote-requests/components/QualificationForm.test.tsx](../../savis-admin/test/features/sales/quote-requests/components/QualificationForm.test.tsx)
- [savis-admin/test/features/sales/quote-requests/components/RequestProposals.test.tsx](../../savis-admin/test/features/sales/quote-requests/components/RequestProposals.test.tsx)
- [savis-admin/test/features/sales/quote-requests/pages/QuoteRequestDetailsPage.test.tsx](../../savis-admin/test/features/sales/quote-requests/pages/QuoteRequestDetailsPage.test.tsx)
- [savis-api/README.md](../../savis-api/README.md)
- [savis-api/src/main/java/com/savouretplus/savis/catalog/api/CatalogOrderingApi.java](../../savis-api/src/main/java/com/savouretplus/savis/catalog/api/CatalogOrderingApi.java)
- [savis-api/src/main/java/com/savouretplus/savis/catalog/usecase/CatalogOrderingService.java](../../savis-api/src/main/java/com/savouretplus/savis/catalog/usecase/CatalogOrderingService.java)
- [savis-api/src/main/java/com/savouretplus/savis/sales/quotation/adapter/persistence/QuotationEntity.java](../../savis-api/src/main/java/com/savouretplus/savis/sales/quotation/adapter/persistence/QuotationEntity.java)
- [savis-api/src/main/java/com/savouretplus/savis/sales/quotation/adapter/persistence/QuotationRepositoryAdapter.java](../../savis-api/src/main/java/com/savouretplus/savis/sales/quotation/adapter/persistence/QuotationRepositoryAdapter.java)
- [savis-api/src/main/java/com/savouretplus/savis/sales/quotation/adapter/supabase/QuoteRequestSelectionMapper.java](../../savis-api/src/main/java/com/savouretplus/savis/sales/quotation/adapter/supabase/QuoteRequestSelectionMapper.java)
- [savis-api/src/main/java/com/savouretplus/savis/sales/quotation/adapter/web/QuotationResponse.java](../../savis-api/src/main/java/com/savouretplus/savis/sales/quotation/adapter/web/QuotationResponse.java)
- [savis-api/src/main/java/com/savouretplus/savis/sales/quotation/adapter/web/QuoteRequestController.java](../../savis-api/src/main/java/com/savouretplus/savis/sales/quotation/adapter/web/QuoteRequestController.java)
- [savis-api/src/main/java/com/savouretplus/savis/sales/quotation/adapter/web/QuoteRequestResponse.java](../../savis-api/src/main/java/com/savouretplus/savis/sales/quotation/adapter/web/QuoteRequestResponse.java)
- [savis-api/src/main/java/com/savouretplus/savis/sales/quotation/domain/Quotation.java](../../savis-api/src/main/java/com/savouretplus/savis/sales/quotation/domain/Quotation.java)
- [savis-api/src/main/java/com/savouretplus/savis/sales/quotation/domain/QuoteRequestQualification.java](../../savis-api/src/main/java/com/savouretplus/savis/sales/quotation/domain/QuoteRequestQualification.java)
- [savis-api/src/main/java/com/savouretplus/savis/sales/quotation/port/QuotationRepository.java](../../savis-api/src/main/java/com/savouretplus/savis/sales/quotation/port/QuotationRepository.java)
- [savis-api/src/main/java/com/savouretplus/savis/sales/quotation/port/QuoteRequestSelections.java](../../savis-api/src/main/java/com/savouretplus/savis/sales/quotation/port/QuoteRequestSelections.java)
- [savis-api/src/main/java/com/savouretplus/savis/sales/quotation/usecase/CreateQuoteRequestProposal.java](../../savis-api/src/main/java/com/savouretplus/savis/sales/quotation/usecase/CreateQuoteRequestProposal.java)
- [savis-api/src/main/java/com/savouretplus/savis/sales/quotation/usecase/PrepareQuoteRequest.java](../../savis-api/src/main/java/com/savouretplus/savis/sales/quotation/usecase/PrepareQuoteRequest.java)
- [savis-api/src/main/resources/db/migration/V17__capture_proposal_inclusions.sql](../../savis-api/src/main/resources/db/migration/V17__capture_proposal_inclusions.sql)
- [savis-api/src/test/java/com/savouretplus/savis/QuoteRequestPostgresTest.java](../../savis-api/src/test/java/com/savouretplus/savis/QuoteRequestPostgresTest.java)
- [savis-api/src/test/java/com/savouretplus/savis/sales/quotation/adapter/persistence/QuotationRepositoryAdapterTest.java](../../savis-api/src/test/java/com/savouretplus/savis/sales/quotation/adapter/persistence/QuotationRepositoryAdapterTest.java)
- [savis-api/src/test/java/com/savouretplus/savis/sales/quotation/adapter/web/QuoteRequestControllerTest.java](../../savis-api/src/test/java/com/savouretplus/savis/sales/quotation/adapter/web/QuoteRequestControllerTest.java)
- [savis-api/src/test/java/com/savouretplus/savis/sales/quotation/usecase/PrepareQuoteRequestTest.java](../../savis-api/src/test/java/com/savouretplus/savis/sales/quotation/usecase/PrepareQuoteRequestTest.java)
