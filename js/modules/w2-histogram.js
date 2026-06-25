/* =====================================================================
   w2-histogram, Histograms and reading a distribution
   Switch among four shaped datasets, slide the bin count, and let the
   lab read off shape (mean vs median), center, spread, and outliers.
   A histogram bins a quantitative variable into equal-width classes and
   draws a bar whose height is the count in each class.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w2-histogram"] = {
    render(container) {
      P.lessonHeader(container, "w2-histogram",
        "A histogram piles a quantitative variable into equal-width classes and draws a bar for the count in each. " +
        "Read it the way you would read a landscape: its overall shape, where it centers, how spread out it is, and any stray points off on their own.");

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>How to read a distribution</h3>
        <div class="callout"><span class="label">What a histogram is</span>
          Slice the number line into classes of <b>equal width</b>, count how many observations fall in each class,
          and draw a bar that tall. The height is a count (or a percent). The bars touch, because the classes are
          adjacent slices of one continuous scale. That touching is the giveaway: a histogram is for a
          <b>quantitative</b> variable. A <b>bar graph</b> has gaps between bars because its categories
          (party, region, program) have no in-between.
        </div>
        <div class="callout"><span class="label">Shape, center, spread</span>
          Describe the overall pattern in three words. <b>Shape</b>: is it roughly symmetric, or does one tail
          stretch out (skewed)? <b>Center</b>: a typical value, usually the median. <b>Spread</b>: how wide the
          values run, measured by the IQR (middle 50%) or the standard deviation.
          ${V.fml.block(`skew right: ${V.fml.xbar} &gt; median &nbsp;&nbsp;|&nbsp;&nbsp; skew left: ${V.fml.xbar} &lt; median`)}
        </div>
        <div class="callout key"><span class="label">Outliers and skew</span>
          An <b>outlier</b> is a point that falls outside the overall pattern. The course rule flags anything past
          the fences Q1 minus 1.5 times the IQR, or Q3 plus 1.5 times the IQR. Skew bends the mean: a long right
          tail pulls the mean <b>above</b> the median, a long left tail pulls it <b>below</b>. When mean and median
          sit close together, the shape is roughly symmetric.
        </div>`;
      container.appendChild(concept);

      /* ---- interactive lab ---- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Histogram explorer</h3>
        <p>Pick a dataset, slide the number of classes, and toggle the center lines. The bars rebuild live and the lab describes what it sees.</p>
      </div>`;
      const body = V.el("div.lab-body");
      const plot = V.el("div");
      body.appendChild(plot);

      const legend = V.el("div.legend", { style: { margin: "8px 0 2px" } });
      legend.innerHTML =
        `<span class="swatch"><i style="background:${V.color("mean")}"></i> mean</span>` +
        `<span class="swatch"><i style="background:${V.color("median")}"></i> median</span>` +
        `<span class="swatch"><i style="background:${V.color("c-red")};opacity:.85"></i> outlier bin</span>`;
      body.appendChild(legend);

      const stats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const sN = V.stat("n", "—", "");
      const sMean = V.stat("Mean", "—", "bad");
      const sMed = V.stat("Median", "—", "");
      const sSD = V.stat("SD", "—", "accent");
      [sN, sMean, sMed, sSD].forEach((s) => stats.appendChild(s));
      sMean.querySelector(".v").style.color = V.color("mean");
      sMed.querySelector(".v").style.color = V.color("median");
      body.appendChild(stats);

      const verdict = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(verdict);
      lab.appendChild(body);

      /* ---- controls ---- */
      const controls = V.el("div.lab-controls");

      const segData = V.el("div.seg");
      const DATASETS = ["Graduation rates", "City budgets", "Test scores", "Bimodal"];
      DATASETS.forEach((t, i) => {
        const b = V.el("button", { text: t });
        if (i === 0) b.classList.add("active");
        b.dataset.set = t;
        segData.appendChild(b);
      });
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Dataset" }), segData]));

      let nbins = 9;
      const binSlider = V.slider({
        label: "Classes (bins)", min: 4, max: 30, step: 1, value: nbins,
        on: (v) => { nbins = v; draw(); },
      });
      controls.appendChild(binSlider.wrap);

      const segLines = V.el("div.seg");
      const lineBtn = V.el("button", { text: "Mean & median" });
      let showLines = true;
      lineBtn.classList.add("active");
      segLines.appendChild(lineBtn);
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Center lines" }), segLines]));

      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">A histogram of city operating budgets is strongly <b>right-skewed</b>: most cities are
          modest, with a few very large ones stretching the right tail. Which is larger, the mean or the median?</div>
          <button class="opt" data-ok="1">The mean, the big cities in the right tail pull it up</button>
          <button class="opt" data-ok="0">The median, it always exceeds the mean</button>
          <button class="opt" data-ok="0">They are equal, skew does not affect the center</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      P.renderPractice(container, "w4-gas-mileage");

      /* ---------- datasets (seeded, so they are fixed across reloads) ---------- */
      const DOMAIN = { "Graduation rates": [40, 100], "City budgets": [0, 100],
                       "Test scores": [0, 100], "Bimodal": [0, 100] };
      const datasets = buildDatasets();
      let current = "Graduation rates";
      let data = datasets[current];

      /* ---------- d3 scaffold ---------- */
      const dims = V.svg(plot, { height: 320, margin: { top: 24, right: 22, bottom: 50, left: 50 } });
      const g = dims.g;
      const x = d3.scaleLinear().range([0, dims.innerW]);
      const y = d3.scaleLinear().range([dims.innerH, 0]);

      const gridG = g.append("g").attr("class", "grid");
      const barsG = g.append("g");
      const xAxisG = g.append("g").attr("class", "axis").attr("transform", `translate(0,${dims.innerH})`);
      const yAxisG = g.append("g").attr("class", "axis");

      g.append("text").attr("class", "axis-label")
        .attr("x", dims.innerW / 2).attr("y", dims.innerH + 38)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("value (equal-width classes)");
      g.append("text").attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -dims.innerH / 2).attr("y", -38)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("count of observations");

      // center markers, drawn above the bars
      const meanLine = g.append("line").attr("stroke", V.color("mean")).attr("stroke-width", 2)
        .attr("stroke-dasharray", "5 3").attr("y1", 0).attr("y2", dims.innerH);
      const meanLbl = g.append("text").attr("fill", V.color("mean")).attr("font-size", 11)
        .attr("font-weight", 700).attr("text-anchor", "middle").attr("y", -8).text("mean");
      const medLine = g.append("line").attr("stroke", V.color("median")).attr("stroke-width", 2)
        .attr("y1", 0).attr("y2", dims.innerH);
      const medLbl = g.append("text").attr("fill", V.color("median")).attr("font-size", 11)
        .attr("font-weight", 700).attr("text-anchor", "middle").attr("y", -8).text("median");

      const tip = V.tooltip();

      function draw() {
        const lo = DOMAIN[current][0], hi = DOMAIN[current][1];
        const bins = S.histogram(data, nbins, lo, hi);
        const m = S.mean(data), med = S.median(data), sd = S.sd(data);
        const fences = S.outlierFences(data);

        x.domain([lo, hi]);
        const maxCount = d3.max(bins, (b) => b.count) || 1;
        y.domain([0, maxCount]);

        // gridlines (horizontal) refresh
        gridG.call(d3.axisLeft(y).ticks(Math.min(maxCount, 6)).tickSize(-dims.innerW).tickFormat(""));
        gridG.selectAll("path").remove();

        xAxisG.call(d3.axisBottom(x).ticks(8));
        yAxisG.call(d3.axisLeft(y).ticks(Math.min(maxCount, 6)).tickFormat(d3.format("d")));

        const isOut = (b) => b.items.some((v) => v < fences.lower || v > fences.upper);

        const sel = barsG.selectAll("rect.bar").data(bins, (d, i) => i);
        sel.exit().remove();
        sel.enter().append("rect").attr("class", "bar")
            .attr("stroke", "#fff").attr("stroke-width", 1)
            .on("mouseover", function (ev, d) {
              d3.select(this).attr("fill-opacity", 1);
              tip.show(
                "class <b>" + S.fmt(d.x0, 1) + " to " + S.fmt(d.x1, 1) + "</b><br>" +
                "count = <b>" + d.count + "</b> (" + S.fmt(100 * d.count / data.length, 0) + "%)", ev);
            })
            .on("mousemove", (ev) => tip.move(ev))
            .on("mouseout", function () { d3.select(this).attr("fill-opacity", .9); tip.hide(); })
          .merge(sel)
            .attr("fill", (d) => isOut(d) && d.count > 0 ? V.color("c-red") : V.color("c-blue"))
            .attr("fill-opacity", .9)
            .attr("x", (d) => x(d.x0) + 0.5)
            .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("y", (d) => y(d.count))
            .attr("height", (d) => dims.innerH - y(d.count));

        const showM = showLines;
        meanLine.attr("x1", x(m)).attr("x2", x(m)).style("display", showM ? null : "none");
        meanLbl.attr("x", x(m)).style("display", showM ? null : "none");
        medLine.attr("x1", x(med)).attr("x2", x(med)).style("display", showM ? null : "none");
        medLbl.attr("x", x(med)).style("display", showM ? null : "none");
        // nudge labels apart when the two lines nearly coincide
        if (showM && Math.abs(x(m) - x(med)) < 28) {
          meanLbl.attr("y", -8); medLbl.attr("y", -22);
        } else {
          meanLbl.attr("y", -8); medLbl.attr("y", -8);
        }

        sN.set(data.length);
        sMean.set(S.fmt(m, 1));
        sMed.set(S.fmt(med, 1));
        sSD.set(S.fmt(sd, 1));

        describe(m, med, sd, fences);
      }

      function describe(m, med, sd, fences) {
        const gap = m - med;
        const iqr = fences.iqr;
        const nOut = fences.outliers.length;
        const center = "Center sits near the median, <b>" + S.fmt(med, 1) +
          "</b>. Spread: the middle 50% covers an IQR of <b>" + S.fmt(iqr, 1) +
          "</b>, and the standard deviation is <b>" + S.fmt(sd, 1) + "</b>.";
        const outTxt = nOut === 0
          ? " No points fall past the 1.5 times IQR fences, so nothing reads as an outlier."
          : " <b>" + nOut + "</b> point" + (nOut > 1 ? "s" : "") +
            " fall past the fences [" + S.fmt(fences.lower, 1) + ", " + S.fmt(fences.upper, 1) +
            "] and show up as red bins.";

        let head, cls;
        if (Math.abs(gap) < 0.6 * (sd / 6 + 0.5)) {
          cls = "callout key";
          head = "Roughly symmetric";
          verdict.innerHTML = `<span class="label">${head}</span> Mean (${S.fmt(m,1)}) and median (${S.fmt(med,1)}) nearly coincide, so neither tail dominates. ${center}${outTxt}`;
        } else if (gap > 0) {
          cls = "callout warn";
          head = "Skewed right";
          verdict.innerHTML = `<span class="label">${head}</span> A tail stretches to the right, so the mean (${S.fmt(m,1)}) sits above the median (${S.fmt(med,1)}). ${center}${outTxt}`;
        } else {
          cls = "callout warn";
          head = "Skewed left";
          verdict.innerHTML = `<span class="label">${head}</span> A tail stretches to the left, so the mean (${S.fmt(m,1)}) sits below the median (${S.fmt(med,1)}). ${center}${outTxt}`;
        }
        verdict.className = cls;
      }

      /* ---- control wiring ---- */
      segData.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        segData.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        current = b.dataset.set;
        data = datasets[current];
        draw();
      });
      lineBtn.addEventListener("click", () => {
        showLines = !showLines;
        lineBtn.classList.toggle("active", showLines);
        draw();
      });

      draw();

      /* ---------- seeded dataset generators ---------- */
      function buildDatasets() {
        const out = {};

        // Graduation rates: roughly symmetric, centered ~78, bounded by 100
        let r = S.rng(101);
        out["Graduation rates"] = clampArr(
          Array.from({ length: 120 }, () => S.gaussian(r, 78, 7)), 40, 100, 0);

        // City budgets ($ millions): right-skewed via exponential-ish tail
        r = S.rng(202);
        out["City budgets"] = clampArr(
          Array.from({ length: 120 }, () => {
            const u = Math.max(1e-4, r());
            return -Math.log(u) * 12 + 3;      // long right tail
          }), 0, 100, 1);

        // Test scores: left-skewed (most score high, a few struggle)
        r = S.rng(303);
        out["Test scores"] = clampArr(
          Array.from({ length: 120 }, () => 100 - (-Math.log(Math.max(1e-4, r())) * 11)), 0, 100, 0);

        // Bimodal: two separated humps
        r = S.rng(404);
        out["Bimodal"] = clampArr(
          Array.from({ length: 120 }, (_, i) =>
            r() < 0.5 ? S.gaussian(r, 32, 7) : S.gaussian(r, 72, 7)), 0, 100, 0);

        return out;
      }
      function clampArr(a, lo, hi, dp) {
        const f = Math.pow(10, dp);
        return a.map((v) => Math.round(Math.max(lo, Math.min(hi, v)) * f) / f);
      }
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
        ? "Right. The long right tail of large cities drags the mean up above the median. Skew always pulls the mean toward the tail; the median, sitting at the middle rank, barely moves. That is why budgets and incomes are reported with the median."
        : "Not quite. A right tail pulls the mean toward the high values, so here the mean is the larger one. The median stays put at the middle rank. Flip to the City budgets dataset and turn on the center lines to see the red mean line land to the right of the blue median line.";
    }));
  }
})();
