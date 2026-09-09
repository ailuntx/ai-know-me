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
test('name resolution returns only metadata for flat, qualified, dotted, spaced and numeric names', () => {
  const {data} = store.document(sample);
  for (const [q,expected] of [['gitlab','services.gitlab'],['SERVICES.GITLAB','services.gitlab'],['bfl.ai','services.bfl.ai'],['services.bfl.ai','services.bfl.ai'],['services.picsi utoken','services.picsi utoken'],['10086','llm.10086'],['defaults.default_pin','defaults.default_pin']]) {
    const entry = store.resolveEntry(data,q);
    assert.deepEqual(Object.keys(entry).sort(),['group','name','path']);
    assert.equal(entry.path,expected);
    assert.equal(store.get(data,q),'••••••');
  }
  assert.throws(()=>store.resolveEntry(data,'shared'));
  assert.equal(store.resolveEntry(data,'llm.shared').path,'llm.shared');
});
test('discovery and get return metadata or masked values, even with a legacy extra argument',()=>{
  const {data}=store.document(sample);
  assert.ok(!JSON.stringify([store.summaries(data),store.get(data,'gitlab'),store.get(data,'services'),store.get(data,'gitlab',true),store.get(data,'services',true)]).includes('SENTINEL_SECRET'));
  assert.equal(store.get(data,'gitlab',true),'••••••');
  assert.equal(store.summaries(data,'bfl').length,1);
});
test('CLI uses current file, init preserves it, old commands rejected',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'akm-v2-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const file=path.join(dir,'我的密钥.yaml');await fs.writeFile(file,sample,{mode:0o600});
  const run=args=>spawnSync(process.execPath,['bin/cli.js',...args],{cwd:new URL('..',import.meta.url),env:{...process.env,AKM_CONFIG_HOME:path.join(dir,'config')},encoding:'utf8'});
  assert.equal(run(['init','--file',file]).status,0);
  assert.equal(await fs.readFile(file,'utf8'),sample);
  assert.equal(run(['get','gitlab']).stdout.trim(),'••••••');
  const injected=expected=>run(['run','--env','TOKEN=services.gitlab','--',process.execPath,'-e',`process.exit(process.env.TOKEN===${JSON.stringify(expected)}?0:9)`]);
  assert.equal(injected('SENTINEL_SECRET').status,0);
  await fs.writeFile(file,sample.replace('SENTINEL_SECRET','UPDATED'));
  assert.equal(run(['get','gitlab']).stdout.trim(),'••••••');
  assert.equal(injected('UPDATED').status,0);
  for(const cmd of ['web','start','restart','set'])assert.equal(run([cmd]).status,1);
  assert.equal(run(['get','missing']).status,1);
  assert.equal(JSON.parse(run(['doctor','--json']).stdout).entries,7);
  await fs.symlink(file,path.join(dir,'link'));assert.equal(run(['init','--file',path.join(dir,'link')]).status,1);
});

test('CLI discovery, masked get, JSON and rejected reveal never return credential values',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'akm-output-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const file=path.join(dir,'keys.yaml');await fs.writeFile(file,sample,{mode:0o600});
  const run=args=>spawnSync(process.execPath,['bin/cli.js',...args,'--file',file],{encoding:'utf8'});
  for(const args of [['list'],['list','services'],['search','git'],['get','gitlab'],['get','services'],['doctor']]) {
    for(const format of [[],['--json']]) {
      const result=run([...args,...format]);
      assert.equal(result.status,0);
      for(const value of ['SENTINEL_SECRET','DOT_SECRET','SPACE_SECRET','NUMBER_NAME','0012']) assert.ok(!(result.stdout+result.stderr).includes(value));
      if(args[0]==='get'&&args[1]==='gitlab') assert.equal(format.length?JSON.parse(result.stdout):result.stdout.trim(),'••••••');
    }
  }
  for(const args of [['get','gitlab','--reveal'],['get','gitlab','--reveal','--json'],['get','services','--reveal'],['list','--reveal'],['get','gitlab','--reveal=true'],['reveal','gitlab']]) {
    const result=run(args);
    assert.equal(result.status,1);
    assert.equal(result.stdout,'');
    assert.ok(!(result.stdout+result.stderr).includes('SENTINEL_SECRET'));
  }
  await fs.writeFile(file,'version: 1\nassets:\n  services:\n    gitlab: [SENTINEL_SECRET');
  const malformed=run(['get','gitlab']);
  assert.equal(malformed.status,1);assert.ok(!(malformed.stdout+malformed.stderr).includes('SENTINEL_SECRET'));
});

test('run injects exact values, suppresses all child output and propagates failure',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'akm-run-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const file=path.join(dir,'keys.yaml');await fs.writeFile(file,sample,{mode:0o600});
  const run=(mapping,code)=>spawnSync(process.execPath,['bin/cli.js','run','--file',file,'--env',mapping,'--',process.execPath,'-e',code],{encoding:'utf8'});
  const ok=run('TOKEN=services.gitlab',`console.log(process.env.TOKEN);console.error(Buffer.from(process.env.TOKEN).toString('base64'));process.exit(process.env.TOKEN==='SENTINEL_SECRET'?0:9)`);
  assert.equal(ok.status,0);assert.deepEqual(JSON.parse(ok.stdout),{status:'completed',exit_code:0});assert.equal(ok.stderr,'');
  const failed=run('TOKEN=services.gitlab','console.error(process.env.TOKEN);process.exit(7)');assert.equal(failed.status,7);assert.equal(JSON.parse(failed.stdout).exit_code,7);assert.ok(!(failed.stdout+failed.stderr).includes('SENTINEL_SECRET'));
  for(const mapping of ['TOKEN=services.missing','TOKEN=services','BAD-NAME=services.gitlab']){const r=run(mapping,'process.exit(99)');assert.equal(r.status,1);}
  for(const value of ['REPLACE_ME','','   ']) {
    await fs.writeFile(file,sample.replace('SENTINEL_SECRET',value));
    assert.equal(run('TOKEN=services.gitlab','process.exit(99)').status,1);
  }
});

test('run preserves PINs, dotted and spaced names and isolates injected variables',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'akm-env-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const file=path.join(dir,'keys.yaml');await fs.writeFile(file,sample,{mode:0o600});
  const args=['bin/cli.js','run','--file',file];
  for(const mapping of ['AKM_TEST_PIN=defaults.default_pin','AKM_TEST_DOT=services.bfl.ai','AKM_TEST_SPACE=services.picsi utoken','AKM_TEST_NUMBER=llm.10086']) args.push('--env',mapping);
  const code=`const e=process.env;process.exit(e.AKM_TEST_PIN==='0012'&&e.AKM_TEST_DOT==='DOT_SECRET'&&e.AKM_TEST_SPACE==='SPACE_SECRET'&&e.AKM_TEST_NUMBER==='NUMBER_NAME'?0:9)`;
  const result=spawnSync(process.execPath,[...args,'--',process.execPath,'-e',code],{encoding:'utf8'});
  assert.equal(result.status,0);assert.deepEqual(JSON.parse(result.stdout),{status:'completed',exit_code:0});assert.equal(result.stderr,'');
  assert.equal(process.env.AKM_TEST_PIN,undefined);
  const duplicate=spawnSync(process.execPath,[...args,'--env','AKM_TEST_PIN=services.gitlab','--',process.execPath,'-e','process.exit(99)'],{encoding:'utf8'});
  assert.equal(duplicate.status,1);assert.ok(!(duplicate.stdout+duplicate.stderr).includes('SENTINEL_SECRET'));
});

test('plugin starter prompts use the composer array schema',async()=>{
  const manifest=JSON.parse(await fs.readFile(new URL('../plugins/ai-know-me/.codex-plugin/plugin.json',import.meta.url),'utf8'));
  const prompts=manifest.interface.defaultPrompt;
  assert.ok(Array.isArray(prompts));assert.ok(prompts.length>=1&&prompts.length<=3);
  for(const prompt of prompts)assert.ok(typeof prompt==='string'&&prompt.trim().length>0&&prompt.length<=128);
});
