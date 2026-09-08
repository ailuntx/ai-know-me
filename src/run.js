import { spawn } from 'node:child_process';
import { get } from './store.js';

// No shell expansion and no child output in the agent-facing result.
export async function run(data, mappings, command) {
  if (!command.length || !mappings.length) throw new Error('用法：run --env NAME=分类.名称 -- 程序 参数');
  const env = { ...process.env };
  const seen = new Set();
  for (const mapping of mappings) {
    const at = mapping.indexOf('=');
    const name = mapping.slice(0, at);
    const query = mapping.slice(at + 1);
    if (at < 1 || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || !query || seen.has(name)) {
      throw new Error('--env 必须是唯一的环境变量名=凭据名称');
    }
    seen.add(name);
    const value = get(data, query, true);
    if (typeof value !== 'string' || !value.trim() || value === 'REPLACE_ME' || value.includes('\0')) {
      throw new Error('凭据为空、占位值或不可用；请更新原 YAML 文件');
    }
    env[name] = value;
  }
  return new Promise(resolve => {
    let child;
    try { child = spawn(command[0], command.slice(1), { env, shell: false, stdio: 'ignore' }); }
    catch { resolve({ status: 'failed', exit_code: 1, message: '无法启动目标程序；请检查程序及参数' }); return; }
    const signals = ['SIGINT', 'SIGTERM'];
    const handlers = signals.map(signal => () => child.kill(signal));
    signals.forEach((signal, i) => process.on(signal, handlers[i]));
    const cleanup = () => signals.forEach((signal, i) => process.off(signal, handlers[i]));
    child.once('error', () => {
      cleanup();
      resolve({ status: 'failed', exit_code: 1, message: '无法启动目标程序；请检查程序是否安装' });
    });
    child.once('close', (code, signal) => {
      cleanup();
      resolve(code === 0 ? { status: 'completed', exit_code: 0 } : {
        status: 'failed', exit_code: code ?? 1,
        ...(signal ? { signal } : {}),
        message: '目标程序未成功完成；输出已隐藏。请检查服务状态、凭据有效性及权限；退出码不能单独证明凭据过期。',
      });
    });
  });
}
