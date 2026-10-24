/* Starting content for the home page. Coaches edit it on the dashboard (/coach, Home page tab);
   once saved there, the saved version replaces this file. Keep visible text free of hyphens and dashes. */
window.HOME = {
  season: "2026/27",

  heroLead: "Grit, speed and heart in red and white. Come pack the gym, meet our players and help us build a program Middleburg is proud of.",

  // Extra lines for the red ticker under the hero. The next game and noted games are added on their own.
  ticker: ["Pack the gym", "Support the team at mhsladybroncos.com/donate", "Red and white all night"],

  // YouTube channel for the highlight section and the Watch button.
  youtube: {
    channel: "https://www.youtube.com/results?search_query=Middleburg+High+School+girls+basketball",
  },

  // Six highlight slots. Paste a YouTube link (watch, youtu.be or shorts) into url.
  // Empty slots show a Coming soon card that links to the channel.
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
    { date: "2026-11-17", opponent: "Tocoi Creek", home: true, time: "7:30 PM" },
    { date: "2026-11-20", opponent: "Spruce Creek", home: true, time: "7:30 PM" },
    { date: "2026-12-01", opponent: "Duval Charter", home: true, time: "6:00 PM" },
    { date: "2026-12-14", opponent: "Clay", home: true, time: "7:30 PM", note: "County rivalry" },
    { date: "2027-01-14", opponent: "Nease", home: true, time: "7:30 PM" },
    { date: "2027-01-20", opponent: "FSDB", home: true, time: "6:00 PM" },
    { date: "2027-01-25", opponent: "Orange Park", home: true, time: "5:30 PM", note: "Senior Night" },
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
      site: "https://aiyanahaynes.elevateherhoopsreport.com",
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
      site: "https://kennedyjeffress.elevateherhoopsreport.com",
      links: [],
    },
  ],

  // Extra roster details matched to fundraiser player pages by first and last name.
  // The roster itself (names, numbers, photos) comes from the coach dashboard.
  rosterExtras: {
    "Aiyana Haynes": { classYear: "2027", height: "5'8\"", site: "https://aiyanahaynes.elevateherhoopsreport.com" },
    "Kennedy Jeffress": { classYear: "2029", height: "5'6\"", site: "https://kennedyjeffress.elevateherhoopsreport.com" },
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
