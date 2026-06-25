/* =====================================================================
   w4-twoway, Two-way tables: joint, marginal, conditional
   One table of counts, four ways to read it. Toggle between raw counts,
   percent of the grand total (joint), row percents, and column percents,
   then click any group to see its conditional distribution as a bar chart.
   Survey data: do you think a woman with young children should work
   outside the home, stay home, or you have no preference, broken out by
   sex and college education (n = 1012).
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504, S = P.stats, V = P.viz, d3 = window.d3;

  P.modules["w4-twoway"] = {
    render(container) {
      P.lessonHeader(container, "w4-twoway",
        "A two-way table counts people by two things at once. Read it down the columns, " +
        "across the rows, or cell by cell, and the same 1,012 survey answers tell three " +
        "different stories: how the whole sample splits, how each group splits, and how the two overlap.");

      /* ---------- the slide data ---------- */
      const colNames = ["Job outside home", "Stay home", "No preference"];
      const rows = [
        { name: "Women, no college",   counts: [81, 104, 10] },
        { name: "Women, college",      counts: [173, 115, 15] },
        { name: "Men, no college",     counts: [92, 32, 2] },
        { name: "Men, college",        counts: [299, 81, 8] },
      ];
      const grand = S.sum(rows.map((r) => S.sum(r.counts)));        // 1012
      const colTotals = colNames.map((_, j) => S.sum(rows.map((r) => r.counts[j])));
      const rowTotals = rows.map((r) => S.sum(r.counts));

      /* ---------- concept card ---------- */
      const concept = V.el("div.card");
      concept.innerHTML = `
        <h3>One table, three distributions</h3>
        <div class="callout"><span class="label">Joint distribution</span>
          Each cell divided by the grand total. It answers "what share of <i>everyone</i> is in this
          exact combination?" The joint cells sum to 100% across the whole table.
          ${V.fml.inline(`joint = ${V.fml.frac("cell count", "grand total")}`)}
        </div>
        <div class="callout"><span class="label">Marginal distribution</span>
          The row totals (or the column totals) on their own, ignoring the other variable. The right
          margin gives the distribution of sex-by-education; the bottom margin gives the distribution
          of opinion. Each margin divided by the grand total is a one-variable distribution.
        </div>
        <div class="callout key"><span class="label">Conditional distribution</span>
          Pick one group and look only at that row (or column). A row's cells divided by that row's
          total answer "<i>among this group</i>, how do opinions split?" Comparing the conditional
          distributions across groups is how you see whether opinion depends on sex and education.
          ${V.fml.inline(`row % = ${V.fml.frac("cell count", "row total")}`)}
        </div>`;
      container.appendChild(concept);

      /* ---------- interactive lab ---------- */
      const lab = V.el("div.card.lab");
      lab.innerHTML = `<div class="lab-head">
        <h3>Two-way table explorer</h3>
        <p>Switch how the numbers are shown, then click a row or a column header to chart that group's
        conditional distribution. "Should a woman with young children work outside the home?" (n = 1,012.)</p>
      </div>`;
      const body = V.el("div.lab-body");

      /* mode toggle */
      const modes = [
        { key: "count", label: "Counts" },
        { key: "joint", label: "% of grand total" },
        { key: "rowpct", label: "Row %" },
        { key: "colpct", label: "Column %" },
      ];
      let mode = "count";
      const seg = V.el("div.seg", { style: { marginBottom: "14px" } });
      modes.forEach((m, i) => {
        const b = V.el("button", { text: m.label });
        if (i === 0) b.classList.add("active");
        b.dataset.mode = m.key;
        seg.appendChild(b);
      });
      body.appendChild(seg);

      /* a flex container: table on the left, conditional chart on the right */
      const split = V.el("div", { style: { display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" } });
      const tableWrap = V.el("div", { style: { flex: "1 1 380px", minWidth: "320px" } });
      const chartWrap = V.el("div", { style: { flex: "1 1 280px", minWidth: "260px" } });
      split.appendChild(tableWrap);
      split.appendChild(chartWrap);
      body.appendChild(split);
      lab.appendChild(body);
      container.appendChild(lab);

      /* selection state: which group's conditional distribution is charted.
         kind is "row" or "col"; idx is the index into rows or colNames. */
      let sel = { kind: "row", idx: 3 };  // start on Men, college (the sharpest contrast)

      const tip = V.tooltip();

      /* ---- value + formatting for the current mode ---- */
      function cellValue(i, j) {
        const c = rows[i].counts[j];
        if (mode === "count") return c;
        if (mode === "joint") return 100 * c / grand;
        if (mode === "rowpct") return 100 * c / rowTotals[i];
        if (mode === "colpct") return 100 * c / colTotals[j];
      }
      function fmtCell(v) {
        return mode === "count" ? String(Math.round(v)) : S.fmt(v, 1) + "%";
      }
      function rowMarginValue(i) {
        if (mode === "count") return rowTotals[i];
        if (mode === "joint") return 100 * rowTotals[i] / grand;
        if (mode === "rowpct") return 100;                 // each row sums to 100
        if (mode === "colpct") return 100 * rowTotals[i] / grand;  // share of grand total
      }
      function colMarginValue(j) {
        if (mode === "count") return colTotals[j];
        if (mode === "joint") return 100 * colTotals[j] / grand;
        if (mode === "rowpct") return 100 * colTotals[j] / grand;
        if (mode === "colpct") return 100;                 // each column sums to 100
      }
      function fmtMargin(v) {
        return mode === "count" ? String(Math.round(v)) : S.fmt(v, 1) + "%";
      }

      /* ---- build the table fresh each draw ---- */
      function drawTable() {
        tableWrap.innerHTML = "";
        const cap = V.el("div.muted.small", { style: { marginBottom: "6px" } });
        const capText = {
          count: "Raw counts. Click a row or a column header to chart its conditional split.",
          joint: "Joint: each cell as a percent of all 1,012 respondents. The whole table sums to 100%.",
          rowpct: "Row %: each cell divided by its row total, so every row sums to 100%. This is the conditional distribution of opinion within each group.",
          colpct: "Column %: each cell divided by its column total, so every column sums to 100%. This is the conditional distribution of group within each opinion.",
        }[mode];
        cap.textContent = capText;
        tableWrap.appendChild(cap);

        const table = V.el("table.data");
        // header
        const thead = document.createElement("thead");
        const htr = document.createElement("tr");
        htr.appendChild(thEl("Group \\ opinion", null));
        colNames.forEach((cn, j) => {
          const th = thEl(cn, () => { sel = { kind: "col", idx: j }; refresh(); });
          th.style.cursor = "pointer";
          if (sel.kind === "col" && sel.idx === j) markSel(th);
          htr.appendChild(th);
        });
        htr.appendChild(thEl("Total", null));
        thead.appendChild(htr);
        table.appendChild(thead);

        // body rows
        const tbody = document.createElement("tbody");
        rows.forEach((r, i) => {
          const tr = document.createElement("tr");
          const rowHead = tdEl(r.name, () => { sel = { kind: "row", idx: i }; refresh(); });
          rowHead.style.cursor = "pointer";
          rowHead.style.fontWeight = "600";
          if (sel.kind === "row" && sel.idx === i) markSel(rowHead);
          tr.appendChild(rowHead);
          colNames.forEach((_, j) => {
            const td = tdEl(fmtCell(cellValue(i, j)), null);
            // shade the selected group's cells
            if ((sel.kind === "row" && sel.idx === i) || (sel.kind === "col" && sel.idx === j)) {
              td.style.background = "rgba(240,165,0,.14)";
            }
            tr.appendChild(td);
          });
          tr.appendChild(tdEl(fmtMargin(rowMarginValue(i)), null, "total-cell"));
          tbody.appendChild(tr);
        });
        // total row
        const totr = document.createElement("tr");
        totr.className = "total";
        totr.appendChild(tdEl("Total", null));
        colNames.forEach((_, j) => totr.appendChild(tdEl(fmtMargin(colMarginValue(j)), null)));
        const grandCell = mode === "count" ? String(grand) : "100.0%";
        totr.appendChild(tdEl(grandCell, null));
        tbody.appendChild(totr);
        table.appendChild(tbody);

        tableWrap.appendChild(table);

        // a small legend tying the margins to the concept
        const leg = V.el("div.muted.small", { style: { marginTop: "8px" } });
        leg.innerHTML = "The far-right and bottom <b>Total</b> cells are the <b>marginal</b> distributions. " +
          "Highlighted cells are the <b>conditional</b> distribution charted at right.";
        tableWrap.appendChild(leg);
      }

      function thEl(text, onClick) {
        const th = document.createElement("th");
        th.textContent = text;
        if (onClick) th.addEventListener("click", onClick);
        return th;
      }
      function tdEl(text, onClick, cls) {
        const td = document.createElement("td");
        td.textContent = text;
        if (cls) td.className = cls;
        if (onClick) td.addEventListener("click", onClick);
        return td;
      }
      function markSel(node) {
        node.style.outline = "2px solid " + V.color("gold");
        node.style.outlineOffset = "-2px";
      }

      /* ---- conditional distribution: counts and percents for current selection ---- */
      function conditional() {
        if (sel.kind === "row") {
          const r = rows[sel.idx];
          const tot = rowTotals[sel.idx];
          return {
            title: r.name,
            labels: colNames,
            counts: r.counts.slice(),
            pcts: r.counts.map((c) => 100 * c / tot),
            total: tot,
            within: "Among " + lc(r.name) + ",",
            of: "of this group",
          };
        }
        // column selection: distribution of groups within one opinion
        const j = sel.idx;
        const counts = rows.map((r) => r.counts[j]);
        const tot = colTotals[j];
        return {
          title: 'Opinion: "' + colNames[j] + '"',
          labels: rows.map((r) => r.name),
          counts,
          pcts: counts.map((c) => 100 * c / tot),
          total: tot,
          within: "Among those who answered " + JSON.stringify(colNames[j]).slice(1, -1) + ",",
          of: "gave this answer",
        };
      }
      function lc(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

      /* ---- the conditional bar chart ---- */
      const chartTitle = V.el("h4", { style: { fontSize: "14px", margin: "0 0 2px" } });
      const chartSub = V.el("div.muted.small", { style: { marginBottom: "6px" } });
      const chartHost = V.el("div");
      const chartCap = V.el("div.callout.key", { style: { marginTop: "10px", fontSize: "13.5px" } });
      chartWrap.appendChild(chartTitle);
      chartWrap.appendChild(chartSub);
      chartWrap.appendChild(chartHost);
      chartWrap.appendChild(chartCap);

      function drawChart() {
        const cd = conditional();
        chartTitle.textContent = "Conditional distribution: " + cd.title;
        chartSub.textContent = "n = " + cd.total + " in this group · bars sum to 100%";
        chartHost.innerHTML = "";

        const dims = V.svg(chartHost, { height: 210, margin: { top: 16, right: 16, bottom: 64, left: 38 } });
        const g = dims.g;
        const x = d3.scaleBand().domain(cd.labels).range([0, dims.innerW]).padding(0.28);
        const y = d3.scaleLinear().domain([0, Math.max(60, Math.ceil(S.max(cd.pcts) / 10) * 10 + 5)]).range([dims.innerH, 0]);

        // y axis with percent ticks + light grid
        g.append("g").attr("class", "grid")
          .call(d3.axisLeft(y).ticks(5).tickSize(-dims.innerW).tickFormat(""));
        g.append("g").attr("class", "axis")
          .call(d3.axisLeft(y).ticks(5).tickFormat((d) => d + "%"));

        // x axis labels (wrapped short)
        const xAxis = g.append("g").attr("class", "axis")
          .attr("transform", `translate(0,${dims.innerH})`)
          .call(d3.axisBottom(x).tickSize(0));
        xAxis.selectAll("text")
          .style("font-size", "10.5px")
          .each(function (d) { wrapLabel(d3.select(this), x.bandwidth() + 8); });
        xAxis.select(".domain").attr("stroke", V.color("ink-300"));

        const palette = [V.color("c-blue"), V.color("c-teal"), V.color("c-amber"), V.color("c-violet")];

        g.selectAll("rect.bar").data(cd.labels.map((l, k) => ({ l, k })))
          .join("rect")
          .attr("class", "bar")
          .attr("x", (d) => x(d.l))
          .attr("width", x.bandwidth())
          .attr("y", (d) => y(cd.pcts[d.k]))
          .attr("height", (d) => dims.innerH - y(cd.pcts[d.k]))
          .attr("rx", 3)
          .attr("fill", (d) => palette[d.k % palette.length])
          .attr("fill-opacity", 0.9)
          .on("mouseover", (ev, d) => tip.show(
            "<b>" + cd.labels[d.k] + "</b><br>" + S.fmt(cd.pcts[d.k], 1) + "% · " +
            cd.counts[d.k] + " of " + cd.total, ev))
          .on("mousemove", (ev) => tip.move(ev))
          .on("mouseout", () => tip.hide());

        // value labels on top of bars
        g.selectAll("text.val").data(cd.labels.map((l, k) => ({ l, k })))
          .join("text")
          .attr("class", "val")
          .attr("x", (d) => x(d.l) + x.bandwidth() / 2)
          .attr("y", (d) => y(cd.pcts[d.k]) - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", 11.5).attr("font-weight", 700)
          .attr("fill", V.color("ink-700"))
          .text((d) => S.fmt(cd.pcts[d.k], 0) + "%");

        // plain-language caption: lead with the biggest category
        const top = cd.pcts.map((p, k) => ({ p, k })).sort((a, b) => b.p - a.p)[0];
        chartCap.innerHTML = "<span class='label'>In words</span>" +
          cd.within + " <b>" + S.fmt(cd.pcts[top.k], 0) + "%</b> " +
          (sel.kind === "row" ? "answered " + JSON.stringify(cd.labels[top.k]).slice(1, -1) + "."
                              : "were " + lc(cd.labels[top.k]) + ".") +
          " That is " + cd.counts[top.k] + " of the " + cd.total + " " +
          (sel.kind === "row" ? "people in this group" : "people who " + cd.of) + ".";
      }

      function wrapLabel(textSel, width) {
        const words = textSel.text().split(/\s+/);
        textSel.text(null);
        let line = [], lineNo = 0;
        const y = textSel.attr("y") || 9, dy = 0;
        let tspan = textSel.append("tspan").attr("x", 0).attr("y", y).attr("dy", "0.9em");
        words.forEach((w) => {
          line.push(w);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width && line.length > 1) {
            line.pop();
            tspan.text(line.join(" "));
            line = [w];
            lineNo++;
            tspan = textSel.append("tspan").attr("x", 0).attr("y", y).attr("dy", (0.9 + lineNo * 1.0) + "em").text(w);
          }
        });
      }

      function refresh() { drawTable(); drawChart(); }

      seg.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        seg.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        mode = b.dataset.mode;
        refresh();
      });

      refresh();

      /* ---------- quick check ---------- */
      const quiz = V.el("div.card");
      quiz.innerHTML = `<h3>Quick check</h3>
        <div class="quiz">
          <div class="q">Among men with college (299 + 81 + 8 = 388 people), 299 said a woman with
          young children should work outside the home. Which kind of percent is 299 / 388 = 77%,
          and what does it describe?</div>
          <button class="opt" data-ok="0">A joint percent: 77% of the whole sample are college men who said "job outside home"</button>
          <button class="opt" data-ok="1">A conditional (row) percent: among college men, 77% favor working outside the home</button>
          <button class="opt" data-ok="0">A marginal percent: 77% of everyone favors working outside the home</button>
          <button class="opt" data-ok="0">A column percent: 77% of those who said "job outside home" are college men</button>
          <div class="feedback"></div>
        </div>`;
      container.appendChild(quiz);
      wireQuiz(quiz);
      /* No two-way-table exercise key exists in the bank, so the quick check
         above is the closing assessment for this lab. */
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
        ? "Right. Dividing by the row total (388 college men) holds that group fixed, so it reads " +
          "<i>within</i> college men. Joint would divide by 1,012; the column percent would divide by " +
          "the 645 who chose \"job outside home\"; the marginal ignores sex and education entirely."
        : "Not quite. The denominator is 388, the total for the college-men row, so you are holding that " +
          "group fixed and asking how it splits. That is a conditional (row) percent. Joint divides by the " +
          "grand total 1,012; the marginal ignores sex and education.";
    }));
  }
})();
