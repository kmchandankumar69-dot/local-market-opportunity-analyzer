// index.js — Express backend for Local Market Opportunity Analyzer (LMOA)
// Place this file at backend/express/index.js and run `npm install` then `npm start`

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csvParse = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'tmp/' });

app.use(cors());
app.use(express.json());

// If you later build the frontend to a dist/ or build/ folder, this will serve it.
// Example: build the frontend into frontend/react/dist and uncomment the lines below.
// const frontendBuildPath = path.join(__dirname, '../../frontend/react/dist');
// if (fs.existsSync(frontendBuildPath)) {
//   app.use(express.static(frontendBuildPath));
//   app.get('*', (req, res) => res.sendFile(path.join(frontendBuildPath, 'index.html')));
// }

const SAMPLE_BUS_CSV = path.join(__dirname, '../../data/sample_businesses.csv');
const SAMPLE_SURVEY_JSON = path.join(__dirname, '../../data/sample_survey.json');

function computeScores(businesses, survey) {
  // Basic scoring engine with safe guards
  const totalResponses = (survey && (survey.total_responses || (survey.responses && survey.responses.length))) || 0;
  const demandCount = {};

  if (survey && Array.isArray(survey.responses)) {
    for (const r of survey.responses) {
      if (Array.isArray(r.interests)) {
        for (const c of r.interests) {
          demandCount[c] = (demandCount[c] || 0) + 1;
        }
      }
    }
  }

  // categories from businesses and survey interests
  const businessCats = Array.isArray(businesses) ? businesses.map(b => b.category).filter(Boolean) : [];
  const categories = Array.from(new Set(businessCats.concat(Object.keys(demandCount))));

  const results = [];
  const BUSINESS_THRESHOLD = 6; // competition normalization
  const WEIGHTS = { demand: 0.35, competition: 0.25, accessibility: 0.15, affordability: 0.15, growth: 0.10 };

  for (const cat of categories) {
    const demand = totalResponses > 0 ? (demandCount[cat] || 0) / totalResponses : 0;
    const businessCount = businesses.filter(b => b.category === cat).length;
    const competitionRatio = Math.min(1, businessCount / BUSINESS_THRESHOLD);

    // placeholders (to replace with real calculations later)
    const accessibility = 0.7;
    const affordability = 0.6;
    const growth = 0.3;

    const score =
      WEIGHTS.demand * demand +
      WEIGHTS.competition * (1 - competitionRatio) +
      WEIGHTS.accessibility * accessibility +
      WEIGHTS.affordability * affordability +
      WEIGHTS.growth * growth;

    results.push({
      category: cat,
      score: Math.round(score * 100) / 100,
      components: {
        demand: Math.round(demand * 1000) / 1000,
        competitionRatio: Math.round(competitionRatio * 1000) / 1000,
        accessibility,
        affordability,
        growth
      }
    });
  }

  // sort descending by score
  results.sort((a, b) => b.score - a.score);
  return results;
}

function parseCsvTextToObjects(csvText) {
  try {
    const records = csvParse.parse(csvText, { columns: true, skip_empty_lines: true });
    // normalize lat/lng to numbers if present
    return records.map(r => {
      if (r.lat) r.lat = parseFloat(r.lat);
      if (r.lng) r.lng = parseFloat(r.lng);
      return r;
    });
  } catch (e) {
    console.error('CSV parse error:', e);
    return [];
  }
}

// POST /api/opportunities/compute
// - Accepts optional file upload named 'businesses' (CSV)
// - Accepts optional survey JSON in body as 'survey' (stringified) or JSON body
app.post('/api/opportunities/compute', upload.single('businesses'), async (req, res) => {
  try {
    // 1) Load businesses: from uploaded CSV or sample file
    let businesses = [];
    if (req.file && req.file.path) {
      const text = fs.readFileSync(req.file.path, 'utf8');
      businesses = parseCsvTextToObjects(text);
      // cleanup temporary file
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
    } else if (fs.existsSync(SAMPLE_BUS_CSV)) {
      const text = fs.readFileSync(SAMPLE_BUS_CSV, 'utf8');
      businesses = parseCsvTextToObjects(text);
    }

    // 2) Load survey: from POST body (as JSON) or sample file
    let survey = null;
    if (req.body) {
      // If survey provided as JSON string in the body field 'survey'
      if (req.body.survey) {
        if (typeof req.body.survey === 'string') {
          try { survey = JSON.parse(req.body.survey); } catch (e) { survey = null; }
        } else {
          survey = req.body.survey;
        }
      } else if (req.body.responses || req.body.total_responses) {
        // body itself might be the survey
        survey = req.body;
      }
    }
    if (!survey && fs.existsSync(SAMPLE_SURVEY_JSON)) {
      try { survey = JSON.parse(fs.readFileSync(SAMPLE_SURVEY_JSON, 'utf8')); } catch (e) { survey = null; }
    }

    // safety: ensure arrays exist
    if (!survey) survey = { area: 'sample', total_responses: 0, responses: [] };
    if (!Array.isArray(survey.responses)) survey.responses = survey.responses ? [survey.responses] : [];

    // 3) Compute scores
    const results = computeScores(businesses, survey);

    // 4) Return JSON
    return res.json({ ok: true, results, meta: { businesses_count: businesses.length, survey_responses: survey.responses.length } });
  } catch (err) {
    console.error('Server error in /api/opportunities/compute:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error', details: err.message });
  }
});

// Helpful test route
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`LMOA Express backend running at http://localhost:${PORT}`);
  console.log('POST /api/opportunities/compute to compute scores (uploads accepted: field name = businesses)');
});
