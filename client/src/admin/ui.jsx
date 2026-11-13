import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [t, setT] = useState(null);
  const timer = useRef();
  const show = useCallback((msg, bad = false) => {
    setT({ msg, bad });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setT(null), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && <div className={'toast' + (t.bad ? ' bad' : '')} role="status">{t.msg}</div>}
    </ToastCtx.Provider>
  );
}

export const getPath = (o, k) => k.split('.').reduce((a, x) => a?.[x], o);
export const setPath = (o, k, v) => {
  const c = structuredClone(o);
  const ks = k.split('.');
  let t = c;
  ks.slice(0, -1).forEach((x) => { t = t[x] ??= {}; });
  t[ks.at(-1)] = v;
  return c;
};

function Tags({ id, value, onChange }) {
  const [s, setS] = useState((value || []).join(', '));
  return (
    <input id={id} value={s} onChange={(e) => {
      setS(e.target.value);
      onChange(e.target.value.split(',').map((x) => x.trim()).filter(Boolean));
    }} />
  );
}

async function toPortrait(file, W = 600, H = 750) {
  const bmp = await createImageBitmap(file);
  const k = Math.max(W / bmp.width, H / bmp.height);
  const w = bmp.width * k, h = bmp.height * k;
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
  c.getContext('2d').drawImage(bmp, (W - w) / 2, (H - h) / 2, w, h);
  return c.toDataURL('image/jpeg', 0.86);
}

function ImageField({ value, onChange, toast }) {
  const pick = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Please choose an image file', true);
    try { onChange(await toPortrait(file)); }
    catch { toast('Could not read that image. Try a JPG or PNG.', true); }
  };
  return (
    <div className="photoRow">
      <div className="photo">{value ? <img src={value} alt="Your photo preview" /> : <span>No photo yet</span>}</div>
      <div className="actions">
        <label className="btn p sm">{value ? 'Change photo' : 'Upload photo'}<input type="file" accept="image/*" hidden onChange={pick} /></label>
        {value && <button type="button" className="btn sm danger" onClick={() => onChange('')}>Remove</button>}
      </div>
    </div>
  );
}

export function Field({ f, value, onChange }) {
  const toast = useToast();
  if (f.type === 'heading') return <h3 className="fh">{f.label}</h3>;
  const id = 'f-' + f.key;
  if (f.type === 'bool') {
    return (
      <div className="fld">
        <label className="sw"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /><span /> {f.label}</label>
        {f.hint && <small>{f.hint}</small>}
      </div>
    );
  }
  let input;
  if (f.type === 'textarea') input = <textarea id={id} rows={f.rows || 4} value={value ?? ''} placeholder={f.ph} onChange={(e) => onChange(e.target.value)} />;
  else if (f.type === 'image') input = <ImageField value={value} onChange={onChange} toast={toast} />;
  else if (f.type === 'tags') input = <Tags id={id} value={value} onChange={onChange} />;
  else if (f.type === 'select') input = (
    <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {f.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
  else if (f.type === 'color') input = (
    <div className="colorrow">
      <input type="color" aria-label="Pick colour" value={/^#[0-9a-f]{6}$/i.test(value || '') ? value : '#4f46e5'} onChange={(e) => onChange(e.target.value)} />
      <input id={id} value={value ?? ''} placeholder="#4F46E5 (empty = default)" onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="btn sm" onClick={() => onChange('')}>Reset</button>
    </div>
  );
  else input = <input id={id} value={value ?? ''} placeholder={f.ph} onChange={(e) => onChange(e.target.value)} />;
  return (
    <div className={'fld' + (f.wide ? ' wide' : '')}>
      <label htmlFor={id}>{f.label}</label>
      {input}
      {f.hint && <small>{f.hint}</small>}
    </div>
  );
}

export function Form({ fields, value, onChange }) {
  return (
    <div className="grid">
      {fields.map((f) => (
        <Field key={f.key} f={f} value={getPath(value, f.key)} onChange={(v) => onChange(setPath(value, f.key, v))} />
      ))}
    </div>
  );
}
