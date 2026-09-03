import { NextResponse } from 'next/server';

type SearchResult = { title?: string; link?: string; snippet?: string };
type PublishedStats = { label: string; value: string; sourceUrl: string; sourceTitle: string };

const cache = new Map<string, { expires: number; body: unknown }>();

function extractStats(results: SearchResult[]): PublishedStats[] {
  const stats: PublishedStats[] = [];
  const patterns: Array<{ label: string; regex: RegExp }> = [
    { label: 'Typical GPA', regex: /(?:average|median|mean|minimum|required)[^.!?]{0,50}gpa[^.!?]{0,30}([0-4](?:\.\d+)?)/i },
    { label: 'Test score', regex: /(?:average|median|mean|minimum|required)[^.!?]{0,50}(?:gre|sat|act|toefl)[^.!?]{0,30}(\d{2,4})/i },
    { label: 'Acceptance rate', regex: /(?:acceptance rate|admit rate|admission rate)[^.!?]{0,20}(\d{1,2}(?:\.\d+)?%)/i },
  ];

  for (const result of results) {
    if (!result.link || !result.snippet) continue;
    for (const pattern of patterns) {
      const match = result.snippet.match(pattern.regex);
      if (match && !stats.some((stat) => stat.label === pattern.label)) {
        stats.push({ label: pattern.label, value: match[1], sourceUrl: result.link, sourceTitle: result.title ?? 'Published source' });
      }
    }
  }
  return stats;
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { school: string; program: string; gpa: number; testScore?: string; notes?: string };
    if (!input.school || !input.program || !Number.isFinite(input.gpa)) {
      return NextResponse.json({ error: 'Add a school, program, and valid GPA first.' }, { status: 400 });
    }

    const cacheKey = JSON.stringify(input);
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return NextResponse.json(cached.body);

    const serpKey = process.env.SERPAPI_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    if (!serpKey || !groqKey) return NextResponse.json({ error: 'Live research is not connected yet. Add the SerpApi and Groq keys to enable reports.' }, { status: 503 });

    const query = `${input.school} ${input.program} admissions average GPA acceptance rate ${input.testScore ?? ''}`;
    const searchResponse = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${serpKey}`, { cache: 'no-store' });
    if (!searchResponse.ok) return NextResponse.json({ error: 'The live admissions search could not be completed.' }, { status: 502 });
    const searchData = (await searchResponse.json()) as { organic_results?: SearchResult[] };
    const results = (searchData.organic_results ?? []).slice(0, 8);
    const publishedStats = extractStats(results);
    const evidence = results.map((result) => `${result.title ?? ''} | ${result.link ?? ''} | ${result.snippet ?? ''}`).join('\n');

    const prompt = `You are an honest admissions research analyst. Create a concise fit report for ${input.school}, ${input.program}. Student GPA: ${input.gpa}. Test score: ${input.testScore || 'not provided'}. Notes: ${input.notes || 'none'}.\n\nRetrieved evidence:\n${evidence}\n\nRules: Use only evidence above. Never invent a statistic, source, range, or admission probability. If evidence is missing, say it is unavailable. Return JSON with exactly these keys: verdict (one of "stronger alignment", "mixed alignment", "more context needed"), summary (2 sentences), strengths (array of 2-4 strings), gaps (array of 1-3 strings), nextSteps (array of 2-4 strings). Do not include markdown.`;
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'llama-3.3-70b-versatile', temperature: 0.1, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: prompt }] }) });
    if (!groqResponse.ok) return NextResponse.json({ error: 'The fit analysis could not be completed.' }, { status: 502 });
    const groqData = (await groqResponse.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const report = JSON.parse(groqData.choices?.[0]?.message?.content ?? '{}');
    const body = { school: input.school, program: input.program, publishedStats, report, retrievedAt: new Date().toISOString() };
    cache.set(cacheKey, { expires: Date.now() + 10 * 60 * 1000, body });
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: 'Something went wrong while building the report. Please try again.' }, { status: 500 });
  }
}
