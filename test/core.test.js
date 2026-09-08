import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as store from '../src/store.js';
const sample = `# user comment\nversion: 1\nassets:\n  defaults:\n    default_pin: "0012"\n  services:\n    gitlab: "SENTINEL_SECRET"\n    bfl.ai: "DOT_SECRET"\n    picsi utoken: "SPACE_SECRET"\n    shared: "ONE"\n  llm:\n    shared: "TWO"\n    "10086": "NUMBER_NAME"\n`;
test('reject invalid, duplicate, uppercase and non-string data without leaking values', () => {
  for (const text of ['version: 1\nversion: 1\nassets: {}', 'version: 1\nassets: &a {}', 'version: 1\nassets: {}\n---\nx: y', 'version: 1\nassets: {llm: {token: 123}}', 'version: 1\nassets: {llm: {TOKEN: secret}}', 'version: 1\nassets: {llm: {token: !!str secret}}', 'version: 1\nassets: {llm: {token: {nested: secret}}}']) assert.throws(() => store.document(text));
  try { store.document(sample+'bad: [SECRET'); } catch(e) { assert.ok(!e.message.includes('SECRET')); }
});
test('flat names, qualified names, dots, spaces, numeric names and PIN retain exact values', () => {
  const {data} = store.document(sample);
  for (const [q,expected] of [['gitlab','SENTINEL_SECRET'],['SERVICES.GITLAB','SENTINEL_SECRET'],['bfl.ai','DOT_SECRET'],['services.bfl.ai','DOT_SECRET'],['services.picsi utoken','SPACE_SECRET'],['10086','NUMBER_NAME'],['defaults.default_pin','0012']]) assert.equal(store.get(data,q,true),expected);
  assert.throws(()=>store.get(data,'shared',true));
  assert.equal(store.get(data,'llm.shared',true),'TWO');
});
test('discovery and normal get never emit values; bulk reveal is rejected',()=>{
  const {data}=store.document(sample);
  assert.ok(!JSON.stringify([store.summaries(data),store.get(data,'gitlab'),store.get(data,'services')]).includes('SENTINEL_SECRET'));
  assert.throws(()=>store.get(data,'services',true));
  assert.equal(store.summaries(data,'bfl').length,1);
});
test('CLI uses current file, init preserves it, old commands rejected',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'akm-v2-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const file=path.join(dir,'我的密钥.yaml');await fs.writeFile(file,sample,{mode:0o600});
  const run=args=>spawnSync(process.execPath,['bin/cli.js',...args],{cwd:new URL('..',import.meta.url),env:{...process.env,AKM_CONFIG_HOME:path.join(dir,'config')},encoding:'utf8'});
  assert.equal(run(['init','--file',file]).status,0);
  assert.equal(await fs.readFile(file,'utf8'),sample);
  assert.equal(run(['get','gitlab','--reveal']).stdout.trim(),'SENTINEL_SECRET');
  await fs.writeFile(file,sample.replace('SENTINEL_SECRET','UPDATED'));
  assert.equal(run(['get','gitlab','--reveal']).stdout.trim(),'UPDATED');
  for(const cmd of ['web','start','restart','set'])assert.equal(run([cmd]).status,1);
  assert.equal(run(['get','missing']).status,1);
  assert.equal(JSON.parse(run(['doctor','--json']).stdout).entries,7);
  await fs.symlink(file,path.join(dir,'link'));assert.equal(run(['init','--file',path.join(dir,'link')]).status,1);
});

test('run injects exact values, suppresses all child output and propagates failure',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'akm-run-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const file=path.join(dir,'keys.yaml');await fs.writeFile(file,sample,{mode:0o600});
  const run=(mapping,code)=>spawnSync(process.execPath,['bin/cli.js','run','--file',file,'--env',mapping,'--',process.execPath,'-e',code],{encoding:'utf8'});
  const ok=run('TOKEN=services.gitlab',`console.log(process.env.TOKEN);console.error(Buffer.from(process.env.TOKEN).toString('base64'));process.exit(process.env.TOKEN==='SENTINEL_SECRET'?0:9)`);
  assert.equal(ok.status,0);assert.deepEqual(JSON.parse(ok.stdout),{status:'completed',exit_code:0});assert.equal(ok.stderr,'');
  const failed=run('TOKEN=services.gitlab','console.error(process.env.TOKEN);process.exit(7)');assert.equal(failed.status,7);assert.equal(JSON.parse(failed.stdout).exit_code,7);assert.ok(!(failed.stdout+failed.stderr).includes('SENTINEL_SECRET'));
  for(const mapping of ['TOKEN=services.missing','TOKEN=services','BAD-NAME=services.gitlab']){const r=run(mapping,'process.exit(99)');assert.equal(r.status,1);}
  await fs.writeFile(file,sample.replace('SENTINEL_SECRET','REPLACE_ME'));assert.equal(run('TOKEN=services.gitlab','process.exit(99)').status,1);
});
