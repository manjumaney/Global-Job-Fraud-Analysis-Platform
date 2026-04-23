from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import traceback

from utils.preprocess import process_dataframe
from utils.predict import predict_dataframe
from utils.explain import (
    generate_explanations,
    build_quality_checks,
    build_interpretation,
    build_next_steps,
)
from utils.storage import store_consented_record, store_consented_csv_rows

app = Flask(__name__)
CORS(app)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# ---------------- SINGLE PREDICTION ----------------
@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        payload = request.get_json(force=True)

        raw = pd.DataFrame([{
            "title": payload.get("title", ""),
            "description": payload.get("description", ""),
            "company_profile": payload.get("company", ""),
            "location": payload.get("location", ""),
            "salary": payload.get("salary", ""),
            "required_experience": payload.get("experience", ""),
            "employment_type": payload.get("employment_type", ""),
            "country": payload.get("country", ""),
        }])

        consent = bool(payload.get("consent", False))

        df = process_dataframe(raw)
        df = predict_dataframe(df)

        explanations = generate_explanations(df)
        quality_checks = build_quality_checks(df.iloc[0])
        interpretation = build_interpretation(df.iloc[0], explanations)
        next_steps = build_next_steps(df.iloc[0])

        if consent:
            store_consented_record(df.iloc[0], explanations)

        row = df.iloc[0]

        return jsonify({
            "fraud_score": float(row["fraud_score"]),
            "prediction_label": str(row["prediction_label"]),
            "risk_level": str(row["risk_level"]),
            "explanations": explanations,
            "quality_checks": quality_checks,
            "interpretation": interpretation,
            "next_steps": next_steps,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------------- CSV ANALYSIS ----------------
@app.route("/api/analyze", methods=["POST"])
def analyze_csv():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        consent = request.form.get("consent", "false").lower() == "true"
        country_override = request.form.get("country", "").strip()

        df = pd.read_csv(file, encoding="latin1")

        if country_override:
            df["country"] = country_override

        df = process_dataframe(df)
        df = predict_dataframe(df)

        total = len(df)
        fraud_count = int((df["risk_pred"] == 1).sum())

        if consent:
            all_explanations = []
            for _, row in df.iterrows():
                single_df = pd.DataFrame([row])
                exp = generate_explanations(single_df)
                all_explanations.append(exp if isinstance(exp, list) else [])
            df["explanations"] = all_explanations

            stored_rows = store_consented_csv_rows(df)
        else:
            stored_rows = 0

        flagged_df = df[df["risk_pred"] == 1].head(20).copy()

        if "explanations" not in flagged_df.columns:
            explanations_list = []
            for _, row in flagged_df.iterrows():
                single_df = pd.DataFrame([row])
                exp = generate_explanations(single_df)
                explanations_list.append(exp if isinstance(exp, list) else [])
            flagged_df["explanations"] = explanations_list

        return jsonify({
            "summary": {
                "total": total,
                "flagged": fraud_count,
                "fraudRate": round((fraud_count / total) * 100, 2) if total else 0,
                "highRisk": int((df["risk_level"] == "High").sum()),
                "mediumRisk": int((df["risk_level"] == "Medium").sum()),
                "lowRisk": int((df["risk_level"] == "Low").sum()),
                "storedRows": stored_rows,
                "avgScore": round(df["fraud_score"].mean() * 100, 2) if total else 0,
            },
            "topSignals": [
                {"signal": "Short descriptions", "count": int((df["word_count"] < 30).sum())},
                {"signal": "Missing salary info", "count": int((df["salary_range"] == "").sum())},
                {"signal": "Urgency language detected", "count": int(df["urgency_flag"].sum())},
                {"signal": "Low employer transparency", "count": int((df["employer_transparency"] < 0.5).sum())}
            ],
            "flaggedRows": flagged_df.to_dict(orient="records"),
            "allRows": df.to_dict(orient="records")
        })

    except Exception as e:
        print("CSV ERROR FULL:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)