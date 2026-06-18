import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { cities, localities, jobRoles, skills, jobs, jobSkills } from "./schema/index.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const connection = postgres(databaseUrl, { max: 1 });
const db = drizzle(connection);

// ─── Master Data ─────────────────────────────────────────────

const CITIES_DATA = [
  { name: "Mumbai", state: "Maharashtra" },
  { name: "Delhi", state: "Delhi" },
  { name: "Bangalore", state: "Karnataka" },
  { name: "Hyderabad", state: "Telangana" },
  { name: "Chennai", state: "Tamil Nadu" },
  { name: "Kolkata", state: "West Bengal" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Ahmedabad", state: "Gujarat" },
  { name: "Jaipur", state: "Rajasthan" },
  { name: "Lucknow", state: "Uttar Pradesh" },
  { name: "Noida", state: "Uttar Pradesh" },
  { name: "Gurugram", state: "Haryana" },
  { name: "Chandigarh", state: "Chandigarh" },
  { name: "Indore", state: "Madhya Pradesh" },
  { name: "Kochi", state: "Kerala" },
  { name: "Coimbatore", state: "Tamil Nadu" },
  { name: "Nagpur", state: "Maharashtra" },
  { name: "Bhopal", state: "Madhya Pradesh" },
  { name: "Visakhapatnam", state: "Andhra Pradesh" },
  { name: "Thiruvananthapuram", state: "Kerala" },
];

const LOCALITIES_MAP: Record<string, string[]> = {
  Mumbai: ["Andheri", "Bandra", "Lower Parel", "Powai", "BKC", "Goregaon", "Malad"],
  Delhi: ["Connaught Place", "Nehru Place", "Saket", "Dwarka", "Okhla", "Lajpat Nagar"],
  Bangalore: ["Whitefield", "Koramangala", "Electronic City", "HSR Layout", "Indiranagar", "Marathahalli", "Hebbal"],
  Hyderabad: ["HITEC City", "Gachibowli", "Madhapur", "Banjara Hills", "Secunderabad", "Kukatpally"],
  Chennai: ["OMR", "Guindy", "T. Nagar", "Adyar", "Velachery", "Porur"],
  Kolkata: ["Salt Lake", "Park Street", "Rajarhat", "Howrah", "Ballygunge"],
  Pune: ["Hinjewadi", "Kharadi", "Viman Nagar", "Wakad", "Baner", "Hadapsar"],
  Ahmedabad: ["SG Highway", "Prahlad Nagar", "Navrangpura", "Vastrapur", "Satellite"],
  Jaipur: ["Malviya Nagar", "C-Scheme", "Vaishali Nagar", "Mansarovar", "Tonk Road"],
  Lucknow: ["Hazratganj", "Gomti Nagar", "Aliganj", "Indira Nagar", "Mahanagar"],
  Noida: ["Sector 62", "Sector 18", "Sector 125", "Sector 63", "Sector 135"],
  Gurugram: ["Cyber City", "Sohna Road", "MG Road", "Golf Course Road", "Udyog Vihar"],
  Chandigarh: ["Sector 17", "Sector 34", "IT Park", "Industrial Area Phase 1"],
  Indore: ["Vijay Nagar", "Palasia", "Sapna Sangeeta", "AB Road"],
  Kochi: ["Infopark", "Kakkanad", "Marine Drive", "Edappally"],
  Coimbatore: ["RS Puram", "Gandhipuram", "Peelamedu", "Saravanampatti"],
  Nagpur: ["Sitabuldi", "Dharampeth", "Sadar", "Civil Lines"],
  Bhopal: ["MP Nagar", "Arera Colony", "New Market", "Hoshangabad Road"],
  Visakhapatnam: ["MVP Colony", "Dwaraka Nagar", "Gajuwaka", "Madhurawada"],
  Thiruvananthapuram: ["Technopark", "Kazhakkoottam", "Vazhuthacaud", "Pattom"],
};

const ROLES_AND_SKILLS: { name: string; category: string; skills: string[] }[] = [
  {
    name: "Software Developer",
    category: "IT / Software",
    skills: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "SQL", "Git", "Docker", "AWS"],
  },
  {
    name: "Frontend Developer",
    category: "IT / Software",
    skills: ["HTML", "CSS", "JavaScript", "React", "Vue.js", "Angular", "Tailwind CSS", "TypeScript", "Figma"],
  },
  {
    name: "Backend Developer",
    category: "IT / Software",
    skills: ["Node.js", "Python", "Java", "Go", "PostgreSQL", "MongoDB", "Redis", "REST API", "GraphQL"],
  },
  {
    name: "Full Stack Developer",
    category: "IT / Software",
    skills: ["JavaScript", "React", "Node.js", "Express", "MongoDB", "PostgreSQL", "TypeScript", "Docker", "AWS"],
  },
  {
    name: "Data Analyst",
    category: "Data / Analytics",
    skills: ["SQL", "Python", "Excel", "Tableau", "Power BI", "Statistics", "R", "Data Visualization"],
  },
  {
    name: "Data Scientist",
    category: "Data / Analytics",
    skills: ["Python", "Machine Learning", "TensorFlow", "Pandas", "NumPy", "SQL", "Deep Learning", "NLP"],
  },
  {
    name: "DevOps Engineer",
    category: "IT / Software",
    skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform", "Jenkins", "Ansible", "Monitoring"],
  },
  {
    name: "UI/UX Designer",
    category: "Design",
    skills: ["Figma", "Adobe XD", "Sketch", "Wireframing", "Prototyping", "User Research", "Design Systems"],
  },
  {
    name: "Mobile Developer",
    category: "IT / Software",
    skills: ["React Native", "Flutter", "Swift", "Kotlin", "Android", "iOS", "Firebase"],
  },
  {
    name: "QA Engineer",
    category: "IT / Software",
    skills: ["Selenium", "Cypress", "Jest", "Manual Testing", "API Testing", "Postman", "JIRA"],
  },
  {
    name: "Product Manager",
    category: "Management",
    skills: ["Agile", "Scrum", "JIRA", "Roadmapping", "Stakeholder Management", "Analytics", "PRD Writing"],
  },
  {
    name: "Digital Marketing",
    category: "Marketing",
    skills: ["SEO", "Google Ads", "Social Media Marketing", "Content Writing", "Email Marketing", "Analytics"],
  },
  {
    name: "HR / Recruiter",
    category: "Human Resources",
    skills: ["Recruitment", "Screening", "Onboarding", "HRIS", "Labor Law", "Employee Engagement"],
  },
  {
    name: "Business Analyst",
    category: "Management",
    skills: ["Requirements Gathering", "SQL", "JIRA", "Stakeholder Communication", "Data Analysis", "Documentation"],
  },
  {
    name: "Cloud Engineer",
    category: "IT / Software",
    skills: ["AWS", "Azure", "GCP", "Terraform", "CloudFormation", "Networking", "Security", "Serverless"],
  },
  {
    name: "Cybersecurity Analyst",
    category: "IT / Software",
    skills: ["Network Security", "Penetration Testing", "SIEM", "Firewall", "Incident Response", "Compliance"],
  },
  {
    name: "Content Writer",
    category: "Marketing",
    skills: ["Copywriting", "SEO Writing", "Blog Writing", "Social Media", "Editing", "Research"],
  },
  {
    name: "Sales Executive",
    category: "Sales",
    skills: ["CRM", "Lead Generation", "Negotiation", "Cold Calling", "Salesforce", "Client Relations"],
  },
  {
    name: "Accountant",
    category: "Finance",
    skills: ["Tally", "GST", "Income Tax", "Financial Reporting", "Excel", "Auditing"],
  },
  {
    name: "Customer Support",
    category: "Support",
    skills: ["Communication", "Ticketing Systems", "CRM", "Problem Solving", "Chat Support", "Email Support"],
  },
];

// ─── Sample Jobs ─────────────────────────────────────────────

const SAMPLE_COMPANIES = [
  { name: "TCS", logo: null },
  { name: "Infosys", logo: null },
  { name: "Wipro", logo: null },
  { name: "HCL Technologies", logo: null },
  { name: "Tech Mahindra", logo: null },
  { name: "Flipkart", logo: null },
  { name: "Razorpay", logo: null },
  { name: "Zerodha", logo: null },
  { name: "CRED", logo: null },
  { name: "Swiggy", logo: null },
  { name: "Zomato", logo: null },
  { name: "PhonePe", logo: null },
  { name: "Paytm", logo: null },
  { name: "Dream11", logo: null },
  { name: "Freshworks", logo: null },
];

const SAMPLE_JOBS = [
  {
    title: "Senior React Developer",
    roleIdx: 1, // Frontend Developer
    companyIdx: 5, // Flipkart
    cityIdx: 2, // Bangalore
    locationType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 1500000,
    salaryMax: 2500000,
    experienceMinYears: 3,
    experienceMaxYears: 6,
    minEducation: "GRADUATE",
    vacancies: 3,
    isFeatured: true,
    description: "We are looking for a Senior React Developer to join our frontend team. You will build and maintain our customer-facing web applications, work with designers to implement pixel-perfect UIs, and mentor junior developers.",
    requirements: "3+ years of experience with React.js, Strong understanding of JavaScript/TypeScript, Experience with state management (Redux/Context), Knowledge of RESTful APIs, Good understanding of web performance optimization",
    skillIdxs: [0, 1, 2, 3, 6, 7], // HTML, CSS, JS, React, Tailwind, TypeScript
  },
  {
    title: "Backend Engineer - Node.js",
    roleIdx: 2, // Backend Developer
    companyIdx: 6, // Razorpay
    cityIdx: 2, // Bangalore
    locationType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 1800000,
    salaryMax: 3000000,
    experienceMinYears: 2,
    experienceMaxYears: 5,
    minEducation: "GRADUATE",
    vacancies: 2,
    isFeatured: true,
    description: "Join our payment infrastructure team to build scalable and reliable backend services. You will work on high-throughput systems handling millions of transactions daily.",
    requirements: "2+ years in Node.js/Python backend development, Experience with PostgreSQL/MongoDB, Understanding of distributed systems, Knowledge of Docker and CI/CD, Strong problem-solving skills",
    skillIdxs: [0, 1, 4, 5, 7], // Node, Python, PostgreSQL, MongoDB, REST API
  },
  {
    title: "Full Stack Developer",
    roleIdx: 3, // Full Stack
    companyIdx: 8, // CRED
    cityIdx: 2, // Bangalore
    locationType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 1200000,
    salaryMax: 2000000,
    experienceMinYears: 1,
    experienceMaxYears: 4,
    minEducation: "GRADUATE",
    vacancies: 5,
    isFeatured: false,
    description: "We are looking for Full Stack Developers to build internal tools and consumer products. You will work across the entire stack, from database design to frontend implementation.",
    requirements: "1+ years of full-stack experience, Proficiency in JavaScript/TypeScript and React, Node.js backend experience, Database design skills (SQL or NoSQL), Comfortable with Git and agile workflows",
    skillIdxs: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    title: "Data Analyst",
    roleIdx: 4, // Data Analyst
    companyIdx: 10, // Zomato
    cityIdx: 11, // Gurugram
    locationType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 800000,
    salaryMax: 1400000,
    experienceMinYears: 1,
    experienceMaxYears: 3,
    minEducation: "GRADUATE",
    vacancies: 2,
    isFeatured: false,
    description: "Analyze user behavior data to improve restaurant recommendations and delivery efficiency. Build dashboards and reports for business stakeholders.",
    requirements: "Strong SQL skills, Python experience for data analysis, Experience with BI tools (Tableau/Power BI), Statistics knowledge, Communication skills for presenting insights",
    skillIdxs: [0, 1, 2, 3, 4, 5],
  },
  {
    title: "Senior Data Scientist",
    roleIdx: 5, // Data Scientist
    companyIdx: 9, // Swiggy
    cityIdx: 2, // Bangalore
    locationType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 2500000,
    salaryMax: 4000000,
    experienceMinYears: 4,
    experienceMaxYears: 8,
    minEducation: "POST_GRADUATE",
    vacancies: 1,
    isFeatured: true,
    description: "Lead ML projects for delivery optimization and demand prediction. Build and deploy production ML models at scale.",
    requirements: "4+ years in data science/ML, Strong Python skills, Experience with TensorFlow/PyTorch, PhD/Master's preferred, Experience deploying ML models in production",
    skillIdxs: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    title: "DevOps Engineer",
    roleIdx: 6, // DevOps
    companyIdx: 11, // PhonePe
    cityIdx: 2, // Bangalore
    locationType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 1600000,
    salaryMax: 2800000,
    experienceMinYears: 3,
    experienceMaxYears: 6,
    minEducation: "GRADUATE",
    vacancies: 2,
    isFeatured: false,
    description: "Manage our cloud infrastructure and CI/CD pipelines. Ensure high availability and performance of our payment platform serving millions of users.",
    requirements: "3+ years DevOps experience, Strong AWS/GCP knowledge, Kubernetes and Docker expertise, Terraform for IaC, Monitoring and alerting experience",
    skillIdxs: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  {
    title: "UI/UX Designer",
    roleIdx: 7, // UI/UX
    companyIdx: 8, // CRED
    cityIdx: 2, // Bangalore
    locationType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 1000000,
    salaryMax: 2000000,
    experienceMinYears: 2,
    experienceMaxYears: 5,
    minEducation: "GRADUATE",
    vacancies: 1,
    isFeatured: true,
    description: "Design beautiful, intuitive interfaces for our fintech products. Work closely with product managers and engineers to create world-class user experiences.",
    requirements: "2+ years UI/UX experience, Expert in Figma, Strong portfolio showing mobile and web design, Understanding of design systems, User research experience is a plus",
    skillIdxs: [0, 1, 2, 3, 4, 5],
  },
  {
    title: "React Native Developer",
    roleIdx: 8, // Mobile
    companyIdx: 12, // Paytm
    cityIdx: 10, // Noida
    locationType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 1200000,
    salaryMax: 2200000,
    experienceMinYears: 2,
    experienceMaxYears: 5,
    minEducation: "GRADUATE",
    vacancies: 3,
    isFeatured: false,
    description: "Build and maintain our React Native mobile applications. Work on payment features, QR scanning, and merchant tools used by millions.",
    requirements: "2+ years React Native experience, Strong JavaScript/TypeScript skills, Experience with native modules, Understanding of mobile app architecture, Published apps on Play Store/App Store",
    skillIdxs: [0, 1, 5, 6],
  },
  {
    title: "QA Automation Engineer",
    roleIdx: 9, // QA
    companyIdx: 0, // TCS
    cityIdx: 0, // Mumbai
    locationType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 600000,
    salaryMax: 1200000,
    experienceMinYears: 1,
    experienceMaxYears: 4,
    minEducation: "GRADUATE",
    vacancies: 5,
    isFeatured: false,
    description: "Automate testing for enterprise client applications. Create and maintain test suites, perform regression testing, and ensure quality standards.",
    requirements: "1+ years QA experience, Selenium/Cypress proficiency, API testing with Postman, Understanding of CI/CD, Good analytical and documentation skills",
    skillIdxs: [0, 1, 2, 3, 4, 5],
  },
  {
    title: "Associate Product Manager",
    roleIdx: 10, // Product Manager
    companyIdx: 13, // Dream11
    cityIdx: 0, // Mumbai
    locationType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 1500000,
    salaryMax: 2500000,
    experienceMinYears: 2,
    experienceMaxYears: 4,
    minEducation: "GRADUATE",
    vacancies: 1,
    isFeatured: false,
    description: "Drive product features for our fantasy sports platform. Work with engineering, design, and business teams to define, build, and launch new features.",
    requirements: "2+ years product management experience, Analytical mindset with data-driven decisions, Experience with agile methodology, Strong communication and presentation skills, Tech background is a plus",
    skillIdxs: [0, 1, 2, 3, 4, 5],
  },
  {
    title: "Digital Marketing Manager",
    roleIdx: 11, // Digital Marketing
    companyIdx: 10, // Zomato
    cityIdx: 11, // Gurugram
    locationType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 1000000,
    salaryMax: 1800000,
    experienceMinYears: 3,
    experienceMaxYears: 6,
    minEducation: "GRADUATE",
    vacancies: 1,
    isFeatured: false,
    description: "Lead digital marketing campaigns for our food delivery platform. Manage SEO, SEM, social media, and email marketing to drive user acquisition.",
    requirements: "3+ years digital marketing experience, Expertise in Google Ads and social media advertising, SEO knowledge, Analytics and reporting skills, Creative content ideation",
    skillIdxs: [0, 1, 2, 3, 4, 5],
  },
  {
    title: "HR Recruiter - Tech",
    roleIdx: 12, // HR
    companyIdx: 1, // Infosys
    cityIdx: 6, // Pune
    locationType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 500000,
    salaryMax: 900000,
    experienceMinYears: 1,
    experienceMaxYears: 3,
    minEducation: "GRADUATE",
    vacancies: 4,
    isFeatured: false,
    description: "Recruit top tech talent for our engineering teams. Manage end-to-end recruitment process from sourcing to offer management.",
    requirements: "1+ years tech recruitment experience, Understanding of tech roles and skills, Experience with ATS systems, Strong communication skills, Ability to manage multiple openings",
    skillIdxs: [0, 1, 2, 3, 4],
  },
  {
    title: "Business Analyst - Fintech",
    roleIdx: 13, // BA
    companyIdx: 7, // Zerodha
    cityIdx: 2, // Bangalore
    locationType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 1000000,
    salaryMax: 1800000,
    experienceMinYears: 2,
    experienceMaxYears: 5,
    minEducation: "GRADUATE",
    vacancies: 2,
    isFeatured: false,
    description: "Bridge business requirements and technology for our stock trading platform. Analyze business processes and translate them into clear technical specifications.",
    requirements: "2+ years BA experience, Strong SQL skills, Understanding of financial markets is a plus, Experience with JIRA and Confluence, Good stakeholder management",
    skillIdxs: [0, 1, 2, 3, 4, 5],
  },
  {
    title: "Cloud Solutions Architect",
    roleIdx: 14, // Cloud
    companyIdx: 3, // HCL
    cityIdx: 10, // Noida
    locationType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 2500000,
    salaryMax: 4500000,
    experienceMinYears: 5,
    experienceMaxYears: 10,
    minEducation: "GRADUATE",
    vacancies: 1,
    isFeatured: true,
    description: "Design and implement cloud solutions for enterprise clients. Lead cloud migration projects and architect multi-cloud environments.",
    requirements: "5+ years cloud experience, AWS/Azure certifications preferred, Strong architecture skills, Experience with hybrid cloud, Leadership experience",
    skillIdxs: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    title: "Junior Software Developer",
    roleIdx: 0, // Software Developer
    companyIdx: 2, // Wipro
    cityIdx: 3, // Hyderabad
    locationType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 400000,
    salaryMax: 700000,
    experienceMinYears: 0,
    experienceMaxYears: 1,
    minEducation: "GRADUATE",
    vacancies: 10,
    isFeatured: false,
    description: "Start your software development career with us. Learn from experienced engineers while contributing to real-world projects for global clients.",
    requirements: "B.Tech/B.E in CS or related field, Basic programming knowledge in any language, Understanding of data structures and algorithms, Eagerness to learn, Good communication skills",
    skillIdxs: [0, 1, 4, 5, 7],
  },
  {
    title: "Content Writer - Tech Blog",
    roleIdx: 16, // Content Writer
    companyIdx: 14, // Freshworks
    cityIdx: 4, // Chennai
    locationType: "REMOTE",
    employmentType: "FULL_TIME",
    salaryMin: 500000,
    salaryMax: 900000,
    experienceMinYears: 1,
    experienceMaxYears: 3,
    minEducation: "GRADUATE",
    vacancies: 2,
    isFeatured: false,
    description: "Write engaging technical content for our SaaS product blogs. Create tutorials, product guides, and thought leadership articles.",
    requirements: "1+ years content writing experience, Technical understanding preferred, SEO writing skills, Portfolio of published articles, Ability to simplify complex topics",
    skillIdxs: [0, 1, 2, 3, 4, 5],
  },
  {
    title: "Sales Executive - SaaS",
    roleIdx: 17, // Sales
    companyIdx: 14, // Freshworks
    cityIdx: 4, // Chennai
    locationType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 600000,
    salaryMax: 1200000,
    experienceMinYears: 1,
    experienceMaxYears: 4,
    minEducation: "GRADUATE",
    vacancies: 5,
    isFeatured: false,
    description: "Drive SaaS product sales to SMB and mid-market customers. Manage the full sales cycle from prospecting to closing deals.",
    requirements: "1+ years B2B sales experience, Excellent communication skills, CRM experience (Salesforce preferred), Target-driven mindset, Understanding of SaaS business model",
    skillIdxs: [0, 1, 2, 3, 4, 5],
  },
  {
    title: "Accounts Executive",
    roleIdx: 18, // Accountant
    companyIdx: 4, // Tech Mahindra
    cityIdx: 6, // Pune
    locationType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 400000,
    salaryMax: 700000,
    experienceMinYears: 1,
    experienceMaxYears: 3,
    minEducation: "GRADUATE",
    vacancies: 3,
    isFeatured: false,
    description: "Handle accounts payable/receivable, manage GST compliance, and prepare financial reports for our corporate finance team.",
    requirements: "B.Com/M.Com or CA Inter, Tally and Excel proficiency, GST and tax knowledge, Attention to detail, 1+ years accounting experience",
    skillIdxs: [0, 1, 2, 3, 4, 5],
  },
  {
    title: "Customer Support Specialist",
    roleIdx: 19, // Customer Support
    companyIdx: 9, // Swiggy
    cityIdx: 2, // Bangalore
    locationType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 300000,
    salaryMax: 500000,
    experienceMinYears: 0,
    experienceMaxYears: 2,
    minEducation: "PASS_12TH",
    vacancies: 15,
    isFeatured: false,
    description: "Provide excellent customer support for our food delivery platform. Resolve customer queries, handle complaints, and ensure customer satisfaction.",
    requirements: "Good communication in English and Hindi, Basic computer skills, Customer-first attitude, Ability to handle pressure, Flexible shift timings",
    skillIdxs: [0, 1, 2, 3, 4, 5],
  },
  {
    title: "Cybersecurity Analyst",
    roleIdx: 15, // Cybersecurity
    companyIdx: 6, // Razorpay
    cityIdx: 2, // Bangalore
    locationType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 1400000,
    salaryMax: 2600000,
    experienceMinYears: 2,
    experienceMaxYears: 5,
    minEducation: "GRADUATE",
    vacancies: 2,
    isFeatured: false,
    description: "Protect our payment infrastructure from threats. Conduct vulnerability assessments, monitor security incidents, and implement security policies.",
    requirements: "2+ years cybersecurity experience, Familiarity with OWASP, SIEM tools experience, Knowledge of network security, Certifications like CEH/CISSP preferred",
    skillIdxs: [0, 1, 2, 3, 4, 5],
  },
  {
    title: "Flutter Developer",
    roleIdx: 8, // Mobile
    companyIdx: 10, // Zomato
    cityIdx: 11, // Gurugram
    locationType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 1000000,
    salaryMax: 1800000,
    experienceMinYears: 1,
    experienceMaxYears: 4,
    minEducation: "GRADUATE",
    vacancies: 2,
    isFeatured: false,
    description: "Build cross-platform mobile apps using Flutter for our food delivery ecosystem. Work on consumer and partner apps.",
    requirements: "1+ years Flutter development, Dart proficiency, Understanding of mobile architectures, Experience with REST APIs, Play Store/App Store publishing",
    skillIdxs: [1, 6],
  },
  {
    title: "Python Developer - Internship",
    roleIdx: 0, // Software Developer
    companyIdx: 1, // Infosys
    cityIdx: 6, // Pune
    locationType: "ONSITE",
    employmentType: "INTERNSHIP",
    salaryMin: 15000,
    salaryMax: 25000,
    experienceMinYears: 0,
    experienceMaxYears: 0,
    minEducation: "GRADUATE",
    vacancies: 10,
    isFeatured: false,
    description: "6-month internship for fresh graduates. Learn Python development, work on real projects, and get mentored by senior engineers. Potential for full-time conversion.",
    requirements: "Final year or recent graduate in CS/IT, Basic Python knowledge, Understanding of data structures, Willingness to learn, Available for 6 months full-time",
    skillIdxs: [4],
  },
  {
    title: "Senior Java Developer",
    roleIdx: 0, // Software Developer
    companyIdx: 0, // TCS
    cityIdx: 0, // Mumbai
    locationType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 1800000,
    salaryMax: 3200000,
    experienceMinYears: 5,
    experienceMaxYears: 8,
    minEducation: "GRADUATE",
    vacancies: 2,
    isFeatured: true,
    description: "Lead Java microservices development for a major banking client. Design and implement high-performance, scalable enterprise solutions.",
    requirements: "5+ years Java experience, Spring Boot expertise, Microservices architecture, Experience with Kafka/RabbitMQ, Oracle/PostgreSQL, Strong system design skills",
    skillIdxs: [3, 5, 6, 7],
  },
  {
    title: "Product Designer (Remote)",
    roleIdx: 7, // UI/UX
    companyIdx: 7, // Zerodha
    cityIdx: 2, // Bangalore
    locationType: "REMOTE",
    employmentType: "FULL_TIME",
    salaryMin: 1500000,
    salaryMax: 2800000,
    experienceMinYears: 3,
    experienceMaxYears: 7,
    minEducation: "GRADUATE",
    vacancies: 1,
    isFeatured: true,
    description: "Design simple yet powerful trading interfaces. We believe in minimalism and user-centric design. Remote-first role.",
    requirements: "3+ years product design experience, Expert in Figma, Strong portfolio, Understanding of financial products, Experience with design systems and component libraries",
    skillIdxs: [0, 1, 3, 4, 5, 6],
  },
  {
    title: "Freelance Graphic Designer",
    roleIdx: 7, // UI/UX
    companyIdx: 13, // Dream11
    cityIdx: 0, // Mumbai
    locationType: "REMOTE",
    employmentType: "FREELANCE",
    salaryMin: 50000,
    salaryMax: 100000,
    experienceMinYears: 1,
    experienceMaxYears: 5,
    minEducation: "DIPLOMA",
    vacancies: 3,
    isFeatured: false,
    description: "Create engaging social media graphics, banners, and promotional material for our fantasy sports platform. Project-based engagement.",
    requirements: "Graphic design portfolio, Adobe Creative Suite proficiency, Understanding of social media design, Quick turnaround ability, Sports interest is a bonus",
    skillIdxs: [0, 1, 2],
  },
];

async function seed() {
  console.log("🌱 Starting seed...\n");

  // 1. Insert cities
  console.log("Inserting cities...");
  const insertedCities = await db
    .insert(cities)
    .values(CITIES_DATA)
    .returning();
  console.log(`  ✓ ${insertedCities.length} cities inserted`);

  // 2. Insert localities per city
  console.log("Inserting localities...");
  let totalLocalities = 0;
  for (const city of insertedCities) {
    const localityNames = LOCALITIES_MAP[city.name];
    if (localityNames) {
      await db
        .insert(localities)
        .values(localityNames.map((name) => ({ cityId: city.id, name })));
      totalLocalities += localityNames.length;
    }
  }
  console.log(`  ✓ ${totalLocalities} localities inserted`);

  // 3. Insert job roles and skills
  console.log("Inserting job roles and skills...");
  const roleIdMap: number[] = [];
  const roleSkillIdMap: number[][] = [];

  for (const role of ROLES_AND_SKILLS) {
    const [insertedRole] = await db
      .insert(jobRoles)
      .values({ name: role.name, category: role.category })
      .returning();
    roleIdMap.push(insertedRole.id);

    const insertedSkills = await db
      .insert(skills)
      .values(role.skills.map((name) => ({ roleId: insertedRole.id, name })))
      .returning();
    roleSkillIdMap.push(insertedSkills.map((s) => s.id));
  }
  console.log(
    `  ✓ ${ROLES_AND_SKILLS.length} job roles and ${ROLES_AND_SKILLS.reduce((s, r) => s + r.skills.length, 0)} skills inserted`,
  );

  // 4. Insert sample jobs
  console.log("Inserting sample jobs...");
  for (const job of SAMPLE_JOBS) {
    const cityId = insertedCities[job.cityIdx].id;
    const company = SAMPLE_COMPANIES[job.companyIdx].name;

    const [insertedJob] = await db
      .insert(jobs)
      .values({
        title: job.title,
        company,
        companyLogo: null,
        description: job.description,
        requirements: job.requirements,
        cityId,
        locationType: job.locationType,
        employmentType: job.employmentType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        isSalaryDisclosed: true,
        experienceMinYears: job.experienceMinYears,
        experienceMaxYears: job.experienceMaxYears,
        minEducation: job.minEducation,
        vacancies: job.vacancies,
        isFeatured: job.isFeatured,
        isActive: true,
      })
      .returning();

    // Insert job skills from the role's skill set
    const roleSkillIds = roleSkillIdMap[job.roleIdx];
    if (roleSkillIds && job.skillIdxs.length > 0) {
      const jobSkillValues = job.skillIdxs
        .filter((idx) => idx < roleSkillIds.length)
        .map((idx) => ({
          jobId: insertedJob.id,
          skillId: roleSkillIds[idx],
        }));
      if (jobSkillValues.length > 0) {
        await db.insert(jobSkills).values(jobSkillValues);
      }
    }
  }
  console.log(`  ✓ ${SAMPLE_JOBS.length} sample jobs inserted`);

  console.log("\n✅ Seed completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
