'use client';

import { useEffect, useMemo, useState } from 'react';
import benchmarkRecords from '@/data/benchmark.json';
import { summarizeBenchmark, type BenchmarkRecord } from '@/lib/benchmark';

type Stat = { label: string; value: string; sourceUrl: string; sourceTitle: string };
type RealityReport = {
  standing: string;
  summary: string;
  publishedRange: string;
  focusAreas: string[];
  stretchGoals: string[];
  encouragement: string;
};

type SavedCheck = {
  school: string;
  gradeLevel: string;
  gpa: number;
  publishedStats: Stat[];
  report: RealityReport;
  retrievedAt: string;
  benchmark: ReturnType<typeof summarizeBenchmark>;
};

type FormState = {
  school: string;
  gradeLevel: string;
  gpa: string;
  courses: string;
  activities: string;
  notes: string;
};

const GRADE_LEVELS = ['Year 1 (Freshman)', 'Year 2 (Sophomore)', 'Year 3 (Junior)', 'Year 4 (Senior)'];

const EXAMPLES: FormState[] = [
  { school: 'University of Michigan', gradeLevel: 'Year 2 (Sophomore)', gpa: '3.2', courses: 'AP Biology, Honors English, Algebra 2', activities: 'Soccer team, robotics club', notes: 'Want to study engineering but worried about math grades.' },
  { school: 'UCLA', gradeLevel: 'Year 1 (Freshman)', gpa: '3.5', courses: 'Honors Geometry, Spanish 2', activities: 'Volunteer tutoring, school newspaper', notes: 'First-generation college applicant.' },
  { school: 'New York University', gradeLevel: 'Year 3 (Junior)', gpa: '3.6', courses: 'AP US History, AP Calculus AB, Honors Physics', activities: 'Debate team, part-time job at bookstore', notes: 'Interested in business and politics.' },
];

const INITIAL_FORM: FormState = { school: '', gradeLevel: '', gpa: '', courses: '', activities: '', notes: '' };

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

const STANDING_STYLES: Record<string, { stamp: string; label: string }> = {
  'on track': { stamp: '!text-[#2d6b3e] !border-[#2d6b3e]', label: 'On Track' },
  'gap to close': { stamp: '!text-[#b23a2e] !border-[#b23a2e]', label: 'Gap to Close' },
  'more context needed': { stamp: '!text-[#6e6a61] !border-[#6e6a61]', label: 'More Context Needed' },
};

export function RealityCheck() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [current, setCurrent] = useState<SavedCheck | null>(null);
  const [saved, setSaved] = useState<SavedCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [helperOpen, setHelperOpen] = useState(false);
  const [percent, setPercent] = useState('');
  const [letter, setLetter] = useState('');

  const benchmark = useMemo(() => summarizeBenchmark(benchmarkRecords as BenchmarkRecord[], Number(form.gpa) || 0), [form.gpa]);

  useEffect(() => {
    const stored = window.localStorage.getItem('vantage-reality-checks');
    if (stored) setSaved(JSON.parse(stored) as SavedCheck[]);
  }, []);
  useEffect(() => {
    window.localStorage.setItem('vantage-reality-checks', JSON.stringify(saved));
  }, [saved]);

  const setField = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const applyExample = (example: FormState) => { setForm(example); setError(''); };
  const applyGpa = (value: string) => setField('gpa', Math.max(0, Math.min(4, Number(value) || 0)).toFixed(2));

  async function createCheck(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/reality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, gpa: Number(form.gpa) }),
      });
      const result = (await response.json()) as SavedCheck & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to build reality check.');
      const next: SavedCheck = {
        ...result,
        gpa: Number(form.gpa),
        benchmark: summarizeBenchmark(benchmarkRecords as BenchmarkRecord[], Number(form.gpa)),
      };
      setCurrent(next);
      setSaved((prev) => [next, ...prev.filter((item) => !(item.school === next.school && item.gradeLevel === next.gradeLevel))]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to build reality check.');
    } finally {
      setLoading(false);
    }
  }

  function loadSaved(item: SavedCheck) {
    setCurrent(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteSaved(key: string) {
    setSaved((prev) => prev.filter((item) => `${item.school}|${item.gradeLevel}` !== key));
  }

  const standingStyle = current ? STANDING_STYLES[current.report.standing?.toLowerCase()] ?? STANDING_STYLES['more context needed'] : null;

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
        <form onSubmit={createCheck} className="border border-[#cfc6b7] bg-[#f9f6ef]/70 p-6 shadow-[7px_7px_0_#e2d9cb] sm:p-8">
          <div className="eyebrow">Early reality check</div>
          <h2 className="serif mt-2 text-2xl font-bold">Where do you stand right now?</h2>
          <p className="mt-2 text-sm text-[#6e6a61]">A grounded, honest look at where you are — and what to focus on next. Your details stay in this browser.</p>

          <div className="mt-6 space-y-5">
            <label className="block text-sm font-bold">Target school
              <input required value={form.school} onChange={(e) => setField('school', e.target.value)} className="field mt-2" placeholder="e.g. University of Michigan" />
            </label>
            <label className="block text-sm font-bold">Current grade level
              <select required value={form.gradeLevel} onChange={(e) => setField('gradeLevel', e.target.value)} className="field mt-2">
                <option value="">Choose your year</option>
                {GRADE_LEVELS.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <div>
              <label className="block text-sm font-bold">Current GPA
                <input required type="number" min="0" max="4" step=".01" value={form.gpa} onChange={(e) => setField('gpa', e.target.value)} className="field mt-2" placeholder="0.00 – 4.00" />
              </label>
              <button type="button" onClick={() => setHelperOpen((open) => !open)} className="mt-2 text-xs font-bold text-[#b23a2e] underline underline-offset-2">{helperOpen ? 'Hide GPA helper' : 'Need a GPA translation?'}</button>
              {helperOpen && (
                <div className="mt-3 border-l-2 border-[#b23a2e] bg-[#eee7da] p-4 text-sm">
                  <div className="font-bold">Quick translation to a 4.0 scale</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label>Percentage
                      <input type="number" min="0" max="100" value={percent} onChange={(e) => { setPercent(e.target.value); applyGpa(String((Number(e.target.value) / 100) * 4)); }} className="field mt-1" placeholder="92" />
                    </label>
                    <label>Letter average
                      <select value={letter} onChange={(e) => { setLetter(e.target.value); const values: Record<string, number> = { 'A': 4, 'A−': 3.7, 'B+': 3.3, 'B': 3, 'B−': 2.7, 'C+': 2.3, 'C': 2 }; applyGpa(String(values[e.target.value] ?? '')); }} className="field mt-1">
                        <option value="">Choose grade</option>
                        {['A', 'A−', 'B+', 'B', 'B−', 'C+', 'C'].map((grade) => <option key={grade}>{grade}</option>)}
                      </select>
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-[#6e6a61]">A quick estimate for orientation, not an official transcript conversion.</p>
                </div>
              )}
            </div>
            <label className="block text-sm font-bold">Courses taken or planned <span className="font-normal text-[#6e6a61]">optional</span>
              <input value={form.courses} onChange={(e) => setField('courses', e.target.value)} className="field mt-2" placeholder="e.g. AP Biology, Honors English, Algebra 2" />
            </label>
            <label className="block text-sm font-bold">Activities and extracurriculars <span className="font-normal text-[#6e6a61]">optional</span>
              <input value={form.activities} onChange={(e) => setField('activities', e.target.value)} className="field mt-2" placeholder="e.g. Soccer, robotics club, volunteering" />
            </label>
            <label className="block text-sm font-bold">Anything else we should know? <span className="font-normal text-[#6e6a61]">optional</span>
              <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} className="field mt-2 min-h-20 resize-y" placeholder="Goals, concerns, questions..." />
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-[#6e6a61]">Try an example</div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button type="button" key={example.school} onClick={() => applyExample(example)} className="secondary-button text-xs">{example.school} / {example.gradeLevel.split(' ')[1].replace('(', '').replace(')', '')}</button>
              ))}
            </div>
          </div>

          {error && <div className="mt-4 border border-[#b23a2e] bg-[#f7e2dc] p-3 text-sm text-[#8f2d24]">{error}</div>}
          <button disabled={loading} className="primary-button mt-6 w-full disabled:cursor-wait disabled:opacity-70">{loading ? 'Pulling live data and thinking…' : 'Get my reality check →'}</button>
        </form>

        <div>
          {loading && (
            <div className="border border-[#cfc6b7] bg-[#f9f6ef] p-6">
              <div className="mb-4 skeleton h-6 w-32" />
              <div className="mb-6 skeleton h-16" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="skeleton h-32" />
                <div className="skeleton h-32" />
              </div>
              <div className="mt-4 skeleton h-24" />
            </div>
          )}

          {current && !loading && standingStyle && (
            <div className="border border-[#cfc6b7] bg-[#f9f6ef] p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#cfc6b7] pb-4">
                <div>
                  <div className="eyebrow">Reality check / {formatDate(current.retrievedAt)}</div>
                  <h3 className="serif mt-2 text-2xl font-bold">{current.school}</h3>
                  <p className="text-sm text-[#6e6a61]">{current.gradeLevel} · GPA {current.gpa.toFixed(2)}</p>
                </div>
                <span className={`stamp ${standingStyle.stamp}`}>{standingStyle.label}</span>
              </div>

              <p className="mt-4 text-sm leading-7 text-[#555149]">{current.report.summary}</p>

              <div className="mt-5 border-l-2 border-[#b23a2e] bg-[#eee7da] p-4">
                <div className="eyebrow">Published range</div>
                <p className="mt-2 text-sm leading-6">{current.report.publishedRange}</p>
                {current.publishedStats.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {current.publishedStats.map((stat) => (
                      <div key={stat.label} className="flex items-start justify-between gap-3 border-b border-[#e1d9cc] pb-2 text-sm">
                        <span className="text-[#6e6a61]">{stat.label}</span>
                        <span className="text-right font-bold">
                          <span className="block">{stat.value}</span>
                          <a href={stat.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-normal text-[#b23a2e] underline">Source ↗</a>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[.12em] text-[#6e6a61]">Focus areas this year</div>
                  <ul className="mt-2 space-y-2 text-sm">
                    {current.report.focusAreas.map((item, i) => (
                      <li key={i} className="border-l-2 border-[#b23a2e] pl-3">{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[.12em] text-[#6e6a61]">Stretch goals</div>
                  <ul className="mt-2 space-y-2 text-sm">
                    {current.report.stretchGoals.map((item, i) => (
                      <li key={i} className="border-l-2 border-[#2d6b3e] pl-3">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 border-t border-[#cfc6b7] pt-4">
                <div className="eyebrow">Encouragement</div>
                <p className="mt-2 serif text-lg italic leading-7 text-[#1b1b18]">{current.report.encouragement}</p>
              </div>

              <div className="mt-5 border border-[#cfc6b7] bg-[#eee7da] p-4">
                <div className="eyebrow">General historical benchmark</div>
                <div className="serif mt-2 text-3xl font-bold">{current.benchmark.percentile}<span className="text-lg">th</span></div>
                <p className="mt-1 text-sm font-bold">GPA percentile in bundled sample</p>
                <p className="mt-2 text-xs leading-5 text-[#6e6a61]">General context only — not a prediction for {current.school}. Based on {current.benchmark.sampleSize} historical applicant records.</p>
                {current.benchmark.nearbyApplicants > 0 && (
                  <p className="mt-2 border-t border-[#cfc6b7] pt-2 text-sm">{current.benchmark.nearbyAdmits} of {current.benchmark.nearbyApplicants} nearby-GPA records show an admit outcome.</p>
                )}
              </div>
            </div>
          )}

          {!current && !loading && (
            <div className="flex h-full min-h-64 items-center justify-center border border-dashed border-[#cfc6b7] p-8 text-center">
              <div>
                <div className="serif text-xl font-bold text-[#6e6a61]">Your reality check will appear here</div>
                <p className="mt-2 text-sm text-[#6e6a61]">Fill out the form and hit the button. We'll pull live data and give you an honest read.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {saved.length > 0 && (
        <div className="mt-10 border-t border-[#cfc6b7] pt-6">
          <div className="eyebrow">Private notebook</div>
          <h3 className="serif mt-2 text-2xl font-bold">Saved reality checks</h3>
          <p className="mt-1 text-sm text-[#6e6a61]">Stored only in this browser. Click to revisit, or remove ones you no longer need.</p>
          <div className="mt-4 grid gap-3">
            {saved.map((item) => {
              const key = `${item.school}|${item.gradeLevel}`;
              return (
                <div key={key} className="flex items-center justify-between gap-4 border border-[#cfc6b7] bg-[#f9f6ef] p-4">
                  <button onClick={() => loadSaved(item)} className="flex-1 text-left">
                    <div className="serif text-lg font-bold hover:text-[#b23a2e]">{item.school}</div>
                    <div className="text-xs text-[#6e6a61]">{item.gradeLevel} · GPA {item.gpa.toFixed(2)} · {formatDate(item.retrievedAt)}</div>
                  </button>
                  <button onClick={() => deleteSaved(key)} className="secondary-button text-xs hover:!border-[#b23a2e] hover:!text-[#b23a2e]">Remove</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
