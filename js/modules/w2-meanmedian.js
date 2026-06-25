/* =====================================================================
   w2-meanmedian, Mean vs Median as a balance beam
   The reference module: drag points on a number line, watch the mean
   (balance point, not resistant) chase an outlier while the median
   (the middle value, resistant) barely moves.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w2-meanmedian"] = {
    render(container) {
      P.lessonHeader(container, "w2-meanmedian",
        "The mean is where the data balances. The median is the value in the middle. " +
        "On a symmetric pile they sit together; drag one point out to the edge and only one of them follows.");

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>Two ways to say "the center"</h3>
        <div class="callout"><span class="label">Mean, the balance point</span>
          Add up every value and divide by how many there are. Think of the number line as a
          see-saw: the mean is the spot where it balances.
          ${V.fml.block(`${V.fml.xbar} = ${V.fml.frac("&Sigma; x<sub>i</sub>", "n")}`)}
        </div>
        <div class="callout"><span class="label">Median, the middle value</span>
          Sort the values; the median is the one in the middle (or the average of the two middle
          ones when <i>n</i> is even). Exactly half the data sits on each side.
        </div>
        <div class="callout key"><span class="label">The point of this lab</span>
          The median is <b>resistant</b>: a single extreme value barely moves it. The mean is
          <b>not</b> resistant: one outlier drags it toward the long tail. That is why incomes,
          house prices, and city budgets are usually reported with the median.
        </div>`;
      container.appendChild(concept);

      /* ---- interactive lab ---- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Balance-beam sandbox</h3>
        <p>Drag the dots along the line. Use the buttons to add a point, drop in an outlier, or load a shape.</p>
      </div>`;
      const body = V.el("div.lab-body");
      const plot = V.el("div");
      body.appendChild(plot);

      const stats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const sMean = V.stat("Mean", "—", "bad");      // red, like the mean marker
      const sMed = V.stat("Median", "—", "");
      const sGap = V.stat("Mean − Median", "—", "accent");
      const sN = V.stat("n", "—", "");
      [sN, sMean, sMed, sGap].forEach((s) => stats.appendChild(s));
      sMean.querySelector(".v").style.color = V.color("mean");
      sMed.querySelector(".v").style.color = V.color("median");
      body.appendChild(stats);

      const verdict = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(verdict);
      lab.appendChild(body);

      const controls = V.el("div.lab-controls");
      const row1 = V.el("div.btn-row");
      const bAdd = V.el("button.btn", { text: "+ Add point" });
      const bOut = V.el("button.btn", { text: "+ Add outlier" });
      const bDel = V.el("button.btn.ghost", { text: "− Remove last" });
      const bReset = V.el("button.btn.ghost", { text: "Reset" });
      [bAdd, bOut, bDel, bReset].forEach((b) => row1.appendChild(b));
      const row2 = V.el("div.seg");
      ["Symmetric", "Right-skew", "Left-skew"].forEach((t, i) => {
        const b = V.el("button", { text: t });
        if (i === 0) b.classList.add("active");
        b.dataset.shape = t;
        row2.appendChild(b);
      });
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Shape it" }), row2]));
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Edit points" }), row1]));
      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">A neighborhood's home values are: $310k, $325k, $340k, $355k, and one mansion at $4.2M.
          Which number better describes a "typical" home?</div>
          <button class="opt" data-ok="0">The mean, it uses every value</button>
          <button class="opt" data-ok="1">The median, the mansion barely moves it</button>
          <button class="opt" data-ok="0">They will be about the same here</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ---------- data + presets ---------- */
      const DOMAIN = [0, 100];
      let data = [];
      const presets = {
        "Symmetric": [30, 40, 45, 48, 50, 52, 55, 60, 70],
        "Right-skew": [20, 24, 27, 30, 33, 38, 45, 62, 88],
        "Left-skew": [12, 38, 55, 62, 67, 70, 73, 76, 80],
      };
      function load(shape) { data = presets[shape].slice(); draw(); }

      /* ---------- d3 scaffold ---------- */
      const dims = V.svg(plot, { height: 230, margin: { top: 30, right: 28, bottom: 46, left: 28 } });
      const g = dims.g;
      const x = d3.scaleLinear().domain(DOMAIN).range([0, dims.innerW]);
      const beamY = dims.innerH - 40;

      g.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${beamY})`)
        .call(d3.axisBottom(x).ticks(10));

      // the beam
      g.append("line").attr("class", "beam")
        .attr("x1", 0).attr("x2", dims.innerW).attr("y1", beamY).attr("y2", beamY)
        .attr("stroke", V.color("ink-400")).attr("stroke-width", 2);

      // mean marker (fulcrum + line) and median marker
      const meanLine = g.append("line").attr("y1", 6).attr("y2", beamY)
        .attr("stroke", V.color("mean")).attr("stroke-width", 2).attr("stroke-dasharray", "5 3");
      const fulcrum = g.append("path").attr("fill", V.color("mean"));
      const meanLbl = g.append("text").attr("fill", V.color("mean")).attr("font-size", 12).attr("font-weight", 700).attr("text-anchor", "middle").attr("y", 0).text("mean");
      const medLine = g.append("line").attr("y1", 6).attr("y2", beamY)
        .attr("stroke", V.color("median")).attr("stroke-width", 2);
      const medLbl = g.append("text").attr("fill", V.color("median")).attr("font-size", 12).attr("font-weight", 700).attr("text-anchor", "middle").attr("y", -16).text("median");

      const dotsG = g.append("g");
      const tip = V.tooltip();

      function draw() {
        const m = S.mean(data), med = S.median(data);
        // dots (stack jitter when close)
        const sorted = data.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
        const yOf = {};
        let lastX = -999, level = 0;
        sorted.forEach((d) => {
          const px = x(d.v);
          if (px - lastX < 16) level++; else level = 0;
          yOf[d.i] = beamY - 12 - level * 17;
          lastX = px;
        });
        const sel = dotsG.selectAll("circle.pt").data(data.map((v, i) => ({ v, i })), (d) => d.i);
        sel.exit().remove();
        sel.enter().append("circle").attr("class", "pt")
            .attr("r", 9).attr("fill", V.color("c-blue")).attr("fill-opacity", .85)
            .attr("stroke", "#fff").attr("stroke-width", 1.5).style("cursor", "grab")
            .call(drag)
            .on("mouseover", (ev, d) => tip.show("value = <b>" + S.fmt(d.v, 1) + "</b>", ev))
            .on("mousemove", (ev) => tip.move(ev))
            .on("mouseout", () => tip.hide())
          .merge(sel)
            .attr("cx", (d) => x(d.v)).attr("cy", (d) => yOf[d.i]);

        meanLine.attr("x1", x(m)).attr("x2", x(m));
        meanLbl.attr("x", x(m));
        fulcrum.attr("d", `M${x(m)},${beamY} l-8,14 l16,0 Z`);
        medLine.attr("x1", x(med)).attr("x2", x(med));
        medLbl.attr("x", x(med));

        sMean.set(S.fmt(m, 1)); sMed.set(S.fmt(med, 1));
        sGap.set((m - med >= 0 ? "+" : "") + S.fmt(m - med, 1)); sN.set(data.length);

        const gap = m - med;
        if (Math.abs(gap) < 0.8) {
          verdict.className = "callout key";
          verdict.innerHTML = `<span class="label">Roughly symmetric</span> Mean and median nearly coincide (gap ${S.fmt(gap,1)}). When a distribution is balanced, the two measures agree.`;
        } else if (gap > 0) {
          verdict.className = "callout warn";
          verdict.innerHTML = `<span class="label">Pulled right</span> The mean (${S.fmt(m,1)}) sits <b>above</b> the median (${S.fmt(med,1)}). A high value out in the right tail drags the balance point with it; the median holds.`;
        } else {
          verdict.className = "callout warn";
          verdict.innerHTML = `<span class="label">Pulled left</span> The mean (${S.fmt(m,1)}) sits <b>below</b> the median (${S.fmt(med,1)}). A low value in the left tail pulls the balance point down; the median holds.`;
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

      bAdd.onclick = () => { data.push(40 + Math.random() * 20); draw(); };
      bOut.onclick = () => { data.push(96); draw(); };
      bDel.onclick = () => { if (data.length > 1) { data.pop(); draw(); } };
      bReset.onclick = () => { row2.querySelectorAll("button").forEach((b, i) => b.classList.toggle("active", i === 0)); load("Symmetric"); };
      row2.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        row2.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
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
        ? "Right. One $4.2M home barely nudges the median (still ≈ $340k) but yanks the mean above $1M, no actual home costs anywhere near that."
        : "Not quite. The single mansion pulls the mean above $1M, which describes no real home on the block. The median (≈ $340k) shrugs it off.";
    }));
  }
})();
