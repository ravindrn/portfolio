import { Fragment, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { applyAccent, useTheme } from './theme.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const PALETTE = ['#7C8CFF', '#22D3EE', '#A78BFA', '#34D399', '#FBBF24', '#F472B6'];
const STAGES = [
  { n: 'Commit', t: 'git push', log: 'Pushed feat/checkout-v2 → origin' },
  { n: 'Build', t: 'docker build', log: 'Image built, 142 MB, layers cached' },
  { n: 'Test', t: 'jest + e2e', log: '412 tests passed, coverage 94%' },
  { n: 'Scan', t: 'trivy', log: 'No critical vulnerabilities found' },
  { n: 'Deploy', t: 'helm upgrade', log: 'Rolled out to production, 0 downtime' },
];

/* ---------- animated background: a living infrastructure graph ---------- */
function Cosmos({ world }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, D = 1, raf = 0, t = 0, zoom = 1;
    const N = innerWidth < 700 ? 56 : 112;
    const pts = Array.from({ length: N }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 2 - 1, s: Math.random() * 6.28 }));
    const col = [124, 140, 255];
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const size = () => { D = Math.min(devicePixelRatio || 1, 2); W = c.width = innerWidth * D; H = c.height = innerHeight * D; };
    const onMove = (e) => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; };

    const draw = () => {
      t += reduce ? 0 : 0.004;
      const w = world.current;
      const target = hex(w.colors[w.idx % w.colors.length]);
      for (let k = 0; k < 3; k++) col[k] += (target[k] - col[k]) * 0.05;
      zoom += ([1, 1.2, 0.95, 1.35, 1.05, 1.25][w.idx % 6] - zoom) * 0.04;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const sp = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const a = sp * Math.PI * 1.6 + t, ca = Math.cos(a), sa = Math.sin(a);
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      const base = Math.min(W, H) * 0.62 * zoom;
      ctx.clearRect(0, 0, W, H);
      const P = pts.map((p) => {
        const wob = Math.sin(t * 3 + p.s) * 0.03;
        const x = p.x * 1.3 + wob, y = p.y * 1.1 - sp * 0.35 + wob;
        const rx = x * ca + p.z * sa, rz = -x * sa + p.z * ca;
        const f = 1.7 / (2.6 - rz);
        return { X: W / 2 + (rx + mouse.x * 0.25) * f * base * 1.15, Y: H / 2 + (y + mouse.y * 0.25) * f * base, f };
      });
      const rgb = col.map(Math.round).join(',');
      const max = base * 0.28;
      ctx.lineWidth = D;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const d = Math.hypot(P[i].X - P[j].X, P[i].Y - P[j].Y);
          if (d < max) {
            ctx.strokeStyle = `rgba(${rgb},${(1 - d / max) * (light ? 0.38 : 0.3)})`;
            ctx.beginPath(); ctx.moveTo(P[i].X, P[i].Y); ctx.lineTo(P[j].X, P[j].Y); ctx.stroke();
          }
        }
      }
      for (const q of P) {
        ctx.fillStyle = `rgba(${rgb},${clamp(q.f - 0.2, 0.15, 1) * 0.9})`;
        ctx.beginPath(); ctx.arc(q.X, q.Y, Math.max(1, q.f * 2.4 * D), 0, 6.283); ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    size(); draw();
    const onResize = () => { size(); if (reduce) draw(); };
    addEventListener('resize', onResize);
    addEventListener('mousemove', onMove, { passive: true });
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', onResize); removeEventListener('mousemove', onMove); };
  }, []);
  return <canvas ref={ref} className="cosmos" aria-hidden="true" />;
}

/* ---------- small pieces ---------- */
function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`rv ${on ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>;
}

function Section({ id, label, className = '', children }) {
  return (
    <section id={id} className={`sec ${className}`}>
      <div className="wrap">
        <div className="panel">
          {label && <div className="chap"><b>{label[0]}</b> — {label[1]}</div>}
          {children}
        </div>
      </div>
    </section>
  );
}

function Typer({ prefix, roles }) {
  const [t, setT] = useState('');
  const key = (roles || []).join('|');
  useEffect(() => {
    if (!roles?.length) return;
    let i = 0, j = 0, del = false, to;
    const tick = () => {
      const w = roles[i];
      if (!del) {
        j++; setT(w.slice(0, j));
        if (j === w.length) { del = true; to = setTimeout(tick, 1500); return; }
        to = setTimeout(tick, 65);
      } else {
        j--; setT(w.slice(0, j));
        if (j === 0) { del = false; i = (i + 1) % roles.length; to = setTimeout(tick, 300); return; }
        to = setTimeout(tick, 32);
      }
    };
    to = setTimeout(tick, 1300);
    return () => clearTimeout(to);
  }, [key]);
  if (!roles?.length) return null;
  return <div className="typer">{prefix || 'Currently shipping'} <b>{t}</b><span className="caret" /></div>;
}

function Count({ v = '' }) {
  const m = v.match(/^(\D*)(\d+)(.*)$/);
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!m) return;
    const target = +m[2];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const f = (now) => {
        const k = Math.min((now - t0) / 1400, 1);
        setN(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [v]);
  return <span ref={ref}>{m ? m[1] + n + m[3] : v}</span>;
}

/* CI/CD pipeline: starts by itself when it scrolls into view */
function Pipeline() {
  const box = useRef(null);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(box.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    setStep(0);
    let i = 0;
    const id = setInterval(() => { i++; setStep(i); if (i >= STAGES.length) clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }, [started, run]);
  const done = step >= STAGES.length;
  return (
    <div className="pipe" ref={box} aria-label="Animated CI/CD pipeline">
      <div className="pipe-top">
        <span>main · pipeline #{1240 + run}</span>
        <button onClick={() => setRun((r) => r + 1)}>{done ? 'Run again' : 'Restart'}</button>
      </div>
      <div className="stages">
        {STAGES.map((s, i) => (
          <div key={s.n} className={'stage ' + (started && i < step ? 'done' : started && i === step ? 'run' : '')}>
            <div className="node">{started && i < step ? '✓' : i + 1}</div>
            <b>{s.n}</b><small>{s.t}</small>
          </div>
        ))}
      </div>
      <div className="log" aria-live="polite">
        {started && STAGES.slice(0, Math.min(step + 1, STAGES.length)).map((s, i) => <div key={s.n}>{i < step ? <em>✓</em> : '…'} {s.log}</div>)}
        {done && <div><em>Shipped.</em> Another green build.</div>}
      </div>
    </div>
  );
}

const fill = (d) => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>;
const stroke = (c) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{c}</svg>;
const ICONS = {
  email: stroke(<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>),
  github: fill('M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z'),
  linkedin: fill('M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z'),
  twitter: fill('M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41Z'),
  instagram: stroke(<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".7" fill="currentColor" /></>),
  facebook: stroke(<path d="M14 9h3V5h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9Z" />),
  youtube: stroke(<><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" /></>),
  whatsapp: stroke(<><path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.5L3 21Z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2L9 9.5Z" /></>),
  website: stroke(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></>),
  resume: stroke(<><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>),
};

function Socials({ list, labels }) {
  if (!list.length) return null;
  return (
    <div className={labels ? 'social' : 'soc'}>
      {list.map(([k, name, url]) => {
        const ext = !url.startsWith('mailto:');
        return (
          <a key={k} href={url} aria-label={name} title={name} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {ICONS[k]}{labels && <span>{name}</span>}
          </a>
        );
      })}
    </div>
  );
}

function ContactForm() {
  const blank = { name: '', email: '', body: '', website: '' };
  const [f, setF] = useState(blank);
  const [s, setS] = useState({ st: 'idle', msg: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setS({ st: 'busy', msg: '' });
    try { await api.post('/messages', f); setF(blank); setS({ st: 'ok', msg: 'Thanks! Your message is on its way.' }); }
    catch (x) { setS({ st: 'no', msg: x.message }); }
  };
  return (
    <form className="cf" onSubmit={submit}>
      <div className="two">
        <input aria-label="Your name" placeholder="Your name" required maxLength={100} value={f.name} onChange={set('name')} />
        <input aria-label="Your email" type="email" placeholder="Your email" required value={f.email} onChange={set('email')} />
      </div>
      <textarea aria-label="Message" placeholder="How can I help?" rows={4} required minLength={5} maxLength={3000} value={f.body} onChange={set('body')} />
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} />
      <button className="btn p" disabled={s.st === 'busy'}>{s.st === 'busy' ? 'Sending…' : 'Send message'}</button>
      {s.msg && <p className={s.st} role="status">{s.msg}</p>}
    </form>
  );
}

/* ---------- page ---------- */
export default function Portfolio() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [active, setActive] = useState('top');
  const world = useRef({ idx: 0, colors: PALETTE });
  useEffect(() => { api.get('/content').then(setData).catch((e) => setErr(e.message)); }, []);

  const p = data?.profile;
  const [theme, toggle] = useTheme(p?.defaultTheme);

  useEffect(() => {
    if (!p) return;
    applyAccent(p.accent);
    document.title = p.seoTitle || p.name || 'Portfolio';
    world.current.colors = [/^#[0-9a-f]{6}$/i.test(p.accent || '') ? p.accent : PALETTE[0], ...PALETTE.slice(1)];
  }, [p]);

  // which chapter is on screen (drives the dots and the background colour)
  useEffect(() => {
    if (!data) return;
    const els = [...document.querySelectorAll('main > section[id]')];
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) {
        world.current.idx = Math.max(0, els.indexOf(e.target));
        setActive(e.target.id);
      }
    }), { rootMargin: '-45% 0px -50% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [!!data]);

  if (err) return <div className="center"><p>Couldn’t load the portfolio: {err}</p></div>;
  if (!data) return <div className="center"><p>Loading…</p></div>;

  const sec = p.sections || {};
  const on = (k) => sec[k] !== false;
  const dark = theme === 'dark';
  const skills = data.skills, projects = data.projects, jobs = data.experience;

  const chapters = [{ id: 'top', name: 'Intro' }];
  if (on('about')) chapters.push({ id: 'about', name: 'About' });
  if (on('work') && projects.length) chapters.push({ id: 'work', name: 'Work' });
  if (on('pipeline')) chapters.push({ id: 'delivery', name: 'Delivery' });
  if (on('experience') && jobs.length) chapters.push({ id: 'experience', name: 'Experience' });
  if (on('contact')) chapters.push({ id: 'contact', name: 'Contact' });
  const num = (id) => String(chapters.findIndex((c) => c.id === id)).padStart(2, '0');
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const groups = [];
  skills.forEach((s) => {
    let g = groups.find((x) => x.name === s.group);
    if (!g) groups.push((g = { name: s.group, items: [] }));
    g.items.push(s);
  });
  let k = 0;
  const socials = [
    ['email', 'Email', p.email && `mailto:${p.email}`], ['github', 'GitHub', p.github], ['linkedin', 'LinkedIn', p.linkedin],
    ['twitter', 'X', p.twitter], ['instagram', 'Instagram', p.instagram], ['facebook', 'Facebook', p.facebook],
    ['youtube', 'YouTube', p.youtube], ['whatsapp', 'WhatsApp', p.whatsapp], ['website', 'Website', p.website], ['resume', 'Résumé', p.resumeUrl],
  ].filter(([, , u]) => u);
  const bandWords = skills.length ? skills.map((s) => s.name) : (p.roles?.length ? p.roles : ['Full-stack', 'DevOps']);
  const bandText = bandWords.join('  ·  ') + '  ·  ';

  return (
    <div>
      <Cosmos world={world} />
      <header className="top">
        <div className="wrap">
          <nav className="main">
            <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); go('top'); }}>{p.logo || p.name}<span>.</span>dev</a>
            <div className="links">
              {chapters.slice(1).map((c) => <a key={c.id} href={`#${c.id}`} onClick={(e) => { e.preventDefault(); go(c.id); }}>{c.name}</a>)}
              <button className="toggle" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
                <i aria-hidden="true">{dark ? '☀' : '☾'}</i><b>{dark ? 'Light' : 'Dark'}</b>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <nav className="dots" aria-label="Chapters">
        {chapters.map((c) => (
          <button key={c.id} className={active === c.id ? 'on' : ''} onClick={() => go(c.id)} aria-label={c.name}><span>{c.name}</span></button>
        ))}
      </nav>

      <main>
        {/* Intro */}
        <section id="top" className="hero-sec">
          <div className="wrap">
            <div className={`hero-wrap ${p.photo ? 'has-me' : ''}`}>
              <div className="hero">
                {p.available && <span className="status"><span className="dot" />{p.status}</span>}
                <h1 aria-label={p.headline}>
                  {(p.headline || '').split(' ').map((w, i) => (
                    <Fragment key={i}><span className="w" aria-hidden="true"><span style={{ '--i': i }}>{w}</span></span>{' '}</Fragment>
                  ))}
                </h1>
                <p className="lead">{p.intro}</p>
                <Typer prefix={p.rolesPrefix} roles={p.roles} />
                <div className="cta">
                  {on('work') && <a className="btn p" href="#work" onClick={(e) => { e.preventDefault(); go('work'); }}>See my work</a>}
                  {on('contact') && <a className="btn" href="#contact" onClick={(e) => { e.preventDefault(); go('contact'); }}>Get in touch</a>}
                </div>
                <Socials list={socials} />
              </div>
              {p.photo && (
                <figure className="me">
                  <img src={p.photo} alt={`Portrait of ${p.name}`} />
                  <figcaption>{p.name}</figcaption>
                </figure>
              )}
            </div>
          </div>
        </section>

        {on('marquee') && (
          <div className="band" aria-hidden="true">
            <div className="row r1"><span>{bandText}</span><span>{bandText}</span></div>
            <div className="row r2"><span>{bandText}</span><span>{bandText}</span></div>
          </div>
        )}

        {/* About */}
        {on('about') && (
          <Section id="about" label={[num('about'), 'About']}>
            <Reveal><h2 className="big">{p.aboutTitle}</h2></Reveal>
            <Reveal delay={80}><p className="sub">{p.aboutText}</p></Reveal>
            <div className="cols">
              {groups.map((g, i) => (
                <Reveal key={g.name} delay={i * 100}>
                  <h3>{g.name}</h3>
                  <div className="tags">
                    {g.items.map((s) => <span className="tag tg" key={s._id} style={{ '--i': k++ }}>{s.name}</span>)}
                  </div>
                </Reveal>
              ))}
            </div>
          </Section>
        )}

        {/* Work */}
        {on('work') && projects.length > 0 && (
          <Section id="work" label={[num('work'), 'Work']}>
            <Reveal><h2 className="big">{p.workTitle}</h2></Reveal>
            <Reveal delay={80}><p className="sub">{p.workText}</p></Reveal>
            <div className="pgrid">
              {projects.map((x, i) => (
                <Reveal key={x._id} delay={(i % 3) * 90}>
                  <article className="pc" style={{ '--c': PALETTE[i % PALETTE.length] }}>
                    <span className="no">{String(i + 1).padStart(2, '0')}</span>
                    <h3>{x.title}</h3>
                    <p>{x.description}</p>
                    <div className="tags">{(x.stack || []).map((s) => <span className="tag" key={s}>{s}</span>)}</div>
                    {x.metric && <div className="metric"><Count v={x.metric} /><small>{x.metricLabel}</small></div>}
                    {(x.link || x.repo) && (
                      <div className="plinks">
                        {x.link && <a href={x.link} target="_blank" rel="noopener noreferrer">Live site ↗</a>}
                        {x.repo && <a href={x.repo} target="_blank" rel="noopener noreferrer">Source ↗</a>}
                      </div>
                    )}
                  </article>
                </Reveal>
              ))}
            </div>
          </Section>
        )}

        {/* Delivery */}
        {on('pipeline') && (
          <Section id="delivery" label={[num('delivery'), 'Delivery']}>
            <Reveal><h2 className="big">Every push <em>ships.</em></h2></Reveal>
            <Reveal delay={80}><p className="sub">Build, test, scan and deploy, automated end to end with zero downtime.</p></Reveal>
            <Reveal delay={140}><Pipeline /></Reveal>
          </Section>
        )}

        {/* Experience */}
        {on('experience') && jobs.length > 0 && (
          <Section id="experience" label={[num('experience'), 'Experience']}>
            <Reveal><h2 className="big">{p.expTitle}</h2></Reveal>
            <Reveal delay={80}><p className="sub">{p.expText}</p></Reveal>
            <div className="tl">
              {jobs.map((j, i) => (
                <Reveal key={j._id} className="job" delay={(i % 3) * 90}>
                  <time>{j.period}</time>
                  <h3>{j.role}{j.org ? `, ${j.org}` : ''}</h3>
                  <p>{j.description}</p>
                </Reveal>
              ))}
            </div>
          </Section>
        )}

        {/* Contact */}
        {on('contact') && (
          <Section id="contact" label={[num('contact'), 'Contact']}>
            <Reveal><h2 className="big">{p.contactTitle}</h2></Reveal>
            <Reveal delay={80}><p className="sub">{p.contactText}</p></Reveal>
            <Reveal delay={140}>
              {p.email && <a className="mail" href={`mailto:${p.email}`}>{p.email}</a>}
              <ContactForm />
              <Socials list={socials.filter(([key]) => key !== 'email')} labels />
            </Reveal>
          </Section>
        )}
      </main>

      <footer className="bottom"><div className="wrap">{p.footer || `© ${new Date().getFullYear()} ${p.name}. Built with the MERN stack.`}</div></footer>
    </div>
  );
}