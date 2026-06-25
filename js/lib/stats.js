/* =====================================================================
   PPD 504 Studio, stats.js
   Pure, dependency-free statistics primitives shared by every module.
   Conventions match Meier, Brudney & Bohte (the course textbook) where
   the textbook and the common software default disagree (notably the
   quartile method). Every function is pure and side-effect free.
   ===================================================================== */
(function (root) {
  "use strict";
  const S = {};

  /* ---------- basic reductions ---------- */
  S.sum = (a) => a.reduce((t, x) => t + x, 0);
  S.mean = (a) => (a.length ? S.sum(a) / a.length : NaN);
  S.min = (a) => Math.min.apply(null, a);
  S.max = (a) => Math.max.apply(null, a);
  S.range = (a) => S.max(a) - S.min(a);

  /* ---------- median & quantiles ----------
     median: average of the two middle values when n is even. */
  S.median = function (a) {
    if (!a.length) return NaN;
    const s = a.slice().sort((x, y) => x - y);
    const n = s.length;
    const m = Math.floor(n / 2);
    return n % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  /* Quartiles, COURSE method (Meier/Brudney/Bohte, a.k.a. Tukey / "exclude
     the median"): split the ordered data at the median; if n is odd the
     median itself is excluded from both halves. Q1 = median of lower half,
     Q3 = median of upper half. This is what the lecture slides teach. */
  S.quartilesMBB = function (a) {
    const s = a.slice().sort((x, y) => x - y);
    const n = s.length;
    if (n === 0) return { q1: NaN, median: NaN, q3: NaN };
    const med = S.median(s);
    let lower, upper;
    if (n % 2 === 0) {
      lower = s.slice(0, n / 2);
      upper = s.slice(n / 2);
    } else {
      const m = Math.floor(n / 2);
      lower = s.slice(0, m);       // exclude the median element
      upper = s.slice(m + 1);
    }
    return { q1: S.median(lower), median: med, q3: S.median(upper) };
  };

  /* Linear-interpolation quantile (the spreadsheet / d3 default), kept so
     modules can show "why software sometimes disagrees with the textbook." */
  S.quantile = function (a, p) {
    if (!a.length) return NaN;
    const s = a.slice().sort((x, y) => x - y);
    const h = (s.length - 1) * p;
    const lo = Math.floor(h);
    const hi = Math.ceil(h);
    return s[lo] + (h - lo) * (s[hi] - s[lo]);
  };

  S.fiveNumber = function (a) {
    const q = S.quartilesMBB(a);
    return { min: S.min(a), q1: q.q1, median: q.median, q3: q.q3, max: S.max(a) };
  };
  S.iqr = (a) => { const q = S.quartilesMBB(a); return q.q3 - q.q1; };

  /* 1.5 x IQR outlier rule (course rule). Returns fences + flagged points. */
  S.outlierFences = function (a, k) {
    k = (k == null) ? 1.5 : k;
    const q = S.quartilesMBB(a);
    const iqr = q.q3 - q.q1;
    const lower = q.q1 - k * iqr;
    const upper = q.q3 + k * iqr;
    return {
      lower, upper, iqr, q1: q.q1, q3: q.q3,
      outliers: a.filter((x) => x < lower || x > upper),
      inliers: a.filter((x) => x >= lower && x <= upper),
    };
  };

  /* ---------- dispersion ----------
     Sample variance / sd use the (n-1) divisor, matching the course "s". */
  S.variance = function (a) {
    const n = a.length;
    if (n < 2) return 0;
    const m = S.mean(a);
    return a.reduce((t, x) => t + (x - m) * (x - m), 0) / (n - 1);
  };
  S.sd = (a) => Math.sqrt(S.variance(a));
  S.varianceP = function (a) {           // population variance (divisor n)
    const n = a.length;
    if (n < 1) return 0;
    const m = S.mean(a);
    return a.reduce((t, x) => t + (x - m) * (x - m), 0) / n;
  };
  S.sdP = (a) => Math.sqrt(S.varianceP(a));

  S.standardize = (x, mu, sigma) => (x - mu) / sigma;
  S.zScores = function (a) {
    const m = S.mean(a), sd = S.sd(a);
    return a.map((x) => (sd === 0 ? 0 : (x - m) / sd));
  };

  /* ---------- bivariate ---------- */
  /* Pearson correlation r. */
  S.correlation = function (xs, ys) {
    const n = Math.min(xs.length, ys.length);
    if (n < 2) return NaN;
    const mx = S.mean(xs), my = S.mean(ys);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx, dy = ys[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    if (sxx === 0 || syy === 0) return NaN;
    return sxy / Math.sqrt(sxx * syy);
  };

  /* Ordinary least squares y = a + b x. Returns slope, intercept, r, r2,
     fitted(), residuals, and the sum of squared errors. */
  S.linreg = function (xs, ys) {
    const n = Math.min(xs.length, ys.length);
    const mx = S.mean(xs), my = S.mean(ys);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx, dy = ys[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    const slope = sxx === 0 ? 0 : sxy / sxx;
    const intercept = my - slope * mx;
    const fitted = (x) => intercept + slope * x;
    const residuals = [];
    let sse = 0;
    for (let i = 0; i < n; i++) {
      const r = ys[i] - fitted(xs[i]);
      residuals.push(r);
      sse += r * r;
    }
    const r = (sxx === 0 || syy === 0) ? 0 : sxy / Math.sqrt(sxx * syy);
    return {
      slope, intercept, fitted, residuals, sse,
      r, r2: r * r,
      sst: syy, ssr: syy - sse,
    };
  };

  /* Sum of squared vertical errors for an ARBITRARY line (for the
     "drag the line" OLS sandbox, where the line is not yet optimal). */
  S.sse = function (xs, ys, intercept, slope) {
    let t = 0;
    for (let i = 0; i < xs.length; i++) {
      const e = ys[i] - (intercept + slope * xs[i]);
      t += e * e;
    }
    return t;
  };

  /* ---------- normal distribution ---------- */
  /* erf via Abramowitz & Stegun 7.1.26 (max abs error ~1.5e-7). */
  S.erf = function (x) {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return sign * y;
  };
  S.normalPDF = function (x, mu, sigma) {
    mu = mu || 0; sigma = (sigma == null) ? 1 : sigma;
    const z = (x - mu) / sigma;
    return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
  };
  /* CDF P(X <= x). */
  S.normalCDF = function (x, mu, sigma) {
    mu = mu || 0; sigma = (sigma == null) ? 1 : sigma;
    return 0.5 * (1 + S.erf((x - mu) / (sigma * Math.SQRT2)));
  };
  /* Area between a and b for N(mu, sigma). */
  S.normalArea = function (a, b, mu, sigma) {
    return S.normalCDF(b, mu, sigma) - S.normalCDF(a, mu, sigma);
  };
  /* Inverse standard normal (Acklam's algorithm), for z given a tail prob. */
  S.invNormal = function (p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    const plow = 0.02425, phigh = 1 - plow;
    let q, r;
    if (p < plow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
             ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= phigh) {
      q = p - 0.5; r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
             (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
              ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
  };

  /* ---------- histogram binning ---------- */
  S.histogram = function (a, nbins, lo, hi) {
    lo = (lo == null) ? S.min(a) : lo;
    hi = (hi == null) ? S.max(a) : hi;
    const w = (hi - lo) / nbins || 1;
    const bins = Array.from({ length: nbins }, (_, i) => ({
      x0: lo + i * w, x1: lo + (i + 1) * w, count: 0, items: [],
    }));
    for (const x of a) {
      let k = Math.floor((x - lo) / w);
      if (k < 0) k = 0;
      if (k >= nbins) k = nbins - 1;       // include the max in the last bin
      bins[k].count++; bins[k].items.push(x);
    }
    return bins;
  };

  /* ---------- random number generation ----------
     Seeded so simulations are reproducible across reloads. */
  S.rng = function (seed) {
    let s = (seed >>> 0) || 0x2545F491;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  /* Standard normal sample via Box-Muller, given a uniform generator. */
  S.gaussian = function (rand, mu, sigma) {
    mu = mu || 0; sigma = (sigma == null) ? 1 : sigma;
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  S.shuffle = function (a, rand) {
    rand = rand || Math.random;
    const s = a.slice();
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
  };
  S.sampleWithout = function (a, k, rand) {
    return S.shuffle(a, rand).slice(0, k);
  };

  /* ---------- formatting helper ---------- */
  S.fmt = function (x, d) {
    d = (d == null) ? 2 : d;
    if (!isFinite(x)) return "—";
    return Number(x).toFixed(d);
  };

  root.PPD504 = root.PPD504 || {};
  root.PPD504.stats = S;
})(typeof window !== "undefined" ? window : globalThis);
