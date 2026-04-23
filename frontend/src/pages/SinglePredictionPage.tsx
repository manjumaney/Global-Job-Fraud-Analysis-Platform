import React, { useMemo, useState } from "react";
import ConsentNotice from "../components/ConsentNotice";

type PredictionResponse = {
  fraud_score: number;
  prediction_label: string;
  risk_level: string;
  explanations: string[];
  quality_checks: {
    description_length: string;
    salary_provided: string;
    company_info: string;
    location_provided: string;
    experience_provided: string;
  };
  interpretation: string;
  next_steps: string[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export default function SinglePrediction() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company: "",
    location: "",
    salary: "",
    experience: "",
    employment_type: "",
    country: "Canada",
  });

  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");

  const scorePercent = useMemo(() => {
    if (!result) return 0;
    return Math.round(result.fraud_score * 100);
  }, [result]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          consent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Prediction failed.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Single Prediction
        </h1>
        <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
          Enter a job posting and review a model-based fraud score, risk level, and common warning signals.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Job title">
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input"
                placeholder=""
                required
              />
            </Field>

            <Field label="Company name or profile">
              <input
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="input"
                placeholder=""
              />
            </Field>

            <Field label="Location">
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input"
                placeholder=""
              />
            </Field>

            <Field label="Salary">
              <input
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                className="input"
                placeholder="16.60"
              />
            </Field>

            <Field label="Required experience">
              <input
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className="input"
                placeholder=""
              />
            </Field>

            <Field label="Employment type">
              <input
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="input"
                placeholder=""
              />
            </Field>

            <Field label="Country">
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="input"
              >
                <option>Canada</option>
                <option>USA</option>
                <option>India</option>
                <option>Australia</option>
                <option>Other</option>
              </select>
            </Field>
          </div>

          <Field label="Job description" className="mt-5">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input h-[360px] resize-y"
              placeholder="Paste the full job description here..."
              required
            />
          </Field>

          <ConsentNotice consent={consent} onChange={setConsent} />

          <div className="mt-6 flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Run analysis"}
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Prediction result</h2>

          {!result ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
              Submit a posting to view the fraud score, interpretation, and quality checks.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="rounded-3xl bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Fraud score</p>
                <p className="mt-2 text-5xl font-semibold tracking-tight text-slate-900">
                  {scorePercent}%
                </p>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoBox label="Prediction" value={result.prediction_label} />
                <InfoBox label="Risk level" value={result.risk_level} />
              </div>

              <ResultSection title="Common warning signals">
                {result.explanations.length > 0 ? (
                  <ul className="space-y-2">
                    {result.explanations.map((item, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-600">No strong warning signals detected.</p>
                )}
              </ResultSection>

              <ResultSection title="Posting quality checks">
                <div className="grid gap-3 sm:grid-cols-2">
                  <CheckItem label="Description length" value={result.quality_checks.description_length} />
                  <CheckItem label="Salary provided" value={result.quality_checks.salary_provided} />
                  <CheckItem label="Company information" value={result.quality_checks.company_info} />
                  <CheckItem label="Location provided" value={result.quality_checks.location_provided} />
                  <CheckItem label="Experience provided" value={result.quality_checks.experience_provided} />
                </div>
              </ResultSection>

              <ResultSection title="How to read this result">
                <p className="text-sm leading-7 text-slate-600">{result.interpretation}</p>
              </ResultSection>

              <ResultSection title="Suggested next steps">
                <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
                  {result.next_steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </ResultSection>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-800">{label}</label>
      {children}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-lg font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function CheckItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}