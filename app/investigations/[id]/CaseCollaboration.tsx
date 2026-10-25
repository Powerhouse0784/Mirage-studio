'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Activity, Check, CircleAlert, MessageSquare, Send, UserRound } from 'lucide-react';

type Comment = { id: string; body: string; author: string; createdAt: string; updatedAt: string; mine: boolean };
type ActivityItem = { id: string; actor: string; action: string; detail: string; createdAt: string };

export default function CaseCollaboration({ id }: { id: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/investigations/${encodeURIComponent(id)}/collaboration`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not load case collaboration.');
      setComments(data.comments ?? []);
      setActivity(data.activity ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load case collaboration.');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.trim()) return;
    setPosting(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/investigations/${encodeURIComponent(id)}/collaboration`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not post comment.');
      setComments(current => [data.comment, ...current]);
      setDraft(''); setSuccess('Comment added.');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not post comment.'); }
    finally { setPosting(false); }
  }

  return <section className="case-collab-grid">
    <article className="report-panel case-collab-panel">
      <div className="report-panel-title"><MessageSquare size={17}/><div><h2>Case discussion</h2><p>Keep investigation context and handoff notes together. Comments are private to this workspace.</p></div></div>
      <form className="case-comment-form" onSubmit={submit}>
        <label className="workflow-field"><span>ADD A COMMENT <small>{draft.length}/4000</small></span><textarea value={draft} onChange={e => setDraft(e.target.value.slice(0, 4000))} maxLength={4000} rows={3} placeholder="Share a finding, question, or next step…" /></label>
        <div className="workflow-save-row"><button className="report-action primary" disabled={posting || !draft.trim()}><Send size={14}/>{posting ? 'Posting…' : 'Post comment'}</button>{success && <span className="workflow-success"><Check size={14}/>{success}</span>}{error && <span className="workflow-error"><CircleAlert size={14}/>{error}</span>}</div>
      </form>
      <div className="case-comment-list">{loading ? <div className="report-empty">Loading comments…</div> : comments.length ? comments.map(c => <article className="case-comment" key={c.id}><span className="case-comment-avatar"><UserRound size={15}/></span><div className="case-comment-main"><div className="case-comment-meta"><b>{c.author}{c.mine ? ' · You' : ''}</b><time>{new Date(c.createdAt).toLocaleString()}</time></div><p>{c.body}</p></div></article>) : <div className="report-empty">No comments yet. Add the first case note to start a discussion.</div>}</div>
    </article>
    <article className="report-panel case-collab-panel">
      <div className="report-panel-title"><Activity size={17}/><div><h2>Case activity</h2><p>Recent status, priority, notes, and discussion changes.</p></div></div>
      {loading ? <div className="report-empty">Loading activity…</div> : activity.length ? <div className="case-activity-list">{activity.map(a => <article className="case-activity-item" key={a.id}><span className="case-activity-dot"/><div><p><b>{a.actor}</b> {a.detail}</p><time>{new Date(a.createdAt).toLocaleString()}</time></div></article>)}</div> : <div className="report-empty">No case changes have been recorded yet. Updates will appear here.</div>}
    </article>
  </section>;
}
