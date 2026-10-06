import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
if(Number(process.versions.node.split('.')[0])<22)throw new Error('Instale o Node.js 22.13 ou superior.');
if(existsSync('.env'))process.loadEnvFile('.env');
process.env.CLOUDFLARE_CF_FETCH_ENABLED='false';
process.env.WRANGLER_SEND_METRICS='false';
process.env.LOCAL_USER_EMAIL ||= 'admin@uniao.local';
process.env.LOCAL_USER_NAME ||= 'Administrador local';
mkdirSync('.sites-runtime',{recursive:true});
writeFileSync('.sites-runtime/execution-profile.json',JSON.stringify({executionProfile:'portable'}));
function run(args){const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env:process.env});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status??1);}
const action=process.argv[2]||'dev';
if(!['setup','dev','build','check'].includes(action))throw new Error('Use setup, dev, build ou check.');
if(action==='setup'||action==='dev'){
 run(['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local','--config','wrangler.local.json','--persist-to','.wrangler/state']);
 console.log('\nBanco local pronto. Os dados persistem em .wrangler/state.\n');
}
if(action==='dev'){
 console.log('Abrir http://localhost:5173 — clique em Entrar com ChatGPT para iniciar a sessão LOCAL.');
 process.argv=[process.execPath,path.join(root,'scripts/run-framework.mjs'),'dev','--host','127.0.0.1','--strictPort'];
 await import('./run-framework.mjs');
}
if(action==='build')run(['scripts/run-framework.mjs','build']);
if(action==='check')run(['node_modules/typescript/bin/tsc','--noEmit']);
