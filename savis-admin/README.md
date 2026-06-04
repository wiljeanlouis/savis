# SAVIS Admin

**SAVIS Admin** is the React/Vite back-office UI for [SAVIS](../README.md). It uses the [SAVIS API](../savis-api/README.md) as its business backend and the executor API for executor-side offer review screens.

## Main Features

- BOM/recipe list and form.
- Component entry with quantity, unit, and optional selected provider offer.
- Activity entry for production work such as preparation, cooking, assembly, packaging, installation, delivery, cleanup, or custom work.
- Activity-rate management for global hourly rates by activity type.
- Yield entry using the shared unit symbols (`portion`, `piece`, `g`, `kg`, `l`, `ml`).
- Offer review/ingredient screens backed by the executor API.

## BOM Form

The BOM/recipe form edits a generic BOM model:

- `ingredients` in the UI map to BOM `components` in the API.
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
