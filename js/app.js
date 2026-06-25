/* =====================================================================
   PPD 504 Studio, app shell + router
   The NAV manifest is the single source of truth: it builds the sidebar,
   the home tiles, and the hash router. Modules self-register into
   PPD504.modules[id]; the router looks them up by id.
   ===================================================================== */
(function () {
  "use strict";
  const P = window.PPD504 = window.PPD504 || {};
  P.modules = P.modules || {};

  /* Each lesson: {id, title, tag, icon, blurb}. Weeks group them. */
  P.NAV = [
    { week: 1, label: "Sampling & Study Design", items: [
      { id: "w1-sampling",    icon: "◎", title: "Sampling & Inference",      blurb: "Draw samples from a population and watch the sampling distribution build." },
      { id: "w1-bias",        icon: "⚠", title: "Sampling Bias Gallery",     blurb: "Survivorship, voluntary response, undercoverage, nonresponse: made visible." },
      { id: "w1-confounding", icon: "⚗", title: "Observation vs Experiment", blurb: "Why randomization breaks confounding and earns the word 'cause'." },
      { id: "w1-ethics",      icon: "§",  title: "Data Ethics",              blurb: "IRB, informed consent, confidentiality: judge real scenarios." },
    ]},
    { week: 2, label: "Describing Data", items: [
      { id: "w2-vartypes",   icon: "▦", title: "Types of Variables",        blurb: "Sort variables into nominal, ordinal, interval, discrete, continuous." },
      { id: "w2-histogram",  icon: "▥", title: "Histogram Explorer",        blurb: "Slide the bin width and read shape, center, spread, and outliers." },
      { id: "w2-meanmedian", icon: "⚖", title: "Mean vs Median",            blurb: "A balance beam: drag points, add an outlier, see which measure moves." },
      { id: "w2-spread",     icon: "↔", title: "Variance & Std. Deviation", blurb: "Build s from squared deviations and feel what spread means." },
      { id: "w2-boxplot",    icon: "▤", title: "Boxplot & the 1.5·IQR Rule", blurb: "Five-number summary, the box, and the outlier fences." },
    ]},
    { week: 3, label: "Probability & Distributions", items: [
      { id: "w3-longrun", icon: "⟳", title: "Probability as Long-Run Frequency", blurb: "Flip thousands of coins and watch the proportion settle down." },
      { id: "w3-benford", icon: "①", title: "Probability Rules (Benford)",        blurb: "Legitimate models, complements, and the famous first-digit law." },
      { id: "w3-density",  icon: "∫", title: "Density Curves",                     blurb: "Area under the curve equals probability; mean vs median on a skew." },
      { id: "w3-normal",   icon: "∩", title: "Normal & the Empirical Rule",       blurb: "Move μ and σ; shade the 68–95–99.7 bands." },
      { id: "w3-zscore",   icon: "z", title: "Standardizing (z-scores)",          blurb: "Turn any normal value into a z and read its percentile." },
    ]},
    { week: 4, label: "Correlation & Regression", items: [
      { id: "w4-scatter",   icon: "⁙", title: "Scatter & Correlation",    blurb: "Guess r, then drag the cloud and watch the coefficient respond." },
      { id: "w4-traps",     icon: "⌇", title: "When r Misleads",          blurb: "Nonlinearity, outliers, and spurious correlation (chocolate & Nobels)." },
      { id: "w4-twoway",    icon: "⊞", title: "Two-Way Tables",           blurb: "Joint, marginal, and conditional percents from real survey counts." },
      { id: "w4-ols",       icon: "╱", title: "Least-Squares Regression", blurb: "Drag a line to minimize squared error, then snap to OLS. See R²." },
      { id: "w4-residuals", icon: "⊥", title: "Residuals & Diagnostics",  blurb: "Read residual plots to judge whether a line is the right model." },
    ]},
  ];

  P.byId = {};
  P.NAV.forEach((wk) => wk.items.forEach((it) => { it.week = wk.week; P.byId[it.id] = it; }));

  /* ---------- sidebar ---------- */
  function buildSidebar() {
    const nav = document.getElementById("nav");
    nav.innerHTML = "";
    const home = el(`<button class="nav-item" data-id="home"><span class="ico">⌂</span>Overview</button>`);
    nav.appendChild(home);
    P.NAV.forEach((wk) => {
      const grp = document.createElement("div");
      grp.className = "nav-week";
      grp.innerHTML = `<div class="wk-label"><span class="num">${wk.week}</span>${wk.label}</div>`;
      wk.items.forEach((it) => {
        const b = el(`<button class="nav-item" data-id="${it.id}"><span class="ico">${it.icon}</span>${it.title}</button>`);
        grp.appendChild(b);
      });
      nav.appendChild(grp);
    });
    nav.addEventListener("click", (e) => {
      const btn = e.target.closest(".nav-item");
      if (btn) location.hash = "#/" + btn.dataset.id;
    });
  }

  /* ---------- home ---------- */
  function renderHome(container) {
    const hero = el(`<div class="hero">
      <h1>Essential Statistics, made tangible</h1>
      <p>Nineteen hands-on labs covering the full PPD&nbsp;504 arc, sampling and study design,
      describing data, probability and distributions, and correlation and regression. Every idea
      here is something you can grab, drag, and break. Pick a lab from the left, or start below.</p>
    </div>`);
    container.appendChild(hero);
    P.NAV.forEach((wk) => {
      const h = el(`<h2 style="margin:26px 0 6px;font-size:15px;color:var(--cardinal);text-transform:uppercase;letter-spacing:.06em">Week ${wk.week} · ${wk.label}</h2>`);
      container.appendChild(h);
      const grid = document.createElement("div");
      grid.className = "tile-grid";
      wk.items.forEach((it) => {
        const tile = el(`<div class="tile" data-id="${it.id}">
          <div class="wk">${it.icon} &nbsp;Lab</div>
          <h4>${it.title}</h4>
          <p>${it.blurb}</p>
        </div>`);
        tile.addEventListener("click", () => location.hash = "#/" + it.id);
        grid.appendChild(tile);
      });
      container.appendChild(grid);
    });
  }

  /* ---------- router ---------- */
  let current = null;
  function route() {
    const id = (location.hash.replace(/^#\/?/, "") || "home");
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
    const content = document.getElementById("content");
    const crumb = document.getElementById("crumb");
    if (current && current.teardown) { try { current.teardown(); } catch (e) {} }
    current = null;
    content.innerHTML = "";
    window.scrollTo(0, 0);

    if (id === "home") {
      crumb.innerHTML = "<b>PPD 504 Studio</b>";
      renderHome(content);
      return;
    }
    const meta = P.byId[id];
    const mod = P.modules[id];
    crumb.innerHTML = meta ? `Week ${meta.week} &nbsp;›&nbsp; <b>${meta.title}</b>` : "<b>Lesson</b>";
    if (!mod) {
      content.appendChild(el(`<div class="card"><h3>Coming together…</h3>
        <p class="muted">This lab (<code>${id}</code>) is being assembled. Pick another from the sidebar.</p></div>`));
      return;
    }
    try {
      current = mod;
      mod.render(content);
    } catch (err) {
      content.appendChild(el(`<div class="card"><h3>Something broke in this lab</h3>
        <pre class="small" style="white-space:pre-wrap;color:var(--negative)">${String(err && err.stack || err)}</pre></div>`));
      console.error(err);
    }
  }

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }
  P.el = el;

  /* expose a tiny helper modules use to build a standard lesson header */
  P.lessonHeader = function (container, id, lede) {
    const meta = P.byId[id] || {};
    container.appendChild(el(`<div class="lesson-h">
      <div class="kicker">Week ${meta.week || ""} · Lab</div>
      <h1>${meta.title || id}</h1>
      ${lede ? `<p class="lede">${lede}</p>` : ""}
    </div>`));
  };

  document.addEventListener("DOMContentLoaded", function () {
    buildSidebar();
    window.addEventListener("hashchange", route);
    route();
  });
})();
