import { useEffect, useState } from 'react';

// Visitor's saved choice > admin's default theme > system preference
export function useTheme(pref = 'system') {
  const [saved, setSaved] = useState(() => {
    try { return localStorage.getItem('theme'); } catch { return null; }
  });
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = saved || (pref !== 'system' ? pref : system);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setSaved(next);
    try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
  };
  return [theme, toggle];
}

// Lets the admin pick a custom accent colour; picks readable text on top of it
export function applyAccent(hex) {
  const s = document.documentElement.style;
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) {
    ['--accent', '--accent-ink', '--glow'].forEach((v) => s.removeProperty(v));
    return;
  }
  const [R, G, B] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const lum = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
  s.setProperty('--accent', hex);
  s.setProperty('--accent-ink', lum > 0.6 ? '#0C111F' : '#FFFFFF');
  s.setProperty('--glow', `rgba(${R},${G},${B},.14)`);
}
