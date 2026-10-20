# LMOA 2.1 feature guide

## Overview dashboard
Summarizes demo areas and business records, displays locality score rankings on a Leaflet map, and provides category filters and score-weight controls.

## Competitor explorer
Filters the included synthetic business records. The records are examples only, not verified listings.

## Compare locations (new in 2.1)
Select up to three areas and compare their overall score, component indicators, nearby business counts and illustrative rent using the same selected category and current scoring weights.

## Financial feasibility lab
Uses user inputs to calculate monthly revenue, gross profit, operating profit, break-even customer volume and a simplified payback estimate. It now includes conservative, expected and optimistic sensitivity scenarios. Conservative and optimistic assumptions are intentionally simple and should be edited to match a real business case.

## Provenance
API records expose `dataStatus: illustrative_demo`, source labels and verification flags. No bundled record is marked verified. `lastUpdated` is null because the demo data is not live-ingested; the application must not present a fresh timestamp as evidence of freshness.

## Reports
Browser print-to-PDF report includes the top-ranked areas and methodology caveats. It remains based on the current selected analysis.

## Limitations
No live business provider is connected. The opportunity score is a deterministic heuristic, not trained ML. The app does not validate real customer demand, true rental rates, legal permissions, foot traffic or commercial viability.
