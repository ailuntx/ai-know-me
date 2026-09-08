#!/usr/bin/env node
import { parseArgs } from 'node:util';
import * as store from '../src/store.js';

const version = '0.2.2';
const help = `ai-know-me ${version} — 本地密钥查询

init --file PATH       指定已有 YAML 文件
list [GROUP]           列出名称，不显示值
search QUERY           搜索名称或分类
get NAME               查看条目；--reveal 显示原值
get GROUP.NAME         按分类定位，支持名称中的点和空格
doctor                 检查文件格式与权限

通用：--file PATH --json
直接编辑原 YAML 文件，查询立即生效。无 Web、MCP 或后台服务。`;
try {
  const { values: v, positionals: p } = parseArgs({ allowPositionals: true, options: {
    file: { type: 'string' }, json: { type: 'boolean' }, reveal: { type: 'boolean' },
    help: { type: 'boolean' }, version: { type: 'boolean' },
  } });
  const [command, target, ...extra] = p;
  if (v.version) { console.log(version); process.exit(0); }
  if (v.help || !command) { console.log(help); process.exit(0); }
  if (!['init', 'list', 'search', 'get', 'doctor'].includes(command)) throw new Error('未知命令；使用 --help。修改内容请直接编辑原 YAML 文件。');
  if (extra.length || (['init', 'doctor'].includes(command) && target)) throw new Error('参数过多；含空格的名称请加引号');
  if (v.reveal && command !== 'get') throw new Error('--reveal 仅用于 get');
  let result;
  if (command === 'init') result = await store.init(v.file);
  else {
    const file = await store.resolveFile(v.file);
    const { data, stat } = await store.read(file);
    if (command === 'list') {
      if (target && !Object.hasOwn(data.assets, target.toLowerCase())) throw new Error('分类不存在');
      result = store.summaries(data).filter(entry => !target || entry.group === target.toLowerCase());
    } else if (command === 'search') {
      if (!target) throw new Error('请输入搜索词');
      result = store.summaries(data, target);
    } else if (command === 'get') {
      if (!target) throw new Error('请输入名称或分类.名称');
      result = store.get(data, target, v.reveal);
    } else result = { valid: true, file, groups: Object.keys(data.assets), entries: store.summaries(data).length, privatePermissions: (stat.mode & 0o077) === 0 };
  }
  console.log(typeof result === 'string' && !v.json ? result : JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.code ? `操作失败 (${error.code})` : error.message);
  process.exitCode = 1;
}
