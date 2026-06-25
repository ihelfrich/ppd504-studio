/* =====================================================================
   w1-bias, Sampling Bias Gallery
   Four ways a sample lies about its population, made visible. For the
   first three (voluntary response, undercoverage, nonresponse) we know
   the TRUE proportion, apply a biased selection mechanism to a grid of
   dots, and watch the estimate drift away from the truth. The fourth is
   Abraham Wald's WWII bomber: the holes you see are on the survivors.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w1-bias"] = {
    render(container) {
      P.lessonHeader(container, "w1-bias",
        "A biased design does not just add noise: it tilts every sample the same way, " +
        "so collecting more data only sharpens the wrong answer. Here are four tilts you can see.");

      /* ---------- concept card ---------- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>When the sample lies in a direction</h3>
        <div class="callout"><span class="label">Bias is a tilt, not a wobble</span>
          Random error shrinks as the sample grows. Bias does not. A biased method
          systematically favors some outcomes, so the estimate sits off-target no matter
          how many people you reach. The size of that gap is what these labs measure:
          ${V.fml.block(`bias = estimate &minus; truth`)}
        </div>
        <div class="callout"><span class="label">Voluntary response</span>
          People opt in. The ones with the strongest feelings (often the angriest) answer,
          so the loud minority speaks for the quiet majority. Think of a website poll or a
          call-in radio survey.
        </div>
        <div class="callout"><span class="label">Undercoverage and nonresponse</span>
          Undercoverage leaves whole groups out of the list you sample from (a phone survey
          misses people without phones). Nonresponse happens when chosen people will not or
          cannot answer, and the people who skip differ from those who reply.
        </div>
        <div class="callout key"><span class="label">Survivorship</span>
          The data you see has already been filtered by survival. In 1943 the statistician
          Abraham Wald noticed the Navy wanted armor where returning bombers had bullet holes.
          He flipped it: the planes hit elsewhere never came back, so armor belongs where the
          survivors show <b>no</b> holes.
        </div>`;
      container.appendChild(concept);

      /* ---------- interactive lab ---------- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>The gallery</h3>
        <p>Pick a bias. For the first three, blue dots are the sample's targets, faded dots are
        ignored; watch the biased estimate drift off the true value. The last is Wald's bomber.</p>
      </div>`;
      const body = V.el("div.lab-body");

      /* mode selector */
      const seg = V.el("div.seg");
      const MODES = ["Voluntary response", "Undercoverage", "Nonresponse", "Survivorship"];
      MODES.forEach((t, i) => {
        const b = V.el("button", { text: t });
        if (i === 0) b.classList.add("active");
        b.dataset.mode = t;
        seg.appendChild(b);
      });
      body.appendChild(V.el("div.control", { style: { marginBottom: "12px" } },
        [V.el("label", { text: "Bias type" }), seg]));

      /* per-mode caption */
      const caption = V.el("div.callout", { style: { margin: "0 0 14px" } });
      body.appendChild(caption);

      /* plot host */
      const plot = V.el("div");
      body.appendChild(plot);

      /* readouts (used by the proportion modes) */
      const stats = V.el("div.stat-row", { style: { marginTop: "12px" } });
      const sTrue = V.stat("True %", "—", "");
      const sEst = V.stat("Estimate %", "—", "bad");
      const sBias = V.stat("Bias", "—", "accent");
      const sSeen = V.stat("Counted", "—", "");
      [sTrue, sEst, sBias, sSeen].forEach((s) => stats.appendChild(s));
      sTrue.querySelector(".v").style.color = V.color("positive");
      body.appendChild(stats);

      /* legend (proportion modes) */
      const legend = V.el("div.legend", { style: { marginTop: "10px" } });
      body.appendChild(legend);

      /* survivorship toggle (hidden unless in that mode) */
      const planeControls = V.el("div", { style: { marginTop: "8px", display: "none" } });
      const planeSeg = V.el("div.seg");
      ["Armor where the holes are", "Armor where there are NO holes"].forEach((t, i) => {
        const b = V.el("button", { text: t });
        if (i === 0) b.classList.add("active");
        b.dataset.armor = i;
        planeSeg.appendChild(b);
      });
      planeControls.appendChild(V.el("div.control", null,
        [V.el("label", { text: "Where would you add armor?" }), planeSeg]));
      body.appendChild(planeControls);

      lab.appendChild(body);
      container.appendChild(lab);

      /* ---------- quick check ---------- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">A news website posts the question "Should the city raise the sales tax?"
          and lets readers click Yes or No. 9,000 readers respond and 78% click No. What is the
          main problem with treating 78% as the city's opinion?</div>
          <button class="opt" data-ok="0">Nothing: 9,000 is a large sample, so it is reliable</button>
          <button class="opt" data-ok="1">Voluntary response: people who hate the tax are far more likely to click</button>
          <button class="opt" data-ok="0">Nonresponse: the website should have followed up with non-clickers</button>
          <button class="opt" data-ok="0">Undercoverage: the website left out readers who saw the poll</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);

      /* =================================================================
         DOT-GRID MODES (voluntary response, undercoverage, nonresponse)
         A 12 x 8 grid of 96 "people", each either a YES (holds the
         opinion) or a NO. The true % is fixed and known. Each mechanism
         decides which dots get counted, producing a biased estimate.
         ================================================================= */
      const COLS = 12, ROWS = 8, NDOTS = COLS * ROWS;
      const rand = S.rng(70423);            // seeded: same gallery every visit

      /* Build the population once. ~45% true YES, scattered at random. */
      const people = [];
      for (let i = 0; i < NDOTS; i++) {
        const col = i % COLS, row = Math.floor(i / COLS);
        people.push({
          i, col, row,
          yes: rand() < 0.45,               // the trait we want to estimate
          // a "loudness" used by voluntary response (strong-opinion people answer)
          loud: rand(),
          // group membership 0/1 used by undercoverage + nonresponse
          group: col < 4 ? 1 : 0,           // left third = the missed/reluctant group
          resp: rand(),                     // response propensity for nonresponse
        });
      }
      const TRUE = people.filter((p) => p.yes).length / NDOTS;

      /* selection mechanisms: return boolean "counted?" per person */
      const mechanisms = {
        "Voluntary response": (p) => {
          // strong-opinion people opt in; here YES-holders feel strongly and click
          // more often, so they are over-represented among responders.
          const opt = p.yes ? 0.85 : 0.25;
          return p.loud < opt;
        },
        "Undercoverage": (p) => {
          // the sampling frame simply omits group 1 (e.g. no landline). They are
          // never even eligible, so their YES rate is invisible.
          return p.group === 0;
        },
        "Nonresponse": (p) => {
          // everyone is contacted, but group 1 answers far less often, and within
          // each group the YES-holders are a bit more willing to talk.
          const base = p.group === 1 ? 0.30 : 0.80;
          const bump = p.yes ? 0.10 : 0;
          return p.resp < base + bump;
        },
      };

      const captions = {
        "Voluntary response": {
          cls: "callout warn",
          html: `<span class="label">Voluntary response</span> Only people who feel strongly
            bother to answer. The strong-opinion side (here the Yes voters) clicks far more often,
            so it dominates the count. Real example: a magazine asks readers to mail in a coupon
            saying whether they regret having children.`,
        },
        "Undercoverage": {
          cls: "callout warn",
          html: `<span class="label">Undercoverage</span> The left group is never on the list you
            draw from, so its opinions cannot enter the estimate at all. Real example: the 1936
            <i>Literary Digest</i> poll sampled car and phone owners, missing poorer voters, and
            confidently predicted the wrong president.`,
        },
        "Nonresponse": {
          cls: "callout warn",
          html: `<span class="label">Nonresponse</span> Everyone is contacted, but the left group
            rarely answers. Because that group differs in opinion, the people who do answer give a
            tilted picture. Real example: a daytime phone survey reaches retirees but not workers.`,
        },
        "Survivorship": {
          cls: "callout key",
          html: `<span class="label">Survivorship</span> Each red dot is a bullet hole on a bomber
            that <b>came home</b>. The planes hit in the bare areas (engines, cockpit) did not
            return, so they are absent from the data. Wald's lesson: reinforce the places the
            survivors were <b>not</b> hit.`,
        },
      };

      /* d3 scaffold for the dot grid */
      const dims = V.svg(plot, { height: 300, margin: { top: 16, right: 16, bottom: 64, left: 16 } });
      const g = dims.g;
      const cellW = dims.innerW / COLS;
      const cellH = (dims.innerH - 40) / ROWS;
      const rDot = Math.min(cellW, cellH) * 0.34;
      const cx = (p) => p.col * cellW + cellW / 2;
      const cy = (p) => p.row * cellH + cellH / 2;
      const tip = V.tooltip();

      const gridG = g.append("g");
      const barG = g.append("g").attr("transform", `translate(0,${dims.innerH - 24})`);
      const planeG = g.append("g").style("display", "none");

      function drawGrid(mode) {
        planeG.style("display", "none");
        gridG.style("display", null);
        barG.style("display", null);

        const test = mechanisms[mode];
        const counted = people.filter(test);
        const est = counted.length ? counted.filter((p) => p.yes).length / counted.length : NaN;

        const sel = gridG.selectAll("circle.person").data(people, (d) => d.i);
        sel.enter().append("circle").attr("class", "person")
            .attr("r", rDot).attr("stroke", "#fff").attr("stroke-width", 1)
            .on("mouseover", (ev, d) => tip.show(
              (d.yes ? "<b>Yes</b> voter" : "<b>No</b> voter") +
              "<br>" + (test(d) ? "counted" : "not counted"), ev))
            .on("mousemove", (ev) => tip.move(ev))
            .on("mouseout", () => tip.hide())
          .merge(sel)
            .attr("cx", cx).attr("cy", cy)
            .transition().duration(420)
            .attr("fill", (d) => test(d) ? (d.yes ? V.color("c-blue") : V.color("ink-400"))
                                         : V.color("ink-100"))
            .attr("fill-opacity", (d) => test(d) ? 0.95 : 0.5)
            .attr("stroke", (d) => test(d) ? "#fff" : V.color("ink-200"));

        /* truth-vs-estimate mini bars */
        const barY = d3.scaleLinear().domain([0, 1]).range([0, 1]);
        const barData = [
          { label: "True", val: TRUE, color: V.color("positive") },
          { label: "Estimate", val: est, color: V.color("c-red") },
        ];
        const fullW = dims.innerW;
        const bsel = barG.selectAll("g.bar").data(barData, (d) => d.label);
        const benter = bsel.enter().append("g").attr("class", "bar");
        benter.append("text").attr("class", "blab")
          .attr("y", 4).attr("font-size", 11).attr("font-weight", 700)
          .attr("fill", V.color("ink-600"));
        benter.append("rect").attr("class", "btrack").attr("height", 9).attr("rx", 4)
          .attr("fill", V.color("ink-100"));
        benter.append("rect").attr("class", "bfill").attr("height", 9).attr("rx", 4);
        benter.append("text").attr("class", "bval").attr("y", 4).attr("font-size", 11)
          .attr("font-weight", 700).attr("text-anchor", "start");

        const labW = 64, trackX = labW, trackW = fullW - labW - 44;
        const merged = benter.merge(bsel);
        merged.attr("transform", (d, k) => `translate(0,${k * 16})`);
        merged.select(".blab").attr("x", 0).text((d) => d.label);
        merged.select(".btrack").attr("x", trackX).attr("width", trackW);
        merged.select(".bfill").attr("x", trackX).attr("fill", (d) => d.color)
          .transition().duration(420)
          .attr("width", (d) => isFinite(d.val) ? barY(d.val) * trackW : 0);
        merged.select(".bval")
          .attr("x", (d) => trackX + (isFinite(d.val) ? barY(d.val) * trackW : 0) + 6)
          .attr("fill", (d) => d.color)
          .text((d) => isFinite(d.val) ? Math.round(d.val * 100) + "%" : "—");

        /* readouts */
        sTrue.set(Math.round(TRUE * 100) + "%");
        sEst.set(isFinite(est) ? Math.round(est * 100) + "%" : "—");
        const bias = isFinite(est) ? (est - TRUE) * 100 : NaN;
        sBias.set(isFinite(bias) ? (bias >= 0 ? "+" : "") + Math.round(bias) + " pts" : "—");
        sSeen.set(counted.length + " / " + NDOTS);

        stats.style.display = "flex";
        legend.style.display = "flex";
        legend.innerHTML =
          `<span class="swatch"><i style="background:${V.color("c-blue")}"></i>Counted, Yes</span>` +
          `<span class="swatch"><i style="background:${V.color("ink-400")}"></i>Counted, No</span>` +
          `<span class="swatch"><i style="background:${V.color("ink-100")};border:1px solid ${V.color("ink-200")}"></i>Ignored by this method</span>`;
        planeControls.style.display = "none";
      }

      /* =================================================================
         SURVIVORSHIP MODE, Wald's bomber
         ================================================================= */
      let armorMode = 0;   // 0 = where the holes are (naive), 1 = where no holes (Wald)

      // bullet holes ONLY on survivors: clustered on wings, tail, fuselage mid.
      // The bare zones (nose/cockpit and the two engines) are where lost planes
      // were hit. Coordinates are in the plot's inner pixel space.
      const holes = [
        [350, 70], [365, 95], [332, 60], [300, 80], [410, 105], [430, 90],
        [250, 110], [220, 95], [200, 120], [470, 130], [300, 150], [340, 160],
        [380, 140], [275, 138], [410, 160], [240, 150], [180, 135], [500, 150],
        [320, 110], [360, 118], [290, 100], [440, 125], [205, 165], [475, 110],
      ];
      // armor target zones (cx, cy, rx, ry)
      const holeZones = [   // naive: cover the wings/tail where holes cluster
        { x: 330, y: 110, rx: 150, ry: 55 },
      ];
      const bareZones = [   // Wald: nose/cockpit + the two engine nacelles
        { x: 558, y: 95, rx: 46, ry: 26 },   // nose / cockpit
        { x: 300, y: 70, rx: 40, ry: 18 },   // left engine
        { x: 300, y: 150, rx: 40, ry: 18 },  // right engine
      ];

      function drawPlane() {
        gridG.style("display", "none");
        barG.style("display", "none");
        stats.style.display = "none";
        legend.style.display = "none";
        planeControls.style.display = "block";
        planeG.style("display", null);

        planeG.selectAll("*").remove();
        const ink = V.color("ink-700"), fill = V.color("ink-100"), line = V.color("ink-300");

        // simple top-down bomber silhouette built from ellipses + polygons
        // fuselage
        planeG.append("ellipse").attr("cx", 330).attr("cy", 110).attr("rx", 250).attr("ry", 26)
          .attr("fill", fill).attr("stroke", line).attr("stroke-width", 1.5);
        // nose
        planeG.append("ellipse").attr("cx", 560).attr("cy", 110).attr("rx", 34).attr("ry", 20)
          .attr("fill", fill).attr("stroke", line).attr("stroke-width", 1.5);
        // wings (one big swept shape)
        planeG.append("polygon")
          .attr("points", "230,108 360,108 320,18 280,18")
          .attr("fill", fill).attr("stroke", line).attr("stroke-width", 1.5);
        planeG.append("polygon")
          .attr("points", "230,112 360,112 320,202 280,202")
          .attr("fill", fill).attr("stroke", line).attr("stroke-width", 1.5);
        // tailplane
        planeG.append("polygon")
          .attr("points", "100,108 150,108 135,66 118,66")
          .attr("fill", fill).attr("stroke", line).attr("stroke-width", 1.5);
        planeG.append("polygon")
          .attr("points", "100,112 150,112 135,154 118,154")
          .attr("fill", fill).attr("stroke", line).attr("stroke-width", 1.5);
        // engine nacelles on the wings
        [70, 150].forEach((wy) => {
          planeG.append("ellipse").attr("cx", 300).attr("cy", wy).attr("rx", 22).attr("ry", 12)
            .attr("fill", fill).attr("stroke", line).attr("stroke-width", 1.5);
        });

        // armor patch (drawn under the holes so holes stay visible)
        const zones = armorMode === 0 ? holeZones : bareZones;
        const armorColor = armorMode === 0 ? V.color("c-red") : V.color("positive");
        planeG.selectAll("ellipse.armor").data(zones).enter().append("ellipse")
          .attr("class", "armor")
          .attr("cx", (d) => d.x).attr("cy", (d) => d.y).attr("rx", 0).attr("ry", 0)
          .attr("fill", armorColor).attr("fill-opacity", 0.22)
          .attr("stroke", armorColor).attr("stroke-width", 2).attr("stroke-dasharray", "5 3")
          .transition().duration(450)
          .attr("rx", (d) => d.rx).attr("ry", (d) => d.ry);

        // bullet holes (survivors only)
        planeG.selectAll("circle.hole").data(holes).enter().append("circle")
          .attr("class", "hole")
          .attr("cx", (d) => d[0]).attr("cy", (d) => d[1]).attr("r", 0)
          .attr("fill", V.color("c-red")).attr("fill-opacity", 0.9)
          .attr("stroke", "#fff").attr("stroke-width", 1)
          .transition().delay((d, i) => i * 12).duration(260)
          .attr("r", 4.5);

        // label for the engine/nose bare zone
        planeG.append("text").attr("x", 330).attr("y", dims.innerH - 38)
          .attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", 700)
          .attr("fill", ink)
          .text(armorMode === 0
            ? "Naive: armor the wings and tail (where survivors were hit)"
            : "Wald: armor the nose and engines (where survivors were NOT hit)");
        planeG.append("text").attr("x", 330).attr("y", dims.innerH - 22)
          .attr("text-anchor", "middle").attr("font-size", 11)
          .attr("fill", V.color("muted"))
          .text(armorMode === 0
            ? "But planes hit there mostly came back, so the armor is wasted."
            : "Planes hit there did not return, which is why those spots look clean.");
      }

      /* ---------- mode wiring ---------- */
      let mode = MODES[0];
      function showMode(m) {
        mode = m;
        const cap = captions[m];
        caption.className = cap.cls;
        caption.innerHTML = cap.html;
        if (m === "Survivorship") drawPlane();
        else drawGrid(m);
      }

      seg.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        seg.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        showMode(b.dataset.mode);
      });
      planeSeg.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        planeSeg.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        armorMode = +b.dataset.armor;
        drawPlane();
      });

      showMode(MODES[0]);
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
        ? "Right. A click-to-answer poll is the textbook voluntary-response design: nobody is chosen, people opt in, and the ones with the strongest feelings (here, tax opponents) are far likelier to bother. The 9,000 figure makes it precise, not unbiased."
        : "Not quite. Nobody was sampled or contacted, so this is not undercoverage or nonresponse, and the large count does not fix it. People chose to respond, and the angriest self-select in: that is voluntary-response bias.";
    }));
  }
})();
