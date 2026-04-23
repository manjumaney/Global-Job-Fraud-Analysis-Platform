import React from "react";

type ConsentNoticeProps = {
  consent: boolean;
  onChange: (value: boolean) => void;
};

export default function ConsentNotice({ consent, onChange }: ConsentNoticeProps) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <input
          id="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <div>
          <label htmlFor="consent" className="text-sm font-medium text-slate-800">
            I agree that anonymized and processed input data may be used for research and dataset improvement purposes.
          </label>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Submitted data is processed to generate fraud risk predictions. If consent is provided,
            anonymized and non-sensitive features may be used to improve the model and support
            research on recruitment fraud patterns.
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Do not submit confidential, personal, or sensitive information. Raw identifying details
            should be avoided wherever possible.
          </p>
        </div>
      </div>
    </section>
  );
}