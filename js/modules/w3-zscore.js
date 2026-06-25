/* =====================================================================
   w3-zscore, Standardizing values into z-scores
   A two-curve "z-score machine": slide mu and sigma, drag a value x on
   N(mu, sigma), and watch the matching z land on the standard Normal
   N(0,1). The left tail shades to show the percentile. A compare panel
   reproduces the WAIS idea: who scored higher relative to her own group
   vs higher in raw points.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w3-zscore"] = {
    render(container) {
      P.lessonHeader(container, "w3-zscore",
        "A z-score rewrites any value as the number of standard deviations it sits from its own mean. " +
        "Once every value speaks that one language, scores from different tests land on the same ruler.");

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>One ruler for every distribution</h3>
        <div class="callout"><span class="label">The standard score</span>
          Subtract the mean, then divide by the standard deviation. The result, z, counts how many
          standard deviations the value sits above (positive) or below (negative) the mean.
          ${V.fml.block(`z = ${V.fml.frac("x &minus; &mu;", "&sigma;")}`)}
          A grade of 3.79 in a class with mean 2.83 and standard deviation 0.96 becomes
          z = (3.79 &minus; 2.83) / 0.96 = 1.0, exactly one standard deviation above average.
        </div>
        <div class="callout"><span class="label">It produces the standard Normal</span>
          If a value is drawn from a Normal distribution N(&mu;, &sigma;), standardizing every value
          gives N(0, 1): mean 0, standard deviation 1. That single curve has known tail areas, so a
          z-score converts straight into a percentile (the share of the distribution that falls below it).
        </div>
        <div class="callout key"><span class="label">Why this matters</span>
          A 1400 SAT and a 32 ACT cannot be compared as raw numbers: different scales, different spreads.
          Turn each into a z-score and you can ask which one ranks higher <b>within its own pool</b>.
          That is a different question from which raw number is bigger, and the two answers can disagree.
        </div>`;
      container.appendChild(concept);

      /* ================================================================
         INTERACTIVE 1: the z-score machine (two stacked curves)
         ================================================================ */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>The z-score machine</h3>
        <p>Drag the marker on the top curve, or slide the mean and standard deviation. The bottom curve
        is the standard Normal: the same value lands at z, and the shaded area is its percentile.</p>
      </div>`;
      const body = V.el("div.lab-body");
      const plot = V.el("div");
      body.appendChild(plot);

      const stats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const sX = V.stat("Value x", "—", "");
      const sZ = V.stat("z-score", "—", "accent");
      const sPct = V.stat("Percentile", "—", "good");
      [sX, sZ, sPct].forEach((s) => stats.appendChild(s));
      sX.querySelector(".v").style.color = V.color("c-blue");
      body.appendChild(stats);

      const work = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(work);
      lab.appendChild(body);

      const controls = V.el("div.lab-controls");
      let mu = 100, sigma = 15, xVal = 115;
      const sMu = V.slider({
        label: "Mean (mu)", min: 40, max: 160, step: 1, value: mu,
        format: (v) => S.fmt(v, 0),
        on: (v) => { mu = v; clampX(); draw(); },
      });
      const sSig = V.slider({
        label: "Std dev (sigma)", min: 4, max: 40, step: 1, value: sigma,
        format: (v) => S.fmt(v, 0),
        on: (v) => { sigma = v; clampX(); draw(); },
      });
      controls.appendChild(sMu.wrap);
      controls.appendChild(sSig.wrap);
      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---- d3 scaffold: two panels sharing one SVG ---- */
      const dims = V.svg(plot, { height: 380, margin: { top: 16, right: 24, bottom: 36, left: 24 } });
      const g = dims.g;
      const W = dims.innerW, H = dims.innerH;
      const gap = 34;
      const panelH = (H - gap) / 2;
      const topY = 0, botY = panelH + gap;

      /* fixed visual window of +/- 4 sd around the mean for the top curve;
         the bottom curve always shows the standard Normal on [-4, 4]. */
      const gTop = g.append("g").attr("transform", `translate(0,${topY})`);
      const gBot = g.append("g").attr("transform", `translate(0,${botY})`);

      const xTop = d3.scaleLinear().range([0, W]);
      const xBot = d3.scaleLinear().domain([-4, 4]).range([0, W]);
      const yTop = d3.scaleLinear().range([panelH, 6]);
      const yBot = d3.scaleLinear().domain([0, S.normalPDF(0, 0, 1) * 1.08]).range([panelH, 6]);

      const area = (xs, ys) => d3.area().x((d) => xs(d.x)).y0(panelH).y1((d) => ys(d.y));
      const line = (xs, ys) => d3.line().x((d) => xs(d.x)).y((d) => ys(d.y));

      /* axes (drawn once, top axis ticks update with the scale) */
      const topAxisG = gTop.append("g").attr("class", "axis").attr("transform", `translate(0,${panelH})`);
      gBot.append("g").attr("class", "axis").attr("transform", `translate(0,${panelH})`)
        .call(d3.axisBottom(xBot).ticks(9).tickFormat((d) => (d > 0 ? "+" : "") + d));

      /* panel titles */
      gTop.append("text").attr("x", 0).attr("y", -2).attr("font-size", 12).attr("font-weight", 700)
        .attr("fill", V.color("c-blue")).text("Your distribution  N(μ, σ)");
      gBot.append("text").attr("x", 0).attr("y", -2).attr("font-size", 12).attr("font-weight", 700)
        .attr("fill", V.color("cardinal")).text("Standard Normal  N(0, 1),  units = z");

      /* top panel shapes */
      const topCurveFill = gTop.append("path").attr("fill", V.color("c-blue")).attr("fill-opacity", 0.08);
      const topCurve = gTop.append("path").attr("fill", "none").attr("stroke", V.color("c-blue")).attr("stroke-width", 2.2);
      const xMark = gTop.append("line").attr("stroke", V.color("c-blue")).attr("stroke-width", 2.5);
      const xHandle = gTop.append("circle").attr("r", 9).attr("fill", V.color("c-blue"))
        .attr("stroke", "#fff").attr("stroke-width", 2).style("cursor", "ew-resize");
      const xLbl = gTop.append("text").attr("font-size", 12).attr("font-weight", 700)
        .attr("fill", V.color("c-blue")).attr("text-anchor", "middle");
      const muTick = gTop.append("line").attr("stroke", V.color("ink-400")).attr("stroke-width", 1).attr("stroke-dasharray", "3 3");

      /* bottom panel shapes */
      const botTailFill = gBot.append("path").attr("fill", V.color("cardinal")).attr("fill-opacity", 0.16);
      const botCurve = gBot.append("path").attr("fill", "none").attr("stroke", V.color("cardinal")).attr("stroke-width", 2.2);
      const zMark = gBot.append("line").attr("stroke", V.color("cardinal")).attr("stroke-width", 2.5);
      const zLbl = gBot.append("text").attr("font-size", 12).attr("font-weight", 700)
        .attr("fill", V.color("cardinal")).attr("text-anchor", "middle");
      const zeroTick = gBot.append("line").attr("stroke", V.color("ink-400")).attr("stroke-width", 1).attr("stroke-dasharray", "3 3");

      /* connector hint between the two panels */
      const connector = g.append("line").attr("stroke", V.color("ink-300")).attr("stroke-width", 1.4).attr("stroke-dasharray", "4 4");

      const tip = V.tooltip();

      function clampX() {
        const lo = mu - 4 * sigma, hi = mu + 4 * sigma;
        xVal = Math.max(lo, Math.min(hi, xVal));
      }

      function normalPath(mu0, sigma0, xs, ys) {
        const lo = xs.domain()[0], hi = xs.domain()[1];
        const pts = [];
        const steps = 120;
        for (let i = 0; i <= steps; i++) {
          const xx = lo + (hi - lo) * (i / steps);
          pts.push({ x: xx, y: S.normalPDF(xx, mu0, sigma0) });
        }
        return pts;
      }

      function tailPath(zCut) {
        const pts = [];
        const steps = 90;
        const lo = -4, hi = Math.min(zCut, 4);
        if (hi <= lo) return [{ x: lo, y: 0 }];
        for (let i = 0; i <= steps; i++) {
          const xx = lo + (hi - lo) * (i / steps);
          pts.push({ x: xx, y: S.normalPDF(xx, 0, 1) });
        }
        return pts;
      }

      function draw() {
        /* top scale tracks mu and sigma so the curve always fills the panel */
        xTop.domain([mu - 4 * sigma, mu + 4 * sigma]);
        yTop.domain([0, S.normalPDF(mu, mu, sigma) * 1.08]);
        topAxisG.call(d3.axisBottom(xTop).ticks(7));

        const topPts = normalPath(mu, sigma, xTop, yTop);
        topCurve.attr("d", line(xTop, yTop)(topPts));
        topCurveFill.attr("d", area(xTop, yTop)(topPts));

        const botPts = normalPath(0, 1, xBot, yBot);
        botCurve.attr("d", line(xBot, yBot)(botPts));

        const z = S.standardize(xVal, mu, sigma);
        const pct = S.normalCDF(z, 0, 1) * 100;

        /* top marker at x */
        const px = xTop(xVal), pyTop = yTop(S.normalPDF(xVal, mu, sigma));
        xMark.attr("x1", px).attr("x2", px).attr("y1", panelH).attr("y2", pyTop);
        xHandle.attr("cx", px).attr("cy", pyTop);
        xLbl.attr("x", px).attr("y", Math.max(pyTop - 14, 12)).text("x = " + S.fmt(xVal, 1));
        const muPx = xTop(mu);
        muTick.attr("x1", muPx).attr("x2", muPx).attr("y1", panelH).attr("y2", yTop(S.normalPDF(mu, mu, sigma)));

        /* bottom marker + shaded left tail (the percentile) */
        const zClamped = Math.max(-4, Math.min(4, z));
        const pz = xBot(zClamped), pyBot = yBot(S.normalPDF(zClamped, 0, 1));
        const tail = tailPath(z);
        botTailFill.attr("d", area(xBot, yBot)(tail));
        zMark.attr("x1", pz).attr("x2", pz).attr("y1", panelH).attr("y2", pyBot);
        zLbl.attr("x", pz).attr("y", Math.max(pyBot - 14, 12)).text("z = " + S.fmt(z, 2));
        zeroTick.attr("x1", xBot(0)).attr("x2", xBot(0)).attr("y1", panelH).attr("y2", yBot(S.normalPDF(0, 0, 1)));

        /* connector from x (top) down to z (bottom) */
        connector.attr("x1", px).attr("y1", topY + panelH)
          .attr("x2", pz).attr("y2", botY + panelH);

        /* readouts */
        sX.set(S.fmt(xVal, 1));
        sZ.set((z >= 0 ? "+" : "") + S.fmt(z, 2));
        sPct.set(S.fmt(pct, 1) + "%");

        const sign = z >= 0 ? "above" : "below";
        const pctTxt = S.fmt(pct, 0);
        work.className = "callout key";
        work.innerHTML =
          `<span class="label">The arithmetic</span>` +
          `z = (x &minus; &mu;) / &sigma; = (${S.fmt(xVal, 1)} &minus; ${S.fmt(mu, 0)}) / ${S.fmt(sigma, 0)} = ` +
          `<b>${(z >= 0 ? "+" : "") + S.fmt(z, 2)}</b>. ` +
          `The value sits <b>${S.fmt(Math.abs(z), 2)}</b> standard deviation${Math.abs(z) === 1 ? "" : "s"} ${sign} the mean, ` +
          `and about <b>${pctTxt}%</b> of the distribution falls below it (the shaded tail).`;
      }

      /* drag the top handle horizontally to change x */
      const drag = d3.drag()
        .on("start", function () { d3.select(this).attr("r", 10.5); })
        .on("drag", function (ev) {
          let v = xTop.invert(ev.x);
          v = Math.max(xTop.domain()[0], Math.min(xTop.domain()[1], v));
          xVal = v; draw();
        })
        .on("end", function () { d3.select(this).attr("r", 9); });
      xHandle.call(drag);
      xHandle
        .on("mouseover", (ev) => tip.show("Drag me along the curve", ev))
        .on("mousemove", (ev) => tip.move(ev))
        .on("mouseout", () => tip.hide());

      draw();

      /* ================================================================
         INTERACTIVE 2: compare two values (the WAIS idea)
         ================================================================ */
      const cmp = V.el("div.card.lab");
      cmp.innerHTML = `<div class="lab-head">
        <h3>Compare two values on the same ruler</h3>
        <p>Person A is scored against one distribution, Person B against another. Raw points cannot
        settle who did better. Standard scores can: each z says how the person ranks within her own group.</p>
      </div>`;
      const cbody = V.el("div.lab-body");

      /* preset reproduces the textbook WAIS example */
      const A = { name: "Sarah (age 30)", mu: 110, sigma: 25, x: 135 };
      const B = { name: "Her mother (age 60)", mu: 90, sigma: 25, x: 120 };

      const cmpStats = V.el("div.stat-row");
      const sAz = V.stat("A: z-score", "—", "accent");
      const sBz = V.stat("B: z-score", "—", "accent");
      [sAz, sBz].forEach((s) => cmpStats.appendChild(s));
      cbody.appendChild(cmpStats);

      const cmpPlot = V.el("div", { style: { marginTop: "8px" } });
      cbody.appendChild(cmpPlot);

      const verdict = V.el("div.callout.key", { style: { marginTop: "12px" } });
      cbody.appendChild(verdict);
      cmp.appendChild(cbody);

      /* controls: x for A and x for B (means/sds fixed to the example) */
      const cmpControls = V.el("div.lab-controls");
      const sAx = V.slider({
        label: "A raw score (N(110, 25))", min: 40, max: 180, step: 1, value: A.x,
        format: (v) => S.fmt(v, 0), on: (v) => { A.x = v; drawCmp(); },
      });
      const sBx = V.slider({
        label: "B raw score (N(90, 25))", min: 40, max: 180, step: 1, value: B.x,
        format: (v) => S.fmt(v, 0), on: (v) => { B.x = v; drawCmp(); },
      });
      cmpControls.appendChild(sAx.wrap);
      cmpControls.appendChild(sBx.wrap);
      const resetRow = V.el("div.control", null, [
        V.el("label", { text: "Reset" }),
        V.el("button.btn.ghost", {
          text: "Back to WAIS example",
          onclick: () => { A.x = 135; B.x = 120; sAx.value = 135; sBx.value = 120; drawCmp(); },
        }),
      ]);
      cmpControls.appendChild(resetRow);
      cmp.appendChild(cmpControls);
      container.appendChild(cmp);

      /* two-row mini chart: one number line per person, marker at the z */
      const cdims = V.svg(cmpPlot, { height: 200, margin: { top: 18, right: 30, bottom: 28, left: 110 } });
      const cg = cdims.g;
      const cW = cdims.innerW, cH = cdims.innerH;
      const zScale = d3.scaleLinear().domain([-3, 3]).range([0, cW]);
      const rowY = [cH * 0.30, cH * 0.72];
      const rowColor = [V.color("c-blue"), V.color("c-violet")];

      /* shared z-axis at the bottom */
      cg.append("g").attr("class", "axis").attr("transform", `translate(0,${cH + 4})`)
        .call(d3.axisBottom(zScale).ticks(7).tickFormat((d) => (d > 0 ? "+" : "") + d));
      cg.append("text").attr("x", cW / 2).attr("y", cH + 26).attr("text-anchor", "middle")
        .attr("font-size", 11.5).attr("font-weight", 600).attr("fill", V.color("ink-600"))
        .text("standard score z (standard deviations from each group's own mean)");
      /* z = 0 reference */
      cg.append("line").attr("x1", zScale(0)).attr("x2", zScale(0)).attr("y1", -6).attr("y2", cH)
        .attr("stroke", V.color("ink-300")).attr("stroke-width", 1).attr("stroke-dasharray", "3 3");
      cg.append("text").attr("x", zScale(0)).attr("y", -10).attr("text-anchor", "middle")
        .attr("font-size", 10.5).attr("fill", V.color("ink-400")).text("group mean");

      const rows = rowY.map((y, i) => {
        const grp = cg.append("g");
        grp.append("line").attr("x1", 0).attr("x2", cW).attr("y1", y).attr("y2", y)
          .attr("stroke", V.color("ink-200")).attr("stroke-width", 2);
        const name = grp.append("text").attr("x", -12).attr("y", y - 4).attr("text-anchor", "end")
          .attr("font-size", 12).attr("font-weight", 700).attr("fill", rowColor[i]);
        const sub = grp.append("text").attr("x", -12).attr("y", y + 11).attr("text-anchor", "end")
          .attr("font-size", 10.5).attr("fill", V.color("ink-500"));
        const dot = grp.append("circle").attr("r", 8).attr("cy", y).attr("fill", rowColor[i])
          .attr("stroke", "#fff").attr("stroke-width", 2);
        const conn = grp.append("line").attr("y1", y).attr("y2", y).attr("stroke", rowColor[i]).attr("stroke-width", 2);
        const lbl = grp.append("text").attr("y", y - 14).attr("text-anchor", "middle")
          .attr("font-size", 11.5).attr("font-weight", 700).attr("fill", rowColor[i]);
        return { name, sub, dot, conn, lbl };
      });

      function drawCmp() {
        const za = S.standardize(A.x, A.mu, A.sigma);
        const zb = S.standardize(B.x, B.mu, B.sigma);
        const persons = [{ p: A, z: za }, { p: B, z: zb }];
        persons.forEach((d, i) => {
          const r = rows[i];
          const zc = Math.max(-3, Math.min(3, d.z));
          const px = zScale(zc);
          r.name.text(d.p.name);
          r.sub.text(`raw ${S.fmt(d.p.x, 0)} of N(${d.p.mu}, ${d.p.sigma})`);
          r.dot.attr("cx", px);
          r.conn.attr("x1", zScale(0)).attr("x2", px);
          r.lbl.attr("x", px).text("z = " + (d.z >= 0 ? "+" : "") + S.fmt(d.z, 2));
        });
        sAz.set((za >= 0 ? "+" : "") + S.fmt(za, 2));
        sBz.set((zb >= 0 ? "+" : "") + S.fmt(zb, 2));

        const relHigher = za > zb ? A : (zb > za ? B : null);
        const absHigher = A.x > B.x ? A : (B.x > A.x ? B : null);
        let msg;
        if (!relHigher && !absHigher) {
          msg = "Both people have identical raw scores and identical standard scores. Nothing separates them.";
        } else {
          const relName = relHigher ? relHigher.name.replace(/ \(.*\)/, "") : "Neither";
          const absName = absHigher ? absHigher.name.replace(/ \(.*\)/, "") : "Neither";
          const relTxt = relHigher
            ? `<b>${relName}</b> ranks higher <b>relative to her own group</b> (the larger z-score)`
            : `the two are <b>tied relative to their groups</b> (equal z-scores)`;
          const absTxt = absHigher
            ? `<b>${absName}</b> has the higher <b>raw score</b>`
            : `the two are <b>tied on raw points</b>`;
          const same = relHigher && absHigher && relHigher === absHigher;
          msg = `${relTxt}, while ${absTxt}.` +
            (same
              ? " Here the two questions give the same answer."
              : " The two questions give different answers: a higher raw number is not the same as a higher standing within the group.");
        }
        verdict.innerHTML = `<span class="label">Relative vs absolute</span>${msg}`;
      }

      drawCmp();

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">On a midterm with mean 70 and standard deviation 8, Dana scores 78.
          On a final with mean 55 and standard deviation 20, Dana scores 79. On which exam did Dana
          rank higher relative to the class?</div>
          <button class="opt" data-ok="0">The midterm, because 78 is the higher raw score</button>
          <button class="opt" data-ok="1">The final: its z-score is +1.2, higher than the midterm's +1.0</button>
          <button class="opt" data-ok="0">Neither, the two scores are basically the same</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ---- the real course exercise ---- */
      P.renderPractice(container, "w3-zscore");
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
        ? "Right. Midterm z = (78 − 70)/8 = +1.0; final z = (79 − 55)/20 = +1.2. The higher z-score wins on relative standing, so Dana ranked higher on the final even though the raw scores (78 vs 79) are almost identical."
        : "Compare z-scores, not raw points. Midterm z = (78 − 70)/8 = +1.0; final z = (79 − 55)/20 = +1.2. The final's larger z is the better standing within its class.";
    }));
  }
})();
