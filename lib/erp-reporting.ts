export type ErpRow={id:string;kind:'payable'|'receivable';store:string;due_date:string;paid_date:string|null;name:string;document:string;category:string;status:string;amount:number;settled:number;remaining:number;import_id:string;source_filename:string;imported_at:string};
export const sum=(rows:ErpRow[],field:keyof ErpRow)=>rows.reduce((n,r)=>n+Number(r[field]||0),0);
function weekStart(date:string){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+1)%7));return d.toISOString().slice(0,10);}
function groups(rows:ErpRow[],period:'week'|'month'){
 const map=new Map<string,{period:string;kind:string;category:string;expected:number;realized:number;dueCount:number;paidCount:number}>();
 for(const r of rows){
  const add=(date:string|null,type:'expected'|'realized',amount:number)=>{if(!date||!amount)return;const key=period==='week'?weekStart(date):date.slice(0,7);const category=r.category||'Não classificado';const id=key+'|'+r.kind+'|'+category;const g=map.get(id)||{period:key,kind:r.kind,category,expected:0,realized:0,dueCount:0,paidCount:0};g[type]+=amount;if(type==='expected')g.dueCount++;else g.paidCount++;map.set(id,g);};
  add(r.due_date,'expected',r.amount);add(r.paid_date,'realized',r.settled);
 }
 return [...map.values()].sort((a,b)=>a.period.localeCompare(b.period)||a.kind.localeCompare(b.kind)||a.category.localeCompare(b.category));
}
export function buildErpSummary(rows:ErpRow[],from:string,to:string,today:string,horizon=30){
 const result:any={};
 for(const kind of ['payable','receivable'] as const){
  const items=rows.filter(r=>r.kind===kind);
  const due=items.filter(r=>r.due_date>=from&&r.due_date<=to);
  const realized=items.filter(r=>r.paid_date&&r.paid_date>=from&&r.paid_date<=to&&r.settled>0);
  const overdue=items.filter(r=>r.due_date<today&&r.remaining>0);
  const upcoming=items.filter(r=>r.due_date>=today&&r.due_date<=new Date(Date.parse(today+'T12:00:00Z')+horizon*86400000).toISOString().slice(0,10)&&r.remaining>0);
  result[kind]={expected:sum(due,'amount'),expectedCount:due.length,realized:sum(realized,'settled'),realizedCount:realized.length,overdue:sum(overdue,'remaining'),overdueCount:overdue.length,open:sum(items.filter(r=>r.remaining>0),'remaining'),openCount:items.filter(r=>r.remaining>0).length,upcoming:sum(upcoming,'remaining'),upcomingCount:upcoming.length};
 }
 return {from,to,generatedAt:new Date().toISOString(),weekly:groups(rows,'week').filter(x=>x.period>=weekStart(from)&&x.period<=to),monthly:groups(rows,'month').filter(x=>x.period>=from.slice(0,7)&&x.period<=to.slice(0,7)),...result};
}
