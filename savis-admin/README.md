# SAVIS Admin

**SAVIS Admin** is the React/Vite back-office UI for [SAVIS](../README.md). It uses the [SAVIS API](../savis-api/README.md) as its business backend and the executor API for executor-side offer review screens.

## Main Features

- BOM list and form.
- BOM component entry with quantity, unit, and optional selected provider offer.
- Activity entry for production work such as preparation, cooking, assembly, packaging, installation, delivery, cleanup, or custom work.
- Activity-rate management for global hourly rates by activity type.
- Yield entry using the shared unit symbols (`portion`, `piece`, `g`, `kg`, `l`, `ml`).
- BOM component review, validation, editing, deletion, and manual offer retrieval backed by the executor API.
- Executor task monitoring as a child workflow of BOM component management.
- Catalog product and category management, including common Product BOM references and pricing analysis.

## BOM Form

The BOM form edits a generic BOM model:

- BOM components in the UI map to BOM `components` in the API.
- Each component can store `selectedOfferId`.
- The form searches `/api/supply/offers?componentName=...` once the user enters a component name.
- Available offers are shown in a rich shadcn/Radix dropdown with image, name, price, package size, and provider.
- Once selected, the offer appears in the component row with the same compact summary and a `Voir` link to the provider product page.

The product link is built from `provider.site` plus `offer.url`.

## Activity Rates

The activity-rate page is available at `/activity-rates`.

It manages the global hourly rates used by the Java API when calculating BOM activity costs:

- list configured `ActivityRate` rows;
- add a rate for an unconfigured `ActivityType`;
- edit the hourly rate and currency for an existing type;
- delete an activity-rate configuration.

The page uses one modal component for both creation and update. It calls the Java API through:

- `GET /api/activity-rates`
- `POST /api/activity-rates`
- `PUT /api/activity-rates/{activityType}`
- `DELETE /api/activity-rates/{activityType}`

## BOM Components and Retrieval Tasks

The BOM component feature is available at `/bom-components`. It lists executor
offers of every supported component type, not only food offers. Users can:

- request offer retrieval by component name and type;
- validate, reject, edit, or delete a component offer;
- inspect the executor tasks created for retrieval and refresh operations.

Tasks are a technical detail of BOM component acquisition. Their code is
therefore colocated under:

```text
src/features/bom-component/task/
  api/
  components/
  hooks/
  pages/
  types.ts
```

React Router exposes the task list as the nested route
`/bom-components/tasks`. Breadcrumbs return to `/bom-components`, and the BOM
component sidebar entry remains active on the task page. Pagination and sorting
are stored in URL search parameters. Task payloads and error messages are shown
in full with line wrapping.

## Catalog

The product catalog page is available at `/catalog-products`.

The product form manages:

- product categories, with category creation directly from the searchable category combobox;
- one or more common `ProductBom` references with decimal quantities and display order;
- purchase modes and their sale prices;
- optional BOM references for choice options and ingredient extras;
- pricing analysis and worst-case analysis;
- explicit publication of products marked for publication.

Common Product BOMs represent the base configuration for every sale. Choice
BOMs and ingredient BOMs remain attached to their respective customer options.
The UI treats recommended prices as information only and never applies them
automatically.

## API Configuration

The shared API clients are configured in `src/shared/api`:

- `api`: Java API base URL, expected as `${VITE_API_URL}/api`.
- `executorApi`: executor API base URL, defaulting to `http://localhost:8000`.

## Development

```bash
npm install
npm run dev
npm run build
npm run test
npm run lint
```

When running locally, the Java API is expected to be available through `VITE_API_URL`, and the admin dev server usually runs on `http://localhost:5173`.
