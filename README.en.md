# bazi-ziwei-skills

**AI BaZi (Four Pillars) + Zi Wei Dou Shu — Charting & Cross-Verification Skill**

Deterministic algorithmic charting (no LLM guesswork) · Three analysis modes · One-click ink-wash HTML chart poster

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
![Language](https://img.shields.io/badge/language-EN%20%7C%20日本語%20%7C%20简中%20%7C%20繁中-blue)

[繁體中文](./README.zh-TW.md) | [简体中文](./README.md) | [日本語](./README.ja.md) | **English**

<br>

<table>
<tr>
<td width="50%">
<a href="./docs/poster-full.png" target="_blank">
<img src="./docs/poster-overview.webp" alt="Cross-verification poster — overview card (first screen)">
</a>
</td>
<td width="50%">
<a href="./docs/jietu.png" target="_blank">
<img src="./docs/jietu.png" alt="Cross-verification poster — full layout">
</a>
</td>
</tr>
</table>

<sub>Cross-verification poster (left: overview card / first screen; right: full layout). Note the vermillion-framed 命宮 (Life Palace) on the 12-palace Zi Wei chart — this repository has fixed its mis-placement bug.</sub>

---

## What is this

A fortune-telling analysis Skill following the [SKILL.md open standard](https://code.claude.com/docs/en/skills), installable into any Agent that supports it — Claude Code, Claude Desktop, Codex, Cursor, WorkBuddy, etc.

It does three things a raw LLM is bad at:

1. **Precise charting**: BaZi four pillars, Zi Wei Dou Shu's twelve palaces, and decade/annual luck cycles are computed by a deterministic algorithm engine — **the LLM never charts on its own**. Pure-LLM charting frequently gets the day pillar, day master, or pattern wrong, and one wrong step invalidates the entire reading.
2. **Enrichment layer**: on top of the raw chart, a second layer computes pattern (格局) / strength (旺衰) / climate balance (調候) / clashes & combinations (刑沖合害) / canopy-cutting (蓋頭截腳) — giving the LLM a grounded basis for analysis.
3. **Cross-verification**: cross-checks conclusions from the two independent systems (BaZi and Zi Wei Dou Shu) — do the main themes agree, do the life-stage windows align, and which system to trust when they conflict.

## ✨ Features

- 🎯 **Accurate charting**: powered by open-source projects mingpan (BaZi, Apache-2.0) + iztro (Zi Wei Dou Shu, MIT), verified against test cases; enrichment layer regression-tested across 7 cases
- 🧭 **Three analysis modes**: BaZi only / Zi Wei Dou Shu only / BaZi + Zi Wei Dou Shu cross-verification
- 📜 **Two output formats**: in-depth Markdown essay + 🎴 single-file HTML poster (cross-verification exclusive)
- 🖼️ **Ink-wash-style chart poster**: modern minimalist × Chinese ink-wash aesthetic, with a 12-palace Zi Wei chart + BaZi four-pillar chart + six-dimension cross-check, screenshot-friendly
- 🐛 **Display-layer bug fixed**: the 命宮 (Life Palace) highlight, Life Ruler, and text chart were previously mis-placed on 寅 (Career Palace); now corrected to the true palace branch ([PR #1](https://github.com/junhao-ye/bazi-ziwei-skills/pull/1))
- 🛠️ **Cross-Agent**: one SKILL.md, works across mainstream Agents
- 🔒 **Privacy-first**: all charting runs locally, no network required; run artifacts are gitignored by default

## 🚀 Installation

```bash
git clone git@github.com:junhao-ye/bazi-ziwei-skills.git
cd bazi-ziwei-skills/calculator
npm install
```

> If `git clone` fails over HTTPS, use SSH (as shown above).

Then register the directory with your Agent (see your Agent's SKILL.md loading instructions).

## 💡 Usage

See [SKILL.md](./SKILL.md).

**No self-check after installation** — once it's installed, that's it. It starts working when the user provides a birth date.

Once a birth date is provided, the Skill first asks which analysis you want (BaZi / Zi Wei Dou Shu / cross-verification), then follows the corresponding pipeline:

```bash
cd calculator

# Step 1 — Chart (produces chart.json)
npx tsx run-chart.ts --year=2000 --month=1 --day=1 --hour=12 --minute=0 --gender=male > chart.json

# Step 2 — Convert to readable text chart (produces chart.txt)
npx tsx dump-text.ts --input=chart.json --output=chart.txt

# Step 3 — (Cross-verification poster) Render HTML
npx tsx render.ts --chart=chart.json --analysis=analysis.json \
  --template=../templates/report-zonghe-poster.html \
  --output=report.html --currentYear=2026
```

You can also chart directly from the command line, without an Agent.

## 📁 Directory structure

```
├── SKILL.md              ← Skill definition (trigger conditions, execution flow)
├── calculator/           ← Charting engine (mingpan for BaZi + iztro for Zi Wei Dou Shu + enrichBazi layer)
│   ├── run-chart.ts      ← Charting entry: birth data → JSON
│   ├── dump-text.ts      ← JSON → readable tree-style text chart
│   ├── render.ts         ← chart.json + analysis.json + template → HTML
│   ├── engine/           ← Charting engine adapters
│   └── bazi-enrich/      ← enrichBazi layer (pattern / strength / climate / relations / whole-pillar)
├── prompts/              ← Analysis prompts (BaZi / Zi Wei / cross-verification / poster JSON)
└── templates/            ← Poster template & design spec
```

## 🏗️ How it works

```
Charting (algorithmic layer, deterministic)
  → Text conversion (structured text)
  → LLM analysis (produces conclusions from prompts)
  → (optional) HTML poster rendering
```

**Key design**: the LLM is only responsible for "analysis," never for "charting" or "drawing HTML." Charting is handled by deterministic algorithms, visual presentation by a fixed template, and the LLM's structured output fills the template's slots — each layer stays in its lane.

## 🙏 Acknowledgements

- BaZi charting engine: [mingpan](https://github.com/ChesterRa/mingpan) (Apache-2.0)
- Zi Wei Dou Shu charting engine: [iztro](https://github.com/SylarLong/iztro) (MIT)
- Lunar calendar conversion: [lunar-typescript](https://github.com/6tail/lunar-typescript) (MIT)

## ⚠️ Disclaimer

This analysis is based on traditional BaZi and Zi Wei Dou Shu theoretical frameworks. It is provided for cultural research and entertainment purposes only, and does not constitute medical, financial, marital, or legal advice. One's destiny is shaped by personal choice and circumstance, not predetermined.

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
