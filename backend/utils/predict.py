from __future__ import annotations

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from scipy.sparse import hstack
from utils.features import add_engineered_features
import sys

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / 'saved_models'

ARTIFACTS_PATH = MODEL_DIR / 'artifacts.joblib'
MODEL_PATH = MODEL_DIR / 'model.joblib'

DEFAULT_FEATURE_COLS = ['description', 'desc_len', 'word_count', 'vocab_diversity', 'employer_transparency']
DEFAULT_THRESHOLD = 0.65



def _to_dense(X):
    if hasattr(X, "toarray"):
        return X.toarray()
    return np.asarray(X)

sys.modules["__main__"]._to_dense = _to_dense

def _load_artifacts():
    if ARTIFACTS_PATH.exists():
        return joblib.load(ARTIFACTS_PATH)
    return {
        'feature_cols': DEFAULT_FEATURE_COLS,
        'threshold': DEFAULT_THRESHOLD,
        'tfidf_vectorizer': None,
        'numeric_cols': ['desc_len', 'word_count', 'vocab_diversity', 'employer_transparency']
    }


def _load_model():
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    return None


ARTIFACTS = _load_artifacts()
MODEL = _load_model()
THRESHOLD = ARTIFACTS.get('threshold', DEFAULT_THRESHOLD)
TFIDF_VECTORIZER = ARTIFACTS.get('tfidf_vectorizer')
NUMERIC_COLS = ARTIFACTS.get('numeric_cols', ['desc_len', 'word_count', 'vocab_diversity', 'employer_transparency'])


def _heuristic_probability(df: pd.DataFrame) -> np.ndarray:
    score = (
        0.18 * (df['desc_len'] < 80).astype(float)
        + 0.22 * (1 - df['employer_transparency']).astype(float)
        + 0.16 * df['urgency_flag'].astype(float)
        + 0.08 * (1 - df['salary_present']).astype(float)
        + 0.08 * (1 - df['location_present']).astype(float)
        + 0.12 * (df['word_count'] < 25).astype(float)
    )
    return np.clip(score + 0.12, 0.02, 0.95).to_numpy()


def predict_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = add_engineered_features(df)
    df = df.copy()
    # 🔥 SAFETY FIX (add before model prediction)
    for col in ARTIFACTS.get("feature_cols", []):
        if col not in df.columns:
            df[col] = ""

    # 🔥 ENGINEERED FEATURE SAFETY
    for col in ["urgency_flag", "salary_present", "location_present", "employer_transparency"]:
        if col not in df.columns:
            df[col] = 0

    if MODEL is not None and TFIDF_VECTORIZER is not None:
        text_x = TFIDF_VECTORIZER.transform(df['description'])
        num_x = df[NUMERIC_COLS].fillna(0).to_numpy()
        x = hstack([text_x, num_x])
        probs = MODEL.predict_proba(x)[:, 1]
    elif MODEL is not None:
        x = df[DEFAULT_FEATURE_COLS]
        probs = MODEL.predict_proba(x)[:, 1]
    else:
        probs = _heuristic_probability(df)

    df['fraud_score'] = probs
    df['risk_pred'] = (df['fraud_score'] >= THRESHOLD).astype(int)
    df['prediction_label'] = df['risk_pred'].map({0: 'Likely Genuine', 1: 'Potentially Fraudulent'})

    def bucket(p: float) -> str:
        if p < 0.40:
            return 'Low'
        if p < 0.70:
            return 'Medium'
        return 'High'

    df['risk_level'] = df['fraud_score'].apply(bucket)
    return df
