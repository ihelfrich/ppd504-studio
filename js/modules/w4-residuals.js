/* =====================================================================
   w4-residuals, The residual plot as an X-ray of the regression line
   Two linked charts: a scatter with its OLS line on top, and the
   residual plot (residual vs x, with a zero line) underneath. A toggle
   swaps among three seeded datasets, Linear, Curved, and Fan, where the
   top scatter can look fine but the residual plot tells the truth. Stat
   cards report slope, intercept, R-squared, and the mean residual (which
   is always essentially zero). A separate panel works the real wine
   example, ŷ = 260.6 − 22.97x, drawing each country's residual.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  /* a y with an overbar, matching the w4-ols house style for y-hat */
  const yHat = '<span style="position:relative"><i>y</i><span style="position:absolute;left:0;right:1px;top:-.62em;text-align:center;">^</span></span>';

  P.modules["w4-residuals"] = {
    render(container) {
      P.lessonHeader(container, "w4-residuals",
        "A residual is what the line missed: the observed value minus the predicted one. " +
        "Stack all the misses against x and you get a residual plot, an X-ray that shows whether a " +
        "straight line was the right tool or whether it is quietly fighting a curve.");

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>What the line leaves behind</h3>
        <div class="callout"><span class="label">A residual is a leftover</span>
          For each point, the residual is the vertical gap from the dot to the line: the value you
          actually observed minus the value the line predicted.
          ${V.fml.block(`e<sub>i</sub> = y<sub>i</sub> &minus; ${yHat}<sub>i</sub>`)}
          A positive residual sits above the line (the line under-predicted), a negative one sits below.
        </div>
        <div class="callout"><span class="label">The residuals always average to zero</span>
          For a least-squares line the residuals add up to zero, so their mean is zero, every time.
          That is built into how the line is chosen. So the mean residual tells you nothing about fit:
          the useful information is in the <b>pattern</b> of the residuals, not their average.
        </div>
        <div class="callout"><span class="label">A residual plot is residuals against x</span>
          Plot each residual on the vertical axis against its x on the horizontal axis, and draw a
          line at zero. This pulls the line flat so your eye can hunt for shape instead of slope.
        </div>
        <div class="callout key"><span class="label">No pattern is the good news</span>
          If a straight line fits, the residual plot is a formless band: points scattered evenly above
          and below zero with no drift and no fanning. A clear shape is bad news. A <b>U or arch</b>
          means the real relationship is curved, so a line is the wrong model. A <b>fan</b> (spread
          growing with x) means the scatter is uneven, which undercuts the usual prediction intervals.
        </div>`;
      container.appendChild(concept);

      /* ================================================================
         THE LAB: linked scatter + residual plot, three datasets
         ================================================================ */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Scatter and residual plot, side by side</h3>
        <p>The top chart fits an OLS line to the data. The bottom chart strips the slope away and shows
        only what the line missed. Switch datasets and watch the residual plot expose problems the top
        scatter can hide.</p>
      </div>`;
      const body = V.el("div.lab-body");

      const topPlot = V.el("div");
      const botPlot = V.el("div");
      body.appendChild(topPlot);
      body.appendChild(botPlot);

      const stats = V.el("div.stat-row", { style: { marginTop: "12px" } });
      const sSlope = V.stat("Slope b", "—", "");
      const sIntc = V.stat("Intercept a", "—", "");
      const sR2 = V.stat("R²", "—", "accent");
      const sMeanRes = V.stat("Mean residual", "—", "good");
      [sSlope, sIntc, sR2, sMeanRes].forEach((s) => stats.appendChild(s));
      body.appendChild(stats);

      const legend = V.el("div.legend", { style: { marginTop: "10px" } });
      legend.innerHTML =
        `<span class="swatch"><i style="background:${V.color("c-blue")}"></i> data point</span>` +
        `<span class="swatch"><i style="background:${V.color("cardinal")}"></i> OLS line</span>` +
        `<span class="swatch"><i style="background:${V.color("c-green")}"></i> residual above zero</span>` +
        `<span class="swatch"><i style="background:${V.color("c-red")}"></i> residual below zero</span>`;
      body.appendChild(legend);

      const verdict = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(verdict);
      lab.appendChild(body);

      /* ---- controls ---- */
      const controls = V.el("div.lab-controls");
      const seg = V.el("div.seg");
      ["Linear", "Curved", "Fan / heteroskedastic"].forEach((t, i) => {
        const b = V.el("button", { text: t });
        if (i === 0) b.classList.add("active");
        b.dataset.kind = t;
        seg.appendChild(b);
      });
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Dataset" }), seg]));
      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---------- three seeded datasets on a common x grid ----------
         Same x's and similar vertical spread, so the differences live
         entirely in the shape of the relationship, not the noise level. */
      const N = 28;
      const XMIN = 0, XMAX = 20;
      function buildXs(rand) {
        const xs = [];
        for (let i = 0; i < N; i++) xs.push(XMIN + (XMAX - XMIN) * (i + 0.5) / N + (rand() - 0.5) * 0.4);
        return xs;
      }
      const sets = {};
      {
        // Linear: a true straight line plus even noise. Residuals form a band.
        const rand = S.rng(70401);
        const xs = buildXs(rand);
        const ys = xs.map((x) => 12 + 2.1 * x + S.gaussian(rand, 0, 6));
        sets["Linear"] = { xs, ys, label: "a straight line fits well" };
      }
      {
        // Curved: a quadratic. A straight line leaves a clear U in the residuals.
        const rand = S.rng(70402);
        const xs = buildXs(rand);
        const ys = xs.map((x) => 8 + 0.95 * (x - 10) * (x - 10) + S.gaussian(rand, 0, 5));
        sets["Curved"] = { xs, ys, label: "the truth is a curve" };
      }
      {
        // Fan: linear mean, but noise spread grows with x (heteroskedastic).
        const rand = S.rng(70403);
        const xs = buildXs(rand);
        const ys = xs.map((x) => 20 + 1.4 * x + S.gaussian(rand, 0, 1.2 + 0.7 * x));
        sets["Fan / heteroskedastic"] = { xs, ys, label: "the spread grows with x" };
      }

      let current = "Linear";

      /* ---------- top scatter scaffold ---------- */
      const tDims = V.svg(topPlot, { height: 250, margin: { top: 14, right: 22, bottom: 40, left: 52 } });
      const tg = tDims.g;
      const tx = d3.scaleLinear().domain([XMIN - 1, XMAX + 1]).range([0, tDims.innerW]);
      const ty = d3.scaleLinear().range([tDims.innerH, 0]);   // y-domain set per dataset
      let tAxesG = null;
      const tLine = tg.append("path").attr("fill", "none")
        .attr("stroke", V.color("cardinal")).attr("stroke-width", 2.5);
      const tStems = tg.append("g");
      const tDots = tg.append("g");

      /* ---------- bottom residual-plot scaffold ---------- */
      const rDims = V.svg(botPlot, { height: 210, margin: { top: 18, right: 22, bottom: 44, left: 52 } });
      const rg = rDims.g;
      const rx = d3.scaleLinear().domain([XMIN - 1, XMAX + 1]).range([0, rDims.innerW]);
      const ry = d3.scaleLinear().range([rDims.innerH, 0]);   // symmetric, set per dataset
      let rAxesG = null;
      const rZero = rg.append("line")
        .attr("stroke", V.color("cardinal")).attr("stroke-width", 2).attr("stroke-dasharray", "6 3");
      const rZeroLbl = rg.append("text")
        .attr("fill", V.color("cardinal")).attr("font-size", 11).attr("font-weight", 700)
        .attr("text-anchor", "start");
      const rStems = rg.append("g");
      const rDots = rg.append("g");
      const rTitle = rg.append("text")
        .attr("x", 0).attr("y", -6).attr("font-size", 12).attr("font-weight", 700)
        .attr("fill", V.color("ink-600")).text("Residual plot: what the line missed");

      const tip = V.tooltip();

      function draw() {
        const d = sets[current];
        const xs = d.xs, ys = d.ys;
        const fit = S.linreg(xs, ys);
        const res = fit.residuals;

        /* ----- top scatter ----- */
        const yLo = Math.min(0, S.min(ys));
        const yHi = S.max(ys);
        const yPad = (yHi - yLo) * 0.08 + 1;
        ty.domain([yLo - yPad, yHi + yPad]);
        if (tAxesG) tAxesG.remove();
        tAxesG = tg.append("g");
        V.axes(tAxesG, tx, ty, tDims, {
          grid: true, xticks: 7, yticks: 5,
          xlabel: "x (explanatory)", ylabel: "y (response)",
        });
        // keep drawn layers above the freshly added grid/axes
        tLine.raise(); tStems.raise(); tDots.raise();

        tLine.attr("d", `M${tx(XMIN - 1)},${ty(fit.fitted(XMIN - 1))} L${tx(XMAX + 1)},${ty(fit.fitted(XMAX + 1))}`);

        // residual stems on the scatter, colored by sign
        const tStem = tStems.selectAll("line").data(xs.map((x, i) => ({ x, y: ys[i], p: fit.fitted(x), i })), (s) => s.i);
        tStem.exit().remove();
        tStem.enter().append("line").attr("stroke-width", 1.3)
          .merge(tStem)
            .attr("stroke", (s) => (s.y - s.p >= 0 ? V.color("c-green") : V.color("c-red")))
            .attr("stroke-opacity", 0.55)
            .attr("x1", (s) => tx(s.x)).attr("x2", (s) => tx(s.x))
            .attr("y1", (s) => ty(s.y)).attr("y2", (s) => ty(s.p));

        const tSel = tDots.selectAll("circle").data(xs.map((x, i) => ({ x, y: ys[i], r: res[i], i })), (s) => s.i);
        tSel.exit().remove();
        tSel.enter().append("circle").attr("r", 5)
            .attr("fill", V.color("c-blue")).attr("fill-opacity", 0.85)
            .attr("stroke", "#fff").attr("stroke-width", 1.3)
            .on("mouseover", function (ev, s) {
              tip.show(`x = ${S.fmt(s.x, 1)}, y = ${S.fmt(s.y, 1)}<br>predicted ${S.fmt(fit.fitted(s.x), 1)}, residual ${(s.r >= 0 ? "+" : "") + S.fmt(s.r, 1)}`, ev);
            })
            .on("mousemove", (ev) => tip.move(ev))
            .on("mouseout", () => tip.hide())
          .merge(tSel)
            .attr("cx", (s) => tx(s.x)).attr("cy", (s) => ty(s.y));

        /* ----- bottom residual plot ----- */
        const rMax = Math.max(Math.abs(S.min(res)), Math.abs(S.max(res))) * 1.15 + 1;
        ry.domain([-rMax, rMax]);
        if (rAxesG) rAxesG.remove();
        rAxesG = rg.append("g");
        V.axes(rAxesG, rx, ry, rDims, {
          grid: true, xticks: 7, yticks: 5,
          xlabel: "x (explanatory)", ylabel: "residual",
        });
        rZero.raise(); rZeroLbl.raise(); rStems.raise(); rDots.raise(); rTitle.raise();

        rZero.attr("x1", rx(XMIN - 1)).attr("x2", rx(XMAX + 1)).attr("y1", ry(0)).attr("y2", ry(0));
        rZeroLbl.attr("x", rx(XMAX + 1) - 56).attr("y", ry(0) - 6).text("residual = 0");

        const rStem = rStems.selectAll("line").data(xs.map((x, i) => ({ x, r: res[i], i })), (s) => s.i);
        rStem.exit().remove();
        rStem.enter().append("line").attr("stroke-width", 1.3)
          .merge(rStem)
            .attr("stroke", (s) => (s.r >= 0 ? V.color("c-green") : V.color("c-red")))
            .attr("stroke-opacity", 0.5)
            .attr("x1", (s) => rx(s.x)).attr("x2", (s) => rx(s.x))
            .attr("y1", ry(0)).attr("y2", (s) => ry(s.r));

        const rSel = rDots.selectAll("circle").data(xs.map((x, i) => ({ x, r: res[i], i })), (s) => s.i);
        rSel.exit().remove();
        rSel.enter().append("circle").attr("r", 5)
            .attr("stroke", "#fff").attr("stroke-width", 1.3)
            .on("mouseover", function (ev, s) {
              tip.show(`x = ${S.fmt(s.x, 1)}<br>residual ${(s.r >= 0 ? "+" : "") + S.fmt(s.r, 1)}`, ev);
            })
            .on("mousemove", (ev) => tip.move(ev))
            .on("mouseout", () => tip.hide())
          .merge(rSel)
            .attr("fill", (s) => (s.r >= 0 ? V.color("c-green") : V.color("c-red")))
            .attr("fill-opacity", 0.85)
            .attr("cx", (s) => rx(s.x)).attr("cy", (s) => ry(s.r));

        /* ----- readouts ----- */
        sSlope.set(S.fmt(fit.slope, 2));
        sIntc.set(S.fmt(fit.intercept, 1));
        sR2.set(S.fmt(fit.r2, 2));
        sMeanRes.set(S.fmt(S.mean(res), 3));   // essentially zero, by construction

        /* ----- verdict that reads the residual plot ----- */
        if (current === "Linear") {
          verdict.className = "callout key";
          verdict.innerHTML = `<span class="label">No pattern: a line is appropriate</span>
            The residuals scatter evenly above and below zero with no drift and no fanning. A straight
            line is a reasonable model here, and R² = <b>${S.fmt(fit.r2, 2)}</b> reports the share of the
            variation in y it explains. Notice the mean residual reads <b>${S.fmt(S.mean(res), 3)}</b>, zero
            up to rounding, as it always is.`;
        } else if (current === "Curved") {
          verdict.className = "callout warn";
          verdict.innerHTML = `<span class="label">U-shaped pattern: the true relationship is curved</span>
            The top scatter can look like it has a slope, but the residual plot bends into a clear arch:
            negative in the middle, positive at both ends. The line systematically under- and over-predicts
            in turn, so a straight line is the wrong model. R² = <b>${S.fmt(fit.r2, 2)}</b> here is misleading,
            you would fit a curve (for example add an x² term) instead.`;
        } else {
          verdict.className = "callout warn";
          verdict.innerHTML = `<span class="label">Fan shape: the spread grows with x</span>
            The line itself is not biased (the residuals still center on zero), but their spread widens as
            x increases: a megaphone opening to the right. This is heteroskedasticity. Predictions at large
            x are far less reliable than at small x, so the usual equal-width prediction intervals do not hold.`;
        }
      }

      seg.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        seg.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        current = b.dataset.kind;
        draw();
      });

      draw();

      /* ================================================================
         THE WINE EXAMPLE: real data, the given textbook line
         ================================================================ */
      const wine = P.exercises.data.wine;
      const wcard = V.el("div.card.lab");
      wcard.innerHTML = `<div class="lab-head">
        <h3>Worked example: wine and heart disease</h3>
        <p>Four countries, with the line the textbook gives,
        ${V.fml.inline(`${yHat} = 260.6 &minus; 22.97&middot;x`)}. Here x is liters of alcohol from wine
        per person and y is heart-disease deaths per 100,000. Each country's residual is observed deaths
        minus the line's prediction.</p>
      </div>`;
      const wbody = V.el("div.lab-body");
      const wPlot = V.el("div");
      wbody.appendChild(wPlot);
      wcard.appendChild(wbody);
      container.appendChild(wcard);

      const wA = wine.line.a, wB = wine.line.b;          // 260.6, -22.97
      const wPredict = (x) => wA + wB * x;
      const wRows = wine.rows.map((r) => ({
        country: r.country, x: r.x, y: r.y,
        pred: wPredict(r.x), res: r.y - wPredict(r.x),
      }));

      /* table of residuals, with a checking total that confirms they nearly cancel */
      const table = V.el("table.data", { style: { marginTop: "14px", width: "100%" } });
      let thtml = `<thead><tr>
          <th style="text-align:left">Country</th>
          <th>x (wine L)</th>
          <th>y (deaths)</th>
          <th>predicted ${yHat}</th>
          <th>residual y &minus; ${yHat}</th>
        </tr></thead><tbody>`;
      wRows.forEach((r) => {
        const col = r.res >= 0 ? V.color("c-green") : V.color("c-red");
        thtml += `<tr>
          <td style="text-align:left"><b>${r.country}</b></td>
          <td>${S.fmt(r.x, 1)}</td>
          <td>${S.fmt(r.y, 0)}</td>
          <td>${S.fmt(r.pred, 1)}</td>
          <td style="color:${col};font-weight:700">${(r.res >= 0 ? "+" : "") + S.fmt(r.res, 1)}</td>
        </tr>`;
      });
      const resSum = S.sum(wRows.map((r) => r.res));
      thtml += `<tr class="total">
          <td style="text-align:left">Sum</td><td></td><td></td><td></td>
          <td>${(resSum >= 0 ? "+" : "") + S.fmt(resSum, 1)}</td>
        </tr></tbody>`;
      table.innerHTML = thtml;
      wbody.appendChild(table);

      const wNote = V.el("div.callout", { style: { marginTop: "12px" } });
      wNote.innerHTML = `<span class="label">Reading the residuals</span>
        France sits <b>above</b> the line (residual ${(wRows[0].res >= 0 ? "+" : "") + S.fmt(wRows[0].res, 1)}):
        more heart-disease deaths than its high wine consumption predicts. The other three fall below the line,
        fewer deaths than predicted. The four residuals here do not sum to exactly zero
        (${(resSum >= 0 ? "+" : "") + S.fmt(resSum, 1)}) because this line is the textbook's given line, not the
        least-squares fit to only these four points. Fit the line by least squares and the residuals would
        cancel to zero exactly.`;
      wbody.appendChild(wNote);

      /* wine scatter + given line + residual stems */
      const wDims = V.svg(wPlot, { height: 300, margin: { top: 18, right: 26, bottom: 46, left: 58 } });
      const wg = wDims.g;
      const wxMin = 0, wxMax = 10;
      const wyMin = 0, wyMax = 280;
      const wx = d3.scaleLinear().domain([wxMin, wxMax]).range([0, wDims.innerW]);
      const wy = d3.scaleLinear().domain([wyMin, wyMax]).range([wDims.innerH, 0]);
      V.axes(wg, wx, wy, wDims, {
        grid: true, xticks: 6, yticks: 6,
        xlabel: "wine alcohol per person (liters)", ylabel: "heart-disease deaths / 100k",
      });

      // the given line
      wg.append("path").attr("fill", "none")
        .attr("stroke", V.color("cardinal")).attr("stroke-width", 2.5)
        .attr("d", `M${wx(wxMin)},${wy(wPredict(wxMin))} L${wx(wxMax)},${wy(wPredict(wxMax))}`);
      wg.append("text")
        .attr("x", wx(wxMax) - 4).attr("y", wy(wPredict(wxMax)) - 8)
        .attr("text-anchor", "end").attr("font-size", 11).attr("font-weight", 700)
        .attr("fill", V.color("cardinal")).text("ŷ = 260.6 − 22.97x");

      // residual stems and predicted ghost points, then the observed dots + labels
      wRows.forEach((r) => {
        wg.append("line")
          .attr("stroke", r.res >= 0 ? V.color("c-green") : V.color("c-red"))
          .attr("stroke-width", 1.8).attr("stroke-opacity", 0.6)
          .attr("x1", wx(r.x)).attr("x2", wx(r.x))
          .attr("y1", wy(r.y)).attr("y2", wy(r.pred));
        wg.append("circle")
          .attr("cx", wx(r.x)).attr("cy", wy(r.pred)).attr("r", 4)
          .attr("fill", "none").attr("stroke", V.color("cardinal"))
          .attr("stroke-width", 1.5).attr("stroke-dasharray", "2 2");
      });
      wRows.forEach((r) => {
        wg.append("circle")
          .attr("cx", wx(r.x)).attr("cy", wy(r.y)).attr("r", 7)
          .attr("fill", V.color("c-blue")).attr("fill-opacity", 0.9)
          .attr("stroke", "#fff").attr("stroke-width", 1.6)
          .on("mouseover", function (ev) {
            tip.show(`<b>${r.country}</b><br>observed ${S.fmt(r.y, 0)}, predicted ${S.fmt(r.pred, 1)}<br>residual ${(r.res >= 0 ? "+" : "") + S.fmt(r.res, 1)}`, ev);
          })
          .on("mousemove", (ev) => tip.move(ev))
          .on("mouseout", () => tip.hide());
        wg.append("text")
          .attr("x", wx(r.x)).attr("y", wy(r.y) - 12)
          .attr("text-anchor", "middle").attr("font-size", 11).attr("font-weight", 600)
          .attr("fill", V.color("ink-700")).text(r.country);
      });

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">You fit a straight line and the residual plot shows a clear U: residuals are
          negative in the middle and positive at both ends. What does that tell you?</div>
          <button class="opt" data-ok="0">The fit is excellent; a U means the residuals are balanced</button>
          <button class="opt" data-ok="1">A straight line is the wrong model; the true relationship is curved</button>
          <button class="opt" data-ok="0">There is an outlier dragging the line</button>
          <button class="opt" data-ok="0">The mean residual is not zero, so the math has an error</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ---- the real course exercise ---- */
      P.renderPractice(container, "w4-residuals");
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
        ? "Right. A U or arch in the residual plot means the line under- and over-predicts in a systematic way: the relationship bends, and a straight line cannot capture it. Fit a curve instead, for example by adding an x² term."
        : "Not quite. A systematic U is the signature of a curved relationship, so a straight line is the wrong model. It is not a sign of good balance, not a single outlier, and the mean residual is still zero (it always is for a least-squares line).";
    }));
  }
})();
