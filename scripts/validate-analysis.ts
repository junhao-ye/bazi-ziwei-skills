// 渲染前校验：检查 analysis.json 是否满足 prompts/zonghe-poster.md 的 schema。
//
// 为什么需要：render.ts 对缺失字段是「静默容忍」的——模板里未匹配的占位符
// 一律替换成 "-"，所以一份缺字段的 analysis.json 会渲染出满屏破折号的海报
// 而不报任何错。这道校验把问题提前暴露成可读的错误清单。
//
// 用法:
//   npx tsx scripts/validate-analysis.ts <path/to/analysis.json>
//
// 退出码: 0 = 通过（含仅有 warning），1 = 有 error
//
// 只做结构性校验（字段存在性 / 数量 / 枚举 / 字数上限），不评判内容质量。

import * as fs from 'fs';

type Issue = { level: 'error' | 'warn'; path: string; msg: string };

const issues: Issue[] = [];
const err = (path: string, msg: string) => issues.push({ level: 'error', path, msg });
const warn = (path: string, msg: string) => issues.push({ level: 'warn', path, msg });

// ---------- 工具函数 ----------

function isPlainObject(v: any): boolean {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** 取非空字符串；空串 / 全空白 / 纯 '-' 都算缺失 */
function str(v: any): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (t === '' || t === '-') return null;
  return t;
}

/** 校验必填字符串 + 可选字数上限 */
function needStr(obj: any, key: string, path: string, maxLen?: number): string | null {
  const v = str(obj?.[key]);
  if (v === null) {
    err(`${path}.${key}`, '缺失或为空');
    return null;
  }
  if (maxLen !== undefined && v.length > maxLen) {
    warn(`${path}.${key}`, `超长 ${v.length} > ${maxLen} 字（模板可能溢出）`);
  }
  return v;
}

/** 校验数组长度固定 */
function needArr(obj: any, key: string, path: string, expect: number): any[] | null {
  const v = obj?.[key];
  if (!Array.isArray(v)) {
    err(`${path}.${key}`, `缺失或不是数组（应为 ${expect} 项）`);
    return null;
  }
  if (v.length !== expect) {
    err(`${path}.${key}`, `数量 ${v.length} ≠ 期望 ${expect}`);
  }
  return v;
}

/** 校验枚举 */
function needEnum(obj: any, key: string, path: string, allowed: string[], label?: string): void {
  const v = str(obj?.[key]);
  if (v === null) {
    err(`${path}.${key}`, '缺失或为空');
    return;
  }
  if (!allowed.includes(v)) {
    err(`${path}.${key}`, `值 "${v}" 不在允许集 [${allowed.join(' / ')}]${label ? ' — ' + label : ''}`);
  }
}

const LEVELS = ['高', '中高', '中', '中低', '低'];

// ---------- 主校验 ----------

function validate(a: any): void {
  if (!isPlainObject(a)) {
    err('$', '顶层不是 JSON 对象');
    return;
  }

  // --- meta ---
  needStr(a.meta, 'archetype_name', 'meta', 7);
  needStr(a.meta, 'axis_oneliner', 'meta', 30);

  // --- axes ---
  needStr(a.axes, 'bazi_main', 'axes', 45);
  needStr(a.axes, 'ziwei_main', 'axes', 45);

  // --- consistency ---
  needEnum(a, 'consistency', '$', ['同向印证', '互补印证', '存在矛盾']);

  // --- strengths / weaknesses ---
  for (const key of ['strengths', 'weaknesses'] as const) {
    const arr = needArr(a, key, '$', 3);
    if (arr) {
      arr.forEach((item, i) => {
        needStr(item, 'title', `${key}[${i}]`, 6);
        needStr(item, 'desc', `${key}[${i}]`, 25);
      });
    }
  }

  // --- section_01 / section_02 ---
  const s1 = needStr(a.section_01, 'text', 'section_01', 250);
  if (s1 && s1.length < 180) {
    warn('section_01.text', `偏短 ${s1.length} < 180 字（期望 180-250）`);
  }
  if (a.section_01 && a.section_01.word_count !== undefined) {
    const wc = a.section_01.word_count;
    if (typeof wc !== 'number' || !Number.isInteger(wc)) {
      warn('section_01.word_count', '不是整数');
    } else if (s1 && Math.abs(wc - s1.length) > 15) {
      warn('section_01.word_count', `声明 ${wc} 与实际 ${s1.length} 偏差过大`);
    }
  } else {
    warn('section_01.word_count', '缺失（渲染不吃该字段，仅提示）');
  }
  needStr(a.section_02, 'conclusion', 'section_02', 100);

  // --- dim: 6 维度 ---
  const DIMS = ['career', 'wealth', 'marriage', 'children', 'family', 'health'];
  if (!isPlainObject(a.dim)) {
    err('dim', '缺失或不是对象');
  } else {
    for (const d of DIMS) {
      const node = a.dim[d];
      const p = `dim.${d}`;
      if (!isPlainObject(node)) {
        err(p, '缺失');
        continue;
      }
      needStr(node, 'bazi', p, 30);
      needStr(node, 'ziwei', p, 30);
      needStr(node, 'fused', p, 30);
      needEnum(node, 'verdict', p, ['🟢 同向', '⚠ 部分冲突', '🔴 矛盾']);
      needEnum(node, 'verdict_class', p, ['verdict-yes', 'verdict-partial', 'verdict-no']);
      // verdict 与 class 必须配对
      const pair: Record<string, string> = {
        '🟢 同向': 'verdict-yes',
        '⚠ 部分冲突': 'verdict-partial',
        '🔴 矛盾': 'verdict-no',
      };
      const vv = str(node.verdict);
      const cc = str(node.verdict_class);
      if (vv && cc && pair[vv] && pair[vv] !== cc) {
        err(p, `verdict "${vv}" 与 verdict_class "${cc}" 不匹配（应为 ${pair[vv]}）`);
      }
    }
    const extra = Object.keys(a.dim).filter((k) => !DIMS.includes(k));
    if (extra.length) warn('dim', `存在多余维度: ${extra.join(', ')}`);
  }

  // --- conflicts: 3 项 ---
  const conflicts = needArr(a, 'conflicts', '$', 3);
  if (conflicts) {
    conflicts.forEach((c, i) => {
      const p = `conflicts[${i}]`;
      needStr(c, 'point', p, 8);
      needStr(c, 'bazi', p, 25);
      needStr(c, 'ziwei', p, 25);
      needStr(c, 'advice', p, 30);
      needEnum(c, 'impact', p, ['低', '中', '高']);
      needEnum(c, 'impact_class', p, ['low', 'mid', 'high']);
      const pair: Record<string, string> = { 低: 'low', 中: 'mid', 高: 'high' };
      const iv = str(c.impact);
      const ic = str(c.impact_class);
      if (iv && ic && pair[iv] && pair[iv] !== ic) {
        err(p, `impact "${iv}" 与 impact_class "${ic}" 不匹配（应为 ${pair[iv]}）`);
      }
    });
  }

  // --- final ---
  if (!isPlainObject(a.final)) {
    err('final', '缺失或不是对象');
  } else {
    needStr(a.final, 'life_axis', 'final', 30);
    const nodes = needArr(a.final, 'nodes', 'final', 5);
    if (nodes) {
      nodes.forEach((n, i) => {
        const p = `final.nodes[${i}]`;
        if (n?.age === undefined || n?.age === null || n?.age === '') err(`${p}.age`, '缺失');
        else if (typeof n.age !== 'number' && !/^\d+/.test(String(n.age))) {
          warn(`${p}.age`, `非数字: ${JSON.stringify(n.age)}`);
        }
        if (n?.year === undefined || n?.year === null || n?.year === '') err(`${p}.year`, '缺失');
        else if (typeof n.year !== 'number' && !/^\d{4}/.test(String(n.year))) {
          warn(`${p}.year`, `非年份: ${JSON.stringify(n.year)}`);
        }
        needStr(n, 'event', p, 40);
      });
    }
    const risks = needArr(a.final, 'risks', 'final', 3);
    if (risks) {
      risks.forEach((r, i) => {
        needStr(r, 'range', `final.risks[${i}]`);
        needStr(r, 'desc', `final.risks[${i}]`, 40);
      });
    }
    const lev = needArr(a.final, 'leverage', 'final', 2);
    if (lev) {
      lev.forEach((l, i) => {
        needStr(l, 'title', `final.leverage[${i}]`, 10);
        needStr(l, 'desc', `final.leverage[${i}]`, 40);
      });
    }
    const advice = needArr(a.final, 'advice', 'final', 4);
    if (advice) {
      advice.forEach((t, i) => {
        const v = str(t);
        if (v === null) err(`final.advice[${i}]`, '缺失或为空');
        else if (v.length > 25) warn(`final.advice[${i}]`, `超长 ${v.length} > 25 字`);
      });
    }
  }

  // --- confidence ---
  if (!isPlainObject(a.confidence)) {
    err('confidence', '缺失或不是对象');
  } else {
    for (const k of ['bazi', 'ziwei', 'consistency', 'stability'] as const) {
      needEnum(a.confidence, `${k}_level`, 'confidence', LEVELS);
      const sc = a.confidence[`${k}_score`];
      if (sc === undefined || sc === null || sc === '') {
        err(`confidence.${k}_score`, '缺失');
      } else {
        const num = typeof sc === 'number' ? sc : Number(sc);
        if (Number.isNaN(num) || num < 0 || num > 1) {
          err(`confidence.${k}_score`, `值 ${JSON.stringify(sc)} 不在 0.00-1.00`);
        }
      }
    }
    needStr(a.confidence, 'note', 'confidence', 80);
  }
}

// ---------- 入口 ----------

function main(): void {
  const file = process.argv[2];
  if (!file) {
    console.error('用法: npx tsx scripts/validate-analysis.ts <path/to/analysis.json>');
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error(`✗ 文件不存在: ${file}`);
    process.exit(1);
  }

  let raw = '';
  try {
    raw = fs.readFileSync(file, 'utf-8');
  } catch (e: any) {
    console.error(`✗ 读取失败: ${e?.message ?? e}`);
    process.exit(1);
  }

  // 剥掉模型可能带的 markdown 包装
  const cleaned = raw.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e: any) {
    console.error('✗ JSON 解析失败 —— 模型输出可能不是严格 JSON。');
    console.error(`  ${e?.message ?? e}`);
    const head = cleaned.slice(0, 120).replace(/\n/g, '⏎');
    console.error(`  开头 120 字符: ${head}`);
    console.error('\n处理：要求模型重新输出，直接以 { 开头、} 结尾，不要 markdown 包装。');
    process.exit(1);
  }

  validate(parsed);

  const errors = issues.filter((i) => i.level === 'error');
  const warns = issues.filter((i) => i.level === 'warn');

  if (warns.length) {
    console.log(`\n⚠ ${warns.length} 条警告（不阻止渲染）:`);
    for (const w of warns) console.log(`  · ${w.path}: ${w.msg}`);
  }
  if (errors.length) {
    console.log(`\n✗ ${errors.length} 条错误（阻止渲染）:`);
    for (const e of errors) console.log(`  · ${e.path}: ${e.msg}`);
    console.log('\n处理：把以上清单回给模型，要求补全后重新产出 analysis.json，再校验一次。');
    console.log('      不要用默认值或凭空编造填充。');
    process.exit(1);
  }

  console.log(`\n✓ analysis.json 校验通过（${warns.length} 条警告）。可以渲染。`);
}

main();
