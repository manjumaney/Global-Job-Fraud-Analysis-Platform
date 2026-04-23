# Global Job Fraud Analysis Platform

This project focuses on detecting potentially fraudulent job postings and analyzing job datasets using machine learning.

It started as part of a Data Analysis with Python course during my Master’s in Computer Science. The initial phase (data exploration and model training) was done as a group project. Later, I extended it independently by building a full web application and adding additional features based on feedback from my professor.


## Live Demo

* Frontend: http://global-job-fraud-analysis-platform-ten.vercel.app/
* Backend API: https://global-job-fraud-analysis-platform.onrender.com


## What this project does

* Lets users check if a job posting looks suspicious
* Allows uploading CSV files to analyze large job datasets
* Shows fraud risk, trends, and common warning signals
* Explains why a job is flagged (not just the result)
* Lets users download analyzed results
* Optionally collects anonymized data for future improvement


## How it works (simple explanation)

* Job descriptions are converted into features using **TF-IDF**
* Additional features are created like:

  * description length
  * word count
  * transparency indicators
  * urgency-related words
* A **Logistic Regression model** predicts fraud probability
* Results are categorized into:

  * Low risk
  * Medium risk
  * High risk

If the model is unavailable, a fallback heuristic is used so the system still works.


## Project structure

```text
frontend/   → React + Vite UI (deployed on Vercel)
backend/    → Flask API (deployed on Render)
```


## Tech stack

**Frontend**

* React (TypeScript)
* Vite
* Tailwind CSS
* Recharts

**Backend**

* Flask
* Pandas / NumPy
* Scikit-learn
* Imbalanced-learn
* Joblib


## Features

### Single job analysis

* Enter job details manually
* Get fraud score + explanation


### CSV dataset analysis

* Upload CSV file
* View:

  * fraud rate
  * risk distribution
  * warning signals
  * flagged postings


### Data exploration tools

* Search inside dataset
* Filter by risk level
* Sort by fraud score
* View explanation signals



### Export

* Download full analyzed dataset
* Export filtered results



### Consent-based data collection

* Users can allow anonymized data storage
* Used for improving the model later



## Deployment

* Frontend → Vercel
* Backend → Render

Frontend uses this environment variable:

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```


## Notes on storage

* Uploaded CSV files are **not stored permanently**
* They are processed in memory
* If consent is enabled, only selected fields are saved
* On cloud (Render), storage is temporary unless upgraded


## Things I plan to improve

* Add database (PostgreSQL) for persistent storage
* Improve model with more datasets
* Add user authentication
* Build a dataset explorer page


