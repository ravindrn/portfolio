const t = (key, label, extra = {}) => ({ key, label, type: 'text', ...extra });
const ta = (key, label, extra = {}) => ({ key, label, type: 'textarea', wide: true, ...extra });
const b = (key, label, extra = {}) => ({ key, label, type: 'bool', ...extra });

const h = (label) => ({ key: '_h_' + label, label, type: 'heading' });

export const profileFields = [
  h('Photo'),
  { key: 'photo', label: 'Your photo', type: 'image', wide: true, hint: 'Shown in the hero. It is cropped to a portrait and resized automatically. Press “Save changes” afterwards.' },
  h('Identity & hero'),
  t('name', 'Your name'),
  t('logo', 'Logo text', { hint: 'Shown as “logo.dev” in the header' }),
  b('available', 'Show the availability badge'),
  t('status', 'Badge text', { ph: 'Open to new projects' }),
  t('headline', 'Hero headline', { wide: true }),
  ta('intro', 'Hero intro', { rows: 3 }),
  t('rolesPrefix', 'Typing line prefix', { ph: 'Currently shipping' }),
  { key: 'roles', label: 'Typing line phrases', type: 'tags', wide: true, hint: 'Comma separated. They type out one after another.' },
  h('Contact & social links'),
  t('email', 'Contact email'),
  t('github', 'GitHub', { ph: 'https://github.com/you' }),
  t('linkedin', 'LinkedIn', { ph: 'https://linkedin.com/in/you' }),
  t('twitter', 'X / Twitter', { ph: 'https://x.com/you' }),
  t('instagram', 'Instagram', { ph: 'https://instagram.com/you' }),
  t('facebook', 'Facebook', { ph: 'https://facebook.com/you' }),
  t('youtube', 'YouTube', { ph: 'https://youtube.com/@you' }),
  t('whatsapp', 'WhatsApp link', { ph: 'https://wa.me/94771234567', hint: 'Country code + number, no + or spaces' }),
  t('website', 'Personal website / blog'),
  t('resumeUrl', 'Résumé link', { hint: 'A public link to your CV (PDF, Drive, etc.)' }),
];

export const sectionFields = [
  b('sections.pipeline', 'Show the CI/CD pipeline animation'),
  b('sections.marquee', 'Show the scrolling tech ticker'),
  b('sections.about', 'Show About / skills'),
  b('sections.work', 'Show Work / projects'),
  b('sections.experience', 'Show Experience'),
  b('sections.contact', 'Show Contact and the message form'),
  t('aboutTitle', 'About title', { wide: true }), ta('aboutText', 'About text', { rows: 2 }),
  t('workTitle', 'Work title', { wide: true }), ta('workText', 'Work text', { rows: 2 }),
  t('expTitle', 'Experience title', { wide: true }), ta('expText', 'Experience text', { rows: 2 }),
  t('contactTitle', 'Contact title', { wide: true }), ta('contactText', 'Contact text', { rows: 2 }),
];

export const lookFields = [
  { key: 'defaultTheme', label: 'Default theme for new visitors', type: 'select',
    options: [{ v: 'system', l: 'Follow their device' }, { v: 'light', l: 'Light' }, { v: 'dark', l: 'Dark' }] },
  { key: 'accent', label: 'Accent colour', type: 'color' },
  t('seoTitle', 'Browser tab / SEO title', { wide: true }),
  t('footer', 'Footer text', { wide: true, hint: 'Leave empty for the default copyright line' }),
];

export const projectFields = [
  t('title', 'Title'),
  b('visible', 'Visible on the site'),
  ta('description', 'Description', { rows: 4 }),
  { key: 'stack', label: 'Tech stack', type: 'tags', wide: true, hint: 'Comma separated' },
  t('metric', 'Headline number', { ph: '38%', hint: 'A leading number animates when scrolled into view' }),
  t('metricLabel', 'Number label', { ph: 'faster checkout' }),
  t('link', 'Live URL'),
  t('repo', 'Source URL'),
];
export const projectBlank = { title: '', description: '', stack: [], metric: '', metricLabel: '', link: '', repo: '', visible: true };

export const skillFields = [
  t('name', 'Skill'),
  t('group', 'Group', { ph: 'Full-stack', hint: 'Skills with the same group name are shown together' }),
  b('visible', 'Visible on the site'),
];
export const skillBlank = { name: '', group: 'Full-stack', visible: true };

export const expFields = [
  t('role', 'Role'), t('org', 'Company'), t('period', 'Period', { ph: '2023 – Present' }),
  b('visible', 'Visible on the site'),
  ta('description', 'What you did', { rows: 4 }),
];
export const expBlank = { role: '', org: '', period: '', description: '', visible: true };
