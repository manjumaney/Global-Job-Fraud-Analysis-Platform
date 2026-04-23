import { Link } from 'react-router-dom'
import { ShieldCheck, Upload, FileSearch } from 'lucide-react'

const features = [
  {
    title: 'Analyze one posting',
    text: 'Enter a job title, description, and a few details to get a fraud score and explanation.',
    icon: ShieldCheck
  },
  {
    title: 'Upload a dataset',
    text: 'Run batch analysis on CSV files and review suspicious rows, warning signals, and fraud trends.',
    icon: Upload
  },
  {
    title: 'Review results clearly',
    text: 'See risk levels, explanations, and summary insights in a dashboard-style experience.',
    icon: FileSearch
  }
]

export default function HomePage() {
  return (
    <>
      <section className="section-shell py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-1 text-sm text-slate-600 shadow-soft">
              Data Analysis on Python + Machine learning
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
              Detect suspicious job postings with a modern fraud analysis workflow.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Analyze individual postings or upload a CSV dataset to identify warning signals, fraud risk patterns, and suspicious job records across countries.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/single" className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
                Analyze one posting
              </Link>
              <Link to="/csv" className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-400">
                Upload CSV dataset
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">What this platform includes</h2>
            <div className="mt-6 space-y-5">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{feature.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell pb-20">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              'Input job posting dettails',
              'Standardize and engineer features',
              'Score postings with the fraud model',
              'Review dashboard insights and flagged rows'
            ].map((step, index) => (
              <div key={step} className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Step {index + 1}</p>
                <p className="mt-2 text-base font-medium text-slate-900">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
