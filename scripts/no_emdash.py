#!/usr/bin/env python3
"""Replace prose em-dashes (U+2014) with grammatical punctuation, honoring
Ian's hard no-em-dash rule. Leaves standalone "—" placeholders (used for
empty stat readouts) and en-dashes/minus signs untouched.

Rule:
  " — " inside a `title:` value  -> ": "
  " — " elsewhere                 -> ", "
  bare "—" alone in a string      -> kept (it is a no-data marker)
"""
import re, sys, pathlib

EM = "—"
files = sys.argv[1:] or [str(p) for p in pathlib.Path("js").rglob("*.js")]

def fix_line(line):
    if "title:" in line or "title " in line:
        line = line.replace(f" {EM} ", ": ")
    line = line.replace(f" {EM} ", ", ")
    # any remaining spaced em-dash variants
    line = line.replace(f"{EM} ", ", ").replace(f" {EM}", ",")
    return line

changed = 0
for f in files:
    p = pathlib.Path(f)
    txt = p.read_text(encoding="utf-8")
    out = "\n".join(fix_line(l) for l in txt.split("\n"))
    if out != txt:
        p.write_text(out, encoding="utf-8")
        changed += 1
        print("cleaned", f)
print(f"{changed} file(s) changed")
