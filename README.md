# Local Market Opportunity Analyzer

A web-based MVP that helps identify potential business opportunities in different locations across Bangalore.

The application displays opportunity locations on an interactive map and provides information such as:

- Business category
- Opportunity location
- Suitability score
- Estimated local rent/site price
- Local-area information
- Category-specific opportunity markers
- Different colors for different business categories

---

## Requirements

Install these before running the project:

- Node.js
- npm
- Python 3 (only required for the optional scoring script)

You do NOT need PostgreSQL to run the current web application.

---

# How to Run the Project

## Step 1 — Open the Project

Open Command Prompt and go to the project folder.

Example:

```bat
cd /d "C:\Projects\lmoa_mvp"


Step 2 — Start the Backend

Open Command Prompt and run:

cd /d "C:\Projects\lmoa_mvp\backend\express"
npm install
npm start

You should see:

LMOA Express backend running at http://localhost:4000
POST /api/opportunities/compute to compute scores

Keep this Command Prompt window open.

The backend runs at:

http://localhost:4000
Step 3 — Start the Frontend

Open a SECOND Command Prompt window.

Run:

cd /d "C:\Projects\lmoa_mvp\frontend\react"
npm install
npm start

The project uses Parcel, so Parcel will start the React application and normally open the browser automatically.

If the browser does not open automatically, use the localhost address shown in the terminal.

Step 4 — Use the Application

Once the backend and frontend are running, open the Local Market Opportunity Analyzer in your browser.

The application allows you to:

View the Bangalore map
View available opportunity locations
Filter opportunities by business category
View different category-specific markers
Click opportunity locations
View suitability scores
View estimated rent/site prices
View additional local-area information

Keep both Command Prompt windows open while using the application.

Quick Start Summary

You need TWO Command Prompt windows.

Terminal 1 — Backend
cd /d "C:\Projects\lmoa_mvp\backend\express"
npm install
npm start
Terminal 2 — Frontend
cd /d "C:\Projects\lmoa_mvp\frontend\react"
npm install
npm start

Then use the application in your browser.

Optional: Run the Standalone Scoring Script

The project also includes a standalone Python scoring script.

From the project root:

cd /d "C:\Projects\lmoa_mvp"
python scripts\score.py data\sample_businesses.csv data\sample_survey.json

This runs the scoring process without starting the web application.

This step is optional and is not required for running the main web application.

Project Structure
Local Market Opportunity Analyzer
│
├── backend/
│   └── express/
│       ├── index.js
│       ├── package.json
│       └── ...
│
├── frontend/
│   └── react/
│       ├── public/
│       │   └── index.html
│       ├── src/
│       │   └── ...
│       └── package.json
│
├── data/
│   ├── sample_businesses.csv
│   └── sample_survey.json
│
├── scripts/
│   └── score.py
│
├── opportunities.json
├── schema.sql
└── README.md
Technologies Used
Frontend
React
React DOM
React-Leaflet
Leaflet
Parcel
Backend
Node.js
Express.js
CORS
Multer
CSV Parse
Data / Scoring
CSV
JSON
Python
Backend API

The backend provides the opportunity computation endpoint:

POST /api/opportunities/compute

Backend address:

http://localhost:4000

The frontend communicates with the backend to compute and display opportunity results.

Database

The repository contains:

schema.sql

which contains a PostgreSQL database schema for the project.

The current MVP does NOT require PostgreSQL to run the web application.

The current backend works with the project's included data files.

Troubleshooting
npm is not recognized

Install Node.js and npm, then close and reopen Command Prompt.

Backend does not start

Make sure you are inside:

backend\express

Then run:

npm install
npm start

The backend should show:

LMOA Express backend running at http://localhost:4000
Frontend does not start

Make sure you are inside:

frontend\react

Then run:

npm install
npm start
The browser does not open

Check the Parcel output in the frontend terminal.

Open the localhost address shown by Parcel manually.

The map or opportunities do not load

Make sure the backend is running first.

The backend must be available at:

http://localhost:4000

Then restart the frontend.

Important

The project should be run with BOTH:

Backend
+
Frontend

The backend Command Prompt and frontend Command Prompt should remain open while using the application.

Author

KM Chandan Kumar


