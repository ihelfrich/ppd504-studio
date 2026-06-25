/* =====================================================================
   w1-ethics, Data ethics: judging research on human subjects
   The interactive is a "scenario judge": short research vignettes come
   one at a time, the student picks which protection (if any) is broken,
   and a running score plus a small SVG scoreboard tracks how their
   ethical eye is doing. The four pillars (IRB, informed consent,
   confidentiality vs anonymity, subject-first) plus the Yucatan consent
   table and a sober note on Tuskegee anchor the concepts.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w1-ethics"] = {
    render(container) {
      P.lessonHeader(container, "w1-ethics",
        "Before a study touches a single person, four protections have to hold. " +
        "Read each scenario, decide which one is broken (or whether the study is sound), and watch your call against the answer.");

      /* ---- concept card: the four pillars ---- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>Four protections for human subjects</h3>
        <p class="muted small" style="margin:-2px 0 12px">
          Public policy research often studies people: surveys, program evaluations, field experiments.
          These four rules govern any study that does.</p>
        <div class="callout"><span class="label">IRB review, approval comes first</span>
          An <b>Institutional Review Board</b> (IRB) is an independent committee that reads the study plan
          <i>before</i> any data is collected and weighs the risks to subjects against the value of the work.
          You do not get to skip it because the study "seems harmless."
        </div>
        <div class="callout"><span class="label">Informed consent, told and agreed in writing</span>
          Subjects must be told the nature of the study and its risks in plain language, then agree, normally
          in writing. Consent that is not informed, or not freely given, is not consent.
        </div>
        <div class="callout"><span class="label">Confidentiality is not anonymity</span>
          <b>Confidentiality</b> means the researcher may know who said what but protects that link and never
          publishes it. <b>Anonymity</b> is stronger: even the researcher cannot tie a response to a name.
          Either way, only <b>statistical summaries</b> reach the public, never a single identifiable record.
        </div>
        <div class="callout key"><span class="label">The subject comes first</span>
          When the interests of the subject collide with the interests of science or society, the subject wins.
          A more efficient dataset never justifies harming, deceiving, or pressuring the people in it.
        </div>`;
      container.appendChild(concept);

      /* ---- historical-context callout: Tuskegee ---- */
      const hist = V.el("div.card");
      hist.innerHTML = `
        <h3>Why these rules exist</h3>
        <div class="callout warn"><span class="label">The Tuskegee Syphilis Study (1932 to 1972)</span>
          For forty years, a U.S. Public Health Service study followed hundreds of Black men with syphilis
          without telling them their diagnosis, and without offering them penicillin once it became the
          standard cure. The men were never given the information needed to consent, and their welfare was
          subordinated to data collection. The public outcry afterward produced the modern framework: the
          Belmont Report, federal rules, and the IRB system. The protections above are not bureaucratic
          boxes. They are the response to studies that treated people as a means to an end.
        </div>`;
      container.appendChild(hist);

      /* ---- the interactive: scenario judge ---- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Scenario judge</h3>
        <p>Each card is a research situation. Pick the single protection it breaks, or "Ethically sound" if it holds. The answer and a one-line reason appear after you choose.</p>
      </div>`;
      const body = V.el("div.lab-body");

      /* scoreboard SVG + live stats */
      const board = V.el("div");
      body.appendChild(board);

      const stats = V.el("div.stat-row", { style: { marginTop: "12px" } });
      const sScore = V.stat("Correct", "0", "good");
      const sSeen = V.stat("Judged", "0", "");
      const sLeft = V.stat("Remaining", "—", "accent");
      [sScore, sSeen, sLeft].forEach((s) => stats.appendChild(s));
      body.appendChild(stats);

      /* scenario prompt */
      const scen = V.el("div.callout", { style: { marginTop: "14px", fontSize: "15px" } });
      body.appendChild(scen);

      /* answer options (a vertical button stack, reuses .btn styling) */
      const optsWrap = V.el("div.btn-row", { style: { flexDirection: "column", marginTop: "12px", gap: "8px" } });
      body.appendChild(optsWrap);

      /* reveal + reason */
      const reveal = V.el("div.callout", { style: { marginTop: "12px", display: "none" } });
      body.appendChild(reveal);
      lab.appendChild(body);

      /* controls: next / restart */
      const controls = V.el("div.lab-controls");
      const navRow = V.el("div.btn-row");
      const bNext = V.el("button.btn.primary", { text: "Next scenario →" });
      bNext.disabled = true;
      const bRestart = V.el("button.btn.ghost", { text: "Start over" });
      [bNext, bRestart].forEach((b) => navRow.appendChild(b));
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Move on" }), navRow]));
      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---- the five principles (the answer space) ---- */
      const PRINCIPLES = [
        "No IRB review",
        "No informed consent",
        "Breaks confidentiality",
        "Coercion: science over subject",
        "Ethically sound",
      ];

      /* ---- the scenarios. `ok` indexes PRINCIPLES. ---- */
      const SCENARIOS = [
        {
          text: "A policy analyst posts the full survey dataset online as a public file. One row lists a respondent by name and home address next to their answers about welfare use.",
          ok: 2,
          why: "Confidentiality is broken. Only statistical summaries may be public; an identifiable record with name and address must never be released.",
        },
        {
          text: "A graduate team launches an online survey on housing stress and starts collecting answers the same afternoon. There was no committee review of the plan beforehand.",
          ok: 0,
          why: "No IRB review. A human-subjects study must be approved by the board before any data is collected, even when it looks low-risk.",
        },
        {
          text: "Researchers stand in a public plaza, approved by the IRB, and count how many pedestrians use a crosswalk versus jaywalk. No one is identified, approached, or recorded by name.",
          ok: 4,
          why: "Ethically sound. Observing anonymous public behavior under IRB approval, with no identifying information, breaks none of the four protections.",
        },
        {
          text: "An evaluator visits a prison and tells inmates that signing up for the drug trial 'will be noted favorably by the parole board.' Many enroll who otherwise would not.",
          ok: 3,
          why: "Coercion. Tying enrollment to parole pressures a captive group, so the interests of the study override the subjects' free choice. Consent is not freely given.",
        },
        {
          text: "A clinic emails a wellness questionnaire to patients and records every answer, but the cover message never explains the study's purpose, its risks, or that taking part is voluntary, and no one is asked to agree.",
          ok: 1,
          why: "No informed consent. Subjects must be told the nature and risks of the study and agree, normally in writing, before any data is gathered.",
        },
        {
          text: "A team runs an anonymous, IRB-approved survey of city employees. Names are never collected, and the report shows only group averages by department.",
          ok: 4,
          why: "Ethically sound. Anonymity, prior IRB approval, and summary-only reporting together satisfy every protection.",
        },
      ];

      /* ---------- scoreboard drawn with V.svg ---------- */
      const dims = V.svg(board, { height: 88, margin: { top: 18, right: 16, bottom: 22, left: 16 } });
      const g = dims.g;
      const cellGap = 8;
      const cellW = (dims.innerW - cellGap * (SCENARIOS.length - 1)) / SCENARIOS.length;
      g.append("text").attr("x", 0).attr("y", -6)
        .attr("font-size", 11).attr("font-weight", 700)
        .attr("fill", V.color("ink-600")).attr("letter-spacing", ".04em")
        .text("YOUR CALLS");
      const cells = g.selectAll("rect.cell").data(SCENARIOS).join("rect")
        .attr("class", "cell")
        .attr("x", (d, i) => i * (cellW + cellGap))
        .attr("y", 6).attr("width", cellW).attr("height", dims.innerH - 10)
        .attr("rx", 6)
        .attr("fill", V.color("ink-100"))
        .attr("stroke", V.color("ink-200")).attr("stroke-width", 1);
      const cellTx = g.selectAll("text.cn").data(SCENARIOS).join("text")
        .attr("class", "cn")
        .attr("x", (d, i) => i * (cellW + cellGap) + cellW / 2)
        .attr("y", 6 + (dims.innerH - 10) / 2 + 5)
        .attr("text-anchor", "middle").attr("font-size", 14).attr("font-weight", 700)
        .attr("fill", V.color("ink-400"))
        .text((d, i) => i + 1);
      const tip = V.tooltip();
      cells
        .on("mouseover", (ev, d) => {
          const i = SCENARIOS.indexOf(d);
          const verdict = results[i] == null ? "not judged yet"
            : results[i] ? "you got it right" : "you missed this one";
          tip.show(`Scenario <b>${i + 1}</b>: ${verdict}`, ev);
        })
        .on("mousemove", (ev) => tip.move(ev))
        .on("mouseout", () => tip.hide());

      /* ---------- state ---------- */
      const order = S.shuffle(SCENARIOS.map((_, i) => i), S.rng(504));
      let pos = 0;            // index into `order`
      let answered = false;   // has the current scenario been answered?
      const results = new Array(SCENARIOS.length).fill(null); // by scenario index

      function paintBoard() {
        cells.attr("fill", (d, i) => results[i] == null ? V.color("ink-100")
          : results[i] ? "#eefaf1" : "#fdeeec")
          .attr("stroke", (d, i) => results[i] == null ? V.color("ink-200")
            : results[i] ? V.color("positive") : V.color("negative"))
          .attr("stroke-width", (d, i) => {
            const cur = order[pos];
            return i === cur ? 2.5 : 1;
          });
        cellTx.attr("fill", (d, i) => results[i] == null ? V.color("ink-400")
          : results[i] ? V.color("positive") : V.color("negative"));
      }

      function refreshStats() {
        const correct = results.filter((r) => r === true).length;
        const seen = results.filter((r) => r != null).length;
        sScore.set(correct);
        sSeen.set(seen);
        sLeft.set(SCENARIOS.length - seen);
      }

      function showScenario() {
        answered = false;
        bNext.disabled = true;
        reveal.style.display = "none";
        const idx = order[pos];
        const sc = SCENARIOS[idx];
        scen.className = "callout";
        scen.innerHTML = `<span class="label">Scenario ${pos + 1} of ${SCENARIOS.length}</span>${sc.text}`;

        optsWrap.innerHTML = "";
        PRINCIPLES.forEach((label, k) => {
          const b = V.el("button.btn", { text: label, style: { textAlign: "left", width: "100%" } });
          if (k === PRINCIPLES.length - 1) b.classList.add("ghost");
          b.addEventListener("click", () => choose(k, b));
          optsWrap.appendChild(b);
        });
        paintBoard();
      }

      function choose(k, btn) {
        if (answered) return;
        answered = true;
        const idx = order[pos];
        const sc = SCENARIOS[idx];
        const right = k === sc.ok;
        results[idx] = right;

        const buttons = Array.from(optsWrap.querySelectorAll("button"));
        buttons.forEach((b, j) => {
          b.disabled = true;
          b.style.opacity = "1";
          if (j === sc.ok) { b.style.borderColor = V.color("positive"); b.style.background = "#eefaf1"; }
          if (j === k && !right) { b.style.borderColor = V.color("negative"); b.style.background = "#fdeeec"; }
        });

        reveal.style.display = "block";
        reveal.className = "callout " + (right ? "key" : "warn");
        const verdict = right
          ? "Correct."
          : `Not quite. You chose "${PRINCIPLES[k]}".`;
        reveal.innerHTML = `<span class="label">${right ? "Right call" : "The answer is " + PRINCIPLES[sc.ok]}</span>${verdict} ${sc.why}`;

        bNext.disabled = false;
        if (pos === SCENARIOS.length - 1) bNext.textContent = "See results →";
        refreshStats();
        paintBoard();
      }

      function finish() {
        const correct = results.filter((r) => r === true).length;
        scen.className = "callout key";
        scen.innerHTML = `<span class="label">All ${SCENARIOS.length} judged</span>
          You called <b>${correct} of ${SCENARIOS.length}</b> correctly.
          The hardest line to hold in practice is the last one: when a cleaner dataset would help the study,
          the subject's welfare still comes first.`;
        optsWrap.innerHTML = "";
        reveal.style.display = "none";
        bNext.disabled = true;
        bNext.textContent = "Next scenario →";
        paintBoard();
      }

      bNext.addEventListener("click", () => {
        if (!answered) return;
        if (pos === SCENARIOS.length - 1) { finish(); return; }
        pos++;
        showScenario();
      });
      bRestart.addEventListener("click", () => {
        for (let i = 0; i < results.length; i++) results[i] = null;
        pos = 0;
        bNext.textContent = "Next scenario →";
        refreshStats();
        showScenario();
      });

      refreshStats();
      showScenario();

      /* ---- Yucatan consent table ---- */
      const yuc = V.el("div.card");
      yuc.innerHTML = `
        <h3>Consent in practice: the Yucatan study</h3>
        <p class="muted small" style="margin:-2px 0 12px">
          One field study in the Yucatan region recorded how many eligible people, asked properly,
          agreed to take part. Consent rates were almost universal.</p>
        <table class="data">
          <thead><tr><th>Group</th><th>Eligible</th><th>Consented</th><th>Rate</th></tr></thead>
          <tbody>
            <tr><td>Spanish speakers</td><td>2,103</td><td>2,099</td><td>99.8%</td></tr>
            <tr><td>Mayan speakers</td><td>409</td><td>409</td><td>100.0%</td></tr>
            <tr class="total"><td>Total</td><td>2,512</td><td>2,508</td><td>99.8%</td></tr>
          </tbody>
        </table>
        <div class="callout" style="margin-top:14px"><span class="label">Why this is striking</span>
          Nearly everyone asked, in both language groups, agreed. A high consent rate does not by itself
          prove the consent was informed and free, but when subjects are approached honestly and given a
          real choice, refusal is rare. Done right, ethics and participation are not in tension.</div>`;
      container.appendChild(yuc);
    },

    teardown() {},
  };
})();
