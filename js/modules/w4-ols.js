/* =====================================================================
   w4-ols, Least-squares regression as a tug-of-war with the residuals
   Drag a candidate line (intercept and slope sliders) across a fixed
   scatter of education vs income. Every point's vertical residual is
   drawn and squared; the live Sum of Squared Errors is S.sse(...). The
   "Snap to OLS" button jumps the line to S.linreg's fit and shows that
   no hand-set line beats its SSE. A draggable marker reads y-hat at any x.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  /* a y with an overbar, matching V.fml.xbar's x-bar styling */
  const yHat = '<span style="position:relative"><i>y</i><span style="position:absolute;left:0;right:1px;top:-.62em;text-align:center;">^</span></span>';

  P.modules["w4-ols"] = {
    render(container) {
      P.lessonHeader(container, "w4-ols",
        "The regression line is the single straight line that comes closest to every point at once. " +
        "Closest has a precise meaning: it makes the squared vertical gaps from the points to the line " +
        "as small as they can possibly be. Try to beat it by hand, then let least squares snap into place.");

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>A line that predicts, and how we pick it</h3>
        <div class="callout"><span class="label">Response and explanatory</span>
          The <b>response</b> variable (also called dependent, written y) is the outcome we want to
          understand. The <b>explanatory</b> variable (independent, written x) is the one we think
          helps predict it. Here x is years of education and y is annual income.
        </div>
        <div class="callout"><span class="label">The line itself</span>
          A straight line needs two numbers: an intercept and a slope.
          ${V.fml.block(`${yHat} = a + b&middot;x`)}
          <b>a</b> (intercept) is the predicted y when x = 0. <b>b</b> (slope) is the change in
          predicted y for each one-unit rise in x: one more year of school adds b dollars to the
          prediction. The hat on ${yHat} marks it as a prediction, not an observed value.
        </div>
        <div class="callout"><span class="label">What least squares minimizes</span>
          For each point the <b>residual</b> is the vertical gap from the dot to the line, observed
          minus predicted. Square each gap (so positives and negatives both count, and big misses
          count a lot), then add them up.
          ${V.fml.block(`SSE = &Sigma; (y<sub>i</sub> &minus; ${yHat}<sub>i</sub>)<sup>2</sup>`)}
          Ordinary least squares (OLS) chooses the one a and b that make this sum the smallest it can be.
        </div>
        <div class="callout key"><span class="label">R-squared, the fit report card</span>
          R-squared is the square of the correlation r. It is the fraction of the up-and-down
          variation in y that the line accounts for, from <b>0</b> (the line explains nothing) to
          <b>1</b> (every point sits exactly on the line). R-squared = 0.81 means the line explains
          81% of the variation in income.
        </div>`;
      container.appendChild(concept);

      /* ================================================================
         THE LAB: beat the line, then snap to OLS
         ================================================================ */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Beat-the-line OLS sandbox</h3>
        <p>Set the intercept and slope by hand and watch the squared residuals and their total (SSE) respond.
        Try to make the SSE as small as you can, then press "Snap to OLS" to see the line least squares would pick.</p>
      </div>`;
      const body = V.el("div.lab-body");
      const plot = V.el("div");
      body.appendChild(plot);

      const stats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const sSSE = V.stat("Your SSE", "—", "accent");
      const sBest = V.stat("OLS minimum SSE", "—", "good");
      const sA = V.stat("Intercept a", "—", "");
      const sB = V.stat("Slope b", "—", "");
      const sR2 = V.stat("R²", "—", "");
      [sSSE, sBest, sA, sB, sR2].forEach((s) => stats.appendChild(s));
      sSSE.querySelector(".v").style.color = V.color("c-red");
      body.appendChild(stats);

      const legend = V.el("div.legend", { style: { marginTop: "10px" } });
      legend.innerHTML =
        `<span class="swatch"><i style="background:${V.color("c-blue")}"></i> data point (a person)</span>` +
        `<span class="swatch"><i style="background:${V.color("cardinal")}"></i> your line</span>` +
        `<span class="swatch"><i style="background:${V.color("c-amber")};opacity:.5"></i> squared residual</span>` +
        `<span class="swatch"><i style="background:${V.color("c-green")}"></i> predict marker (drag)</span>`;
      body.appendChild(legend);

      const verdict = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(verdict);

      const reveal = V.el("div.callout.key", { style: { marginTop: "12px", display: "none" } });
      body.appendChild(reveal);
      lab.appendChild(body);

      /* ---- controls ---- */
      const controls = V.el("div.lab-controls");

      const aSlider = V.slider({
        label: "Intercept a ($k)", min: -20, max: 60, step: 0.5, value: 30,
        format: (v) => S.fmt(v, 1),
        on: (v) => { a = v; draw(); },
      });
      aSlider.wrap.style.minWidth = "210px";

      const bSlider = V.slider({
        label: "Slope b ($k per year)", min: -2, max: 10, step: 0.1, value: 1.5,
        format: (v) => S.fmt(v, 1),
        on: (v) => { b = v; draw(); },
      });
      bSlider.wrap.style.minWidth = "210px";

      controls.appendChild(aSlider.wrap);
      controls.appendChild(bSlider.wrap);

      const btnRow = V.el("div.btn-row");
      const bSnap = V.el("button.btn.primary", { text: "Snap to OLS" });
      const bSquares = V.el("button.btn", { text: "Hide squares" });
      const bReset = V.el("button.btn.ghost", { text: "Reset line" });
      [bSnap, bSquares, bReset].forEach((x) => btnRow.appendChild(x));
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Fit and view" }), btnRow]));
      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---------- the fixed dataset: education (yrs) vs income ($k) ----------
         Generated once with a seeded RNG so the scatter is identical on every
         visit. A real positive relationship: roughly 4k of income per year of
         schooling, plus person-to-person noise. */
      const rand = S.rng(50412);
      const xs = [], ys = [];
      const TRUE_A = 8, TRUE_B = 4.2;
      for (let i = 0; i < 16; i++) {
        const x = 9 + Math.round(rand() * 10);            // 9..19 years
        const noise = S.gaussian(rand, 0, 9);             // income scatter ($k)
        let y = TRUE_A + TRUE_B * x + noise;
        y = Math.max(8, y);                                // no negative incomes
        xs.push(x);
        ys.push(Math.round(y * 10) / 10);
      }
      const fit = S.linreg(xs, ys);                        // the OLS answer key
      const bestSSE = fit.sse;

      const xMin = 7, xMax = 21;
      const yMin = 0, yMax = Math.ceil((S.max(ys) + 15) / 10) * 10;

      /* candidate line state (what the sliders control) */
      let a = 30, b = 1.5;
      let showSquares = true;
      let predX = 14;                                      // draggable predict marker

      /* ---------- d3 scaffold ---------- */
      const dims = V.svg(plot, { height: 380, margin: { top: 18, right: 24, bottom: 46, left: 56 } });
      const g = dims.g;
      const x = d3.scaleLinear().domain([xMin, xMax]).range([0, dims.innerW]);
      const y = d3.scaleLinear().domain([yMin, yMax]).range([dims.innerH, 0]);
      V.axes(g, x, y, dims, {
        grid: true, xticks: 7, yticks: 6,
        xlabel: "years of education (x)", ylabel: "annual income, $k (y)",
      });

      /* layer order: squares (under) -> line -> points -> residual stems -> predict marker */
      const squaresG = g.append("g");
      const lineG = g.append("path")
        .attr("fill", "none").attr("stroke", V.color("cardinal")).attr("stroke-width", 2.5);
      const stemsG = g.append("g");
      const dotsG = g.append("g");

      // predict marker pieces
      const predLine = g.append("line")
        .attr("stroke", V.color("c-green")).attr("stroke-width", 1.5).attr("stroke-dasharray", "4 4");
      const predDot = g.append("circle")
        .attr("r", 7).attr("fill", V.color("c-green")).attr("stroke", "#fff").attr("stroke-width", 2)
        .style("cursor", "ew-resize");
      const predLbl = g.append("text")
        .attr("fill", V.color("c-green")).attr("font-size", 12).attr("font-weight", 700)
        .attr("text-anchor", "middle");
      const predHandle = g.append("text")
        .attr("fill", V.color("c-green")).attr("font-size", 11).attr("font-weight", 600)
        .attr("text-anchor", "middle").attr("y", dims.innerH + 0).text("");

      const tip = V.tooltip();

      /* pixels-per-data-unit, so a "squared residual" can be drawn as an actual
         square whose side equals the residual measured along the y axis. */
      function pxPerY() { return Math.abs(y(0) - y(1)); }

      /* clamp the square's side so a giant miss does not flood the chart */
      function draw() {
        const yhat = (xi) => a + b * xi;
        const sse = S.sse(xs, ys, a, b);

        // the candidate line, drawn across the visible x range
        lineG.attr("d", `M${x(xMin)},${y(yhat(xMin))} L${x(xMax)},${y(yhat(xMax))}`);

        // squared-residual squares (side = |residual| in y-units, drawn to the
        // right of each point so the line stays readable)
        const sqData = showSquares ? xs.map((xi, i) => {
          const r = ys[i] - yhat(xi);
          const sidePx = Math.min(Math.abs(r) * pxPerY(), 70);   // cap visual size
          return { xi, yi: ys[i], pred: yhat(xi), r, sidePx };
        }) : [];
        const sq = squaresG.selectAll("rect").data(sqData, (d) => d.xi + "_" + d.yi);
        sq.exit().remove();
        sq.enter().append("rect")
            .attr("fill", V.color("c-amber")).attr("fill-opacity", 0.16)
            .attr("stroke", V.color("c-amber")).attr("stroke-opacity", 0.5).attr("stroke-width", 1)
          .merge(sq)
            .attr("width", (d) => d.sidePx).attr("height", (d) => d.sidePx)
            .attr("x", (d) => x(d.xi) + 4)
            .attr("y", (d) => Math.min(y(d.yi), y(d.pred)));

        // residual stems: a thin vertical line from each point to the line
        const stem = stemsG.selectAll("line").data(xs.map((xi, i) => ({ xi, yi: ys[i], pred: yhat(xi) })), (d) => d.xi + "_" + d.yi);
        stem.exit().remove();
        stem.enter().append("line")
            .attr("stroke", V.color("ink-400")).attr("stroke-width", 1.4).attr("stroke-dasharray", "3 2")
          .merge(stem)
            .attr("x1", (d) => x(d.xi)).attr("x2", (d) => x(d.xi))
            .attr("y1", (d) => y(d.yi)).attr("y2", (d) => y(d.pred));

        // data points
        const sel = dotsG.selectAll("circle").data(xs.map((xi, i) => ({ xi, yi: ys[i] })), (d) => d.xi + "_" + d.yi);
        sel.exit().remove();
        sel.enter().append("circle")
            .attr("r", 6).attr("fill", V.color("c-blue")).attr("fill-opacity", 0.85)
            .attr("stroke", "#fff").attr("stroke-width", 1.5)
            .on("mouseover", function (ev, d) {
              const r = d.yi - (a + b * d.xi);
              tip.show(`${S.fmt(d.xi, 0)} yrs, income $${S.fmt(d.yi, 1)}k<br>predicted $${S.fmt(a + b * d.xi, 1)}k, residual ${(r >= 0 ? "+" : "") + S.fmt(r, 1)}`, ev);
            })
            .on("mousemove", (ev) => tip.move(ev))
            .on("mouseout", () => tip.hide())
          .merge(sel)
            .attr("cx", (d) => x(d.xi)).attr("cy", (d) => y(d.yi));

        // predict marker
        const py = yhat(predX);
        predLine.attr("x1", x(predX)).attr("x2", x(predX)).attr("y1", dims.innerH).attr("y2", y(py));
        predDot.attr("cx", x(predX)).attr("cy", y(py));
        predLbl.attr("x", x(predX)).attr("y", y(py) - 12)
          .text(`$${S.fmt(py, 1)}k`);   // predicted income above the marker
        predHandle.attr("x", x(predX)).text(`x = ${S.fmt(predX, 1)}`);

        // readouts
        sSSE.set(S.fmt(sse, 0));
        sBest.set(S.fmt(bestSSE, 0));
        sA.set(S.fmt(a, 1));
        sB.set(S.fmt(b, 1));
        // R-squared of the CANDIDATE line: fraction of y-variation it explains
        const candR2 = Math.max(0, 1 - sse / fit.sst);
        sR2.set(S.fmt(candR2, 2));

        // verdict comparing the user's SSE to the OLS minimum
        const gap = sse - bestSSE;
        if (gap < 0.5) {
          verdict.className = "callout key";
          verdict.innerHTML = `<span class="label">This is the best line</span> Your SSE of <b>${S.fmt(sse, 0)}</b> equals the least-squares minimum. No straight line through this scatter can do better.`;
        } else {
          const pct = (gap / bestSSE) * 100;
          verdict.className = "callout warn";
          verdict.innerHTML = `<span class="label">You can still do better</span> The smallest possible SSE is <b>${S.fmt(bestSSE, 0)}</b> (the OLS line). Your line sits at <b>${S.fmt(sse, 0)}</b>, about ${S.fmt(pct, 0)}% higher. Shrink the squared gaps by tilting and shifting the line, or press "Snap to OLS".`;
        }
      }

      /* dragging the predict marker left and right reads y-hat off the line */
      const predDrag = d3.drag()
        .on("start", function () { predDot.style("cursor", "grabbing"); })
        .on("drag", function (ev) {
          predX = Math.max(xMin, Math.min(xMax, x.invert(ev.x)));
          draw();
        })
        .on("end", function () { predDot.style("cursor", "ew-resize"); });
      predDot.call(predDrag);

      /* ---- button wiring ---- */
      bSnap.onclick = () => {
        a = fit.intercept; b = fit.slope;
        aSlider.value = Math.round(a * 2) / 2;     // snap onto the slider grid
        bSlider.value = Math.round(b * 10) / 10;
        a = aSlider.value; b = bSlider.value;       // keep state and sliders in sync
        reveal.style.display = "block";
        reveal.innerHTML = `<span class="label">The least-squares fit</span>
          ${V.fml.inline(`${yHat} = ${S.fmt(fit.intercept, 1)} + ${S.fmt(fit.slope, 2)}&middot;x`)}<br>
          The slope says each extra year of education is associated with about
          <b>$${S.fmt(fit.slope, 2)}k</b> more predicted income. The intercept,
          $${S.fmt(fit.intercept, 1)}k at zero years, is just where the line crosses the axis and is
          not a meaningful prediction on its own. Correlation r = <b>${(fit.r >= 0 ? "+" : "") + S.fmt(fit.r, 2)}</b>,
          so R² = r² = <b>${S.fmt(fit.r2, 2)}</b>: the line explains ${S.fmt(fit.r2 * 100, 0)}% of the
          variation in income.`;
        draw();
      };

      bSquares.onclick = () => {
        showSquares = !showSquares;
        bSquares.textContent = showSquares ? "Hide squares" : "Show squares";
        draw();
      };

      bReset.onclick = () => {
        a = 30; b = 1.5; predX = 14;
        aSlider.value = 30; bSlider.value = 1.5;
        reveal.style.display = "none";
        draw();
      };

      draw();

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">A regression of income on education gives R² = 0.49. What does that number tell you?</div>
          <button class="opt" data-ok="0">49% of people earn more than predicted</button>
          <button class="opt" data-ok="1">The line explains 49% of the variation in income; the rest is other factors and noise</button>
          <button class="opt" data-ok="0">Each extra year of school raises income by 49%</button>
          <button class="opt" data-ok="0">The correlation between education and income is 0.49</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ---- the real course exercise ---- */
      P.renderPractice(container, "w4-regression");
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
        ? "Right. R² = 0.49 means the regression line accounts for 49% of the up-and-down variation in income; the remaining 51% comes from everything education does not capture. (The correlation here would be r = √0.49 = 0.7, not 0.49.)"
        : "Not quite. R² is the fraction of the variation in y that the line explains, here 49%. It is not a count of people, not a percentage change per year, and not r itself (r would be √0.49 = 0.7).";
    }));
  }
})();
