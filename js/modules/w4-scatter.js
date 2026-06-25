/* =====================================================================
   w4-scatter, Scatterplots and the correlation coefficient r
   Two hands-on pieces: a "guess the correlation" game on freshly
   generated clouds, and a draggable scatter where r updates live as
   you move, add, or remove points. r is read off S.correlation, the
   same primitive used in the answer keys.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  /* Plain-language label for a value of r: direction plus strength. */
  function rLabel(r) {
    if (!isFinite(r)) return "undefined";
    const a = Math.abs(r);
    const dir = a < 0.05 ? "" : (r > 0 ? "positive" : "negative");
    let strength;
    if (a < 0.05) strength = "no";
    else if (a < 0.30) strength = "weak";
    else if (a < 0.60) strength = "moderate";
    else if (a < 0.85) strength = "strong";
    else strength = "very strong";
    return dir ? strength + " " + dir : "no linear association";
  }

  /* Build n points (x in roughly [10,90], y in roughly [10,90]) whose
     correlation is close to a target. y = target*xz + sqrt(1-target^2)*noise
     in standardized space, then mapped onto the plotting box. */
  function makeCloud(target, n, rand) {
    const xs = [], ys = [];
    const k = Math.sqrt(Math.max(0, 1 - target * target));
    for (let i = 0; i < n; i++) {
      const xz = S.gaussian(rand, 0, 1);
      const ez = S.gaussian(rand, 0, 1);
      const yz = target * xz + k * ez;
      xs.push(50 + xz * 15);
      ys.push(50 + yz * 15);
    }
    // clamp into the [6, 94] box so nothing renders off-axis
    const cl = (v) => Math.max(6, Math.min(94, v));
    return { xs: xs.map(cl), ys: ys.map(cl) };
  }

  P.modules["w4-scatter"] = {
    render(container) {
      P.lessonHeader(container, "w4-scatter",
        "A scatterplot puts two measurements from each individual on the same picture. " +
        "The correlation coefficient r squeezes that picture into one number between -1 and 1: " +
        "which way the cloud tilts, and how tightly it hugs a straight line.");

      /* a y with an overbar, built to match V.fml.xbar's x-bar styling */
      const yBar = '<span style="position:relative"><i>y</i><span style="position:absolute;left:0;right:1px;top:-.55em;border-top:1.4px solid currentColor"></span></span>';

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>One number for a whole cloud</h3>
        <div class="callout"><span class="label">The scatterplot</span>
          Measure two quantitative things on the same people, cities, or years (say income and
          life expectancy). Plot one on each axis, one dot per individual. The shape of the dot
          cloud is the relationship.
        </div>
        <div class="callout"><span class="label">What r measures</span>
          r reports the <b>direction</b> and <b>strength</b> of the straight-line pattern.
          ${V.fml.block(
            "r = " + V.fml.frac("1", "n &minus; 1") +
            " &Sigma; " + V.fml.frac("(x<sub>i</sub> &minus; " + V.fml.xbar + ")", "s<sub>x</sub>") +
            " &middot; " + V.fml.frac("(y<sub>i</sub> &minus; " + yBar + ")", "s<sub>y</sub>"))}
          It is the average product of the two variables after each is written in standard-deviation
          units, which is why r has no units of its own.
        </div>
        <div class="callout"><span class="label">Reading the scale</span>
          r lives in <b>[-1, 1]</b>. r = +1 is a perfect upward line, r = -1 a perfect downward line,
          r = 0 means no straight-line tilt at all. Values in between read as weak, moderate, or
          strong, in the same direction as their sign.
        </div>
        <div class="callout key"><span class="label">Two cautions</span>
          r only sees <b>linear</b> association: a strong curved pattern (mileage that rises then
          falls with speed) can still give r near 0, so always plot first. And r is
          <b>unit-free</b>: recording swim times in seconds instead of minutes, or temperature in
          Celsius instead of Fahrenheit, does not change r at all.
        </div>`;
      container.appendChild(concept);

      /* ================================================================
         LAB 1: Guess the correlation
         ================================================================ */
      const game = V.el("div.card.lab");
      game.innerHTML = `<div class="lab-head">
        <h3>Guess the correlation</h3>
        <p>A cloud is drawn to a hidden target. Read its tilt and tightness, set your guess, then reveal the true r computed from the points.</p>
      </div>`;
      const gBody = V.el("div.lab-body");
      const gPlot = V.el("div");
      gBody.appendChild(gPlot);

      const gStats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const gGuess = V.stat("Your guess", "0.00", "accent");
      const gTrue = V.stat("True r", "—", "");
      const gErr = V.stat("Off by", "—", "");
      const gScore = V.stat("Rounds", "0", "");
      [gGuess, gTrue, gErr, gScore].forEach((s) => gStats.appendChild(s));
      gBody.appendChild(gStats);

      const gVerdict = V.el("div.callout", { style: { marginTop: "12px" } });
      gVerdict.innerHTML = `<span class="label">How to read it</span> A cloud sloping up and to the right is positive; down and to the right is negative. The tighter the dots cluster around a single line, the closer |r| gets to 1.`;
      gBody.appendChild(gVerdict);
      game.appendChild(gBody);

      const gControls = V.el("div.lab-controls");
      const guessSlider = V.slider({
        label: "Your guess for r", min: -1, max: 1, step: 0.01, value: 0,
        format: (v) => (v >= 0 ? "+" : "") + S.fmt(v, 2),
        on: () => { gGuess.set((guessSlider.value >= 0 ? "+" : "") + S.fmt(guessSlider.value, 2)); },
      });
      guessSlider.wrap.style.minWidth = "260px";
      gControls.appendChild(guessSlider.wrap);
      const gBtnRow = V.el("div.btn-row");
      const bReveal = V.el("button.btn.primary", { text: "Reveal true r" });
      const bNew = V.el("button.btn", { text: "New cloud" });
      gBtnRow.appendChild(bReveal); gBtnRow.appendChild(bNew);
      gControls.appendChild(V.el("div.control", null, [V.el("label", { text: "Check yourself" }), gBtnRow]));
      game.appendChild(gControls);
      container.appendChild(game);

      /* game state + scaffold */
      let gSeed = 4071;          // changes each "New cloud" for reproducible variety
      let gCloud = null;
      let gTrueR = NaN;
      let gRevealed = false;
      let gRounds = 0;

      const gd = V.svg(gPlot, { height: 300, margin: { top: 16, right: 18, bottom: 42, left: 46 } });
      const gx = d3.scaleLinear().domain([0, 100]).range([0, gd.innerW]);
      const gy = d3.scaleLinear().domain([0, 100]).range([gd.innerH, 0]);
      V.axes(gd.g, gx, gy, gd, { grid: true, xticks: 6, yticks: 6, xlabel: "variable x", ylabel: "variable y" });
      const gDots = gd.g.append("g");
      const gTip = V.tooltip();

      function drawGame() {
        const pts = gCloud.xs.map((x, i) => ({ x, y: gCloud.ys[i] }));
        const sel = gDots.selectAll("circle").data(pts);
        sel.join(
          (enter) => enter.append("circle")
            .attr("r", 5).attr("fill", V.color("c-blue")).attr("fill-opacity", 0.8)
            .attr("stroke", "#fff").attr("stroke-width", 1)
            .on("mouseover", (ev, d) => gTip.show("(" + S.fmt(d.x, 1) + ", " + S.fmt(d.y, 1) + ")", ev))
            .on("mousemove", (ev) => gTip.move(ev))
            .on("mouseout", () => gTip.hide()),
          (update) => update,
        ).attr("cx", (d) => gx(d.x)).attr("cy", (d) => gy(d.y));
      }

      function newCloud() {
        gSeed = (gSeed * 1103515245 + 12345) & 0x7fffffff;
        const rand = S.rng(gSeed);
        // pick a target r anywhere in [-0.97, 0.97], avoiding the dead-flat middle slightly
        const target = (rand() * 1.94) - 0.97;
        const n = 26;
        gCloud = makeCloud(target, n, rand);
        gTrueR = S.correlation(gCloud.xs, gCloud.ys);
        gRevealed = false;
        drawGame();
        gTrue.set("?");
        gErr.set("—");
        gErr.classList.remove("good", "bad");
        bReveal.disabled = false;
        gVerdict.className = "callout";
        gVerdict.innerHTML = `<span class="label">How to read it</span> Slope tells you the sign; tightness tells you the size. Set the slider, then reveal.`;
      }

      bNew.onclick = newCloud;
      bReveal.onclick = () => {
        if (gRevealed) return;
        gRevealed = true;
        gRounds++;
        gScore.set(gRounds);
        const guess = guessSlider.value;
        const err = Math.abs(guess - gTrueR);
        gTrue.set((gTrueR >= 0 ? "+" : "") + S.fmt(gTrueR, 2));
        gErr.set(S.fmt(err, 2));
        gErr.classList.toggle("good", err <= 0.15);
        gErr.classList.toggle("bad", err > 0.30);
        bReveal.disabled = true;
        const verdict = err <= 0.10 ? "Excellent read."
          : err <= 0.20 ? "Close. Your eye is calibrated."
          : err <= 0.35 ? "In the right neighborhood."
          : "Off this time, the cloud fooled you.";
        gVerdict.className = "callout " + (err <= 0.20 ? "key" : "warn");
        gVerdict.innerHTML = `<span class="label">${verdict}</span> This cloud is <b>${rLabel(gTrueR)}</b> (r = ${(gTrueR >= 0 ? "+" : "") + S.fmt(gTrueR, 2)}). You guessed ${(guess >= 0 ? "+" : "") + S.fmt(guess, 2)}, off by ${S.fmt(err, 2)}. Hit "New cloud" to try another.`;
      };

      newCloud();

      /* ================================================================
         LAB 2: Drag the points, watch r move
         ================================================================ */
      const drag = V.el("div.card.lab");
      drag.innerHTML = `<div class="lab-head">
        <h3>Drag the cloud, watch r</h3>
        <p>Move any dot and r recomputes live. Drag points onto one rising line to push r toward +1, scatter them to pull r toward 0, or flip the tilt for a negative r.</p>
      </div>`;
      const dBody = V.el("div.lab-body");
      const dPlot = V.el("div");
      dBody.appendChild(dPlot);

      const dStats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const dN = V.stat("n", "—", "");
      const dR = V.stat("r", "—", "accent");
      const dLabel = V.stat("Reads as", "—", "");
      [dN, dR, dLabel].forEach((s) => dStats.appendChild(s));
      dBody.appendChild(dStats);
      dR.querySelector(".v").style.color = V.color("c-violet");

      const dLegend = V.el("div.legend", { style: { marginTop: "10px" } });
      dLegend.innerHTML =
        `<span class="swatch"><i style="background:${V.color("c-violet")}"></i> data point (drag me)</span>` +
        `<span class="swatch"><i style="background:${V.color("ink-400")}"></i> mean of x and mean of y</span>`;
      dBody.appendChild(dLegend);

      const dVerdict = V.el("div.callout", { style: { marginTop: "12px" } });
      dBody.appendChild(dVerdict);
      drag.appendChild(dBody);

      const dControls = V.el("div.lab-controls");
      const dBtnRow = V.el("div.btn-row");
      const bAdd = V.el("button.btn", { text: "+ Add point" });
      const bDel = V.el("button.btn.ghost", { text: "− Remove last" });
      const bReset = V.el("button.btn.ghost", { text: "Reset cloud" });
      [bAdd, bDel, bReset].forEach((b) => dBtnRow.appendChild(b));
      dControls.appendChild(V.el("div.control", null, [V.el("label", { text: "Edit points" }), dBtnRow]));
      const dSeg = V.el("div.seg");
      ["Tight up", "Loose", "Tight down"].forEach((t, i) => {
        const b = V.el("button", { text: t });
        if (i === 0) b.classList.add("active");
        b.dataset.shape = t;
        dSeg.appendChild(b);
      });
      dControls.appendChild(V.el("div.control", null, [V.el("label", { text: "Load a shape" }), dSeg]));
      drag.appendChild(dControls);
      container.appendChild(drag);

      /* draggable data + scaffold */
      const dShapes = {
        "Tight up": 0.92,
        "Loose": 0.15,
        "Tight down": -0.92,
      };
      let dData = [];
      function loadShape(name) {
        const rand = S.rng(name === "Loose" ? 909 : name === "Tight up" ? 313 : 717);
        const c = makeCloud(dShapes[name], 12, rand);
        dData = c.xs.map((x, i) => ({ x, y: c.ys[i] }));
        drawDrag();
      }

      const dd = V.svg(dPlot, { height: 320, margin: { top: 16, right: 18, bottom: 42, left: 46 } });
      const dxScale = d3.scaleLinear().domain([0, 100]).range([0, dd.innerW]);
      const dyScale = d3.scaleLinear().domain([0, 100]).range([dd.innerH, 0]);
      V.axes(dd.g, dxScale, dyScale, dd, { grid: true, xticks: 6, yticks: 6, xlabel: "variable x", ylabel: "variable y" });

      // faint mean reference lines (drawn under the dots)
      const meanXLine = dd.g.append("line")
        .attr("stroke", V.color("ink-400")).attr("stroke-width", 1).attr("stroke-dasharray", "4 4").attr("y1", 0).attr("y2", dd.innerH);
      const meanYLine = dd.g.append("line")
        .attr("stroke", V.color("ink-400")).attr("stroke-width", 1).attr("stroke-dasharray", "4 4").attr("x1", 0).attr("x2", dd.innerW);
      const dDots = dd.g.append("g");
      const dTip = V.tooltip();

      const dragBehavior = d3.drag()
        .on("start", function () { d3.select(this).attr("stroke", V.color("cardinal")).style("cursor", "grabbing"); })
        .on("drag", function (ev, d) {
          d.x = Math.max(2, Math.min(98, dxScale.invert(ev.x)));
          d.y = Math.max(2, Math.min(98, dyScale.invert(ev.y)));
          drawDrag();
        })
        .on("end", function () { d3.select(this).attr("stroke", "#fff").style("cursor", "grab"); });

      function drawDrag() {
        const xs = dData.map((p) => p.x), ys = dData.map((p) => p.y);
        const mx = S.mean(xs), my = S.mean(ys);
        const r = dData.length >= 2 ? S.correlation(xs, ys) : NaN;

        meanXLine.attr("x1", dxScale(mx)).attr("x2", dxScale(mx)).attr("opacity", isFinite(mx) ? 0.9 : 0);
        meanYLine.attr("y1", dyScale(my)).attr("y2", dyScale(my)).attr("opacity", isFinite(my) ? 0.9 : 0);

        const sel = dDots.selectAll("circle").data(dData);
        sel.join(
          (enter) => enter.append("circle")
            .attr("r", 8).attr("fill", V.color("c-violet")).attr("fill-opacity", 0.82)
            .attr("stroke", "#fff").attr("stroke-width", 1.5).style("cursor", "grab")
            .call(dragBehavior)
            .on("mouseover", (ev, d) => dTip.show("(" + S.fmt(d.x, 1) + ", " + S.fmt(d.y, 1) + ")", ev))
            .on("mousemove", (ev) => dTip.move(ev))
            .on("mouseout", () => dTip.hide()),
          (update) => update,
        ).attr("cx", (d) => dxScale(d.x)).attr("cy", (d) => dyScale(d.y));

        dN.set(dData.length);
        dR.set(isFinite(r) ? (r >= 0 ? "+" : "") + S.fmt(r, 2) : "—");
        dLabel.set(rLabel(r));

        if (!isFinite(r)) {
          dVerdict.className = "callout";
          dVerdict.innerHTML = `<span class="label">Need at least two points</span> r is only defined once there are two or more individuals to compare.`;
        } else {
          const a = Math.abs(r);
          dVerdict.className = "callout " + (a >= 0.6 ? "key" : a < 0.2 ? "warn" : "");
          dVerdict.innerHTML = `<span class="label">${rLabel(r)}</span> r = <b>${(r >= 0 ? "+" : "") + S.fmt(r, 2)}</b>. ` +
            (a >= 0.85 ? "The dots sit almost on a single straight line."
              : a >= 0.6 ? "A clear straight-line tilt, with some scatter around it."
              : a >= 0.2 ? "A faint tilt you could easily mistake for noise."
              : "No straight-line tilt worth speaking of. Knowing x tells you almost nothing about y.");
        }
      }

      bAdd.onclick = () => {
        // drop a new point near the current center so it is easy to find and drag
        const mx = dData.length ? S.mean(dData.map((p) => p.x)) : 50;
        const my = dData.length ? S.mean(dData.map((p) => p.y)) : 50;
        dData.push({ x: Math.max(8, Math.min(92, mx + 6)), y: Math.max(8, Math.min(92, my - 6)) });
        drawDrag();
      };
      bDel.onclick = () => { if (dData.length > 2) { dData.pop(); drawDrag(); } };
      bReset.onclick = () => {
        dSeg.querySelectorAll("button").forEach((b, i) => b.classList.toggle("active", i === 0));
        loadShape("Tight up");
      };
      dSeg.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        dSeg.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active"); loadShape(b.dataset.shape);
      });

      loadShape("Tight up");

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">A study finds r = -0.86 between a city's poverty rate and its average reading score. Which statement is right?</div>
          <button class="opt" data-ok="0">Higher poverty causes lower scores; r proves it</button>
          <button class="opt" data-ok="1">There is a strong negative linear association: higher poverty tends to go with lower scores</button>
          <button class="opt" data-ok="0">The relationship is weak because r is negative</button>
          <button class="opt" data-ok="0">r would shrink if scores were rescaled from 0–100 to 0–1</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ---- the real course exercise ---- */
      P.renderPractice(container, "w4-corr-swim");
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
        ? "Right. r = -0.86 is a strong negative linear association, no more and no less. It is a description of the pattern, not evidence of cause, and because r is unit-free, rescaling the scores leaves it unchanged."
        : "Not quite. A magnitude of 0.86 is strong, the minus sign just sets the direction. r describes association, not causation, and it never changes when you rescale a variable.";
    }));
  }
})();
