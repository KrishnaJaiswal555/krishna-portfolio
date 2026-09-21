// SINGLE SOURCE OF TRUTH for every personal and project fact on this site.
//
// Nothing anywhere else in the codebase hardcodes a name, a number or a URL.
// main.js renders collections from here; index.html carries only the identity
// copy that must exist for crawlers and for a no-JavaScript visitor.
//
// ---------------------------------------------------------------------------
// TWO RULES THIS FILE ENFORCES STRUCTURALLY
//
// 1. `metrics: []` renders NOTHING. The UI loops the array; an empty array
//    produces no markup at all. A project therefore cannot display a number
//    that was not put here deliberately.
// 2. `links: {}` renders NO buttons. Same mechanism. Every link object below
//    is deliberately EMPTY — see the TODO block. No URL is guessed, inferred
//    from a local git remote, or carried over from a resume.
//
// `source` records where a project's description came from:
//    'verified' — read from the project's own files during Phase 1 analysis
//    'provided' — supplied by Krishna; not independently checked
// It is an authoring guard, not a public badge. It is never rendered.
// ---------------------------------------------------------------------------
//
// TODO (Krishna): paste real URLs into the `links` objects when the repos are
// public. Shape: { repo: 'https://…', demo: 'https://…', report: 'https://…' }
// Any key you omit simply produces no button. Nothing else needs changing.

export const profile = {
  name: 'Krishna Jaiswal',
  first: 'KRISHNA',
  last: 'JAISWAL',
  tagline: ['AI', 'Data Science', 'Machine Learning'],
  role: 'Data Science · AI · Machine Learning',

  // Phrased as a date range so it is accurate whether or not the degree has
  // been formally conferred — avoids claiming a status that was never confirmed.
  education: {
    degree: 'B.Tech, Computer Technology',
    institution: 'Yeshvantrao Chavan College of Engineering, Nagpur',
    short: 'YCCE',
    period: '2021 – 2026',
  },

  intro:
    'I am a Computer Technology engineering student interested in Data '
    + 'Science, Artificial Intelligence, Machine Learning, and building '
    + 'practical software systems that solve real-world problems.',

  focus: [
    'Data Science', 'Artificial Intelligence', 'Machine Learning',
    'Generative AI', 'Python Development', 'Backend Development',
    'Data Analytics',
  ],

  interests: [
    'Data Analyst', 'Data Associate', 'Data Scientist',
    'AI/ML Engineer (entry-level)',
  ],

  contact: {
    email: 'krishnajaiswal91102@gmail.com',
    linkedin: 'https://linkedin.com/in/krisjais',
    github: 'https://github.com/KrishnaJaiswal555',
    // Phone deliberately omitted from the public page. It is on the resume.
    // Add `phone: '+91-…'` here if you want it shown.
  },

  // Rendered only if the file exists — see lib/assets.js probeFile().
  resume: 'public/resume/Krishna_Jaiswal_Resume.pdf',
};

export const experience = [
  {
    role: 'Data Science Intern',
    org: 'Prism IT Solutions',
    location: 'Pune, Maharashtra',
    period: 'Feb 2026 – Jun 2026',
    source: 'verified',
    points: [
      'Developed predictive models using Python and Scikit-learn for anomaly detection.',
      'Conducted EDA on 15,000+ records identifying key patterns.',
      'Collaborated with cross-functional teams to deliver data-driven recommendations.',
    ],
  },
];

export const certifications = [
  { name: 'Certified Data Scientist', issuer: 'Datamites', source: 'verified' },
  { name: 'Generative AI Mastermind', issuer: 'Outskill', source: 'verified' },
];

export const skills = [
  { group: 'Languages', items: ['Python', 'SQL'] },
  { group: 'Data Science', items: ['NumPy', 'Pandas', 'Scikit-learn', 'TensorFlow'] },
  { group: 'Visualization', items: ['Matplotlib', 'Seaborn', 'Power BI', 'Plotly'] },
  { group: 'Engineering', items: ['FastAPI', 'Streamlit', 'SQLite', 'Docker'] },
  { group: 'AI / ML', items: ['Machine Learning', 'Generative AI', 'Agentic AI', 'RAG'] },
];

// Dates are taken from the resume. No milestone is inferred or estimated.
//
// The `year` field is the rail's axis label and holds the REAL granularity of
// each milestone, not a calendar year. Five of these fall in 2026, so a
// year-per-node axis would print "2026" five times and read as a bug.
//
// There is deliberately no "graduated" milestone: the programme runs
// 2021–2026 and completion was never confirmed, so the site states the range
// (in the About section) and claims nothing beyond it.
export const timeline = [
  {
    year: '2021',
    key: 'Foundations',
    label: 'B.Tech begins',
    lines: ['Computer Technology', 'YCCE, Nagpur'],
    source: 'verified',
  },
  {
    year: 'Feb – Jun 2026',
    key: 'Industry',
    label: 'Data Science Intern',
    lines: ['Prism IT Solutions, Pune', 'EDA on 15,000+ records'],
    source: 'verified',
  },
  {
    year: 'May 2026',
    key: 'Modelling',
    label: 'Customer Churn Prediction',
    lines: ['Logistic Regression · Scikit-learn', '7,000+ customer records'],
    source: 'verified',
  },
  {
    year: 'Jun 2026',
    key: 'Analytics',
    label: 'Retail Sales Analytics',
    lines: ['MySQL · Power BI', '9,994 transactions'],
    source: 'verified',
  },
  {
    year: 'Aug 2026',
    key: 'Semantic search',
    label: 'AI Product Search',
    lines: ['Embeddings · FAISS', '5,295 products'],
    source: 'verified',
  },
];

export const projects = [
  {
    id: 'ai-product-search',
    num: '01',
    title: 'AI-Powered Smart Product Search',
    subtitle: 'Semantic search & recommendation platform',
    source: 'verified',
    blurb:
      'Search 5,295 real Amazon products by describing what you want, not by '
      + 'guessing keywords — with a checkable reason for every recommendation.',
    problem:
      'Keyword search fails when the shopper does not know the vocabulary of '
      + 'the catalog. "Something to carry my laptop" matches no product title '
      + 'containing those words, yet the intent is unambiguous.',
    solution:
      'Sentence embeddings place products and queries in the same vector space, '
      + 'so retrieval works on meaning rather than string overlap. A second '
      + 'deterministic reranking stage reorders the candidates, and each result '
      + 'carries a generated explanation of why it matched.',
    tech: ['Python', 'Sentence Transformers', 'FAISS', 'FastAPI', 'Streamlit',
      'SQLite', 'Docker', 'Plotly', 'Pandas', 'NumPy', 'Scikit-learn'],
    features: [
      'Natural-language product search over a 5,295-product catalog',
      'all-MiniLM-L6-v2 embeddings, 384 dimensions',
      'FAISS IndexFlatIP over L2-normalized vectors — exact cosine similarity',
      'Two-stage ranking: vector retrieval, then deterministic hybrid reranking',
      'Per-result "why recommended" explanations',
      'Filtering, analytics dashboard and a REST API',
      'Runs as local Docker Compose; no LLM and no paid API anywhere',
    ],
    // Every figure below was read from the project's own artifacts during
    // Phase 1, and is qualified exactly as the evaluation file qualifies it.
    metrics: [
      { label: 'Precision@5', value: '0.80', note: '12-query evaluation set' },
      { label: 'Without reranking', value: '0.67', note: 'same query set' },
      { label: 'Catalog', value: '5,295', note: 'Amazon products' },
      { label: 'Embedding dim', value: '384' },
      { label: 'Automated tests', value: '274 passed' },
    ],
    // Read from the project's own README and source during Phase 1.
    architecture: [
      'Catalog pipeline (pandas) cleans and normalises 5,295 product records',
      'all-MiniLM-L6-v2 encodes product text into 384-dimension vectors',
      'Vectors are L2-normalized and indexed in FAISS IndexFlatIP (exact cosine)',
      'A query is embedded the same way, then retrieved by vector similarity',
      'A deterministic hybrid reranker reorders the candidate set',
      'FastAPI serves the REST API; SQLite holds product metadata',
      'Streamlit UI with a Plotly analytics dashboard; Docker Compose runs both',
    ],
    status: 'Runs locally via Docker Compose. No public deployment.',
    contribution: 'Individual project.',
    links: {},
  },

  {
    id: 'ai-career-copilot',
    num: '02',
    title: 'AI Career Copilot',
    subtitle: 'Job-market data science meets generative AI',
    source: 'verified',
    blurb:
      'Upload a resume, paste a job description, and get an explainable ATS '
      + 'score, a skill-gap report and a truthful rewrite — grounded in real '
      + 'job-postings data.',
    problem:
      'Job seekers apply without knowing what the market actually asks for, or '
      + 'how well their resume fits a posting. Generic advice ignores both the '
      + 'candidate profile and real hiring demand.',
    solution:
      'A five-agent LangGraph workflow computes every number in Python and uses '
      + 'the language model only to write prose. Nothing is invented about the '
      + 'candidate: every extracted item carries a verbatim resume excerpt that '
      + 'Python re-checks, and a deterministic quality guard removes any claim '
      + 'the resume does not support.',
    tech: ['Python', 'FastAPI', 'LangGraph', 'Streamlit', 'ChromaDB',
      'Pandas', 'Scikit-learn', 'TF-IDF'],
    features: [
      'Five-agent workflow: market intelligence, candidate intelligence, job matching, resume intelligence, quality guard',
      'Explainable ATS score with six weighted components, each reported with its numbers',
      'Evidence-bound rewriting — only skills the resume actually names',
      'Skill-gap analysis and career planning',
      'Job search and ranked, explainable recommendations',
      'Approval-gated self-improvement workflow',
    ],
    metrics: [
      { label: 'Job catalog', value: '8,971', note: 'postings' },
      { label: 'API endpoints', value: '15' },
      { label: 'Workflow agents', value: '5' },
    ],
    // The project's own README states this plainly; it is not softened here.
    // Read from the project's own README and source during Phase 1.
    architecture: [
      'Streamlit frontend calls a FastAPI backend over HTTP',
      'The backend runs a LangGraph workflow of five agents in sequence',
      'Market → candidate → job matching → resume intelligence → quality guard',
      'The quality guard can send a draft back for revision, up to three times',
      'Retrieval uses ChromaDB where available, TF-IDF otherwise',
      'A job catalog of 8,971 postings is loaded lazily, on first request',
      'Gemini writes language only; every number is computed in Python',
    ],
    status: 'Deployment-ready (Phase 6 complete). Not yet deployed.',
    contribution: 'Individual project.',
    links: {},
  },

  {
    id: 'retail-sales-analytics',
    num: '03',
    title: 'Retail Sales Analytics Dashboard',
    subtitle: 'SQL and Power BI business intelligence',
    source: 'verified',
    blurb:
      'A retail sales database queried with SQL and surfaced through an '
      + 'interactive Power BI dashboard for sales, profitability and regional '
      + 'performance.',
    problem:
      'Retail businesses generate large volumes of transactional data but lack '
      + 'a consolidated view of which categories, segments and regions actually '
      + 'drive profit.',
    solution:
      'The transactional dataset is modelled and queried in MySQL to produce '
      + 'business KPIs, then visualised in Power BI as an interactive report '
      + 'with region filtering and drill-down by category and segment.',
    tech: ['MySQL', 'SQL', 'Power BI', 'Microsoft Excel'],
    features: [
      'KPI cards: total sales, total profit, total quantity, average discount',
      'Sales by region and profit by category / sub-category',
      'Top 10 states by sales, sales by segment',
      'Interactive region filter and drill-down',
      'Aggregation, filtering, grouping and sorting queries in MySQL',
    ],
    metrics: [
      { label: 'Transactions analysed', value: '9,994' },
    ],
    // Read from the project's own README and files during Phase 1.
    architecture: [
      'Transactional dataset modelled in MySQL',
      'SQL queries aggregate, filter, group and sort to produce business KPIs',
      'Power BI connects to the modelled data and builds the report',
      'Interactive region filter drives drill-down by category and segment',
    ],
    status: 'Power BI report (.pbix) with supporting SQL.',
    contribution: 'Individual project.',
    links: {},
  },

  {
    id: 'skin-lesion-cnn',
    num: '04',
    title: 'Skin Lesion Classification using CNNs',
    subtitle: 'Comparative study of preprocessing strategies',
    // Described from information Krishna provided. Source code was not
    // available for inspection, so no implementation claim is made here.
    source: 'provided',
    blurb:
      'A comparative study of image preprocessing techniques for skin lesion '
      + 'classification with CNN-based deep learning models.',
    problem:
      'Dermoscopic images vary widely in illumination and colour balance. It is '
      + 'not obvious which preprocessing pipeline best serves a given CNN '
      + 'architecture, and the choice is often made by convention rather than '
      + 'measurement.',
    solution:
      'Five preprocessing strategies were applied across two CNN architectures '
      + 'and compared on the same dataset, isolating the effect of preprocessing '
      + 'from the effect of architecture.',
    tech: ['TensorFlow', 'DenseNet201', 'MobileNetV2', 'CNNs', 'Python'],
    features: [
      'Dataset: HAM10000',
      'Preprocessing compared: CLAHE, Color Constancy, Gaussian Blur, Histogram Equalization, and Color Constancy + CLAHE',
      'Architectures compared: DenseNet201 and MobileNetV2',
      'Training: transfer learning, fine-tuning, data augmentation, early stopping',
      'Key finding: preprocessing strategies can be model-specific, so pipelines benefit from being tailored to the architecture',
    ],
    metrics: [
      { label: 'DenseNet201', value: '85.0%', note: 'Color Constancy + CLAHE' },
      { label: 'Baseline', value: '82.1%' },
    ],
    // Described from information Krishna provided; not read from source.
    architecture: [
      'HAM10000 dermoscopic images as the dataset',
      'Five preprocessing variants prepared from the same source images',
      'Each variant trained on both architectures, holding everything else equal',
      'Transfer learning with fine-tuning, augmentation and early stopping',
      'Results compared across the preprocessing × architecture grid',
    ],
    status: 'Academic study.',
    contribution: 'Final-year group project.',
    // Rendered verbatim on the case study. Accuracy on a public dataset is not
    // evidence of clinical fitness, and the page must not imply otherwise.
    disclaimer:
      'This is an academic comparative study on a public dataset. It is not '
      + 'clinically validated and is not a diagnostic tool.',
    links: {},
  },

  {
    id: 'upi-sentinel-ai',
    num: '05',
    title: 'UPI Sentinel AI',
    subtitle: 'Fraud detection & investigation platform',
    source: 'provided',
    blurb:
      'An intelligent fraud detection and investigation platform that analyses '
      + 'synthetic UPI transactions, identifies suspicious patterns and produces '
      + 'evidence-grounded risk explanations.',
    problem:
      'A risk score on its own is not actionable. An investigator needs to know '
      + 'which factors drove the score and what prior knowledge supports that '
      + 'reading, otherwise the model output cannot be reviewed or challenged.',
    solution:
      'Transactions are scored by a machine learning model, the contributing '
      + 'risk factors are identified, and a retrieval step grounds the '
      + 'explanation in a knowledge base. A LangGraph workflow runs the '
      + 'investigation and validates the explanation before it is returned.',
    tech: ['Python', 'Scikit-learn', 'LangGraph', 'RAG', 'ChromaDB',
      'FastAPI', 'Streamlit', 'Sentence Transformers'],
    features: [
      'Synthetic transaction analysis and suspicious pattern detection',
      'Machine-learning risk scoring with risk-factor identification',
      'Retrieval-Augmented Generation over a knowledge base (ChromaDB + Sentence Transformers)',
      'LangGraph investigation workflow',
      'Explanation validation before output',
      'FastAPI backend with a Streamlit dashboard',
    ],
    // The brief supplied no measured figures for this project, so none appear.
    metrics: [],
    workflow: [
      'Transaction analysis',
      'Risk factor identification',
      'Knowledge retrieval',
      'LangGraph investigation',
      'Explanation validation',
      'Evidence-grounded explanation',
    ],
    // Described from information Krishna provided; not read from source.
    architecture: [
      'Streamlit dashboard over a FastAPI backend',
      'A machine-learning model scores each synthetic transaction for risk',
      'Contributing risk factors are identified from the scored result',
      'Sentence Transformers embed the factors; ChromaDB retrieves related knowledge',
      'A LangGraph workflow runs the investigation over the retrieved evidence',
      'The explanation is validated before it is returned',
    ],
    status: 'Deployment status not independently verified.',
    contribution: 'Individual project.',
    disclaimer:
      'Built and evaluated on synthetic transaction data. It does not detect '
      + 'real-world fraud with proven accuracy, and AI-generated explanations '
      + 'are not guaranteed to be correct.',
    links: {},
  },
];
