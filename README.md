# LMOA 2.1 — Local Market Opportunity Analyzer

A full-stack portfolio project for exploring illustrative local-business opportunities. LMOA combines a React dashboard, Express API, Leaflet map, explainable weighted scoring, competitor explorer, multi-location comparison, financial feasibility scenarios and printable market reports.

> **Data integrity warning:** The bundled businesses and area indicators are synthetic illustrative demo data. They are not verified listings, measured demand, actual rents or commercial advice. Scores are deterministic heuristics, not machine-learning predictions. Replace the dataset with properly licensed, verified data before making real-world decisions.

## What's new in 2.1
- Explicit source/provenance metadata and `illustrative_demo` data status in API responses.
- Location comparison view for up to three neighborhoods, reusing the existing score calculations.
- Conservative, expected and optimistic financial scenarios (customer volume ±20%, gross margin ±5 percentage points).
- Stronger validation for financial input values and consistent 400 errors for invalid scenarios.
- Expanded tests for score ordering, data provenance, weight normalization and financial sensitivity.
- GitHub Actions workflow runs tests and the production build.

## Stack
- React 18 + Vite
- Express REST API
- Leaflet / React-Leaflet with OpenStreetMap tiles
- Recharts for analytics
- Node.js built-in test runner

## Requirements
- Node.js 20 LTS recommended (18.18+ should work)
- npm
- Internet connection to install dependencies and load map tiles

## Run on Windows (Command Prompt)
Extract the ZIP, open **Command Prompt**, and run:

```bat
cd /d "%USERPROFILE%\Downloads\lmoa-2.1"
npm install
npm run dev
```

Open the frontend URL shown in the terminal (normally `http://localhost:5173`). The API runs at `http://localhost:4000`.

If the extracted folder name differs, use that folder name in the `cd` command. To run separately, open two CMD windows:

```bat
npm run dev:api
```

```bat
npm run dev:web
```

## Verify before publishing

```bat
npm test
npm run build
```

Health check: `http://localhost:4000/api/health`

## API
- `GET /api/health` — health and version
- `GET /api/businesses` — illustrative business records and provenance labels
- `GET /api/areas` — illustrative area indicators
- `GET /api/analysis?category=Cafe` — ranked areas for a category
- `POST /api/analysis` — recalculate with category and custom weights
- `POST /api/feasibility` — financial estimate and three sensitivity scenarios

### Example scoring request

```json
{
  "category": "Cafe",
  "weights": {
    "demand": 0.35,
    "competition": 0.25,
    "affordability": 0.20,
    "accessibility": 0.12,
    "growth": 0.08
  }
}
```

Weights are normalized by the API; relative proportions are used. All-zero weights fall back to a neutral denominator, so use at least one positive weight for meaningful output.

### Financial scenario assumptions
The expected case uses the supplied customer count and gross margin. The conservative case reduces customers/day by 20% and margin by 5 percentage points; the optimistic case increases them by 20% and 5 percentage points. These are simple sensitivity examples, not statistically derived forecasts.

## Scoring methodology
The score is a weighted sum of five 0–100 indicators: demand, competition gap, affordability, accessibility and growth. Competition gap is estimated from the number of same-category demo records within 1.25 km. All bundled indicator values are synthetic. The UI's confidence percentage is a heuristic display signal, not a statistical confidence interval.

## Project structure

```text
lmoa-2.1/
├── .github/workflows/ci.yml
├── backend/index.js
├── backend/index.test.js
├── data/businesses.json
├── docs/FEATURES.md
├── frontend/src/main.jsx
├── frontend/src/styles.css
├── frontend/index.html
├── frontend/package.json
└── package.json
```

## Next steps for a real deployment
1. Replace synthetic records with appropriately licensed real datasets and preserve source, license, retrieval time and geographic coverage.
2. Add a persistent database only when saved analyses and data volume require it.
3. Add authentication, authorization, rate limiting, deployment secrets and backups before public use. Configure `CORS_ORIGIN` in the backend deployment environment to the deployed frontend origin(s); defaults are for local development. For a deployed frontend, create `frontend/.env.local` with `VITE_API_URL=https://your-api-host/api` before building (do not commit deployment secrets).
4. Evaluate score behavior against representative data and known outcomes before describing it as predictive.
