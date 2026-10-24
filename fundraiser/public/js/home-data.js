/* Starting content for the home page. Coaches edit it on the dashboard (/coach, Home page tab);
   once saved there, the saved version replaces this file. Keep visible text free of hyphens and dashes. */
window.HOME = {
  season: "2026/27",

  // Team slogans, shown in the hero, the slogan band, the ticker and the footer.
  slogans: ["Bronco Built", "Fear the Herd"],

  heroLead: "Grit, speed and heart in red and white. Come pack the gym, meet our players and help us build a program Middleburg is proud of.",

  // Extra lines for the red ticker under the hero. The next game and noted games are added on their own.
  ticker: ["Bronco Built", "Fear the Herd", "Pack the gym", "Support the team at mhsladybroncos.com/donate", "Red and white all night"],

  // YouTube channel for the highlight section and the Watch button.
  youtube: {
    channel: "https://www.youtube.com/@mhsbroncogbb",
  },

  // Six highlight slots. Empty slots fill on their own with the newest videos from the channel above,
  // one per player. Paste a YouTube link (watch, youtu.be or shorts) into url to pin a video to a slot.
  highlights: [
    { url: "", title: "Season opener highlights", tag: "Game recap" },
    { url: "", title: "Top plays of the week", tag: "Top plays" },
    { url: "", title: "Player spotlight", tag: "Spotlight" },
    { url: "", title: "Defense wins games", tag: "Defense" },
    { url: "", title: "Behind the scenes at practice", tag: "Practice" },
    { url: "", title: "Senior Night", tag: "Senior Night" },
  ],

  // Instagram. Set handle to the team account (no @).
  // Posts load on their own once INSTAGRAM_TOKEN is set on Netlify (see HOMEPAGE.md).
  // Until then, paste up to six post links into posts and they show as Instagram embeds.
  instagram: {
    handle: "",
    posts: [],
  },

  // Game schedule. date is YYYY-MM-DD, time is the varsity tip, home is true for games at Middleburg.
  // Add result once a game is played, for example "W 54 41" or "L 38 45".
  schedule: [
    // Preseason
    { date: "2026-11-09", opponent: "Mandarin", home: false, neutral: true, time: "5:00 PM", location: "at Ribault HS", note: "Preseason" },
    { date: "2026-11-11", opponent: "NEFI", home: false, neutral: true, time: "3:30 PM", location: "at Ribault HS", note: "Preseason" },
    // November
    { date: "2026-11-16", opponent: "Temple Christian", home: false, time: "6:00 PM" },
    { date: "2026-11-17", opponent: "Tocoi Creek", home: true, time: "7:30 PM", note: "JV 6:00" },
    { date: "2026-11-20", opponent: "Spruce Creek", home: true, time: "7:30 PM", note: "JV 6:00" },
    { date: "2026-11-23", opponent: "IE Thanksgiving Tourney", home: false, time: "", location: "Location TBD", note: "Varsity only" },
    { date: "2026-11-24", opponent: "IE Thanksgiving Tourney", home: false, time: "", location: "Location TBD", note: "Tournament" },
    { date: "2026-11-25", opponent: "IE Thanksgiving Tourney", home: false, time: "", location: "Location TBD", note: "Tournament" },
    // December
    { date: "2026-12-01", opponent: "Duval Charter", home: true, time: "6:00 PM" },
    { date: "2026-12-03", opponent: "Beachside", home: false, time: "7:30 PM", note: "JV 6:00" },
    { date: "2026-12-04", opponent: "Ridgeview", home: false, time: "6:00 PM" },
    { date: "2026-12-07", opponent: "Bolles", home: false, time: "6:00 PM" },
    { date: "2026-12-09", opponent: "Episcopal", home: false, time: "7:30 PM", note: "JV 6:00" },
    { date: "2026-12-14", opponent: "Clay", home: true, time: "7:30 PM", note: "JV 6:00 · County rivalry" },
    { date: "2026-12-16", opponent: "Oakleaf", home: false, time: "6:00 PM" },
    // January. featured puts a game in the spotlight card above the schedule.
    { date: "2027-01-05", opponent: "Creekside", home: false, time: "6:00 PM" },
    { date: "2027-01-07", opponent: "Fleming Island", home: false, time: "6:00 PM", note: "Triple header · County rivalry", featured: true },
    { date: "2027-01-08", opponent: "Jackson", home: false, time: "6:00 PM" },
    { date: "2027-01-11", opponent: "St. Augustine", home: false, time: "7:30 PM", note: "JV 6:00" },
    { date: "2027-01-12", opponent: "Bartram Trail", home: false, time: "7:30 PM", note: "JV 6:00" },
    { date: "2027-01-14", opponent: "Nease", home: true, time: "7:30 PM", note: "JV 6:00" },
    { date: "2027-01-18", opponent: "MLK Invitational", home: false, time: "", location: "Location TBD", note: "Tournament" },
    { date: "2027-01-20", opponent: "FSDB", home: true, time: "6:00 PM", note: "Senior Night" },
    { date: "2027-01-22", opponent: "Pedro Menendez", home: false, time: "7:30 PM", note: "JV 6:00" },
    { date: "2027-01-25", opponent: "Orange Park", home: true, time: "5:30 PM" },
    { date: "2027-01-26", opponent: "Bradford", home: false, time: "6:00 PM" },
    { date: "2027-01-28", opponent: "Ponte Vedra", home: false, time: "6:00 PM" },
  ],

  venue: {
    name: "Middleburg High School Gym",
    city: "Middleburg, Florida",
    map: "https://www.google.com/maps/search/?api=1&query=Middleburg+High+School+Middleburg+FL",
  },

  // Featured players at the top of the roster. site is their personal recruiting page.
  spotlights: [
    {
      name: "Aiyana Haynes", number: "20", position: "Guard", classYear: "2027", height: "5'8\"",
      headline: "Two way guard with college offers",
      bio: "Calm off the court and relentless on it. Aiyana heads into her senior season with 799 career points and college offers from Southwest Arkansas and Taft College.",
      stats: [{ v: "12.5", l: "PPG" }, { v: "7.6", l: "RPG" }, { v: "4.3", l: "SPG" }, { v: "799", l: "Career pts" }],
      site: "https://elevateherhoopsreport.com/aiyana-haynes/",
      links: [
        { label: "Hudl", url: "https://www.hudl.com/profile/20899818/Aiyana-Haynes" },
        { label: "MaxPreps", url: "https://www.maxpreps.com/fl/middleburg/middleburg-broncos/athletes/aiyana-haynes/?careerid=5d7kddlh57g11" },
        { label: "YouTube", url: "https://www.youtube.com/@AiyanaH.baller27" },
      ],
    },
    {
      name: "Kennedy Jeffress", number: "2", position: "Guard", classYear: "2029", height: "5'6\"",
      headline: "Fearless scorer, quick hands",
      bio: "As a freshman Kennedy led the Lady Broncos attack, pouring in 380 points while averaging 17.3 points and 3.2 steals per game.",
      stats: [{ v: "17.3", l: "PPG" }, { v: "4.1", l: "RPG" }, { v: "3.2", l: "SPG" }, { v: "380", l: "Season pts" }],
      site: "https://elevateherhoopsreport.com/kennedy-jeffress",
      links: [],
    },
  ],

  // Roster. Players with a fundraiser page are matched by first name and last initial and get their photo
  // and Support link; everyone here shows on the roster with her full name, site and MaxPreps.
  rosterExtras: {
    "Aiyana Haynes": { number: "20", position: "Guard", classYear: "2027", height: "5'8\"", site: "https://elevateherhoopsreport.com/aiyana-haynes/", maxpreps: "https://www.maxpreps.com/fl/middleburg/middleburg-broncos/athletes/aiyana-haynes/?careerid=5d7kddlh57g11" },
    "Kennedy Jeffress": { number: "2", position: "Guard", classYear: "2029", height: "5'6\"", site: "https://elevateherhoopsreport.com/kennedy-jeffress" },
    "Nyla Parsons": { number: "3", site: "https://elevateherhoopsreport.com/players/nyla-parsons", maxpreps: "https://www.maxpreps.com/fl/orange-park/oakleaf-knights/athletes/nyla-parsons/?careerid=ldj8gsjp4kcrb" },
    "Maliya Lassiter": { number: "5", site: "https://elevateherhoopsreport.com/players/maliya-lassiter", maxpreps: "https://www.maxpreps.com/fl/middleburg/middleburg-broncos/athletes/maliya-lassiter/?careerid=ulmhdcn099e00" },
    "Janiyla Owens": { number: "4", site: "https://elevateherhoopsreport.com/players/janiyla-owens", maxpreps: "https://www.maxpreps.com/fl/orange-park/oakleaf-knights/athletes/janiyla-owens/?careerid=7r7uliehmedue" },
    "Sophia Butler": { number: "11", site: "https://elevateherhoopsreport.com/players/sophia-butler", maxpreps: "https://www.maxpreps.com/fl/middleburg/middleburg-broncos/athletes/sophia-butler/?careerid=8vrcld9u7susc" },
    "Catherine Bodway": { number: "14", site: "https://elevateherhoopsreport.com/players/catherine-bodway", maxpreps: "https://www.maxpreps.com/fl/middleburg/middleburg-broncos/athletes/catherine-bodway/?careerid=fn361pimiao11" },
    "Aliyna McCobb": { number: "1", site: "https://elevateherhoopsreport.com/players/aliyna-mccobb", maxpreps: "https://www.maxpreps.com/fl/middleburg/middleburg-broncos/athletes/aliyna-mccobb/?careerid=vm6vokeo1c6rb" },
    "Savanna Padgett": { number: "30", site: "https://elevateherhoopsreport.com/players/savanna-padgett", maxpreps: "https://www.maxpreps.com/fl/middleburg/middleburg-broncos/athletes/savanna-padgett/?careerid=gmf4ef3javdcc" },
  },

  coaches: [
    { name: "Tenise Haynes", role: "Head Coach", bio: "Builds players who compete on the court, lead in the classroom and grow through the Bronco Life Skills mentorship series." },
  ],

  recruiting: {
    email: "coachthaynes@gmail.com",
    maxpreps: "https://www.maxpreps.com/fl/middleburg/middleburg-broncos/basketball/girls/",
  },
};

// Saved dashboard content wins over the defaults above.
window.loadHome = async function () {
  try {
    const r = await fetch("/api/home");
    const d = r.ok ? await r.json() : {};
    if (d.content) window.HOME = { ...window.HOME, ...d.content };
  } catch { /* keep the defaults */ }
  return window.HOME;
};
