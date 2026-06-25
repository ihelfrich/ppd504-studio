/* =====================================================================
   w3-density, Density curves as a picture of a whole distribution
   A density curve sits on or above the axis, encloses an area of exactly
   1, and turns "how many observations fall in this range" into "how much
   area sits over that range." Skew the curve and watch the mean (balance
   point) drift toward the long tail while the median (equal-areas point)
   stays put.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w3-density"] = {
    render(container) {
      P.lessonHeader(container, "w3-density",
        "A density curve is the smooth shape a histogram settles into when you stop counting bars and start measuring area. " +
        "The whole area under it is 1, and any slice of that area is the share of observations in that range.");

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>Reading a distribution as area</h3>
        <div class="callout"><span class="label">The curve never dips below the axis, and the area is 1</span>
          A density curve is always on or above the horizontal axis, and the total area underneath
          equals exactly 1. That single rule is what lets area stand in for proportion: all of the
          data is 100% of the data, so all of the area is 1.
          ${V.fml.block(`area under the whole curve = 1`)}
        </div>
        <div class="callout"><span class="label">Area over a range = proportion in that range</span>
          To ask "what share of observations fall below 40?" you shade the curve to the left of 40
          and read off that area. A shaded area of 0.30 means 30% of the data sits there. This is the
          same idea as a percentile.
        </div>
        <div class="callout"><span class="label">Median splits the area, mean balances it</span>
          The <b>median</b> is the equal-areas point: the vertical line that cuts the area exactly in
          half, 0.5 on each side. The <b>mean</b> is the balance point: where the curve would balance
          if it were a solid shape resting on a knife edge.
        </div>
        <div class="callout key"><span class="label">Skew pulls the mean, not the median</span>
          On a symmetric curve the mean and median sit on top of each other. Stretch one tail out and
          the mean slides toward that long tail while the median barely moves. Data wears
          ${V.fml.inline(`${V.fml.xbar}`)} and <i>s</i>; the idealized curve behind it wears
          ${V.fml.inline(`&mu;`)} (mu) and ${V.fml.inline(`&sigma;`)} (sigma).
        </div>`;
      container.appendChild(concept);

      /* ---- interactive lab ---- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Density-curve sandbox</h3>
        <p>Skew and spread reshape the curve. Drag the gold threshold to shade the area to its left:
        that shaded number is the share of observations below the line.</p>
      </div>`;
      const body = V.el("div.lab-body");

      const legend = V.el("div.legend", { style: { margin: "0 0 8px" } });
      legend.innerHTML = `
        <span class="swatch"><i style="background:${V.color("median")}"></i>median (equal-areas point)</span>
        <span class="swatch"><i style="background:${V.color("mean")}"></i>mean (balance point)</span>
        <span class="swatch"><i style="background:${V.color("highlight")}"></i>threshold (drag me)</span>`;
      body.appendChild(legend);

      const plot = V.el("div");
      body.appendChild(plot);

      const stats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const sArea = V.stat("Shaded area (share below)", "—", "accent");
      const sMean = V.stat("Mean (μ)", "—", "bad");
      const sMed = V.stat("Median", "—", "");
      const sGap = V.stat("Mean − Median", "—", "");
      [sArea, sMean, sMed, sGap].forEach((s) => stats.appendChild(s));
      sMean.querySelector(".v").style.color = V.color("mean");
      sMed.querySelector(".v").style.color = V.color("median");
      body.appendChild(stats);

      const verdict = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(verdict);
      lab.appendChild(body);

      const controls = V.el("div.lab-controls");
      let skew = 0;     // -1 (left tail) .. 0 (symmetric) .. +1 (right tail)
      let spread = 1.0; // overall width multiplier
      const skewSlider = V.slider({
        label: "Skew", min: -1, max: 1, step: 0.05, value: skew,
        format: (v) => (Math.abs(v) < 0.03 ? "symmetric" : (v > 0 ? "right +" + S.fmt(v, 2) : "left −" + S.fmt(-v, 2))),
        on: (v) => { skew = v; rebuild(); },
      });
      const spreadSlider = V.slider({
        label: "Spread", min: 0.6, max: 1.8, step: 0.05, value: spread,
        format: (v) => S.fmt(v, 2) + "×",
        on: (v) => { spread = v; rebuild(); },
      });
      controls.appendChild(skewSlider.wrap);
      controls.appendChild(spreadSlider.wrap);
      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">Household incomes in a county have a long right tail: a handful of very high
          earners stretch the curve out to the right. For this distribution, how do the mean and
          median compare?</div>
          <button class="opt" data-ok="0">The median is larger, the tail pulls it up</button>
          <button class="opt" data-ok="1">The mean is larger, the long right tail pulls the balance point toward it</button>
          <button class="opt" data-ok="0">They are equal, every density curve is symmetric</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz,
        "Right. The right tail tugs the balance point (mean) out toward the big values, while the equal-areas point (median) stays near the bulk of the data. So mean > median under right skew, which is exactly why median income is the headline number.",
        "Not quite. A long right tail drags the balance point (the mean) toward the big values. The median, the equal-areas point, hardly moves. So here the mean ends up larger than the median.");

      /* ---- the real course exercise ---- */
      P.renderPractice(container, "w3-empirical");

      /* ---------- density model ----------
         Build the curve from a skewed bump on a fixed grid, then normalize
         by the trapezoid rule so the enclosed area is exactly 1. The shape
         is a sinh-arcsinh style warp of a Gaussian bump: a skew parameter
         bends a symmetric base into a left- or right-leaning curve while
         keeping a single mode and smooth tails. */
      const DOMAIN = [0, 100];
      const N = 400;                          // grid resolution
      const dx = (DOMAIN[1] - DOMAIN[0]) / N;  // grid step
      const grid = d3.range(N + 1).map((i) => DOMAIN[0] + i * dx);

      let ys = [];        // normalized density at each grid point (area = 1)
      let cdf = [];       // cumulative area up to each grid point
      let meanVal = 50, medianVal = 50, peakY = 0;

      function shape(x) {
        // base bump centered at 50 with a spread; skew warps the input
        const center = 50;
        const sd = 10 * spread;
        const z = (x - center) / sd;
        // sinh-arcsinh warp: w shifts probability mass into one tail.
        // Coefficient kept modest so the bump stays clear of the [0,100]
        // walls: the mean-median gap then grows monotonically with skew
        // across the whole slider instead of collapsing near the edges.
        const w = z - skew * 0.6 * (Math.sqrt(z * z + 1) - 1);
        return Math.exp(-0.5 * w * w);
      }

      function trapzArea(vals) {
        let a = 0;
        for (let i = 0; i < vals.length - 1; i++) a += (vals[i] + vals[i + 1]) * 0.5 * dx;
        return a;
      }

      function buildModel() {
        const raw = grid.map(shape);
        const total = trapzArea(raw);
        ys = raw.map((v) => v / total);        // now area under ys is 1

        // cumulative area (CDF) by running trapezoid
        cdf = new Array(ys.length);
        cdf[0] = 0;
        for (let i = 1; i < ys.length; i++) cdf[i] = cdf[i - 1] + (ys[i - 1] + ys[i]) * 0.5 * dx;

        // median = grid point where cumulative area crosses 0.5
        medianVal = grid[grid.length - 1];
        for (let i = 1; i < cdf.length; i++) {
          if (cdf[i] >= 0.5) {
            const f = (0.5 - cdf[i - 1]) / (cdf[i] - cdf[i - 1] || 1);
            medianVal = grid[i - 1] + f * (grid[i] - grid[i - 1]);
            break;
          }
        }
        // mean = area-weighted average of x, ∫ x f(x) dx by trapezoid
        let m = 0;
        for (let i = 0; i < ys.length - 1; i++) {
          m += (grid[i] * ys[i] + grid[i + 1] * ys[i + 1]) * 0.5 * dx;
        }
        meanVal = m;
        peakY = S.max(ys);
      }

      // area to the LEFT of an arbitrary x value (interpolated from cdf)
      function areaLeftOf(xv) {
        if (xv <= DOMAIN[0]) return 0;
        if (xv >= DOMAIN[1]) return 1;
        const t = (xv - DOMAIN[0]) / dx;
        const i = Math.floor(t);
        const f = t - i;
        return cdf[i] + f * (cdf[i + 1] - cdf[i]);
      }

      /* ---------- d3 scaffold ---------- */
      const dims = V.svg(plot, { height: 300, margin: { top: 26, right: 24, bottom: 44, left: 30 } });
      const g = dims.g;
      const x = d3.scaleLinear().domain(DOMAIN).range([0, dims.innerW]);
      const y = d3.scaleLinear().range([dims.innerH, 0]);   // domain set after first build

      // baseline axis
      g.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${dims.innerH})`)
        .call(d3.axisBottom(x).ticks(10));
      g.append("text")
        .attr("x", dims.innerW / 2).attr("y", dims.innerH + 38)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("value (e.g. a policy score, 0 to 100)");

      const areaGen = d3.area().x((d) => x(d.x)).y0(dims.innerH).y1((d) => y(d.y)).curve(d3.curveBasis);
      const lineGen = d3.line().x((d) => x(d.x)).y((d) => y(d.y)).curve(d3.curveBasis);

      const shadedPath = g.append("path").attr("fill", V.color("highlight")).attr("fill-opacity", 0.32);
      const fullPath = g.append("path").attr("fill", V.color("c-blue")).attr("fill-opacity", 0.07);
      const curvePath = g.append("path").attr("fill", "none")
        .attr("stroke", V.color("c-blue")).attr("stroke-width", 2.5);

      // mean + median markers
      const meanLine = g.append("line").attr("stroke", V.color("mean")).attr("stroke-width", 2).attr("stroke-dasharray", "5 3");
      const meanLbl = g.append("text").attr("fill", V.color("mean")).attr("font-size", 12).attr("font-weight", 700).attr("text-anchor", "middle").text("mean");
      const medLine = g.append("line").attr("stroke", V.color("median")).attr("stroke-width", 2);
      const medLbl = g.append("text").attr("fill", V.color("median")).attr("font-size", 12).attr("font-weight", 700).attr("text-anchor", "middle").text("median");

      // draggable threshold
      let threshold = 40;
      const threshLine = g.append("line").attr("stroke", V.color("highlight")).attr("stroke-width", 3).attr("y1", 0).attr("y2", dims.innerH);
      const threshHandle = g.append("circle").attr("r", 9)
        .attr("fill", V.color("highlight")).attr("stroke", "#fff").attr("stroke-width", 2)
        .style("cursor", "ew-resize");
      const threshLbl = g.append("text").attr("fill", V.color("ink-700")).attr("font-size", 12).attr("font-weight", 700).attr("text-anchor", "middle");

      const tip = V.tooltip();

      const drag = d3.drag()
        .on("start", function () { threshHandle.attr("r", 11); })
        .on("drag", function (ev) {
          let v = x.invert(ev.x);
          v = Math.max(DOMAIN[0], Math.min(DOMAIN[1], v));
          threshold = v;
          draw();
        })
        .on("end", function () { threshHandle.attr("r", 9); });
      threshHandle.call(drag);

      // let clicking anywhere on the curve area move the threshold too
      const hitRect = g.append("rect")
        .attr("x", 0).attr("y", 0).attr("width", dims.innerW).attr("height", dims.innerH)
        .attr("fill", "transparent").style("cursor", "ew-resize");
      hitRect.on("mousemove", (ev) => {
        const [mx] = d3.pointer(ev, g.node());
        const xv = x.invert(mx);
        const ar = areaLeftOf(xv);
        tip.show(`below <b>${S.fmt(xv, 0)}</b>: <b>${S.fmt(ar * 100, 1)}%</b> of the area`, ev);
      }).on("mouseout", () => tip.hide());
      hitRect.on("click", (ev) => {
        const [mx] = d3.pointer(ev, g.node());
        threshold = Math.max(DOMAIN[0], Math.min(DOMAIN[1], x.invert(mx)));
        draw();
      });
      // keep handle/markers clickable above the hit rect by re-appending
      threshHandle.raise();

      function rebuild() {
        buildModel();
        y.domain([0, peakY * 1.12]);
        draw();
      }

      function draw() {
        const pts = grid.map((gx, i) => ({ x: gx, y: ys[i] }));
        fullPath.attr("d", areaGen(pts));
        curvePath.attr("d", lineGen(pts));

        // shaded region: grid points up to threshold, plus the threshold edge
        const shaded = [];
        for (let i = 0; i < grid.length; i++) {
          if (grid[i] <= threshold) shaded.push({ x: grid[i], y: ys[i] });
          else break;
        }
        // append the exact threshold point with interpolated height
        const t = Math.max(0, Math.min(grid.length - 2, (threshold - DOMAIN[0]) / dx));
        const il = Math.floor(t), fr = t - il;
        const yEdge = ys[il] + fr * (ys[il + 1] - ys[il]);
        shaded.push({ x: threshold, y: yEdge });
        shadedPath.attr("d", areaGen(shaded));

        // markers
        meanLine.attr("x1", x(meanVal)).attr("x2", x(meanVal)).attr("y1", y(0)).attr("y2", 6);
        meanLbl.attr("x", x(meanVal)).attr("y", -8);
        medLine.attr("x1", x(medianVal)).attr("x2", x(medianVal)).attr("y1", y(0)).attr("y2", 18);
        medLbl.attr("x", x(medianVal)).attr("y", 30);

        // threshold visuals
        threshLine.attr("x1", x(threshold)).attr("x2", x(threshold));
        threshHandle.attr("cx", x(threshold)).attr("cy", dims.innerH - 10);
        const ar = areaLeftOf(threshold);
        threshLbl.attr("x", x(threshold)).attr("y", dims.innerH - 22).text(S.fmt(ar, 2));

        // readouts
        sArea.set(S.fmt(ar, 3));
        sMean.set(S.fmt(meanVal, 1));
        sMed.set(S.fmt(medianVal, 1));
        const gap = meanVal - medianVal;
        sGap.set((gap >= 0 ? "+" : "") + S.fmt(gap, 1));

        // verdict on skew direction
        if (Math.abs(gap) < 0.5) {
          verdict.className = "callout key";
          verdict.innerHTML = `<span class="label">Symmetric</span> The mean (${S.fmt(meanVal, 1)}) and median
            (${S.fmt(medianVal, 1)}) sit almost on top of each other. With balanced tails, the balance point
            and the equal-areas point agree.`;
        } else if (gap > 0) {
          verdict.className = "callout warn";
          verdict.innerHTML = `<span class="label">Right-skewed: mean &gt; median</span> The long tail runs to the
            <b>right</b>. It pulls the balance point (mean ${S.fmt(meanVal, 1)}) toward the big values, while the
            equal-areas point (median ${S.fmt(medianVal, 1)}) holds near the bulk. The mean is the larger of the two.`;
        } else {
          verdict.className = "callout warn";
          verdict.innerHTML = `<span class="label">Left-skewed: mean &lt; median</span> The long tail runs to the
            <b>left</b>. It pulls the balance point (mean ${S.fmt(meanVal, 1)}) down toward the small values, while
            the equal-areas point (median ${S.fmt(medianVal, 1)}) holds near the bulk. The mean is the smaller of the two.`;
        }

        threshHandle.raise();
      }

      rebuild();
    },
    teardown() {},
  };

  function wireQuiz(root, okMsg, noMsg) {
    const opts = root.querySelectorAll(".opt");
    const fb = root.querySelector(".feedback");
    opts.forEach((o) => o.addEventListener("click", () => {
      const ok = o.dataset.ok === "1";
      opts.forEach((x) => x.classList.remove("correct", "wrong"));
      o.classList.add(ok ? "correct" : "wrong");
      if (ok) root.querySelector('[data-ok="1"]').classList.add("correct");
      fb.className = "feedback show " + (ok ? "ok" : "no");
      fb.innerHTML = ok ? okMsg : noMsg;
    }));
  }
})();
