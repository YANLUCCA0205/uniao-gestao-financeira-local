import {z} from 'zod';
export const stores=['Loja 1','Loja 2','Loja 3','Rede'];
export const categories=['Boletos','Vendas a prazo','Cartões','Convênios','PIX','Dinheiro','Cheques','Juros','Multas','Aplicações','Outros'];
export const stages=['Contagem das sangrias','Primeiro passo','Quarto passo — Planilhas e Statix'];
export const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'Data inválida');
const money=z.number().int().min(0).max(999999999999);const str=z.string().trim().min(1).max(500);const memo=z.string().max(5000).default('');
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const schemas:Record<string,z.ZodTypeAny>={
 payable:z.object({name:str,document:str,category:z.enum(categories as [string,...string[]]),amount:money.refine(x=>x>0),status:z.enum(['Em aberto','Aguardando autorização','Bloqueado','Cancelado']),note:memo}),
 receivable:z.object({name:str,document:str,category:z.enum(categories as [string,...string[]]),amount:money.refine(x=>x>0),status:z.enum(['Em aberto','Em cobrança','Em acordo','Cancelado']),note:memo}),
 routine:z.object({responsible:str,movementDate:date,stage:z.enum(stages as [string,...string[]]),status:z.enum(['Concluído','Em andamento','Folga','Feriado','Ausência']),start:z.union([time,z.literal('')]),end:z.union([time,z.literal('')]),pauses:z.array(z.object({start:time,end:time,reason:str,type:z.enum(['Almoço','Interrupção'])})).max(30),volume:z.number().int().min(0),note:memo}).superRefine((v,c)=>{if(v.status==='Concluído'){if(!v.start||!v.end||minutes(v.end)<=minutes(v.start))c.addIssue({code:'custom',message:'Informe início e fim válidos no mesmo dia.'});const sorted=[...v.pauses].sort((a,b)=>a.start.localeCompare(b.start));for(let i=0;i<sorted.length;i++){const p=sorted[i];if(p.start<v.start||p.end>v.end||p.end<=p.start||(i>0&&p.start<sorted[i-1].end))c.addIssue({code:'custom',message:'As pausas devem estar dentro da etapa e não podem se sobrepor.'});}if(duration(v)<=0)c.addIssue({code:'custom',message:'A duração efetiva deve ser positiva.'});}}),
 cash:z.object({responsible:str,expected:money,counted:money,explained:z.number().int(),regularization:z.enum(['Pendente','Regularizado']),note:memo}).superRefine((v,c)=>{const d=v.counted-v.expected;if((d===0&&v.explained!==0)||Math.abs(v.explained)>Math.abs(d)||(v.explained!==0&&Math.sign(v.explained)!==Math.sign(d)))c.addIssue({code:'custom',message:'O valor explicado deve ter o mesmo sinal e não superar a diferença.'});if(d!==0&&!v.note)c.addIssue({code:'custom',message:'Justifique a diferença do cofre.'});}),
 difference:z.object({operator:str,cashier:str,type:z.enum(['Sobra','Falta']),amount:money.refine(x=>x>0),cause:memo,action:str,status:z.enum(['Pendente','Em tratamento','Resolvido']),note:memo}),
 issue:z.object({name:str,responsible:str,priority:z.enum(['Baixa','Média','Alta']),status:z.enum(['Aberto','Em andamento','Aguardando terceiros','Resolvido']),impact:memo,nextAction:str,note:memo}),
 account:z.object({name:str,agency:memo,number:str,balance:z.number().int(),balanceDate:date,conciledUntil:date,frequency:z.enum(['Diária','Semanal','Mensal']),status:z.enum(['Conciliada','Pendente','Não iniciada']),note:memo}),
 movement:z.object({name:str,account:str,destination:memo,type:z.enum(['Entrada','Saída','Transferência interna']),amount:money.refine(x=>x>0),note:memo}),
 report:z.object({name:str,from:date,to:date,status:z.enum(['Enviado','Correção solicitada','Revisado']),note:memo,snapshot:z.any()}).refine(v=>v.to>=v.from,'Período inválido')
};
export type Row={id:string;kind:string;store:string;date:string;data:any;version:number;createdBy:string;updatedAt:string;remaining?:number};
export function minutes(t:string){if(!t)return 0;const [h,m]=t.split(':').map(Number);return h*60+m;}
export function duration(d:any){return minutes(d.end)-minutes(d.start)-(d.pauses||[]).reduce((s:number,p:any)=>s+minutes(p.end)-minutes(p.start),0);}
export function interruption(d:any){return(d.pauses||[]).filter((p:any)=>p.type==='Interrupção').reduce((s:number,p:any)=>s+minutes(p.end)-minutes(p.start),0);}
export function moneyBR(v:number){return(v/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
export function hours(v:number){const seconds=Math.max(0,Math.round(v*60));return `${Math.floor(seconds/3600)}h${Math.floor(seconds%3600/60).toString().padStart(2,'0')}${seconds%60?`min${String(seconds%60).padStart(2,'0')}s`:''}`;}
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia'}).format(new Date());}
export function labelStatus(r:Row){if(['payable','receivable'].includes(r.kind)){if(r.data.status==='Cancelado')return'Cancelado';if(r.remaining===0)return'Quitado';if(r.date<today())return'Vencido';if((r.remaining??r.data.amount)<r.data.amount)return'Parcial';}return r.data.status||r.data.regularization||'Registrado';}
