'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, RotateCcw, ShieldAlert } from 'lucide-react';

type Step = { id: string; phase: string; title: string; detail: string };
const baseSteps: Step[] = [
  { id: 'validate', phase: 'Triage', title: 'Validate the alert and scope', detail: 'Review the triggering event, timestamp, affected asset, confidence, and related alerts. Record what is confirmed versus suspected.' },
  { id: 'preserve', phase: 'Triage', title: 'Preserve relevant evidence', detail: 'Capture relevant logs, event IDs, timestamps, and analyst observations in the Evidence Locker before changing the simulated environment.' },
  { id: 'impact', phase: 'Investigation', title: 'Assess impact and exposure', detail: 'Identify the affected account, host, application, and likely blast radius. Note any unknowns that require follow-up.' },
  { id: 'contain', phase: 'Containment', title: 'Choose a containment action', detail: 'Document a proportionate containment recommendation. This training playbook does not isolate hosts, disable accounts, or change real systems.' },
  { id: 'eradicate', phase: 'Eradication', title: 'Plan removal of the cause', detail: 'Record the suspected entry point and the steps needed to remove malicious persistence or close the exploited weakness in a controlled environment.' },
  { id: 'recover', phase: 'Recovery', title: 'Define recovery and validation checks', detail: 'List checks to confirm services are healthy, credentials are safe, and the simulated threat is no longer present.' },
  { id: 'lessons', phase: 'Closure', title: 'Document lessons learned', detail: 'Summarize root-cause hypotheses, detection gaps, owners for follow-up, and one improvement to prevent recurrence.' },
];
const scenarioHints: Record<string, string> = {
  'Web exploit': 'Prioritize the vulnerable route, application logs, suspicious requests, and potential web-shell or persistence indicators.',
  'Phished insider': 'Prioritize the message and URL, identity sign-in events, mailbox activity, and any user-reported interaction.',
  'Stolen credentials': 'Prioritize unusual sign-ins, session/token activity, MFA events, privilege changes, and access from unfamiliar locations.',
  'Ransomware probe': 'Prioritize file-change patterns, endpoint alerts, suspicious process activity, backup health, and potential lateral movement.',
};

export default function ResponsePlaybook({ id, scenario }: { id: string; scenario: string }) {
  const storageKey = `mirage-playbook-v1-${id}`;
  const [checked, setChecked] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loaded, setLoaded] = useState(false);
  const steps = useMemo(() => baseSteps, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { checked?: string[]; notes?: string };
        setChecked(Array.isArray(parsed.checked) ? parsed.checked.filter(value => steps.some(step => step.id === value)) : []);
        setNotes(typeof parsed.notes === 'string' ? parsed.notes : '');
      }
    } catch { /* Local progress is optional; the checklist remains usable if storage is blocked. */ }
    setLoaded(true);
  }, [storageKey, steps]);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify({ checked, notes, updatedAt: new Date().toISOString() })); } catch { /* Ignore unavailable browser storage. */ }
  }, [checked, notes, loaded, storageKey]);

  const progress = Math.round(checked.length / steps.length * 100);
  const phases = ['Triage', 'Investigation', 'Containment', 'Eradication', 'Recovery', 'Closure'];
  return <section className="report-panel response-playbook-panel">
    <div className="report-panel-title"><ClipboardCheck size={18}/><div><h2>Incident response playbook</h2><p>Guided, scenario-aware checklist · progress saved in this browser</p></div><span className="evidence-count">{checked.length}/{steps.length} complete</span></div>
    <div className="playbook-context"><span><ShieldAlert size={15}/>{scenario}</span><p>{scenarioHints[scenario] || 'Start by validating the alert, preserving evidence, assessing impact, and documenting each response decision.'}</p></div>
    <div className="playbook-progress"><div className="playbook-progress-track"><span style={{ width: `${progress}%` }}/></div><div><b>{progress}%</b><span>{progress === 100 ? 'Checklist complete — review notes before closing the case.' : 'Complete each step as you work through the incident.'}</span></div></div>
    {phases.map(phase => {
      const phaseSteps = steps.filter(step => step.phase === phase);
      return <div className="playbook-phase" key={phase}><h3>{phase}</h3>{phaseSteps.map(step => <label className={`playbook-step ${checked.includes(step.id) ? 'is-checked' : ''}`} key={step.id}><input type="checkbox" checked={checked.includes(step.id)} onChange={event => setChecked(current => event.target.checked ? [...current, step.id] : current.filter(value => value !== step.id))}/><span className="playbook-step-copy"><b>{step.title}</b><small>{step.detail}</small></span>{checked.includes(step.id) && <CheckCircle2 size={17}/>}</label>)}</div>;
    })}
    <label className="workflow-field playbook-notes"><span>Response notes / handoff summary</span><textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={6000} rows={4} placeholder="Record decisions, outstanding questions, and recommended next steps…"/><small>{notes.length}/6000 characters · stored locally in this browser</small></label>
    <div className="playbook-footer"><span>{loaded ? 'Progress autosaves on this device.' : 'Loading saved progress…'} It is not synced to your account or team.</span><button type="button" className="report-action" onClick={() => { if (window.confirm('Reset all playbook checkboxes and notes for this case on this browser?')) { setChecked([]); setNotes(''); } }}><RotateCcw size={13}/> Reset checklist</button></div>
    <div className="report-compare-note evidence-caveat"><ShieldAlert size={15}/><p><b>Simulation safety.</b> This playbook is guidance only. It does not execute containment, disable accounts, alter endpoints, or connect to production security systems.</p></div>
  </section>;
}
