/* =====================================================================
   PPD 504 Studio, viz.js
   Thin D3 helpers so every chart shares margins, axes, colours, and a
   single tooltip. Depends on window.d3 and window.PPD504.stats.
   ===================================================================== */
(function (root) {
  "use strict";
  const V = {};
  const d3 = root.d3;

  /* design tokens pulled from CSS so JS and CSS never drift */
  V.color = function (name) {
    return getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim();
  };
  V.palette = ["c-blue","c-teal","c-green","c-amber","c-violet","c-pink","c-red","c-slate"]
    .map((n) => V.color(n));

  /* Create a responsive SVG with an inner <g> offset by margins.
     Returns { svg, g, innerW, innerH, width, height, margin }. */
  V.svg = function (container, opts) {
    opts = opts || {};
    const width = opts.width || (container.clientWidth || 700);
    const height = opts.height || 400;
    const margin = Object.assign({ top: 20, right: 20, bottom: 40, left: 50 }, opts.margin || {});
    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .style("max-width", width + "px")
      .attr("preserveAspectRatio", "xMidYMid meet");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    return {
      svg, g, margin, width, height,
      innerW: width - margin.left - margin.right,
      innerH: height - margin.top - margin.bottom,
    };
  };

  /* Standard bottom + left axes with optional labels and light gridlines. */
  V.axes = function (g, x, y, dims, opts) {
    opts = opts || {};
    if (opts.grid !== false) {
      g.append("g").attr("class", "grid")
        .attr("transform", `translate(0,${dims.innerH})`)
        .call(d3.axisBottom(x).ticks(opts.xticks || 6).tickSize(-dims.innerH).tickFormat(""));
      g.append("g").attr("class", "grid")
        .call(d3.axisLeft(y).ticks(opts.yticks || 6).tickSize(-dims.innerW).tickFormat(""));
    }
    g.append("g").attr("class", "axis")
      .attr("transform", `translate(0,${dims.innerH})`)
      .call(d3.axisBottom(x).ticks(opts.xticks || 6));
    g.append("g").attr("class", "axis")
      .call(d3.axisLeft(y).ticks(opts.yticks || 6));
    if (opts.xlabel) {
      g.append("text").attr("class", "axis-label")
        .attr("x", dims.innerW / 2).attr("y", dims.innerH + 34)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text(opts.xlabel);
    }
    if (opts.ylabel) {
      g.append("text").attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -dims.innerH / 2).attr("y", -38)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("font-weight", 600)
        .attr("fill", V.color("ink-600")).text(opts.ylabel);
    }
  };

  /* one shared tooltip element */
  let _tip = null;
  V.tooltip = function () {
    if (!_tip) {
      _tip = d3.select("body").append("div").attr("class", "tooltip");
    }
    return {
      show(html, ev) {
        _tip.html(html).style("opacity", 1)
          .style("left", (ev.pageX + 12) + "px")
          .style("top", (ev.pageY - 10) + "px");
      },
      move(ev) { _tip.style("left", (ev.pageX + 12) + "px").style("top", (ev.pageY - 10) + "px"); },
      hide() { _tip.style("opacity", 0); },
    };
  };

  V.fmt = root.PPD504.stats.fmt;

  /* ---------- DOM convenience ---------- */
  /* el("div.foo.bar", {attr}, [children|text]), tiny hyperscript. */
  V.el = function (sel, attrs, children) {
    const parts = sel.split(/(?=[.#])/);
    const tag = parts[0].match(/^[.#]/) ? "div" : parts.shift();
    const node = document.createElement(tag || "div");
    for (const p of parts) {
      if (p[0] === ".") node.classList.add(p.slice(1));
      else if (p[0] === "#") node.id = p.slice(1);
    }
    if (attrs) for (const k in attrs) {
      if (k === "html") node.innerHTML = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else if (k.startsWith("on") && typeof attrs[k] === "function") node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (k === "style" && typeof attrs[k] === "object") Object.assign(node.style, attrs[k]);
      else node.setAttribute(k, attrs[k]);
    }
    if (children != null) {
      if (typeof children === "string") node.innerHTML = children;
      else if (Array.isArray(children)) children.forEach((c) => c && node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
      else node.appendChild(children);
    }
    return node;
  };

  /* labelled range slider that calls back on input.
     returns { wrap, input, setLabel } */
  V.slider = function (opts) {
    const wrap = V.el("div.control");
    const valSpan = V.el("span.val", { text: opts.format ? opts.format(opts.value) : opts.value });
    const label = V.el("label", null, [opts.label + " ", valSpan]);
    const input = V.el("input", { type: "range", min: opts.min, max: opts.max, step: opts.step || 1, value: opts.value });
    input.addEventListener("input", function () {
      const v = +this.value;
      valSpan.textContent = opts.format ? opts.format(v) : v;
      if (opts.on) opts.on(v);
    });
    wrap.appendChild(label); wrap.appendChild(input);
    return { wrap, input, set value(v){ input.value=v; valSpan.textContent = opts.format?opts.format(v):v; }, get value(){ return +input.value; } };
  };

  /* a small stat readout card; returns node with .set(v) */
  V.stat = function (key, value, cls) {
    const v = V.el("span.v", { text: value });
    const node = V.el("div.stat" + (cls ? "." + cls : ""), null, [V.el("div.k", { text: key }), v]);
    node.set = (x) => { v.textContent = x; };
    return node;
  };

  /* ---------- CSS formula builders (no math library) ---------- */
  V.fml = {
    frac: (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`,
    sqrt: (x) => `<span class="sqrt">${x}</span>`,
    sub: (x, s) => `${x}<sub>${s}</sub>`,
    sup: (x, s) => `${x}<sup>${s}</sup>`,
    xbar: '<span style="position:relative"><i>x</i><span style="position:absolute;left:0;right:1px;top:-.55em;border-top:1.4px solid currentColor"></span></span>',
    block: (inner) => `<span class="fml fml-block">${inner}</span>`,
    inline: (inner) => `<span class="fml">${inner}</span>`,
  };

  root.PPD504 = root.PPD504 || {};
  root.PPD504.viz = V;
  /* create the module registry here: viz.js always loads before any
     module script, so modules can safely self-register on load. */
  root.PPD504.modules = root.PPD504.modules || {};
})(window);
