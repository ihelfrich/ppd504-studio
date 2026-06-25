export const meta = {
  name: 'ppd504-practice-expand',
  description: 'Draft and verify 2-3 conceptual practice problems per lesson, with graduated Hint+Solution',
  phases: [
    { title: 'Draft', detail: 'one agent per module writes conceptual/interpretive practice problems' },
    { title: 'Verify', detail: 'reviewer checks correctness, voice, no em-dashes, and fixes' },
  ],
};

const RULES = `You are writing PRACTICE PROBLEMS for "PPD 504 Studio", an intro statistics teaching app for a USC public-policy course (textbook Meier, Brudney & Bohte). Each problem has three fields:
- q:    the problem statement (a self-contained question)
- hint: one short nudge toward the method (not the answer)
- a:    the full worked solution / explanation, ending in the answer. Light HTML allowed (<b>, <i>, <sub>, <br>).

WRITE CONCEPTUAL AND INTERPRETIVE PROBLEMS, not heavy number-crunching. The app already has data-computation problems; your job is to build INTUITION and JUDGMENT. Good shapes:
- "Which measure/method fits this situation, and why?"
- "Interpret this result (an R-squared, a correlation, a p-of-an-event, a skew) for a policy audience."
- "Spot the flaw" (a bias, a confounder, a misuse of correlation, a wrong chart choice).
- "True/false with a reason" or "explain to a skeptical city-council member."
- Short scenarios drawn from real public-management life (budgets, surveys, program evaluation, commute times, housing, test scores, service wait times).

HARD RULES:
- Do NOT invent real-world statistics or cite fake studies/numbers. If a problem needs numbers, use a SMALL made-up set stated inside the problem (so the answer is fully determined and checkable), or keep it purely conceptual. Any arithmetic in your solution must be correct and shown.
- NO em-dashes anywhere (use colons, commas, parentheses, or separate sentences). Hard rule.
- Plain, direct voice. Explain any term you use. No filler, no "let's dive in", no rule-of-three padding.
- Make them genuinely different from each other and from the existing problems you are shown.
- Keep each q to 1-3 sentences; each a to 2-5 sentences.

Return JSON: { moduleId, problems: [ {q, hint, a}, ... ] } with 2 or 3 problems.`;

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['moduleId', 'problems'],
  properties: {
    moduleId: { type: 'string' },
    problems: {
      type: 'array', minItems: 2, maxItems: 3,
      items: {
        type: 'object', additionalProperties: false,
        required: ['q', 'hint', 'a'],
        properties: { q: { type: 'string' }, hint: { type: 'string' }, a: { type: 'string' } },
      },
    },
  },
};

const MODS = [
  ['w1-sampling', 'Population vs sample; parameter (fixed, describes population) vs statistic (from a sample); simple random sampling; using a sample to infer about the population; larger random samples are more precise.'],
  ['w1-bias', 'Sampling bias: convenience samples, voluntary-response (strong opinions over-respond), undercoverage (groups left off the frame), nonresponse, question-wording/response bias, survivorship bias. Bias is a systematic tilt that more data does not fix.'],
  ['w1-confounding', 'Observational study vs experiment; confounding / lurking variables; randomization makes treatment and control alike so differences are caused by the treatment; internal vs external validity; double-blind.'],
  ['w1-ethics', 'Data ethics: IRB review; informed consent; confidentiality vs anonymity; only group summaries made public; the interests of the subject come first; Tuskegee as motivation.'],
  ['w2-vartypes', 'Variable types: nominal (unordered categories), ordinal (ordered categories, unequal gaps), interval/quantitative; discrete (countable) vs continuous (any value on a scale).'],
  ['w2-histogram', 'Histograms for one quantitative variable; equal-width bins; describe shape, center, spread, and outliers; histogram (quantitative) vs bar graph (categorical).'],
  ['w2-meanmedian', 'Mean is the balance point and uses every value but is not resistant; median is the middle value and resists outliers; in a right-skew the mean exceeds the median.'],
  ['w2-spread', 'Variance and standard deviation s (divide by n-1); s is at least 0, is 0 only if all values are identical, has the same units as the data, and is not resistant to outliers.'],
  ['w2-boxplot', 'Quartiles (course method: median of each half, excluding the median when n is odd); five-number summary; IQR = Q3 - Q1; the 1.5 x IQR rule for suspected outliers.'],
  ['w3-longrun', 'Probability as the long-run proportion over many repetitions; short runs are noisy (law of large numbers); personal probability still must obey the rules.'],
  ['w3-benford', 'Probability models: sample space and events; Rule 1 (each probability in [0,1]); Rule 2 (all sum to 1); complement P(not A) = 1 - P(A); add disjoint events; Benford first-digit law.'],
  ['w3-density', 'Density curves: total area 1; area over a range equals a proportion; median is the equal-areas point; mean is the balance point; skew pulls the mean toward the long tail.'],
  ['w3-normal', 'Normal curves are symmetric and set by mu and sigma; mu shifts, sigma controls spread; inflection at one sigma; empirical rule 68-95-99.7.'],
  ['w3-zscore', 'z = (x - mu)/sigma is the number of standard deviations from the mean; standardizing compares values from different distributions; z maps to a percentile.'],
  ['w4-scatter', 'Scatterplots; correlation r in [-1,1] for strength and direction of a LINEAR relationship; r is unit-free (rescaling x or y does not change it).'],
  ['w4-traps', 'r captures only linear association (a strong curve can give r near 0); r is not resistant to outliers; correlation is not causation; spurious correlation via a lurking variable.'],
  ['w4-twoway', 'Two-way tables of two categorical variables; joint (cell / grand total), marginal (row or column totals), and conditional (within a row or within a column) distributions.'],
  ['w4-ols', 'Response vs explanatory variable; least-squares line y-hat = a + b x; OLS minimizes the sum of squared residuals; slope = change in predicted y per unit x; R-squared = share of variation in y explained.'],
  ['w4-residuals', 'Residual = observed minus predicted; residuals average to zero; a residual plot with no pattern means a line fits, a curved or fanning pattern means it does not.'],
];

phase('Draft');
const results = await pipeline(
  MODS,
  ([id, topic]) => agent(
    RULES + '\n\n## YOUR MODULE\nmoduleId: ' + id + '\nTopic to cover: ' + topic +
    '\n\nWrite 2 or 3 fresh conceptual/interpretive practice problems for this topic. Return the JSON.',
    { label: 'draft:' + id, phase: 'Draft', schema: SCHEMA, effort: 'high' }
  ),
  (draft, [id, topic]) => agent(
    'Adversarially review these draft practice problems for the PPD 504 topic "' + topic + '" (moduleId ' + id + ').\n\n' +
    'DRAFT:\n' + JSON.stringify(draft, null, 2) + '\n\n' +
    'Check every item and FIX in your returned JSON: (1) the solution (a) is statistically CORRECT and the reasoning is sound; any arithmetic is right; (2) the hint nudges toward the method without giving away the answer; (3) NO em-dashes anywhere (replace with colon/comma/parentheses); (4) voice is plain, direct, explains terms, no filler or rule-of-three padding; (5) no invented real-world statistics or fake studies (made-up numbers must be clearly internal to the problem); (6) the problems are conceptual/interpretive and distinct from each other. ' +
    'Rewrite anything weak. Return the corrected { moduleId, problems } JSON (keep moduleId = "' + id + '").',
    { label: 'verify:' + id, phase: 'Verify', schema: SCHEMA, effort: 'high' }
  )
);

const sets = results.filter(Boolean).filter((r) => r.problems && r.problems.length);
let total = 0;
sets.forEach((s) => { total += s.problems.length; });
log('Verified ' + sets.length + ' modules, ' + total + ' new problems');
return { sets, moduleCount: sets.length, problemCount: total };
