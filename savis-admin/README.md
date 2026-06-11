# SAVIS Admin

**SAVIS Admin** is the React back-office application for
[SAVIS](../README.md). It provides the operational UI used to manage technical
BOMs, provider offers, activity rates, sellable catalog products, pricing
analysis, and catalog publication.

The frontend does not own business rules or persistence:

- [SAVIS API](../savis-api/README.md) owns BOM, supply, activity-rate, and
  catalog workflows.
- [SAVIS Executor](../savis-executor/README.md) owns provider-offer
  acquisition, review state, refresh tasks, and task history.

## Product Areas

| Area              | Route                   | Backend         | Purpose                                                                                   |
| ----------------- | ----------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| Dashboard         | `/` and `/dashboard`    | Local demo data | Displays the current dashboard shell, charts, cards, and table.                           |
| Products          | `/catalog-products`     | SAVIS API       | Manages sellable products, categories, BOM references, pricing analysis, and publication. |
| BOM compositions  | `/boms`                 | SAVIS API       | Lists, searches, creates, edits, prices, and deletes technical BOMs.                      |
| BOM components    | `/bom-components`       | SAVIS Executor  | Reviews and manages acquired provider offers used as BOM components.                      |
| Acquisition tasks | `/bom-components/tasks` | SAVIS Executor  | Inspects offer collection and refresh tasks.                                              |
| Activity rates    | `/activity-rates`       | SAVIS API       | Configures global hourly rates used in BOM activity costs.                                |

The interface is currently presented in French.

## Business Flows

### Manage Technical BOMs

The BOM area manages generic technical compositions. A BOM can represent a
recipe, packaging, utensils, decoration, an activity-backed resource, or
another reusable composition.

Users can:

- list and search BOMs by name, description, instructions, or component name;
- create or edit a BOM in a route-driven dialog;
- define general information, image, instructions, and yield;
- add components with quantity and unit;
- select an optional available provider offer for each component;
- add sequenced production activities and their duration;
- inspect the cost returned by SAVIS API;
- delete a BOM.

The supported form units are `portion`, `piece`, `g`, `kg`, `l`, and `ml`.
Preparation and cooking activities are provided by default. Additional
activities can use preparation, cooking, assembly, packaging, installation,
delivery, cleanup, or custom types.

New unsaved BOMs are stored in browser `localStorage` under the `bom-draft`
key. Closing a form with a draft lets the user keep or discard it.

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

The `/bom-components` page calls SAVIS Executor directly and displays offers
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

The `/bom-components/tasks` page displays:

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
- category;
- product type;
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

Categories are selected through a searchable combobox. When the entered
category does not exist, it can be created and selected directly from that
field.

The product form treats:

- `productBoms` as the common base composition;
- choice-option BOMs as the cost of a selected flavor or choice;
- ingredient-option BOMs as the cost of a customizable extra.

Users can run a configuration analysis or a worst-case analysis. The UI
displays cost, margin, status, completeness, and recommended price information.
A recommended price is advisory and is never copied automatically into the
sale price.

Products marked for publication are explicitly sent through:

```text
POST /api/catalog/products/publish
```

SAVIS API remains responsible for the customer-facing Supabase projection.
SAVIS Admin never writes to Supabase directly.

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

## Routing and Layout

The application uses React Router's data router through
`createBrowserRouter()`.

- `MainLayout` owns the sidebar, header, breadcrumb area, toast host, and route
  outlet.
- BOM creation and editing use `/boms/add` and `/boms/:id`, rendered as an
  always-open dialog above the shared layout.
- `/boms/:id` uses a route loader to fetch the selected BOM.
- `/bom-components/tasks` is a nested child route of `/bom-components`.
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
- `["catalog-categories"]`.

### URL State

BOM component and acquisition-task pagination and sorting use URL search
parameters. This makes list state navigable and preserves it in browser
history.

### Local State

Dialog forms use component state. Only the new BOM draft is persisted in
`localStorage`; there is no general client-side persistence layer.

## Backend Integration

Two Axios clients are defined in `src/shared/api/index.ts`:

| Client        | Base URL                                                 | Used for                                                                         |
| ------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `api`         | `${VITE_API_URL}/api`                                    | BOMs, supply offers, activity rates, catalog products, pricing, and publication. |
| `executorApi` | `VITE_EXECUTOR_API_URL`, default `http://localhost:8000` | Executor offers and tasks.                                                       |

### SAVIS API Endpoints

The frontend currently calls:

```text
GET    /api/boms
GET    /api/boms/{id}
GET    /api/boms/{id}/price
POST   /api/boms
DELETE /api/boms/{id}

GET    /api/supply/offers

GET    /api/activity-rates
POST   /api/activity-rates
PUT    /api/activity-rates/{activityType}
DELETE /api/activity-rates/{activityType}

GET    /api/catalog/products
POST   /api/catalog/products
PUT    /api/catalog/products/{id}
DELETE /api/catalog/products/{id}
POST   /api/catalog/products/{id}/pricing-analysis
GET    /api/catalog/products/{id}/worst-case-pricing
POST   /api/catalog/products/publish

GET    /api/catalog/categories
POST   /api/catalog/categories
PUT    /api/catalog/categories/{id}
```

### Executor Endpoints

The frontend currently calls:

```text
GET    /offers
GET    /offers/facets/search-terms
PATCH  /offers/{id}
DELETE /offers/{id}

GET    /tasks
POST   /tasks
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
VITE_API_URL=http://localhost:8080
VITE_EXECUTOR_API_URL=http://localhost:8000
```

`VITE_API_URL` is required because the Java API client does not define a
fallback. `VITE_EXECUTOR_API_URL` is optional in local development and defaults
to `http://localhost:8000`.

Vite environment variables are compiled into the static frontend bundle. For a
production image, provide them during the image build rather than expecting a
static Nginx container to read changed values at runtime.

## Local Development

Requirements:

- Node.js 22, matching the Docker image;
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
- `production`: static assets served by Nginx on port 80.

Run the complete SAVIS environment from the repository root:

```bash
docker compose up --build
```

The root Compose configuration exposes SAVIS Admin at
`http://localhost`.

## Tests

The current Vitest suite covers:

- BOM draft storage;
- BOM form behavior;
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

Catalog, activity-rate, routing, and dashboard behavior do not yet have
dedicated frontend tests.

## Current Boundaries

- Authentication and authorization are not implemented in SAVIS Admin.
- The dashboard is still backed by local demonstration data.
- The frontend relies on backend validation for business invariants.
- SAVIS Admin does not connect directly to PostgreSQL, RabbitMQ, provider
  websites, or Supabase.
