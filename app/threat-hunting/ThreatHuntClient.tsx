'use client';

import { useMemo, useState } from 'react';
import { Copy, Download, Search, ShieldAlert, TerminalSquare } from 'lucide-react';

type EventSample = { time: string; host: string; user: string; process: string; command: string; category: string; severity: string; };
const samples: EventSample[] = [
 {time:'09:14:02',host:'WS-FIN-04',user:'j.smith',process:'powershell.exe',command:'powershell.exe -enc [SIMULATED]',category:'Encoded PowerShell',severity:'HIGH'},
 {time:'09:16:41',host:'APP-02',user:'svc-app',process:'w3wp.exe',command:'w3wp.exe spawned cmd.exe [SIMULATED]',category:'Suspicious child process',severity:'HIGH'},
 {time:'09:21:09',host:'WS-HR-02',user:'m.lee',process:'winword.exe',command:'winword.exe opened document [SIMULATED]',category:'Office process activity',severity:'LOW'},
 {time:'09:22:33',host:'WS-FIN-04',user:'j.smith',process:'rundll32.exe',command:'rundll32.exe loaded unusual module [SIMULATED]',category:'Signed binary proxy',severity:'MEDIUM'},
 {time:'09:27:15',host:'DC-LAB-01',user:'administrator',process:'net.exe',command:'net.exe user [SIMULATED]',category:'Account discovery',severity:'MEDIUM'},
 {time:'09:31:50',host:'WS-ENG-07',user:'a.patel',process:'7z.exe',command:'7z.exe created archive [SIMULATED]',category:'Archive staging',severity:'LOW'},
 {time:'09:36:04',host:'APP-02',user:'svc-app',process:'cmd.exe',command:'cmd.exe /c whoami [SIMULATED]',category:'Suspicious child process',severity:'HIGH'},
 {time:'09:42:19',host:'WS-OPS-03',user:'r.khan',process:'powershell.exe',command:'powershell.exe Get-Process [SIMULATED]',category:'PowerShell activity',severity:'LOW'},
];
const presets = {
 'Encoded PowerShell': { field:'process', value:'powershell.exe', category:'Encoded PowerShell', description:'Look for PowerShell activity in the simulated endpoint stream.' },
 'Suspicious child process': { field:'category', value:'Suspicious child process', category:'Suspicious child process', description:'Look for a web/application process spawning a command shell.' },
 'Account discovery': { field:'category', value:'Account discovery', category:'Account discovery', description:'Look for commands associated with local account discovery.' },
 'Archive staging': { field:'category', value:'Archive staging', category:'Archive staging', description:'Look for archive creation that may warrant contextual review.' },
};
type Preset = keyof typeof presets;
export default function ThreatHuntClient() {
 const [preset,setPreset]=useState<Preset>('Encoded PowerShell');
 const [minimum,setMinimum]=useState('ALL');
 const [query,setQuery]=useState('');
 const [copied,setCopied]=useState(false);
 const selected=presets[preset];
 const results=useMemo(()=>samples.filter(e=>(minimum==='ALL'||['LOW','MEDIUM','HIGH'].indexOf(e.severity)>=['LOW','MEDIUM','HIGH'].indexOf(minimum)) && [e.host,e.user,e.process,e.command,e.category].some(v=>v.toLowerCase().includes(query.toLowerCase().trim())) && (preset==='Encoded PowerShell'?e.process==='powershell.exe':e.category===selected.category)),[preset,minimum,query,selected.category]);
 const rule=`title: MIRAGE - ${preset}\nstatus: experimental\ndescription: ${selected.description}\nlogsource:\n  product: windows\n  category: process_creation\ndetection:\n  selection:\n    ${selected.field}: '${selected.value}'\n  condition: selection\nlevel: ${minimum==='ALL'?'medium':minimum.toLowerCase()}\ntags:\n  - attack.discovery\n`;
 async function copyRule(){try{await navigator.clipboard.writeText(rule);setCopied(true);window.setTimeout(()=>setCopied(false),1600)}catch{setCopied(false)}}
 function downloadRule(){const blob=new Blob([rule],{type:'text/yaml;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='mirage-training-hunt-rule.yml';a.click();URL.revokeObjectURL(url)}
 return <section className="hunt-workspace">
  <div className="ioc-stats"><div className="ioc-stat"><span>SAMPLE TELEMETRY</span><b>{samples.length}</b><small>synthetic events</small></div><div className="ioc-stat"><span>RULE TEMPLATE</span><b>1</b><small>draft generated locally</small></div><div className="ioc-stat"><span>MATCHES</span><b>{results.length}</b><small>current sample filter</small></div></div>
  <div className="report-panel hunt-panel">
   <div className="report-panel-title"><div><h2>Detection hypothesis</h2><p>Choose a hunt idea to inspect matching synthetic event records.</p></div><span className="ioc-type">SIMULATED</span></div>
   <div className="hunt-controls"><label>Hunt template<select value={preset} onChange={e=>setPreset(e.target.value as Preset)}>{Object.keys(presets).map(v=><option key={v}>{v}</option>)}</select></label><label>Minimum severity<select value={minimum} onChange={e=>setMinimum(e.target.value)}><option value="ALL">All severities</option><option value="MEDIUM">Medium and above</option><option value="HIGH">High only</option></select></label><label className="hunt-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter matching events…"/></label></div>
   <div className="hunt-hypothesis"><b>Hypothesis</b><p>{selected.description}</p><small>Match condition: <code>{selected.field} contains “{selected.value}”</code></small></div>
   <div className="ioc-result-line"><span>{results.length} matching sample event{results.length===1?'':'s'}</span><span>Dataset: MIRAGE training telemetry</span></div>
   <div className="hunt-events">{results.map((e,i)=><article className="hunt-event" key={`${e.time}-${i}`}><div className="hunt-event-time">{e.time}<small>{e.host}</small></div><div className="hunt-event-main"><b>{e.category}</b><p>{e.command}</p><small>User: {e.user} · Process: {e.process}</small></div><span className={e.severity==='HIGH'?'ioc-confidence ioc-confidence-high':e.severity==='MEDIUM'?'ioc-confidence ioc-confidence-medium':'ioc-confidence ioc-confidence-low'}>{e.severity}</span></article>)}{results.length===0&&<div className="report-empty"><ShieldAlert size={22}/><b>No matching sample events</b><span>Adjust the selected template, severity, or text filter.</span></div>}</div>
  </div>
  <div className="report-panel hunt-rule-panel"><div className="report-panel-title"><div><h2><TerminalSquare size={17}/> Sigma-style rule draft</h2><p>Review or export the generated YAML-style detection hypothesis.</p></div><div className="hunt-rule-actions"><button onClick={copyRule}><Copy size={14}/>{copied?'Copied':'Copy rule'}</button><button onClick={downloadRule}><Download size={14}/>Download .yml</button></div></div><pre className="hunt-rule-code"><code>{rule}</code></pre></div>
 </section>;
}
