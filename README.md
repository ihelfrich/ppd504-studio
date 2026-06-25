# PPD 504 Studio

Interactive labs for **PPD 504, Essential Statistics for Public Management** (USC Sol Price School of Public Policy; textbook: Meier, Brudney & Bohte). Nineteen hands-on D3 modules that turn the lecture material into something you can grab, drag, and break.

Built to run **lightning quick**: no build step, no framework, no network. Open `index.html` and it works (D3 is vendored locally; there is no CDN dependency).

## Run it

```bash
cd ppd504-studio
python3 -m http.server 4504
# then open http://127.0.0.1:4504
```

Any static file server works. Opening `index.html` directly via `file://` also works in most browsers.

## What is inside

Four weeks of the course, one lab per concept:

**Week 1 · Sampling & study design**
- Sampling & inference (draw samples, watch the sampling distribution build)
- Sampling bias gallery (voluntary response, undercoverage, nonresponse, survivorship)
- Observation vs experiment (how randomization breaks confounding)
- Data ethics (IRB, consent, confidentiality; scenario judge)

**Week 2 · Describing data**
- Types of variables (classification game)
- Histogram explorer (bin width, shape, center, spread, outliers)
- Mean vs median (balance-beam, resistance)
- Variance & standard deviation (deviations builder)
- Boxplot & the 1.5·IQR rule (five-number summary, fences)

**Week 3 · Probability & distributions**
- Probability as long-run frequency (law of large numbers)
- Probability rules + Benford first-digit law
- Density curves (area as probability)
- Normal & the empirical rule (68-95-99.7)
- Standardizing (z-scores)

**Week 4 · Correlation & regression**
- Scatter & correlation (guess-the-r game)
- When r misleads (nonlinearity, outliers, spurious correlation)
- Two-way tables (joint, marginal, conditional percents)
- Least-squares regression (beat-the-line OLS sandbox, R²)
- Residuals & diagnostics

The real **in-class exercises** from Weeks 3 and 4 are built in as "Practice" cards with reveal-able, verified solutions.

## Architecture

```
index.html              shell: sidebar nav, loads everything (defer)
css/styles.css          one design system (USC cardinal + gold), all control styles
vendor/d3.v7.min.js     vendored D3 v7 (the only external dependency)
js/lib/stats.js         pure statistics primitives (mean, sd, quartiles, OLS, normal, RNG)
js/lib/viz.js           D3 + DOM helpers (responsive SVG, axes, tooltip, sliders, CSS formulas)
js/lib/exercises.js     the course in-class exercises + PPD504.renderPractice()
js/app.js               NAV manifest (single source of truth) + hash router
js/modules/<id>.js      one self-registering module per lab
```

Each module registers itself into `window.PPD504.modules["<id>"]` with a `render(container)` method. The router clears the content area and calls `render` on navigation. Add a lab by writing one module file and one entry in the `NAV` manifest in `js/app.js`.

### Conventions

- Quartiles use the course (Meier/Brudney/Bohte, "exclude the median") method: `stats.quartilesMBB`. The interpolation method is also available as `stats.quantile` for comparison.
- Sample variance and SD use the `n - 1` divisor.
- Randomness in simulations uses a seeded generator (`stats.rng`) so every reload is reproducible.
- No em-dashes in user-facing prose (house style).

## Provenance

Content transcribed from Prof. Emma Aguila's Week 1-4 lecture decks and the Week 3-4 in-class exercise sheets. All numerical answers in the practice bank were checked against the stats library.
