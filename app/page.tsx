'use client';

import { useEffect, useMemo, useState } from 'react';
import benchmarkRecords from '@/data/benchmark.json';
import { summarizeBenchmark, type BenchmarkRecord } from '@/lib/benchmark';
import { SiteNav } from '@/components/site-nav';

type Stat = { label: string; value: string; sourceUrl: string; sourceTitle: string };
type Report = { verdict: string; summary: string; strengths: string[]; gaps: string[]; nextSteps: string[] };
type SavedReport = { school: string; program: string; publishedStats: Stat[]; report: Report; retrievedAt: string; gpa: number; simulated?: boolean; globalCoverage?: number; benchmark: ReturnType<typeof summarizeBenchmark> };

type FormState = { school: string; program: string; gpa: string; testScore: string; notes: string };
const examples: FormState[] = [
  { school: 'University of Michigan', program: 'Computer Science', gpa: '3.7', testScore: '326 GRE', notes: 'Undergraduate research and an open-source project.' },
  { school: 'Georgia Tech', program: 'Human-Computer Interaction', gpa: '3.5', testScore: '318 GRE', notes: 'Design internship and accessibility volunteering.' },
  { school: 'University of Washington', program: 'Data Science', gpa: '3.8', testScore: '110 TOEFL', notes: 'Built a forecasting tool for a campus lab.' },
];

const initialForm: FormState = { school: '', program: '', gpa: '', testScore: '', notes: '' };

function formatDate(value: string) { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)); }
function reportText(report: SavedReport) { return `${report.school} — ${report.program}\n\nVANTAGE FIT REPORT\n${report.report.verdict}\n\n${report.report.summary}\n\nPUBLISHED PROGRAM DATA\n${report.publishedStats.map((stat) => `${stat.label}: ${stat.value} (${stat.sourceUrl})`).join('\n') || 'No usable published statistics found.'}\n\nGENERAL HISTORICAL BENCHMARK\n${report.benchmark.percentile}th percentile by GPA in a bundled historical applicant sample. ${report.benchmark.nearbyApplicants ? `${report.benchmark.nearbyAdmits} of ${report.benchmark.nearbyApplicants} nearby-GPA records recorded an admit outcome.` : 'There were no nearby-GPA records in the sample.'}`; }

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [current, setCurrent] = useState<SavedReport | null>(null);
  const [saved, setSaved] = useState<SavedReport[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [helperOpen, setHelperOpen] = useState(false);
  const [percent, setPercent] = useState('');
  const [letter, setLetter] = useState('');
  const benchmark = useMemo(() => summarizeBenchmark(benchmarkRecords as BenchmarkRecord[], Number(form.gpa) || 0), [form.gpa]);

  useEffect(() => { const stored = window.localStorage.getItem('vantage-reports'); if (stored) setSaved(JSON.parse(stored) as SavedReport[]); }, []);
  useEffect(() => { window.localStorage.setItem('vantage-reports', JSON.stringify(saved)); }, [saved]);

  const setField = (key: keyof FormState, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  const applyExample = (example: FormState) => { setForm(example); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const applyGpa = (value: string) => setField('gpa', Math.max(0, Math.min(4, Number(value) || 0)).toFixed(2));

  async function createReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch('/api/fit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, gpa: Number(form.gpa) }) });
      const result = (await response.json()) as SavedReport & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to build report.');
      const next = { ...result, gpa: Number(form.gpa), benchmark: summarizeBenchmark(benchmarkRecords as BenchmarkRecord[], Number(form.gpa)) };
      setCurrent(next); setSaved((previous) => [next, ...previous.filter((item) => !(item.school === next.school && item.program === next.program))]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to build report.'); }
    finally { setLoading(false); }
  }

  function copyReport() { if (current) void navigator.clipboard.writeText(reportText(current)); }
  function toggleSelected(key: string) { setSelected((previous) => previous.includes(key) ? previous.filter((item) => item !== key) : previous.length < 3 ? [...previous, key] : previous); }
  const comparisons = saved.filter((item) => selected.includes(`${item.school}|${item.program}`));

  return <main className="paper-grid min-h-screen">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7 lg:px-10">
      <div className="flex items-center gap-6">
        <img src="/vantage-lockup-light.svg" alt="Vantage" className="h-9 w-auto" />
        <SiteNav />
      </div>
      <div className="hidden text-right sm:block"><div className="eyebrow">Admissions field notes / 2026</div><div className="mt-1 text-xs text-[#6e6a61]">Live evidence. Clear context. No false precision.</div></div>
    </header>

    <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-10 lg:grid-cols-[.83fr_1.17fr] lg:px-10 lg:pt-20">
      <div><div className="stamp">Research brief 01</div><h1 className="serif mt-6 text-5xl font-bold leading-[1.05] tracking-[-.04em] sm:text-7xl">See your fit<br /><span className="text-[#b23a2e]">in context.</span></h1><p className="mt-7 max-w-md text-lg leading-8 text-[#555149]">Vantage combines currently published program information with a separate historical benchmark, so your next step is grounded in what is known — and clear about what is not.</p><div className="mt-9 flex gap-8 border-t border-[#cfc6b7] pt-5 text-xs text-[#6e6a61]"><div><strong className="text-[#1b1b18]">01</strong><br />Live program data</div><div><strong className="text-[#1b1b18]">02</strong><br />Honest synthesis</div><div><strong className="text-[#1b1b18]">03</strong><br />Private by default</div></div></div>
      <form onSubmit={createReport} className="input-panel border border-[#cfc6b7] bg-[#f9f6ef]/70 p-6 shadow-[7px_7px_0_#e2d9cb] sm:p-8"><div className="eyebrow">Build your brief</div><h2 className="serif mt-2 text-3xl font-bold">Start with a program.</h2><p className="mt-2 text-sm text-[#6e6a61]">Your details stay in this browser. Nothing is uploaded for storage.</p>
        <div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold">School<input required value={form.school} onChange={(event) => setField('school', event.target.value)} className="field mt-2" placeholder="e.g. University of Michigan" /></label><label className="text-sm font-bold">Program / department<input required value={form.program} onChange={(event) => setField('program', event.target.value)} className="field mt-2" placeholder="e.g. Computer Science" /></label></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold">Undergraduate GPA<input required type="number" min="0" max="4" step=".01" value={form.gpa} onChange={(event) => setField('gpa', event.target.value)} className="field mt-2" placeholder="0.00 – 4.00" /><button type="button" onClick={() => setHelperOpen((open) => !open)} className="mt-2 text-xs font-bold text-[#b23a2e] underline underline-offset-2">{helperOpen ? 'Hide GPA helper' : 'Need a GPA translation?'}</button></label><label className="text-sm font-bold">Test score <span className="font-normal text-[#6e6a61]">optional</span><input value={form.testScore} onChange={(event) => setField('testScore', event.target.value)} className="field mt-2" placeholder="e.g. 326 GRE" /></label></div>
        {helperOpen && <div className="mt-3 border-l-2 border-[#b23a2e] bg-[#eee7da] p-4 text-sm"><div className="font-bold">Quick translation to a 4.0 scale</div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label>Percentage<input type="number" min="0" max="100" value={percent} onChange={(event) => { setPercent(event.target.value); applyGpa(String((Number(event.target.value) / 100) * 4)); }} className="field mt-1" placeholder="92" /></label><label>Letter average<select value={letter} onChange={(event) => { setLetter(event.target.value); const values: Record<string, number> = { 'A': 4, 'A−': 3.7, 'B+': 3.3, 'B': 3, 'B−': 2.7, 'C+': 2.3, 'C': 2 }; applyGpa(String(values[event.target.value] ?? '')); }} className="field mt-1"><option value="">Choose grade</option>{['A', 'A−', 'B+', 'B', 'B−', 'C+', 'C'].map((grade) => <option key={grade}>{grade}</option>)}</select></label></div><p className="mt-2 text-xs text-[#6e6a61]">A quick estimate for orientation, not an official transcript conversion.</p></div>}
        <label className="mt-5 block text-sm font-bold">Anything we should know? <span className="font-normal text-[#6e6a61]">optional</span><textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} className="field mt-2 min-h-24 resize-y" placeholder="Research, work, context, or questions..." /></label>
        <div className="mt-6"><div className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-[#6e6a61]">Try an example</div><div className="flex flex-wrap gap-2">{examples.map((example) => <button type="button" key={example.school} onClick={() => applyExample(example)} className="secondary-button text-xs">{example.school} / {example.program}</button>)}</div></div>
        {error && <div className="mt-5 border border-[#b23a2e] bg-[#f7e2dc] p-3 text-sm text-[#8f2d24]">{error}</div>}
        <button disabled={loading} className="primary-button mt-6 w-full disabled:cursor-wait disabled:opacity-70">{loading ? 'Researching live sources…' : 'Build my fit report →'}</button>
      </form>
    </section>

    {loading && <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-10"><div className="mb-5 flex items-center gap-3"><div className="skeleton h-4 w-24" /><div className="skeleton h-4 w-40" /></div><div className="grid gap-5 lg:grid-cols-3"><div className="skeleton h-40" /><div className="skeleton h-40" /><div className="skeleton h-40" /></div><div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="skeleton h-64" /><div className="skeleton h-64" /></div></section>}

    {current && !loading && <section className="print-report mx-auto max-w-6xl px-6 pb-20 lg:px-10"><div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#cfc6b7] pb-5"><div><div className="eyebrow">Your field report / {formatDate(current.retrievedAt)}</div><h2 className="serif mt-2 text-4xl font-bold">{current.school}</h2><p className="text-[#6e6a61]">{current.program}</p></div><div className="no-print flex gap-2"><button onClick={copyReport} className="secondary-button">Copy as text</button><button onClick={() => window.print()} className="secondary-button">Save as PDF</button></div></div><div className="grid gap-5 lg:grid-cols-3"><div className="border border-[#cfc6b7] bg-[#f9f6ef] p-5"><div className="eyebrow">Assessment</div><div className="serif mt-3 text-2xl font-bold capitalize">{current.report.verdict}</div><p className="mt-3 text-sm leading-6 text-[#555149]">{current.report.summary}</p></div><div className="border border-[#cfc6b7] bg-[#f9f6ef] p-5"><div className="eyebrow">Published program data</div>{current.publishedStats.length ? <div className="mt-3 space-y-3">{current.publishedStats.map((stat) => <div key={stat.label} className="flex items-start justify-between gap-3 border-b border-[#e1d9cc] pb-2 text-sm"><span className="text-[#6e6a61]">{stat.label}</span><span className="text-right font-bold"><span className="block">{stat.value}</span><a href={stat.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-normal text-[#b23a2e] underline">Source ↗</a></span></div>)}</div> : <p className="mt-3 text-sm text-[#6e6a61]">No usable published statistics were found. The report does not fill the gap.</p>}</div><div className="border border-[#cfc6b7] bg-[#eee7da] p-5"><div className="eyebrow">General historical benchmark</div><div className="serif mt-3 text-4xl font-bold">{current.benchmark.percentile}<span className="text-xl">th</span></div><p className="mt-1 text-sm font-bold">GPA percentile in the bundled sample</p><p className="mt-3 text-xs leading-5 text-[#6e6a61]">General context only — not a prediction for {current.program}. Based on {current.benchmark.sampleSize} historical applicant records.</p>{current.benchmark.nearbyApplicants > 0 && <p className="mt-3 border-t border-[#cfc6b7] pt-3 text-sm">{current.benchmark.nearbyAdmits} of {current.benchmark.nearbyApplicants} nearby-GPA records show an admit outcome.</p>}</div></div><div className="mt-5 grid gap-5 lg:grid-cols-2"><div className="border border-[#cfc6b7] bg-[#f9f6ef] p-6"><div className="eyebrow">Read of the record</div><h3 className="serif mt-2 text-2xl font-bold">What helps / what to close</h3><div className="mt-5 grid gap-5 sm:grid-cols-2"><div><div className="text-xs font-bold uppercase tracking-[.12em] text-[#6e6a61]">Signals in your favor</div><ul className="mt-2 space-y-2 text-sm">{current.report.strengths.map((item) => <li key={item} className="border-l-2 border-[#b23a2e] pl-3">{item}</li>)}</ul></div><div><div className="text-xs font-bold uppercase tracking-[.12em] text-[#6e6a61]">Open questions</div><ul className="mt-2 space-y-2 text-sm">{current.report.gaps.map((item) => <li key={item} className="border-l-2 border-[#6e6a61] pl-3">{item}</li>)}</ul></div></div></div><div className="border border-[#cfc6b7] bg-[#f9f6ef] p-6"><div className="eyebrow">Next moves</div><h3 className="serif mt-2 text-2xl font-bold">Make the next inquiry useful.</h3><ol className="mt-5 space-y-3 text-sm">{current.report.nextSteps.map((item, index) => <li key={item} className="flex gap-3"><span className="font-bold text-[#b23a2e]">0{index + 1}</span><span>{item}</span></li>)}</ol></div></div></section>}

    <section className="saved-panel mx-auto max-w-6xl border-t border-[#cfc6b7] px-6 py-12 lg:px-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow">Private notebook</div><h2 className="serif mt-2 text-3xl font-bold">Saved programs</h2><p className="mt-1 text-sm text-[#6e6a61]">Stored only in this browser. Select up to three for a side-by-side view.</p></div>{selected.length > 1 && <button onClick={() => document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' })} className="primary-button">Compare {selected.length} programs →</button>}</div>{saved.length ? <div className="mt-6 grid gap-3">{saved.map((item) => { const key = `${item.school}|${item.program}`; return <label key={key} className={`flex cursor-pointer items-center justify-between gap-4 border p-4 transition ${selected.includes(key) ? 'border-[#b23a2e] bg-[#f7e2dc]/40' : 'border-[#cfc6b7] bg-[#f9f6ef]'}`}><span className="flex items-center gap-3"><input type="checkbox" checked={selected.includes(key)} onChange={() => toggleSelected(key)} className="accent-[#b23a2e]" /><span><strong>{item.school}</strong><span className="block text-sm text-[#6e6a61]">{item.program}</span></span></span><span className="hidden text-right text-xs text-[#6e6a61] sm:block">GPA {item.gpa.toFixed(2)}<br />{formatDate(item.retrievedAt)}</span></label>; })}</div> : <div className="mt-6 border border-dashed border-[#cfc6b7] p-8 text-center text-sm text-[#6e6a61]">Your saved reports will appear here after your first brief.</div>}</section>

    {comparisons.length > 1 && <section id="comparison" className="mx-auto max-w-6xl px-6 pb-20 lg:px-10"><div className="border-t-2 border-[#1b1b18] pt-5"><div className="eyebrow">Decision desk</div><h2 className="serif mt-2 text-3xl font-bold">Compare programs</h2><div className="mt-6 overflow-x-auto border border-[#cfc6b7] bg-[#f9f6ef]"><table className="w-full min-w-[680px] border-collapse text-left text-sm"><thead><tr className="border-b border-[#cfc6b7]">{['Measure', ...comparisons.map((item) => item.school)].map((heading) => <th key={heading} className="p-4 align-top font-bold">{heading}</th>)}</tr></thead><tbody>{[['Program', ...comparisons.map((item) => item.program)], ['Your GPA', ...comparisons.map((item) => item.gpa.toFixed(2))], ['Assessment', ...comparisons.map((item) => item.report.verdict)], ['Published stats', ...comparisons.map((item) => item.publishedStats.map((stat) => `${stat.label}: ${stat.value}`).join(' / ') || 'Not found')], ['GPA benchmark', ...comparisons.map((item) => `${item.benchmark.percentile}th percentile (general context)`)]] .map((row, index) => <tr key={String(row[0])} className={index % 2 ? 'bg-[#eee7da]/60' : ''}>{row.map((cell, cellIndex) => <td key={`${String(cell)}-${cellIndex}`} className="border-b border-[#e1d9cc] p-4 align-top">{cell}</td>)}</tr>)}</tbody></table></div></div></section>}

    <footer className="border-t border-[#cfc6b7] px-6 py-8 text-center text-xs text-[#6e6a61]"><span className="serif text-base font-bold text-[#1b1b18]">Vantage.</span> A clearer starting point for the questions that matter.</footer>
  </main>;
}
