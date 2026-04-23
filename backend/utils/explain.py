def generate_explanations(df):
    row = df.iloc[0]
    reasons = []

    desc_len = row.get("desc_len", 0)
    transparency = row.get("employer_transparency", 0)
    score = row.get("fraud_score", 0.0)
    description = str(row.get("description", "")).lower()
    salary = str(row.get("salary", "")).strip()
    location = str(row.get("location", "")).strip()
    experience = str(row.get("required_experience", "")).strip()

    urgency_terms = [
        "urgent", "immediate", "quick money", "earn fast", "start today",
        "limited spots", "no interview", "instant hiring"
    ]

    if transparency == 0:
        reasons.append("Weak company information")
    if desc_len < 120:
        reasons.append("Short or limited job description")
    if not salary:
        reasons.append("Salary information is missing")
    if not location:
        reasons.append("Location details are limited")
    if any(term in description for term in urgency_terms):
        reasons.append("Urgency language detected")
    if score >= 0.7:
        reasons.append("High fraud probability detected")

    return reasons

def build_quality_checks(row):
    desc_len = row.get("desc_len", 0)
    salary = str(row.get("salary", "")).strip()
    company = str(row.get("company_profile", "")).strip()
    location = str(row.get("location", "")).strip()
    experience = str(row.get("required_experience", "")).strip()

    return {
        "description_length": "Good" if desc_len >= 250 else "Limited" if desc_len >= 120 else "Short",
        "salary_provided": "Yes" if salary else "No",
        "company_info": "Present" if len(company) >= 20 else "Limited",
        "location_provided": "Yes" if location else "No",
        "experience_provided": "Yes" if experience else "No",
    }

def build_interpretation(row, explanations):
    score = float(row.get("fraud_score", 0.0))
    prediction = str(row.get("prediction_label", ""))

    if prediction.lower() == "likely genuine" and score < 0.5:
        return (
            "This posting appears closer to genuine examples than strongly suspicious ones. "
            "Even so, the result should be treated as a screening signal rather than a final decision."
        )
    if score < 0.7:
        return (
            "This posting shows a mixed pattern. Some fields look reasonable, while other signals suggest "
            "it should be reviewed more carefully before being trusted."
        )
    return (
        "This posting shares several patterns commonly seen in suspicious or misleading job ads. "
        "It should be reviewed carefully, especially before applying or sharing personal information."
    )

def build_next_steps(row):
    steps = [
        "Verify the company on its official website or trusted business listings.",
        "Check whether the application method and contact details look legitimate.",
        "Compare the posting with similar roles on trusted job platforms.",
    ]

    if str(row.get("salary", "")).strip() == "":
        steps.append("Ask for compensation details before moving forward.")
    if str(row.get("company_profile", "")).strip() == "":
        steps.append("Look for employer background information before applying.")

    return steps