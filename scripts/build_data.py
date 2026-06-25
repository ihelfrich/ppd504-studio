#!/usr/bin/env python3
"""Turn the raw Census/FRED pulls in /tmp/ppd504_data into clean, small,
provenance-tagged JSON snapshots under data/. Numbers only, no API keys.
Run once; the app then ships these static files (offline, instant)."""
import json, pathlib, datetime

RAW = pathlib.Path("/tmp/ppd504_data")
OUT = pathlib.Path(__file__).resolve().parent.parent / "data"
OUT.mkdir(exist_ok=True)
TODAY = "2026-06-25"

ABBR = {
 "Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO",
 "Connecticut":"CT","Delaware":"DE","District of Columbia":"DC","Florida":"FL","Georgia":"GA",
 "Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY",
 "Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN",
 "Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH",
 "New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND",
 "Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC",
 "South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA",
 "Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY",
}
def num(s):
    try:
        v=float(s)
        if v <= -666666666: return None   # Census null sentinel
        return v
    except (TypeError, ValueError):
        return None

def load(name):
    d=json.load(open(RAW/name)); head=d[0]; return head, d[1:]

def col(head, name): return head.index(name)

def write(name, obj):
    (OUT/name).write_text(json.dumps(obj, indent=0))
    print(f"wrote data/{name}: {len(json.dumps(obj))} bytes")

# ---------- state median household income ----------
h, rows = load("state_medinc.json")
ci, cn = col(h,"B19013_001E"), col(h,"NAME")
inc=[]
for r in rows:
    nm=r[cn]
    if nm not in ABBR: continue        # drops Puerto Rico
    v=num(r[ci])
    if v is None: continue
    inc.append({"state":nm,"abbr":ABBR[nm],"medianIncome":int(v)})
inc.sort(key=lambda x:x["state"])
write("state_income.json", {
 "meta":{"title":"Median household income by state, 2023",
   "source":"U.S. Census Bureau, American Community Survey 2023 5-year (table B19013)",
   "url":"https://data.census.gov/table?q=B19013",
   "retrieved":TODAY,"unit":"US dollars","n":len(inc)},
 "rows":inc})

# ---------- education % and income (joined) ----------
hb, rb = load("state_bachelors.json")
bi, bn = col(hb,"S1501_C02_015E"), col(hb,"NAME")
bach={r[bn]:num(r[bi]) for r in rb if r[bn] in ABBR}
incmap={x["state"]:x["medianIncome"] for x in inc}
edu=[]
for nm in sorted(ABBR):
    if nm in bach and bach[nm] is not None and nm in incmap:
        edu.append({"state":nm,"abbr":ABBR[nm],"bachelorsPct":round(bach[nm],1),"medianIncome":incmap[nm]})
write("state_education_income.json", {
 "meta":{"title":"Bachelor's degree attainment vs median household income by state, 2023",
   "source":"U.S. Census Bureau, ACS 2023 5-year (S1501 percent bachelor's+ among age 25+, B19013 median income)",
   "url":"https://data.census.gov/",
   "retrieved":TODAY,"unitX":"percent of adults 25+ with a bachelor's degree or higher","unitY":"median household income (US dollars)","n":len(edu)},
 "rows":edu})

# ---------- poverty ----------
hp, rp = load("state_poverty.json")
pi, pn = col(hp,"S1701_C03_001E"), col(hp,"NAME")
pov=[{"state":r[pn],"abbr":ABBR[r[pn]],"povertyPct":round(num(r[pi]),1)}
     for r in rp if r[pn] in ABBR and num(r[pi]) is not None]
pov.sort(key=lambda x:x["state"])
write("state_poverty.json", {
 "meta":{"title":"Share of population below the poverty line by state, 2023",
   "source":"U.S. Census Bureau, ACS 2023 5-year (table S1701)",
   "url":"https://data.census.gov/","retrieved":TODAY,"unit":"percent below poverty level","n":len(pov)},
 "rows":pov})

# ---------- population (for Benford + skew) ----------
hpop, rpop = load("state_pop.json")
qi, qn = col(hpop,"B01003_001E"), col(hpop,"NAME")
pop=[{"state":r[qn],"abbr":ABBR[r[qn]],"population":int(num(r[qi]))}
     for r in rpop if r[qn] in ABBR and num(r[qi]) is not None]
pop.sort(key=lambda x:-x["population"])
write("state_population.json", {
 "meta":{"title":"Total population by state, 2023",
   "source":"U.S. Census Bureau, ACS 2023 5-year (table B01003)",
   "url":"https://data.census.gov/","retrieved":TODAY,"unit":"people","n":len(pop)},
 "rows":pop})

# ---------- FRED unemployment (monthly) ----------
u=json.load(open(RAW/"fred_unrate.json"))["observations"]
ser=[{"date":o["date"],"value":float(o["value"])} for o in u if o["value"] not in (".","")]
write("us_unemployment.json", {
 "meta":{"title":"U.S. civilian unemployment rate, monthly since 2014",
   "source":"U.S. Bureau of Labor Statistics via FRED, series UNRATE",
   "url":"https://fred.stlouisfed.org/series/UNRATE","retrieved":TODAY,"unit":"percent, seasonally adjusted","n":len(ser)},
 "series":ser})

# ---------- FRED house price (quarterly) ----------
hpr=json.load(open(RAW/"fred_houseprice.json"))["observations"]
hs=[{"date":o["date"],"value":float(o["value"])} for o in hpr if o["value"] not in (".","")]
write("us_house_price.json", {
 "meta":{"title":"Median sales price of houses sold in the U.S., quarterly since 2010",
   "source":"U.S. Census Bureau & HUD via FRED, series MSPUS",
   "url":"https://fred.stlouisfed.org/series/MSPUS","retrieved":TODAY,"unit":"US dollars","n":len(hs)},
 "series":hs})

# ---------- sex x education two-way table (B15002) ----------
he, re = load("us_b15002_full.json")
row = re[0]
def g(code): return int(num(row[col(he,code)]) or 0)
# male detail 003..018, female 020..035
male_codes   = [f"B15002_{i:03d}E" for i in range(3,19)]
female_codes = [f"B15002_{i:03d}E" for i in range(20,36)]
# index within the 16-long detail list: 0..8 HS-or-less, 9..11 some college/assoc, 12 bachelor, 13..15 grad
def bucket(codes):
    vals=[g(c) for c in codes]
    return [sum(vals[0:9]), sum(vals[9:12]), vals[12], sum(vals[13:16])]
male=bucket(male_codes); female=bucket(female_codes)
write("us_sex_education.json", {
 "meta":{"title":"Educational attainment by sex, U.S. adults 25+, 2023",
   "source":"U.S. Census Bureau, ACS 2023 5-year (table B15002)",
   "url":"https://data.census.gov/table?q=B15002","retrieved":TODAY,"unit":"people (counts)"},
 "rowVar":"Sex","colVar":"Highest education",
 "rowLabels":["Male","Female"],
 "colLabels":["High school or less","Some college / associate","Bachelor's","Graduate degree"],
 "counts":[male,female]})

# ================= emit js/lib/data.js (embed for offline / file://) =================
LIB = pathlib.Path(__file__).resolve().parent.parent / "js" / "lib"
bundle = {}
for p in sorted(OUT.glob("*.json")):
    bundle[p.stem] = json.loads(p.read_text())
js = ("/* PPD 504 Studio - data.js (AUTO-GENERATED by scripts/build_data.py)\n"
      "   Real public datasets embedded so the app needs no network and works\n"
      "   from file://. Provenance is in each dataset's .meta. Do not hand-edit. */\n"
      "window.PPD504 = window.PPD504 || {};\n"
      "window.PPD504.data = " + json.dumps(bundle, separators=(",", ":")) + ";\n")
(LIB / "data.js").write_text(js)
print(f"wrote js/lib/data.js: {len(js)} bytes ({len(bundle)} datasets)")

# ================= verification =================
import statistics as st
print("\n=== verification ===")
vals=[x["medianIncome"] for x in inc]
print("income n",len(vals),"mean",round(st.mean(vals)),"median",st.median(vals),"min",min(vals),"max",max(vals))
hi=max(inc,key=lambda x:x["medianIncome"]); lo=min(inc,key=lambda x:x["medianIncome"])
print("  highest:",hi["state"],hi["medianIncome"],"| lowest:",lo["state"],lo["medianIncome"])
xs=[r["bachelorsPct"] for r in edu]; ys=[r["medianIncome"] for r in edu]
n=len(xs); mx=st.mean(xs); my=st.mean(ys)
sxy=sum((a-mx)*(b-my) for a,b in zip(xs,ys)); sxx=sum((a-mx)**2 for a in xs); syy=sum((b-my)**2 for b in ys)
r=sxy/(sxx*syy)**.5; b=sxy/sxx; a=my-b*mx
print("edu-income: n",n,"r",round(r,3),"slope",round(b),"intercept",round(a),"R2",round(r*r,3))
print("  predict income @ 40% bachelors:", round(a+b*40))
print("pop: total",sum(p["population"] for p in pop),"first-digit of top:",str(pop[0]["population"])[0])
print("unrate: min",min(o['value'] for o in ser),"max",max(o['value'] for o in ser),"latest",ser[-1])
print("sex-edu male:",male,"female:",female,"male total",sum(male),"female total",sum(female))
