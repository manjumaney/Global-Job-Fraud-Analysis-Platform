from __future__ import annotations
import re
import pandas as pd


def extract_salary_range(value: str) -> str:
    value = str(value)
    nums = re.findall(r"\d+(?:\.\d+)?", value)

    if not nums:
        return ""

    if len(nums) >= 2:
        return f"{nums[0]}-{nums[1]}"

    return nums[0]


def clean_colnames(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [str(col).strip().lower() for col in df.columns]
    return df


def process_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = clean_colnames(df)

    # 🔥 FIX 1: Rename FIRST
    column_mapping = {
        "job_title": "title",
        "jobtitle": "title",
        "job description": "description",
        "job_description": "description",
        "company": "company_profile",
        "company name": "company_profile",
        "salary_range": "salary",
        "salaryrange": "salary",
        "salary_estimate": "salary",
    }

    df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns}, inplace=True)

    # 🔥 FIX 2: Fill NaN early
    df = df.fillna("")

    # Required columns
    expected = [
        "title",
        "description",
        "company_profile",
        "location",
        "salary",
        "required_experience",
        "employment_type",
        "country",
    ]

    for col in expected:
        if col not in df.columns:
            df[col] = ""

    # Clean values
    df["title"] = df["title"].astype(str)
    df["description"] = df["description"].astype(str)
    df["company_profile"] = df["company_profile"].astype(str)
    df["location"] = df["location"].astype(str)
    df["salary"] = df["salary"].astype(str)

    # 🔥 REQUIRED FOR MODEL
    df["salary_range"] = df["salary"].apply(extract_salary_range)

    df["required_experience"] = df["required_experience"].astype(str)
    df["employment_type"] = df["employment_type"].astype(str)
    df["country"] = df["country"].astype(str)

    return df