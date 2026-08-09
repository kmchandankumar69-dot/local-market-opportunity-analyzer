# 🗺️ Local Market Opportunity Analyzer (LMOA)

> A full-stack GIS-based MVP designed to identify, evaluate, and visualize high-potential commercial and retail business opportunities across Bangalore.

![Status](https://img.shields.io/badge/status-active-success.svg)
![MVP](https://img.shields.io/badge/version-MVP-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Overview

The **Local Market Opportunity Analyzer** helps entrepreneurs and analysts explore optimal business locations using an interactive map interface. It processes spatial datasets to evaluate regional viability, matching candidate locations with custom demographic and commercial metrics.

### Key Capabilities
* **Interactive Mapping:** Visualizes opportunity locations across Bangalore using Leaflet and React-Leaflet.
* **Category Filtering:** Color-coded, category-specific map markers to easily distinguish between different business types.
* **Comprehensive Insights:** Instantly view suitability scores, estimated local rent/site prices, and localized area data per pin.
* **Dual Execution Mode:** Run the full web application via local servers or execute computations independently via an optional Python script.

---

## 🛠️ Technology Stack

### Frontend
* **Core:** React.js, React DOM
* **Mapping & GIS:** Leaflet, React-Leaflet
* **Bundler:** Parcel

### Backend & Data Processing
* **API Server:** Node.js, Express.js
* **Middleware:** CORS, Multer, CSV Parse
* **Standalone Script:** Python 3 (for offline scoring pipelines)
* **Database Schema:** PostgreSQL (`schema.sql` included for relational scaling, though **not required** for the MVP runtime)

---

## 📂 Project Structure

```text
Local-Market-Opportunity-Analyzer/
│
├── backend/
│   └── express/              # Node.js & Express REST API
│       ├── index.js
│       └── package.json
│
├── frontend/
│   └── react/                # React SPA bundled with Parcel
│       ├── public/
│       │   └── index.html
│       ├── src/
│       └── package.json
│
├── data/
│   ├── sample_businesses.csv # Candidate business location records
│   └── sample_survey.json    # Market research survey inputs
│
├── scripts/
│   └── score.py              # Standalone Python scoring utility
│
├── opportunities.json
├── schema.sql                # Optional PostgreSQL schema
└── README.md

🚀 Getting Started
Prerequisites
Ensure you have the following installed on your local machine:

Node.js & npm

Python 3 (Optional — only required if running the standalone scoring script)

Step 1 — Start the Backend Server
Open your first Command Prompt window and launch the Express API:

DOS
cd /d "C:\Projects\lmoa_mvp\backend\express"
npm install
npm start
The backend will boot up at http://localhost:4000. Keep this window open.

Step 2 — Start the Frontend Client
Open a second Command Prompt window and launch the React application:

DOS
cd /d "C:\Projects\lmoa_mvp\frontend\react"
npm install
npm start
Parcel will compile the React app and typically open your browser automatically. If it doesn't, navigate to the localhost URL displayed in the terminal. Keep this window open as well.

📊 Optional: Run the Standalone Python Scoring Script
If you want to execute the core data analysis logic directly through Python without firing up the web application:

DOS
cd /d "C:\Projects\lmoa_mvp"
python scripts\score.py data\sample_businesses.csv data\sample_survey.json
🔧 Troubleshooting
Issue	Solution
npm is not recognized	Ensure Node.js is installed correctly, then close and reopen your Command Prompt.
Backend fails to start	Verify you are inside the backend\express directory before running npm install and npm start.
Frontend/Map fails to load	Ensure the backend is running actively at http://localhost:4000 before starting the frontend.
Browser doesn't open	Check the Parcel terminal output for the active http://localhost: address and open it manually.
🛡️ License
Developed by KM Chandan Kumar. This project is available under the MIT License.
