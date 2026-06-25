export const meta = {
  name: 'ppd504-module-build',
  description: 'Build and verify 18 interactive D3 statistics lesson modules for PPD 504 Studio',
  phases: [
    { title: 'Build', detail: 'one agent per lesson module writes js/modules/<id>.js' },
    { title: 'Verify', detail: 'adversarial reviewer checks each module against the contract and fixes bugs' },
  ],
};

const ROOT = '/Users/ian/Projects/ppd504-studio';

const CONTRACT = `You are building ONE interactive lesson module for "PPD 504 Studio", a fast, self-contained (no build step, no network) single-page statistics teaching app for a USC public-policy stats course (textbook: Meier, Brudney and Bohte). The app shell, design system, a validated stats library, D3 viz helpers, and an exercise bank already exist and WORK. Your job is to add one polished, bug-free lesson.

## MANDATORY first step
Read these files for the live API and house style (do not guess signatures):
- ${ROOT}/js/modules/w2-meanmedian.js   (THE EXEMPLAR, match its structure, density, and quality exactly)
- ${ROOT}/js/lib/stats.js                (all math primitives; use these, never reimplement)
- ${ROOT}/js/lib/viz.js                  (D3 + DOM helpers)
- ${ROOT}/js/lib/exercises.js            (PPD504.renderPractice + the exercise data)
- ${ROOT}/css/styles.css                 (every CSS class you may use)

## The contract (exactly like the exemplar)
Create EXACTLY ONE new file. Do NOT modify index.html, the shared libs, the CSS, or any other module.
Wrap everything in an IIFE and register the module:
  (function () { "use strict";
    const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;
    P.modules["<ID>"] = {
      render(container) { /* build the entire lesson into container (it is empty on entry) */ },
      teardown() { /* remove any window/document listeners or timers you added; optional */ }
    };
  })();
No code that touches the DOM may run at load time, only inside render(). render() must be safe to call repeatedly (the router clears the container and calls render fresh on every visit). If you start a setInterval/animation or add a window listener, store it and clear it in teardown().

## Available API (verify exact names by reading the files)
stats (S.*): sum, mean, min, max, range, median, quartilesMBB(returns {q1,median,q3}), quantile, fiveNumber, iqr, outlierFences(returns {lower,upper,iqr,q1,q3,outliers,inliers}), variance, sd, varianceP, sdP, standardize(x,mu,sigma), zScores, correlation(xs,ys), linreg(xs,ys -> {slope,intercept,fitted,residuals,sse,r,r2,sst,ssr}), sse(xs,ys,intercept,slope), erf, normalPDF(x,mu,sigma), normalCDF(x,mu,sigma), normalArea(a,b,mu,sigma), invNormal(p), histogram(a,nbins,lo,hi -> [{x0,x1,count,items}]), rng(seed)->()=>uniform, gaussian(rand,mu,sigma), shuffle(a,rand), sampleWithout(a,k,rand), fmt(x,d).
viz (V.*): color("c-blue" | "ink-600" | "cardinal" | "mean" | "median" | "treatment" | "control" | "positive" | "negative" | "highlight" ... any --token from styles.css), palette (array of 8 colors), svg(container,{width,height,margin}) -> {svg,g,innerW,innerH,width,height,margin}, axes(g,xScale,yScale,dims,{grid,xticks,yticks,xlabel,ylabel}), tooltip() -> {show(html,ev),move(ev),hide()}, el(sel,attrs,children) tiny hyperscript (e.g. V.el("div.card"), V.el("button.btn.primary",{text:"Go",onclick:fn})), slider({label,min,max,step,value,format,on}) -> {wrap,input,value}, stat(key,value,cls) -> node with .set(v), fml.{frac(a,b),sqrt(x),sub,sup,xbar,block(inner),inline(inner)}.
app (P.*): lessonHeader(container,"<ID>","one-sentence lede"), renderPractice(container,"<exerciseKey>"), el(htmlString)->node, byId, NAV.

## CSS classes you may use (from styles.css)
card, card.lab, lab-head, lab-body, lab-controls, callout (+ .key gold / .warn red, with an inner <span class="label">), stat-row, stat (+ .accent/.good/.bad), btn (+ .primary/.ghost/.small), btn-row, seg (segmented buttons), control (slider wrapper), legend (+ .swatch with <i>), quiz (.q/.opt[data-ok]/.feedback), table.data (+ tr.total), fml / fml-block, muted, small, center, hidden.

## Required lesson structure (follow the exemplar)
1. P.lessonHeader(container, "<ID>", lede): a vivid one-sentence lede.
2. A concept .card: a short title and 2-4 .callout blocks teaching the key ideas from the slides, with CSS formulas (V.fml) where a formula clarifies. Concrete before abstract.
3. The interactive .card.lab: an SVG built with V.svg, live stat readouts (V.stat), and controls in a .lab-controls row (sliders via V.slider, buttons via V.el("button.btn",...), or .seg toggles). The interactive must directly make the core idea tangible and update live. Add a tooltip where it helps. Use S.rng(seed) for any randomness so it is reproducible.
4. A closing quick-check .quiz card (one good multiple-choice question with feedback) AND, if an exerciseKey is given, call P.renderPractice(container, "<exerciseKey>") to drop in the real course exercise.

## Quality bar
- Match the exemplar visually: same card rhythm, callout style, stat cards, control styling.
- The chart must be responsive (use V.svg viewBox) and look intentional, not default-D3.
- Prose: plain, direct, concrete; explain each term in plain words; self-contained captions. NO em-dashes anywhere in user-facing text (use colons, commas, parentheses, or separate sentences). This is a hard rule.
- Correctness is paramount: the statistics must be right. Use the S.* helpers.
- After writing, run: node --check ${ROOT}/js/modules/<ID>.js and fix any syntax error.
- Self-review: are all referenced S.*/V.*/P.* names real (you read the files)? Does render build into the passed container (not document.body)? Any undefined variable? Any d3 v4-style API that should be d3 v7 (use d3.scaleLinear, enter/append/merge or join, event passed as first arg to handlers: (ev, d))?`;

const BUILD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'wrote', 'node_check_passed', 'summary'],
  properties: {
    id: { type: 'string' },
    wrote: { type: 'boolean', description: 'true if the file was written to disk' },
    node_check_passed: { type: 'boolean' },
    summary: { type: 'string', description: 'one or two sentences on what the interactive does' },
    api_used: { type: 'array', items: { type: 'string' }, description: 'S/V/P helper names used' },
  },
};

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'verdict', 'node_check_passed'],
  properties: {
    id: { type: 'string' },
    verdict: { type: 'string', enum: ['clean', 'fixed', 'broken'] },
    node_check_passed: { type: 'boolean' },
    issues_found: { type: 'array', items: { type: 'string' } },
    fixes_applied: { type: 'array', items: { type: 'string' } },
  },
};

const MODULES = [
  // ---------------- WEEK 1 ----------------
  { id: 'w1-sampling', exerciseKey: null, spec:
`TOPIC: Sampling and statistical inference. Slide ideas to teach: population vs sample; parameter (a number describing the population, e.g. average LA household income 77,416 dollars) vs statistic (the same number computed from a sample, e.g. 74,560 dollars); a simple random sample (SRS) gives every set of n an equal chance; we use samples to make inferences about the population; larger random samples give more precise estimates; random sampling removes selection bias.
INTERACTIVE: A "sampling distribution builder". Generate a fixed population of about 400 individuals from a right-skewed income-like distribution using S.rng(seed) and S.gaussian or a custom skew (display the TRUE population mean as the parameter, drawn as a vertical line). Left panel: a strip/scatter of the population dots; when a sample is drawn, highlight the sampled dots. Right panel: a histogram (build with S.histogram) of the collected sample means, with the true mean marked. Controls: a sample-size slider n (5..100) via V.slider; buttons "Draw 1 sample", "Draw 200 samples", "Reset"; a .seg toggle for method = SRS vs Convenience (convenience = always grab the lowest-income / nearest dots, which biases the mean). Stat readouts: population mean (parameter), last sample mean (statistic), mean of sample means, and the spread (standard error) of the sample-means histogram. The lesson lands two points: (1) sample means cluster around the true parameter and the cluster tightens as n grows; (2) convenience sampling shifts the whole histogram off the true mean (bias). Include a verdict callout that updates (e.g. "SRS: centered on the truth" vs "Convenience: biased low by X"). Close with a quick-check quiz on parameter vs statistic or why random sampling matters.` },

  { id: 'w1-bias', exerciseKey: null, spec:
`TOPIC: Sampling bias gallery. Slide ideas: convenience sample (biased), voluntary response sample (people with strong opinions over-respond), undercoverage (some groups left out), nonresponse, response bias / question wording, and the classic survivorship bias. A biased design systematically favors certain outcomes.
INTERACTIVE: A gallery with a .seg selector across four bias types: "Voluntary response", "Undercoverage", "Nonresponse", "Survivorship". For the first three, show a population of dots split into segments (e.g. opinion holders, or demographic groups) with a known TRUE proportion/mean; apply the selected biased sampling mechanism and show which dots get selected vs ignored and the resulting BIASED estimate next to the TRUE value (two stat cards + a small bar comparing true vs estimated). For "Survivorship", render the famous Abraham Wald WWII bomber example: a simple plane silhouette (SVG paths/shapes) with red dots showing bullet holes ONLY on returning planes, and a toggle "Armor where the holes are" (the naive wrong answer) vs "Armor where there are NO holes" (Wald: planes hit there did not return). Explain the selection: you only see survivors. Each tab has a short callout naming the mechanism and a real-world example. Close with a quick-check quiz (e.g. an online poll on a website = which bias?).` },

  { id: 'w1-confounding', exerciseKey: null, spec:
`TOPIC: Observational study vs experiment, and confounding. Slide ideas: an observational study describes a group without intervening; an experiment deliberately imposes a treatment; experiments are the only fully convincing source of cause-and-effect; in a randomized comparative experiment subjects are randomly assigned to treatment vs control so the groups are similar in every other respect, so differences in response must be due to the treatment; a lurking/confounding variable distorts an observational comparison.
INTERACTIVE: A confounding sandbox. Setup: outcome = a health score; treatment = joining a wellness program; confounder = baseline wealth (wealthier people are both more likely to join AND healthier to begin with). The TRUE causal effect of the program is small and fixed (say +3). A .seg toggle picks the study design: "Observational (self-selected)" vs "Randomized experiment". In observational mode, people with higher wealth select into treatment, so the naive treatment-minus-control difference is inflated by the confounder. In randomized mode, assignment is by coin flip (use S.rng), wealth balances across groups, and the estimated effect matches the true effect. Visualize: a scatter of individuals (x = wealth, y = health) colored by group (treatment vs control); show group means; show the naive estimated effect vs the true effect as two stat cards. A slider for "strength of confounding" (how strongly wealth drives selection and health). The aha: only randomization recovers the true effect. Add a callout that updates ("Observational estimate +9 overstates the true +3 because the treated were richer to begin with"). Close with a quick-check quiz (ice-cream sales vs drownings, what is the lurking variable).` },

  { id: 'w1-ethics', exerciseKey: null, spec:
`TOPIC: Data ethics. Slide ideas: studies on human subjects must be reviewed in advance by an Institutional Review Board (IRB) that protects the rights and welfare of subjects; informed consent (subjects told the nature and risks, consent in writing); confidentiality (protect identifying info) vs anonymity (names unknown even to researchers); only statistical summaries may be public; the interests of the subject must always prevail over the interests of science and society; historical motivation (Tuskegee Syphilis Study). Also the Yucatan experiment consent rates (Spanish 2103 eligible / 2099 consented 99.8%; Mayan 409/409 100%; total 2512/2508 99.8%).
INTERACTIVE: A "scenario judge". Present a sequence of short research scenarios as cards; for each, the user clicks which principle is violated (or "Ethically sound") from options like {No IRB review, No informed consent, Breaks confidentiality, Coercion / interests of science over subject, Sound}, then reveal the correct answer + a one-line explanation and a running score. Include 5-6 well-chosen scenarios (e.g. publishing the name and address of a participant; running a survey with no consent form; an IRB-approved anonymous public-behavior observation = sound; pressuring prisoners to enroll). Also render a small panel: the four data-ethics pillars (IRB, informed consent, confidentiality vs anonymity, subject-first) as callouts, and a compact table.data of the Yucatan consent rates with a one-line note on the remarkably high consent. Add a short historical-context callout on Tuskegee (why these protections exist) without graphic detail. This module is quiz-heavy by nature; the scenario judge IS the interactive. No separate quiz card needed.` },

  // ---------------- WEEK 2 ----------------
  { id: 'w2-vartypes', exerciseKey: null, spec:
`TOPIC: Types of variables. Slide ideas: qualitative (categorical) vs quantitative (numeric). Qualitative: nominal (categories with no order, e.g. agency name, ZIP code) and ordinal (ordered categories whose gaps are not necessarily equal, e.g. a 1-5 satisfaction scale). Quantitative / interval: differences are meaningful; discrete (countable, e.g. number of transit trips this week) vs continuous (any value on a scale, e.g. height). Some discrete variables with many values are treated as continuous.
INTERACTIVE: A classification game. Show a deck of about 12 real variable examples (from the slides and policy life: "Government agency name", "ZIP code", "Job satisfaction 1-5", "Satisfied / neither / unsatisfied", "Number of days you took transit last week", "Height in inches", "Household income", "Number of employees at DoD", "Letter grade", "Temperature in F", "Census tract", "Years of education"). For each card, the user clicks one of four buttons: Nominal, Ordinal, Discrete (quantitative), Continuous (quantitative). Give immediate correct/incorrect feedback with a one-line reason, advance to the next card, and keep a score out of total. Alongside, render a compact decision-flow guide (as styled callouts or a small SVG flowchart): "Is it numeric with meaningful differences? -> quantitative; else categorical. Categorical ordered? -> ordinal, else nominal. Quantitative countable? -> discrete, else continuous." End with a short summary callout. The game IS the interactive; a tiny final quiz is optional.` },

  { id: 'w2-histogram', exerciseKey: null, spec:
`TOPIC: Histograms and reading a distribution. Slide ideas: a histogram shows the distribution of a quantitative variable using bars whose height is the count (or percent) of observations in equal-width classes; choose classes of equal width and count observations in each; describe the overall pattern by shape, center, and variability (spread), and look for outliers (points outside the overall pattern). Contrast with a bar graph (categorical).
INTERACTIVE: A histogram explorer. Provide a few switchable datasets via a .seg toggle (e.g. "Graduation rates" roughly symmetric, "City budgets" right-skewed, "Test scores" left-skewed, "Bimodal"); generate each with S.rng so it is fixed. A slider controls the number of bins (4..30) via V.slider; rebuild bars with S.histogram on every change with a smooth update. Overlay optional mean (red) and median (blue) vertical lines with a toggle so students see how skew separates them. Auto-describe the distribution in a verdict callout: detect shape from mean vs median (and report center = median, spread = IQR or SD, and flag outliers using S.outlierFences). Tooltip on each bar showing its range and count. Stat readouts: n, mean, median, SD. Close with a quick-check quiz (e.g. "the histogram is right-skewed; which is larger, mean or median?").` },

  { id: 'w2-spread', exerciseKey: null, spec:
`TOPIC: Variance and standard deviation. Slide ideas: s measures variability about the mean and is used only when the mean is the chosen center; s is at least 0, and s = 0 only when every observation is identical; as observations spread out, s grows; s has the same units as the data (a reason to prefer it to the variance s-squared, which is in squared units); like the mean, s is NOT resistant: a few outliers make it very large. Use the (n-1) divisor (S.variance / S.sd).
INTERACTIVE: A "deviations builder" on a number line. Plot a small draggable dataset (about 7 points) on a horizontal axis. Show the mean as a vertical line. For each point draw its deviation from the mean as a horizontal connector, and (toggleable) draw a literal SQUARE whose side equals that deviation, so the eye sees variance as total square area. Show the running computation as stat cards that update live: mean, sum of squared deviations, variance s-squared, and s. Let the user drag points and watch s respond. Buttons: "Add outlier" (drops a far point so students watch s jump, demonstrating non-resistance), "Reset", and a .seg with two preset datasets that share the same mean but different spread ("Tight" vs "Spread") so students see same center, different s. Verdict callout updating with the current s and a plain-language reading. Close with a quick-check quiz (same mean, which dataset has larger s; or "s = 0 means what?").` },

  { id: 'w2-boxplot', exerciseKey: null, spec:
`TOPIC: Quartiles, the five-number summary, the boxplot, and the 1.5*IQR outlier rule. Slide ideas (use the COURSE method = S.quartilesMBB): order the data and find the median M (50%); Q1 = median of the lower half, Q3 = median of the upper half (when n is odd, exclude M from both halves); the five-number summary is Min, Q1, M, Q3, Max; IQR = Q3 - Q1; the 1.5*IQR rule flags a point as a suspected outlier if it is more than 1.5*IQR below Q1 or above Q3.
INTERACTIVE: A live boxplot from draggable data. Plot about 11 draggable points (jittered) above a horizontal axis, and below them render a proper boxplot (box from Q1 to Q3, line at the median, whiskers to the most extreme NON-outlier points) using S.quartilesMBB and S.outlierFences. Draw the two fences (Q1 - 1.5*IQR and Q3 + 1.5*IQR) as faint dashed lines; any point beyond a fence renders in red and is labeled a suspected outlier. Stat readouts: Min, Q1, Median, Q3, Max, IQR. Buttons: "Add outlier", "Reset", and a .seg of presets (symmetric, skewed, with-outlier). As the user drags a point past a fence, it turns red live. A verdict callout reports the five-number summary and how many outliers the rule flags. Close with a quick-check quiz applying the 1.5*IQR rule to a small set.` },

  // ---------------- WEEK 3 ----------------
  { id: 'w3-longrun', exerciseKey: null, spec:
`TOPIC: Probability as long-run frequency (and personal probability). Slide ideas: random outcomes are individually uncertain but have a regular distribution over many repetitions; the probability of an outcome is the proportion of times it occurs in a very long series of repetitions; a personal probability expresses an individual judgment (e.g. the rain "probability ruler" 0..100) and must still obey the probability rules.
INTERACTIVE: A law-of-large-numbers simulator. A coin (or biased coin) with a TRUE probability p set by a slider (0.05..0.95). Buttons: "Flip 1", "Flip 10", "Flip 100", "Flip 1000", "Reset" (use S.rng for reproducibility). Main chart: a running line of the cumulative proportion of heads vs the number of flips (x linear with autoscale), with a horizontal reference line at the true p; the proportion visibly wobbles a lot early and settles toward p. Stat readouts: flips so far, heads, current proportion, gap from p. Optionally show the last batch of flips as a row of small colored squares. Add a short "personal probability ruler" mini-widget: a 0..100 slider labeled "How sure are you it rains tomorrow?" that echoes the percent, tying judgment to the same 0..1 scale. Verdict callout: early on "small samples are noisy", later "the proportion has settled near p". Close with a quick-check quiz on the long-run-frequency definition.` },

  { id: 'w3-benford', exerciseKey: 'w3-prob-rules', spec:
`TOPIC: Probability rules and a legitimate model, illustrated with the Benford first-digit law. Slide ideas: a probability model has a sample space S and assigns probabilities to events; Rule 1: every probability is between 0 and 1; Rule 2: the probabilities of all outcomes sum to 1; Rule 3 (complement): P(not A) = 1 - P(A); for disjoint events, add. Benford example from the slides: first digit X in 1..9 with probabilities 0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046; show this is legitimate (each in [0,1], they sum to 1) and that P(first digit is not 9) = 1 - 0.046 = 0.954.
INTERACTIVE: Two linked pieces. (1) A Benford bar chart: bars for digits 1..9 at the Benford probabilities P(d) = log10(1 + 1/d) (verify they match the slide values), with a tooltip per bar. Let the user click digits to form an event and watch the tool compute P(event) by summation, plus a "complement" button that shows P(not event) = 1 - P(event) using the chosen digits (reproduce the "not 9 = 0.954" result). (2) A "legitimate model?" checker: a small editable probability table (a few sliders or number inputs over 4-5 outcomes) where the tool live-checks Rule 1 (all in [0,1]) and Rule 2 (sum = 1) and shows a green/red verdict, so students feel what makes a model legal. Also draw real first-digit data: generate a dataset spanning orders of magnitude (e.g. populations via an exponential using S.rng), tally first digits, and overlay observed vs Benford to show the match. Then call P.renderPractice(container, "w3-prob-rules") for the real course exercise. A separate quiz is optional.` },

  { id: 'w3-density', exerciseKey: null, spec:
`TOPIC: Density curves. Slide ideas: a density curve is always on or above the horizontal axis and has area exactly 1 underneath; it describes the overall pattern of a distribution; the area under the curve over a range equals the proportion of observations in that range; the median is the equal-areas point (divides area in half) and the mean is the balance point; for a skewed curve the mean is pulled toward the long tail while the median is not; data use x-bar and s, the idealized distribution uses mu and sigma.
INTERACTIVE: A density-curve sandbox. Render a smooth density curve whose shape is controlled by a "skew" slider (from left-skew through symmetric to right-skew) plus a spread slider; build the curve from a parametric family (e.g. a skewed bump or a mixture) sampled on a grid and NORMALIZED so the area is 1 (compute area by the trapezoid rule and divide). A draggable vertical threshold shades the area to its left and reports that area as a proportion (this IS a probability/percentile). Mark the median (equal-areas point, found by scanning the cumulative area to 0.5) and the mean (balance point, the area-weighted average of x) as labeled vertical lines, and show how they separate as skew increases. Stat readouts: shaded area (proportion), mean, median. Verdict callout naming the skew direction and which of mean/median is larger. Close with a quick-check quiz (mean vs median under right skew; or "area under a density curve over all x = ?").` },

  { id: 'w3-normal', exerciseKey: 'w3-empirical', spec:
`TOPIC: The Normal distribution and the empirical (68-95-99.7) rule. Slide ideas: Normal curves are symmetric, single-peaked, bell-shaped, and completely specified by mu and sigma; the mean = median sits at the center; changing mu slides the curve, sigma controls spread; sigma is the distance from the center to the inflection (change-of-curvature) point on each side; Empirical Rule: about 68% within 1 sigma, 95% within 2 sigma, 99.7% within 3 sigma.
INTERACTIVE: A normal-curve explorer. Draw N(mu, sigma) using S.normalPDF on a grid. Sliders for mu and sigma via V.slider reshape and slide the curve live (keep the x-domain fixed and sensible, e.g. centered with room for plus or minus 4 sigma at the default). A .seg toggle "Show band" = 1 sigma / 2 sigma / 3 sigma shades mu plus or minus k*sigma and labels it with the empirical percentage (68% / 95% / 99.7%) computed via S.normalArea so the number is exact, not hard-coded. Mark the inflection points at mu plus or minus sigma with small ticks. Also include an "area between bounds" mode: two draggable vertical bounds whose shaded area (probability) is reported via S.normalArea. Stat readouts: mu, sigma, and the current shaded area/percent. Then call P.renderPractice(container, "w3-empirical") for the heights exercise. A separate quiz is optional.` },

  { id: 'w3-zscore', exerciseKey: 'w3-zscore', spec:
`TOPIC: Standardizing (z-scores). Slide ideas: z = (x - mu) / sigma converts any value to the number of standard deviations it sits from the mean; if x is N(mu, sigma) then z is N(0,1), the standard Normal; standardizing lets you compare values from different distributions on one ruler. (Slide example: grades standardized with mean 2.83, sd 0.96.)
INTERACTIVE: A "z-score machine" with a two-curve view. Top: a Normal curve N(mu, sigma) with sliders for mu and sigma and a draggable value x; show x on this curve. Bottom: the standard Normal N(0,1) with the corresponding z marked, visually connecting x to z. Live readout: z = (x - mu)/sigma (show the plugged-in arithmetic), and the percentile = S.normalCDF(z) as a percent, with the left tail shaded on the standard curve. Add a "compare two values" panel that reproduces the WAIS idea: value A from N(muA,sigmaA) and value B from N(muB,sigmaB), show both z-scores and declare which is higher RELATIVE to its own distribution vs higher in ABSOLUTE terms. Stat cards: x, z, percentile. Then call P.renderPractice(container, "w3-zscore") for the standard-scores exercise. A separate quiz is optional.` },

  // ---------------- WEEK 4 ----------------
  { id: 'w4-scatter', exerciseKey: 'w4-corr-swim', spec:
`TOPIC: Scatterplots and the correlation coefficient r. Slide ideas: a scatter diagram shows the relationship between two quantitative variables measured on the same individuals; r in [-1, 1]: r = 1 perfect positive, between 0 and 1 positive, r = 0 uncorrelated, r = -1 perfect negative; r measures the strength and direction of the LINEAR association; r is unit-free (rescaling x or y does not change it).
INTERACTIVE: Two pieces. (1) A "guess the correlation" game: render a scatter generated to a hidden target r (use S.rng + S.gaussian to make correlated data at a chosen r), let the user enter or slide a guess, then reveal the true r = S.correlation(...) and score how close they were; a "New cloud" button reshuffles. (2) A live draggable scatter: about 12 points the user can drag (and add/remove), with r recomputed and shown live as a big stat plus a direction/strength label (e.g. "moderate positive"); draw faint mean-x and mean-y reference lines. Stat readouts: n, r, and the label. Then call P.renderPractice(container, "w4-corr-swim") for the swim-times exercise (which also makes the unit-invariance point). A separate quiz is optional.` },

  { id: 'w4-traps', exerciseKey: 'w4-gas-mileage', spec:
`TOPIC: When correlation misleads. Slide ideas: correlation only captures LINEAR association (a strong curved relationship can have r near 0); r is not resistant (a single outlier can swing it); correlation does not imply causation; a spurious correlation arises when an apparent link is entirely explained by a lurking variable (the slides cite chocolate consumption vs Nobel laureates, Messerli 2012).
INTERACTIVE: A .seg with three demos. (1) "Nonlinear": plot the gas-mileage data from PPD504.exercises.data.gasMileage (speed 20..60, mpg 24,28,30,28,24), show r = S.correlation(...) is exactly 0, and overlay the obvious inverted-U so students see a strong relationship with zero correlation. (2) "Outlier leverage": a tight cloud of points with r near 0; one draggable outlier point in the corner, and r is shown live, so dragging the single point swings r dramatically, demonstrating non-resistance. (3) "Spurious": a scatter of chocolate consumption (kg/person) vs Nobel laureates per capita for about 12 labeled countries (reasonable illustrative values, e.g. Switzerland high on both, China low on both), showing a high r but a clear note that national wealth is the lurking variable, correlation is not causation. Each tab gets a one-line callout with the lesson. Then call P.renderPractice(container, "w4-gas-mileage"). A separate quiz is optional.` },

  { id: 'w4-twoway', exerciseKey: null, spec:
`TOPIC: Two-way tables. Slide ideas: a two-way table organizes counts of two categorical variables by a row variable and a column variable; the distribution of a categorical variable is the count or percent in each category; from a two-way table you can read the joint distribution (each cell over the grand total), the marginal distributions (the row and column totals), and conditional distributions (a row cells as percents of that row total, or a column cells as percents of that column total). Use the real slide data: rows = {Women no college: jobOutside 81, stayHome 104, noPref 10}; {Women with college: 173, 115, 15}; {Men no college: 92, 32, 2}; {Men with college: 299, 81, 8}; columns = Job outside home, Stay home, No preference; grand total 1012.
INTERACTIVE: A two-way table explorer rendered as table.data. A .seg toggle switches the displayed numbers between "Counts", "% of grand total" (joint), "Row %" (each row sums to 100, conditional on the row group), and "Column %" (each column sums to 100). Recompute marginals/totals for each mode. Let the user click a row (or column) to HIGHLIGHT its conditional distribution and render a small bar chart of that conditional distribution beside the table, with a plain-language caption (e.g. "Among men with college, 75% prefer a job outside the home"). Add a callout explaining joint vs marginal vs conditional in plain words tied to this table. Close with a quick-check quiz reading a conditional percent from the table.` },

  { id: 'w4-ols', exerciseKey: 'w4-regression', spec:
`TOPIC: Least-squares regression. Slide ideas: a response variable measures the outcome; an explanatory variable may influence it; the regression line is y-hat = a + b*x where a is the intercept and b is the slope (the change in predicted y per one-unit increase in x); OLS chooses a and b to minimize the sum of squared vertical distances (residuals) from the points to the line; we use the line to predict y at a given x; R-squared (the square of r) is the fraction of the variation in y explained by the regression, from 0 (no fit) to 1 (perfect fit).
INTERACTIVE: A "beat the line" OLS sandbox. Plot a fixed scatter with a real positive relationship (generate with S.rng, e.g. years of education vs income). The user adjusts a candidate line with two sliders (intercept a and slope b); draw the line and the residuals as vertical segments from each point to the line, and show the live Sum of Squared Errors = S.sse(xs,ys,a,b) as a big stat plus, optionally, the squared-residual squares. A "Snap to OLS" button sets the sliders to the least-squares fit (S.linreg) and shows that no manual line beats its SSE; then reveal the equation y-hat = a + b*x with the fitted numbers, R-squared, and r. A draggable "predict at x" marker reads off y-hat at any x. Verdict callout comparing current SSE to the OLS minimum ("OLS SSE = 312 is the smallest possible; your line is at 410"). Then call P.renderPractice(container, "w4-regression"). A separate quiz is optional.` },

  { id: 'w4-residuals', exerciseKey: 'w4-residuals', spec:
`TOPIC: Residuals and residual plots. Slide ideas: a residual = observed y - predicted y-hat; the mean of the residuals is always zero; a residual plot is a scatter of residuals against x; if the line is a good model the residual plot shows no pattern (a formless band around zero); a clear pattern (a curve, or a fan) means a straight line is the wrong model; outliers and influential points matter.
INTERACTIVE: A linked regression + residual-plot view. Top chart: a scatter with the OLS line (S.linreg). Bottom chart: the residual plot (residual vs x) with a horizontal zero line. A .seg toggles among three generated datasets (use S.rng): "Linear" (residuals form a structureless band = good model), "Curved" (a quadratic relationship whose residual plot shows an obvious U pattern = line is wrong), and "Fan / heteroskedastic" (spread of residuals grows with x). The point: the residual plot exposes the problem the top scatter can hide. Show stat cards: slope, intercept, R-squared, and the mean residual (always near 0, make that explicit). Add a verdict callout reading the residual plot ("no pattern: a line is appropriate" vs "U-shaped pattern: the true relationship is curved"). Also include the real wine example via PPD504.exercises.data.wine: plot the four countries against the given line y-hat = 260.6 - 22.97x and show each residual. Then call P.renderPractice(container, "w4-residuals"). A separate quiz is optional.` },
];

phase('Build');
const results = await pipeline(
  MODULES,
  (m) => agent(
    CONTRACT +
    '\n\n## YOUR MODULE\nID: ' + m.id + '\nFile to create: ' + ROOT + '/js/modules/' + m.id + '.js\n' +
    (m.exerciseKey ? ('Required: near the end, call P.renderPractice(container, "' + m.exerciseKey + '").\n') : '') +
    '\nSPEC:\n' + m.spec +
    '\n\nWrite the complete file now, then run node --check on it and fix any error. Return the structured result.',
    { label: 'build:' + m.id, phase: 'Build', schema: BUILD_SCHEMA, effort: 'high' }
  ),
  (built, m) => agent(
    'You are an adversarial code reviewer for the PPD 504 Studio teaching app. Review the module file ' + ROOT + '/js/modules/' + m.id + '.js and FIX any problems in place (use Edit/Write).\n\n' +
    'First read: the file itself, ' + ROOT + '/js/lib/stats.js, ' + ROOT + '/js/lib/viz.js, ' + ROOT + '/js/lib/exercises.js, ' + ROOT + '/css/styles.css, and the exemplar ' + ROOT + '/js/modules/w2-meanmedian.js.\n\n' +
    'Check and fix, with HIGH suspicion: (1) it registers window.PPD504.modules["' + m.id + '"] with render(container); (2) every S.* / V.* / P.* helper it calls REALLY EXISTS with that signature in the libs (a call to a non-existent helper is a hard bug, fix it to use a real one or implement inline); (3) it renders into the passed container, not document.body, and nothing DOM-touching runs at load time; (4) d3 v7 correctness (event handlers receive (event, d); use d3.scaleLinear, axisBottom/Left; selection enter/append/merge or join is correct; drag uses d3.drag with (event,d)); (5) no undefined variables, no obvious runtime exceptions on first render; (6) the statistics are correct; (7) NO em-dashes in user-facing text (replace any with colon/comma/parentheses); (8) if an exerciseKey was specified (' + (m.exerciseKey || 'none') + '), P.renderPractice is actually called with it; (9) the lesson includes a concept card, a working interactive with live updates, and a quiz or practice card; (10) it is visually consistent with the exemplar.\n\n' +
    'If you change anything, re-run node --check ' + ROOT + '/js/modules/' + m.id + '.js. ' +
    (built ? ('Builder summary: ' + (built.summary || '')) : 'NOTE: the build step returned no result; verify the file exists and is complete, create or repair it if needed.') +
    '\nReturn the structured verdict (verdict: "clean" if no changes were needed, "fixed" if you corrected issues, "broken" if it is unsalvageable and you could not fix it).',
    { label: 'verify:' + m.id, phase: 'Verify', schema: VERIFY_SCHEMA, effort: 'high' }
  )
);

const built = results.filter(Boolean);
log('Modules processed: ' + built.length + '/' + MODULES.length);
return {
  total: MODULES.length,
  verified: built,
  broken: built.filter((r) => r.verdict === 'broken').map((r) => r.id),
  fixed: built.filter((r) => r.verdict === 'fixed').map((r) => r.id),
};
