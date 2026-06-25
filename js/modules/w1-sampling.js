/* =====================================================================
   w1-sampling, Sampling and statistical inference
   Build a sampling distribution by hand: a fixed, right-skewed
   population of 400 households sits on the left; draw samples on the
   right and watch the sample means pile up around the true mean. A
   bigger n tightens the pile; convenience sampling shifts it off the
   truth. The whole point is that a good sample lets you infer a number
   about a population you never fully measure.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w1-sampling"] = {
    render(container) {
      P.lessonHeader(container, "w1-sampling",
        "You can't survey everyone. So you draw a sample and use it to guess a number about the whole population. " +
        "This lab shows when that guess lands on the truth, and when it does not.");

      /* ---------- concept card ---------- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>From a sample to the whole population</h3>
        <div class="callout"><span class="label">Population and sample</span>
          The <b>population</b> is everyone you care about (say, every household in Los Angeles).
          A <b>sample</b> is the handful you actually measure. You study the sample because measuring
          the whole population is too slow or too expensive.
        </div>
        <div class="callout"><span class="label">Parameter and statistic</span>
          A <b>parameter</b> is a fixed number that describes the whole population, for example the
          population's true average income (the gold line in the lab below). A <b>statistic</b> is the
          same kind of number computed from one sample, like the average of the households you happened
          to draw. The parameter never changes; the statistic jumps around from sample to sample.
          Inference is using the statistic to estimate the parameter you cannot see.
        </div>
        <div class="callout"><span class="label">A simple random sample (SRS)</span>
          An SRS gives every group of <i>n</i> households an equal chance of being chosen. Drawing
          at random is what keeps the sample fair: it has no reason to lean rich or poor, so its
          average lands near the truth. Larger random samples give more precise estimates.
        </div>
        <div class="callout warn"><span class="label">Convenience sampling biases the answer</span>
          Grab whoever is easiest to reach (the nearest blocks, the people who pick up the phone)
          and the sample stops representing the population. The estimate is then systematically off,
          the same direction every time. That offset is <b>bias</b>, and a bigger sample does not fix it.
        </div>`;
      container.appendChild(concept);

      /* ---------- interactive lab ---------- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Sampling distribution builder</h3>
        <p>Left: a fixed population of 400 households, one dot each, drawn from a right-skewed income shape.
        The dashed gold line is the true mean (the parameter you are trying to recover). Right: a histogram
        of the mean from every sample you draw. Pick a sample size, pick a method, and draw.</p>
      </div>`;
      const body = V.el("div.lab-body");

      /* two-panel plot row */
      const panels = V.el("div", { style: { display: "flex", flexWrap: "wrap", gap: "16px" } });
      const popPlot = V.el("div", { style: { flex: "1 1 300px", minWidth: "280px" } });
      const distPlot = V.el("div", { style: { flex: "1 1 300px", minWidth: "280px" } });
      panels.appendChild(popPlot);
      panels.appendChild(distPlot);
      body.appendChild(panels);

      /* legend */
      const legend = V.el("div.legend", { style: { marginTop: "10px" } });
      legend.innerHTML = `
        <span class="swatch"><i style="background:${V.color("c-slate")}"></i> population household</span>
        <span class="swatch"><i style="background:${V.color("c-blue")}"></i> in last sample</span>
        <span class="swatch"><i style="width:14px;height:0;border-top:2px dashed ${V.color("gold")};border-radius:0"></i> true mean (parameter)</span>
        <span class="swatch"><i style="background:${V.color("cardinal")}"></i> mean of sample means</span>`;
      body.appendChild(legend);

      /* stat readouts */
      const stats = V.el("div.stat-row", { style: { marginTop: "12px" } });
      const sParam = V.stat("True mean (parameter)", "—", "");
      const sLast = V.stat("Last sample mean", "—", "");
      const sMeanOf = V.stat("Mean of sample means", "—", "accent");
      const sSE = V.stat("Spread of means (SE)", "—", "");
      const sCount = V.stat("Samples drawn", "0", "");
      [sParam, sLast, sMeanOf, sSE, sCount].forEach((s) => stats.appendChild(s));
      sParam.querySelector(".v").style.color = V.color("gold");
      sLast.querySelector(".v").style.color = V.color("c-blue");
      body.appendChild(stats);

      const verdict = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(verdict);
      lab.appendChild(body);

      /* controls */
      const controls = V.el("div.lab-controls");

      const methodSeg = V.el("div.seg");
      [["SRS", "Simple random"], ["Convenience", "Convenience"]].forEach(([key, label], i) => {
        const b = V.el("button", { text: label });
        if (i === 0) b.classList.add("active");
        b.dataset.method = key;
        methodSeg.appendChild(b);
      });
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Sampling method" }), methodSeg]));

      const nSlider = V.slider({
        label: "Sample size n", min: 5, max: 100, step: 1, value: 25,
        format: (v) => v + " households",
        on: () => { /* size changes apply to the next draw; nothing to redraw now */ },
      });
      controls.appendChild(nSlider.wrap);

      const row = V.el("div.btn-row");
      const bOne = V.el("button.btn.primary", { text: "Draw 1 sample" });
      const bMany = V.el("button.btn", { text: "Draw 200 samples" });
      const bReset = V.el("button.btn.ghost", { text: "Reset" });
      [bOne, bMany, bReset].forEach((b) => row.appendChild(b));
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Draw" }), row]));

      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---------- quick check ---------- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">A city's true average commute is 31 minutes. A survey of 500 randomly chosen
          residents finds an average of 32.4 minutes. Which is the parameter and which is the statistic?</div>
          <button class="opt" data-ok="0">31 is the statistic; 32.4 is the parameter</button>
          <button class="opt" data-ok="1">31 is the parameter; 32.4 is the statistic</button>
          <button class="opt" data-ok="0">Both are parameters, since both are averages</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ===================================================================
         Population: 400 households, right-skewed income (in $1000s).
         Built once with a seeded RNG so it is identical on every visit.
         =================================================================== */
      const N = 400;
      const rand = S.rng(20504);          // fixed seed: reproducible population
      const population = [];
      for (let i = 0; i < N; i++) {
        // log-normal-ish: exponentiate a normal to get a right skew, then scale
        const z = S.gaussian(rand, 0, 0.55);
        let inc = 30 * Math.exp(z);       // most households $20k–$120k, a long upper tail
        inc = Math.max(8, Math.min(260, inc));   // clamp to a sensible window
        population.push(inc);
      }
      const PARAM = S.mean(population);    // the true population mean (the parameter)
      const popMin = S.min(population), popMax = S.max(population);

      /* indices sorted low-to-high income, used for convenience sampling
         (convenience = always grab the easiest-to-reach, lowest-income blocks) */
      const sortedIdx = population
        .map((v, i) => ({ v, i }))
        .sort((a, b) => a.v - b.v)
        .map((d) => d.i);

      let sampleMeans = [];               // collected statistics
      let lastSampleIdx = new Set();      // which dots were in the most recent draw
      let drawRand = S.rng(99173);        // separate seed for the draws

      /* ---------- left panel: population strip ---------- */
      const pd = V.svg(popPlot, { height: 260, margin: { top: 26, right: 18, bottom: 44, left: 18 } });
      const pg = pd.g;
      const px = d3.scaleLinear().domain([0, 270]).range([0, pd.innerW]);

      pg.append("text").attr("x", 0).attr("y", -10).attr("font-size", 12.5)
        .attr("font-weight", 600).attr("fill", V.color("ink-600"))
        .text("Population: 400 households");

      pg.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${pd.innerH})`)
        .call(d3.axisBottom(px).ticks(6).tickFormat((d) => "$" + d + "k"));

      pg.append("text").attr("class", "axis-label")
        .attr("x", pd.innerW / 2).attr("y", pd.innerH + 38)
        .attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("household income");

      /* deterministic vertical jitter so the 400 dots read as a cloud, not a line */
      const jitterRand = S.rng(7);
      const stripTop = 6, stripBot = pd.innerH - 6;
      const popDots = population.map((v, i) => ({
        v, i, cy: stripTop + jitterRand() * (stripBot - stripTop),
      }));

      pg.selectAll("circle.pop").data(popDots).join("circle")
        .attr("class", "pop")
        .attr("cx", (d) => px(d.v)).attr("cy", (d) => d.cy)
        .attr("r", 2.6)
        .attr("fill", V.color("c-slate")).attr("fill-opacity", 0.5);

      const sampleLayer = pg.append("g");   // highlighted sampled dots drawn on top

      // true-mean line on the population panel
      pg.append("line")
        .attr("x1", px(PARAM)).attr("x2", px(PARAM))
        .attr("y1", -4).attr("y2", pd.innerH)
        .attr("stroke", V.color("gold")).attr("stroke-width", 2).attr("stroke-dasharray", "5 3");
      pg.append("text").attr("x", px(PARAM)).attr("y", -16)
        .attr("text-anchor", "middle").attr("font-size", 11).attr("font-weight", 700)
        .attr("fill", V.color("gold")).text("true mean");

      const tip = V.tooltip();
      pg.selectAll("circle.pop")
        .on("mouseover", (ev, d) => tip.show("household income = <b>$" + S.fmt(d.v, 1) + "k</b>", ev))
        .on("mousemove", (ev) => tip.move(ev))
        .on("mouseout", () => tip.hide());

      /* ---------- right panel: histogram of sample means ---------- */
      const NBINS = 26;
      const HLO = 8, HHI = 72;             // window for the sample-mean histogram:
                                           // covers SRS means (≈15–69) AND the low
                                           // convenience cluster (≈9–16) so neither
                                           // gets clipped against an edge
      const dd = V.svg(distPlot, { height: 260, margin: { top: 26, right: 18, bottom: 44, left: 40 } });
      const dg = dd.g;
      const dx = d3.scaleLinear().domain([HLO, HHI]).range([0, dd.innerW]);
      const dy = d3.scaleLinear().domain([0, 1]).range([dd.innerH, 0]);

      dg.append("text").attr("x", 0).attr("y", -10).attr("font-size", 12.5)
        .attr("font-weight", 600).attr("fill", V.color("ink-600"))
        .text("Distribution of sample means");

      const distAxisX = dg.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${dd.innerH})`);
      const distAxisY = dg.append("g").attr("class", "axis");

      dg.append("text").attr("class", "axis-label")
        .attr("x", dd.innerW / 2).attr("y", dd.innerH + 38)
        .attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("sample mean ($k)");

      const barsG = dg.append("g");

      // true-mean reference line on the histogram
      dg.append("line").attr("class", "truemark")
        .attr("x1", dx(PARAM)).attr("x2", dx(PARAM))
        .attr("y1", -4).attr("y2", dd.innerH)
        .attr("stroke", V.color("gold")).attr("stroke-width", 2).attr("stroke-dasharray", "5 3");
      dg.append("text").attr("x", dx(PARAM)).attr("y", -16)
        .attr("text-anchor", "middle").attr("font-size", 11).attr("font-weight", 700)
        .attr("fill", V.color("gold")).text("truth");

      // mean-of-means marker (solid cardinal), positioned in redraw
      const moMLine = dg.append("line")
        .attr("y1", -4).attr("y2", dd.innerH)
        .attr("stroke", V.color("cardinal")).attr("stroke-width", 2)
        .style("opacity", 0);

      distAxisX.call(d3.axisBottom(dx).ticks(7));
      distAxisY.call(d3.axisLeft(dy).ticks(5));

      /* ---------- drawing logic ---------- */
      function currentMethod() {
        const b = methodSeg.querySelector("button.active");
        return b ? b.dataset.method : "SRS";
      }

      function drawOneSample() {
        const n = nSlider.value;
        const method = currentMethod();
        let idx;
        if (method === "SRS") {
          // simple random sample without replacement, via seeded shuffle
          idx = S.sampleWithout(
            population.map((_, i) => i), n, drawRand
          );
        } else {
          // convenience: take the n lowest-income (easiest-to-reach) households,
          // with a little seeded wobble so repeated draws are not identical
          const take = Math.min(n + 12, N);
          const pool = sortedIdx.slice(0, take);
          idx = S.sampleWithout(pool, n, drawRand);
        }
        const vals = idx.map((i) => population[i]);
        sampleMeans.push(S.mean(vals));
        lastSampleIdx = new Set(idx);
        return vals;
      }

      function redraw() {
        // highlight the most recent sample on the population strip
        const hi = popDots.filter((d) => lastSampleIdx.has(d.i));
        const sel = sampleLayer.selectAll("circle.samp").data(hi, (d) => d.i);
        sel.exit().remove();
        sel.enter().append("circle").attr("class", "samp")
            .attr("r", 4).attr("stroke", "#fff").attr("stroke-width", 1)
          .merge(sel)
            .attr("cx", (d) => px(d.v)).attr("cy", (d) => d.cy)
            .attr("fill", V.color("c-blue"));

        // histogram of sample means
        const bins = S.histogram(sampleMeans, NBINS, HLO, HHI);
        const maxCount = Math.max(1, S.max(bins.map((b) => b.count)));
        dy.domain([0, maxCount]);
        distAxisY.transition().duration(150).call(d3.axisLeft(dy).ticks(5));

        const bsel = barsG.selectAll("rect.bar").data(bins);
        bsel.exit().remove();
        bsel.enter().append("rect").attr("class", "bar")
          .merge(bsel)
            .attr("x", (b) => dx(b.x0) + 1)
            .attr("width", (b) => Math.max(0, dx(b.x1) - dx(b.x0) - 1.5))
            .attr("y", (b) => dy(b.count))
            .attr("height", (b) => dd.innerH - dy(b.count))
            .attr("fill", currentMethod() === "SRS" ? V.color("c-blue") : V.color("c-amber"))
            .attr("fill-opacity", 0.78);

        // stat readouts
        sParam.set("$" + S.fmt(PARAM, 1) + "k");
        sCount.set(sampleMeans.length);
        if (sampleMeans.length) {
          const last = sampleMeans[sampleMeans.length - 1];
          const mm = S.mean(sampleMeans);
          const se = sampleMeans.length >= 2 ? S.sd(sampleMeans) : 0;
          sLast.set("$" + S.fmt(last, 1) + "k");
          sMeanOf.set("$" + S.fmt(mm, 1) + "k");
          sSE.set(sampleMeans.length >= 2 ? "$" + S.fmt(se, 2) + "k" : "—");
          moMLine.attr("x1", dx(mm)).attr("x2", dx(mm)).style("opacity", 1);
        } else {
          sLast.set("—"); sMeanOf.set("—"); sSE.set("—");
          moMLine.style("opacity", 0);
        }

        updateVerdict();
      }

      function updateVerdict() {
        const method = currentMethod();
        if (!sampleMeans.length) {
          verdict.className = "callout";
          verdict.innerHTML = `<span class="label">Ready</span> Set a sample size, then draw. ` +
            `Each draw adds one bar's worth of evidence to the histogram on the right.`;
          return;
        }
        const mm = S.mean(sampleMeans);
        const gap = mm - PARAM;
        if (method === "SRS") {
          verdict.className = "callout key";
          verdict.innerHTML = `<span class="label">SRS: centered on the truth</span> ` +
            `The sample means pile up around the true mean ($${S.fmt(PARAM, 1)}k). ` +
            `Their own average is $${S.fmt(mm, 1)}k, off by just $${S.fmt(Math.abs(gap), 2)}k. ` +
            `Raise <i>n</i> and draw again: the pile gets narrower, so any single sample is a better guess.`;
        } else {
          verdict.className = "callout warn";
          verdict.innerHTML = `<span class="label">Convenience: biased low by $${S.fmt(Math.abs(gap), 1)}k</span> ` +
            `Reaching only the easiest (lowest-income) households shifts the whole histogram off the gold line. ` +
            `The mean of sample means is $${S.fmt(mm, 1)}k versus the truth of $${S.fmt(PARAM, 1)}k. ` +
            `More samples do not fix it: the error is built into how the sample was chosen, not into its size.`;
        }
      }

      /* ---------- wiring ---------- */
      bOne.onclick = () => { drawOneSample(); redraw(); };
      bMany.onclick = () => {
        for (let k = 0; k < 200; k++) drawOneSample();
        redraw();
      };
      bReset.onclick = () => {
        sampleMeans = [];
        lastSampleIdx = new Set();
        drawRand = S.rng(99173);   // restart the draw stream so reset is reproducible
        redraw();
      };
      methodSeg.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        methodSeg.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        // switching method starts a fresh distribution so the two are not mixed
        sampleMeans = [];
        lastSampleIdx = new Set();
        drawRand = S.rng(99173);
        redraw();
      });

      redraw();   // initial empty-state render
    },
    teardown() {},
  };

  function wireQuiz(root) {
    const opts = root.querySelectorAll(".opt");
    const fb = root.querySelector(".feedback");
    opts.forEach((o) => o.addEventListener("click", () => {
      const ok = o.dataset.ok === "1";
      opts.forEach((x) => x.classList.remove("correct", "wrong"));
      o.classList.add(ok ? "correct" : "wrong");
      if (ok) root.querySelector('[data-ok="1"]').classList.add("correct");
      fb.className = "feedback show " + (ok ? "ok" : "no");
      fb.innerHTML = ok
        ? "Right. The parameter (31) describes the whole population and stays fixed. The statistic (32.4) comes from the sample and would change with a different draw. You use the statistic to estimate the parameter."
        : "Not quite. The parameter is the fixed population number (31 minutes). The statistic is what the sample gives you (32.4), and it varies from sample to sample. Only one of the two describes the population.";
    }));
  }
})();
