# SAVIS Admin

**SAVIS Admin** is the React back-office application for
[SAVIS](../README.md). It provides the operational UI used to manage technical
BOMs, provider offers, activity rates, sellable catalog products, pricing
analysis, catalog publication, and imported customer orders.

The frontend does not own business rules or persistence:

- [SAVIS API](../savis-api/README.md) owns BOM, supply, activity-rate, catalog,
  and order workflows.
- [SAVIS Executor](../savis-executor/README.md) owns provider-offer
  acquisition, review state, refresh tasks, and task history.

## Navigation

- [SAVIS Admin](#savis-admin)
  - [Navigation](#navigation)
  - [Product Areas](#product-areas)
  - [Business Flows](#business-flows)
    - [Manage Technical BOMs](#manage-technical-boms)
    - [Select Offers for BOM Components](#select-offers-for-bom-components)
    - [Acquire and Review BOM Components](#acquire-and-review-bom-components)
    - [Inspect Acquisition Tasks](#inspect-acquisition-tasks)
    - [Configure Activity Rates](#configure-activity-rates)
    - [Manage Catalog Products](#manage-catalog-products)
    - [Manage Orders](#manage-orders)
    - [Dashboard](#dashboard)
  - [Frontend Architecture](#frontend-architecture)
  - [Routing and Layout](#routing-and-layout)
  - [Data and UI State](#data-and-ui-state)
    - [Server State](#server-state)
    - [URL State](#url-state)
    - [Local State](#local-state)
  - [Backend Integration](#backend-integration)
    - [SAVIS API Proxy](#savis-api-proxy)
    - [Executor Endpoints](#executor-endpoints)
  - [Technology](#technology)
  - [Configuration](#configuration)
  - [Local Development](#local-development)
  - [Docker](#docker)
  - [Tests](#tests)
  - [Current Boundaries](#current-boundaries)

## Product Areas

| Area              | Route                   | Backend         | Purpose                                                                                   |
| ----------------- | ----------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| Dashboard         | `/` and `/dashboard`    | Local demo data | Displays the current dashboard shell, charts, cards, and table.                           |
| Sales             | `/sales/*`              | SAVIS API       | Groups quotations, orders, and invoices in one tabbed workspace.                          |
| Orders            | `/sales/orders`         | SAVIS API       | Lists orders, imports web orders, and manages their lifecycle.                            |
| New order         | `/orders/new`           | SAVIS API       | Creates an administrative order in the unified order editor.                              |
| Order detail      | `/orders/:orderId`      | SAVIS API       | Displays an order and edits administrative orders that are still `NEW`.                   |
| Products          | `/catalog-products`     | SAVIS API       | Manages sellable products, categories, BOM references, pricing analysis, and publication. |
| Product analysis | `/catalog-products/:productId/analysis` | SAVIS API | Read-only profitability workspace and purchase-mode comparison. |
| BOM compositions  | `/boms`                 | SAVIS API       | Lists, searches, creates, edits, prices, and deletes technical BOMs.                      |
| BOM components    | `/offers`       | SAVIS Executor  | Reviews and manages acquired provider offers used as BOM components.                      |
| Acquisition tasks | `/offers/tasks` | SAVIS Executor  | Inspects offer collection and refresh tasks.                                              |
| Activity rates    | `/activity-rates`       | SAVIS API       | Configures global hourly rates used in BOM activity costs.                                |

The interface is currently presented in French.

On the Resources page, “Nouvelle ressource” and “Modifier” open a modal editor.
Saving closes the modal after success and refreshes the list; errors preserve
the entered values. Cancelling closes the modal without saving. The header shows
the “Accueil / Production / Ressources matérielles” breadcrumb.
The list follows the supplier-offer layout: search and status controls, a framed
table with compact actions, loading and retryable error states, and shared
pagination controls. Search, active/inactive status, page and page size (10, 20,
30 or 50) live in URL parameters and are passed to the existing resource API;
changing search, status or page size resets to the first page. Creation, editing,
activation and associated-offer consultation retain their existing workflows.
Associated offers open in the shared right-side detail drawer used by BOM and
catalog product details.
Acquisition tasks use the same framed table, page-size selector and pagination
layout, retaining server sorting and URL filters. Shared table headers have a
muted gray background across pages.

## Business Flows

### Manage Technical BOMs

The `/boms` workspace uses a full-width table with thumbnail/name, type, yield
unit, component count, activity count, yield and a “Détails” action. Name, type,
unit and counts sort ascending/descending through accessible column headers,
before pagination of the complete unpriced list. Legacy `sort=asc|desc` links
remain supported; column sorting uses `sort=<column>-asc|desc`.
Search (including instructions and component names), type, activity,
sorting, page size, page and explicit selection are URL state.
Filter changes reset page and selection; resetting preserves size and unrelated
parameters. Type and activity filters appear in a popover anchored below “Filtres”.
The unit and component-presence filters are removed; old `unit` and `components`
URL parameters are stripped without changing other list state. Costs and calculation quality remain in the detail drawer,
so the table never requests one valuation per row or presents incomplete totals.

Only the selected BOM loads `GET /boms/{id}`, through a TanStack Query cache.
The panel prioritizes saved yield, cost completeness and cost, material resources,
and ordered activities; descriptions and instructions are available in one
secondary disclosure. Complete costs and known subtotals remain distinct;
blocking diagnostics remain visible and non-blocking warnings can be expanded.
Component/activity subtotals come from the backend.
No per-row valuations or frontend cost engine are introduced. Missing and broken
images use a neutral placeholder. A separate action footer remains visible around
the independently scrollable content. Editing, detailed cost analysis (`#bom-cost`),
cloning and confirmed deletion retain their existing workflows; saving invalidates
both the list and selected-detail cache. The current component contract references
material Resources, not nested BOMs, so the view does not invent sub-compositions.

The existing `/boms/:id` editor includes an “Analyse des coûts” section. Its route
loader makes one `GET /boms/{id}` request including the saved valuation; there is
no additional per-card or `/price` request. The section shows the saved yield,
valid cost per output unit and a compact category distribution bar. A three-column
table groups components and activities with their known subtotals. Known lines
show no repeated status badges; problematic lines show concise indicators. The
post name is a keyboard-accessible button opening the existing shadcn Sheet
panel for price/rate provenance and diagnostics. Closing the panel restores focus
to that button. Offer IDs, full observation timestamps and received monetary
precision remain in secondary “Informations techniques” disclosures inside the
panel. Missing costs remain distinct from known zeros. Categories share a
presentation structure for the distribution and table without adding future
cost types.

“Enregistrer” keeps the user on the composition and reloads the saved valuation
through the detail route loader. Creating a composition replaces the creation
history entry with `/boms/{id}`, so subsequent saves update the same composition.
The save action remains disabled until the save and detail refresh finish, and
shows one confirmation per successful save. Failed saves preserve the entered
values and the draft. The editor's valuation describes the saved version; draft
changes are not priced until saved. An explicitly configured zero remains a
known cost.

The `/api/boms/{id}/price` response is now a detailed valuation rather than bare
Money. Detail BOMs expose it as `costing`; `price` is null when incomplete.
List responses keep `price` and `costing` null without running pricing.
Catalog analyses distinguish the known subtotal from nullable full/unit costs,
and suppress margins and recommendations when incomplete. Source warnings,
including the retained price of an unavailable selected offer, remain visible.
`complete` covers the current component/activity model, not future equipment or
energy costs. The current COOK duration and calculation are unchanged.


The BOM area manages generic technical compositions. A BOM can represent a
recipe, packaging, utensils, decoration, an activity-backed resource, or
another reusable composition.

Users can:

- list and search BOMs by name, description, instructions, or component name;
- create or edit a BOM on a dedicated page with section navigation and sticky
  save/cancel actions;
- define general information, image, instructions, and yield;
- search and select an active material resource, then enter its quantity and
  compatible unit; already referenced inactive resources remain visible for
  historical BOMs;
- select an optional available provider offer for each component;
- add sequenced production activities and their duration;
- inspect the cost returned by SAVIS API;
- delete a BOM.

The supported form units are `portion`, `piece`, `g`, `kg`, `l`, and `ml`.
Preparation and cooking activities are provided by default. Additional
activities can use preparation, cooking, assembly, packaging, installation,
delivery, cleanup, or custom types.

The editor groups general information, production and yield, components, and
activities into separate sections, following the catalog product editor layout.
When editing, “Analyse des coûts” displays the saved version’s valuation and
uses its saved yield unit, even while the production fields are being edited.

New unsaved BOMs are stored in browser `localStorage` under the `bom-draft`
key. Closing a form with a draft lets the user keep or discard it.

#### Display precision

The API adds component and activity costs using `BigDecimal` without rounding
them to cents. Component quantity ratios and activity hours use scale 10 with
`HALF_UP`; multiplying by prices/rates and adding those amounts retains that
precision. Admin formats each received amount independently with `Intl.NumberFormat`
(`fr-CA`, two decimal places with the received currency). It never rebuilds
the total from displayed subtotals. For example, 5.246 + 17.166666667 = 22.412666667
is displayed as 5.25 + 17.17 alongside a total of 22.41. This is a display-rounding
difference, not an adjustment to the backend calculation. A short note explains
possible differences; the main view contains no “Précision des montants” section.
Only the individual post panel exposes received precision in its technical
disclosure. Category proportions use unrounded category/known subtotal amounts;
zero known totals display no percentages rather than invalid ratios.
Without the original API payload, these example raw values cannot be attributed
to a particular screenshot. JavaScript JSON numbers retain browser numeric
precision, not arbitrary decimal precision. Cost per output unit is a display-only
ratio of the complete backend total to the positive, finite saved yield.

### Select Offers for BOM Components

When a component name contains at least two characters, the BOM form queries
SAVIS API for available supply offers:

```text
GET /api/supply/offers?componentName=...
```

The offer selector displays the provider product image, label, brand, price,
package size, and provider. Selecting an offer stores its UUID as
`selectedOfferId`; the provider product can be opened in a new browser tab.

The form only consumes offers exposed by SAVIS API. It does not call the
executor directly for this selection workflow.

### Acquire and Review BOM Components

The `/offers` page calls SAVIS Executor directly and displays offers
of every supported type:

- `FOOD`;
- `MATERIAL`.

Users can:

- start a `GET_OFFER` task with a component name, type, provider, and exact
  product URL;
- filter offers with search-term facets;
- paginate and sort the result list;
- validate, reject, invalidate, edit, or delete an offer;
- configure its refresh frequency;
- request an immediate `REFRESH_OFFER` task;
- open the provider product page.

Offer review statuses are `NEW`, `VALID`, and `REJECTED`. Validating,
invalidating, or deleting an offer can cause the executor to publish an update
or invalidation to SAVIS API.

### Inspect Acquisition Tasks

Acquisition tasks are an implementation detail of BOM component management, so
their frontend code and route are nested below the `bom-component` feature:

```text
src/features/bom-component/task/
  api/
  components/
  hooks/
  pages/
  types.ts
```

The `/offers/tasks` page displays:

- task type: `GET_OFFER`, `GET_OFFERS`, or `REFRESH_OFFER`;
- status: `IN_PROGRESS`, `COMPLETED`, or `FAILED`;
- complete JSON payload;
- creation and update timestamps;
- complete error message.

Pagination and sorting are stored in URL search parameters. The breadcrumb
returns to BOM components, and the corresponding sidebar section remains
active.

### Configure Activity Rates

The activity-rate page manages one global hourly cost per activity type.
Users can add an unconfigured type, edit its rate and currency, or delete it.

These rates are consumed by SAVIS API when calculating BOM activity costs.

Supported activity types:

- `PREP`
- `COOK`
- `ASSEMBLY`
- `PACKAGING`
- `INSTALLATION`
- `DELIVERY`
- `CLEANUP`
- `CUSTOM`

### Manage Catalog Products

The catalog page manages products sold to customers. Product data includes:

- identity, slug, description, images, availability, and display order;
- category and optional subcategory;
- commercial nature (`GOODS`/Bien or `SERVICE`/Service);
- configuration type;
- base sale price and target margin;
- common `ProductBom` references with decimal quantities and display order;
- purchase modes and their sale prices;
- optional choice or flavor BOMs;
- optional ingredient or extra BOMs.

Supported product types:

- `STANDARD`;
- `SINGLE_CHOICE`;
- `SINGLE_CHOICE_BUNDLE`;
- `INGREDIENT_CUSTOMIZATION`.

Commercial nature does not impose a BOM. A service can be sold without one; if
a service uses labor, supplies, or rented equipment, those remain internal BOM
costs rather than a separate `RENTAL` catalog product type.

Categories are selected from the fixed catalog values `TASTING` and
`DECORATION`.

The optional subcategory selector is filtered by the selected category.
Decoration currently exposes:

- `DECORATIVE_ARCH` — Arche décorative;
- `CENTERPIECE` — Centre de table;
- `BIRTHDAY` — Anniversaire;
- `WEDDING` — Mariage.

Changing the category clears a subcategory that no longer belongs to it.
`TASTING` currently has no configured subcategories, so the selector only
offers “Aucune sous-catégorie”.

The product form treats:

- `productBoms` as the common base composition;
- choice-option BOMs as the cost of a selected flavor or choice;
- ingredient-option BOMs as the cost of a customizable extra.

Users can run a configuration analysis or a worst-case analysis. The UI
displays cost, margin, status, completeness, and recommended price information.
A recommended price is advisory and is never copied automatically into the
sale price.

For an operator-oriented guide to product creation flows and field usage, see
[`src/content/catalog-product-flows.md`](src/content/catalog-product-flows.md).

Products marked for publication are explicitly sent through:

```text
POST /api/catalog/products/publish
```

SAVIS API remains responsible for the customer-facing Supabase projection.
SAVIS Admin never writes to Supabase directly.

The current action triggers bulk publication of products still marked
`published`; it does not yet reconcile Supabase rows for products newly changed
to unpublished.

### Manage Orders

The `/sales/orders` page lists normalized local orders and provides the manual
**Récupérer commandes web** action. **Nouvelle commande** opens `/orders/new`,
which shares its section-based layout with the order detail page. The editor
captures the customer, an optional address, products,
purchase modes, choices, allocations, ingredients, quantities, an optional
discount, and an optional delivery fee. Its total is an estimate; SAVIS API
validates the catalog rules and calculates the authoritative prices before
persisting the order. The browser keeps an unfinished new-order draft for the
current tab and warns before leaving with unsaved changes. Taxes are not
calculated.

Customer phones are formatted as Canadian numbers while they are entered and
sent to the API in E.164 form. The optional address uses a Canadian province
selector and formats postal codes as `A1A 1A1`; an incomplete or invalid phone
or postal code prevents submission. Order pages display phones in national
format and addresses with the conventional comma before province and postal
code.

The product dropdown is searchable. Input is debounced before the browser asks
Catalog for up to 20 currently available products, so the full catalog is not
loaded into the order form. Products already added remain available to the
draft when the search term changes.

Product snapshot images are shown in search results, configured draft lines,
the order list, and order-item details. The list uses one stable thumbnail in a
dedicated Articles column alongside the total item count, keeping order numbers
aligned. A neutral placeholder is used when an image is absent or cannot be
loaded.

The browser calls SAVIS API only; it never receives the Supabase service-role
key or queries `customer_orders` directly.

The `/orders/:orderId` page displays customer information, submitted prices,
purchase mode, selected choice, flavor allocation, ingredients, and extras.
An administrative order can be edited from the same page while its status is
`NEW`; products and price snapshots are recalculated from the current catalog
when it is saved. Imported web orders and orders that have advanced in the
lifecycle keep their product configuration and price snapshots read-only. For
a web order still at `NEW`, operators may correct only the customer name,
phone, email, address, and note from the Client section.
Operators can apply the valid lifecycle transitions from `NEW` through
preparation and completion, or reject/cancel where allowed. Imported prices are
read-only snapshots. Commercial PDFs are generated from the dedicated
Quotation and Invoice modules rather than directly from an order.

The detail page also generates a **Besoins de production** report. It aggregates
compatible component quantities from all applicable BOMs, shows the current
known supplier product and price, and exposes the product/BOM contribution for
traceability. This is not a shopping list: stock is not deducted and no package
purchase quantity is inferred.

### Dashboard

The dashboard currently uses static data from
`src/features/dashboard/api/data.json`. Its cards, chart, and table demonstrate
the application shell but are not yet connected to SAVIS business APIs.

## Frontend Architecture

The application uses feature-oriented vertical slices:

```text
src/
|-- app/
|   |-- layout/                 # Sidebar, header, responsive application shell
|   |-- providers/              # Global providers such as TanStack Query
|   `-- router/                 # React Router route tree and breadcrumbs
|-- features/
|   |-- activity-rate/
|   |-- bom/
|   |-- bom-component/
|   |   `-- task/               # Child acquisition workflow
|   |-- catalog/
|   |-- sales/
|   |   |-- pages/              # Shared Sales tab layout
|   |   |-- quotations/         # api, hooks, model, components, pages, types
|   |   |-- orders/             # api, hooks, model, components, pages, types
|   |   `-- invoices/           # api, hooks, components, pages, types
|   `-- dashboard/
`-- shared/
    |-- api/                    # Axios clients
    |-- components/             # Cross-feature application components
    |-- lib/
    `-- ui/                     # shadcn/Radix primitives
```

A feature generally owns its:

- API functions;
- React Query hooks;
- domain-facing TypeScript types;
- components and dialogs;
- page components;
- feature-specific model helpers.

Cross-feature UI primitives remain under `src/shared`.

Sales groups the existing `quotations`, `orders`, and `invoices` slices under
`src/features/sales/`; their tests mirror that structure under
`test/features/sales/`. Each child retains its API functions, query hooks,
components, pages and types. The existing `SalesLayout` stays in
`sales/pages/`. Catalog remains independent under `src/features/catalog/`.
This grouping changes import paths only: routes, REST payloads, query keys,
draft storage keys and user workflows remain unchanged. Existing reuse between
Sales children is retained without adding a central Sales service or moving
business-specific code into shared primitives.

## Routing and Layout

The application uses React Router's data router through
`createBrowserRouter()`.

- `MainLayout` owns the sidebar, header, breadcrumb area, toast host, and route
  outlet.
- BOM creation and editing use `/boms/add` and `/boms/:id`, rendered as an
  always-open dialog above the shared layout.
- `/boms/:id` uses a route loader to fetch the selected BOM.
- `/offers/tasks` is a nested child route of `/offers`.
- `/sales/quotations`, `/sales/orders`, and `/sales/invoices` share the Sales
  workspace; `/sales` opens the order tab by default.
- `/orders/:orderId`, `/quotations/:quotationId`, and `/invoices/:invoiceId`
  keep the existing detail routes.
- Breadcrumbs are declared in route `handle` metadata.
- The BOM sidebar parent groups Compositions and Components with shadcn
  collapsible menu primitives.

The layout supports an off-canvas sidebar and light, dark, or system themes.

## Data and UI State

### Server State

TanStack Query owns remote server state. Feature hooks define query keys and
invalidate affected lists after successful mutations.

Examples:

- `["boms"]`;
- `["available-offers", componentName]`;
- `["executor-offers", ...filters]`;
- `["executor-tasks", ...pagination]`;
- `["activity-rates"]`;
- `["catalog-products"]`;
- `["orders"]`;
- `["catalog-categories"]`.

The `["boms"]` cache contains the unpriced list, also used by Catalog's BOM
selectors. It is fresh for 60 seconds to avoid repeated list requests during
navigation. Successful saves (including clones) and deletions invalidate this
key immediately. Detail valuations are loaded by the React Router detail loader
and never stored in the list cache; reopening a detail fetches its current cost.
Catalog pricing analyses still use their dedicated API operations, independently
of the selector list.

### URL State

BOM component and acquisition-task pagination and sorting use URL search
parameters. This makes list state navigable and preserves it in browser
history.

### Local State

Dialog forms use component state. Only the new BOM draft is persisted in
`localStorage`; there is no general client-side persistence layer.

## Backend Integration

Two Axios clients are defined in `src/shared/api/index.ts`:

| Client        | Base URL                                         | Used for                                                                         |
| ------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `api`         | `VITE_API_URL`, default `/savis-api`             | BOMs, supply offers, activity rates, catalog, publication, and orders.            |
| `executorApi` | `VITE_EXECUTOR_API_URL`, default `/executor-api` | Executor offers and tasks.                                                       |

### SAVIS API Proxy

The frontend currently calls the `/savis-api` proxy. Direct SAVIS API endpoints
are prefixed with `/api`:

```text
GET    /savis-api/boms
GET    /savis-api/boms/{id}
GET    /savis-api/boms/{id}/price
POST   /savis-api/boms
DELETE /savis-api/boms/{id}

GET    /savis-api/supply/offers

GET    /savis-api/activity-rates
POST   /savis-api/activity-rates
PUT    /savis-api/activity-rates/{activityType}
DELETE /savis-api/activity-rates/{activityType}

GET    /savis-api/catalog/products
POST   /savis-api/catalog/products
PUT    /savis-api/catalog/products/{id}
DELETE /savis-api/catalog/products/{id}
POST   /savis-api/catalog/products/{id}/pricing-analysis
GET    /savis-api/catalog/products/{id}/worst-case-pricing
POST   /savis-api/catalog/products/publish

GET    /savis-api/orders
GET    /savis-api/orders/{id}
GET    /savis-api/orders/{id}/requirements
POST   /savis-api/orders
POST   /savis-api/orders/import
PUT    /savis-api/orders/{id}
PATCH  /savis-api/orders/{id}/customer
PUT    /savis-api/orders/{id}/status
```

### Executor Endpoints

The frontend currently calls the `/executor-api` proxy. Direct SAVIS Executor
endpoints are prefixed with `/api`:

```text
GET    /api/offers
GET    /api/offers/facets/search-terms
PATCH  /api/offers/{id}
DELETE /api/offers/{id}

GET    /api/tasks
POST   /api/tasks
```

## Technology

- React 19
- TypeScript 6
- Vite 8
- React Router 7
- TanStack Query 5
- TanStack Table 8
- Tailwind CSS 4
- shadcn with Radix primitives
- Axios
- Zod
- Sonner
- Recharts
- Hugeicons
- Vitest and Testing Library
- ESLint and Prettier

The shadcn registry configuration is stored in `components.json`. Shared
generated primitives live in `src/shared/ui`.

## Configuration

Create a local `.env` file when running outside Docker:

```dotenv
VITE_API_URL=http://localhost:8080/api
VITE_EXECUTOR_API_URL=http://localhost:8000/api
```

Both variables are optional. Without them, the clients use `/savis-api` and
`/executor-api`, which are the Nginx proxy paths in the production image.
Standalone Vite development should set the absolute URLs above.

Vite environment variables are compiled into the static frontend bundle. For a
production image, provide them during the image build rather than expecting a
static Nginx container to read changed values at runtime.

## Local Development

Requirements:

- Node.js 22 or newer; CI currently uses Node.js 24;
- npm;
- SAVIS API on `http://localhost:8080`;
- SAVIS Executor API on `http://localhost:8000` for component acquisition
  screens.

Install dependencies:

```bash
npm ci
```

Start Vite:

```bash
npm run dev
```

The development server normally runs at `http://localhost:5173`.

Other available commands:

```bash
npm run build
npm run preview
npm run test
npm run test:ui
npm run coverage
npm run lint
npm run format
```

## Docker

The Dockerfile contains:

- `development`: Vite development server;
- `build`: TypeScript and Vite production build;
- `production`: static assets served by unprivileged Nginx on port `8080`.

The production Nginx configuration:

- serves the SPA with history fallback;
- proxies `/savis-api/*` to SAVIS API;
- proxies `/executor-api/*` to SAVIS Executor;
- exposes `/health` for Docker readiness.

Run the complete SAVIS environment from the repository root:

```bash
docker compose up --build
```

The development override exposes Vite at `http://localhost:5173`. Production
Compose exposes Nginx through the host bind and port configured by
`SAVIS_HTTP_BIND` and `SAVIS_HTTP_PORT`.

## Tests

The current Vitest suite covers:

- BOM draft storage;
- BOM full-page editing, section navigation, saving and draft cancellation;
- BOM table/drawer loading, URL search/selection, cached valuations, image fallbacks,
  responsive visibility, actions and navigation to detailed analysis;
- list cache reuse and invalidation after BOM saves/deletions;
- complete, incomplete and zero costs, diagnostics, provenance and display rounding;
- BOM component retrieval dialog;
- BOM component list state and actions;
- BOM component search-term facets.

Run the suite:

```bash
npm test -- --run
```

Run a single file:

```bash
npm test -- --run test/features/bom/hooks/useBomForm.test.ts
```

Catalog profitability has dedicated workspace tests, alongside the existing
catalog API, product editor, card, and routing tests.

## Current Boundaries

- Authentication and authorization are not implemented in SAVIS Admin.
- The dashboard is still backed by local demonstration data.
- The frontend relies on backend validation for business invariants.
- SAVIS Admin does not connect directly to PostgreSQL, RabbitMQ, provider
  websites, or Supabase.

## Supply resource association

Supply offers reference Resource by UUID. Admin supports manual offer creation,
explicit association from offer details, and resource offer consultation. BOM and
Catalog cost valuation use resource UUIDs and batched offer reads; foreign selected
offers produce a blocking diagnostic. Executor messages remain compatible and
discoveries await operator association. See [phase 2.3 migration and validation](../docs/SUPPLY_RESOURCE_MIGRATION.md)
for V13 preflight, unresolved offers, HTTP contracts and verification.

BOM saving and cost consultation do not trigger acquisition. The editor reads
existing Supply offers by Resource UUID and keeps missing-price diagnostics.
“Enregistrer” persists the BOM and reloads its valuation. Acquisition remains a
separate explicit action in the offer retrieval workflow (`POST /api/tasks`).

## Procurement review workspace

Approvisionnement contains **À valider** (`/offers`), **Offres
fournisseurs** (`/supply/offers`), and **Tâches d'acquisition**
(`/offers/tasks`). The legacy `/supply-offers` entry redirects to Supply.
Review uses a sortable table and an explicit offer-detail drawer. The default status is `NEW`;
`VALID`, `REJECTED`, and all statuses remain accessible. Status, exact search
term, sorting and pagination are URL state. Successful review/deletion refreshes
Executor lists and term counters and returns to
the preceding page when the last row of a page disappears. No Supply write is
performed by review.

The review page follows the supplier-offer consultation layout: a shared
`DataTable` with product images, search term, provider, package price, format,
status and collection dates. Sorting runs on the server through column headers
and retains URL state. Explicit detail actions occupy the pinned Actions column. Details open in an accessible right drawer with the existing
rejection confirmation, editing and deletion actions. Supplier product links
and validation are available in the drawer footer. Validation is shown for offers
that are not already validated. Collection information
is always visible in the scrollable body; editing, deletion, supplier links and validation/rejection actions
are grouped in the persistent footer. Escape closes
the drawer and restores focus to the invoking action. An offer that leaves the
current results after a mutation closes its details without selecting another.

Retrieval by provider URL, editing review status and refresh frequency, immediate
refresh scheduling, validation, rejection/invalidation, supplier links and
confirmed deletion remain available. Supply retains manual creation, resource
association and offer detail consultation. Its toolbar uses the shared search
field and counted “Filtres” popover with availability and “Effacer les filtres”.
The existing available-only default is reflected as one active filter; clearing
shows all statuses and keeps search and sorting. The shared DataTable replaces
the separate sort selector: Composant (`componentName`), Prix du paquet (`price`)
and Dernière observation (`lastSeen`) expose ascending/descending server sorting
with persistent neutral/active icons. Commercial product identity (thumbnail,
label, brand) is separate from the sortable component name. Other columns remain
non-sortable because the paginated API does not support them; no current-page
sorting is used. Search, availability, sorting and pagination remain URL state.
Changing sorting resets the server page and preserves other context. Resource names are resolved for the current
page using one bounded `GET /resources/batch?ids=…`, never one request per row.
Task monitoring retains its table and sorting/pagination, adds the existing
server-side status/type filters, an explicit refresh button and retryable errors.

API limits: Executor exposes exact term filtering and searchable term facets,
not product-wide free-text search or provider filtering. Supply catalog exposes
text search and availability filtering, not resource/provider filters. Executor
has no resource association field; association remains in Supply details. Tasks
have no text-search endpoint. No client-only filtering of a paginated subset is
used to simulate these unsupported filters.

## Product profitability workspace

“Analyser” opens `/catalog-products/:productId/analysis`, a read-only workspace
with product identity, publication state, mode selection (stored in the URL), four
financial indicators, cost/margin distribution, composition references, mode
comparison, optional choice comparison, and calculation quality. Compact KPI
grids include completeness, the configured margin objective and the recommended
price. Mode comparison uses a seven-column table, with labeled stacked cells on
mobile; the mode button in each row updates the existing selector and URL. The
selected row is highlighted. Choice comparison reuses this table at an equivalent
mode. Edits remain in Catalog and BOM editors.

The existing `GET /catalog/products/{id}`, `POST /catalog/products/{id}/pricing-analysis`
and `GET /catalog/products/{id}/worst-case-pricing` contracts supply all financial
results. A single cached, unpriced `GET /boms` resolves names and yields; there are
no per-BOM valuation requests. Each active purchase mode has its own cached
server analysis; the UI never multiplies one mode's costs to estimate another.
Independent choice comparisons are requested only after “Comparer les choix”.

Calculation quality reuses that same BOM list to resolve diagnostic `bomId`
and `missingBomIds` to business names. `missingBomIds` includes existing BOMs
with incomplete costs; it does not mean those BOMs are absent. Known references
are labeled “Composition incomplète : <nom>”, with the original source, message
and blocking status retained. Unknown references (or `BOM_NOT_FOUND`) show
“Composition introuvable” with a secondary UUID. Loading or failed name reads
remain distinct from missing references and never hide diagnostics. No additional
name or valuation requests are issued.

Base `productBoms` are cumulative. Only actual active choice options expose a
selector and equivalent-mode comparison. Allocated bundles explicitly show the
backend worst case, not an invented allocation or interchangeable base BOMs.
Ingredient customization uses recorded default quantities. Optional ingredient
and allocation editors are outside this read-only workspace.

“Coût de revient estimé” uses `cost`, not `unitCost`. The backend ratio is
`(salePrice - cost) / salePrice`, labeled “Marge sur vente”; the monetary margin
is the difference between the returned price and full cost. Incomplete results
suppress margins and recommendations, retain the known subtotal, and distinguish
blocking diagnostics from warnings. Unknown values remain “Non déterminable”,
while known zero values are displayed. Losses use separate amounts instead of a
stacked positive-share bar. The breakdown includes only total cost and margin:
Catalog does not expose per-BOM contributions or component/activity category
amounts, so the workspace does not reconstruct those calculations. Composition
links open the BOM's own valuation, which is not the product contribution.

The existing model has no mode-specific packaging association. Existing backend
rules remain authoritative, including shared base quantities and yield division.
Adding contribution amounts, category subtotals, or the selected composition of a
worst-case result would require an explicit extension of the Catalog analysis
response; none is introduced here.

`test/features/catalog/pages/CatalogProductAnalysisPage.test.tsx` covers financial
presentation, modes, cumulative bases, actual choices, worst-case bundles,
diagnostics, missing values, losses, known zeros, empty states, errors, navigation,
and generic decoration products. Its pâté and balloon-arch fixtures are synthetic;
validation against actual operational products requires a running SAVIS API.

## Catalog product consultation

`/catalog-products` uses a full-width table with thumbnail/name, category,
starting price, publication, sale-mode count (including inactive modes), distinct
composition count and “Détails”. All data columns sort through their headers,
ascending/descending, before pagination of the complete list response. Unknown
starting prices remain last; currency codes group prices before numerical ordering.
Search (name/code/description, accent-insensitive), category, publication,
sorting (`sort=<column>-asc|desc`), page size, page and selection
remain URL state. Filters reset page and selection. No per-row requests or pricing
calculations are introduced. The cached unpriced BOM list resolves detail names.

Resources, BOMs and Products share the same page-header scale and spacing and
search/filter primitives. Search instructions sit inside the input, followed by a
magnifying-glass button that focuses it; an accessible name remains available.
The Products and BOM toolbar shows only search and “Filtres”, with a count of
active filters (excluding search and sorting). A right-aligned popover opens below
the button: publication/category for Products, type/yield unit/activity for BOMs. Labels sit
beside selectors, changes apply immediately, Escape and outside clicks dismiss
the panel, and keyboard dismissal restores focus. The panel fits the mobile
viewport and scrolls if needed. “Effacer les filtres” clears these filters and
resets page/selection, retaining search, sorting, page size and unrelated URL
parameters. Retired Product `availability` and BOM `components` parameters are
removed from old links and no longer restrict results. The useful BOM yield-unit
filter remains available; quantity and unit appear together in the “Rendement”
column and in details. Resources uses the same popover for status and category, with category sent
to the existing server filter before pagination. Clearing filters retains search
and page size. Sorting remains in table headers.

Resources, BOMs and Products use the same shared `DataTable` with feature-owned
columns. Its headers, sorting controls and action alignment share one renderer.
The Actions column is pinned to the right within the table's horizontal scroll
container, with an opaque header/cell background and intrinsic-width button group.
Buttons remain side by side without shrinking. The page's flex containers allow
shrinking so wide tables scroll internally instead of widening the page; row
hover and selection also apply to pinned action cells.
Sortable headers always show a neutral sorting icon before activation, then an
ascending/descending arrow. A tooltip describes the next sorting direction;
`aria-sort` exposes the current state. Non-sortable headers have no sorting icon.
The shared `Table` primitive owns the rounded card frame, muted header, row
spacing, hover and horizontal scrolling for all tables; pages do not add a second
card frame. Resource headers sort name, category and reference unit through the server before
pagination. Search, status, category, sort and page size remain URL state; changing
filters or sorting resets the page. Category sorting follows French label order,
unit sorting follows displayed symbols, and missing units remain last in either
direction. The default is `name,asc`.
The tables use the installed TanStack Table core;
the existing URL hooks perform sorting and pagination on the complete dataset.
Both pages reuse their existing business detail components inside a shared right
shadcn Sheet: 680 px maximum on desktop, full available width on mobile, fixed
header/actions and independently scrollable content. No drawer opens until an
explicit `selected` UUID is present in the URL. Opening pushes browser history;
reload and back/forward restore the drawer. Closing by “Fermer” or Escape removes
only selection, retains table context and restores focus to the invoking button
(or a visible table action after a direct link). Invalid/deleted selections are
removed without automatically selecting another row. Product mode details,
cumulative bases, choices, ingredient customization and existing mutations are
reused unchanged. Column order is fixed; no dependency was added.

Creation, editing, publication/republication, withdrawal from SavouretPlus and
confirmed deletion retain their existing hooks and API operations. “Analyser”
links to the existing `/catalog-products/:productId/analysis` page. The consultation
page does not trigger or embed pricing calculations. No backend contract,
business model or schema is changed.

The product page tests cover table columns, sorting before pagination, search,
filters, modes and composition groups, existing actions, URL restoration, keyboard
opening, Escape and focus restoration, loading, empty and error states. Automated
DOM tests do not replace visual verification of mobile and light/dark themes.

Product detail links to analysis and editing carry a local `returnTo` URL with
the list search, filters, sorting, page size, page and selected product. “Retour
aux produits” and editor cancellation/success restore that context, including
after an analysis mode change or reload. Direct analysis/editor links without
context return to the catalog with that product selected. External return URLs
are ignored.

The product detail panel uses a fixed header and action footer around one
keyboard-focusable, independently scrollable content region. Its available height
is measured from its actual viewport position, following the procurement review
panel convention, and refreshed on window resize and scroll. This keeps actions
outside the scrolling content on desktop and in the mobile detail view. Publication
state and identity lead the panel, followed by sale modes and compositions;
description and availability notes are in a single secondary disclosure. Compact
sale-mode rows align prices; composition rows show their actual role (common
base, choice, ingredient), full BOM name, configured quantities and ingredient
supplement separately. Supplements are displayed as supplied, without recalculating
pricing rules. A compact contained image preserves varying aspect ratios; long
descriptions remain complete and wrap inside the scroll region. URL selection
and filter semantics, return navigation and Catalog mutations are unchanged.

The analysis header uses compact product identity and selectors, and explicitly
identifies the conservative worst-case assumption for allocated bundles. Cost and
margin use matching colored legend markers, amounts and proportions; losses and
incomplete or zero-price analyses retain separate explanatory amounts rather than
a misleading bar. Composition rows identify common bases, selected/evaluated
choices and default ingredients, with associated quantity, yield and an accessible
link to the BOM valuation. Individual financial contributions remain unavailable
in the Catalog response and are not reconstructed. A summary link opens the
existing detailed quality section. The Catalog and Products breadcrumbs in
analysis/editing use the same validated return destination as “Retour aux produits”,
preserving selection, list page and filters.
