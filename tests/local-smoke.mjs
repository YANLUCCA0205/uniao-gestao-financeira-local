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
 const importPayload={action:'import',kind:'payable',store:'Loja 1',from:'2099-01-01',to:'2099-01-31',filename:'financeiro-teste.csv',rows:[{externalId:'titulo-parcial',dueDate:'2099-01-10',paidDate:'2099-01-12',name:'Fornecedor teste',document:'T-1',category:'Boletos',status:'Parcial',amount:10000,settled:4000,remaining:6000},{externalId:'titulo-aberto',dueDate:'2099-01-15',paidDate:null,name:'Outro fornecedor',document:'T-2',category:'Serviços',status:'Em aberto',amount:20000,settled:0,remaining:20000}]};
 const imp=await fetch(base+'/api/erp',{method:'POST',headers,body:JSON.stringify(importPayload)});assert.equal(imp.status,200,await imp.text());
 let erp=await(await fetch(base+'/api/erp?from=2099-01-01&to=2099-01-31&store=Loja%201',{headers})).json();assert.equal(erp.summary.payable.expected,30000);assert.equal(erp.summary.payable.realized,4000);assert.equal(erp.summary.payable.open,26000);console.log('PASS: importação ERP e consolidação de previsto, realizado e saldo em aberto');
 const oldBatch=erp.batches.find(x=>x.source_filename==='financeiro-teste.csv');assert(oldBatch?.active);
 const replacement={...importPayload,filename:'financeiro-teste-revisado.csv',rows:[{externalId:'titulo-aberto',dueDate:'2099-01-15',paidDate:null,name:'Outro fornecedor',document:'T-2',category:'Serviços',status:'Em aberto',amount:22000,settled:0,remaining:22000}]};
 const reimp=await fetch(base+'/api/erp',{method:'POST',headers,body:JSON.stringify(replacement)});assert.equal(reimp.status,200,await reimp.text());erp=await(await fetch(base+'/api/erp?from=2099-01-01&to=2099-01-31&store=Loja%201',{headers})).json();assert.equal(erp.summary.payable.expected,22000);assert.equal(erp.batches.find(x=>x.id===oldBatch.id)?.active,0);assert.equal(erp.batches.find(x=>x.source_filename==='financeiro-teste-revisado.csv')?.active,1);console.log('PASS: reimportação arquiva versão sobreposta e preserva o histórico');
 const partialReplacement={...replacement,from:'2099-01-10',to:'2099-01-31',filename:'financeiro-parcial.csv'};const partial=await fetch(base+'/api/erp',{method:'POST',headers,body:JSON.stringify(partialReplacement)});assert.equal(partial.status,409);console.log('PASS: período parcialmente sobreposto é recusado para evitar lacunas no histórico');
 const detail=await(await fetch(base+'/api/erp?details=1&kind=payable&from=2099-01-01&to=2099-01-31&store=Loja%201',{headers})).json();assert.equal(detail.total,1);assert.equal(detail.rows[0].amount,22000);console.log('PASS: consulta opcional de títulos paginada');
 const manual={id:crypto.randomUUID(),kind:'payable',store:'Loja 1',date:'2099-01-15',version:0,data:{name:'Não cadastrar',document:'x',category:'Outros',amount:100,status:'Em aberto',note:''}};const manualRes=await fetch(base+'/api/data',{method:'POST',headers,body:JSON.stringify(manual)});assert.equal(manualRes.status,400);console.log('PASS: cadastro individual de contas a pagar bloqueado');
 const close=await fetch(base+'/api/erp',{method:'POST',headers,body:JSON.stringify({action:'close',id:crypto.randomUUID(),store:'Loja 1',from:'2099-01-01',to:'2099-01-31',title:'Fechamento de teste',note:'Impacto e providência'})});assert.equal(close.status,200,await close.text());erp=await(await fetch(base+'/api/erp?from=2099-01-01&to=2099-01-31&store=Loja%201',{headers})).json();assert(erp.closings.some(x=>x.title==='Fechamento de teste'&&x.payload.payable.expected===22000));console.log('PASS: fechamento gerencial gravado com resumo e referência às importações');
 const page=await fetch(base+'/');assert.equal(page.status,200);assert((await page.text()).includes('Gestão Financeira'));console.log('PASS: página original renderizada pelo servidor');
}catch(e){console.error(e);console.error(log.slice(-6000));process.exitCode=1;}finally{child.kill('SIGTERM');}
