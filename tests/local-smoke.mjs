import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const child=spawn(process.execPath,['scripts/local.mjs','dev'],{stdio:['ignore','pipe','pipe']});
const fetchOriginal=globalThis.fetch;globalThis.fetch=(url,opts={})=>fetchOriginal(url,{...opts,signal:AbortSignal.timeout(30000)});
let log='';child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);
const base='http://127.0.0.1:5173';
try{
 let ready=false;for(let i=0;i<30;i++){if(child.exitCode!==null)throw Error('Servidor encerrou: '+log);try{const r=await fetch(base+'/api/data');if(r.status===401){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,1000));}
 if(!ready)throw Error('Servidor não inicializou: '+log);
 console.log('PASS: acesso anônimo bloqueado');
 const login=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});
 assert.equal(login.status,302);const cookie=login.headers.get('set-cookie').split(';')[0];
 const headers={Cookie:cookie,'Content-Type':'application/json',Origin:base};
 const initial=await fetch(base+'/api/data',{headers});const data=await initial.json();assert.equal(initial.status,200,JSON.stringify(data));assert.equal(data.me.role,'Administrador');console.log('PASS: sessão local e inicialização do administrador');
 const id=crypto.randomUUID();const body={id,kind:'issue',store:'Loja 1',date:'2026-10-06',version:0,data:{name:'Teste local temporário',responsible:'Teste',priority:'Média',status:'Aberto',impact:'Teste de execução',nextAction:'Conferir persistência',note:''}};
 const save=await fetch(base+'/api/data',{method:'POST',headers,body:JSON.stringify(body)});assert.equal(save.status,200,await save.text());
 const later=await(await fetch(base+'/api/data',{headers})).json();assert(later.records.some(r=>r.id===id));console.log('PASS: gravação no banco e leitura posterior');
 const hist=await(await fetch(base+'/api/data?audit='+id,{headers})).json();assert(hist.audit.length>0);console.log('PASS: histórico de alterações');
 const page=await fetch(base+'/');assert.equal(page.status,200);assert((await page.text()).includes('Gestão Financeira'));console.log('PASS: página original renderizada pelo servidor');
}catch(e){console.error(e);console.error(log.slice(-6000));process.exitCode=1;}finally{child.kill('SIGTERM');}
