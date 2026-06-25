/* =====================================================================
   w3-longrun, Probability as long-run frequency
   Flip a coin with a known true probability p and watch the running
   proportion of heads. Early on it wobbles wildly; over thousands of
   flips it settles onto p. A small "personal probability" ruler ties
   a subjective judgment to the same 0..1 scale.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w3-longrun"] = {
    render(container) {
      P.lessonHeader(container, "w3-longrun",
        "A single coin flip is anybody's guess. Flip the same coin ten thousand times and the share that comes up heads stops guessing and settles onto one number. That settled number is what we mean by probability.");

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>What a probability actually is</h3>
        <div class="callout"><span class="label">Random, but regular</span>
          One outcome is uncertain: you cannot say whether the next flip lands heads.
          Repeat it many times and a pattern appears anyway. The share of heads stops
          jumping around and homes in on a fixed value. Individually unpredictable,
          collectively regular.
        </div>
        <div class="callout"><span class="label">Probability = long-run proportion</span>
          The probability of an outcome is the proportion of times it would occur in a
          very long series of repetitions.
          ${V.fml.block(`P(heads) &asymp; ${V.fml.frac("heads so far", "flips so far")}`)}
          as the number of flips grows, the right side settles onto the true <i>p</i>.
        </div>
        <div class="callout key"><span class="label">Personal probability</span>
          Some events happen only once, so you cannot repeat them. "It rains tomorrow"
          gets a <b>personal probability</b>: a number from 0 to 1 expressing your own
          degree of belief. It still has to obey the same rules (between 0 and 1, and the
          chances of all outcomes add to 1). The ruler below makes that judgment a number.
        </div>`;
      container.appendChild(concept);

      /* ---- interactive lab ---- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Law of large numbers, one coin at a time</h3>
        <p>Set the coin's true probability of heads, then flip. The line tracks the running share of heads. Watch it wobble when flips are few and settle onto the dashed true value as they pile up.</p>
      </div>`;
      const body = V.el("div.lab-body");
      const plot = V.el("div");
      body.appendChild(plot);

      const stats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const sN = V.stat("Flips", "0", "");
      const sH = V.stat("Heads", "0", "");
      const sProp = V.stat("Proportion", "—", "accent");
      const sGap = V.stat("Gap from p", "—", "");
      [sN, sH, sProp, sGap].forEach((s) => stats.appendChild(s));
      sProp.querySelector(".v").style.color = V.color("c-blue");
      body.appendChild(stats);

      /* last-batch swatches */
      const batchWrap = V.el("div", { style: { marginTop: "12px" } });
      const batchLbl = V.el("div.small.muted", { text: "Last batch of flips" });
      const batchRow = V.el("div", { style: { display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "5px", minHeight: "16px" } });
      batchWrap.appendChild(batchLbl);
      batchWrap.appendChild(batchRow);
      body.appendChild(batchWrap);

      const legend = V.el("div.legend", { style: { marginTop: "12px" } });
      legend.innerHTML =
        `<span class="swatch"><i style="background:${V.color("c-blue")}"></i> running proportion of heads</span>` +
        `<span class="swatch"><i style="background:${V.color("mean")}"></i> true p</span>` +
        `<span class="swatch"><i style="background:${V.color("c-green")}"></i> heads</span>` +
        `<span class="swatch"><i style="background:${V.color("ink-300")}"></i> tails</span>`;
      body.appendChild(legend);

      const verdict = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(verdict);
      lab.appendChild(body);

      /* ---- controls ---- */
      const controls = V.el("div.lab-controls");

      const pSlider = V.slider({
        label: "True P(heads), p",
        min: 0.05, max: 0.95, step: 0.05, value: 0.5,
        format: (v) => S.fmt(v, 2),
        on: () => { p = pSlider.value; reset(); },
      });
      controls.appendChild(pSlider.wrap);

      const flipRow = V.el("div.btn-row");
      const b1 = V.el("button.btn", { text: "Flip 1" });
      const b10 = V.el("button.btn", { text: "Flip 10" });
      const b100 = V.el("button.btn", { text: "Flip 100" });
      const b1000 = V.el("button.btn.primary", { text: "Flip 1000" });
      const bReset = V.el("button.btn.ghost", { text: "Reset" });
      [b1, b10, b100, b1000, bReset].forEach((b) => flipRow.appendChild(b));
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Flip the coin" }), flipRow]));

      /* personal-probability ruler */
      const rainSlider = V.slider({
        label: "How sure are you it rains tomorrow?",
        min: 0, max: 100, step: 1, value: 30,
        format: (v) => v + "%",
        on: (v) => updateRain(v),
      });
      controls.appendChild(rainSlider.wrap);
      const rainEcho = V.el("div.small.muted", { style: { minWidth: "150px" } });
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Your number, on the 0 to 1 scale" }), rainEcho]));

      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">A weather forecaster says "the probability that this coin lands heads is 0.5."
          In the long-run-frequency view, what does that 0.5 mean?</div>
          <button class="opt" data-ok="0">Every other flip must be heads, the outcomes strictly alternate.</button>
          <button class="opt" data-ok="1">Over a very long series of flips, about half would come up heads.</button>
          <button class="opt" data-ok="0">In any 10 flips you will get exactly 5 heads.</button>
          <button class="opt" data-ok="0">The next flip is more likely to be heads than tails.</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* the real course exercise */
      P.renderPractice(container, "w3-prob-rules");

      /* ---------- simulation state ---------- */
      let p = pSlider.value;
      let rand = S.rng(20240601);            // reproducible across reloads
      let n = 0, heads = 0;
      let trace = [];                        // [{n, prop}], the running line

      /* ---------- d3 scaffold ---------- */
      const dims = V.svg(plot, { height: 300, margin: { top: 18, right: 22, bottom: 44, left: 52 } });
      const g = dims.g;
      const x = d3.scaleLinear().domain([0, 10]).range([0, dims.innerW]);
      const y = d3.scaleLinear().domain([0, 1]).range([dims.innerH, 0]);

      const gridX = g.append("g").attr("class", "grid").attr("transform", `translate(0,${dims.innerH})`);
      const gridY = g.append("g").attr("class", "grid");
      const axisX = g.append("g").attr("class", "axis").attr("transform", `translate(0,${dims.innerH})`);
      const axisY = g.append("g").attr("class", "axis");

      g.append("text").attr("class", "axis-label")
        .attr("x", dims.innerW / 2).attr("y", dims.innerH + 36)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("number of flips");
      g.append("text").attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -dims.innerH / 2).attr("y", -40)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text("proportion of heads");

      // true-p reference line
      const pLine = g.append("line")
        .attr("x1", 0).attr("x2", dims.innerW)
        .attr("stroke", V.color("mean")).attr("stroke-width", 2).attr("stroke-dasharray", "6 4");
      const pLbl = g.append("text").attr("fill", V.color("mean"))
        .attr("font-size", 12).attr("font-weight", 700).attr("text-anchor", "end")
        .attr("x", dims.innerW);

      const line = d3.line().x((d) => x(d.n)).y((d) => y(d.prop));
      const path = g.append("path")
        .attr("fill", "none").attr("stroke", V.color("c-blue")).attr("stroke-width", 2.2)
        .attr("stroke-linejoin", "round");
      const lastDot = g.append("circle").attr("r", 4.5)
        .attr("fill", V.color("c-blue")).attr("stroke", "#fff").attr("stroke-width", 1.5)
        .style("display", "none");

      function drawAxes() {
        gridX.call(d3.axisBottom(x).ticks(6).tickSize(-dims.innerH).tickFormat(""));
        gridY.call(d3.axisLeft(y).ticks(5).tickSize(-dims.innerW).tickFormat(""));
        axisX.call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("~s")));
        axisY.call(d3.axisLeft(y).ticks(5));
      }

      function drawP() {
        pLine.attr("y1", y(p)).attr("y2", y(p));
        pLbl.attr("y", y(p) - 6).text("true p = " + S.fmt(p, 2));
      }

      function draw() {
        // x autoscales to the flips so far (minimum span of 10 so a single
        // flip is not stranded against the left edge)
        x.domain([0, Math.max(10, n)]);
        drawAxes();
        drawP();

        if (trace.length) {
          path.attr("d", line(trace));
          const last = trace[trace.length - 1];
          lastDot.style("display", null).attr("cx", x(last.n)).attr("cy", y(last.prop));
        } else {
          path.attr("d", null);
          lastDot.style("display", "none");
        }

        const prop = n ? heads / n : NaN;
        sN.set(n.toLocaleString());
        sH.set(heads.toLocaleString());
        sProp.set(n ? S.fmt(prop, 3) : "—");
        const gap = prop - p;
        sGap.set(n ? (gap >= 0 ? "+" : "") + S.fmt(gap, 3) : "—");

        updateVerdict(prop);
      }

      function updateVerdict(prop) {
        if (!n) {
          verdict.className = "callout";
          verdict.innerHTML = `<span class="label">No data yet</span> Press a flip button. With just a few flips the proportion will swing far from p; that swing is the whole point.`;
          return;
        }
        const gap = Math.abs(prop - p);
        if (n < 50) {
          verdict.className = "callout warn";
          verdict.innerHTML = `<span class="label">Small samples are noisy</span> After ${n.toLocaleString()} flip${n === 1 ? "" : "s"} the proportion is ${S.fmt(prop, 3)}, off the true p (${S.fmt(p, 2)}) by ${S.fmt(gap, 3)}. A short run can land almost anywhere. Keep flipping.`;
        } else if (gap < 0.02) {
          verdict.className = "callout key";
          verdict.innerHTML = `<span class="label">The proportion has settled near p</span> After ${n.toLocaleString()} flips the share of heads is ${S.fmt(prop, 3)}, within ${S.fmt(gap, 3)} of the true p (${S.fmt(p, 2)}). This is the law of large numbers: the long-run proportion is the probability.`;
        } else {
          verdict.className = "callout";
          verdict.innerHTML = `<span class="label">Closing in</span> After ${n.toLocaleString()} flips the proportion is ${S.fmt(prop, 3)}, off p (${S.fmt(p, 2)}) by ${S.fmt(gap, 3)}. The wobble is shrinking. Add more flips and it tightens onto p.`;
        }
      }

      function flipBatch(k) {
        const results = [];
        for (let i = 0; i < k; i++) {
          const isHead = rand() < p;
          if (isHead) heads++;
          n++;
          results.push(isHead);
          // record the trace; for big batches only keep one point per ~1%
          // of progress so the path stays light but the shape is faithful
          const stride = Math.max(1, Math.floor(k / 200));
          if (i % stride === 0 || i === k - 1) trace.push({ n: n, prop: heads / n });
        }
        drawBatch(results);
        draw();
      }

      function drawBatch(results) {
        batchRow.innerHTML = "";
        // show at most the last 100 outcomes as little squares
        const show = results.slice(-100);
        if (results.length > show.length) {
          batchLbl.textContent = `Last batch of flips (showing last 100 of ${results.length.toLocaleString()})`;
        } else {
          batchLbl.textContent = `Last batch of flips (${results.length})`;
        }
        show.forEach((isHead) => {
          const sq = V.el("span", {
            title: isHead ? "heads" : "tails",
            style: {
              width: "11px", height: "11px", borderRadius: "2px", display: "inline-block",
              background: isHead ? V.color("c-green") : V.color("ink-300"),
            },
          });
          batchRow.appendChild(sq);
        });
      }

      function reset() {
        rand = S.rng(20240601);
        n = 0; heads = 0; trace = [];
        batchRow.innerHTML = "";
        batchLbl.textContent = "Last batch of flips";
        draw();
      }

      function updateRain(v) {
        const prob = (v / 100).toFixed(2);
        rainEcho.innerHTML = `You set P(rain) = <b style="color:${V.color("c-blue")}">${prob}</b> out of 1. ` +
          (v === 0 ? "You judge rain impossible." :
           v === 100 ? "You judge rain certain." :
           v < 50 ? "You lean toward a dry day." :
           v > 50 ? "You lean toward rain." : "A true coin flip in your judgment.");
      }

      b1.onclick = () => flipBatch(1);
      b10.onclick = () => flipBatch(10);
      b100.onclick = () => flipBatch(100);
      b1000.onclick = () => flipBatch(1000);
      bReset.onclick = () => reset();

      updateRain(rainSlider.value);
      reset();
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
        ? "Right. Probability is the proportion in a very long run, not a promise about any single flip or any short stretch. Ten flips can easily give 3 or 7 heads; ten thousand will sit very close to half."
        : "Not quite. Probability says nothing exact about one flip or a short stretch. It is the share of heads you would see over a very long series of repetitions, here about half.";
    }));
  }
})();
