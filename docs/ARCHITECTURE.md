# LMOA 2.1 architecture notes

## Request flow
1. React/Vite renders the dashboard and asks the Express REST API for businesses and ranked areas.
2. Express loads the bundled synthetic dataset and illustrative area indicators.
3. The deterministic scoring function normalizes five factor weights and returns component values, sorted scores and explicit demo-data provenance.
4. The comparison view reuses those returned results; it does not maintain a second scoring implementation.
5. The feasibility endpoint validates inputs and returns an expected result plus conservative and optimistic sensitivity cases.
6. The browser print dialog is used for report export.

## Key design decisions
- The scoring engine is deterministic and independent of the UI.
- Data provenance is explicit. Demo records have `dataStatus: illustrative_demo`, `verified: false` and no fabricated ingestion timestamp.
- Financial sensitivity scenarios are transparent rule-based variations, not probability estimates or forecasts.
- The frontend can be configured with `VITE_API_URL`; local development defaults to `http://localhost:4000/api`.
- GitHub Actions executes tests and the production build on pushes and pull requests.

## Current limitations
- No live market-data provider or persistent database is connected.
- Demo indicators are not validated against real commercial outcomes.
- No authentication or user-specific saved workspace exists.
- Production deployment still requires appropriate CORS restrictions, secrets/configuration, monitoring, rate limits, backups and a licensed data plan.
