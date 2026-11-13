import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Form, useToast } from './ui.jsx';

/* Edits the single Profile document (hero, links, section text, appearance) */
export function ProfileEditor({ fields, title, hint }) {
  const [p, setP] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => { api.get('/admin/content').then((d) => setP(d.profile)).catch((e) => toast(e.message, true)); }, []);
  if (!p) return <p className="muted">Loading…</p>;
  const save = async () => {
    setBusy(true);
    try { setP(await api.put('/admin/profile', p)); toast('Saved. Your live site is updated.'); }
    catch (e) { toast(e.message, true); }
    setBusy(false);
  };
  return (
    <div className="card">
      <h2>{title}</h2>
      {hint && <p className="muted">{hint}</p>}
      <Form fields={fields} value={p} onChange={setP} />
      <div className="actions"><button className="btn p" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </div>
  );
}

/* Add / edit / hide / reorder / delete for projects, skills and experience */
export function Collection({ path, title, noun, fields, blank, titleOf, subOf }) {
  const [items, setItems] = useState(null);
  const [edit, setEdit] = useState(null);
  const toast = useToast();
  const load = () => api.get(`/admin/${path}`).then(setItems).catch((e) => toast(e.message, true));
  useEffect(() => { load(); }, [path]);
  const run = async (fn) => { try { await fn(); await load(); } catch (e) { toast(e.message, true); } };

  const save = () => run(async () => {
    if (edit._id) await api.put(`/admin/${path}/${edit._id}`, edit);
    else await api.post(`/admin/${path}`, edit);
    setEdit(null);
    toast('Saved');
  });
  const del = (it) => confirm(`Delete “${titleOf(it)}”?`) && run(() => api.del(`/admin/${path}/${it._id}`));
  const toggle = (it) => run(() => api.put(`/admin/${path}/${it._id}`, { visible: it.visible === false }));
  const move = (i, d) => {
    const a = [...items], j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    setItems(a);
    run(() => api.post(`/admin/${path}/reorder`, { ids: a.map((x) => x._id) }));
  };

  if (edit) {
    return (
      <div className="card">
        <h2>{edit._id ? 'Edit' : 'New'} {noun}</h2>
        <Form fields={fields} value={edit} onChange={setEdit} />
        <div className="actions">
          <button className="btn p" onClick={save}>Save</button>
          <button className="btn" onClick={() => setEdit(null)}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <div className="card">
      <div className="row between"><h2>{title}</h2><button className="btn p" onClick={() => setEdit({ ...blank })}>+ Add {noun}</button></div>
      {!items ? <p className="muted">Loading…</p> : !items.length ? <p className="muted">Nothing here yet.</p> : (
        <ul className="list">
          {items.map((it, i) => (
            <li key={it._id} className={it.visible === false ? 'off' : ''}>
              <div className="grow"><b>{titleOf(it)}</b><small>{subOf?.(it)}{it.visible === false ? ' · hidden' : ''}</small></div>
              <button className="icon" title="Move up" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button className="icon" title="Move down" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
              <button className="btn sm" onClick={() => toggle(it)}>{it.visible === false ? 'Show' : 'Hide'}</button>
              <button className="btn sm" onClick={() => setEdit(it)}>Edit</button>
              <button className="btn sm danger" onClick={() => del(it)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MessagesTab({ onCount }) {
  const [m, setM] = useState(null);
  const toast = useToast();
  const load = () => api.get('/admin/messages').then((x) => { setM(x); onCount?.(x.filter((i) => !i.read).length); }).catch((e) => toast(e.message, true));
  useEffect(() => { load(); }, []);
  const mark = (i, read) => api.patch(`/admin/messages/${i._id}`, { read }).then(load);
  const del = (i) => confirm('Delete this message?') && api.del(`/admin/messages/${i._id}`).then(load);
  return (
    <div className="card">
      <h2>Messages</h2>
      {!m ? <p className="muted">Loading…</p> : !m.length ? <p className="muted">No messages yet. Notes sent from your contact form land here.</p> : m.map((i) => (
        <details key={i._id} className={'msg' + (i.read ? '' : ' unread')} onToggle={(e) => { if (e.target.open && !i.read) mark(i, true); }}>
          <summary><b>{i.name}</b><span>{i.email}</span><time>{new Date(i.createdAt).toLocaleString()}</time></summary>
          <p>{i.body}</p>
          <div className="actions">
            <a className="btn sm p" href={`mailto:${i.email}?subject=Re: your message`}>Reply</a>
            <button className="btn sm" onClick={() => mark(i, !i.read)}>{i.read ? 'Mark unread' : 'Mark read'}</button>
            <button className="btn sm danger" onClick={() => del(i)}>Delete</button>
          </div>
        </details>
      ))}
    </div>
  );
}

export function BackupTab() {
  const toast = useToast();
  const exportAll = async () => {
    try {
      const d = await api.get('/admin/export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
      Object.assign(document.createElement('a'), { href: url, download: `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json` }).click();
      URL.revokeObjectURL(url);
    } catch (e) { toast(e.message, true); }
  };
  const importAll = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !confirm('This REPLACES all current content and messages with the backup. Continue?')) return;
    try { await api.post('/admin/import', JSON.parse(await file.text())); toast('Backup restored. Reload the page to see it.'); }
    catch (x) { toast(x.message, true); }
  };
  return (
    <div className="card">
      <h2>Backup &amp; restore</h2>
      <p className="muted">Download everything (profile, projects, skills, experience, messages) as one JSON file, or restore from one. Export before you import.</p>
      <div className="actions">
        <button className="btn p" onClick={exportAll}>Download backup</button>
        <label className="btn">Restore from file<input type="file" accept="application/json" hidden onChange={importAll} /></label>
      </div>
    </div>
  );
}

export function AccountTab({ email, onChange }) {
  const [f, setF] = useState({ email, current: '', password: '' });
  const toast = useToast();
  const save = async (e) => {
    e.preventDefault();
    try {
      const r = await api.put('/auth/account', { current: f.current, email: f.email, password: f.password || undefined });
      localStorage.setItem('token', r.token);
      onChange(r.email);
      setF({ ...f, current: '', password: '' });
      toast('Account updated');
    } catch (x) { toast(x.message, true); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="card" onSubmit={save}>
      <h2>Account</h2>
      <div className="grid">
        <div className="fld wide"><label htmlFor="a-email">Admin email</label><input id="a-email" type="email" required value={f.email} onChange={set('email')} /></div>
        <div className="fld"><label htmlFor="a-new">New password</label><input id="a-new" type="password" minLength={10} autoComplete="new-password" value={f.password} onChange={set('password')} /><small>At least 10 characters. Leave empty to keep the current one.</small></div>
        <div className="fld"><label htmlFor="a-cur">Current password (required)</label><input id="a-cur" type="password" required autoComplete="current-password" value={f.current} onChange={set('current')} /></div>
      </div>
      <div className="actions"><button className="btn p">Update account</button></div>
    </form>
  );
}
