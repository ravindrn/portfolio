import bcrypt from 'bcryptjs';
import { User, Profile, Project, Skill, Experience } from './models.js';

const withOrder = (arr) => arr.map((x, order) => ({ ...x, order }));

export async function ensureSeed() {
  if (!(await User.countDocuments())) {
    const { ADMIN_EMAIL = 'admin@example.com', ADMIN_PASSWORD = 'ChangeMe-Now-123!' } = process.env;
    await User.create({ email: ADMIN_EMAIL, password: await bcrypt.hash(ADMIN_PASSWORD, 12) });
    console.log(`Admin account created: ${ADMIN_EMAIL}`);
  }
  if (await Profile.countDocuments()) return;

  await Profile.create({
    name: 'Alex Morgan', logo: 'alex', status: 'Open to new projects', available: true,
    headline: 'I build the app, and the pipeline that ships it.',
    intro: 'I’m Alex Morgan, a full-stack developer and DevOps engineer. I design React and Node products, then automate the infrastructure so they deploy safely many times a day.',
    rolesPrefix: 'Currently shipping',
    roles: ['React and Node.js apps', 'Kubernetes clusters', 'CI/CD pipelines', 'Terraform on AWS'],
    email: 'hello@alexmorgan.dev', github: 'https://github.com/', linkedin: 'https://linkedin.com/', twitter: '',
    aboutTitle: 'One engineer from interface to infrastructure',
    aboutText: 'Teams hand work between developers and operations. I do both, so features reach users faster and break less.',
    workTitle: 'Selected work', workText: 'Projects where the application and the platform were designed together.',
    expTitle: 'Experience', expText: 'Years spent moving between product code and the systems underneath it.',
    contactTitle: 'Let’s build something reliable',
    contactText: 'Have a product to ship or a pipeline to fix? Send me a note and I’ll reply within a day.',
    seoTitle: 'Alex Morgan — Full-Stack & DevOps Engineer', footer: '',
  });

  await Project.insertMany(withOrder([
    { title: 'Orbit Commerce', description: 'Headless storefront with a Next.js front end, a NestJS API and event-driven order processing on Kafka.', stack: ['Next.js', 'NestJS', 'Kafka'], metric: '38%', metricLabel: 'faster checkout' },
    { title: 'Pipeline Kit', description: 'Reusable GitHub Actions and Terraform modules that give every team a tested, scanned and deployable service in under an hour.', stack: ['Terraform', 'GitHub Actions', 'AWS'], metric: '12 min', metricLabel: 'avg. deploy time' },
    { title: 'Beacon Observability', description: 'Unified metrics, logs and alerting for 60+ microservices, with SLO dashboards and on-call runbooks.', stack: ['Prometheus', 'Grafana', 'Loki'], metric: '−64%', metricLabel: 'incident response time' },
  ]));

  const app = ['TypeScript', 'React', 'Next.js', 'Node.js', 'NestJS', 'GraphQL', 'PostgreSQL', 'MongoDB'];
  const ops = ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'GitHub Actions', 'ArgoCD', 'Prometheus', 'Grafana'];
  await Skill.insertMany(withOrder([
    ...app.map((name) => ({ name, group: 'Full-stack' })),
    ...ops.map((name) => ({ name, group: 'DevOps' })),
  ]));

  await Experience.insertMany(withOrder([
    { role: 'Senior Full-Stack & DevOps Engineer', org: 'Northwind Cloud', period: '2023 – Present', description: 'Own the delivery platform for 20 product teams. Moved the company from hand-run releases to GitOps on Kubernetes.' },
    { role: 'Full-Stack Engineer', org: 'Lumen Labs', period: '2020 – 2023', description: 'Built customer-facing React apps and Node services, then took over infrastructure as the team grew.' },
    { role: 'Software Engineer', org: 'Brightside Digital', period: '2018 – 2020', description: 'Shipped web apps for clients across retail and fintech, and introduced CI to every project.' },
  ]));
  console.log('Sample portfolio content created. Edit it all from /admin.');
}
