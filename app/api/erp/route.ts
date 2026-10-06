import {db,member,allow,fail} from '@/lib/server';
import {date,stores} from '@/lib/model';
import {buildErpSummary,ErpRow} from '@/lib/erp-reporting';
import {z} from 'zod';
export const dynamic='force-dynamic';
const kinds=['payable','receivable'] as const;
function scopeStores(m:any,selected:string){
 if(selected!=='Todas as lojas'&&selected!=='Rede'){
  if(!stores.includes(selected as any))throw Error('400: Loja inválida.');
  if(m.role!=='Administrador'&&!m.stores.includes(selected))throw Error('403: Loja não autorizada.');
  return [selected];
 }
 if(m.role==='Administrador'||m.stores.includes('Rede'))return stores.filter(s=>s!=='Rede');
 return m.stores.filter((s:string)=>s!=='Rede');
}
async function loadRows(store:string,from:string,to:string,kindsToLoad:string[]=['payable','receivable']){
 const marks=kindsToLoad.map(()=>'?').join(',');
 const q=await db().prepare(`SELECT r.*,i.kind,i.store,i.source_filename,i.imported_at FROM erp_rows r JOIN erp_imports i ON i.id=r.import_id WHERE i.active=1 AND i.state='Concluída' AND i.kind IN (${marks}) AND i.period_start<=? AND i.period_end>=? AND (r.due_date BETWEEN ? AND ? OR (r.paid_date BETWEEN ? AND ?) OR r.remaining>0)${store==='Todas as lojas'||store==='Rede'?'':' AND i.store=?'} ORDER BY r.due_date DESC`)
  .bind(...kindsToLoad,to,from,from,to,from,to,...(store==='Todas as lojas'||store==='Rede'?[]:[store])).all();
 return q.results as unknown as ErpRow[];
}
function authorizedRows(m:any,rows:ErpRow[]){return rows.filter(r=>m.role==='Administrador'||m.stores.includes(r.store)||m.stores.includes('Rede'));}
export async function GET(req:Request){try{
 const m=await member();if(m.role==='Tesouraria')throw Error('403: Os dados importados do ERP são restritos ao financeiro e à supervisão.');const url=new URL(req.url),from=date.parse(url.searchParams.get('from')||new Date().toISOString().slice(0,8)+'01'),to=date.parse(url.searchParams.get('to')||new Date().toISOString().slice(0,10)),store=url.searchParams.get('store')||'Todas as lojas';
 if(from>to)throw Error('400: O início do período deve anteceder o fim.');
 const allowed=scopeStores(m,store),scope=store==='Todas as lojas'||store==='Rede'?'Todas as lojas':store;
 let rows=await loadRows(scope,from,to);rows=authorizedRows(m,rows).filter(r=>allowed.includes(r.store));
 const active=await db().prepare("SELECT id,kind,store,period_start,period_end,source_filename,state,row_count,amount_total,settled_total,imported_by,imported_at,active FROM erp_imports WHERE state IN ('Concluída','Falhou') ORDER BY imported_at DESC LIMIT 100").all();
 const batches=active.results.filter((b:any)=>m.role==='Administrador'||m.stores.includes(b.store)||m.stores.includes('Rede')).filter((b:any)=>allowed.includes(b.store)||b.store==='Rede');const inRangeBatches=batches.filter((b:any)=>b.active&&b.period_start<=to&&b.period_end>=from);
 const closings=await db().prepare('SELECT id,store,period_start,period_end,title,note,payload,source_imports,created_by,created_at FROM erp_closings ORDER BY created_at DESC LIMIT 60').all();
 const visibleClosings=closings.results.filter((c:any)=>m.role==='Administrador'||m.stores.includes(c.store)||m.stores.includes('Rede')).filter((c:any)=>store==='Todas as lojas'||store==='Rede'||c.store===store).map((c:any)=>({...c,payload:JSON.parse(c.payload),source_imports:JSON.parse(c.source_imports)}));
 if(url.searchParams.get('details')==='1'){
  const kind=z.enum(kinds).parse(url.searchParams.get('kind')||'payable'),page=Math.max(1,Number(url.searchParams.get('page')||1)),size=Math.min(100,Math.max(10,Number(url.searchParams.get('size')||50)));
  const items=rows.filter(r=>r.kind===kind&&(r.due_date>=from&&r.due_date<=to||(r.paid_date||'')>=from&&(r.paid_date||'')<=to));
  return Response.json({rows:items.slice((page-1)*size,page*size),total:items.length,page,size});
 }
 const today=new Date().toISOString().slice(0,10),horizon=Math.min(90,Math.max(1,Number(url.searchParams.get('horizon')||30))),summary=buildErpSummary(rows,from,to,today,horizon),horizonEnd=new Date(Date.parse(today+'T12:00:00Z')+horizon*86400000).toISOString().slice(0,10);summary.importedRows=rows.length;
 const nextRows=authorizedRows(m,await loadRows(scope,today,horizonEnd)).filter(r=>allowed.includes(r.store));for(const k of kinds){const upcoming=nextRows.filter(r=>r.kind===k&&r.due_date>=today&&r.due_date<=horizonEnd&&r.remaining>0);summary[k].upcoming=upcoming.reduce((n,r)=>n+r.remaining,0);summary[k].upcomingCount=upcoming.length;}
 const dayMs=86400000,span=Math.floor((Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/dayMs)+1,previousTo=new Date(Date.parse(from+'T00:00:00Z')-dayMs).toISOString().slice(0,10),previousFrom=new Date(Date.parse(previousTo+'T00:00:00Z')-(span-1)*dayMs).toISOString().slice(0,10);
 const previousRows=authorizedRows(m,await loadRows(scope,previousFrom,previousTo)).filter(r=>allowed.includes(r.store));const comparison=previousRows.length?buildErpSummary(previousRows,previousFrom,previousTo,today,horizon):null;
 return Response.json({summary,comparison,previousFrom,previousTo,batches,inRangeBatches,closings:visibleClosings,stores:allowed});
}catch(e){return fail(e);}}
export async function POST(req:Request){let importId='';try{
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)throw Error('403: Origem não autorizada.');const m=await member();if(Number(req.headers.get('content-length')||0)>12000000)throw Error('400: Arquivo muito grande. Limite de 12 MB por importação.');const b:any=await req.json(),now=new Date().toISOString();
 if(b.action==='import'){
  const p=z.object({action:z.literal('import'),kind:z.enum(kinds),store:z.enum(stores as [string,...string[]]).refine(s=>s!=='Rede','Escolha uma loja específica.'),from:date,to:date,filename:z.string().min(1).max(240),rows:z.array(z.object({externalId:z.string().min(1).max(500),dueDate:date,paidDate:date.nullable().optional(),name:z.string().max(500),document:z.string().max(500),category:z.string().max(300),status:z.string().max(150),amount:z.number().int().positive(),settled:z.number().int().min(0),remaining:z.number().int().min(0),raw:z.record(z.string(),z.string()).optional()})).min(1).max(10000)}).parse(b);
  if(p.from>p.to)throw Error('400: Período inválido.');allow(m,p.kind,p.store,true);
  const seen=new Set<string>();for(const r of p.rows){if(seen.has(r.externalId))throw Error('400: Há identificadores repetidos na importação. Confira a coluna de documento/identificador.');seen.add(r.externalId);if(r.settled>r.amount||r.remaining>r.amount)throw Error('400: Há valores pagos ou em aberto maiores que o valor do título.');}
  importId=crypto.randomUUID();const amountTotal=p.rows.reduce((s,r)=>s+r.amount,0),settledTotal=p.rows.reduce((s,r)=>s+r.settled,0);
  const overlap=await db().prepare("SELECT id,period_start,period_end FROM erp_imports WHERE kind=? AND store=? AND active=1 AND state='Concluída' AND period_start<=? AND period_end>=? AND (period_start<>? OR period_end<>?) LIMIT 1").bind(p.kind,p.store,p.to,p.from,p.from,p.to).first();
  if(overlap)throw Error(`409: Já existe uma importação ativa parcialmente sobreposta (${overlap.period_start} a ${overlap.period_end}). Reimporte o mesmo período completo para substituir os dados sem perder os demais dias.`);
  await db().prepare("INSERT INTO erp_imports(id,kind,store,period_start,period_end,source_filename,state,active,row_count,amount_total,settled_total,imported_by,imported_at) VALUES(?,?,?,?,?,?,'Importando',0,?,?,?,?,?)").bind(importId,p.kind,p.store,p.from,p.to,p.filename,p.rows.length,amountTotal,settledTotal,m.email,now).run();
  try{
   for(let i=0;i<p.rows.length;i+=40){const batch=p.rows.slice(i,i+40).map(r=>db().prepare('INSERT INTO erp_rows(id,import_id,external_id,due_date,paid_date,name,document,category,status,amount,settled,remaining,payload) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),importId,r.externalId,r.dueDate,r.paidDate||null,r.name,r.document,r.category,r.status,r.amount,r.settled,r.remaining,JSON.stringify(r.raw||{})));await db().batch(batch);}
   await db().batch([db().prepare('UPDATE erp_imports SET active=0 WHERE kind=? AND store=? AND active=1 AND period_start=? AND period_end=?').bind(p.kind,p.store,p.from,p.to),db().prepare("UPDATE erp_imports SET state='Concluída',active=1 WHERE id=?").bind(importId)]);
  }catch(err){await db().prepare("UPDATE erp_imports SET state='Falhou',active=0 WHERE id=?").bind(importId).run();throw err;}
  return Response.json({ok:true,id:importId,count:p.rows.length});
 }
 if(b.action==='close'){
  if(m.role==='Tesouraria')throw Error('403: Fechamentos do ERP são restritos ao financeiro e à supervisão.');
  const p=z.object({action:z.literal('close'),id:z.string().uuid(),store:z.enum(stores as [string,...string[]]),from:date,to:date,title:z.string().min(1).max(240),note:z.string().max(10000)}).parse(b);
  if(p.from>p.to)throw Error('400: Período inválido.');if(p.store==='Rede'){if(m.role!=='Administrador'&&!m.stores.includes('Rede')&&!stores.filter(s=>s!=='Rede').every(s=>m.stores.includes(s)))throw Error('403: Não há autorização para fechar a rede inteira.');if(m.role==='Supervisor')throw Error('403: Perfil de consulta e revisão.');}else allow(m,'report',p.store,true);
  const rows=authorizedRows(m,await loadRows(p.store,p.from,p.to));if(!rows.length)throw Error('400: Não há títulos importados para fechar este período.');const summary=buildErpSummary(rows,p.from,p.to,new Date().toISOString().slice(0,10),30);const ids=[...new Set(rows.map(r=>r.import_id))];
  await db().prepare('INSERT INTO erp_closings(id,store,period_start,period_end,title,note,payload,source_imports,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(p.id,p.store,p.from,p.to,p.title,p.note,JSON.stringify(summary),JSON.stringify(ids),m.email,now).run();
  return Response.json({ok:true,id:p.id,summary});
 }
 throw Error('400: Ação inválida.');
}catch(e){return fail(e);}}
