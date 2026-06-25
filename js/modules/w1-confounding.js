/* =====================================================================
   w1-confounding, Observational study vs experiment
   A confounding sandbox: wealthier people both join a wellness program
   and start out healthier, so the naive observational comparison
   overstates the program's true effect. Flip to a randomized experiment
   and the confounder balances out, recovering the true +3.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w1-confounding"] = {
    render(container) {
      P.lessonHeader(container, "w1-confounding",
        "When people choose their own treatment, the comparison is rigged from the start. " +
        "Randomly assigning who gets treated is what lets a difference in outcomes count as cause and effect.");

      /* ---- concept card ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>Watching versus doing</h3>
        <div class="callout"><span class="label">Observational study</span>
          You record a group as it already is and compare, without changing anything. People sort
          themselves into the categories you compare (joined the program or not), so the groups can
          differ in many ways besides the one you care about.
        </div>
        <div class="callout"><span class="label">Experiment</span>
          You deliberately impose a treatment on some subjects and withhold it from others. An
          experiment is the only fully convincing way to show that a treatment <i>causes</i> a change
          in the response, because you control who gets treated.
        </div>
        <div class="callout"><span class="label">Confounding (lurking) variable</span>
          A third variable that moves with both the treatment and the response, so you cannot tell
          which one is doing the work. Here it is baseline wealth: wealthier people are more likely
          to join the program <b>and</b> tend to be healthier to begin with.
        </div>
        <div class="callout key"><span class="label">Why randomizing fixes it</span>
          In a randomized comparative experiment, a coin flip (not the subject) decides treatment
          versus control. Wealth, and every other lurking trait, lands in both groups in about equal
          amounts. The groups start alike, so a gap in the response must be due to the treatment.
        </div>`;
      container.appendChild(concept);

      /* ---- interactive lab ---- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Confounding sandbox</h3>
        <p>Each dot is a person: wealth on the x-axis, health score on the y-axis. The program's true
        effect is fixed at +3. Switch the study design and watch what the naive comparison reports.</p>
      </div>`;
      const body = V.el("div.lab-body");

      // design toggle
      const segWrap = V.el("div.control");
      const seg = V.el("div.seg");
      ["Observational (self-selected)", "Randomized experiment"].forEach((t, i) => {
        const b = V.el("button", { text: t });
        if (i === 0) b.classList.add("active");
        b.dataset.mode = i === 0 ? "obs" : "rct";
        seg.appendChild(b);
      });
      segWrap.appendChild(V.el("label", { text: "Study design" }));
      segWrap.appendChild(seg);
      body.appendChild(segWrap);

      // legend
      const legend = V.el("div.legend", { style: { margin: "12px 0 4px" } });
      legend.innerHTML =
        `<span class="swatch"><i style="background:${V.color("treatment")}"></i>Treated (joined program)</span>` +
        `<span class="swatch"><i style="background:${V.color("control")}"></i>Control (did not join)</span>` +
        `<span class="swatch"><i style="background:${V.color("treatment")};border-radius:0;width:14px;height:3px"></i>group mean health</span>`;
      body.appendChild(legend);

      const plot = V.el("div");
      body.appendChild(plot);

      const stats = V.el("div.stat-row", { style: { marginTop: "10px" } });
      const sTrue = V.stat("True effect", "+3.0", "good");
      const sEst = V.stat("Naive estimate", "—", "accent");
      const sBias = V.stat("Overstatement", "—", "");
      const sBal = V.stat("Wealth gap (T − C)", "—", "");
      [sTrue, sEst, sBias, sBal].forEach((s) => stats.appendChild(s));
      body.appendChild(stats);

      const verdict = V.el("div.callout", { style: { marginTop: "12px" } });
      body.appendChild(verdict);
      lab.appendChild(body);

      // controls
      const controls = V.el("div.lab-controls");
      const sConf = V.slider({
        label: "Strength of confounding", min: 0, max: 1, step: 0.05, value: 0.7,
        format: (v) => v.toFixed(2),
        on: () => { rebuild(); },
      });
      const row = V.el("div.btn-row");
      const bResample = V.el("button.btn", { text: "New sample" });
      row.appendChild(bResample);
      controls.appendChild(sConf.wrap);
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Redraw" }), row]));
      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---- quick check ---- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">Across the summer, towns with higher ice-cream sales also report more
          drownings. The two move together almost perfectly. What is the lurking variable that
          explains the link, with no causal arrow between ice cream and drowning?</div>
          <button class="opt" data-ok="0">Eating ice cream makes people cramp and drown</button>
          <button class="opt" data-ok="1">Hot weather: heat drives both ice-cream buying and swimming</button>
          <button class="opt" data-ok="0">Nothing, the correlation proves ice cream causes drownings</button>
          <button class="opt" data-ok="0">Drowning scares survivors into buying comfort food</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ---------- model ----------
         Each person has baseline wealth w in [0,100]. True health is built
         from wealth plus the fixed program effect plus noise:
            health = 50 + confStrength * 0.4 * (w - 50)   (wealth helps health)
                     + 3 * treated                        (the true effect, +3)
                     + Gaussian noise
         In observational mode, treatment probability rises with wealth
         (selection on the confounder). In the experiment, treatment is a
         fair coin flip independent of wealth. */
      const N = 120;
      const TRUE_EFFECT = 3;
      let mode = "obs";
      let people = [];

      function build() {
        const rand = S.rng(20240901 + Math.floor(sConf.value * 1000) + seed);
        const c = sConf.value;            // 0 = no confounding, 1 = strong
        people = [];
        for (let i = 0; i < N; i++) {
          const w = rand() * 100;         // baseline wealth
          let treated;
          if (mode === "obs") {
            // richer people self-select into the program; c scales the tilt
            const p = 0.5 + c * (w - 50) / 100;   // ranges ~0.5 ± 0.5c
            treated = rand() < Math.max(0.02, Math.min(0.98, p)) ? 1 : 0;
          } else {
            treated = rand() < 0.5 ? 1 : 0;       // fair coin flip
          }
          const baseHealth = 50 + c * 0.4 * (w - 50);
          const noise = S.gaussian(rand, 0, 4);
          const health = baseHealth + TRUE_EFFECT * treated + noise;
          people.push({ w, health, treated });
        }
      }

      /* ---------- d3 scaffold ---------- */
      const dims = V.svg(plot, { height: 320, margin: { top: 16, right: 22, bottom: 46, left: 52 } });
      const g = dims.g;
      const x = d3.scaleLinear().domain([0, 100]).range([0, dims.innerW]);
      const y = d3.scaleLinear().domain([30, 75]).range([dims.innerH, 0]);
      V.axes(g, x, y, dims, {
        xlabel: "Baseline wealth (percentile)",
        ylabel: "Health score",
        xticks: 6, yticks: 6,
      });

      const meanT = g.append("line")
        .attr("stroke", V.color("treatment")).attr("stroke-width", 3).attr("x1", 0).attr("x2", dims.innerW);
      const meanC = g.append("line")
        .attr("stroke", V.color("control")).attr("stroke-width", 3).attr("stroke-dasharray", "1 0")
        .attr("x1", 0).attr("x2", dims.innerW);

      const dotsG = g.append("g");
      const tip = V.tooltip();
      let seed = 1;

      function draw() {
        const T = people.filter((d) => d.treated === 1);
        const C = people.filter((d) => d.treated === 0);
        const mT = S.mean(T.map((d) => d.health));
        const mC = S.mean(C.map((d) => d.health));
        const est = mT - mC;
        const wGap = S.mean(T.map((d) => d.w)) - S.mean(C.map((d) => d.w));

        // dots
        const sel = dotsG.selectAll("circle.pt").data(people, (d, i) => i);
        sel.exit().remove();
        sel.enter().append("circle").attr("class", "pt")
            .attr("r", 5).attr("stroke", "#fff").attr("stroke-width", 1)
            .on("mouseover", (ev, d) => tip.show(
              `${d.treated ? "Treated" : "Control"}<br>wealth = <b>${S.fmt(d.w, 0)}</b>, health = <b>${S.fmt(d.health, 1)}</b>`, ev))
            .on("mousemove", (ev) => tip.move(ev))
            .on("mouseout", () => tip.hide())
          .merge(sel)
            .attr("cx", (d) => x(d.w)).attr("cy", (d) => y(d.health))
            .attr("fill", (d) => d.treated ? V.color("treatment") : V.color("control"))
            .attr("fill-opacity", 0.78);

        meanT.attr("y1", y(mT)).attr("y2", y(mT));
        meanC.attr("y1", y(mC)).attr("y2", y(mC));

        // stat cards
        sEst.set((est >= 0 ? "+" : "") + S.fmt(est, 1));
        const over = est - TRUE_EFFECT;
        sBias.set((over >= 0 ? "+" : "") + S.fmt(over, 1));
        sBias.className = "stat " + (Math.abs(over) > 1 ? "bad" : "good");
        sBal.set((wGap >= 0 ? "+" : "") + S.fmt(wGap, 0));

        // verdict callout
        if (mode === "rct") {
          verdict.className = "callout key";
          verdict.innerHTML =
            `<span class="label">Randomization balanced the groups</span> The coin flip put roughly ` +
            `equal wealth in each group (wealth gap ${S.fmt(wGap, 0)} points, near zero). With the confounder ` +
            `balanced, the naive estimate <b>${(est >= 0 ? "+" : "") + S.fmt(est, 1)}</b> lands on the true ` +
            `effect of +3 (up to sampling noise). The difference in health is now fairly credited to the program.`;
        } else {
          verdict.className = "callout warn";
          verdict.innerHTML =
            `<span class="label">Self-selection inflated the estimate</span> Observational estimate ` +
            `<b>${(est >= 0 ? "+" : "") + S.fmt(est, 1)}</b> overstates the true <b>+3</b> because the treated ` +
            `started ${S.fmt(wGap, 0)} wealth points richer, and richer people were already healthier. ` +
            `Part of that ${(est >= 0 ? "+" : "") + S.fmt(est, 1)} gap is the wellness program; the rest is the ` +
            `wealth they brought with them. You cannot separate the two from this comparison alone.`;
        }
      }

      function rebuild() { build(); draw(); }

      seg.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        seg.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        mode = b.dataset.mode;
        rebuild();
      });
      bResample.onclick = () => { seed++; rebuild(); };

      rebuild();
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
        ? "Right. Temperature is the lurking variable. Hot days send people to the ice-cream stand and into the water at the same time, so the two rise together with no causal link between them."
        : "Not quite. Neither variable causes the other. A third factor, summer heat, drives ice-cream sales and swimming (so drownings) at once. That is a textbook lurking variable.";
    }));
  }
})();
