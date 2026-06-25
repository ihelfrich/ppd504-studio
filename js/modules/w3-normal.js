/* =====================================================================
   w3-normal, The Normal curve and the empirical (68-95-99.7) rule
   A bell-curve explorer: slide mu, stretch sigma, shade the 1/2/3-sigma
   bands and read the exact area, or drag two bounds and read the
   probability between them. Every percentage comes from S.normalArea,
   so the numbers are computed, not memorized.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w3-normal"] = {
    render(container) {
      P.lessonHeader(container, "w3-normal",
        "One bell, two dials. The mean slides the whole curve left or right; the standard deviation " +
        "stretches it wide or pinches it tall. Once you fix those two numbers, the percentages fall out on their own.");

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>A curve with two settings</h3>
        <div class="callout"><span class="label">Shape</span>
          A Normal curve is symmetric, single-peaked, and bell-shaped. Its center is the peak, and because
          the curve is a mirror image left and right, the mean and the median sit together right there.
        </div>
        <div class="callout"><span class="label">The two dials, mu and sigma</span>
          The curve is fully described by just two numbers, written
          ${V.fml.inline("N(&mu;, &sigma;)")}: the mean
          ${V.fml.inline("&mu;")} (where the center sits) and the standard deviation
          ${V.fml.inline("&sigma;")} (how spread out it is). Change
          ${V.fml.inline("&mu;")} and the whole curve slides sideways. Change
          ${V.fml.inline("&sigma;")} and it gets wider (bigger spread) or narrower (smaller spread).
          ${V.fml.inline("&sigma;")} is also the distance from the center out to the point on each side
          where the curve stops bending down and starts bending out: the inflection point.
        </div>
        <div class="callout key"><span class="label">The empirical rule (68-95-99.7)</span>
          For any Normal curve, the share of the data within a fixed number of standard deviations of the
          mean is always the same:
          <ul style="margin:8px 0 2px;padding-left:20px;font-size:14px">
            <li>about <b>68%</b> falls within ${V.fml.inline("&mu; &plusmn; 1&sigma;")}</li>
            <li>about <b>95%</b> falls within ${V.fml.inline("&mu; &plusmn; 2&sigma;")}</li>
            <li>about <b>99.7%</b> falls within ${V.fml.inline("&mu; &plusmn; 3&sigma;")}</li>
          </ul>
        </div>`;
      container.appendChild(concept);

      /* ---- interactive lab ---- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Normal-curve explorer</h3>
        <p>Drag the sliders to set mu and sigma. Pick a band to shade and read the exact percentage, or switch to area mode and drag the two bounds.</p>
      </div>`;
      const body = V.el("div.lab-body");
      const plot = V.el("div");
      body.appendChild(plot);

      const legend = V.el("div.legend", { style: { margin: "10px 0 2px" } });
      legend.innerHTML = `
        <span class="swatch"><i style="background:${V.color("c-blue")}"></i> Normal curve</span>
        <span class="swatch"><i style="background:${V.color("gold")};opacity:.55"></i> shaded area</span>
        <span class="swatch"><i style="background:${V.color("mean")}"></i> mean (= median)</span>
        <span class="swatch"><i style="width:12px;height:0;border-top:2px dashed ${V.color("ink-500")};border-radius:0"></i> inflection (mu &plusmn; sigma)</span>`;
      body.appendChild(legend);

      const stats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const sMu = V.stat("Mean μ", "—", "");
      const sSig = V.stat("SD σ", "—", "");
      const sLo = V.stat("Lower bound", "—", "");
      const sHi = V.stat("Upper bound", "—", "");
      const sArea = V.stat("Shaded area", "—", "accent");
      [sMu, sSig, sLo, sHi, sArea].forEach((s) => stats.appendChild(s));
      sMu.querySelector(".v").style.color = V.color("mean");
      body.appendChild(stats);

      const verdict = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(verdict);
      lab.appendChild(body);

      /* ---- controls ---- */
      const controls = V.el("div.lab-controls");

      // mode toggle
      const segMode = V.el("div.seg");
      ["Empirical bands", "Area between bounds"].forEach((t, i) => {
        const b = V.el("button", { text: t });
        if (i === 0) b.classList.add("active");
        b.dataset.mode = i === 0 ? "band" : "area";
        segMode.appendChild(b);
      });
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Mode" }), segMode]));

      // band toggle (1 / 2 / 3 sigma)
      const segBand = V.el("div.seg");
      [["1", "± 1σ"], ["2", "± 2σ"], ["3", "± 3σ"]].forEach(([k, t], i) => {
        const b = V.el("button", { text: t });
        if (i === 1) b.classList.add("active"); // default to 2 sigma (95%)
        b.dataset.k = k;
        segBand.appendChild(b);
      });
      const bandControl = V.el("div.control", null, [V.el("label", { text: "Show band" }), segBand]);
      controls.appendChild(bandControl);

      // sliders
      const muSlider = V.slider({
        label: "Mean μ", min: 40, max: 160, step: 1, value: 100,
        format: (v) => S.fmt(v, 0),
        on: () => { mu = muSlider.value; draw(); },
      });
      const sigSlider = V.slider({
        label: "SD σ", min: 5, max: 30, step: 1, value: 15,
        format: (v) => S.fmt(v, 0),
        on: () => { sigma = sigSlider.value; draw(); },
      });
      controls.appendChild(muSlider.wrap);
      controls.appendChild(sigSlider.wrap);
      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">SAT section scores are roughly Normal with mean 500 and standard deviation 100.
          About what percent of test-takers score between 300 and 700?</div>
          <button class="opt" data-ok="0">About 68%</button>
          <button class="opt" data-ok="1">About 95%</button>
          <button class="opt" data-ok="0">About 99.7%</button>
          <button class="opt" data-ok="0">We cannot tell without the full table</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ---- the heights exercise ---- */
      P.renderPractice(container, "w3-empirical");

      /* ====================================================================
         state + scaffold
         ==================================================================== */
      // x-domain is fixed at the default center so the curve slides within a
      // stable window: default mu 100, default sigma 15, so +/- 4 sigma = [40, 160].
      const DOMAIN = [40, 160];
      let mu = 100, sigma = 15;
      let mode = "band";   // "band" or "area"
      let bandK = 2;       // 1, 2, or 3 sigma
      let loB = 85, hiB = 115;  // draggable bounds for area mode

      const dims = V.svg(plot, { height: 300, margin: { top: 24, right: 24, bottom: 46, left: 24 } });
      const g = dims.g;
      const x = d3.scaleLinear().domain(DOMAIN).range([0, dims.innerW]);
      // y-scale: peak of the TALLEST allowed curve (smallest sigma = 5) sets the top,
      // so the curve never overflows the panel as sigma shrinks.
      const yMax = S.normalPDF(0, 0, 5) * 1.06;
      const y = d3.scaleLinear().domain([0, yMax]).range([dims.innerH, 0]);

      // baseline + x-axis
      g.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${dims.innerH})`)
        .call(d3.axisBottom(x).ticks(9));
      g.append("text").attr("class", "axis-label")
        .attr("x", dims.innerW / 2).attr("y", dims.innerH + 38)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("value of x");

      // grid of x sample points (fine, for a smooth curve)
      const XS = d3.range(DOMAIN[0], DOMAIN[1] + 0.001, (DOMAIN[1] - DOMAIN[0]) / 240);

      const area = d3.area().x((d) => x(d)).y0(dims.innerH).y1((d) => y(S.normalPDF(d, mu, sigma)));
      const line = d3.line().x((d) => x(d)).y((d) => y(S.normalPDF(d, mu, sigma)));

      // shaded region (drawn under the curve)
      const shadePath = g.append("path").attr("fill", V.color("gold")).attr("fill-opacity", 0.5);
      // the curve itself
      const curvePath = g.append("path").attr("fill", "none")
        .attr("stroke", V.color("c-blue")).attr("stroke-width", 2.5);

      // mean line
      const meanLine = g.append("line").attr("y1", 0).attr("y2", dims.innerH)
        .attr("stroke", V.color("mean")).attr("stroke-width", 2).attr("stroke-dasharray", "5 3");
      const meanLbl = g.append("text").attr("fill", V.color("mean")).attr("font-size", 12)
        .attr("font-weight", 700).attr("text-anchor", "middle").attr("y", -8).text("μ");

      // inflection ticks (mu +/- sigma), short dashed verticals near the baseline
      const inflG = g.append("g");
      const inflL = inflG.append("line").attr("stroke", V.color("ink-500")).attr("stroke-width", 1.5).attr("stroke-dasharray", "3 3");
      const inflR = inflG.append("line").attr("stroke", V.color("ink-500")).attr("stroke-width", 1.5).attr("stroke-dasharray", "3 3");

      // band-edge labels (the +/- k sigma annotation in band mode)
      const bandLblL = g.append("text").attr("font-size", 11).attr("fill", V.color("ink-600")).attr("text-anchor", "middle");
      const bandLblR = g.append("text").attr("font-size", 11).attr("fill", V.color("ink-600")).attr("text-anchor", "middle");

      // a centered percentage label sitting inside the shaded region
      const pctLbl = g.append("text").attr("text-anchor", "middle").attr("font-size", 15)
        .attr("font-weight", 800).attr("fill", V.color("ink-900"));

      // draggable bound handles (area mode only)
      const handlesG = g.append("g");
      const tip = V.tooltip();

      function boundDrag(which) {
        return d3.drag()
          .on("start", function () { d3.select(this).attr("stroke-width", 4); })
          .on("drag", function (ev) {
            let v = x.invert(ev.x);
            v = Math.max(DOMAIN[0], Math.min(DOMAIN[1], v));
            if (which === "lo") loB = Math.min(v, hiB);
            else hiB = Math.max(v, loB);
            draw();
          })
          .on("end", function () { d3.select(this).attr("stroke-width", 2.5); });
      }

      function makeHandle(which) {
        const grp = handlesG.append("g").style("cursor", "ew-resize");
        const ln = grp.append("line").attr("y1", 0).attr("y2", dims.innerH)
          .attr("stroke", V.color("cardinal")).attr("stroke-width", 2.5);
        const grip = grp.append("rect").attr("x", -7).attr("width", 14).attr("height", 22).attr("rx", 4)
          .attr("y", dims.innerH / 2 - 11).attr("fill", V.color("cardinal"));
        grp.append("line").attr("x1", -2.5).attr("x2", -2.5).attr("y1", dims.innerH / 2 - 5).attr("y2", dims.innerH / 2 + 5).attr("stroke", "#fff").attr("stroke-width", 1.4);
        grp.append("line").attr("x1", 2.5).attr("x2", 2.5).attr("y1", dims.innerH / 2 - 5).attr("y2", dims.innerH / 2 + 5).attr("stroke", "#fff").attr("stroke-width", 1.4);
        grp.call(boundDrag(which))
          .on("mouseover", (ev) => tip.show((which === "lo" ? "lower" : "upper") + " bound: <b>" + S.fmt(which === "lo" ? loB : hiB, 1) + "</b>", ev))
          .on("mousemove", (ev) => tip.move(ev))
          .on("mouseout", () => tip.hide());
        return { grp, ln, grip };
      }
      const hLo = makeHandle("lo");
      const hHi = makeHandle("hi");

      /* ====================================================================
         draw
         ==================================================================== */
      function draw() {
        // curve + readouts that always show
        curvePath.attr("d", line(XS));
        meanLine.attr("x1", x(mu)).attr("x2", x(mu));
        meanLbl.attr("x", x(mu));
        sMu.set(S.fmt(mu, 0));
        sSig.set(S.fmt(sigma, 0));

        // inflection ticks at mu +/- sigma (short verticals up to the curve height there)
        const infY = y(S.normalPDF(mu + sigma, mu, sigma));
        [["L", mu - sigma, inflL], ["R", mu + sigma, inflR]].forEach(([, xv, sel]) => {
          if (xv >= DOMAIN[0] && xv <= DOMAIN[1]) {
            sel.attr("display", null).attr("x1", x(xv)).attr("x2", x(xv)).attr("y1", infY).attr("y2", dims.innerH);
          } else {
            sel.attr("display", "none");
          }
        });

        let lo, hi, areaProb;

        if (mode === "band") {
          lo = mu - bandK * sigma;
          hi = mu + bandK * sigma;
          // clip the shaded region to the visible domain for drawing, but the
          // probability is computed on the true (unclipped) band.
          areaProb = S.normalArea(lo, hi, mu, sigma);

          // band-edge labels under the baseline (clipped into view)
          bandLblL.attr("display", null).attr("x", x(Math.max(lo, DOMAIN[0])))
            .attr("y", dims.innerH - 4).text("μ − " + bandK + "σ");
          bandLblR.attr("display", null).attr("x", x(Math.min(hi, DOMAIN[1])))
            .attr("y", dims.innerH - 4).text("μ + " + bandK + "σ");

          // hide bound handles
          hLo.grp.attr("display", "none");
          hHi.grp.attr("display", "none");
        } else {
          lo = loB; hi = hiB;
          areaProb = S.normalArea(lo, hi, mu, sigma);
          bandLblL.attr("display", "none");
          bandLblR.attr("display", "none");

          // show + position the handles
          hLo.grp.attr("display", null).attr("transform", `translate(${x(lo)},0)`);
          hHi.grp.attr("display", null).attr("transform", `translate(${x(hi)},0)`);
        }

        // shaded area path: integrate the curve between clipped bounds
        const cLo = Math.max(lo, DOMAIN[0]);
        const cHi = Math.min(hi, DOMAIN[1]);
        const shadeXS = XS.filter((d) => d >= cLo && d <= cHi);
        if (shadeXS.length >= 2) {
          // pad the ends exactly to the bounds so the fill is flush
          const pts = [cLo, ...shadeXS, cHi];
          shadePath.attr("display", null).attr("d", area(pts));
        } else {
          shadePath.attr("display", "none");
        }

        // percentage label centered in the shaded region, just under the curve peak
        const midX = (cLo + cHi) / 2;
        const pctText = S.fmt(areaProb * 100, 1) + "%";
        pctLbl.attr("x", x(midX)).attr("y", y(S.normalPDF(mu, mu, sigma)) + 22).text(pctText);

        // readouts
        sLo.set(S.fmt(lo, 1));
        sHi.set(S.fmt(hi, 1));
        sArea.set(pctText);

        // verdict callout
        if (mode === "band") {
          const exact = S.fmt(areaProb * 100, 1);
          verdict.className = "callout key";
          verdict.innerHTML = `<span class="label">Within μ ± ${bandK}σ</span> ` +
            `The shaded slice runs from <b>${S.fmt(lo, 1)}</b> to <b>${S.fmt(hi, 1)}</b> and holds ` +
            `<b>${exact}%</b> of the area. The empirical rule rounds this to ` +
            `<b>${bandK === 1 ? "68" : bandK === 2 ? "95" : "99.7"}%</b>, and notice it does not depend on the values of μ or σ: ` +
            `slide or stretch the curve and the percentage stays put.`;
        } else {
          verdict.className = "callout";
          const zLo = S.standardize(lo, mu, sigma);
          const zHi = S.standardize(hi, mu, sigma);
          verdict.innerHTML = `<span class="label">Area between the bounds</span> ` +
            `<b>${S.fmt(areaProb * 100, 1)}%</b> of a ${`N(${S.fmt(mu, 0)}, ${S.fmt(sigma, 0)})`} population falls between ` +
            `<b>${S.fmt(lo, 1)}</b> and <b>${S.fmt(hi, 1)}</b>. ` +
            `In standard units that is z from <b>${S.fmt(zLo, 2)}</b> to <b>${S.fmt(zHi, 2)}</b>. ` +
            `Drag a handle to any pair of values and the area updates exactly.`;
        }
      }

      /* ====================================================================
         wire controls
         ==================================================================== */
      segMode.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        segMode.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        mode = b.dataset.mode;
        // band toggle is only meaningful in band mode; dim it otherwise
        bandControl.style.opacity = mode === "band" ? "1" : ".4";
        bandControl.style.pointerEvents = mode === "band" ? "auto" : "none";
        draw();
      });

      segBand.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        segBand.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        bandK = +b.dataset.k;
        draw();
      });

      draw();
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
        ? "Right. 300 and 700 are exactly 2σ below and above the mean of 500 (each 200 points = 2 × 100). The empirical rule puts about 95% of the area within μ ± 2σ."
        : "Not quite. 300 is 2σ below the mean and 700 is 2σ above it (200 points = 2 × 100). The middle 2σ band holds about 95%, so this one is the answer.";
    }));
  }
})();
