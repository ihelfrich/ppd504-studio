/* =====================================================================
   PPD 504 Studio, exercises.js
   The actual in-class exercises Prof. Aguila uses, transcribed with
   verified solutions. Modules pull problems by key and render them with
   PPD504.renderPractice(container, key). Datasets live under .data so
   the same numbers drive both the plots and the answer keys.
   ===================================================================== */
(function (root) {
  "use strict";
  const P = root.PPD504 = root.PPD504 || {};

  P.exercises = {
    /* shared datasets used by interactive modules */
    data: {
      gasMileage: { speed: [20, 30, 40, 50, 60], mpg: [24, 28, 30, 28, 24] },
      swim: { time: [34, 37, 28], pulse: [152, 124, 160] },
      wine: {
        line: { a: 260.6, b: -22.97 },
        rows: [
          { country: "France", x: 9.1, y: 71 },
          { country: "Iceland", x: 0.8, y: 211 },
          { country: "Spain", x: 6.5, y: 86 },
          { country: "United States", x: 1.2, y: 199 },
        ],
      },
    },

    /* ---------- Week 3 ---------- */
    "w3-prob-rules": {
      title: "In-class Exercise 1 · Week 3: Probability rules",
      intro: "Probability measures how likely an event is. Work each part, then reveal the reasoning.",
      parts: [
        {
          q: "Match a probability from {0, 0.01, 0.3, 0.6, 0.99, 1} to each statement: " +
             "(a) impossible, (b) certain, (c) very unlikely but happens once in a while, (d) will occur more often than not.",
          a: "(a) impossible = <b>0</b>; (b) certain = <b>1</b>; (c) very unlikely but occasional = <b>0.01</b>; " +
             "(d) more often than not = <b>0.6</b>. (0.99 = almost certain, 0.3 = unlikely but real.)",
        },
        {
          q: "In Denmark, the probability that the son of a lower-class father stays in the lower class is 0.46. " +
             "What is the probability that the son moves to a higher class?",
          a: "Complement rule: P(moves up) = 1 − P(stays) = 1 − 0.46 = <b>0.54</b>.",
        },
        {
          q: "Opinions on state colleges, Excellent 0.15, Good 0.42, Fair 0.13, Poor 0.03, Don't know ?. " +
             "Find P(Don't know) and P(Good or Excellent).",
          a: "All probabilities sum to 1, so P(Don't know) = 1 − (0.15 + 0.42 + 0.13 + 0.03) = <b>0.27</b>. " +
             "These are disjoint, so P(Good or Excellent) = 0.42 + 0.15 = <b>0.57</b>.",
        },
      ],
    },
    "w3-empirical": {
      title: "In-class Exercise 2 · Week 3: The 68–95–99.7 rule",
      intro: "Heights of young men are approximately Normal with mean 70 inches and standard deviation 2.5 inches.",
      parts: [
        { q: "What percent of men are taller than 75 inches?",
          a: "75 is exactly 2σ above the mean (z = (75−70)/2.5 = 2). The middle 95% lie within 2σ, leaving 5% in the two tails, so <b>2.5%</b> are taller than 75 in." },
        { q: "Between what heights do the middle 95% of men fall?",
          a: "Mean ± 2σ = 70 ± 2(2.5) = <b>65 to 75 inches</b>." },
        { q: "What percent of men are shorter than 67.5 inches?",
          a: "67.5 is 1σ below the mean (z = −1). 68% lie within ±1σ, so 16% sit in each tail: <b>16%</b> are shorter than 67.5 in." },
      ],
    },
    "w3-zscore": {
      title: "In-class Exercise 2 · Week 3: Standard scores",
      intro: "Standardizing puts values from different distributions on one common ruler.",
      parts: [
        { q: "A nationwide test has mean 75 and SD 10. Convert X = 94, 75, 67 to z-scores. What raw score has z = 1.5?",
          a: "z = (X − 75)/10 → z(94) = <b>1.9</b>, z(75) = <b>0</b>, z(67) = <b>−0.8</b>. For z = 1.5: X = 75 + 1.5(10) = <b>90</b>." },
        { q: "WAIS scores: ages 20–34 are N(110, 25); ages 60–64 are N(90, 25). Sarah (30) scores 135; her mother (60) scores 120. " +
             "Express each as a standard score. Who scored higher relative to her age group? Who has the higher absolute score?",
          a: "Sarah: z = (135 − 110)/25 = <b>1.0</b>. Mother: z = (120 − 90)/25 = <b>1.2</b>. " +
             "Relative to her own age group the <b>mother</b> ranks higher (z 1.2 > 1.0). In raw points <b>Sarah</b> is higher (135 > 120)." },
      ],
    },

    /* ---------- Week 4 ---------- */
    "w4-corr-swim": {
      title: "In-class Exercise 1 · Week 4: Correlation, and units",
      intro: "Professor Rich swims 2000 yards. Three sessions of time (minutes) and pulse (beats/min) afterward.",
      parts: [
        { q: "Time = {34, 37, 28}, Pulse = {152, 124, 160} (mean time 33, SD 4.58; mean pulse 145.33, SD 18.90). Find r.",
          a: "r = [Σ(x−x̄)(y−ȳ)] / [(n−1)·s<sub>x</sub>·s<sub>y</sub>] = −152 / (2 · 4.58 · 18.90) ≈ <b>−0.88</b>. Faster swims (lower time) go with higher pulse." },
        { q: "If the times were recorded in seconds instead of minutes (34 min → 2040 s), how would r change?",
          a: "Not at all. Correlation is <b>unit-free</b>, multiplying every x by 60 leaves r = <b>−0.88</b>. r never changes under a linear rescaling of either variable." },
      ],
    },
    "w4-gas-mileage": {
      title: "In-class Exercise 1 · Week 4: When r hides a real relationship",
      intro: "Gas mileage rises then falls as speed increases. Speed (mph): 20, 30, 40, 50, 60. Mileage (mpg): 24, 28, 30, 28, 24.",
      parts: [
        { q: "Compute the correlation between speed and mileage. Why is it near 0 even though the relationship is strong?",
          a: "r = <b>0</b> exactly. The relationship is a clean inverted-U, so the rising half and the falling half cancel. " +
             "Correlation only measures <b>linear</b> association; a strong curved relationship can still give r = 0. Always plot first." },
      ],
    },
    "w4-regression": {
      title: "In-class Exercise 2 · Week 4: Reading a regression line",
      intro: "Practice interpreting intercepts, slopes, predictions, and R².",
      parts: [
        { q: "A regression of GPA on IQ gives a = −3.56 and b = 0.101. Write the line. What are a and b? Predict GPA for IQ = 115.",
          a: "Line: ŷ = −3.56 + 0.101·IQ. Here a = −3.56 is the intercept (the fitted value at IQ = 0, not meaningful on its own) and " +
             "b = 0.101 is the slope (each extra IQ point adds 0.101 to predicted GPA). Prediction: −3.56 + 0.101(115) ≈ <b>8.05</b> " +
             "<span class='muted'>(illustrative coefficients, a real GPA caps at 4.0).</span>" },
        { q: "You must analyze the effect of health-insurance coverage on health status. Which is the response variable and which is the explanatory variable?",
          a: "Health status is the <b>response (dependent)</b> variable; insurance coverage is the <b>explanatory (independent)</b> variable, coverage is hypothesized to influence health." },
        { q: "Interpret a slope of b = 4. Interpret R² = 0.04, then R² = 0.81.",
          a: "b = 4: a one-unit rise in x is associated with a 4-unit rise in predicted y. R² = 0.04 means the line explains just <b>4%</b> of the variation in y, a very poor fit. R² = 0.81 means it explains <b>81%</b>, a strong fit." },
        { q: "Wine vs heart disease: ŷ = 260.6 − 22.97x (x = liters of alcohol from wine per person; y = deaths per 100,000). Predict for 1 and 8 liters.",
          a: "At x = 1: ŷ = 260.6 − 22.97(1) ≈ <b>237.6</b> deaths/100k. At x = 8: ŷ = 260.6 − 22.97(8) ≈ <b>76.8</b> deaths/100k. More wine, fewer predicted heart-disease deaths (association, not proof of cause)." },
      ],
    },
    "w4-residuals": {
      title: "In-class Exercise 2 · Week 4: Residuals",
      intro: "Using ŷ = 260.6 − 22.97x, find the residual (observed − predicted) for each country.",
      parts: [
        { q: "France (9.1, 71), Iceland (0.8, 211), Spain (6.5, 86), United States (1.2, 199).",
          a: "France: 71 − 51.6 = <b>+19.4</b>. Iceland: 211 − 242.2 = <b>−31.2</b>. Spain: 86 − 111.3 = <b>−25.3</b>. " +
             "United States: 199 − 233.0 = <b>−34.0</b>. Positive means the country had more heart-disease deaths than the line predicts." },
      ],
    },
  };

  /* Standard "Practice" card with collapsible solutions. */
  P.renderPractice = function (container, key) {
    const ex = P.exercises[key];
    if (!ex) return;
    const V = P.viz;
    const card = V.el("div.card");
    let html = `<h3 style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;background:var(--cardinal);color:#fff;padding:2px 8px;border-radius:999px;font-weight:700">PRACTICE</span>
        ${ex.title}</h3>`;
    if (ex.intro) html += `<p class="muted small" style="margin:-2px 0 12px">${ex.intro}</p>`;
    card.innerHTML = html;
    ex.parts.forEach((part, i) => {
      const wrap = V.el("div", { style: { margin: "10px 0", borderTop: i ? "1px solid var(--line)" : "none", paddingTop: i ? "12px" : "0" } });
      wrap.appendChild(V.el("div", { html: `<b>${i + 1}.</b> ${part.q}`, style: { fontSize: "14.5px" } }));
      const btn = V.el("button.btn.ghost.small", { text: "Show solution", style: { marginTop: "8px" } });
      const ans = V.el("div.callout.key", { html: part.a, style: { display: "none", marginTop: "8px" } });
      btn.addEventListener("click", () => {
        const open = ans.style.display !== "none";
        ans.style.display = open ? "none" : "block";
        btn.textContent = open ? "Show solution" : "Hide solution";
      });
      wrap.appendChild(btn); wrap.appendChild(ans);
      card.appendChild(wrap);
    });
    container.appendChild(card);
  };
})(typeof window !== "undefined" ? window : globalThis);
