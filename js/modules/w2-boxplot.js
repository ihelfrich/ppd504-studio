/* =====================================================================
   w2-boxplot, The five-number summary, the boxplot, and the 1.5xIQR rule
   Drag a small batch of points; below them a real boxplot redraws from the
   COURSE quartile method (S.quartilesMBB). Two faint dashed fences mark the
   1.5xIQR cutoffs; drag a point past a fence and it turns red, flagged as a
   suspected outlier, while the whiskers retreat to the most extreme value
   that is still inside.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w2-boxplot"] = {
    render(container) {
      P.lessonHeader(container, "w2-boxplot",
        "A boxplot squeezes a whole distribution into five numbers and one rule. " +
        "Drag a point out to the edge and watch the box hold steady while the dot crosses a fence and gets flagged.");

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>Five numbers, one box, one rule</h3>
        <div class="callout"><span class="label">Find the quartiles (the course way)</span>
          Order the data and find the median <b>M</b>, the value with half the data below it.
          Split the data at M. Q1 is the median of the lower half, Q3 is the median of the upper half.
          When the count <i>n</i> is odd, leave M out of both halves before you split.
        </div>
        <div class="callout"><span class="label">The five-number summary</span>
          Min, Q1, M, Q3, Max. The box runs from Q1 to Q3 with a line at M; the whiskers reach out
          to the smallest and largest values that are not flagged as outliers.
          ${V.fml.block(`IQR = Q<sub>3</sub> &minus; Q<sub>1</sub>`)}
        </div>
        <div class="callout key"><span class="label">The 1.5 x IQR outlier rule</span>
          IQR is the width of the box, the spread of the middle half of the data. Walk out
          1.5 box-widths past each edge to set two fences. A point past a fence is a suspected outlier.
          ${V.fml.block(`lower fence = Q<sub>1</sub> &minus; 1.5&middot;IQR &nbsp;&nbsp; upper fence = Q<sub>3</sub> + 1.5&middot;IQR`)}
        </div>`;
      container.appendChild(concept);

      /* ---- interactive lab ---- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Boxplot sandbox</h3>
        <p>Drag the dots along the line. The boxplot below rebuilds live; any dot that crosses a dashed fence turns red and is flagged.</p>
      </div>`;
      const body = V.el("div.lab-body");

      const legend = V.el("div.legend", { style: { marginBottom: "8px" } });
      legend.innerHTML = `
        <span class="swatch"><i style="background:${V.color("c-blue")}"></i> data point (inside the fences)</span>
        <span class="swatch"><i style="background:${V.color("c-red")}"></i> suspected outlier</span>
        <span class="swatch"><i style="background:${V.color("ink-300")};border:1px dashed ${V.color("ink-400")}"></i> 1.5 x IQR fence</span>`;
      body.appendChild(legend);

      const plot = V.el("div");
      body.appendChild(plot);

      const stats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const sMin = V.stat("Min", "—", "");
      const sQ1 = V.stat("Q1", "—", "");
      const sMed = V.stat("Median", "—", "accent");
      const sQ3 = V.stat("Q3", "—", "");
      const sMax = V.stat("Max", "—", "");
      const sIqr = V.stat("IQR", "—", "");
      [sMin, sQ1, sMed, sQ3, sMax, sIqr].forEach((s) => stats.appendChild(s));
      body.appendChild(stats);

      const verdict = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(verdict);
      lab.appendChild(body);

      const controls = V.el("div.lab-controls");
      const row1 = V.el("div.btn-row");
      const bOut = V.el("button.btn", { text: "+ Add outlier" });
      const bReset = V.el("button.btn.ghost", { text: "Reset" });
      [bOut, bReset].forEach((b) => row1.appendChild(b));
      const row2 = V.el("div.seg");
      ["Symmetric", "Skewed", "With outlier"].forEach((t, i) => {
        const b = V.el("button", { text: t });
        if (i === 0) b.classList.add("active");
        b.dataset.shape = t;
        row2.appendChild(b);
      });
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Load a shape" }), row2]));
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Edit points" }), row1]));
      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">A batch has Q1 = 40, Q3 = 60, so IQR = 20. By the 1.5 x IQR rule, the largest value that is
          <b>not</b> a suspected outlier on the high side can be no larger than what?</div>
          <button class="opt" data-ok="0">80, that is Q3 + 1.0 x IQR</button>
          <button class="opt" data-ok="1">90, that is Q3 + 1.5 x IQR</button>
          <button class="opt" data-ok="0">60, anything above Q3 is an outlier</button>
          <button class="opt" data-ok="0">120, that is Q3 + 3 x IQR</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ---------- data + presets ---------- */
      const DOMAIN = [0, 100];
      let data = [];
      const presets = {
        "Symmetric":    [22, 33, 40, 45, 49, 50, 51, 55, 60, 67, 78],
        "Skewed":       [10, 14, 17, 19, 22, 26, 31, 38, 49, 66, 90],
        "With outlier": [30, 36, 40, 43, 46, 48, 51, 54, 58, 63, 96],
      };
      function load(shape) { data = presets[shape].slice(); draw(); }

      /* ---------- d3 scaffold ---------- */
      const dims = V.svg(plot, { height: 280, margin: { top: 26, right: 30, bottom: 44, left: 30 } });
      const g = dims.g;
      const x = d3.scaleLinear().domain(DOMAIN).range([0, dims.innerW]);

      const dotsY = 46;          // jittered points live up here
      const boxY = dims.innerH - 78;
      const boxH = 40;
      const boxMid = boxY + boxH / 2;
      const axisY = dims.innerH - 18;

      // fences (drawn first so everything sits on top)
      const fenceLo = g.append("line").attr("y1", dotsY - 24).attr("y2", boxY + boxH + 8)
        .attr("stroke", V.color("ink-400")).attr("stroke-width", 1.4).attr("stroke-dasharray", "4 4").attr("opacity", 0.75);
      const fenceHi = g.append("line").attr("y1", dotsY - 24).attr("y2", boxY + boxH + 8)
        .attr("stroke", V.color("ink-400")).attr("stroke-width", 1.4).attr("stroke-dasharray", "4 4").attr("opacity", 0.75);
      const fenceLoLbl = g.append("text").attr("y", dotsY - 28).attr("text-anchor", "middle")
        .attr("font-size", 10.5).attr("fill", V.color("ink-500")).text("lower fence");
      const fenceHiLbl = g.append("text").attr("y", dotsY - 28).attr("text-anchor", "middle")
        .attr("font-size", 10.5).attr("fill", V.color("ink-500")).text("upper fence");

      // axis
      g.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${axisY})`)
        .call(d3.axisBottom(x).ticks(10));

      // boxplot pieces
      const whiskerLine = g.append("line").attr("y1", boxMid).attr("y2", boxMid)
        .attr("stroke", V.color("ink-600")).attr("stroke-width", 1.6);
      const capLo = g.append("line").attr("y1", boxMid - 9).attr("y2", boxMid + 9)
        .attr("stroke", V.color("ink-600")).attr("stroke-width", 1.6);
      const capHi = g.append("line").attr("y1", boxMid - 9).attr("y2", boxMid + 9)
        .attr("stroke", V.color("ink-600")).attr("stroke-width", 1.6);
      const box = g.append("rect").attr("y", boxY).attr("height", boxH)
        .attr("fill", V.color("c-blue")).attr("fill-opacity", 0.14)
        .attr("stroke", V.color("c-blue")).attr("stroke-width", 1.8).attr("rx", 3);
      const medLine = g.append("line").attr("y1", boxY).attr("y2", boxY + boxH)
        .attr("stroke", V.color("cardinal")).attr("stroke-width", 2.6);
      const medLbl = g.append("text").attr("y", boxY + boxH + 18).attr("text-anchor", "middle")
        .attr("font-size", 11).attr("font-weight", 700).attr("fill", V.color("cardinal")).text("M");

      const dotsG = g.append("g");
      const flagsG = g.append("g");
      const tip = V.tooltip();

      function draw() {
        const f = S.outlierFences(data);        // {lower, upper, iqr, q1, q3, outliers, inliers}
        const five = S.fiveNumber(data);          // {min, q1, median, q3, max}
        const isOut = (v) => v < f.lower || v > f.upper;

        // whiskers reach the most extreme NON-outlier value on each side
        const inside = data.filter((v) => !isOut(v));
        const whiskLo = inside.length ? S.min(inside) : five.median;
        const whiskHi = inside.length ? S.max(inside) : five.median;

        /* ---- jittered draggable points ---- */
        const sorted = data.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
        const yOf = {};
        let lastX = -999, level = 0;
        sorted.forEach((d) => {
          const px = x(d.v);
          if (px - lastX < 16) level++; else level = 0;
          yOf[d.i] = dotsY - level * 16;
          lastX = px;
        });

        const sel = dotsG.selectAll("circle.pt").data(data.map((v, i) => ({ v, i })), (d) => d.i);
        sel.exit().remove();
        sel.enter().append("circle").attr("class", "pt")
            .attr("r", 8).attr("stroke", "#fff").attr("stroke-width", 1.5).style("cursor", "grab")
            .call(drag)
            .on("mouseover", (ev, d) => tip.show(
              "value = <b>" + S.fmt(data[d.i], 1) + "</b>" + (isOut(data[d.i]) ? " &middot; <span style='color:#ffb4a8'>flagged</span>" : ""), ev))
            .on("mousemove", (ev) => tip.move(ev))
            .on("mouseout", () => tip.hide())
          .merge(sel)
            .attr("cx", (d) => x(data[d.i])).attr("cy", (d) => yOf[d.i])
            .attr("fill", (d) => isOut(data[d.i]) ? V.color("c-red") : V.color("c-blue"))
            .attr("fill-opacity", 0.9);

        /* ---- "outlier" labels above flagged points ---- */
        const outPts = data.map((v, i) => ({ v, i })).filter((d) => isOut(d.v));
        const fsel = flagsG.selectAll("text.flag").data(outPts, (d) => d.i);
        fsel.exit().remove();
        fsel.enter().append("text").attr("class", "flag")
            .attr("text-anchor", "middle").attr("font-size", 10).attr("font-weight", 700)
            .attr("fill", V.color("c-red"))
          .merge(fsel)
            .attr("x", (d) => x(data[d.i])).attr("y", (d) => yOf[d.i] - 13)
            .text("outlier");

        /* ---- boxplot geometry ---- */
        box.attr("x", x(five.q1)).attr("width", Math.max(1, x(five.q3) - x(five.q1)));
        medLine.attr("x1", x(five.median)).attr("x2", x(five.median));
        medLbl.attr("x", x(five.median));
        whiskerLine.attr("x1", x(whiskLo)).attr("x2", x(whiskHi));
        capLo.attr("x1", x(whiskLo)).attr("x2", x(whiskLo));
        capHi.attr("x1", x(whiskHi)).attr("x2", x(whiskHi));

        /* ---- fences (clamp to the drawable range so labels stay on-canvas) ---- */
        const cx = (v) => Math.max(0, Math.min(dims.innerW, x(v)));
        fenceLo.attr("x1", cx(f.lower)).attr("x2", cx(f.lower));
        fenceHi.attr("x1", cx(f.upper)).attr("x2", cx(f.upper));
        fenceLoLbl.attr("x", cx(f.lower)).attr("opacity", f.lower >= DOMAIN[0] ? 1 : 0.35);
        fenceHiLbl.attr("x", cx(f.upper)).attr("opacity", f.upper <= DOMAIN[1] ? 1 : 0.35);

        /* ---- readouts ---- */
        sMin.set(S.fmt(five.min, 1)); sQ1.set(S.fmt(five.q1, 1)); sMed.set(S.fmt(five.median, 1));
        sQ3.set(S.fmt(five.q3, 1)); sMax.set(S.fmt(five.max, 1)); sIqr.set(S.fmt(f.iqr, 1));

        /* ---- verdict ---- */
        const k = f.outliers.length;
        const summary = `Five-number summary: Min ${S.fmt(five.min,1)}, Q1 ${S.fmt(five.q1,1)}, ` +
          `M ${S.fmt(five.median,1)}, Q3 ${S.fmt(five.q3,1)}, Max ${S.fmt(five.max,1)}. ` +
          `IQR = ${S.fmt(f.iqr,1)}, so the fences sit at ${S.fmt(f.lower,1)} and ${S.fmt(f.upper,1)}.`;
        if (k === 0) {
          verdict.className = "callout key";
          verdict.innerHTML = `<span class="label">No outliers flagged</span> ${summary} ` +
            `Every value falls inside the fences, so the whiskers reach all the way to the Min and Max.`;
        } else {
          verdict.className = "callout warn";
          const word = k === 1 ? "1 value lies" : k + " values lie";
          const list = f.outliers.map((v) => S.fmt(v, 1)).join(", ");
          verdict.innerHTML = `<span class="label">${k} suspected outlier${k === 1 ? "" : "s"}</span> ${summary} ` +
            `${word} beyond a fence (${list}). The whisker on that side stops at the most extreme value still inside the fence.`;
        }
      }

      const drag = d3.drag()
        .on("start", function () { d3.select(this).style("cursor", "grabbing"); })
        .on("drag", function (ev, d) {
          let v = x.invert(ev.x);
          v = Math.max(DOMAIN[0], Math.min(DOMAIN[1], v));
          data[d.i] = v;
          draw();
        })
        .on("end", function () { d3.select(this).style("cursor", "grab"); });

      bOut.onclick = () => {
        // drop a point well past the current upper fence so the rule fires
        const f = S.outlierFences(data);
        const v = Math.min(DOMAIN[1], Math.max(f.upper + 0.12 * (f.iqr || 8) + 4, 94));
        data.push(v); draw();
      };
      bReset.onclick = () => {
        row2.querySelectorAll("button").forEach((b, i) => b.classList.toggle("active", i === 0));
        load("Symmetric");
      };
      row2.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        row2.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"));
        b.classList.add("active"); load(b.dataset.shape);
      });

      load("Symmetric");
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
        ? "Right. The upper fence is Q3 + 1.5 x IQR = 60 + 1.5(20) = 90. Anything above 90 gets flagged; 90 itself is the last value that is still safe."
        : "Not quite. The fence is Q3 + 1.5 x IQR = 60 + 1.5(20) = 90, not 80, 60, or 120. A value is flagged only once it passes 90.";
    }));
  }
})();
