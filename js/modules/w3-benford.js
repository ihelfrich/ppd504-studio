/* =====================================================================
   w3-benford, Probability rules through Benford's first-digit law
   A probability model is a sample space plus an honest assignment of
   probabilities. Benford's law gives leading digit d the probability
   log10(1 + 1/d). Click digits to build an event and watch P add up;
   edit a tiny table to feel what makes a model legal; compare a
   simulated dataset's first digits against the law.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  /* Benford probability for leading digit d (1..9). */
  function benford(d) { return Math.log10(1 + 1 / d); }
  const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const BPROB = DIGITS.map(benford);   // 0.301, 0.176, ... 0.046

  P.modules["w3-benford"] = {
    render(container) {
      P.lessonHeader(container, "w3-benford",
        "A probability model needs a list of possible outcomes and a number for each one. " +
        "Two rules keep it honest: every number sits between 0 and 1, and they all add to 1. " +
        "Benford's law for leading digits is a real model that passes both tests.");

      /* ---------- concept card ---------- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>What makes a probability model legal</h3>
        <div class="callout"><span class="label">The setup</span>
          A model lists every outcome that could happen (the <b>sample space</b> <i>S</i>) and gives
          each one a probability. An <b>event</b> is any group of outcomes, for example "the first
          digit is 1, 2, or 3."
        </div>
        <div class="callout"><span class="label">Rule 1 and Rule 2</span>
          Every probability is between 0 and 1, and the probabilities of all the outcomes add up to
          exactly 1.
          ${V.fml.block(`0 &le; P(A) &le; 1 <span style="margin:0 1.1em">and</span> &Sigma; P(outcome) = 1`)}
          For disjoint events (no overlap), the probability of "one or the other" is just the sum.
        </div>
        <div class="callout key"><span class="label">Rule 3, the complement</span>
          The chance that <i>A</i> does not happen is one minus the chance it does.
          ${V.fml.block(`P(not A) = 1 &minus; P(A)`)}
          Benford gives leading digit 9 a probability of 0.046, so the chance the first digit is
          <b>not</b> 9 is 1 &minus; 0.046 = <b>0.954</b>. The lab below reproduces this.
        </div>
        <div class="callout"><span class="label">Benford's law</span>
          In many real datasets that span several orders of magnitude (populations, river lengths,
          street addresses, accounting figures) the leading digit is not uniform. Small digits lead
          far more often. The probability of leading digit <i>d</i> is
          ${V.fml.block(`P(d) = log<sub>10</sub>(1 + ${V.fml.frac("1", "d")})`)}
          which runs from 0.301 for digit 1 down to 0.046 for digit 9.
        </div>`;
      container.appendChild(concept);

      /* ---------- lab 1: Benford event builder ---------- */
      const lab1 = V.el("div.card.lab");
      lab1.innerHTML = `<div class="lab-head">
        <h3>Build an event, watch P add up</h3>
        <p>Click bars to add or drop leading digits from your event. The tool sums their Benford
        probabilities. The complement button shows P(not your event) = 1 minus that sum.</p>
      </div>`;
      const body1 = V.el("div.lab-body");
      const plot1 = V.el("div");
      body1.appendChild(plot1);

      const stats1 = V.el("div.stat-row", { style: { marginTop: "12px" } });
      const sChosen = V.stat("Digits chosen", "none", "");
      const sPEvent = V.stat("P(event)", "0.000", "accent");
      const sPComp = V.stat("P(not event)", "1.000", "");
      [sChosen, sPEvent, sPComp].forEach((s) => stats1.appendChild(s));
      body1.appendChild(stats1);

      const verdict1 = V.el("div.callout", { style: { marginTop: "12px" } });
      verdict1.innerHTML = `<span class="label">Pick some bars</span> Click the digits that belong to your event. P(event) is the sum of their probabilities.`;
      body1.appendChild(verdict1);
      lab1.appendChild(body1);

      const controls1 = V.el("div.lab-controls");
      const row1 = V.el("div.btn-row");
      const bNot9 = V.el("button.btn", { text: 'Show "not 9"' });
      const bSmall = V.el("button.btn", { text: '"1, 2, or 3"' });
      const bAll = V.el("button.btn.ghost", { text: "Select all" });
      const bClear = V.el("button.btn.ghost", { text: "Clear" });
      [bNot9, bSmall, bAll, bClear].forEach((b) => row1.appendChild(b));
      controls1.appendChild(V.el("div.control", null, [V.el("label", { text: "Quick events" }), row1]));
      lab1.appendChild(controls1);
      container.appendChild(lab1);

      /* selection state for lab 1 */
      const chosen = new Set();
      const tip1 = V.tooltip();

      const dims1 = V.svg(plot1, { height: 300, margin: { top: 22, right: 20, bottom: 46, left: 48 } });
      const g1 = dims1.g;
      const x1 = d3.scaleBand().domain(DIGITS).range([0, dims1.innerW]).padding(0.22);
      const y1 = d3.scaleLinear().domain([0, 0.32]).range([dims1.innerH, 0]).nice();

      // horizontal gridlines only (V.axes' grid path assumes a numeric x scale,
      // so draw the y-grid and y-axis directly for this band-scale chart)
      g1.append("g").attr("class", "grid")
        .call(d3.axisLeft(y1).ticks(6).tickSize(-dims1.innerW).tickFormat(""));
      g1.append("g").attr("class", "axis").call(d3.axisLeft(y1).ticks(6));
      g1.append("text").attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -dims1.innerH / 2).attr("y", -38)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("P(leading digit)");
      // band scale bottom axis
      g1.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${dims1.innerH})`)
        .call(d3.axisBottom(x1).tickSizeOuter(0));
      g1.append("text").attr("class", "axis-label")
        .attr("x", dims1.innerW / 2).attr("y", dims1.innerH + 38)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("Leading digit");

      const barsG = g1.append("g");
      const labelsG = g1.append("g");

      function drawBars1() {
        const bars = barsG.selectAll("rect.bar").data(DIGITS);
        bars.enter().append("rect").attr("class", "bar")
            .attr("rx", 3).style("cursor", "pointer")
            .attr("stroke", "#fff").attr("stroke-width", 1)
            .on("click", (ev, d) => { toggle(d); })
            .on("mouseover", (ev, d) => tip1.show(
              `digit <b>${d}</b><br>P = <b>${S.fmt(benford(d), 3)}</b>` +
              (chosen.has(d) ? "<br><i>in your event</i>" : ""), ev))
            .on("mousemove", (ev) => tip1.move(ev))
            .on("mouseout", () => tip1.hide())
          .merge(bars)
            .attr("x", (d) => x1(d)).attr("width", x1.bandwidth())
            .attr("y", (d) => y1(benford(d)))
            .attr("height", (d) => dims1.innerH - y1(benford(d)))
            .attr("fill", (d) => chosen.has(d) ? V.color("cardinal") : V.color("c-blue"))
            .attr("fill-opacity", (d) => chosen.has(d) ? 0.95 : 0.45);

        const labs = labelsG.selectAll("text.blab").data(DIGITS);
        labs.enter().append("text").attr("class", "blab")
            .attr("text-anchor", "middle").attr("font-size", 11)
            .attr("font-weight", 700).style("pointer-events", "none")
          .merge(labs)
            .attr("x", (d) => x1(d) + x1.bandwidth() / 2)
            .attr("y", (d) => y1(benford(d)) - 6)
            .attr("fill", (d) => chosen.has(d) ? V.color("cardinal") : V.color("ink-500"))
            .text((d) => S.fmt(benford(d), 3));
      }

      function update1() {
        const list = DIGITS.filter((d) => chosen.has(d));
        const pEvent = S.sum(list.map(benford));
        const pComp = 1 - pEvent;
        sChosen.set(list.length ? list.join(", ") : "none");
        sPEvent.set(S.fmt(pEvent, 3));
        sPComp.set(S.fmt(pComp, 3));
        drawBars1();

        if (list.length === 0) {
          verdict1.className = "callout";
          verdict1.innerHTML = `<span class="label">Pick some bars</span> Click the digits that belong to your event. P(event) is the sum of their probabilities.`;
        } else if (list.length === 9) {
          verdict1.className = "callout key";
          verdict1.innerHTML = `<span class="label">The whole sample space</span> You chose every digit, so P(event) = ${S.fmt(pEvent, 3)} (it rounds to 1) and P(not event) = 0. Rule 2 in action: the outcomes must add to 1.`;
        } else {
          const sumStr = list.map((d) => S.fmt(benford(d), 3)).join(" + ");
          verdict1.className = "callout key";
          verdict1.innerHTML =
            `<span class="label">P(event) by summation</span> ` +
            `P(first digit is ${list.join(", ")}) = ${sumStr} = <b>${S.fmt(pEvent, 3)}</b>. ` +
            `By the complement rule, P(not in that set) = 1 &minus; ${S.fmt(pEvent, 3)} = <b>${S.fmt(pComp, 3)}</b>.`;
        }
      }

      function toggle(d) { if (chosen.has(d)) chosen.delete(d); else chosen.add(d); update1(); }

      bNot9.onclick = () => { chosen.clear(); DIGITS.forEach((d) => { if (d !== 9) chosen.add(d); }); update1(); };
      bSmall.onclick = () => { chosen.clear(); [1, 2, 3].forEach((d) => chosen.add(d)); update1(); };
      bAll.onclick = () => { chosen.clear(); DIGITS.forEach((d) => chosen.add(d)); update1(); };
      bClear.onclick = () => { chosen.clear(); update1(); };

      update1();

      /* ---------- lab 2: legitimate-model checker ---------- */
      const lab2 = V.el("div.card.lab");
      lab2.innerHTML = `<div class="lab-head">
        <h3>Is this a legitimate model?</h3>
        <p>Five outcomes, five probabilities you control. The tool checks Rule 1 (each value in
        [0, 1]) and Rule 2 (the values sum to 1) and gives a verdict. Drag the sliders until it
        turns green.</p>
      </div>`;
      const body2 = V.el("div.lab-body");

      const stats2 = V.el("div.stat-row");
      const sSum = V.stat("Sum of probabilities", "—", "");
      const sRange = V.stat("All in [0, 1]?", "—", "");
      [sSum, sRange].forEach((s) => stats2.appendChild(s));
      body2.appendChild(stats2);

      const verdict2 = V.el("div.callout", { style: { marginTop: "12px" } });
      body2.appendChild(verdict2);
      lab2.appendChild(body2);

      // sliders, deliberately start NOT summing to 1 so students see a red verdict first
      const OUTCOMES = ["Excellent", "Good", "Fair", "Poor", "Don't know"];
      const probs = [0.15, 0.42, 0.13, 0.03, 0.20];   // sums to 0.93, illegal until fixed
      const sliders2 = [];
      const controls2 = V.el("div.lab-controls");
      OUTCOMES.forEach((name, i) => {
        const sl = V.slider({
          label: name, min: 0, max: 1, step: 0.01, value: probs[i],
          format: (v) => S.fmt(v, 2),
          on: (v) => { probs[i] = v; update2(); },
        });
        sliders2.push(sl);
        controls2.appendChild(sl.wrap);
      });
      const fixRow = V.el("div.control", null, [
        V.el("label", { text: "Helper" }),
        V.el("button.btn.ghost", { text: "Snap last to make it legal", onclick: () => {
          const others = probs.slice(0, 4).reduce((t, v) => t + v, 0);
          let last = 1 - others;
          last = Math.max(0, Math.min(1, last));
          probs[4] = Math.round(last * 100) / 100;
          sliders2[4].value = probs[4];
          update2();
        } }),
      ]);
      controls2.appendChild(fixRow);
      lab2.appendChild(controls2);
      container.appendChild(lab2);

      function update2() {
        const total = S.sum(probs);
        const allInRange = probs.every((p) => p >= 0 && p <= 1);
        const sumsToOne = Math.abs(total - 1) < 0.005;

        sSum.set(S.fmt(total, 2));
        sSum.className = "stat " + (sumsToOne ? "good" : "bad");
        sRange.set(allInRange ? "yes" : "no");
        sRange.className = "stat " + (allInRange ? "good" : "bad");

        if (allInRange && sumsToOne) {
          verdict2.className = "callout key";
          verdict2.innerHTML = `<span class="label">Legitimate model</span> Every probability is between 0 and 1, and they sum to ${S.fmt(total, 2)}. Both rules hold, so this is a valid probability model. Disjoint events can now be added, for example P(Good or Excellent) = ${S.fmt(probs[1] + probs[0], 2)}.`;
        } else if (!allInRange) {
          verdict2.className = "callout warn";
          verdict2.innerHTML = `<span class="label">Rule 1 broken</span> A probability cannot be below 0 or above 1. Every value has to be a real chance between impossible and certain.`;
        } else if (total > 1) {
          verdict2.className = "callout warn";
          verdict2.innerHTML = `<span class="label">Rule 2 broken</span> The probabilities sum to ${S.fmt(total, 2)}, which is more than 1. The outcomes are supposed to cover the whole sample space exactly once, so they must total 1. Lower one of the sliders by ${S.fmt(total - 1, 2)}.`;
        } else {
          verdict2.className = "callout warn";
          verdict2.innerHTML = `<span class="label">Rule 2 broken</span> The probabilities sum to ${S.fmt(total, 2)}, which is less than 1. Some probability is unaccounted for. Raise the sliders by ${S.fmt(1 - total, 2)} in total (the "Don't know" category usually soaks up the rest).`;
        }
      }
      update2();

      /* ---------- lab 3: simulated data vs the law ---------- */
      const lab3 = V.el("div.card.lab");
      lab3.innerHTML = `<div class="lab-head">
        <h3>Does real-looking data obey the law?</h3>
        <p>This draws a synthetic population dataset that spans many orders of magnitude (sizes from
        a few hundred up into the millions). The blue bars are the observed share of each leading
        digit; the gold outline is Benford's prediction. Resample to see the match hold.</p>
      </div>`;
      const body3 = V.el("div.lab-body");
      const plot3 = V.el("div");
      body3.appendChild(plot3);

      const legend3 = V.el("div.legend", { style: { marginTop: "10px" } });
      legend3.innerHTML =
        `<span class="swatch"><i style="background:${V.color("c-blue")}"></i> Observed share (simulated)</span>` +
        `<span class="swatch"><i style="background:${V.color("gold")}"></i> Benford's law</span>`;
      body3.appendChild(legend3);

      const stats3 = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const sNobs = V.stat("Sample size", "—", "");
      const sGap3 = V.stat("Largest gap", "—", "accent");
      [sNobs, sGap3].forEach((s) => stats3.appendChild(s));
      body3.appendChild(stats3);
      lab3.appendChild(body3);

      const controls3 = V.el("div.lab-controls");
      const nSlider = V.slider({
        label: "How many values", min: 200, max: 5000, step: 100, value: 1500,
        format: (v) => String(v),
        on: () => resample(),
      });
      controls3.appendChild(nSlider.wrap);
      const bResample = V.el("button.btn", { text: "Resample" });
      controls3.appendChild(V.el("div.control", null, [V.el("label", { text: "New draw" }), bResample]));
      lab3.appendChild(controls3);
      container.appendChild(lab3);

      const tip3 = V.tooltip();
      const dims3 = V.svg(plot3, { height: 300, margin: { top: 22, right: 20, bottom: 46, left: 48 } });
      const g3 = dims3.g;
      const x3 = d3.scaleBand().domain(DIGITS).range([0, dims3.innerW]).padding(0.22);
      const y3 = d3.scaleLinear().domain([0, 0.36]).range([dims3.innerH, 0]);

      g3.append("g").attr("class", "grid")
        .call(d3.axisLeft(y3).ticks(6).tickSize(-dims3.innerW).tickFormat(""));
      g3.append("g").attr("class", "axis").call(d3.axisLeft(y3).ticks(6));
      g3.append("text").attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -dims3.innerH / 2).attr("y", -38)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("Share of values");
      g3.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${dims3.innerH})`)
        .call(d3.axisBottom(x3).tickSizeOuter(0));
      g3.append("text").attr("class", "axis-label")
        .attr("x", dims3.innerW / 2).attr("y", dims3.innerH + 38)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("Leading digit");

      const obsG = g3.append("g");
      const benfG = g3.append("g");
      let seed3 = 7;
      // observed shares live in the outer scope so the bars' tooltip handlers
      // (bound once on enter) always read the current resample, not the first one.
      let shares = DIGITS.map(() => 0);

      function firstDigit(v) {
        v = Math.abs(v);
        while (v >= 10) v /= 10;
        while (v > 0 && v < 1) v *= 10;
        return Math.floor(v);
      }

      function draw3() {
        const n = nSlider.value;
        const rand = S.rng(seed3);
        // values spanning several orders of magnitude: exponent uniform on a wide range,
        // which is exactly the condition under which Benford's law emerges.
        const counts = DIGITS.map(() => 0);
        for (let i = 0; i < n; i++) {
          const exponent = 2 + rand() * 5;          // 10^2 .. 10^7
          const val = Math.pow(10, exponent);
          const d = firstDigit(val);
          if (d >= 1 && d <= 9) counts[d - 1]++;
        }
        shares = counts.map((c) => c / n);

        // observed bars
        const bars = obsG.selectAll("rect.obs").data(DIGITS);
        bars.enter().append("rect").attr("class", "obs")
            .attr("rx", 3).attr("fill", V.color("c-blue")).attr("fill-opacity", 0.8)
            .on("mouseover", (ev, d) => tip3.show(
              `digit <b>${d}</b><br>observed <b>${S.fmt(shares[d - 1], 3)}</b>` +
              `<br>Benford <b>${S.fmt(benford(d), 3)}</b>`, ev))
            .on("mousemove", (ev) => tip3.move(ev))
            .on("mouseout", () => tip3.hide())
          .merge(bars)
            .attr("x", (d) => x3(d)).attr("width", x3.bandwidth())
            .attr("y", (d) => y3(shares[d - 1]))
            .attr("height", (d) => dims3.innerH - y3(shares[d - 1]));

        // Benford reference: an outlined step for each band
        const refs = benfG.selectAll("rect.ref").data(DIGITS);
        refs.enter().append("rect").attr("class", "ref")
            .attr("fill", "none").attr("stroke", V.color("gold")).attr("stroke-width", 2.5)
          .merge(refs)
            .attr("x", (d) => x3(d)).attr("width", x3.bandwidth())
            .attr("y", (d) => y3(benford(d)))
            .attr("height", (d) => dims3.innerH - y3(benford(d)));

        const gaps = DIGITS.map((d) => Math.abs(shares[d - 1] - benford(d)));
        sNobs.set(String(n));
        sGap3.set(S.fmt(S.max(gaps), 3));
      }

      function resample() { seed3 = (seed3 * 1103515245 + 12345) >>> 0; draw3(); }
      bResample.onclick = resample;
      draw3();

      /* ---------- quick check ---------- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">Under Benford's law the leading digit is 9 with probability 0.046.
          What is the probability that the leading digit is <b>not</b> 9?</div>
          <button class="opt" data-ok="0">0.046, the same number</button>
          <button class="opt" data-ok="1">0.954, by the complement rule 1 − 0.046</button>
          <button class="opt" data-ok="0">0.500, since it either is or is not 9</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ---------- the real course exercise ---------- */
      P.renderPractice(container, "w3-prob-rules");
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
        ? "Right. The complement rule says P(not A) = 1 − P(A), so P(not 9) = 1 − 0.046 = 0.954. The two events 'is 9' and 'is not 9' are disjoint and cover everything, so their probabilities add to 1."
        : "Not quite. 'Is 9' and 'is not 9' together cover every possibility, so their probabilities sum to 1. That makes P(not 9) = 1 − 0.046 = 0.954.";
    }));
  }
})();
