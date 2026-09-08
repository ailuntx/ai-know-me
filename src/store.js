import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import YAML from 'yaml';

export const configPath = () => path.join(
  process.env.AKM_CONFIG_HOME || path.join(os.homedir(), '.config/ai-know-me'),
  'config.json',
);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const reserved = new Set(['__proto__', 'constructor', 'prototype']);

export function document(text) {
  const docs = YAML.parseAllDocuments(text, { prettyErrors: false, strict: true, uniqueKeys: true, logLevel: 'silent' });
  if (docs.length !== 1) throw new Error('只支持单个 YAML 文档');
  const doc = docs[0];
  if (doc.errors.length || doc.warnings.length) throw new Error('YAML 格式无效（不回显原文）');
  YAML.visit(doc, (_, node) => {
    if (YAML.isAlias(node) || node?.anchor || node?.tag) throw new Error('不支持 YAML 引用、锚点或标签');
  });
  const data = doc.toJS({ maxAliasCount: 0 });
  if (!object(data) || data.version !== 1 || !object(data.assets) || Object.keys(data).some(k => !['version', 'assets'].includes(k))) {
    throw new Error('需要 version: 1 和 assets 映射');
  }
  for (const [group, entries] of Object.entries(data.assets)) {
    if (!/^[a-z][a-z0-9_-]*$/.test(group) || reserved.has(group) || !object(entries)) throw new Error('分类应为小写名称，内容应为名称和值的映射');
    for (const [key, value] of Object.entries(entries)) {
      if (!key.trim() || key !== key.toLowerCase() || reserved.has(key) || /[\r\n]/.test(key)) throw new Error('名称应为非空、小写、单行文本');
      if (typeof value !== 'string') throw new Error('密钥值必须是字符串；数字或 PIN 请加引号');
    }
  }
  return { doc, data };
}

export async function resolveFile(file) {
  if (file) return path.resolve(file);
  try {
    const config = JSON.parse(await fs.readFile(configPath(), 'utf8'));
    if (typeof config.file !== 'string' || !path.isAbsolute(config.file)) throw new Error();
    return config.file;
  } catch { throw new Error('尚未初始化：ai-know-me init --file /absolute/path/我的密钥.yaml'); }
}

export async function read(file) {
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('路径必须是普通文件');
  const text = await fs.readFile(file, 'utf8');
  return { ...document(text), stat };
}

export async function init(file) {
  if (!file) throw new Error('请指定 --file');
  file = path.resolve(file);
  // Register an existing user-maintained file; never create or rewrite credentials.
  await read(file);
  await fs.mkdir(path.dirname(configPath()), { recursive: true, mode: 0o700 });
  await fs.writeFile(configPath(), JSON.stringify({ file }, null, 2) + '\n', { mode: 0o600 });
  return { file };
}

export function summaries(data, query = '') {
  query = query.toLowerCase();
  return Object.entries(data.assets).flatMap(([group, entries]) =>
    Object.keys(entries).map(name => ({ group, name, path: `${group}.${name}` })),
  ).filter(entry => entry.path.includes(query));
}

export function get(data, query, reveal = false) {
  query = query.toLowerCase();
  // Qualified paths match the full stored name, including dots and spaces.
  const all = summaries(data);
  const qualified = all.filter(entry => entry.path === query);
  const matches = qualified.length ? qualified : all.filter(entry => entry.name === query);
  if (matches.length > 1) throw new Error('名称在多个分类中重复，请使用分类.名称');
  if (matches.length === 1) {
    const { group, name } = matches[0];
    return reveal ? data.assets[group][name] : '••••••';
  }
  if (Object.hasOwn(data.assets, query)) {
    if (reveal) throw new Error('请指定单个名称，不能一次显示整个分类的密钥');
    return summaries(data).filter(entry => entry.group === query);
  }
  throw new Error('没有找到名称');
}
