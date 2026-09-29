/* Elevate Her · Illumination site config (starter).
   Copy this template with new-site.sh, then replace every value below.
   Photos and videos come from the Madi Visuals dashboard: set media.slug to the
   player's slug in the dashboard. Files in media/ are only a fallback.
   Keep visible text free of hyphens and dashes. */
window.SITE = {
  player: {
    first: "First",
    last: "Last",
    number: "0",
    position: "Guard",
    school: "School Name High School",
    schoolShort: "School HS",
    location: "City, ST",
    classYear: "2028",
    height: "5'8\"",
    team: "School Mascot Basketball",
    program: "Mascot Basketball"
  },

  /* School colors. accent is the main color, accent2 a lighter version for text on dark. */
  theme: { accent: "#e31b23", accent2: "#ff5a61", glow: "rgba(227, 27, 35, 0.4)" },

  /* Linked to the Madi Visuals dashboard for every Illumination build. */
  media: {
    dashboard: "https://madivisuals.netlify.app",
    slug: "first-last"
  },

  bio: "One or two sentences about who she is as a player and what makes her stand out.",

  stats: {
    seasonLabel: "Sophomore",
    total: { v: "0", text: "total points scored this season." },
    averages: [
      { v: "0.0", l: "Points", hot: true, count: true },
      { v: "0.0", l: "Rebounds", count: true },
      { v: "0.0", l: "Steals", count: true },
      { v: "0.0", l: "Assists", count: true },
      { v: "0.0", l: "Blocks", count: true }
    ],
    /* Leave a season blank ("") to show Upcoming. */
    table: {
      columns: ["Freshman", "Sophomore", "Junior", "Senior"],
      rows: [
        ["Points", "", "", "", ""],
        ["Rebounds", "", "", "", ""],
        ["Steals", "", "", "", ""],
        ["Assists", "", "", "", ""],
        ["Blocks", "", "", "", ""]
      ]
    },
    /* Optional shooting splits. Delete this block to hide it. */
    splits: {
      title: "Shooting splits",
      source: "Source: Hudl",
      tiles: [
        { v: "0", l: "Points", hot: true },
        { v: "0.0", l: "Points per game" }
      ],
      meters: [
        { pct: "0", made: 0, att: 0, label: "Field goals" },
        { pct: "0", made: 0, att: 0, label: "Three pointers" },
        { pct: "0", made: 0, att: 0, label: "Free throws" }
      ]
    }
  },

  testingNote: "Testing numbers post here as soon as they are recorded.",
  /* Leave v out to show Pending. */
  measurables: [
    { k: "Height", v: "5'8\"" },
    { k: "Weight" },
    { k: "Standing reach" },
    { k: "Wingspan" },
    { k: "Shoe size" }
  ],
  testing: [
    { k: "Standing vertical" },
    { k: "Max vertical" },
    { k: "Bench / Dead / Squat" },
    { k: "Lane agility" },
    { k: "Shuttle run" },
    { k: "Three quarter sprint" }
  ],
  academics: [
    { k: "GPA", v: "On request", pending: true },
    { k: "SAT", v: "On request", pending: true },
    { k: "ACT", v: "On request", pending: true },
    { k: "Dual enrollment", v: "On request", pending: true },
    { k: "NCAA ID", v: "On request", pending: true },
    { k: "Current offers", v: "On request", pending: true }
  ],
  academicsNote: "College coaches can request transcripts and academic details through the contact request below.",

  film: {
    /* Leave url empty to show "Link coming soon". */
    links: [
      { name: "Hudl", desc: "Full game film and highlights", url: "" },
      { name: "Field Level", desc: "Recruiting profile", url: "" },
      { name: "MaxPreps", desc: "Box scores and season stats", url: "" },
      { name: "YouTube", desc: "Highlights and game film", url: "" }
    ]
  },

  schedule: {
    title: "Season Schedule",
    note: "Times and locations can change, so check with the school before you travel.",
    /* { date: "2026-11-16", opp: "Opponent", loc: "Home" | "Away" | "TBD", time: "7:30 PM", note: "JV 6:00", tag: "Senior Night", result: "W 54 41" } */
    games: []
  },

  /* { kind: "Scouting report", title: "...", source: "...", date: "2026-12-05", excerpt: "...", url: "https://..." }
     or use body: ["Paragraph one.", "Paragraph two."] instead of url to show the full writeup on the site. */
  writeups: [],

  nil: {
    intro: "She is open to NIL partnerships with local businesses and brands that share her values. Every opportunity is reviewed with her family.",
    why: [
      { v: "#0", l: "Position and team" },
      { v: "0.0", l: "Headline stat" },
      { v: "0 yrs", l: "Of high school runway ahead" },
      { v: "Hometown", l: "Rooted in the community" }
    ],
    offers: [
      { icon: "social", title: "Social content", text: "Sponsored posts, reels and stories featuring your product or business." },
      { icon: "business", title: "Local business ads", text: "Print, digital and in store campaigns using licensed NIL ready photos." },
      { icon: "appearance", title: "Appearances", text: "Grand openings, community events, autograph sessions and meet and greets." },
      { icon: "camp", title: "Camps and clinics", text: "Youth skills camps and guest coaching for younger players." },
      { icon: "product", title: "Product partners", text: "Gear, apparel, nutrition and training products she actually uses." },
      { icon: "cause", title: "Community causes", text: "Charity drives and nonprofit campaigns that give back locally." }
    ],
    rules: [
      "Send an inquiry with the opportunity, dates and compensation.",
      "Every inquiry is reviewed with her family, who make the final decision.",
      "A simple written agreement is signed by a parent or guardian before any content goes live.",
      "Partners receive licensed photos from the Photo Vault below for the agreed campaign.",
      "Following state association rules, partner content may not use school names, logos, uniforms or facilities, and deals cannot be tied to recruiting or athletic performance."
    ]
  },

  /* Contact details are never published. Requests go to this email for approval. */
  contact: {
    approver: "Her coach",
    email: "coachthaynes@gmail.com",
    people: [
      { role: "Player", who: "First Last", detail: "Phone and email on request" },
      { role: "Parent or guardian", who: "Last Family", detail: "Phone on request" },
      { role: "Head Coach", who: "Coach Name", detail: "Phone and email on request" }
    ]
  },

  /* Fallback photos in media/photos/ until Madi uploads to the dashboard. */
  photos: []
};
