# SOURCES.md — 来源、决策与缺口记录

本文件存 provenance 与决策记录，**不参与运行时**。运行时指导在 `SKILL.md`，维护契约在 `SPEC.md`。

## 上游依赖

| 项目 | 用途 | 许可 | 仓库 |
|---|---|---|---|
| mingpan | 八字排盘核心（四柱 / 十神 / 藏干 / 星运 / 纳音 / 大运） | Apache-2.0 | https://github.com/ChesterRa/mingpan |
| iztro | 紫微斗数排盘核心（十二宫 / 主辅星 / 四化 / 大限） | MIT | https://github.com/SylarLong/iztro |
| lunar-typescript | 农历与公历互转 | MIT | https://github.com/6tail/lunar-typescript |

均为使用真实 LICENSE 文件的开源项目，非徽章声明。

## 首次来源记录

- 技能上游：`https://github.com/dzcmemory-web/bazi-ziwei-skills`
- 获取方式：git clone 被沙箱代理拦截（502），改用 GitHub git-blob API **逐文件按 SHA 重建** 37 个文件，落地后大小与 tree 声明逐一比对一致。
- 安全审查：评级 **P2（安全）**。关键 `.ts` 逐行审阅——无 network / exec / eval / 动态 require、无写出工作目录外、无读取环境变量或凭据；`package.json` 无 postinstall 等安装期钩子。
- 后续发布到自有仓库：`https://github.com/junhao-ye/bazi-ziwei-skills`（PUBLIC）

## 依赖升级记录

| 日期 | 依赖 | 变更 | 回归结果 |
|---|---|---|---|
| 2026-10-07 | iztro | `^2.6.0` → `^2.6.1` | 与升级前输出**完全一致**（四柱乙卯辛巳壬午丁未 / 日主壬 / 偏财格 / 极弱(可能从弱) / 阴男·土五局 / mingGongIndex=10），确认无破坏 |

## 关键决策

### D1：命宫显示层错位修复（PR #1）

**现象**：`dump-text.ts` 与 `render.ts` 用 `gongs[0].dizhi` 当命宫显示。

**根因**：紫微十二宫数组的首项是**官禄宫**（寅），不是命宫。正确值应由引擎输出的 `mingGongIndex` 反查——该值在 `calculator/engine/ziwei-adapter.ts` 中取自 iztro 的 `earthlyBranchOfSoulPalace`。

**影响面**：文本盘 `命宫=` 显示、海报命宫朱砂红框、命主星查表（经 `MING_ZHU` 映射）三处。

**修复**：两处均改为 `DIZHI[zw.mingGongIndex] ?? zw.gongs.find(g => g.gong === '命宫')?.dizhi`。

**验证值**：1975-06-05 14:22 男 → 命宫 **戌**（天机·天梁 双化禄权）、身宫 **子**。

**为何记入 SKILL.md**：这不是流派差异，是确定性缺陷。若未来 `命宫=` 又显示为寅，应判定为回归而非重新讨论命宫该在哪——把判定标准前置可避免反复。

**曾走过的弯路**：分析过程中一度误判「新引擎算出寅才是对的、旧报告的戌是错的」，方向完全相反。修正后确认 iztro 的戌正确，缺陷在显示层。教训：**引擎值与显示值必须分开核对**，不要用显示层的输出反推引擎对错。

### D2：海报模板独占综合印证

八字独立 / 紫微独立不提供 HTML 输出。理由：海报需要两盘并列的六维对账结构，单盘无此内容；且海报是社交分享形态，承担"惊艳"角色，限定在信息最全的路由可保证成品质量。

### D3：default 到长文而非海报

用户未明确选择时走综合印证长文。理由：长文信息完整、无落盘副作用、可在会话内先看效果；海报需要严格 JSON + 落盘，出错成本更高，不适合做默认路径。

### D4：不做真太阳时校正

排盘直接使用钟表时间。真太阳时校正需要出生地经度，而技能明确不要求出生地输入。这是一个有意的简化——保持输入门槛低，代价是时区边界用户存在偏差。已记入 `SPEC.md` 的已知限制。

### D5：新增渲染前校验脚本

`render.ts` 的 `renderTemplate()` 对模板中未匹配的占位符统一替换为 `-`（见其末尾的兜底正则）。这意味着缺字段的 `analysis.json` **不会报错**，只会渲染出一张满是破折号的海报。`scripts/validate-analysis.ts` 把这个静默失败提前暴露为可读的错误清单。

## 覆盖与缺口

**已覆盖**：
- 排盘算法层（八字 + 紫微）与补层
- 三条分析路由及其提示词
- 海报 JSON Schema 与渲染管線
- 命宫显示层缺陷及修复判定标准
- 四语 README（简中 / 繁中 / 日文 / 英文）与 docs 截图

**当前缺口**：
1. **无持久化回归样本集**：`references/evidence/` 尚未建立。当前仅有 `calculator/bazi-enrich/test-case-b.ts` 一个用例 + 命宫显示的两组实测值。积累到 3 组以上再建立。
2. **海报模板与 Schema 的耦合无程序化守卫**：改 Schema 忘改模板会导致字段静默变 `-`。`validate-analysis.ts` 只校验 JSON 侧，不校验模板占位符覆盖度。
3. **`templates/ziwei-mockup.html` 用途未标注**：该文件疑为设计阶段的紫微单盘原型，未在 SKILL.md 路由中出现。待确认是保留为参考还是移除。
4. **外部命盘文本的解析路径未规范**：SKILL.md 允许用户贴入外部排盘软件的文本，但未定义格式识别与降级策略（识别不了时如何处理）。

## 变更日志

| 日期 | 变更 |
|---|---|
| 2026-10-07 | 从上游安装并安全审查（P2）；iztro 升级至 2.6.1；修复命宫显示层错位（PR #1）；补四语 README；补 docs 截图 |
| 2026-10-07 | 按 skill-writer 规范优化：SKILL.md 重写为完整 router（补 fallback / 误路由恢复 / per-route 契约 / 已知修复一节）；新增 `scripts/validate-analysis.ts`；新增 `SPEC.md` 与 `SOURCES.md`；description 触发语重写 |
