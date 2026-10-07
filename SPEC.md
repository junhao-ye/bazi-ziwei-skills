# bazi-ziwei 技能规格（SPEC.md）

## 意图

把八字（四柱）与紫微斗数两套体系的排盘与分析做成可复用的 Agent 能力。核心判断是：**排盘必须由确定性算法完成，模型只负责分析表达**。纯模型排盘会在日柱 → 日主 → 格局 → 用神这条链上逐级失真，一步错则全盘失去参考价值。

第二层意图是**交叉印证**：八字与紫微是两套独立体系，当它们指向同一结论时可信度上升，出现冲突时需明确判定听谁——这是两个独立分析之外、单独做不出来的增量价值。

## 范围

**在范围内**：
- 八字排盘（四柱 / 十神 / 藏干 / 星运 / 自坐 / 纳音 / 大运）与格局补层（格局 / 旺衰 / 调候 / 五行 / 干支关系 / 整柱判定）
- 紫微排盘（十二宫 / 主辅星 / 生年四化 / 大限 / 阴阳 / 五行局）
- 三条分析路径：八字独立、紫微独立、综合印证
- 两种呈现：Markdown 长文、综合印证专用的单文件 HTML 海报
- 解读用户自带的外部命盘文本

**不在范围内**：
- 风水、阳宅、紫白飞星、姓名学、号码测吉凶
- 星座、塔罗、占卜签、周公解梦
- 替用户做投资 / 择偶 / 医疗 / 法律等决策
- 真太阳时经度校正（明确不做，见「已知限制」）

## 用户与触发场景

- **主要用户**：对传统命理有兴趣的个人用户；提供生辰希望获得结构化解读。
- **常见请求**：「帮我看八字」「我 1990-05-04 14:00 女，看下命盘」「这两个盘一起看看」「我 40 岁以后运势如何」「这个排盘软件导出的结果帮我解读」。
- **不应触发**：星座 / 塔罗 / 占卜签 / 风水 / 姓名学 / 号码吉凶 / 单纯日期换算。

## 运行时契约

| 项 | 要求 |
|---|---|
| **首要动作** | Step 0 决策门——先问要做哪种分析（三选一）；选综合印证再问呈现形态（长文 / 海报 / 都要）。**不得凭用户措辞跳过** |
| **必需输入** | 日期 + 时刻 + 性别。时辰缺失必须追问，不得默认子时 |
| **必需产物** | ①`chart.json`（算法层排盘）②`chart.txt`（可读文本盘）③按路由产出的分析结果 |
| **海报额外产物** | `analysis.json`（严格 JSON）→ 通过 `scripts/validate-analysis.ts` → `<name>-zonghe.html` |
| **不可协商约束** | 排盘不得绕过算法层；海报未经校验不得渲染；两盘冲突必须明确判定不调和；末尾必带免责声明 |
| **运行时加载文件** | 按路由从 `prompts/` 取一份或两份；海报路由另加载 `templates/report-zonghe-poster.html` |

### 路由契约

| 路由 | 提示词 | 输出 | 落盘 |
|---|---|---|---|
| 八字独立 | `prompts/bazi-prompt.md` | Markdown 长文 | 否 |
| 紫微独立 | `prompts/ziwei-prompt.md` | Markdown 长文 | 否 |
| 综合印证·长文 | `prompts/zonghe-yinzheng-prompt.md` | Markdown 长文 | 否 |
| 综合印证·海报 | `prompts/zonghe-poster.md` | HTML | 是 |
| 综合印证·都要 | 上述两份 | Markdown + HTML | HTML 落盘 |

- **fallback**：用户未明确选择 / 答非所问 / 说"你决定" → 走综合印证长文（信息最全、无落盘副作用、可先看效果再决定是否要海报）。
- **误路由恢复**：排盘产物（`chart.json` / `chart.txt`）与路由无关，改主意时直接切 Step 3 分支，不重排盘。

## 来源与证据模型

**权威来源**：
- 排盘算法物理实现：`calculator/engine/`（对接 mingpan / iztro）、`calculator/bazi-enrich/`（enrichBazi 补层）
- 输出结构权威：`prompts/zonghe-poster.md` 的 JSON Schema；`templates/OUTPUT-SCHEMA.md`
- 视觉权威：`templates/UI-DESIGN.md`
- 上游项目：mingpan（Apache-2.0）、iztro（MIT）、lunar-typescript（MIT）

**有用的改进来源**：
- 正例：`calculator/bazi-enrich/test-case-b.ts`（Case B 回归用例）
- 反例 / 回归信号：`命宫=` 若显示为寅（官禄宫位）即为显示层回归
- 上游变更：iztro / mingpan 版本升级需重跑回归
- 校验结果：`scripts/validate-analysis.ts` 的报错清单

**不得存储的数据**：密钥与凭据；与复现无关的第三方隐私信息。用户生辰属分析输入，随会话处理，不写入技能目录。

## 参考架构

- **`SKILL.md`**：运行时路由。含触发条件、必需输入、决策门、路由表与各路由契约、fallback、Step 1-3 执行步骤、已知修复、关键约束、失败模式。
- **`references/`**：本技能**不使用**独立 references 目录——深度知识已分别落在 `prompts/`（分析规范）、`templates/`（视觉与输出结构）、`calculator/*.ts`（算法实现）中，再抽一层会与之重复。
- **`references/evidence/`**：暂未建立。当前回归证据是 `calculator/bazi-enrich/test-case-b.ts` 与命宫显示的两组实测值。若后续积累多组正/负例再建立。
- **`scripts/`**：`validate-analysis.ts` —— 渲染前结构性校验。
- **`assets/`**：不单设；模板已由上游目录承载（`templates/`）。

## 校验

**轻量校验**（每次改动技能后）：
```bash
uv run scripts/quick_validate.py <path/to/bazi-ziwei>   # 从 skill-writer 目录运行
```
检查 frontmatter 合法性、`name` 与目录一致、被引用文件存在。

**深入校验**（改动生成逻辑后）：
```bash
# 1. 完整管線回归（用固定样例盘）
cd calculator
npx tsx run-chart.ts --year=1975 --month=6 --day=5 --hour=14 --minute=22 --gender=male > /tmp/c.json
npx tsx dump-text.ts --input=/tmp/c.json --output=/tmp/c.txt
grep '命宫=' /tmp/c.txt        # 必须为 戌，不得为 寅

# 2. 校验脚本自测
npx tsx ../scripts/validate-analysis.ts <known-good-analysis.json>   # 期望 exit 0
npx tsx ../scripts/validate-analysis.ts <known-bad.json>             # 期望 exit 1 且列出错误
```

**验收门**：
1. 完整管線三段均 exit 0，`命宫=` 正确。
2. 校验脚本对已知合法 `analysis.json` 返回 0，对缺字段样本返回 1。
3. 渲染出的 HTML 中，朱砂红框落在 `mingGongIndex` 对应宫位。

## 已知限制

- **不做真太阳时校正**：排盘直接用钟表时间。出生地接近时区边界、或需高精度择时的用户会与实际有偏差——这是有意的简化，不是缺陷。
- **海报仅对综合印证开放**：八字独立 / 紫微独立无 HTML 输出。选择海报即意味着接受八字+紫微两盘全量分析。
- **HTML 模板与数据结构强耦合**：改 `prompts/zonghe-poster.md` 的 Schema 必须同步改 `templates/report-zonghe-poster.html` 的占位符，否则字段静默变 `-`。
- **流派差异不视为错误**：与外部软件结果不一致时，按算法层 `notes` 解释命名差异（如建禄格 vs 比肩格），不做对错判定。
- **Windows 终端编码**：PowerShell 下中文路径可能乱码，应使用 cmd / git bash / WSL。

## 维护说明

- **何时改 `SKILL.md`**：路由增删、触发条件变化、新增硬约束、发现新的失败模式。
- **何时改 `SPEC.md`**：意图 / 范围变化、路由契约变化、校验门变化、参考架构调整。
- **何时改 `SOURCES.md`**：上游依赖升级、命宫类修复决策、来源增删、gap 变化。
- **何时建 `references/evidence/`**：累积到 3 组以上可复用的正 / 负例时。
