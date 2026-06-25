/* =====================================================================
   PPD 504 Studio - practice.js
   The practice engine + problem bank. Two kinds of problems:
     - conceptual: { q, hint, a }                         (a = worked solution HTML)
     - data:       { q, dataset, render?, solve(D,S) -> {hint, a} }
   Data problems compute every number live from PPD504.data via the stats
   library, so an answer can never drift from the shipped data or be made up.
   Each problem reveals graduated help: a Hint, then the full Solution.
   PPD504.renderPracticeBank(container, moduleId) is called by the router.
   ===================================================================== */
(function (root) {
  "use strict";
  const P = root.PPD504 = root.PPD504 || {};
  const NF = (x, d) => (P.stats ? P.stats.fmt(x, d) : x);
  const usd = (x) => "$" + Math.round(x).toLocaleString("en-US");
  const usdk = (x) => "$" + NF(x / 1000, 1) + "k";

  /* ---------- small inline charts for data problems ---------- */
  const mini = {
    bars(mount, items, value, label, color) {
      const V = P.viz, d3 = root.d3;
      const sorted = items.slice().sort((a, b) => value(b) - value(a));
      const dims = V.svg(mount, { height: 150, margin: { top: 8, right: 12, bottom: 18, left: 12 } });
      const x = d3.scaleBand().domain(sorted.map((_, i) => i)).range([0, dims.innerW]).padding(0.12);
      const y = d3.scaleLinear().domain([0, d3.max(sorted, value) * 1.05]).range([dims.innerH, 0]);
      const tip = V.tooltip();
      dims.g.selectAll("rect").data(sorted).enter().append("rect")
        .attr("x", (_, i) => x(i)).attr("width", x.bandwidth())
        .attr("y", (d) => y(value(d))).attr("height", (d) => dims.innerH - y(value(d)))
        .attr("fill", color || V.color("c-blue")).attr("rx", 1)
        .on("mouseover", (ev, d) => tip.show(label(d), ev))
        .on("mousemove", (ev) => tip.move(ev)).on("mouseout", () => tip.hide());
    },
    line(mount, series, fmtY) {
      const V = P.viz, d3 = root.d3;
      const dims = V.svg(mount, { height: 160, margin: { top: 10, right: 16, bottom: 26, left: 46 } });
      const x = d3.scalePoint().domain(series.map((d) => d.date)).range([0, dims.innerW]);
      const y = d3.scaleLinear().domain(d3.extent(series, (d) => d.value)).nice().range([dims.innerH, 0]);
      dims.g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickFormat(fmtY || ((v) => v)));
      const everyN = Math.ceil(series.length / 6);
      dims.g.append("g").attr("class", "axis").attr("transform", `translate(0,${dims.innerH})`)
        .call(d3.axisBottom(x).tickValues(series.filter((_, i) => i % everyN === 0).map((d) => d.date))
          .tickFormat((d) => String(d).slice(0, 7)));
      const line = d3.line().x((d) => x(d.date)).y((d) => y(d.value));
      dims.g.append("path").datum(series).attr("fill", "none")
        .attr("stroke", V.color("cardinal")).attr("stroke-width", 2).attr("d", line);
    },
    scatter(mount, pts, xl, yl) {
      const V = P.viz, d3 = root.d3;
      const dims = V.svg(mount, { height: 220, margin: { top: 10, right: 16, bottom: 40, left: 52 } });
      const x = d3.scaleLinear().domain(d3.extent(pts, (d) => d.x)).nice().range([0, dims.innerW]);
      const y = d3.scaleLinear().domain(d3.extent(pts, (d) => d.y)).nice().range([dims.innerH, 0]);
      const ymax = d3.max(pts, (d) => Math.abs(d.y));
      const yfmt = ymax >= 1000 ? (v) => "$" + (v / 1000) + "k" : null;
      V.axes(dims.g, x, y, dims, { xlabel: xl, ylabel: yl, xticks: 6, yticks: 5, yfmt: yfmt });
      const tip = V.tooltip();
      dims.g.selectAll("circle").data(pts).enter().append("circle")
        .attr("cx", (d) => x(d.x)).attr("cy", (d) => y(d.y)).attr("r", 4)
        .attr("fill", V.color("c-blue")).attr("fill-opacity", 0.75).attr("stroke", "#fff").attr("stroke-width", 0.6)
        .on("mouseover", (ev, d) => tip.show(d.label || "", ev))
        .on("mousemove", (ev) => tip.move(ev)).on("mouseout", () => tip.hide());
      return { x, y, dims };
    },
    table(mount, head, rows) {
      const t = P.viz.el("table.data");
      t.innerHTML = "<thead><tr>" + head.map((h) => `<th>${h}</th>`).join("") + "</tr></thead><tbody>" +
        rows.map((r) => "<tr>" + r.map((c) => `<td>${c}</td>`).join("") + "</tr>").join("") + "</tbody>";
      mount.appendChild(t);
    },
  };
  P.practiceMini = mini;

  /* ---------- one problem, with Hint + Solution toggles ---------- */
  function renderProblem(prob, i, host) {
    const V = P.viz, S = P.stats, D = P.data;
    const wrap = V.el("div", { style: { margin: "14px 0", borderTop: i ? "1px solid var(--line)" : "none", paddingTop: i ? "16px" : "0" } });

    let solved = { hint: prob.hint, a: prob.a };
    if (prob.solve) { try { solved = prob.solve(D, S) || {}; } catch (e) { solved = { a: "Solution unavailable: " + e.message }; } }

    // dataset provenance chip
    if (prob.dataset && D && D[prob.dataset]) {
      const m = D[prob.dataset].meta || {};
      wrap.appendChild(V.el("div", {
        html: `<span style="font-size:10.5px;font-weight:700;letter-spacing:.05em;color:var(--c-teal);text-transform:uppercase">Real data</span>
               <span class="muted small"> &nbsp;${m.title || prob.dataset}. ${m.source || ""}</span>`,
        style: { marginBottom: "8px" },
      }));
    }
    wrap.appendChild(V.el("div", { html: `<b>${i + 1}.</b> ${prob.q}`, style: { fontSize: "14.5px" } }));

    // optional inline data visualization
    if (prob.render) {
      const mount = V.el("div", { style: { margin: "10px 0" } });
      wrap.appendChild(mount);
      try { prob.render(mount, P.data, S, V, root.d3); } catch (e) { mount.appendChild(V.el("div.muted.small", { text: "(chart unavailable)" })); }
    }

    // toggles
    const btns = V.el("div.btn-row", { style: { marginTop: "10px" } });
    const hintBox = V.el("div.callout", { html: solved.hint || "", style: { display: "none", marginTop: "8px" } });
    const ansBox = V.el("div.callout.key", { html: solved.a || "", style: { display: "none", marginTop: "8px" } });
    if (solved.hint) {
      const bH = V.el("button.btn.ghost.small", { text: "Hint" });
      bH.addEventListener("click", () => {
        const open = hintBox.style.display !== "none";
        hintBox.style.display = open ? "none" : "block";
        bH.textContent = open ? "Hint" : "Hide hint";
      });
      btns.appendChild(bH);
    }
    const bA = V.el("button.btn.small", { text: "Show solution" });
    bA.addEventListener("click", () => {
      const open = ansBox.style.display !== "none";
      ansBox.style.display = open ? "none" : "block";
      bA.textContent = open ? "Show solution" : "Hide solution";
    });
    btns.appendChild(bA);
    wrap.appendChild(btns);
    if (solved.hint) wrap.appendChild(hintBox);
    wrap.appendChild(ansBox);
    return wrap;
  }

  P.renderPracticeBank = function (container, moduleId) {
    const bank = (P.practiceBank || {})[moduleId];
    if (!bank || !bank.length) return;
    const V = P.viz;
    const card = V.el("div.card");
    card.innerHTML = `<h3 style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;background:var(--c-teal);color:#fff;padding:2px 8px;border-radius:999px;font-weight:700">PRACTICE</span>
        More practice</h3>
      <p class="muted small" style="margin:-2px 0 6px">Several carry real public data. Try a Hint before opening the full solution.</p>`;
    bank.forEach((prob, i) => card.appendChild(renderProblem(prob, i, card)));
    container.appendChild(card);
  };

  /* =====================================================================
     THE BANK. Keyed by module id. Data problems compute from PPD504.data.
     ===================================================================== */
  const inc = (D) => D.state_income.rows.map((r) => r.medianIncome);
  const eduRows = (D) => D.state_education_income.rows;

  P.practiceBank = {
    /* ---------------- WEEK 1 ---------------- */
    "w1-sampling": [
      { q: "A polling firm wants the average rent in a city of 400,000 renters. They interview 600 renters and get a mean of $1,840. Name the population, the sample, the parameter, and the statistic.",
        hint: "The parameter is the fixed truth about the whole group; the statistic is what you computed from the sample.",
        a: "Population: all 400,000 renters. Sample: the 600 interviewed. Parameter: the true mean rent across all 400,000 (unknown). Statistic: the $1,840 sample mean, our estimate of that parameter." },
      { q: "Treat the 2023 median household incomes of all 50 states and DC as a population. If you take a simple random sample of states and average them, is your answer a parameter or a statistic, and what value is it estimating?",
        dataset: "state_income",
        render: (mount, D, S) => mini.bars(mount, D.state_income.rows, (r) => r.medianIncome, (r) => `${r.state}: ${usd(r.medianIncome)}`, P.viz.color("c-blue")),
        solve: (D, S) => {
          const v = inc(D); const mu = S.mean(v);
          return {
            hint: "The whole-population number is fixed; any sample average is a statistic that jumps around it.",
            a: `Your sample average is a <b>statistic</b>. It estimates the population parameter, the mean of all 51 values, which here equals <b>${usd(mu)}</b>. A different random sample of states would give a slightly different statistic, but they cluster around that one fixed parameter.`,
          };
        } },
    ],
    "w1-bias": [
      { q: "A city posts an online survey on its website asking 'Should we build more bike lanes?' Of 4,000 self-selected responses, 71% say yes. Why can the city not treat 71% as the views of all residents?",
        hint: "Who chooses to answer an open online survey, and how do they differ from everyone else?",
        a: "This is a <b>voluntary response sample</b>: people with strong feelings (and website visitors, who skew younger and more online) opt in. The 71% is biased toward whoever cared enough to click. A bigger pile of self-selected responses does not fix the tilt." },
      { q: "A phone survey dials only landlines. What kind of bias is that, and which residents does it systematically miss?",
        hint: "Some groups are absent from the list you sample from.",
        a: "<b>Undercoverage.</b> The sampling frame (landline numbers) leaves out cell-only households, which skew younger and lower-income. The estimate is systematically off because whole groups never had a chance to be selected." },
    ],
    "w1-confounding": [
      { q: "Cities with more police officers per capita tend to have more reported crime. Does that mean police cause crime? Identify the likely confounder and the fix.",
        hint: "What drives a city to hire more police in the first place?",
        a: "Almost certainly not. A <b>lurking variable</b>, the underlying crime level, drives both: high-crime cities hire more police. This is an observational comparison, so the link is confounded. Only an experiment (or a design that mimics one) that varies policing independently of crime could isolate a causal effect." },
      { q: "Students who attend test-prep courses score higher on the SAT. Why is the raw difference not the causal effect of the course?",
        hint: "Who signs up for (and can afford) test prep?",
        a: "Students who take prep courses differ before the course: they tend to be more motivated and from higher-income families, both of which raise scores on their own. That is <b>selection into treatment</b>. Randomly assigning students to prep vs no prep would balance those traits and reveal the true effect." },
    ],
    "w1-ethics": [
      { q: "A researcher publishes a dataset that lists each participant's name, ZIP code, and a sensitive health diagnosis. Which data-ethics principle is violated?",
        hint: "Confidentiality protects information that could identify a person.",
        a: "<b>Confidentiality.</b> Names plus ZIP plus diagnosis can identify individuals. Only statistical summaries for groups may be made public; individual identifying data must be kept confidential. (Note that confidentiality differs from anonymity, where even the researchers cannot link data to a person.)" },
      { q: "A study observes pedestrians crossing a public street and records only whether they jaywalk, with no names. The IRB approves it without requiring written consent. Is that acceptable?",
        hint: "Think about anonymous observation of behavior in a public place.",
        a: "Yes. Anonymous observation of behavior in a public place, with IRB review and no identifying data, generally does not require individual informed consent under standard human-subjects rules. The key safeguards (IRB review, no identifiable data) are in place." },
    ],

    /* ---------------- WEEK 2 ---------------- */
    "w2-vartypes": [
      { q: "Classify each variable in these real Census tables: (a) state name, (b) median household income, (c) the education buckets 'HS or less / some college / bachelor's / graduate', (d) a state's total population count.",
        hint: "Ask: numeric with meaningful differences? If categorical, is there a natural order?",
        a: "(a) state name: <b>nominal</b> (categories, no order). (b) median income: <b>continuous</b> quantitative (dollars on a scale). (c) education buckets: <b>ordinal</b> (ordered categories, but the gaps are not equal). (d) population count: <b>discrete</b> quantitative (a count), though with millions of possible values it is often treated as continuous." },
    ],
    "w2-meanmedian": [
      { q: "Across all 50 states and DC, compare the mean and the median of 2023 median household income. Which is larger, what does that say about the shape, and which would you report as the 'typical' state?",
        dataset: "state_income",
        render: (mount, D) => mini.bars(mount, D.state_income.rows, (r) => r.medianIncome, (r) => `${r.state}: ${usd(r.medianIncome)}`, P.viz.color("c-blue")),
        solve: (D, S) => {
          const v = inc(D); const mu = S.mean(v), md = S.median(v);
          const hi = D.state_income.rows.reduce((a, b) => b.medianIncome > a.medianIncome ? b : a);
          const lo = D.state_income.rows.reduce((a, b) => b.medianIncome < a.medianIncome ? b : a);
          return {
            hint: "Compute both, then see which sits higher. A long upper tail pulls the mean above the median.",
            a: `Mean = <b>${usd(mu)}</b>, median = <b>${usd(md)}</b>. The mean is the larger of the two, so the distribution is mildly <b>right-skewed</b>: a few high-income states (${hi.state} at ${usd(hi.medianIncome)}) pull the mean up, while most states sit lower (${lo.state} is lowest at ${usd(lo.medianIncome)}). For a 'typical' state the <b>median (${usd(md)})</b> is the safer summary because it resists those high outliers.`,
          };
        } },
    ],
    "w2-histogram": [
      { q: "If you built a histogram of the 51 state median incomes above, describe its likely shape, center, and spread in words, and say where you would look for outliers.",
        dataset: "state_income",
        render: (mount, D) => mini.bars(mount, D.state_income.rows, (r) => r.medianIncome, (r) => `${r.state}: ${usd(r.medianIncome)}`, P.viz.color("c-slate")),
        solve: (D, S) => {
          const v = inc(D);
          return {
            hint: "Shape comes from skew (mean vs median), center from the median, spread from the range or SD.",
            a: `Shape: single-peaked and slightly <b>right-skewed</b> (a cluster in the $60k to $85k range with a thin high tail). Center: median near <b>${usd(S.median(v))}</b>. Spread: from <b>${usd(S.min(v))}</b> to <b>${usd(S.max(v))}</b>, an SD of about <b>${usd(S.sd(v))}</b>. Look for outliers in the high tail (the wealthiest states/DC), since the skew lives there.`,
          };
        } },
    ],
    "w2-spread": [
      { q: "Compute the standard deviation of the 51 state median incomes. Then explain in one sentence what that number means in plain English.",
        dataset: "state_income",
        solve: (D, S) => {
          const v = inc(D);
          return {
            hint: "Use the sample SD (divide the sum of squared deviations by n - 1, then take the square root).",
            a: `s = <b>${usd(S.sd(v))}</b> (with mean ${usd(S.mean(v))}). In plain words: a typical state's median income sits roughly ${usd(S.sd(v))} away from the national average of state medians. Larger s would mean states differ more from one another.`,
          };
        } },
    ],
    "w2-boxplot": [
      { q: "Build the five-number summary of the 51 state median incomes and apply the 1.5 x IQR rule. Are any states flagged as suspected outliers?",
        dataset: "state_income",
        solve: (D, S) => {
          const v = inc(D); const f = S.fiveNumber(v); const fen = S.outlierFences(v);
          const out = fen.outliers.map((x) => { const row = D.state_income.rows.find((r) => r.medianIncome === x); return (row ? row.state : "") + " (" + usd(x) + ")"; });
          return {
            hint: "Order the data; find Q1, median, Q3; IQR = Q3 - Q1; fences are Q1 - 1.5 IQR and Q3 + 1.5 IQR.",
            a: `Five-number summary: min ${usd(f.min)}, Q1 ${usd(f.q1)}, median ${usd(f.median)}, Q3 ${usd(f.q3)}, max ${usd(f.max)}. IQR = ${usd(fen.iqr)}. Fences: ${usd(fen.lower)} and ${usd(fen.upper)}. ` +
               (out.length ? `Flagged as suspected high outliers: <b>${out.join(", ")}</b>.` : `<b>No states fall beyond the fences</b>, so the rule flags no outliers, even though the distribution is mildly skewed.`),
          };
        } },
    ],

    /* ---------------- WEEK 3 ---------------- */
    "w3-longrun": [
      { q: "You believe a coin is fair. After 10 flips you have 7 heads (70%). After 1,000 flips you have 508 heads (50.8%). Explain why the second proportion is closer to 0.5.",
        hint: "Probability is the long-run proportion, not a promise about short runs.",
        a: "Probability is defined as the proportion over a very long series of repetitions. Short runs are noisy, so 7 of 10 is unremarkable. As the number of flips grows, the running proportion settles toward the true 0.5 (the law of large numbers). The 1,000-flip estimate is closer simply because it is the long run." },
    ],
    "w3-benford": [
      { q: "Take the leading digit of each state's total population (50 states + DC). Tally how often each first digit 1 to 9 appears, and compare to Benford's law, which predicts digit 1 about 30% of the time.",
        dataset: "state_population",
        render: (mount, D, S, V, d3) => {
          const counts = Array(9).fill(0);
          D.state_population.rows.forEach((r) => { const d = +String(r.population)[0]; if (d >= 1) counts[d - 1]++; });
          const n = D.state_population.rows.length;
          const data = counts.map((c, i) => ({ digit: i + 1, obs: c / n, ben: Math.log10(1 + 1 / (i + 1)) }));
          const dims = V.svg(mount, { height: 150, margin: { top: 8, right: 12, bottom: 22, left: 32 } });
          const x = d3.scaleBand().domain(data.map((d) => d.digit)).range([0, dims.innerW]).padding(0.2);
          const y = d3.scaleLinear().domain([0, 0.4]).range([dims.innerH, 0]);
          dims.g.append("g").attr("class", "axis").attr("transform", `translate(0,${dims.innerH})`).call(d3.axisBottom(x));
          dims.g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4).tickFormat((t) => Math.round(t * 100) + "%"));
          dims.g.selectAll("rect").data(data).enter().append("rect")
            .attr("x", (d) => x(d.digit)).attr("width", x.bandwidth()).attr("y", (d) => y(d.obs))
            .attr("height", (d) => dims.innerH - y(d.obs)).attr("fill", V.color("c-blue")).attr("rx", 1);
          dims.g.selectAll("line.ben").data(data).enter().append("line").attr("class", "ben")
            .attr("x1", (d) => x(d.digit)).attr("x2", (d) => x(d.digit) + x.bandwidth())
            .attr("y1", (d) => y(d.ben)).attr("y2", (d) => y(d.ben))
            .attr("stroke", V.color("cardinal")).attr("stroke-width", 2.5);
        },
        solve: (D, S) => {
          const counts = Array(9).fill(0);
          D.state_population.rows.forEach((r) => { const d = +String(r.population)[0]; if (d >= 1) counts[d - 1]++; });
          const n = D.state_population.rows.length;
          return {
            hint: "Read the first character of each population, count how many start with 1, with 2, and so on, then divide by 51.",
            a: `Of ${n} states, ${counts[0]} start with the digit 1 (about ${NF(100 * counts[0] / n, 0)}%), the most common leading digit, matching Benford's prediction of roughly 30% (red lines). Blue bars are the observed shares. With only 51 values the fit is rough, but the downward staircase (1 more common than 2, 2 more than 3, ...) is clearly there. Benford fits best for data spanning many orders of magnitude.`,
          };
        } },
    ],
    "w3-density": [
      { q: "A density curve is drawn so that the total area under it equals 1. The area under the curve between income $40k and $60k is 0.22. What does the 0.22 mean, and where on the curve do the mean and median sit if the curve has a long right tail?",
        hint: "Area under a density curve over a range equals a proportion. The mean is the balance point.",
        a: "0.22 means 22% of the distribution falls between $40k and $60k (area = proportion). With a long right tail, the mean is pulled toward the tail and sits to the <b>right</b> of the median; the median stays at the equal-areas point (half the area on each side)." },
    ],
    "w3-normal": [
      { q: "SAT section scores are roughly Normal with mean 500 and standard deviation 100. Use the 68-95-99.7 rule (no tables) to find: (a) the middle 95% of scores, (b) the percent above 700, (c) the percent below 400.",
        hint: "Mark the curve at 300, 400, 500, 600, 700: those are -2, -1, 0, +1, +2 standard deviations.",
        a: "(a) Middle 95% = mean +/- 2 SD = 500 +/- 200 = <b>300 to 700</b>. (b) 700 is +2 SD; 95% are within +/-2 SD, so 5% are in the two tails and <b>2.5%</b> are above 700. (c) 400 is -1 SD; 68% are within +/-1 SD, leaving 16% in each tail, so <b>16%</b> score below 400." },
    ],
    "w3-zscore": [
      { q: "Standardize one state's 2023 median household income against all 51 states: take California ($96,334) and find its z-score and roughly what percentile that puts it in.",
        dataset: "state_income",
        solve: (D, S) => {
          const v = inc(D); const mu = S.mean(v), sd = S.sd(v);
          const ca = D.state_income.rows.find((r) => r.abbr === "CA").medianIncome;
          const z = (ca - mu) / sd; const pct = S.normalCDF(z) * 100;
          return {
            hint: "z = (value - mean) / SD, using the mean and SD of all 51 states.",
            a: `Mean = ${usd(mu)}, SD = ${usd(sd)}. z = (${usd(ca)} - ${usd(mu)}) / ${usd(sd)} = <b>${NF(z, 2)}</b>. California sits about ${NF(z, 1)} standard deviations above the average state, near the <b>${NF(pct, 0)}th percentile</b> of states. The z-score lets you compare it on the same ruler as any other distribution.`,
          };
        } },
    ],

    /* ---------------- WEEK 4 ---------------- */
    "w4-scatter": [
      { q: "Across the 50 states and DC, plot the percent of adults with a bachelor's degree against median household income. Estimate the correlation r and describe the relationship.",
        dataset: "state_education_income",
        render: (mount, D, S, V) => {
          const pts = eduRows(D).map((r) => ({ x: r.bachelorsPct, y: r.medianIncome, label: `${r.state}: ${r.bachelorsPct}%, ${usd(r.medianIncome)}` }));
          mini.scatter(mount, pts, "% adults with a bachelor's+", "median income ($)");
        },
        solve: (D, S) => {
          const xs = eduRows(D).map((r) => r.bachelorsPct), ys = eduRows(D).map((r) => r.medianIncome);
          const r = S.correlation(xs, ys);
          return {
            hint: "Positive and tight points give r near +1; a loose cloud gives r near 0.",
            a: `r = <b>${NF(r, 2)}</b>: a strong <b>positive linear</b> relationship. States where more adults hold a bachelor's degree tend to have higher median incomes. Strong, but not perfect (r is not 1), and correlation here is not proof that education alone causes the income gap.`,
          };
        } },
    ],
    "w4-traps": [
      { q: "Across the states, does median income rise or fall with the poverty rate, and would you expect a strong correlation? Then explain why a strong correlation here still would not prove income 'causes' lower poverty.",
        dataset: "state_poverty",
        solve: (D, S) => {
          const join = D.state_poverty.rows.map((p) => { const i = D.state_income.rows.find((q) => q.abbr === p.abbr); return i ? { pov: p.povertyPct, inc: i.medianIncome } : null; }).filter(Boolean);
          const r = S.correlation(join.map((d) => d.inc), join.map((d) => d.pov));
          return {
            hint: "Higher-income states should have lower poverty, so expect a negative r.",
            a: `r = <b>${NF(r, 2)}</b>: a strong <b>negative</b> relationship, higher-income states have lower poverty rates, as expected (the two measures partly mirror each other). But a strong r is still just association: income and poverty are both shaped by the same underlying economy, so neither number alone establishes that one causes the other.`,
          };
        } },
    ],
    "w4-twoway": [
      { q: "Using the real 2023 counts of U.S. adults 25+ by sex and highest education, answer: among people whose highest degree is a bachelor's, what percent are women? And among women, what percent hold a graduate degree?",
        dataset: "us_sex_education",
        render: (mount, D) => {
          const t = D.us_sex_education;
          mini.table(mount, [""].concat(t.colLabels, ["Total"]),
            t.rowLabels.map((rl, i) => [rl].concat(t.counts[i].map((c) => (c / 1e6).toFixed(1) + "M"), [(t.counts[i].reduce((a, b) => a + b, 0) / 1e6).toFixed(1) + "M"])));
        },
        solve: (D, S) => {
          const t = D.us_sex_education; const male = t.counts[0], female = t.counts[1];
          const bachCol = 2, gradCol = 3;
          const womenAmongBach = 100 * female[bachCol] / (male[bachCol] + female[bachCol]);
          const gradAmongWomen = 100 * female[gradCol] / female.reduce((a, b) => a + b, 0);
          return {
            hint: "First question fixes the bachelor's column (divide within it). Second fixes the women row.",
            a: `Among bachelor's holders: women / (men + women) = ${(female[bachCol] / 1e6).toFixed(1)}M / ${((male[bachCol] + female[bachCol]) / 1e6).toFixed(1)}M = <b>${NF(womenAmongBach, 1)}%</b> are women (a column/conditional percent). Among women: graduate-degree holders / all women = <b>${NF(gradAmongWomen, 1)}%</b> (a row/conditional percent). The two questions condition on different variables, so they divide by different totals.`,
          };
        } },
    ],
    "w4-ols": [
      { q: "Fit the least-squares line predicting state median income (y) from the percent with a bachelor's degree (x). Report the slope and intercept, interpret the slope, and predict income for a state where 35% hold a bachelor's degree.",
        dataset: "state_education_income",
        render: (mount, D, S, V, d3) => {
          const rows = eduRows(D);
          const pts = rows.map((r) => ({ x: r.bachelorsPct, y: r.medianIncome, label: `${r.abbr}` }));
          const sc = mini.scatter(mount, pts, "% bachelor's+", "median income ($)");
          const reg = S.linreg(rows.map((r) => r.bachelorsPct), rows.map((r) => r.medianIncome));
          const xd = sc.x.domain();
          sc.dims.g.append("line").attr("x1", sc.x(xd[0])).attr("y1", sc.y(reg.fitted(xd[0])))
            .attr("x2", sc.x(xd[1])).attr("y2", sc.y(reg.fitted(xd[1])))
            .attr("stroke", V.color("cardinal")).attr("stroke-width", 2);
        },
        solve: (D, S) => {
          const rows = eduRows(D);
          const reg = S.linreg(rows.map((r) => r.bachelorsPct), rows.map((r) => r.medianIncome));
          const pred = reg.fitted(35);
          return {
            hint: "Slope b = change in predicted y per one-point rise in x; prediction = intercept + slope x 35.",
            a: `Line: income-hat = ${usd(reg.intercept)} + ${usd(reg.slope)} x (percent bachelor's). Slope: each additional <b>1 percentage point</b> of adults with a bachelor's degree is associated with about <b>${usd(reg.slope)}</b> more in median income. R-squared = <b>${NF(reg.r2, 2)}</b> (the line explains ${NF(reg.r2 * 100, 0)}% of the variation across states). Prediction at 35%: ${usd(reg.intercept)} + ${usd(reg.slope)}(35) = <b>${usd(pred)}</b>.`,
          };
        } },
    ],
    "w4-residuals": [
      { q: "Using the education-to-income regression line, compute the residual for California (36.5% bachelor's, $96,334 median income). Does California earn more or less than its education level predicts?",
        dataset: "state_education_income",
        solve: (D, S) => {
          const rows = eduRows(D);
          const reg = S.linreg(rows.map((r) => r.bachelorsPct), rows.map((r) => r.medianIncome));
          const ca = rows.find((r) => r.abbr === "CA");
          const pred = reg.fitted(ca.bachelorsPct); const resid = ca.medianIncome - pred;
          return {
            hint: "Residual = observed y - predicted y-hat. Predict with the line, then subtract.",
            a: `Predicted: ${usd(reg.intercept)} + ${usd(reg.slope)}(${ca.bachelorsPct}) = ${usd(pred)}. Residual = observed - predicted = ${usd(ca.medianIncome)} - ${usd(pred)} = <b>${(resid >= 0 ? "+" : "") + usd(resid)}</b>. The residual is ${resid >= 0 ? "positive, so California earns somewhat <b>more</b> than its education level alone predicts" : "negative, so California earns <b>less</b> than its education level predicts"} (cost of living and industry mix are part of what the simple line leaves out).`,
          };
        } },
    ],
  };
})(typeof window !== "undefined" ? window : globalThis);
