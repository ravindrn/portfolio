import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User, Profile, Project, Skill, Experience, Message } from './models.js';

const r = Router();
const admin = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (msg, status = 400) => Object.assign(new Error(msg), { status });
// Only copy fields that exist on the schema (blocks mass-assignment of anything else)
const clean = (Model, body = {}) =>
  Object.fromEntries(Object.keys(Model.schema.obj).filter((k) => k in body).map((k) => [k, body[k]]));

const limiter = (limit, windowMs) => rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' } });
const loginLimiter = limiter(10, 15 * 60 * 1000);
const messageLimiter = limiter(5, 60 * 60 * 1000);

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12); // keeps login timing constant
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const auth = wrap(async (req, _res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.user = await User.findById(jwt.verify(token, process.env.JWT_SECRET).id); } catch { /* invalid token */ }
  if (!req.user) throw bad('Unauthorized', 401);
  next();
});

/* ---------- Public ---------- */
r.get('/content', wrap(async (_req, res) => {
  const [profile, projects, skills, experience] = await Promise.all([
    Profile.findOne().lean(),
    Project.find({ visible: true }).sort('order createdAt').lean(),
    Skill.find({ visible: true }).sort('order createdAt').lean(),
    Experience.find({ visible: true }).sort('order createdAt').lean(),
  ]);
  res.json({ profile, projects, skills, experience });
}));

r.post('/messages', messageLimiter, wrap(async (req, res) => {
  const { name = '', email = '', body = '', website = '' } = req.body || {};
  if (website) return res.json({ ok: true }); // honeypot: bots fill this in
  const m = { name: String(name).trim(), email: String(email).trim(), body: String(body).trim() };
  if (!m.name || m.name.length > 100 || !/^\S+@\S+\.\S+$/.test(m.email) || m.body.length < 5 || m.body.length > 3000)
    throw bad('Please fill in all fields correctly.');
  await Message.create(m);
  res.status(201).json({ ok: true });
}));

/* ---------- Auth ---------- */
r.post('/auth/login', loginLimiter, wrap(async (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const u = await User.findOne({ email: String(email).toLowerCase().trim() });
  const ok = await bcrypt.compare(String(password), u ? u.password : DUMMY_HASH);
  if (!u || !ok) throw bad('Invalid email or password', 401);
  res.json({ token: sign(u), email: u.email });
}));

r.get('/auth/me', auth, (req, res) => res.json({ email: req.user.email }));

r.put('/auth/account', auth, wrap(async (req, res) => {
  const { current = '', email, password } = req.body || {};
  if (!(await bcrypt.compare(String(current), req.user.password))) throw bad('Current password is wrong', 403);
  if (email) req.user.email = String(email).toLowerCase().trim();
  if (password) {
    if (String(password).length < 10) throw bad('New password must be at least 10 characters');
    req.user.password = await bcrypt.hash(String(password), 12);
  }
  await req.user.save();
  res.json({ token: sign(req.user), email: req.user.email });
}));

/* ---------- Admin (everything below requires a valid token) ---------- */
admin.use(auth);

admin.get('/content', wrap(async (_req, res) => {
  const [profile, projects, skills, experience] = await Promise.all([
    Profile.findOne().lean(), Project.find().sort('order createdAt').lean(),
    Skill.find().sort('order createdAt').lean(), Experience.find().sort('order createdAt').lean(),
  ]);
  res.json({ profile, projects, skills, experience });
}));

admin.put('/profile', wrap(async (req, res) => {
  const doc = await Profile.findOneAndUpdate({}, clean(Profile, req.body),
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }).lean();
  res.json(doc);
}));

// Generic CRUD + reorder for projects, skills and experience
for (const [name, Model] of [['projects', Project], ['skills', Skill], ['experience', Experience]]) {
  admin.get(`/${name}`, wrap(async (_q, res) => res.json(await Model.find().sort('order createdAt').lean())));
  admin.post(`/${name}`, wrap(async (req, res) => {
    const last = await Model.findOne().sort('-order').lean();
    res.status(201).json(await Model.create({ ...clean(Model, req.body), order: (last?.order ?? -1) + 1 }));
  }));
  admin.post(`/${name}/reorder`, wrap(async (req, res) => {
    const { ids } = req.body || {};
    if (!Array.isArray(ids)) throw bad('ids is required');
    await Model.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { order } } })));
    res.json({ ok: true });
  }));
  admin.put(`/${name}/:id`, wrap(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, clean(Model, req.body), { new: true, runValidators: true });
    if (!doc) throw bad('Not found', 404);
    res.json(doc);
  }));
  admin.delete(`/${name}/:id`, wrap(async (req, res) => {
    if (!(await Model.findByIdAndDelete(req.params.id))) throw bad('Not found', 404);
    res.json({ ok: true });
  }));
}

admin.get('/messages', wrap(async (_q, res) => res.json(await Message.find().sort('-createdAt').lean())));
admin.patch('/messages/:id', wrap(async (req, res) => {
  const doc = await Message.findByIdAndUpdate(req.params.id, { read: !!req.body.read }, { new: true });
  if (!doc) throw bad('Not found', 404);
  res.json(doc);
}));
admin.delete('/messages/:id', wrap(async (req, res) => {
  await Message.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// Full backup / restore
admin.get('/export', wrap(async (_q, res) => {
  const [profile, projects, skills, experience, messages] = await Promise.all([
    Profile.findOne().lean(), Project.find().sort('order').lean(), Skill.find().sort('order').lean(),
    Experience.find().sort('order').lean(), Message.find().lean(),
  ]);
  res.json({ version: 1, exportedAt: new Date(), profile, projects, skills, experience, messages });
}));

admin.post('/import', wrap(async (req, res) => {
  const b = req.body;
  if (!b || b.version !== 1 || !b.profile) throw bad('This is not a valid backup file');
  const docs = (Model, arr) => (arr || []).map((x) => clean(Model, x));
  await Promise.all([Profile, Project, Skill, Experience, Message].map((M) => M.deleteMany()));
  await Promise.all([
    Profile.create(clean(Profile, b.profile)),
    Project.insertMany(docs(Project, b.projects)),
    Skill.insertMany(docs(Skill, b.skills)),
    Experience.insertMany(docs(Experience, b.experience)),
    Message.insertMany(docs(Message, b.messages)),
  ]);
  res.json({ ok: true });
}));

r.use('/admin', admin);
r.use((_req, res) => res.status(404).json({ error: 'Not found' }));

export default r;
