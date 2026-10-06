export type CsvTable={headers:string[];rows:string[][]};
export const erpFields=[
 {key:'externalId',label:'Identificador único do ERP',required:false,aliases:['id','codigo','código','id titulo','id do titulo','nosso numero','codigo titulo']},
 {key:'dueDate',label:'Data de vencimento',required:true,aliases:['vencimento','data vencimento','dt vencimento','data de vencimento']},
 {key:'paidDate',label:'Data de pagamento / recebimento',required:false,aliases:['data pagamento','data recebimento','data baixa','liquidacao','liquidação']},
 {key:'name',label:'Fornecedor / cliente / origem',required:false,aliases:['fornecedor','favorecido','cliente','nome','historico','histórico','descricao','descrição']},
 {key:'document',label:'Número do título',required:false,aliases:['numero documento','número documento','numero titulo','número título','documento','titulo','título']},
 {key:'category',label:'Tipo de transação',required:false,aliases:['tipo','tipo transacao','categoria','grupo','modalidade','forma']},
 {key:'status',label:'Situação',required:false,aliases:['situacao','situação','status','status titulo','situação do título']},
 {key:'amount',label:'Valor original',required:true,aliases:['valor','valor original','valor titulo','valor do titulo','valor bruto','total']},
 {key:'settled',label:'Valor pago / recebido',required:false,aliases:['valor pago','valor recebido','valor baixado','valor liquidado','pago','recebido']},
 {key:'remaining',label:'Saldo em aberto',required:false,aliases:['saldo em aberto','saldo aberto','saldo restante','em aberto']}
] as const;
export function parseCsvText(source:string):CsvTable{
 const text=source.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');const first=text.split('\n',1)[0]||'';const candidates=[';',',','\t'];const delimiter=candidates.sort((a,b)=>(first.split(b).length-first.split(a).length))[0];
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===delimiter){row.push(cell);cell='';}else if(c==='\n'){row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length<2)throw new Error('O CSV precisa conter cabeçalho e ao menos uma linha.');
 const headers=rows[0].map((x,i)=>x.trim()||`Coluna ${i+1}`);return {headers,rows:rows.slice(1).map(r=>headers.map((_,i)=>(r[i]||'').trim()))};
}
export function normalizedHeader(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
export function suggestErpMappings(headers:string[]){const normalized=headers.map(normalizedHeader),out:Record<string,string>={};for(const field of erpFields){const aliases=[normalizedHeader(field.label),...field.aliases.map(normalizedHeader)];const i=normalized.findIndex(h=>aliases.includes(h));if(i>=0)out[field.key]=headers[i];}return out;}
export function parseErpDate(value:string){const v=value.trim();if(!v)return '';let m=v.match(/^(\d{1,2})[/\.\-](\d{1,2})[/\.\-](\d{4})$/);if(m){const y=Number(m[3]),month=Number(m[2]),day=Number(m[1]),d=new Date(Date.UTC(y,month-1,day));return d.getUTCFullYear()===y&&d.getUTCMonth()===month-1&&d.getUTCDate()===day?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:'';}m=v.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m){const y=Number(m[1]),month=Number(m[2]),day=Number(m[3]),d=new Date(Date.UTC(y,month-1,day));return d.getUTCFullYear()===y&&d.getUTCMonth()+1===month&&d.getUTCDate()===day?`${m[1]}-${m[2]}-${m[3]}`:'';}const serial=Number(v);if(Number.isFinite(serial)&&serial>20000&&serial<80000){const d=new Date(Date.UTC(1899,11,30)+Math.floor(serial)*86400000);return d.toISOString().slice(0,10);}return '';}
export function parseErpMoney(value:string){let v=value.trim().replace(/\s/g,'').replace(/R\$/gi,'').replace(/[^\d,.-]/g,'');if(!v)return null;if(v.includes(','))v=v.replace(/\./g,'').replace(',','.');else if((v.match(/\./g)||[]).length>1)v=v.replace(/\./g,'');const n=Number(v);return Number.isFinite(n)?Math.round(n*100):null;}
export function normalizeErpStatus(value:string,remaining:number){const s=normalizedHeader(value);if(/cancel|estorn/.test(s))return'Cancelado';if(/parcial/.test(s)&&remaining>0)return'Parcial';if(remaining===0||/quitad|pago|recebid|baixad|liquid/.test(s))return'Quitado';if(/bloque|aguard|autoriz/.test(s))return'Em análise';return remaining>0?'Em aberto':(value.trim()||'Registrado');}
