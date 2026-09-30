/* Elevate Her · Illumination site config for Aiyana Haynes.
   Everything on the page comes from this file. Photos and videos come from the
   Madi Visuals dashboard (media.dashboard + media.slug), with files in media/ as a fallback.
   Keep visible text free of hyphens and dashes. */
window.SITE = {
  player: {
    first: "Aiyana",
    last: "Haynes",
    number: "20",
    position: "Guard",
    school: "Middleburg High School",
    schoolShort: "Middleburg HS",
    location: "Middleburg, FL",
    classYear: "2027",
    height: "5'8\"",
    team: "Middleburg Lady Broncos",
    program: "Lady Broncos Basketball"
  },

  theme: { accent: "#e31b23", accent2: "#ff5a61", glow: "rgba(227, 27, 35, 0.4)" },

  media: {
    dashboard: "https://madivisuals.netlify.app",
    slug: "aiyana-haynes"
  },

  bio: "Calm off the court. Relentless on it. A two way guard with a high basketball IQ, Aiyana averaged 12.5 points, 7.6 rebounds and 4.3 steals as a junior and heads into her senior season with 799 career points and college offers from Southwest Arkansas and Taft College.",

  stats: {
    seasonLabel: "Junior",
    total: { v: "799", text: "career points through three varsity seasons." },
    averages: [
      { v: "12.5", l: "Points", hot: true, count: true },
      { v: "7.6", l: "Rebounds", count: true },
      { v: "4.3", l: "Steals", hot: true, count: true },
      { v: "2.6", l: "Assists", count: true },
      { v: "0.9", l: "Blocks", count: true }
    ],
    table: {
      columns: ["Freshman", "Sophomore", "Junior", "Senior"],
      rows: [
        ["Points", "10.5", "16.5", "12.5", ""],
        ["Rebounds", "5.1", "2.6", "7.6", ""],
        ["Steals", "3.2", "1.6", "4.3", ""],
        ["Assists", "1.8", "0.5", "2.6", ""],
        ["Blocks", "0.5", "0.3", "0.9", ""],
        ["Total points", "137", "379", "283", ""]
      ]
    },
    splits: {
      title: "Junior year: first five games",
      source: "Source: Hudl team report",
      tiles: [
        { v: "62", l: "Points", hot: true },
        { v: "12.4", l: "Points per game", hot: true },
        { v: "137", l: "Minutes" },
        { v: "+1", l: "Plus minus" },
        { v: "39.0%", l: "Effective FG" }
      ],
      meters: [
        { pct: "33.9", made: 20, att: 59, label: "Field goals" },
        { pct: "45.2", made: 14, att: 31, label: "Two pointers" },
        { pct: "21.4", made: 6, att: 28, label: "Three pointers" },
        { pct: "80.0", made: 16, att: 20, label: "Free throws" }
      ]
    }
  },

  testingNote: "Testing numbers from her player profile. The rest post here as soon as they are recorded.",
  measurables: [
    { k: "Height", v: "5'8\"" },
    { k: "Wingspan", v: "5'8\"" },
    { k: "Shoe size", v: "11" },
    { k: "Weight", v: "On request", pending: true },
    { k: "Standing reach" }
  ],
  testing: [
    { k: "Standing vertical", v: "18.5\"" },
    { k: "Bench", v: "115 lb" },
    { k: "Max vertical" },
    { k: "Deadlift / Squat" },
    { k: "Lane agility" },
    { k: "Three quarter sprint" }
  ],
  academics: [
    { k: "Offer", v: "Southwest Arkansas" },
    { k: "Offer", v: "Taft College" },
    { k: "GPA", v: "On request", pending: true },
    { k: "NCAA ID", v: "On request", pending: true },
    { k: "SAT", v: "On request", pending: true },
    { k: "ACT", v: "On request", pending: true }
  ],
  academicsNote: "College coaches can request transcripts, her NCAA ID and academic details through the contact request below.",

  film: {
    links: [
      { name: "Hudl", desc: "Full game film and highlights", url: "https://www.hudl.com/profile/20899818/Aiyana-Haynes" },
      { name: "Field Level", desc: "Recruiting profile", url: "https://www.fieldlevel.com/app/profile/aiyana/basketballwomen" },
      { name: "MaxPreps", desc: "Box scores and season stats", url: "https://www.maxpreps.com/fl/middleburg/middleburg-broncos/athletes/aiyana-haynes/?careerid=5d7kddlh57g11" },
      { name: "Prep Girls Hoops", desc: "Scouting profile", url: "https://prepgirlshoops.com/player/aiyana-haynes/" },
      { name: "YouTube", desc: "Highlights and game film", url: "https://www.youtube.com/@AiyanaH.baller27" }
    ]
  },

  schedule: {
    title: "2026/27 Senior Season Schedule",
    note: "Varsity tip times shown. Times and locations can change, so check with the school before you travel.",
    games: [
      { date: "2026-11-12", opp: "Beachside Preseason", loc: "Away", time: "TBD" },
      { date: "2026-11-13", opp: "Beachside Preseason", loc: "Away", time: "TBD" },
      { date: "2026-11-16", opp: "Temple Christian", loc: "Home", time: "6:00 PM", note: "Triple header" },
      { date: "2026-11-18", opp: "Tocoi Creek", loc: "Home", time: "7:30 PM", note: "JV 6:00" },
      { date: "2026-11-20", opp: "Spruce Creek", loc: "Home", time: "7:30 PM", note: "JV 6:00" },
      { date: "2026-11-25", opp: "IE Thanksgiving Tournament", loc: "TBD", time: "TBD", tag: "Tournament" },
      { date: "2026-11-26", opp: "IE Thanksgiving Tournament", loc: "TBD", time: "TBD", tag: "Tournament" },
      { date: "2026-12-01", opp: "Duval Charter", loc: "Home", time: "6:00 PM", note: "Triple header" },
      { date: "2026-12-03", opp: "Beachside", loc: "Away", time: "7:30 PM", note: "JV 6:00" },
      { date: "2026-12-04", opp: "Ridgeview", loc: "Away", time: "6:00 PM" },
      { date: "2026-12-07", opp: "Bolles", loc: "Away", time: "6:00 PM", note: "Varsity only" },
      { date: "2026-12-09", opp: "Episcopal", loc: "Away", time: "7:30 PM", note: "JV 6:00" },
      { date: "2026-12-14", opp: "Clay", loc: "Home", time: "7:30 PM", note: "JV 6:00" },
      { date: "2026-12-16", opp: "Oakleaf", loc: "Away", time: "6:00 PM" },
      { date: "2027-01-05", opp: "Creekside", loc: "Away", time: "6:00 PM", note: "Varsity only" },
      { date: "2027-01-07", opp: "Fleming Island", loc: "Away", time: "6:00 PM", note: "Triple header" },
      { date: "2027-01-08", opp: "Jackson", loc: "Away", time: "6:00 PM", note: "Varsity only" },
      { date: "2027-01-11", opp: "St. Augustine", loc: "Away", time: "7:30 PM", note: "JV 6:00" },
      { date: "2027-01-12", opp: "Bartram Trail", loc: "Away", time: "7:30 PM", note: "JV 6:00" },
      { date: "2027-01-14", opp: "Nease", loc: "Home", time: "7:30 PM", note: "JV 6:00" },
      { date: "2027-01-20", opp: "FSDB", loc: "Home", time: "6:00 PM", tag: "Senior Night" },
      { date: "2027-01-22", opp: "Pedro Menendez", loc: "Away", time: "7:30 PM", note: "JV 6:00" },
      { date: "2027-01-25", opp: "Orange Park", loc: "Home", time: "5:30 PM" },
      { date: "2027-01-26", opp: "Bradford", loc: "Away", time: "6:00 PM", note: "Triple header" },
      { date: "2027-01-28", opp: "Ponte Vedra", loc: "Away", time: "6:00 PM", note: "Varsity only" }
    ]
  },

  writeups: [
    { kind: "Scouting profile", title: "Aiyana Haynes player profile", source: "Prep Girls Hoops", excerpt: "Her evaluation and ranking page on Prep Girls Hoops.", url: "https://prepgirlshoops.com/player/aiyana-haynes/" }
  ],

  nil: {
    intro: "Silent work. Loud impact. Aiyana is a performance first athlete: a quiet worker, an emotional competitor and a student of the game. She partners with brands that value grit, training and youth development, and every opportunity is reviewed with her family.",
    why: [
      { v: "#20", l: "Two way guard for the Lady Broncos" },
      { v: "4.3", l: "Steals per game as a junior" },
      { v: "799", l: "Career points heading into her senior year" },
      { v: "2", l: "College offers and counting" }
    ],
    offers: [
      { icon: "camp", title: "Defensive IQ clinics", text: "Small group and youth clinics on guard defense, footwork and reading the floor." },
      { icon: "product", title: "Strength and recovery", text: "Training gyms, recovery studios and conditioning brands that match her daily grind." },
      { icon: "social", title: "Social content", text: "Sponsored posts, reels and stories with a low talk, high edge style." },
      { icon: "business", title: "Local business ads", text: "Print, digital and in store campaigns using licensed NIL ready photos." },
      { icon: "appearance", title: "Appearances", text: "Community events, youth camps, grand openings and meet and greets." },
      { icon: "cause", title: "Community causes", text: "Youth sports and education efforts that give back to Clay County." }
    ],
    rules: [
      "Send an inquiry with the opportunity, dates and compensation.",
      "Her family reviews every inquiry and makes the final decision.",
      "A simple written agreement is signed by a parent or guardian before any content goes live.",
      "Partners receive licensed photos from the Photo Vault below for the agreed campaign.",
      "Following FHSAA rules, partner content may not use Middleburg High School or Clay County District Schools names, logos, uniforms or facilities, and deals cannot be tied to recruiting or athletic performance."
    ]
  },

  contact: {
    approver: "Her family",
    email: "coachthaynes@gmail.com",
    people: [
      { role: "Player", who: "Aiyana Haynes", detail: "Phone and email on request" },
      { role: "Family and manager", who: "Haynes Family", detail: "Phone and email on request" },
      { role: "High school program", who: "Lady Broncos Staff", detail: "Phone and email on request" }
    ]
  },

  photos: []
};
