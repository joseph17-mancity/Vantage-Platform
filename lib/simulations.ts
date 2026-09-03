type FitInput = { school: string; program: string; gpa: number; testScore?: string; notes?: string };
type RealityInput = { school: string; gradeLevel: string; gpa: number; courses?: string; activities?: string; notes?: string };

type SimulatedStat = { label: string; value: string; sourceUrl: string; sourceTitle: string };

const GLOBAL_COHORT = [
  'University of Toronto', 'University of British Columbia', 'Stanford University', 'University of Michigan',
  'University of Sao Paulo', 'University of Oxford', 'Imperial College London', 'ETH Zurich',
  'University of Amsterdam', 'Technical University of Munich', 'University of Cape Town',
  'University of Nairobi', 'University of Tokyo', 'Kyoto University', 'National University of Singapore',
  'University of Melbourne', 'University of Sydney', 'University of Auckland', 'Seoul National University',
  'Tsinghua University', 'University of Hong Kong', 'University of Delhi', 'University of Buenos Aires',
  'Pontifical Catholic University of Chile',
];

function schoolFactor(school: string) {
  return school.split('').reduce((total, character) => total + character.charCodeAt(0), 0) % 6;
}

function simulatedStats(school: string, testScore?: string): SimulatedStat[] {
  const factor = schoolFactor(school);
  return [
    { label: 'Typical GPA', value: `${(3.45 + factor * 0.05).toFixed(2)} (simulated)`, sourceUrl: '', sourceTitle: 'Global cohort simulation' },
    ...(testScore ? [{ label: 'Test score', value: `${testScore} (simulated context)`, sourceUrl: '', sourceTitle: 'Global cohort simulation' }] : []),
    { label: 'Acceptance rate', value: `${18 + factor * 4}% (simulated)`, sourceUrl: '', sourceTitle: 'Global cohort simulation' },
  ];
}

export function simulateFit(input: FitInput) {
  const typicalGpa = 3.45 + schoolFactor(input.school) * 0.05;
  const verdict = input.gpa >= typicalGpa + 0.1 ? 'stronger alignment' : input.gpa >= typicalGpa - 0.15 ? 'mixed alignment' : 'more context needed';
  return {
    school: input.school,
    program: input.program,
    publishedStats: simulatedStats(input.school, input.testScore),
    simulated: true,
    globalCoverage: GLOBAL_COHORT.length,
    report: {
      verdict,
      summary: `This simulated report uses your ${input.gpa.toFixed(2)} GPA to create a practice comparison for ${input.program} at ${input.school}. Live admissions sources are unavailable, so this is not an admissions estimate or official program data.`,
      strengths: ['Your profile is ready for a more focused review.', input.notes ? 'Your additional context gives an advisor useful material to explore.' : 'Adding coursework, experience, or context would make the review more specific.'],
      gaps: ['Replace the simulated comparison with current official program information before making decisions.'],
      nextSteps: ['Check the program website for current requirements and class profile data.', 'Run this report again after live research is connected.'],
    },
    retrievedAt: new Date().toISOString(),
  };
}

export function simulateRealityCheck(input: RealityInput) {
  const typicalGpa = 3.4 + schoolFactor(input.school) * 0.05;
  const standing = input.gpa >= typicalGpa + 0.1 ? 'on track' : input.gpa >= typicalGpa - 0.15 ? 'more context needed' : 'gap to close';
  return {
    school: input.school,
    gradeLevel: input.gradeLevel,
    gpa: input.gpa,
    publishedStats: simulatedStats(input.school),
    simulated: true,
    globalCoverage: GLOBAL_COHORT.length,
    report: {
      standing,
      summary: `This simulated check places your ${input.gpa.toFixed(2)} GPA in a practice comparison for ${input.school}. Live admissions sources are unavailable, so the comparison is for planning only and does not describe the school’s actual admitted-student range.`,
      publishedRange: 'Simulated planning range only. Check the school’s official admissions and program pages for current information.',
      focusAreas: ['Keep building a consistent academic record.', input.courses ? 'Review your course choices against the target program prerequisites.' : 'Add your current and planned courses for a more specific review.'],
      stretchGoals: ['Identify two official school resources and record their current requirements.'],
      encouragement: 'You can use this as a planning prompt while you gather verified information.',
    },
    retrievedAt: new Date().toISOString(),
  };
}
