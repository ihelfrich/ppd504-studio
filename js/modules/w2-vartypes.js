/* =====================================================================
   w2-vartypes, Types of variables
   A classification game. The user sorts twelve real policy variables into
   nominal, ordinal, discrete, or continuous, gets a one-line reason on
   every guess, and watches a running score. A decision-flow guide sits
   alongside so the rule is always in view.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w2-vartypes"] = {
    render(container) {
      P.lessonHeader(container, "w2-vartypes",
        "Before you can summarize a variable you have to know what kind it is. " +
        "A ZIP code is a number you should never average; a satisfaction rating has order but no fixed spacing; a count is not the same as a measurement. " +
        "Sort each one correctly and the right statistics follow.");

      /* ---------- concept card ---------- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>Four kinds of variable</h3>
        <div class="callout"><span class="label">Qualitative, categorical</span>
          Values are labels, not amounts. <b>Nominal</b> means the categories have no order
          (agency name, ZIP code, census tract). <b>Ordinal</b> means they are ordered but the
          gaps between them are not guaranteed equal (a 1 to 5 satisfaction scale, a letter grade).
          The step from "Fair" to "Good" need not equal the step from "Good" to "Excellent".
        </div>
        <div class="callout"><span class="label">Quantitative, numeric</span>
          Values are real amounts, so differences carry meaning. <b>Discrete</b> means countable,
          usually whole numbers with gaps between them (number of transit trips, number of employees).
          <b>Continuous</b> means any value on a scale, limited only by how finely you measure
          (height, income, temperature).
        </div>
        <div class="callout key"><span class="label">The test that sorts them</span>
          ${V.fml.block(`<i>differences meaningful?</i> &rarr; quantitative &nbsp;&middot;&nbsp; <i>else</i> &rarr; categorical`)}
          Once you know it is categorical, ask whether the labels have a natural order. Once you know
          it is quantitative, ask whether you are counting (discrete) or measuring (continuous). A
          discrete variable with very many possible values, like household income in whole dollars,
          is often treated as continuous because the gaps are tiny.
        </div>`;
      container.appendChild(concept);

      /* ---------- interactive lab ---------- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Classify the variable</h3>
        <p>Read the example, pick its type, and check the reason. The decision flow on the right is the rule you are applying.</p>
      </div>`;
      const body = V.el("div.lab-body");

      /* two-column layout: card + buttons on the left, flow guide on the right */
      const layout = V.el("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: "20px", alignItems: "start" } });

      /* --- left column --- */
      const left = V.el("div");

      const progress = V.el("div", {
        style: { fontSize: "12px", color: "var(--muted)", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase", letterSpacing: ".04em" },
      });
      left.appendChild(progress);

      const cardBox = V.el("div", {
        style: {
          border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--ink-50)",
          padding: "22px 20px", textAlign: "center", minHeight: "92px",
          display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px",
        },
      });
      const cardCat = V.el("div", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".07em", color: "var(--cardinal)" } });
      const cardText = V.el("div", { style: { fontSize: "21px", fontWeight: "700", color: "var(--ink-900)", lineHeight: "1.25" } });
      cardBox.appendChild(cardCat);
      cardBox.appendChild(cardText);
      left.appendChild(cardBox);

      /* answer buttons, four choices */
      const choices = [
        { key: "nominal", label: "Nominal", sub: "categorical, no order" },
        { key: "ordinal", label: "Ordinal", sub: "categorical, ordered" },
        { key: "discrete", label: "Discrete", sub: "quantitative, counted" },
        { key: "continuous", label: "Continuous", sub: "quantitative, measured" },
      ];
      const btnGrid = V.el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px", marginTop: "12px" } });
      const answerButtons = {};
      choices.forEach((c) => {
        const b = V.el("button.btn", {
          html: `${c.label}<br><span class="muted" style="font-weight:500;font-size:11px">${c.sub}</span>`,
          style: { padding: "10px 12px", lineHeight: "1.3", textAlign: "center", whiteSpace: "normal" },
        });
        b.dataset.key = c.key;
        answerButtons[c.key] = b;
        btnGrid.appendChild(b);
      });
      left.appendChild(btnGrid);

      const feedback = V.el("div.callout", { style: { marginTop: "12px", display: "none" } });
      left.appendChild(feedback);

      const navRow = V.el("div.btn-row", { style: { marginTop: "12px" } });
      const bNext = V.el("button.btn.primary", { text: "Next card →" });
      bNext.disabled = true;
      navRow.appendChild(bNext);
      left.appendChild(navRow);

      /* --- right column: decision flow + score --- */
      const right = V.el("div");

      const scoreRow = V.el("div.stat-row", { style: { marginTop: "0", marginBottom: "14px" } });
      const sScore = V.stat("Score", "0 / 0", "accent");
      const sStreak = V.stat("Streak", "0", "good");
      [sScore, sStreak].forEach((s) => scoreRow.appendChild(s));
      right.appendChild(scoreRow);

      const flow = V.el("div", { style: { border: "1px solid var(--line)", borderRadius: "var(--r-md)", overflow: "hidden" } });
      flow.appendChild(buildFlowSVG());
      right.appendChild(flow);

      layout.appendChild(left);
      layout.appendChild(right);
      body.appendChild(layout);
      lab.appendChild(body);

      const controls = V.el("div.lab-controls");
      const bReset = V.el("button.btn.ghost", { text: "Restart game" });
      bReset.onclick = () => start();
      controls.appendChild(V.el("div.control", null, [V.el("label", { text: "Game" }), V.el("div.btn-row", null, [bReset])]));
      lab.appendChild(controls);
      container.appendChild(lab);

      /* ---------- the deck ---------- */
      const DECK = [
        { text: "Government agency name", type: "nominal",
          why: "Labels with no inherent order. Naming the Department of Transportation before the EPA carries no numeric meaning." },
        { text: "ZIP code", type: "nominal",
          why: "It looks numeric but it is a label for a place. Averaging two ZIP codes is meaningless, so it is nominal." },
        { text: "Job satisfaction, 1 to 5 scale", type: "ordinal",
          why: "The categories are ordered (5 beats 1), but the gap from 1 to 2 need not equal the gap from 4 to 5." },
        { text: "Satisfied / neither / unsatisfied", type: "ordinal",
          why: "Three ordered categories with no fixed numeric spacing between them: ordinal." },
        { text: "Number of days you took transit last week", type: "discrete",
          why: "A count. It runs 0 through 7 in whole steps, so it is quantitative and discrete." },
        { text: "Height in inches", type: "continuous",
          why: "A measurement that can take any value on a scale (68.4 in, 68.41 in): quantitative and continuous." },
        { text: "Household income", type: "continuous",
          why: "Differences are real dollars and the scale is fine-grained, so income is treated as continuous." },
        { text: "Number of employees at DoD", type: "discrete",
          why: "A head count: you cannot have 2.5 employees. Quantitative and discrete." },
        { text: "Letter grade", type: "ordinal",
          why: "A through F is ordered, but the distance from A to B is not a fixed number: ordinal, not quantitative." },
        { text: "Temperature in degrees Fahrenheit", type: "continuous",
          why: "Differences are meaningful and the scale is continuous: 71.3 degrees is a valid reading." },
        { text: "Census tract", type: "nominal",
          why: "A coded geographic label. The number identifies an area, it does not measure anything, so it is nominal." },
        { text: "Years of education", type: "discrete",
          why: "Typically recorded as whole years completed, a count: quantitative and discrete. (With many fine values it is sometimes treated as continuous.)" },
      ];

      /* ---------- game state ---------- */
      let order = [];
      let idx = 0;
      let score = 0;
      let answered = 0;
      let streak = 0;
      let locked = false;
      const rand = S.rng(504); // reproducible shuffle

      function start() {
        order = S.shuffle(DECK, rand);
        idx = 0; score = 0; answered = 0; streak = 0; locked = false;
        sScore.set("0 / 0");
        sStreak.set("0");
        showCard();
      }

      function showCard() {
        locked = false;
        bNext.disabled = true;
        feedback.style.display = "none";
        Object.values(answerButtons).forEach((b) => {
          b.disabled = false;
          b.classList.remove("primary");
          b.style.borderColor = "var(--line)";
          b.style.background = "var(--paper)";
        });
        if (idx >= order.length) { finish(); return; }
        const item = order[idx];
        progress.textContent = `Card ${idx + 1} of ${order.length}`;
        cardCat.textContent = "Which type is this variable?";
        cardText.textContent = item.text;
        bNext.textContent = idx === order.length - 1 ? "See results →" : "Next card →";
      }

      function answer(picked) {
        if (locked) return;
        locked = true;
        const item = order[idx];
        const correct = item.type === picked;
        answered++;
        if (correct) { score++; streak++; } else { streak = 0; }
        sScore.set(`${score} / ${answered}`);
        sStreak.set(String(streak));

        Object.values(answerButtons).forEach((b) => { b.disabled = true; });
        // mark the right answer green, and the wrong pick red
        const right = answerButtons[item.type];
        right.style.borderColor = "var(--positive)";
        right.style.background = "#eefaf1";
        if (!correct) {
          const wrong = answerButtons[picked];
          wrong.style.borderColor = "var(--negative)";
          wrong.style.background = "#fdeeec";
        }

        const label = choices.find((c) => c.key === item.type).label;
        feedback.style.display = "block";
        feedback.className = "callout " + (correct ? "key" : "warn");
        feedback.innerHTML = `<span class="label">${correct ? "Correct" : "Not quite, it is " + label}</span> ${item.why}`;
        bNext.disabled = false;
      }

      Object.keys(answerButtons).forEach((k) => {
        answerButtons[k].onclick = () => answer(k);
      });
      bNext.onclick = () => { idx++; showCard(); };

      function finish() {
        progress.textContent = "Game complete";
        cardCat.textContent = "Final score";
        cardText.textContent = `${score} of ${order.length} correct`;
        Object.values(answerButtons).forEach((b) => { b.disabled = true; });
        feedback.style.display = "block";
        const pct = order.length ? Math.round((100 * score) / order.length) : 0;
        let note;
        if (pct === 100) note = "Clean sweep. You are reliably separating labels from counts from measurements.";
        else if (pct >= 75) note = "Strong. The usual traps are the numeric-looking labels (ZIP code, census tract) and ordered categories with uneven gaps (satisfaction, letter grade).";
        else note = "Worth a second pass. Run the two questions in order: are differences meaningful, then is it ordered or counted.";
        feedback.className = "callout key";
        feedback.innerHTML = `<span class="label">${pct}% correct</span> ${note}`;
        bNext.disabled = true;
        bNext.textContent = "Next card →";
      }

      start();

      /* ---------- closing summary ---------- */
      const summary = V.el("div.card");
      summary.innerHTML = `
        <h3>The one habit to keep</h3>
        <div class="callout key"><span class="label">Numbers are not always quantitative</span>
          The single most common mistake is treating any digits as an amount. ZIP codes, census tracts,
          and 1 to 5 rating codes are stored as numbers but you should never add or average them. Always
          ask what the number stands for before you reach for a mean.
        </div>`;
      container.appendChild(summary);

      /* ---------- quick check ---------- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">A survey records each respondent's ZIP code and a satisfaction rating from 1 to 5.
          How should these two variables be classified?</div>
          <button class="opt" data-ok="0">ZIP code is discrete, rating is continuous</button>
          <button class="opt" data-ok="1">ZIP code is nominal, rating is ordinal</button>
          <button class="opt" data-ok="0">Both are quantitative because both are numbers</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* ---------- real course exercise ---------- */
      P.renderPractice(container, "w3-prob-rules");

      /* ---------- the decision-flow SVG ---------- */
      function buildFlowSVG() {
        const holder = V.el("div");
        const dims = V.svg(holder, { height: 320, margin: { top: 14, right: 12, bottom: 12, left: 12 } });
        const g = dims.g;
        const W = dims.innerW;

        const ink = V.color("ink-700");
        const line = V.color("ink-300");
        const cardinal = V.color("cardinal");
        const cBlue = V.color("c-blue");
        const cGreen = V.color("c-green");
        const fillSoft = V.color("ink-50");

        // helper: a decision/leaf box centered at (cx, cy)
        function box(cx, cy, w, h, fill, stroke, label, sub) {
          g.append("rect")
            .attr("x", cx - w / 2).attr("y", cy - h / 2)
            .attr("width", w).attr("height", h).attr("rx", 8)
            .attr("fill", fill).attr("stroke", stroke).attr("stroke-width", 1.4);
          g.append("text")
            .attr("x", cx).attr("y", cy + (sub ? -3 : 4))
            .attr("text-anchor", "middle").attr("font-size", 11.5).attr("font-weight", 700)
            .attr("fill", ink).text(label);
          if (sub) {
            g.append("text")
              .attr("x", cx).attr("y", cy + 11)
              .attr("text-anchor", "middle").attr("font-size", 9.5)
              .attr("fill", V.color("ink-500")).text(sub);
          }
        }
        // helper: connector with a yes/no edge label
        function link(x1, y1, x2, y2, lbl, lblColor) {
          g.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
            .attr("stroke", line).attr("stroke-width", 1.4);
          if (lbl) {
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            g.append("text").attr("x", mx).attr("y", my - 2)
              .attr("text-anchor", "middle").attr("font-size", 9.5).attr("font-weight", 700)
              .attr("fill", lblColor || V.color("ink-500")).text(lbl);
          }
        }

        const cx = W / 2;
        const lx = W * 0.24, rx = W * 0.76;
        const bw = Math.min(150, W * 0.46), bh = 38;
        const leafW = Math.min(108, W * 0.34), leafH = 34;

        const yTop = 20, yMid = 130, yLeaf = 250;

        // top decision
        box(cx, yTop, Math.min(190, W * 0.9), bh, "#fff9ec", V.color("gold"),
            "Differences meaningful?", "is it a real amount");

        // branch labels into the two mid decisions
        link(cx - 30, yTop + bh / 2, lx, yMid - bh / 2, "no", cardinal);
        link(cx + 30, yTop + bh / 2, rx, yMid - bh / 2, "yes", cGreen);

        // mid decisions
        box(lx, yMid, bw * 0.92, bh, fillSoft, cardinal, "Ordered?", "do labels rank");
        box(rx, yMid, bw * 0.92, bh, fillSoft, cBlue, "Counted?", "whole-number tally");

        // leaves under the left (categorical) decision
        link(lx - 18, yMid + bh / 2, lx - leafW * 0.55, yLeaf - leafH / 2, "no", cardinal);
        link(lx + 18, yMid + bh / 2, lx + leafW * 0.55, yLeaf - leafH / 2, "yes", cGreen);
        box(lx - leafW * 0.55, yLeaf, leafW * 0.86, leafH, "#fff", cardinal, "Nominal");
        box(lx + leafW * 0.55, yLeaf, leafW * 0.86, leafH, "#fff", cardinal, "Ordinal");

        // leaves under the right (quantitative) decision
        link(rx - 18, yMid + bh / 2, rx - leafW * 0.55, yLeaf - leafH / 2, "no", cardinal);
        link(rx + 18, yMid + bh / 2, rx + leafW * 0.55, yLeaf - leafH / 2, "yes", cGreen);
        box(rx - leafW * 0.55, yLeaf, leafW * 0.86, leafH, "#fff", cBlue, "Continuous");
        box(rx + leafW * 0.55, yLeaf, leafW * 0.86, leafH, "#fff", cBlue, "Discrete");

        return holder;
      }
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
        ? "Right. A ZIP code is a label for a place (nominal), and a 1 to 5 rating is ordered but with no guaranteed equal spacing (ordinal). Neither should be averaged as if it were an amount."
        : "Not quite. Both are stored as numbers, but a ZIP code is a nominal label (averaging it is meaningless) and a 1 to 5 rating is ordinal (ordered, but the gaps are not fixed amounts).";
    }));
  }
})();
