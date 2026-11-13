import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useTheme } from '../theme.js';
import { ToastProvider } from './ui.jsx';
import { AccountTab, BackupTab, Collection, MessagesTab, ProfileEditor } from './tabs.jsx';
import * as F from './fields.js';

const TABS = [
  ['profile', 'Profile & hero'], ['sections', 'Sections & text'], ['look', 'Appearance'],
  ['projects', 'Projects'], ['skills', 'Skills'], ['experience', 'Experience'],
  ['messages', 'Messages'], ['backup', 'Backup'], ['account', 'Account'],
];

function Login({ onDone }) {
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await api.post('/auth/login', f);
      localStorage.setItem('token', r.token);
      onDone(r.email);
    } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <h2>Admin sign in</h2>
        <div className="fld"><label htmlFor="l-email">Email</label><input id="l-email" type="email" required autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div className="fld"><label htmlFor="l-pass">Password</label><input id="l-pass" type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        {err && <p className="err" role="alert">{err}</p>}
        <div className="actions"><button className="btn p" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button><Link className="btn" to="/">Back to site</Link></div>
      </form>
    </div>
  );
}

function Panel({ email, setEmail, logout }) {
  const [tab, setTab] = useState(location.hash.slice(1) || 'profile');
  const [unread, setUnread] = useState(0);
  const [theme, toggle] = useTheme();
  const go = (k) => { setTab(k); history.replaceState(null, '', '#' + k); };
  useEffect(() => { api.get('/admin/messages').then((m) => setUnread(m.filter((x) => !x.read).length)).catch(() => {}); }, []);

  const body = {
    profile: <ProfileEditor key="p" title="Profile & hero" fields={F.profileFields} />,
    sections: <ProfileEditor key="s" title="Sections & text" hint="Switch whole sections on or off and rewrite their headings." fields={F.sectionFields} />,
    look: <ProfileEditor key="l" title="Appearance" fields={F.lookFields} />,
    projects: <Collection key="pr" path="projects" title="Projects" noun="project" fields={F.projectFields} blank={F.projectBlank} titleOf={(i) => i.title} subOf={(i) => (i.stack || []).join(' · ')} />,
    skills: <Collection key="sk" path="skills" title="Skills" noun="skill" fields={F.skillFields} blank={F.skillBlank} titleOf={(i) => i.name} subOf={(i) => i.group} />,
    experience: <Collection key="ex" path="experience" title="Experience" noun="role" fields={F.expFields} blank={F.expBlank} titleOf={(i) => i.role} subOf={(i) => [i.org, i.period].filter(Boolean).join(' · ')} />,
    messages: <MessagesTab key="m" onCount={setUnread} />,
    backup: <BackupTab key="b" />,
    account: <AccountTab key="a" email={email} onChange={setEmail} />,
  }[tab];

  return (
    <div className="adm">
      <aside>
        <div className="brand">Admin<span>.</span></div>
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => go(k)}>
            {label}{k === 'messages' && unread > 0 && <em>{unread}</em>}
          </button>
        ))}
      </aside>
      <div className="main">
        <div className="topbar">
          <span className="muted">{email}</span>
          <div className="actions">
            <button className="btn sm" onClick={toggle}>{theme === 'dark' ? '☀ Light' : '☾ Dark'}</button>
            <Link className="btn sm" to="/" target="_blank">View site ↗</Link>
            <button className="btn sm" onClick={logout}>Sign out</button>
          </div>
        </div>
        {body}
      </div>
    </div>
  );
}

export default function Admin() {
  const [email, setEmail] = useState(null);
  const [ready, setReady] = useState(false);
  useTheme();
  useEffect(() => {
    document.title = 'Admin';
    const expired = () => setEmail(null);
    addEventListener('auth-expired', expired);
    if (localStorage.getItem('token')) api.get('/auth/me').then((r) => setEmail(r.email)).catch(() => {}).finally(() => setReady(true));
    else setReady(true);
    return () => removeEventListener('auth-expired', expired);
  }, []);
  const logout = () => { localStorage.removeItem('token'); setEmail(null); };
  if (!ready) return <div className="center"><p>Loading…</p></div>;
  return <ToastProvider>{email ? <Panel email={email} setEmail={setEmail} logout={logout} /> : <Login onDone={setEmail} />}</ToastProvider>;
}
