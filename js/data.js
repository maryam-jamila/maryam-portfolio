/* ==========================================================================
   MARYAM JAMILA — PORTFOLIO — DEFAULT CONTENT DATA
   --------------------------------------------------------------------------
   This file is the site's original/default content and offline backup.
   The live site reads the published portfolio from Supabase through
   js/store.js. The Admin Panel saves approved changes back to Supabase.

   Keep this file as a backup. The backend/seed-portfolio.sql file contains
   the current contents of this dataset for the initial Supabase seed.

   Fields left as empty strings / empty arrays are intentionally blank —
   the site will visibly show "Add via Admin Panel" placeholders for them
   so they are easy to find and replace. No invented awards, clients,
   ratings, or statistics are included anywhere in this file.
   ========================================================================== */

const DEFAULT_DATA = {

  /* ---------------------------------------------------------------- */
  /* PERSONAL INFORMATION                                              */
  /* ---------------------------------------------------------------- */
  personal: {
    name: "Maryam Jamila",
    title: "Software Engineering Graduate • Graphic Designer • UI/UX & Creative Technologist",
    roles: [
      "Software Engineering Graduate",
      "Graphic Designer",
      "UI/UX & Creative Technologist"
    ],
    tagline: "Designing meaningful digital experiences through creativity and technology.",
    shortIntro: "I am a Software Engineering graduate from Fatima Jinnah Women University, Rawalpindi, with a passion for creating visually engaging designs and meaningful digital experiences. My academic journey allowed me to work on software applications, UI/UX concepts, and AI-powered solutions, while my professional experience has helped me develop practical skills in graphic design, branding, and social media design.",
    aboutHeading: "Software engineer by training, designer by instinct.",
    aboutSubtext: "A closer look at my background, the path that shaped it, and the skills I bring to both sides of my work.",
    aboutLead: "I graduated in Software Engineering from Fatima Jinnah Women University, Rawalpindi — and somewhere along the way, technology and visual creativity stopped feeling like two separate paths.",
    aboutParagraphs: [
      "During my academic journey, I developed an interest in both technology and visual creativity. This led me to explore application development, UI/UX design, graphic design, branding, and AI-powered solutions.",
      "During my degree, I designed and developed several applications, including a Skill Swap application and a Faculty Information Management application. My Final Year Project, VegCross, allowed me to combine software engineering and artificial intelligence — I developed an application that integrates an AI model to suggest the optimal stage for crossing in tomato plants, applying technology to a real-world agricultural problem.",
      "Alongside software development, I developed my passion for graphic design and visual communication. I have worked professionally as a Graphic Designer Intern at CodeCelix, where I worked on social media post designs and visual content, and I am currently completing an internship at Elite Edge Outsourcing, where I have worked on brand identities, logos, and social media posts.",
      "I have also been part of GDG FJWU, where I participated in event management and delivered a few sessions — an experience that helped me strengthen my communication, teamwork, presentation, and leadership skills."
    ],
    focusChips: [
      "Software Engineering",
      "UI/UX Design",
      "Graphic Design & Branding",
      "AI-Powered Applications"
    ],
    brandStatement: "I enjoy working in the space where creativity and technology overlap — building things that are as thoughtful in how they look as in how they work.",
    photo: "" /* base64 or URL — empty shows the placeholder avatar */
  },

  /* ---------------------------------------------------------------- */
  /* SKILLS — grouped under the six required categories                */
  /* ---------------------------------------------------------------- */
  skills: {
    "Graphic Design": [
      { name: "Graphic Design", description: "Visual design across print and digital, built around clarity and intent." },
      { name: "Social Media Design", description: "Scroll-stopping visual content built for platform and audience." }
    ],
    "Branding": [
      { name: "Brand Identity Design", description: "Cohesive visual systems that give a brand a consistent voice." },
      { name: "Logo Design", description: "Distinct marks distilled from a brand's story into a single symbol." }
    ],
    "UI/UX": [
      { name: "UI/UX Design", description: "Interfaces shaped by how people actually think, move, and decide." }
    ],
    "Software Development": [
      { name: "Front-End / Application Development", description: "Turning interfaces and concepts into working, responsive software." }
    ],
    "AI": [
      { name: "AI-Powered Application Development", description: "Integrating intelligent models into practical, purpose-built tools." }
    ],
    "Professional Skills": [
      { name: "Creative Problem Solving", description: "Approaching technical and visual challenges from unexpected angles." },
      { name: "Communication", description: "" },
      { name: "Presentation", description: "" },
      { name: "Teamwork", description: "" },
      { name: "Event Management", description: "" }
    ]
  },

  /* ---------------------------------------------------------------- */
  /* PORTFOLIO PROJECTS                                                */
  /* categories: Graphic Design | Branding & Identity |                */
  /*             UI/UX & Applications | AI & Software |                */
  /*             Internship Work                                       */
  /* ---------------------------------------------------------------- */
  projectCategories: [
    "Graphic Design",
    "Branding & Identity",
    "UI/UX & Applications",
    "AI & Software",
    "Internship Work"
  ],

  projects: [
    { id: "sm-posts", category: "Graphic Design", title: "Social Media Posts",
      description: "A collection of social media post designs created for brand pages and campaigns, focused on strong visual hierarchy, readability, and a consistent visual style across a feed.",
      role: "Graphic Designer", tools: [], images: [], featured: false },

    { id: "promo-designs", category: "Graphic Design", title: "Promotional Designs",
      description: "Promotional graphics created to support campaigns, offers, and announcements with clear, attention-grabbing visuals suited to digital platforms.",
      role: "Graphic Designer", tools: [], images: [], featured: false },

    { id: "marketing-graphics", category: "Graphic Design", title: "Marketing Graphics",
      description: "Marketing visuals designed to support brand messaging and communication across digital channels.",
      role: "Graphic Designer", tools: [], images: [], featured: false },

    { id: "visual-content", category: "Graphic Design", title: "Visual Content",
      description: "General visual content designed for digital use, balancing creative expression with brand consistency.",
      role: "Graphic Designer", tools: [], images: [], featured: false },

    { id: "campaign-designs", category: "Graphic Design", title: "Campaign Designs",
      description: "Cohesive visual sets designed around a single campaign theme and carried consistently across multiple pieces.",
      role: "Graphic Designer", tools: [], images: [], featured: false },

    { id: "brand-identity", category: "Branding & Identity", title: "Brand Identity Designs",
      description: "Complete brand identity concepts developed to give a brand a clear, consistent visual language across colour, type, and imagery. Includes work completed during my internship at Elite Edge Outsourcing.",
      role: "Graphic Designer", tools: [], images: [], featured: true },

    { id: "logo-designs", category: "Branding & Identity", title: "Logo Designs",
      description: "Logo design work developed for a range of brand identity projects, including logos designed during my internship at Elite Edge Outsourcing.",
      role: "Graphic Designer", tools: [], images: [], featured: false },

    { id: "brand-guidelines", category: "Branding & Identity", title: "Brand Guidelines",
      description: "Brand guideline documentation outlining how a visual identity should be applied consistently across touchpoints.",
      role: "Graphic Designer", tools: [], images: [], featured: false },

    { id: "identity-systems", category: "Branding & Identity", title: "Visual Identity Systems",
      description: "Extended identity systems built around a core brand, covering colour, type, and supporting visual elements across formats.",
      role: "Graphic Designer", tools: [], images: [], featured: false },

    { id: "branding-mockups", category: "Branding & Identity", title: "Branding Mockups",
      description: "Mockups presenting brand identity designs in realistic, real-world contexts. Includes mockups produced during my internship at Elite Edge Outsourcing.",
      role: "Graphic Designer", tools: [], images: [], featured: false },

    { id: "skill-swap", category: "UI/UX & Applications", title: "Skill Swap App",
      description: "A software application focused on skill sharing and connecting people based on their skills and interests.",
      role: "UI/UX & App Development", tools: [], images: [], featured: true },

    { id: "faculty-app", category: "UI/UX & Applications", title: "Faculty Information Management App",
      description: "An application developed to manage faculty information, including adding, updating, and deleting faculty records.",
      role: "Application Development", tools: [], images: [], featured: true },

    { id: "vegcross", category: "AI & Software", title: "VegCross — AI-Based Vegetable Breeding Application",
      description: "My Final Year Project. An AI-powered application that integrates an AI model to identify and suggest the optimal stage for crossing in tomato plants, supporting the vegetable breeding process.",
      role: "AI Integration & App Development", tools: [], images: [], featured: true },

    { id: "codecelix", category: "Internship Work", title: "CodeCelix — Graphic Designer Intern",
      description: "A 3-month internship at CodeCelix, working as a Graphic Designer on social media posts and visual content for the organization.",
      role: "Graphic Designer Intern", tools: [], images: [], featured: false },

    { id: "eliteedge", category: "Internship Work", title: "Elite Edge Outsourcing — Graphic Designer Intern",
      description: "My current internship at Elite Edge Outsourcing, working on brand identities, logos, and social media post designs.",
      role: "Graphic Designer Intern", tools: [], images: [], featured: false }
  ],

  /* ---------------------------------------------------------------- */
  /* EXPERIENCE                                                        */
  /* ---------------------------------------------------------------- */
  experience: [
    {
      id: "exp-codecelix",
      organization: "CodeCelix",
      position: "Graphic Designer Intern",
      duration: "3 Months",
      tag: "3-Month Internship",
      description: "During my internship at CodeCelix, I worked as a Graphic Designer and designed social media posts and visual content for the organization.",
      skills: ["Social Media Design", "Graphic Design", "Visual Communication", "Creative Content Development"],
      images: []
    },
    {
      id: "exp-eliteedge",
      organization: "Elite Edge Outsourcing",
      position: "Graphic Designer Intern",
      duration: "Current",
      tag: "Current Internship",
      description: "I am currently working as a Graphic Designer Intern at Elite Edge Outsourcing, where I have worked on brand identities, logos, and social media posts.",
      skills: ["Brand Identity Design", "Logo Design", "Social Media Design", "Visual Branding"],
      images: []
    }
  ],

  /* ---------------------------------------------------------------- */
  /* COMMUNITY — GDG FJWU                                              */
  /* ---------------------------------------------------------------- */
  community: {
    name: "GDG FJWU",
    summary: "I have been part of GDG FJWU, where I contributed to event management, participated in community activities, and delivered a few sessions.",
    tags: ["Event Management", "Community Involvement", "Session Delivery", "Teamwork & Leadership"],
    items: [
      /* Each item: { type: "Session" | "Event Participation" | "Management", title, description }
         Empty by default — add real sessions/events via the Admin Panel. */
    ]
  },

  /* ---------------------------------------------------------------- */
  /* CONTACT                                                           */
  /* ---------------------------------------------------------------- */
  contact: {
    email: "",
    linkedin: "",
    behance: "",
    instagram: "",
    github: "",
    extraLinks: [] /* { label, url } — for any future social links */
  },

  /* ---------------------------------------------------------------- */
  /* SITE META                                                         */
  /* ---------------------------------------------------------------- */
  meta: {
    footerNote: "© 2026 Maryam Jamila. All rights reserved."
  }
};

/* Never overwrite this file at runtime — treat as read-only defaults. */
if (typeof window !== "undefined") window.DEFAULT_DATA = DEFAULT_DATA;
