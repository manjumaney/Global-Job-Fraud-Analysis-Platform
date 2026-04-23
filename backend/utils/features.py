from __future__ import annotations

import re
from collections import Counter
import pandas as pd

URGENCY_WORDS = {
    'urgent', 'immediate', 'quick money', 'no interview', 'easy hiring',
    'apply now', 'limited slots', 'earn fast', 'work from home'
}


def urgency_flag(text: str) -> int:
    text_lower = str(text).lower()
    return int(any(term in text_lower for term in URGENCY_WORDS))


def vocab_diversity(text: str) -> float:
    words = re.findall(r'\b\w+\b', str(text).lower())
    if not words:
        return 0.0
    return len(set(words)) / len(words)


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['desc_len'] = df['description'].str.len()
    df['word_count'] = df['description'].str.split().apply(len)
    df['vocab_diversity'] = df['description'].apply(vocab_diversity)
    df['urgency_flag'] = df['description'].apply(urgency_flag)
    df['employer_transparency'] = df['company_profile'].apply(lambda x: int(len(str(x).strip()) > 20))
    df['salary_present'] = df['salary_range'].apply(lambda x: int(bool(str(x).strip())))
    df['location_present'] = df['location'].apply(lambda x: int(bool(str(x).strip())))
    return df
