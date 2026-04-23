from pathlib import Path
import pandas as pd
import re
from hashlib import sha256

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DATA_DIR.mkdir(exist_ok=True)

CONSENT_FILE = DATA_DIR / "collected_dataset.csv"


def sanitize_text(text: str) -> str:
    if not isinstance(text, str):
        return ""

    text = re.sub(r"\b[\w\.-]+@[\w\.-]+\.\w+\b", "[email_removed]", text)
    text = re.sub(r"\b(?:\+?\d[\d\-\s]{7,}\d)\b", "[phone_removed]", text)
    text = re.sub(r"https?://\S+|www\.\S+", "[url_removed]", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text[:2000]


def hash_value(value: str) -> str:
    value = value or ""
    return sha256(value.encode("utf-8")).hexdigest()


def build_safe_record(row, explanations: list[str], source_type: str) -> dict:
    return {
        "source_type": source_type,
        "title_clean": sanitize_text(str(row.get("title", "")))[:200],
        "description_clean": sanitize_text(str(row.get("description", ""))),
        "company_hash": hash_value(str(row.get("company_profile", ""))),
        "location_clean": sanitize_text(str(row.get("location", "")))[:200],
        "salary": str(row.get("salary", ""))[:50],
        "salary_range": str(row.get("salary_range", ""))[:50],
        "required_experience": sanitize_text(str(row.get("required_experience", "")))[:150],
        "employment_type": sanitize_text(str(row.get("employment_type", "")))[:100],
        "country": sanitize_text(str(row.get("country", "")))[:100],
        "desc_len": int(row.get("desc_len", 0)),
        "word_count": int(row.get("word_count", 0)),
        "vocab_diversity": float(row.get("vocab_diversity", 0.0)),
        "employer_transparency": int(row.get("employer_transparency", 0)),
        "urgency_flag": int(row.get("urgency_flag", 0)),
        "salary_present": int(row.get("salary_present", 0)),
        "location_present": int(row.get("location_present", 0)),
        "fraud_score": float(row.get("fraud_score", 0.0)),
        "prediction_label": str(row.get("prediction_label", "")),
        "risk_level": str(row.get("risk_level", "")),
        "warning_signals": " | ".join(explanations),
    }


def store_consented_record(row, explanations: list[str]) -> None:
    safe_record = build_safe_record(row, explanations, source_type="single_input")
    df = pd.DataFrame([safe_record])

    if CONSENT_FILE.exists():
        df.to_csv(CONSENT_FILE, mode="a", header=False, index=False)
    else:
        df.to_csv(CONSENT_FILE, index=False)


def store_consented_csv_rows(df: pd.DataFrame):
    import os

    file_path = "data/collected_dataset.csv"
    os.makedirs("data", exist_ok=True)

    # Keep only clean columns
    safe_cols = [
        "title",
        "description",
        "country",
        "fraud_score",
        "risk_level"
    ]

    df_to_save = df[safe_cols].copy()

    # Append with header check
    if not os.path.exists(file_path):
        df_to_save.to_csv(file_path, index=False)
    else:
        df_to_save.to_csv(file_path, mode='a', header=False, index=False)

    return len(df_to_save)