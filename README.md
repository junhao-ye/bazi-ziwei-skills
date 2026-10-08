# bazi-ziwei-skills

**AI 八字（四柱）+ 紫微斗数 排盘与综合印证 Skill**

精准算法排盘（不让 LLM 猜）· 三种分析模式 · 一键生成水墨风 HTML 命盘海报

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
![Language](https://img.shields.io/badge/语言-简中%20%7C%20繁中%20%7C%20日本語%20%7C%20EN-blue)

[繁體中文](./README.zh-TW.md) | **简体中文** | [日本語](./README.ja.md) | [English](./README.en.md)

<br>

<table>
<tr>
<td width="50%">
<a href="./docs/v2-full.png" target="_blank">
<img src="./docs/v2-overview.webp" alt="综合印证海报 - 速览卡（首屏）">
</a>
</td>
<td width="50%">
<a href="./docs/v2-full.png" target="_blank">
<img src="./docs/v2-full.webp" alt="综合印证海报 - 完整版式（九个模块）">
</a>
</td>
</tr>
</table>

<sub>综合印证海报示意（左：速览卡首屏；右：完整版式全页，点击放大）。注意紫微十二宫盘中朱砂红框标注的「命宫」——本仓库已修复其错位 bug，红框现正确落在命宫地支。</sub>

---

## 这是什么

一个遵循 [SKILL.md 开放标准](https://code.claude.com/docs/en/skills) 的命理分析 Skill，可装入 Claude Code / Claude Desktop / Codex / Cursor / WorkBuddy 等支持该标准的 AI Agent。

它做大模型单独做不好的三件事：

1. **精准排盘**：八字四柱、紫微十二宫、大运流年由内置算法库计算，**不让 LLM 自己排**——纯 LLM 排盘常把日柱、日主、格局算错，一步错则全盘失真。
2. **格局补层**：在排盘之上补一层"格局 / 旺衰 / 调候 / 刑冲合害 / 盖头截脚"算法，喂给 LLM 做有依据的分析。
3. **综合印证**：把八字与紫微两套独立体系的结论做交叉对账——主轴是否一致、人生窗口是否对齐、冲突时听谁。

## ✨ 特性

- 🎯 **算法精准**：排盘核心源自开源项目 mingpan（八字，Apache-2.0）+ iztro（紫微，MIT），经实测对齐；补层算法经 7 组案例多维度回归验证
- 🧭 **三种分析模式**：八字独立 / 紫微独立 / 八字 + 紫微综合印证
- 📜 **两种呈现形态**：Markdown 长文深度版 + 🎴 单文件 HTML 海报版（综合印证专享）
- 🖼️ **水墨风命盘海报**：现代极简 × 中式水墨，含紫微 12 宫盘 + 八字四柱盘 + 六维交叉对账，可截图分享
- 🐛 **已修复显示层 bug**：命宫红框 / 命主星 / 文本盘曾误落"寅（官禄宫）"，现已修正为正确命宫地支（[PR #1](https://github.com/junhao-ye/bazi-ziwei-skills/pull/1)）
- 🛡️ **渲染前强校验**：海报生成前须通过 `scripts/validate-analysis.ts` 检查——字段完整性、固定数量、枚举合法性、配对一致性。渲染脚本对缺失字段是静默兜底的，这道校验把问题提前暴露成可读清单
- 🧭 **完整路由契约**：五条分支各有明确输入 / 输出 / 落盘约定，含 fallback 与误路由恢复（改主意不必重排盘）
- 📐 **结构化文档**：[SKILL.md](./SKILL.md) 运行时路由 + [SPEC.md](./SPEC.md) 维护契约 + [SOURCES.md](./SOURCES.md) 来源与决策记录
- 🛠️ **跨 Agent**：一份 SKILL.md，多个主流 Agent 通用
- 🔒 **隐私优先**：所有排盘在本地完成，无需联网；运行产物默认 gitignore

## 🚀 安装

```bash
git clone git@github.com:junhao-ye/bazi-ziwei-skills.git
cd bazi-ziwei-skills/calculator
npm install
```

> 若 `git clone` 走 HTTPS 不通，改用 SSH（见上方指令）。

接着把这个目录注册到你的 Agent（参考各 Agent 的 SKILL.md 加载方式）。

## 💡 使用

详见 [SKILL.md](./SKILL.md)。

**安装后不主动自检**——装好即是装好，等用户提供生辰再开始工作。

提供生辰后，Skill 会先问你要哪种分析（八字 / 紫微 / 综合印证），再按选择走对应流程：

```bash
cd calculator

# Step 1 排盘（产出 chart.json）
npx tsx run-chart.ts --year=2000 --month=1 --day=1 --hour=12 --minute=0 --gender=male > chart.json

# Step 2 转文本盘（产出 chart.txt）
npx tsx dump-text.ts --input=chart.json --output=chart.txt

# Step 2.5 校验 analysis.json（海报模式必做，不通过不得渲染）
npx tsx ../scripts/validate-analysis.ts ../analysis.json

# Step 3（综合印证海报）渲染 HTML
npx tsx render.ts --chart=chart.json --analysis=analysis.json \
  --template=../templates/report-zonghe-poster.html \
  --output=report.html --currentYear=2026
```

也可以完全不经过 Agent，直接用命令行排盘。

> **为什么要 Step 2.5**：渲染脚本对模板中未匹配的占位符会统一替换成 `-`——缺字段的 `analysis.json` 不会报错，只会安静地渲染出一张满是破折号的海报。校验脚本把这个静默失败提前暴露成可读的错误清单。

## 📁 目录结构

```
├── SKILL.md              ← 运行时路由（触发条件、决策门、执行流程、失败模式）
├── SPEC.md               ← 维护契约（意图 / 范围 / 运行时契约 / 校验门 / 已知限制）
├── SOURCES.md            ← 来源与决策记录（上游依赖、修复决策、缺口清单）
├── calculator/           ← 排盘引擎（mingpan 八字 + iztro 紫微 + enrichBazi 补层）
│   ├── run-chart.ts      ← 排盘入口：生辰 → JSON
│   ├── dump-text.ts      ← JSON → 文墨天机风文本盘
│   ├── render.ts         ← chart.json + analysis.json + 模板 → HTML
│   ├── engine/           ← 排盘引擎适配层
│   └── bazi-enrich/      ← enrichBazi 补层（格局 / 旺衰 / 调候 / 关系 / 整柱）
├── scripts/              ← 校验脚本
│   └── validate-analysis.ts  ← 渲染前校验 analysis.json
├── prompts/              ← 分析提示词（八字 / 紫微 / 综合印证 / 海报 JSON）
└── templates/            ← 海报模板与设计规范
```

## 🏗️ 工作原理

```
排盘（算法层，确定性计算）
  → 文本盘转换（结构化文本）
  → LLM 分析（按提示词产出结论）
  → 校验 analysis.json（结构性检查）
  →（可选）渲染 HTML 海报
```

**关键设计**：LLM 只负责"分析"，不负责"排盘"和"画 HTML"。排盘交给确定性算法，HTML 视觉交给固定模板，LLM 产出的结构化内容填进模板槽位——三者各司其职，互不污染。

**路由设计**：五条分支（八字独立 / 紫微独立 / 综合印证 × 长文 / 海报）各有明确的输入、输出与落盘约定。排盘产物与路由解耦——用户中途改主意时切换分支即可，不必重排盘。

## 🙏 致谢

- 八字排盘核心算法：[mingpan](https://github.com/ChesterRa/mingpan)（Apache-2.0）
- 紫微斗数排盘核心算法：[iztro](https://github.com/SylarLong/iztro)（MIT）
- 农历日期转换：[lunar-typescript](https://github.com/6tail/lunar-typescript)（MIT）

## ⚠️ 免责声明

本分析基于传统八字与紫微斗数理论框架，仅供文化研究与娱乐参考，不构成医疗、投资、婚姻、法律等任何决策依据。命运由个人选择与客观环境共同塑造。

## 📄 License

本项目采用 [MIT License](./LICENSE) 开源协议。
