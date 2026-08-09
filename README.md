# Local Market Opportunity Analyzer — MVP Package

This is a minimal, runnable MVP for the Local Market Opportunity Analyzer.

Included:
- schema.sql — Postgres schema
- backend/express/ — Express demo app with scoring endpoint
- frontend/react/ — Minimal React skeleton with ResultsPage component
- data/sample_businesses.csv
- data/sample_survey.json
- scripts/score.py — standalone scoring script

Quick test without DB:
1. Run the scoring script:
   python3 scripts/score.py data/sample_businesses.csv data/sample_survey.json
2. Start backend (optional):
   cd backend/express
   npm install
   npm start
3. Start frontend (optional):
   cd frontend/react
   npm install
   npm start

