# SAVIS Admin

React back office for [SAVIS](../README.md), with a French-language interface.

- **SAVIS API:** owns resources, BOMs, supply offers, activity rates, catalog, quotations, orders, invoices, and business persistence.
- **SAVIS Executor:** owns provider acquisition, offer review, refresh tasks, and execution history.
- **Admin:** presents workflows through HTTP clients. Backend services enforce business rules and calculate authoritative prices.

## Local Development

- Use Node.js 24 and npm, matching the Docker environment.
- Run SAVIS API on port `8080` and Executor on port `8000` for acquisition screens.
- Install and start from `savis-admin/`:

```bash
npm ci
npm run dev
```

- Open <http://localhost:5173>. Vite proxies `/savis-api` to `http://localhost:8080/api` and `/executor-api` to `http://localhost:8000/api`.
- No `.env` is required for these defaults. To use different backend hosts, set `SAVIS_API_PROXY_TARGET` and `EXECUTOR_API_PROXY_TARGET` before starting Vite.
- To start the complete stack, run `make run-local` from the repository root; see the [setup instructions](../README.md#quick-start).

## Business Flows

The following sections follow the visible sidebar order and labels.

### Tableau de bord

- **Routes:** `/` and `/dashboard` display the same dashboard.
- **Content:** cards, charts, and tables use static data from `src/features/dashboard/api/data.json`; they do not report live business activity.

### Approvisionnement

#### À valider

- **Route:** `/offers` opens “Validation des offres”, backed by Executor.
- **Acquisition:** “Récupérer une offre” starts a `GET_OFFER` task with component name, type (`FOOD` or `MATERIAL`), provider, and exact product URL. The current provider selector offers Maxi.
- **Review:** filter by status and search-term facets, sort and paginate, then validate, reject, invalidate, edit, or delete an offer.
- **Refresh:** configure refresh frequency or request an immediate `REFRESH_OFFER` task; provider product links open separately.
- **Statuses:** `NEW`, `VALID`, and `REJECTED` describe review state. Executor can publish offer updates or invalidations to SAVIS API after review actions.

#### Offres fournisseurs

- **Route:** `/supply/offers` displays offers persisted by SAVIS API for production costing, separately from Executor review state.
- **List:** server-side search, availability filtering, sorting, and pagination use URL parameters. The default shows available offers, ordered by latest observation.
- **Details:** inspect supplier identity, product image, package size, price, availability, observation date, and product/provider links.
- **Resource association:** view or change the material resource linked to an offer. Resource names are loaded in batches for the displayed page.
- **Manual creation:** “Nouvelle offre” selects an existing resource and records supplier identifiers, product details, package price, currency, quantity, and unit.

#### Tâches d'acquisition

- **Route:** `/offers/tasks` displays Executor acquisition and refresh history.
- **Inspection:** view task type (`GET_OFFER`, `GET_OFFERS`, `REFRESH_OFFER`), status (`IN_PROGRESS`, `COMPLETED`, `FAILED`), JSON payload, timestamps, and full error details.
- **Navigation:** sorting and pagination remain in the URL; frontend code belongs to `src/features/bom-component/task/`.

### Production

#### Ressources matérielles

- **Route:** `/resources` manages the stable material-resource reference catalog used by BOM components and supplier offers.
- **Categories:** ingredient, consumable, packaging, equipment, and decoration material (`INGREDIENT`, `CONSUMABLE`, `PACKAGING`, `EQUIPMENT`, `DECORATION_MATERIAL`).
- **Editing:** modal forms capture name, description, category, and reference unit. Successful saves close the modal and refresh the list; failures preserve inputs.
- **Units:** select `g`, `kg`, `l`, `ml`, or `piece`. Reference units are optional for equipment and decoration material.
- **List:** search, category, active/inactive status, sorting, page, and page size are URL state. Users can activate/deactivate resources and inspect associated offers.
- **Identity:** resources with identical names remain distinct; names do not trigger automatic merging.

#### Compositions

- **Routes:** `/boms` lists technical compositions; `/boms/add` and `/boms/:id` open the full-page editor.
- **Composition:** define identity, image, instructions, yield, resource-based components, optional selected supplier offers, and sequenced activities.
- **Resources and offers:** select an active resource, enter quantity and compatible unit, then select an available offer loaded by resource UUID. Historical inactive resources remain visible.
- **Units:** form units are `portion`, `piece`, `g`, `kg`, `l`, and `ml`; preparation and cooking activities are provided by default.
- **List:** search composition text and components, filter by type/activity, and sort columns. Filters, sorting, pagination, and selected composition are stored in the URL.
- **Details:** only the selected composition loads its valuation; the list is unpriced. The detail drawer provides editing, cloning, deletion, and access to cost analysis.
- **Saving:** stay on the composition and refresh its saved valuation. Creation replaces the new route with `/boms/:id`; failed saves preserve inputs and drafts.
- **Drafts:** unsaved new compositions use `localStorage` key `bom-draft`; closing offers to keep or discard the draft.
- **Cost analysis:** show saved yield, cost per output unit, category distribution, component/activity subtotals, diagnostics, and price/rate provenance supplied by SAVIS API.
- **Incomplete costs:** distinguish known subtotals, complete totals, missing amounts, and explicit zeros. A draft is not repriced until saved.
- **Precision:** format received amounts independently in `fr-CA` with two decimals. Rounding can make displayed subtotals differ from the displayed total; Admin does not recompute the total from them.
- **Technical detail:** individual cost lines open an accessible panel with offer identifiers, observation timestamps, received precision, and diagnostics.

#### Activités et taux horaires

- **Route:** `/activity-rates` manages one global hourly rate and currency per activity type.
- **Actions:** add an unconfigured activity type, edit its rate, or delete it. SAVIS API uses these rates in BOM valuations.
- **Types:** `PREP`, `COOK`, `ASSEMBLY`, `PACKAGING`, `INSTALLATION`, `DELIVERY`, `CLEANUP`, and `CUSTOM`.

### Catalogue

#### Produits

- **Routes:** `/catalog-products` lists products; `/catalog-products/new` and `/catalog-products/:productId/edit` open the editor. `/catalog-products/:productId/analysis` opens profitability analysis.
- **List:** search, category/publication filters, sorting, pagination, and selected product use URL state. The selected product opens in a detail drawer.
- **Product data:** edit identity, slug, descriptions, images, availability, display order, category, commercial nature, prices, target margin, and purchase modes.
- **Commercial nature:** `GOODS` or `SERVICE`; a service can be sold without a BOM. Labor, supplies, and rented equipment may remain internal composition costs.
- **Configuration:** support `STANDARD`, `SINGLE_CHOICE`, `SINGLE_CHOICE_BUNDLE`, and `INGREDIENT_CUSTOMIZATION` products.
- **Composition:** common `productBoms` form the base; choice BOMs cover selections/flavors; ingredient BOMs cover customizable extras. BOM quantities can be decimal.
- **Categories:** `TASTING` and `DECORATION`. Decoration subcategories are `DECORATIVE_ARCH`, `CENTERPIECE`, `BIRTHDAY`, and `WEDDING`; changing category clears an incompatible subcategory.
- **Analysis:** compare purchase modes and configurations, including worst-case allocations. Show known costs, completeness, margins, and advisory recommended prices; incomplete costs suppress margins and recommendations.
- **Publication:** publish or withdraw an individual product through SAVIS API using `/catalog/products/{id}/publish` or `/unpublish`. API handles the Supabase projection.
- **Drafts:** new product drafts use `localStorage` key `catalog-product-draft`; the editor warns before abandoning unsaved changes.
- **Help:** the application’s “Aide” drawer and product guide use [catalog product flows](src/content/catalog-product-flows.md).

### Ventes

#### Soumissions

- **Routes:** `/sales/quotations` lists quotations; `/quotations/new` and `/quotations/:quotationId` provide creation and details.
- **Creation:** prepare an independent commercial offer with customer details, catalog-configured items, validity date, discount, and delivery fee.
- **Editing:** only `DRAFT` quotations expose editing. New quotation drafts persist in the current tab’s `sessionStorage`.
- **Lifecycle:** mark a draft `SENT`, then `ACCEPTED` or `REJECTED`. These actions record status; the interface does not send an email.
- **Conversion:** convert an accepted quotation into an order, or open its already linked order.
- **Document:** “Voir PDF” opens the quotation generated by SAVIS API.

#### Commandes

- **Routes:** `/sales/orders` lists orders; `/orders/new` and `/orders/:orderId` provide creation and details.
- **Creation:** capture customer, optional address, products, purchase modes, choices, allocations, ingredients, quantities, discount, and delivery fee. Admin estimates the total; SAVIS API validates and prices the order. Order entry does not calculate taxes.
- **Product search:** debounce requests for up to 20 available catalog products; previously selected products remain in the draft when search changes.
- **Contact details:** format Canadian phones and postal codes, send phones as E.164, and block invalid contact inputs. Product images use neutral fallbacks when unavailable.
- **Drafts:** new orders persist in the current tab’s `sessionStorage`, with warnings before leaving unsaved changes.
- **Web import:** “Récupérer commandes web” manually imports submissions through SAVIS API. Admin never reads Supabase directly or receives its service-role key.
- **Editing:** administrative orders at `NEW` allow product edits and repricing from the current catalog. Web orders at `NEW` allow only customer/contact details and note corrections.
- **Lifecycle:** apply the available acceptance, preparation, completion, rejection, or cancellation actions. Product/price snapshots become read-only beyond `NEW` and remain read-only for imported orders.
- **Production needs:** “Besoins de production” aggregates compatible BOM quantities with supplier prices and product/BOM contributions. It does not deduct stock or infer package purchases.
- **Invoicing:** create an invoice from orders at `ACCEPTED`, `IN_PREPARATION`, `READY`, or `COMPLETED`, then open the invoice detail page.

#### Factures

- **Routes:** `/sales/invoices` lists invoices; `/invoices/:invoiceId` shows details. Invoices are created from an order.
- **List:** filter by `DRAFT`, `ISSUED`, or `CANCELLED` status.
- **Draft editing:** update customer details, address, notes, discount, delivery fee, and explicit TPS/TVQ amounts. Product lines come from the order snapshot.
- **Issuing:** save changes and issue the draft; issued invoices expose consultation and PDF generation instead of draft editing.
- **Cancellation:** cancel a non-cancelled invoice through its dedicated action.
- **Document:** “Voir PDF” opens the backend-generated invoice with commercial amounts and taxes.

## Frontend Architecture

- **`src/app/`:** layout, global providers, route tree, and breadcrumbs.
- **`src/features/`:** `activity-rate`, `bom`, `bom-component`, `catalog`, `dashboard`, `invoices`, `orders`, `quotations`, `resource`, `sales`, and `supply-offer` own their business UI.
- **Feature structure:** keep API functions, hooks, types, model helpers, components, and pages within the owning feature; acquisition tasks are nested under `bom-component/task`.
- **`src/shared/`:** Axios clients, application components, utilities, and shared UI primitives. Imports use the `@/` alias.
- **Routing:** React Router’s `createBrowserRouter()` defines screens and route loaders; route `handle` metadata supplies breadcrumbs.
- **Initial loading:** the root route displays “Chargement…” while an initial route loader resolves, including direct access to `/boms/:id`.
- **Layout:** `MainLayout` provides the sidebar, header, breadcrumbs, toasts, help, and route outlet, with responsive navigation and light/dark/system themes.
- **Sales navigation:** `/sales` defaults to orders. Legacy `/quotations`, `/orders`, `/invoices`, and `/supply-offers` list URLs redirect to current workspaces.

## State and Data Loading

- **Server state:** TanStack Query hooks own feature query keys and invalidate affected data after successful mutations.
- **BOM caching:** `["boms"]` holds the unpriced list for 60 seconds and serves catalog selectors. Selected details use a separate query; the editor route loader fetches saved valuation.
- **Cost contract:** BOM details expose `costing`; `price` is null when incomplete. List responses leave both fields null; the dedicated `/boms/{id}/price` operation returns detailed valuation.
- **List state:** URL parameters preserve supported filters, sorting, pagination, and detail selection. Supply/resource/task lists use backend pagination; BOM/catalog lists paginate the loaded collection.
- **Forms:** component state holds current inputs; BOM/product drafts use `localStorage`, while new order/quotation drafts use `sessionStorage`.
- **Boundaries:** backend amounts remain authoritative; Admin adds presentation formatting and estimates where described above.

## Backend Integration and Configuration

Axios clients are defined in `src/shared/api/index.ts`:

| Client | Optional bundle variable | Default proxy | Owner |
| --- | --- | --- | --- |
| `api` | `VITE_API_URL` | `/savis-api` | SAVIS API business workflows. |
| `executorApi` | `VITE_EXECUTOR_API_URL` | `/executor-api` | Offer review and acquisition tasks. |

- **Proxy targets:** Vite uses `SAVIS_API_PROXY_TARGET` and `EXECUTOR_API_PROXY_TARGET`; these are development-server settings.
- **Direct URLs:** optionally set the following in a local `.env` to bypass the frontend proxies:

```dotenv
VITE_API_URL=http://localhost:8080/api
VITE_EXECUTOR_API_URL=http://localhost:8000/api
```

- **Build timing:** `VITE_*` values are embedded in the bundle; changing a running Nginx container’s environment does not reconfigure static assets.
- **Version:** `VITE_SAVIS_VERSION` labels the sidebar, defaulting to `dev`. Docker maps build argument `SAVIS_VERSION` to this value.
- **Contracts:** see the [API README](../savis-api/README.md), [Executor README](../savis-executor/README.md), and [system architecture](../docs/ARCHITECTURE.md).

## Technology

- **Application:** React 19, TypeScript 6, Vite 8, React Router 8.
- **Data and forms:** TanStack Query 5, TanStack Table 8, Axios, Zod, and libphonenumber-js.
- **Interface:** Tailwind CSS 4, shadcn/Radix, Hugeicons, Sonner, Recharts, Embla Carousel, and dnd-kit.
- **Help content:** React Markdown and remark-gfm render the embedded operator guide.
- **Quality:** Vitest, Testing Library, ESLint, and Prettier; `components.json` configures shadcn primitives under `src/shared/ui`.

## Validation

Run all frontend checks from `savis-admin/`:

```bash
npm run lint
npm test -- --run
npm run build
```

- Tests mirror source paths under `test/` and cover routing, procurement, resources, compositions/costing, catalog, sales, and shared utilities.
- Run one test file with `npm test -- --run test/features/bom/hooks/useBomForm.test.ts`.
- Additional commands: `npm run test:ui`, `npm run coverage`, `npm run preview`, and `npm run format`.
- Dependency updates must keep `package.json` and `package-lock.json` synchronized.

## Docker

- **`development`:** Node.js 24 runs Vite with `--host`; the development Compose override exposes port `5173`.
- **`build`:** TypeScript checks and Vite produce the static bundle, including the release version.
- **`production`:** unprivileged Nginx serves assets on port `8080` with SPA history fallback and `/health` readiness.
- **Backend proxies:** Nginx maps `/savis-api/*` to `backend_api:8080/api/*` and `/executor-api/*` to `executor_api:8000/api/*`.
- **Host exposure:** production Compose uses `SAVIS_HTTP_BIND` and `SAVIS_HTTP_PORT`; operational commands are documented in the [root README](../README.md).

## Current Boundaries

- Authentication and authorization are not implemented in Admin.
- The dashboard remains a demonstration, and quotation status changes do not deliver emails.
- Admin never connects directly to PostgreSQL, RabbitMQ, provider acquisition sessions, or Supabase. Provider links only open external product pages.
- Credentials and Supabase service-role keys belong in trusted backend configuration, never in `VITE_*` variables or browser bundles.
