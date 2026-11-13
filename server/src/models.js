import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const S = (def) => new Schema(def, { timestamps: true });
const flag = { type: Boolean, default: true };

export const User = model('User', S({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
}));

export const Profile = model('Profile', S({
  name: String, logo: String, status: String, available: flag,
  headline: String, intro: String, rolesPrefix: String, roles: [String],
  email: String, github: String, linkedin: String, twitter: String, resumeUrl: String,
  photo: String, instagram: String, facebook: String, youtube: String, whatsapp: String, website: String,
  aboutTitle: String, aboutText: String,
  workTitle: String, workText: String,
  expTitle: String, expText: String,
  contactTitle: String, contactText: String,
  sections: { pipeline: flag, marquee: flag, about: flag, work: flag, experience: flag, contact: flag },
  defaultTheme: { type: String, enum: ['system', 'light', 'dark'], default: 'system' },
  accent: { type: String, default: '', match: /^(#[0-9a-fA-F]{6})?$/ },
  seoTitle: String, footer: String,
}));

export const Project = model('Project', S({
  title: { type: String, required: true, trim: true },
  description: String, stack: [String], metric: String, metricLabel: String,
  link: String, repo: String, order: { type: Number, default: 0 }, visible: flag,
}));

export const Skill = model('Skill', S({
  name: { type: String, required: true, trim: true },
  group: { type: String, default: 'Full-stack', trim: true },
  order: { type: Number, default: 0 }, visible: flag,
}));

export const Experience = model('Experience', S({
  role: { type: String, required: true, trim: true },
  org: String, period: String, description: String,
  order: { type: Number, default: 0 }, visible: flag,
}));

export const Message = model('Message', S({
  name: { type: String, required: true }, email: { type: String, required: true },
  body: { type: String, required: true }, read: { type: Boolean, default: false },
}));
