import { NextResponse } from 'next/server';
import { simulateRealityCheck } from '@/lib/simulations';

type SearchResult = { title?: string; link?: string; snippet?: string };
type PublishedStats = { label: string; value: string; sourceUrl: string; sourceTitle: string };

const cache = new Map<string, { expires: number; body: unknown }>();

function extractStats(results: SearchResult[]): PublishedStats[] {
  const stats: PublishedStats[] = [];
  const patterns: Array<{ label: string; regex: RegExp }> = [
    { label: 'Typical GPA', regex: /(?:average|median|mean|minimum|required)[^.!?]{0,50}gpa[^.!?]{0,30}([0-4](?:\.\d+)?)/i },
    { label: 'Test score', regex: /(?:average|median|mean|minimum|required)[^.!?]{0,50}(?:sat|act|gre|toefl)[^.!?]{0,30}(\d{2,4})/i },
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
    const input = (await request.json()) as {
      school: string;
      gradeLevel: string;
      gpa: number;
      courses?: string;
      activities?: string;
      notes?: string;
    };

    if (!input.school || !Number.isFinite(input.gpa) || !input.gradeLevel) {
      return NextResponse.json({ error: 'Add a target school, your grade level, and a valid GPA first.' }, { status: 400 });
    }

    const cacheKey = JSON.stringify(input);
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return NextResponse.json(cached.body);

    const serpKey = process.env.SERPAPI_KEY?.trim();
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (!serpKey || !groqKey) return NextResponse.json(simulateRealityCheck(input));

    const query = `${input.school} admissions average GPA acceptance rate SAT ACT requirements`;
    const searchResponse = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${encodeURIComponent(serpKey)}`, { cache: 'no-store' });
    if (!searchResponse.ok) {
      const providerError = (await searchResponse.json().catch(() => null)) as { error?: string } | null;
      console.error('SerpApi request failed', searchResponse.status, providerError?.error ?? 'Unknown provider error');
      return NextResponse.json(simulateRealityCheck(input));
    }
    const searchData = (await searchResponse.json()) as { organic_results?: SearchResult[] };
    const results = (searchData.organic_results ?? []).slice(0, 8);
    const publishedStats = extractStats(results);
    const evidence = results.map((result) => `${result.title ?? ''} | ${result.link ?? ''} | ${result.snippet ?? ''}`).join('\n');

    const prompt = `You are an honest, encouraging but direct academic advisor helping a younger student understand where they stand and what to focus on. The student is in ${input.gradeLevel} of high school and dreams of attending ${input.school}.

Student profile:
- Current GPA: ${input.gpa} on a 4.0 scale
- Courses taken or planned: ${input.courses || 'not specified'}
- Activities and extracurriculars: ${input.activities || 'not specified'}
- Additional notes: ${input.notes || 'none'}

Retrieved evidence about ${input.school} admissions:
${evidence}

Rules — strictly enforced:
- Use ONLY the evidence above. Never invent a statistic, source, range, or admission probability.
- If evidence is missing, say it is unavailable — do not fill gaps with assumptions.
- Be honest and direct: if the student's GPA is below the published range, say so clearly and explain what it means.
- Be encouraging: emphasize that the student still has time to improve and name specific actions.
- Do not give a percentage chance of admission or any "probability."

Return JSON with exactly these keys:
- standing: one of "on track", "gap to close", "more context needed"
- summary: 2-3 sentences explaining where the student stands relative to published data
- publishedRange: what the evidence says about typical admitted student profiles (or "Not enough published data was found to determine a range.")
- focusAreas: array of 2-4 specific, actionable areas the student should focus on this year
- stretchGoals: array of 1-2 ambitious but realistic goals for the student
- encouragement: 1-2 sentences of honest motivation
Do not include markdown.`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!groqResponse.ok) return NextResponse.json(simulateRealityCheck(input));
    const groqData = (await groqResponse.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const report = JSON.parse(groqData.choices?.[0]?.message?.content ?? '{}');
    const body = { school: input.school, gradeLevel: input.gradeLevel, gpa: input.gpa, publishedStats, report, retrievedAt: new Date().toISOString() };
    cache.set(cacheKey, { expires: Date.now() + 10 * 60 * 1000, body });
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: 'Something went wrong while building the reality check. Please try again.' }, { status: 500 });
  }
}
