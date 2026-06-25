/* =====================================================================
   w4-traps, When correlation misleads
   Three demonstrations of how a single number, r, can lie: it sees only
   straight-line association, it bends to a single outlier, and a strong r
   can be the fingerprint of a lurking third variable, not a cause.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w4-traps"] = {
    render(container) {
      P.lessonHeader(container, "w4-traps",
        "Correlation packs a whole scatterplot into one number, r. That convenience is also its trap: " +
        "r sees only straight lines, bends to a single stray point, and never tells you what causes what. Plot first, always.");

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>Three ways one number fools you</h3>
        <div class="callout"><span class="label">r measures straight-line association only</span>
          Correlation asks one narrow question: as <i>x</i> goes up, does <i>y</i> tend to rise (or fall)
          along a line? A strong curved pattern, like mileage that climbs then drops with speed, can give
          ${V.fml.inline("<i>r</i> &asymp; 0")} while the relationship is obvious to the eye.
        </div>
        <div class="callout"><span class="label">r is not resistant</span>
          One point in the corner can drag r from near 0 to near 1, the same way a single mansion drags the mean.
          Tukey's warning applies: a coefficient that one observation can flip is not describing the cloud,
          it is describing the stray.
        </div>
        <div class="callout warn"><span class="label">Correlation is not causation</span>
          A high r can be entirely manufactured by a third variable that moves both. Messerli (2012) plotted
          chocolate eaten per person against Nobel laureates per capita across countries and found
          ${V.fml.inline("<i>r</i> &asymp; 0.79")}. Nobody thinks fudge wins prizes: national wealth raises both.
          That hidden mover is the <b>lurking variable</b>.
        </div>`;
      container.appendChild(concept);

      /* ---- interactive lab ---- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Three traps, one scatterplot</h3>
        <p>Pick a demo. Each one shows a way the single number r misreads the picture in front of it.</p>
      </div>`;
      const body = V.el("div.lab-body");

      const seg = V.el("div.seg");
      const TABS = ["Nonlinear", "Outlier leverage", "Spurious"];
      TABS.forEach((t, i) => {
        const b = V.el("button", { text: t });
        if (i === 0) b.classList.add("active");
        b.dataset.tab = t;
        seg.appendChild(b);
      });
      body.appendChild(V.el("div.control", { style: { marginBottom: "12px" } },
        [V.el("label", { text: "Choose a demo" }), seg]));

      const plot = V.el("div");
      body.appendChild(plot);

      const stats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const sR = V.stat("r", "—", "accent");
      const sR2 = V.stat("r²", "—", "");
      const sN = V.stat("n", "—", "");
      [sR, sR2, sN].forEach((s) => stats.appendChild(s));
      body.appendChild(stats);

      const note = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(note);
      lab.appendChild(body);
      container.appendChild(lab);

      /* ---------- d3 scaffold ---------- */
      const dims = V.svg(plot, { height: 360, margin: { top: 22, right: 24, bottom: 48, left: 56 } });
      const g = dims.g;
      const tip = V.tooltip();

      // persistent layers, drawn back to front
      const gGrid = g.append("g");
      const gCurve = g.append("g");        // fitted line or guide curve
      const gPts = g.append("g");          // data points
      const gLbl = g.append("g");          // country labels (spurious tab)

      const x = d3.scaleLinear();
      const y = d3.scaleLinear();

      function clearLayers() {
        gGrid.selectAll("*").remove();
        gCurve.selectAll("*").remove();
        gPts.selectAll("*").remove();
        gLbl.selectAll("*").remove();
      }

      function paintAxes(xlabel, ylabel) {
        x.range([0, dims.innerW]);
        y.range([dims.innerH, 0]);
        V.axes(gGrid, x, y, dims, { xlabel, ylabel, xticks: 6, yticks: 6 });
      }

      /* ===================================================================
         DEMO 1, Nonlinear: gas mileage, a clean inverted-U with r = 0
         =================================================================== */
      function drawNonlinear() {
        clearLayers();
        const gm = P.exercises.data.gasMileage;
        const xs = gm.speed, ys = gm.mpg;
        const r = S.correlation(xs, ys);

        x.domain([10, 70]); y.domain([20, 33]);
        paintAxes("Speed (mph)", "Gas mileage (mpg)");

        // overlay the obvious inverted-U through the five points: a downward
        // parabola y = 30 - k*(speed - 40)^2 that hits 24 at 20 and 60 mph.
        const k = (30 - 24) / (20 * 20);      // peak 30 at speed 40, =24 at +/-20
        const curveFn = (sp) => 30 - k * (sp - 40) * (sp - 40);
        const line = d3.line().x((d) => x(d)).y((d) => y(curveFn(d)));
        const dense = d3.range(20, 60.01, 1);
        gCurve.append("path")
          .attr("d", line(dense))
          .attr("fill", "none")
          .attr("stroke", V.color("c-violet"))
          .attr("stroke-width", 2.5)
          .attr("stroke-dasharray", "6 4")
          .attr("opacity", 0.8);

        gPts.selectAll("circle").data(xs.map((sp, i) => ({ sp, mpg: ys[i] })))
          .join("circle")
          .attr("cx", (d) => x(d.sp)).attr("cy", (d) => y(d.mpg))
          .attr("r", 8)
          .attr("fill", V.color("c-blue")).attr("fill-opacity", 0.9)
          .attr("stroke", "#fff").attr("stroke-width", 2)
          .style("cursor", "pointer")
          .on("mouseover", (ev, d) => tip.show(`${d.sp} mph &rarr; <b>${d.mpg} mpg</b>`, ev))
          .on("mousemove", (ev) => tip.move(ev))
          .on("mouseout", () => tip.hide());

        setStats(r, xs.length);
        note.className = "callout key";
        note.innerHTML = `<span class="label">A strong relationship, r exactly 0</span>
          Mileage clearly depends on speed: it peaks near 40 mph and falls off either side (the dashed curve).
          But the rising half and the falling half cancel, so ${V.fml.inline("<i>r</i> = 0")}. Correlation
          measures <b>linear</b> association only. The eye sees the pattern; the number cannot.`;
      }

      /* ===================================================================
         DEMO 2, Outlier leverage: tight cloud near r=0, one draggable point
         =================================================================== */
      let outlierPt = null;             // {gx, gy} in graph coords
      function drawOutlier() {
        clearLayers();
        x.domain([0, 100]); y.domain([0, 100]);
        paintAxes("x", "y");

        // a tight, essentially uncorrelated cloud (seeded, reproducible)
        const rand = S.rng(20240517);
        const cloud = [];
        for (let i = 0; i < 18; i++) {
          cloud.push({ gx: S.gaussian(rand, 35, 8), gy: S.gaussian(rand, 50, 8) });
        }
        // the single leverage point starts in the top-right corner
        if (!outlierPt) outlierPt = { gx: 88, gy: 88 };

        function redraw() {
          const all = cloud.concat([outlierPt]);
          const xs = all.map((d) => d.gx), ys = all.map((d) => d.gy);
          const r = S.correlation(xs, ys);
          const reg = S.linreg(xs, ys);

          // OLS line across the visible x-range
          gCurve.selectAll("*").remove();
          const x0 = x.domain()[0], x1 = x.domain()[1];
          gCurve.append("line")
            .attr("x1", x(x0)).attr("y1", y(reg.fitted(x0)))
            .attr("x2", x(x1)).attr("y2", y(reg.fitted(x1)))
            .attr("stroke", V.color("c-violet")).attr("stroke-width", 2).attr("opacity", 0.7);

          // cloud points
          gPts.selectAll("circle.cloud").data(cloud)
            .join("circle").attr("class", "cloud")
            .attr("cx", (d) => x(d.gx)).attr("cy", (d) => y(d.gy))
            .attr("r", 6)
            .attr("fill", V.color("c-slate")).attr("fill-opacity", 0.8)
            .attr("stroke", "#fff").attr("stroke-width", 1.5);

          // the draggable leverage point (one element, redrawn in place)
          gPts.selectAll("circle.lever").data([outlierPt])
            .join("circle").attr("class", "lever")
            .attr("cx", (d) => x(d.gx)).attr("cy", (d) => y(d.gy))
            .attr("r", 11)
            .attr("fill", V.color("gold")).attr("fill-opacity", 0.95)
            .attr("stroke", V.color("cardinal")).attr("stroke-width", 2.5)
            .style("cursor", "grab")
            .call(drag);

          setStats(r, all.length);
          const big = Math.abs(r) > 0.5;
          note.className = big ? "callout warn" : "callout";
          note.innerHTML = `<span class="label">${big ? "One point, almost all the correlation" : "Drag the gold point"}</span>
            The 18 gray points form a near-circular blob with almost no correlation. Drag the single gold point
            (outlined in red) into a corner and r lurches toward &plusmn;1; park it inside the cloud and r collapses to near 0.
            Right now ${V.fml.inline("<i>r</i> = " + S.fmt(r, 2))}. A coefficient one observation can swing is not resistant.`;
        }

        const drag = d3.drag()
          .on("start", function () { d3.select(this).style("cursor", "grabbing"); })
          .on("drag", function (ev) {
            outlierPt.gx = Math.max(0, Math.min(100, x.invert(ev.x)));
            outlierPt.gy = Math.max(0, Math.min(100, y.invert(ev.y)));
            redraw();
          })
          .on("end", function () { d3.select(this).style("cursor", "grab"); });

        redraw();
      }

      /* ===================================================================
         DEMO 3, Spurious: chocolate vs Nobel laureates, wealth lurking
         =================================================================== */
      function drawSpurious() {
        clearLayers();
        // Illustrative values in the spirit of Messerli (2012). x = chocolate
        // (kg/person/yr), y = Nobel laureates per 10 million people.
        const rows = [
          { country: "Switzerland", x: 11.6, y: 32, anchor: "end", dy: -10 },
          { country: "Sweden",      x: 6.4,  y: 32, anchor: "start", dy: -10 },
          { country: "Denmark",     x: 8.5,  y: 25, anchor: "start", dy: -10 },
          { country: "Austria",     x: 8.7,  y: 25, anchor: "start", dy: 16 },
          { country: "Norway",      x: 9.4,  y: 25, anchor: "start", dy: -10 },
          { country: "U.K.",        x: 9.7,  y: 19, anchor: "start", dy: -10 },
          { country: "Germany",     x: 11.5, y: 13, anchor: "end", dy: 16 },
          { country: "U.S.",        x: 5.3,  y: 11, anchor: "start", dy: -10 },
          { country: "France",      x: 6.3,  y: 9,  anchor: "end", dy: 16 },
          { country: "Italy",       x: 3.7,  y: 3,  anchor: "start", dy: -10 },
          { country: "Portugal",    x: 2.0,  y: 2,  anchor: "start", dy: -10 },
          { country: "China",       x: 0.7,  y: 0.5, anchor: "start", dy: -10 },
        ];
        const xs = rows.map((d) => d.x), ys = rows.map((d) => d.y);
        const r = S.correlation(xs, ys);
        const reg = S.linreg(xs, ys);

        x.domain([0, 13]); y.domain([0, 35]);
        paintAxes("Chocolate consumed (kg per person per year)", "Nobel laureates per 10 million people");

        // OLS trend line (upward sloping, illustrating the high r)
        const x0 = 0, x1 = 13;
        gCurve.append("line")
          .attr("x1", x(x0)).attr("y1", y(reg.fitted(x0)))
          .attr("x2", x(x1)).attr("y2", y(reg.fitted(x1)))
          .attr("stroke", V.color("c-violet")).attr("stroke-width", 2).attr("opacity", 0.7);

        gPts.selectAll("circle").data(rows)
          .join("circle")
          .attr("cx", (d) => x(d.x)).attr("cy", (d) => y(d.y))
          .attr("r", 7)
          .attr("fill", V.color("c-green")).attr("fill-opacity", 0.85)
          .attr("stroke", "#fff").attr("stroke-width", 1.5)
          .style("cursor", "pointer")
          .on("mouseover", (ev, d) => tip.show(
            `<b>${d.country}</b><br>${S.fmt(d.x, 1)} kg choc &middot; ${S.fmt(d.y, 1)} laureates / 10M`, ev))
          .on("mousemove", (ev) => tip.move(ev))
          .on("mouseout", () => tip.hide());

        gLbl.selectAll("text").data(rows)
          .join("text")
          .attr("x", (d) => x(d.x) + (d.anchor === "end" ? -10 : 10))
          .attr("y", (d) => y(d.y) + (d.dy || -10))
          .attr("text-anchor", (d) => d.anchor)
          .attr("font-size", 11).attr("font-weight", 600)
          .attr("fill", V.color("ink-600"))
          .text((d) => d.country);

        setStats(r, rows.length);
        note.className = "callout warn";
        note.innerHTML = `<span class="label">High r, but chocolate does not win Nobel Prizes</span>
          These countries line up tightly: ${V.fml.inline("<i>r</i> &asymp; " + S.fmt(r, 2))}. The honest reading is not
          that fudge sharpens the mind. A <b>lurking variable</b>, national wealth, raises both: rich countries can
          afford more chocolate <i>and</i> fund more research universities. Correlation is not causation. The arrow could
          point the other way, or, as here, come from a hidden third mover entirely.`;
      }

      function setStats(r, n) {
        sR.set(S.fmt(r, 3));
        sR2.set(isFinite(r) ? S.fmt(r * r, 3) : "—");
        sN.set(n);
      }

      const drawers = {
        "Nonlinear": drawNonlinear,
        "Outlier leverage": drawOutlier,
        "Spurious": drawSpurious,
      };

      seg.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        seg.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        drawers[b.dataset.tab]();
      });

      drawNonlinear();

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">A study reports a strong positive correlation (r = 0.79) between a country's chocolate
          consumption and its number of Nobel laureates per capita. What is the safest conclusion?</div>
          <button class="opt" data-ok="0">Eating chocolate plausibly causes a country to win more prizes</button>
          <button class="opt" data-ok="1">A third variable, like national wealth, likely drives both, correlation is not causation</button>
          <button class="opt" data-ok="0">The high r means the relationship must be linear and reliable</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ---- the real course exercise ---- */
      P.renderPractice(container, "w4-gas-mileage");
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
        ? "Right. A large r tells you two things move together, not why. Here the lurking variable is national wealth, which raises both chocolate spending and research funding. The link is real but the cause is not chocolate."
        : "Not quite. A big r never proves cause, and it does not even guarantee a straight-line fit. The defensible read is that some lurking variable (national wealth is the usual suspect) moves both at once.";
    }));
  }
})();
