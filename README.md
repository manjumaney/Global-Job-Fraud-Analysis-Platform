# Global Job Fraud Analysis Platform

A portfolio-ready full-stack machine learning project for analyzing suspicious job postings.

## Tech stack
- Frontend: React + TypeScript + Tailwind CSS + Recharts
- Backend: Flask + pandas + scikit-learn
- Model artifacts: joblib

## Features
- Single job posting prediction
- CSV dataset analysis
- Fraud score and risk level
- Human-readable warning signals
- Dashboard-style results page

## Local setup

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Model files
Export your final notebook artifacts into:
- `backend/saved_models/model.joblib`
- `backend/saved_models/artifacts.joblib`

If the model files are missing, the backend still works with a simple heuristic fallback so you can continue UI development.

## Deployment idea
- Frontend: Vercel
- Backend: Render
