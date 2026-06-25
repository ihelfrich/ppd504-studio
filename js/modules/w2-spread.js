/* =====================================================================
   w2-spread, Variance and standard deviation as squared deviations
   Drag points on a number line. Each point's distance from the mean
   becomes a literal square; the total square area is the sum of squared
   deviations, and s is the typical side of those squares. Drop in an
   outlier to watch s, which is not resistant, jump.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w2-spread"] = {
    render(container) {
      P.lessonHeader(container, "w2-spread",
        "Spread is how far the data sits from its own mean. Square each gap, average those squares (dividing by n minus 1), " +
        "take the square root, and you have s: a typical distance from the center, in the data's own units.");

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>From deviations to a single number for spread</h3>
        <div class="callout"><span class="label">Start with deviations</span>
          A deviation is how far one value sits from the mean: ${V.fml.inline(`x<sub>i</sub> &minus; ${V.fml.xbar}`)}.
          Some are positive, some negative, and they always cancel to zero. Squaring fixes that: it makes every gap positive
          and weights the far ones much more heavily.
        </div>
        <div class="callout"><span class="label">Average the squares, then unsquare</span>
          The sample variance ${V.fml.inline("s<sup>2</sup>")} adds up the squared deviations and divides by
          <i>n</i> &minus; 1. The standard deviation ${V.fml.inline("s")} is its square root, which brings the answer back to
          the original units (dollars, years, percent), not squared units.
          ${V.fml.block(`s<sup>2</sup> = ${V.fml.frac(`&Sigma;(x<sub>i</sub> &minus; ${V.fml.xbar})<sup>2</sup>`, "n &minus; 1")}
            &nbsp;&nbsp;&nbsp; s = ${V.fml.sqrt(`s<sup>2</sup>`)}`)}
        </div>
        <div class="callout key"><span class="label">What to remember</span>
          ${V.fml.inline("s")} is never negative, and it equals 0 only when every value is identical (no spread at all).
          The wider the data fans out, the larger ${V.fml.inline("s")} grows. Report ${V.fml.inline("s")} only when the mean is
          your chosen center, because, like the mean, ${V.fml.inline("s")} is <b>not resistant</b>: a single outlier can blow it up.
        </div>`;
      container.appendChild(concept);

      /* ---- interactive lab ---- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Deviations builder</h3>
        <p>Drag the dots along the line. The dashed red line is the mean. Each gray bar is one deviation; flip on the squares
        to see variance as total area. The stat cards rebuild s live as you move points.</p>
      </div>`;
      const body = V.el("div.lab-body");

      const legend = V.el("div.legend", { style: { marginBottom: "8px" } });
      legend.innerHTML =
        `<span class="swatch"><i style="background:${V.color("c-blue")}"></i> data point</span>` +
        `<span class="swatch"><i style="background:${V.color("mean")}"></i> mean</span>` +
        `<span class="swatch"><i style="background:${V.color("ink-400")}"></i> deviation (gap from mean)</span>` +
        `<span class="swatch"><i style="background:${V.color("c-amber")};opacity:.45"></i> squared deviation</span>`;
      body.appendChild(legend);

      const plot = V.el("div");
      body.appendChild(plot);

      const stats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const sMean = V.stat("Mean", "—", "");
      const sSS = V.stat("Σ(x − x̄)²", "—", "accent");
      const sVar = V.stat("Variance s²", "—", "");
      const sSD = V.stat("Std. dev. s", "—", "good");
      const sN = V.stat("n", "—", "");
      [sN, sMean, sSS, sVar, sSD].forEach((s) => stats.appendChild(s));
      sMean.querySelector(".v").style.color = V.color("mean");
      body.appendChild(stats);

      const verdict = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(verdict);
      lab.appendChild(body);

      const controls = V.el("div.lab-controls");

      const seg = V.el("div.seg");
      ["Tight", "Spread"].forEach((t, i) => {
        const b = V.el("button", { text: t });
        if (i === 0) b.classList.add("active");
        b.dataset.preset = t;
        seg.appendChild(b);
      });
      controls.appendChild(V.el("div.control", null, [
        V.el("label", { text: "Same mean, different spread" }), seg,
      ]));

      const sqRow = V.el("div.seg");
      ["Squares on", "Squares off"].forEach((t, i) => {
        const b = V.el("button", { text: t });
        if (i === 0) b.classList.add("active");
        b.dataset.sq = (i === 0) ? "1" : "0";
        sqRow.appendChild(b);
      });
      controls.appendChild(V.el("div.control", null, [
        V.el("label", { text: "Show squared deviations" }), sqRow,
      ]));

      const btns = V.el("div.btn-row");
      const bOut = V.el("button.btn", { text: "+ Add outlier" });
      const bReset = V.el("button.btn.ghost", { text: "Reset" });
      btns.appendChild(bOut); btns.appendChild(bReset);
      controls.appendChild(V.el("div.control", null, [
        V.el("label", { text: "Stress-test s" }), btns,
      ]));

      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">A small town reports that the standard deviation of household size is exactly 0.
          What does that tell you?</div>
          <button class="opt" data-ok="0">The mean household size is also 0</button>
          <button class="opt" data-ok="1">Every household has the exact same number of people</button>
          <button class="opt" data-ok="0">Half the households are above the mean and half below</button>
          <button class="opt" data-ok="0">There must be a data-entry error, s can never be 0</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ---------- data + presets ---------- */
      const DOMAIN = [0, 100];
      let showSquares = true;
      /* both presets have mean exactly 50, n = 7, but very different spread */
      const presets = {
        "Tight":  [44, 47, 49, 50, 51, 53, 56],
        "Spread": [30, 40, 46, 50, 54, 60, 70],
      };
      let current = "Tight";
      let data = presets[current].slice();
      const rand = S.rng(7);  // seeded so the outlier jitter is reproducible

      /* ---------- d3 scaffold ---------- */
      const dims = V.svg(plot, { height: 300, margin: { top: 24, right: 30, bottom: 48, left: 30 } });
      const g = dims.g;
      const x = d3.scaleLinear().domain(DOMAIN).range([0, dims.innerW]);
      const beamY = dims.innerH - 30;
      // pixels per data unit, so a square of "side = deviation in data units"
      // is drawn with a side of that many pixels on screen
      const pxPerUnit = (x(1) - x(0));

      g.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${beamY})`)
        .call(d3.axisBottom(x).ticks(10));

      g.append("text").attr("class", "axis-label")
        .attr("x", dims.innerW / 2).attr("y", beamY + 38)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("value");

      // baseline beam
      g.append("line")
        .attr("x1", 0).attr("x2", dims.innerW).attr("y1", beamY).attr("y2", beamY)
        .attr("stroke", V.color("ink-400")).attr("stroke-width", 2);

      // layers, drawn back to front
      const squaresG = g.append("g");
      const devG = g.append("g");
      const meanLine = g.append("line").attr("y1", 0).attr("y2", beamY)
        .attr("stroke", V.color("mean")).attr("stroke-width", 2).attr("stroke-dasharray", "5 3");
      const meanLbl = g.append("text").attr("fill", V.color("mean"))
        .attr("font-size", 12).attr("font-weight", 700).attr("text-anchor", "middle").attr("y", -8).text("mean");
      const dotsG = g.append("g");
      const tip = V.tooltip();

      /* ---------- drawing ---------- */
      function draw() {
        const m = S.mean(data);
        const ss = data.reduce((t, v) => t + (v - m) * (v - m), 0);
        const variance = S.variance(data);   // (n - 1) divisor
        const sd = S.sd(data);

        // stagger the squares vertically so overlapping ones stay readable:
        // sort by distance from the mean, biggest squares sit lowest
        const items = data.map((v, i) => ({ v, i, dev: v - m }));

        // squared-deviation rectangles (side = |dev| in data units, scaled to px)
        const sq = squaresG.selectAll("rect.sq").data(showSquares ? items : [], (d) => d.i);
        sq.exit().remove();
        sq.enter().append("rect").attr("class", "sq")
            .attr("fill", V.color("c-amber")).attr("fill-opacity", 0.16)
            .attr("stroke", V.color("c-amber")).attr("stroke-opacity", 0.55).attr("stroke-width", 1)
          .merge(sq)
            .each(function (d) {
              const sidePx = Math.abs(d.dev) * pxPerUnit;
              const x0 = d.dev >= 0 ? x(m) : x(m) - sidePx;  // square hugs the mean line
              d3.select(this)
                .attr("x", x0)
                .attr("y", beamY - sidePx)
                .attr("width", sidePx)
                .attr("height", sidePx);
            });

        // deviation connectors (point down to the beam, across to the mean)
        const dv = devG.selectAll("line.dev").data(items, (d) => d.i);
        dv.exit().remove();
        dv.enter().append("line").attr("class", "dev")
            .attr("stroke", V.color("ink-400")).attr("stroke-width", 1.5).attr("stroke-dasharray", "2 2")
          .merge(dv)
            .attr("x1", (d) => x(d.v)).attr("x2", (d) => x(m))
            .attr("y1", beamY).attr("y2", beamY);

        // mean line
        meanLine.attr("x1", x(m)).attr("x2", x(m));
        meanLbl.attr("x", x(m));

        // data dots, sit on the beam
        const sel = dotsG.selectAll("circle.pt").data(items, (d) => d.i);
        sel.exit().remove();
        sel.enter().append("circle").attr("class", "pt")
            .attr("r", 9).attr("fill", V.color("c-blue")).attr("fill-opacity", 0.9)
            .attr("stroke", "#fff").attr("stroke-width", 1.5).style("cursor", "grab")
            .call(drag)
            .on("mouseover", (ev, d) => tip.show(
              `value = <b>${S.fmt(d.v, 1)}</b><br>deviation = <b>${(d.dev >= 0 ? "+" : "") + S.fmt(d.dev, 1)}</b>` +
              `<br>squared = <b>${S.fmt(d.dev * d.dev, 1)}</b>`, ev))
            .on("mousemove", (ev) => tip.move(ev))
            .on("mouseout", () => tip.hide())
          .merge(sel)
            .attr("cx", (d) => x(d.v)).attr("cy", beamY);

        // stat readouts
        sN.set(data.length);
        sMean.set(S.fmt(m, 1));
        sSS.set(S.fmt(ss, 1));
        sVar.set(S.fmt(variance, 1));
        sSD.set(S.fmt(sd, 2));

        // plain-language verdict
        if (sd < 0.05) {
          verdict.className = "callout key";
          verdict.innerHTML = `<span class="label">No spread</span> Every value equals the mean, so each deviation is 0 and
            <b>s = 0</b>. This is the only way s can reach 0.`;
        } else {
          const range = S.range(data);
          verdict.className = "callout";
          let read;
          if (sd < 6) read = "tightly clustered: most values land close to the mean";
          else if (sd < 14) read = "moderately spread: values wander a fair bit from the mean";
          else read = "widely spread: values are scattered far from the mean";
          verdict.innerHTML = `<span class="label">Reading s</span> A typical value sits about
            <b>${S.fmt(sd, 1)}</b> away from the mean of ${S.fmt(m, 1)} (the data ${read}). The full range is
            ${S.fmt(range, 0)}, and squaring the deviations is what makes the far points dominate s.`;
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

      /* ---------- controls wiring ---------- */
      bOut.onclick = () => { data.push(90 + rand() * 8); draw(); };
      bReset.onclick = () => {
        data = presets[current].slice();
        draw();
      };
      seg.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        seg.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        current = b.dataset.preset;
        data = presets[current].slice();
        draw();
      });
      sqRow.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        sqRow.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        showSquares = b.dataset.sq === "1";
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
        ? "Right. s = 0 means every squared deviation is 0, which only happens when all values are identical. " +
          "s has nothing to do with the mean's value, and it genuinely can be 0."
        : "Not quite. s is built from squared deviations, so it hits 0 only when every value equals the mean, " +
          "that is, when all the values are identical. It says nothing about how large the mean is.";
    }));
  }
})();
