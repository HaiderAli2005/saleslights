export const PAGES = ['home', 'services', 'studio', 'contact'];

export const TABS = [
  { label: 'Home', key: 'home' },
  { label: 'Services', key: 'services' },
  { label: 'Studio', key: 'studio' },
  { label: 'Contact', key: 'contact' },
];

// w/h are the box the mark fills inside its slot — they differ per logo so
// wordmarks and stacked marks read at the same optical weight.
export const BRANDS = [
  { id: 'upcredit', alt: 'UpCredit', w: '100%', h: '58%' },
  { id: 'wse', alt: 'WSE Property Services', w: '72%', h: '100%' },
  { id: 'sats', alt: 'SATS Group', w: '100%', h: '52%' },
  { id: 'hilltown', alt: 'Hill Town Advisors', w: '100%', h: '64%' },
  { id: 'sherpa', alt: 'Sherpa', w: '100%', h: '62%' },
  { id: 'dutyrefunds', alt: 'DutyRefunds', w: '100%', h: '52%' },
  { id: 'jenkins', alt: 'Jenkins Homebuyers', w: '92%', h: '100%' },
  { id: 'himss', alt: 'HIMSS', w: '100%', h: '56%' },
  { id: 'incendium', alt: 'Incendium', w: '100%', h: '66%' },
  { id: 'bird', alt: 'Client', w: '58%', h: '100%' },
];

export const SERVICES = [
  {
    num: '01',
    title: 'Cold calling that books meetings',
    body: 'Trained callers work your list every day. We rewrite the scripts each week based on what earns a yes.',
    points: [
      'Dedicated callers, never a shared pool',
      'List building and data verification',
      'Calls recorded, objections logged',
      'Meetings booked into your calendar',
    ],
  },
  {
    num: '02',
    title: 'Personalised outreach, automated',
    body: 'Sequences triggered by real buying signals, written per account instead of per template.',
    points: [
      'Signals: hiring, funding, tooling changes',
      'Email and LinkedIn in one sequence',
      'Deliverability infrastructure managed for you',
      'Every account read by a human before send',
    ],
  },
  {
    num: '03',
    title: 'AI-enabled search',
    body: 'Content and technical work built to rank in search and get cited by answer engines. We publish it and keep iterating.',
    points: [
      'Entity and topic architecture',
      'Programmatic pages at scale',
      'Technical fixes shipped, not recommended',
      'Measured against pipeline, not traffic',
    ],
  },
  {
    num: '04',
    title: 'Product maintenance and upkeep',
    body: 'We keep the site fast, the funnel working and the integrations alive, so revenue stops leaking out of the back.',
    points: [
      'Landing pages and site performance',
      'Onboarding and lifecycle flows',
      'Integrations and analytics kept healthy',
      'A fixed monthly scope for ongoing fixes',
    ],
  },
  {
    num: '05',
    title: 'Revenue operations',
    body: 'A CRM that reflects reality, and reporting you can defend in a board meeting.',
    points: [
      'CRM setup, cleanup and routing',
      'Attribution and forecasting',
      'A written weekly report',
      'Playbooks documented and handed over',
    ],
  },
];

export const CALENDLY_BOOK = 'https://calendly.com/nkrause-tvw8/30min?back=1&month=2026-08';
export const CALENDLY_EMBED =
  'https://calendly.com/nkrause-tvw8/30min?hide_gdpr_banner=1&hide_landing_page_details=1&background_color=f6f5f1&text_color=171614&primary_color=171614';
export const LINKEDIN = 'https://linkedin.com/in/nicholas-krause';
export const EMAIL = 'nkrause@saleslights.com';
