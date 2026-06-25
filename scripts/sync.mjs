#!/usr/bin/env node
// 零依赖博客同步脚本
// 作用：
//   1. md 文件无 crtime → crtime = uptime = now；有 crtime → 仅更新 uptime（保留原格式）
//   2. 移除 md 头的 id 字段（id 改由 list.json 按 crtime 自动分配）
//   3. 根据 md 头内容重建 list.json
//
// 设计原则：不重新序列化整个 frontmatter，仅定向修改 crtime/uptime/id 行，
// 其余字段（含 description 多行块、emoji 转义）原样保留，避免无意义 diff。

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const MD_DIR = `${ROOT}md/`;
const LIST_JSON = `${ROOT}list.json`;

const now = Date.now();

// ---------- YAML 读取（仅用于取出纯文本值，写入时不走这里）----------

function unquote(raw) {
  const s = raw.trim();
  if (s === '') return '';
  if (s.startsWith('"')) {
    let inner = s.slice(1);
    if (inner.endsWith('"')) inner = inner.slice(0, -1);
    return unescapeDouble(inner);
  }
  if (s.startsWith("'")) {
    let inner = s.slice(1);
    if (inner.endsWith("'")) inner = inner.slice(0, -1);
    return inner.replace(/''/g, "'");
  }
  return s;
}

function unescapeDouble(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== '\\') { out += c; continue; }
    const n = s[i + 1];
    if (n === 'u') { out += String.fromCodePoint(parseInt(s.slice(i + 2, i + 6), 16)); i += 5; }
    else if (n === 'U') { out += String.fromCodePoint(parseInt(s.slice(i + 2, i + 10), 16)); i += 9; }
    else if (n === 'n') { out += '\n'; i++; }
    else if (n === 't') { out += '\t'; i++; }
    else if (n === 'r') { out += '\r'; i++; }
    else if (n === '"') { out += '"'; i++; }
    else if (n === '\\') { out += '\\'; i++; }
    else { out += n; i++; }
  }
  return out;
}

// 把 frontmatter 拆成有序 entries：{ key, block|null, chomp, value, valueLines }
function parseFrontmatter(lines) {
  const entries = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = /^([a-zA-Z_][\w-]*):\s*(.*)$/.exec(line);
    if (!m) { i++; continue; }
    const key = m[1];
    const rest = m[2];
    const blockMatch = /^([>|])([-+]?)\s*$/.exec(rest);
    if (blockMatch) {
      const valueLines = [];
      i++;
      while (i < lines.length && (lines[i] === '' || /^[ \t]/.test(lines[i]))) {
        valueLines.push(lines[i]);
        i++;
      }
      entries.push({ key, block: blockMatch[1], chomp: blockMatch[2], value: rest, valueLines });
    } else {
      entries.push({ key, block: null, chomp: '', value: rest, valueLines: null });
      i++;
    }
  }
  return entries;
}

// 取某个 entry 的纯文本值（用于 list.json）
function entryValue(entry) {
  if (!entry.block) return unquote(entry.value);
  const lines = entry.valueLines.map(l => l.replace(/^[ \t]+/, ''));
  if (entry.block === '>') {
    let result = '';
    let prevEmpty = false;
    for (const l of lines) {
      if (l === '') { result += '\n'; prevEmpty = true; continue; }
      if (result && !prevEmpty && !result.endsWith('\n')) result += ' ';
      result += l;
      prevEmpty = false;
    }
    return result.replace(/\n+$/, '');
  }
  return lines.join('\n').replace(/\n+$/, '');
}

// ---------- 写回：定向重建 frontmatter 行 ----------

function rebuildFrontmatter(entries, { newCrtime, newUptime, hasCrtime }) {
  const out = [];
  let crtimeWritten = false;
  let uptimeWritten = false;
  for (const e of entries) {
    if (e.key === 'id') continue;            // 删除 id
    if (e.key === 'crtime') {                // 保留原样
      out.push(`crtime: ${e.value}`);
      crtimeWritten = true;
    } else if (e.key === 'uptime') {          // 替换为 now
      out.push(`uptime: ${newUptime}`);
      uptimeWritten = true;
    } else if (e.block) {                     // 块标量原样回写
      out.push(`${e.key}: ${e.block}${e.chomp}`);
      for (const l of e.valueLines) out.push(l);
    } else {
      out.push(`${e.key}: ${e.value}`);       // 普通行原样回写
    }
  }
  if (!crtimeWritten) out.push(`crtime: ${newCrtime}`);
  if (!uptimeWritten) out.push(`uptime: ${newUptime}`);
  return out;
}

// ---------- 工具 ----------

function splitFrontmatter(content) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!m) return null;
  return { fmLines: m[1].split(/\r?\n/), body: content.slice(m[0].length) };
}

function isNumberLiteral(s) { return /^-?\d+$/.test(s.trim()); }

function toTypedValue(str) { return isNumberLiteral(str) ? Number(str) : str; }

function crtimeToMs(str) {
  const s = str.trim();
  if (isNumberLiteral(s)) return Number(s);
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

function readOldList() {
  try { return JSON.parse(readFileSync(LIST_JSON, 'utf8')); }
  catch { return []; }
}

// ---------- 主流程 ----------

const files = readdirSync(MD_DIR).filter(f => f.endsWith('.md')).sort();

const pvMap = new Map();
for (const item of readOldList()) if (item && item.fileName) pvMap.set(item.fileName, item.pv ?? 0);

const items = [];

for (const fileName of files) {
  const filePath = MD_DIR + fileName;
  const content = readFileSync(filePath, 'utf8');
  const parsed = splitFrontmatter(content);
  if (!parsed) { console.warn(`⚠ 跳过（无 frontmatter）: ${fileName}`); continue; }

  const entries = parseFrontmatter(parsed.fmLines);
  const get = key => {
    const e = entries.find(x => x.key === key);
    return e ? entryValue(e) : '';
  };

  const hasCrtime = entries.some(e => e.key === 'crtime');
  const uptimeEntry = entries.find(e => e.key === 'uptime');
  // uptime 沿用原格式：原是数字毫秒就写数字，原是 ISO 就写 ISO，缺失则数字毫秒
  const useIso = uptimeEntry && !isNumberLiteral(uptimeEntry.value);
  const newUptime = useIso ? new Date(now).toISOString() : String(now);
  const crtimeForList = hasCrtime ? get('crtime') : String(now);

  // 回写 md（仅当有变化）
  const newFmLines = rebuildFrontmatter(entries, {
    newCrtime: String(now),
    newUptime,
    hasCrtime,
  });
  const newContent = '---\n' + newFmLines.join('\n') + '\n---' + parsed.body;
  if (newContent !== content) writeFileSync(filePath, newContent);

  items.push({
    title: get('title'),
    author: get('author'),
    description: get('description'),
    crtime: toTypedValue(crtimeForList),
    uptime: toTypedValue(newUptime),
    tags: get('tags'),
    fileName,
    pv: pvMap.get(fileName) ?? 0,
    _ms: crtimeToMs(crtimeForList),
  });
}

// id 按 crtime 升序从 1 分配
items.sort((a, b) => a._ms - b._ms);
items.forEach((it, i) => { it.id = i + 1; });

// list.json 按 id 降序（新文章在前）
items.sort((a, b) => b.id - a.id);
const out = items.map(({ _ms, ...rest }) => rest);
const outStr = '[\n' + out.map(o => '  ' + JSON.stringify(o)).join(',\n') + '\n]\n';
writeFileSync(LIST_JSON, outStr);

console.log(`✓ sync 完成：${items.length} 篇，list.json 已更新`);
