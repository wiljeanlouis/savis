# SAVIS repository guidance

## Frontend structure

- Prefer small, focused React components organized within their feature over large monolithic `.tsx` files.
- When a page or editor contains distinct sections, extract those sections and reusable field groups into named components. Keep page and editor containers focused on orchestration, state, and data flow.
- Follow the component organization already used in `savis-admin/src/features/bom` and `savis-admin/src/features/bom-component`.
