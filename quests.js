// =====================================================================
// CAREER QUEST: quest library (Season 1: November 2026 to June 2027)
// =====================================================================
//
// HOW RANKING WORKS
// Each stat climbs five ranks: Squire, Knight, Captain, Lord, King.
// To rank up you need BOTH:
//   1. enough XP in that stat (see RANK_THRESHOLDS), and
//   2. to complete that rank's TRIAL quest (trial: true).
// Daily habits give small XP. Weekly and monthly quests give more.
// Trials are big, one-off challenges. King is meant to take until
// mid 2027 with steady effort.
//
// Quests from your current rank AND all lower ranks stay available,
// so habits you build early keep paying XP.
//
// QUEST FIELDS
//   id        unique code
//   stat      which stat it builds
//   rank      the rank where it unlocks (1 to 5)
//   title     short quest name
//   how       the guideline: exactly what to do
//   xp        XP earned
//   slot      best time of day: Morning, Day or Evening
//   cooldown  how often it can be done: "daily", "weekly",
//             "monthly" or "once"
//   trial     true if this is the rank-up trial
// =====================================================================

const SEASON_END = "2027-06-30";

const RANK_TITLES = ["Squire", "Knight", "Captain", "Lord", "King"];

// Total XP needed in a stat to reach each rank (Squire starts at 0)
const RANK_THRESHOLDS = [0, 500, 1500, 3000, 5000];

const STATS = {
  Intelligence: "Problem solving, project finance, infrastructure investing",
  Expertise:    "Data centres, aviation, NTO as an investment",
  Charisma:     "Communication, presence, gravitas",
  Leadership:   "Leading people, owning decisions",
  Wisdom:       "General knowledge: history, science, philosophy, culture, the world",
  Strength:     "Gym, cardio, mobility, sleep, nutrition",
  Craft:        "AI, coding and tech fluency",
  Influence:    "Networking, negotiation, personal brand"
};

const QUESTS = [

  // ===================================================================
  // INTELLIGENCE: problem solving + project finance + investing
  // ===================================================================
  // Squire
  { id: "int-1a", stat: "Intelligence", rank: 1, title: "Daily puzzle", how: "Solve one logic puzzle, chess puzzle or brain teaser. Think it through before checking the answer.", xp: 10, slot: "Morning", cooldown: "daily", trial: false },
  { id: "int-1b", stat: "Intelligence", rank: 1, title: "Five whys", how: "Pick a recurring problem at work. Ask 'why' five times to reach the root cause. Write it down.", xp: 40, slot: "Day", cooldown: "weekly", trial: false },
  { id: "int-1c", stat: "Intelligence", rank: 1, title: "Learn the language", how: "Look up SPV, CFADS, DSCR and DSRA. Explain each one out loud in a single sentence.", xp: 60, slot: "Evening", cooldown: "once", trial: false },
  { id: "int-1t", stat: "Intelligence", rank: 1, title: "TRIAL: The first tome", how: "Read chapters 1 to 3 of Infrastructure as an Asset Class. Explain 3 big takeaways out loud without notes.", xp: 150, slot: "Evening", cooldown: "once", trial: true },
  // Knight
  { id: "int-2a", stat: "Intelligence", rank: 2, title: "Fermi estimate", how: "Estimate something you cannot look up quickly (e.g. passengers through JFK per day) step by step. Then check how close you got.", xp: 30, slot: "Day", cooldown: "weekly", trial: false },
  { id: "int-2b", stat: "Intelligence", rank: 2, title: "Issue tree", how: "Before solving a work problem, break it into a tree of sub-questions that do not overlap. Solve the biggest branch first.", xp: 50, slot: "Day", cooldown: "weekly", trial: false },
  { id: "int-2c", stat: "Intelligence", rank: 2, title: "Build your first cash flow", how: "In Excel, build a 10 year cash flow for a simple toll road: traffic, revenue, operating costs, CFADS.", xp: 120, slot: "Evening", cooldown: "once", trial: false },
  { id: "int-2t", stat: "Intelligence", rank: 2, title: "TRIAL: Read the numbers", how: "Add NPV and IRR to your toll road model. Change 3 inputs one at a time and explain out loud what moved and why.", xp: 250, slot: "Evening", cooldown: "once", trial: true },
  // Captain
  { id: "int-3a", stat: "Intelligence", rank: 3, title: "Case drill", how: "Solve a consulting style case (market sizing or profitability) in 30 minutes. Ask Claude to set one and grade you.", xp: 60, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "int-3b", stat: "Intelligence", rank: 3, title: "Read a real deal", how: "Find an infrastructure acquisition announcement. Identify buyer, asset, price, and why they bought it.", xp: 40, slot: "Morning", cooldown: "weekly", trial: false },
  { id: "int-3c", stat: "Intelligence", rank: 3, title: "Debt and reserves", how: "Add a loan to your model, calculate DSCR each year, and add a debt service reserve account.", xp: 150, slot: "Evening", cooldown: "once", trial: false },
  { id: "int-3t", stat: "Intelligence", rank: 3, title: "TRIAL: Break the model", how: "Drop traffic 20% and raise rates 2%. Find what breaks first, and write a one page fix.", xp: 350, slot: "Evening", cooldown: "once", trial: true },
  // Lord
  { id: "int-4a", stat: "Intelligence", rank: 4, title: "Crack a real problem", how: "Pick a nagging project issue. Write problem, options and recommendation on one page, and get it acted on.", xp: 200, slot: "Day", cooldown: "monthly", trial: false },
  { id: "int-4b", stat: "Intelligence", rank: 4, title: "New sector memo", how: "Write a 1 page investment view on an asset in a sector you have not covered yet.", xp: 150, slot: "Evening", cooldown: "monthly", trial: false },
  { id: "int-4t", stat: "Intelligence", rank: 4, title: "TRIAL: The IC memo", how: "Write a 2 page investment committee memo on a real asset: thesis, returns, key risks, recommendation.", xp: 500, slot: "Evening", cooldown: "once", trial: true },
  // King
  { id: "int-5a", stat: "Intelligence", rank: 5, title: "Defend the deal", how: "Present a memo in 10 minutes to a mentor or friend and take their hardest questions.", xp: 250, slot: "Evening", cooldown: "monthly", trial: false },
  { id: "int-5b", stat: "Intelligence", rank: 5, title: "Teach it", how: "Teach someone project finance basics in 30 minutes.", xp: 200, slot: "Evening", cooldown: "once", trial: false },
  { id: "int-5t", stat: "Intelligence", rank: 5, title: "TRIAL: Model a real asset", how: "Build a full model of a real public infrastructure deal from public information, and write your verdict.", xp: 800, slot: "Evening", cooldown: "once", trial: true },

  // ===================================================================
  // EXPERTISE: data centres, aviation, NTO
  // ===================================================================
  { id: "exp-1a", stat: "Expertise", rank: 1, title: "Daily headline", how: "Read one airport, airline or data centre news story. Say the takeaway in one sentence.", xp: 10, slot: "Morning", cooldown: "daily", trial: false },
  { id: "exp-1b", stat: "Expertise", rank: 1, title: "Airport money map", how: "List how airports earn money: aeronautical (airline fees) vs non aeronautical (retail, parking, concessions). Use JFK examples.", xp: 60, slot: "Evening", cooldown: "once", trial: false },
  { id: "exp-1c", stat: "Expertise", rank: 1, title: "Data centre 101", how: "Learn what MW capacity, PUE, colocation and hyperscale mean. Explain each in one line.", xp: 60, slot: "Evening", cooldown: "once", trial: false },
  { id: "exp-1t", stat: "Expertise", rank: 1, title: "TRIAL: The glossary", how: "Write your own glossary of 20 key terms across airports and data centres, in your own words.", xp: 150, slot: "Evening", cooldown: "once", trial: true },

  { id: "exp-2a", stat: "Expertise", rank: 2, title: "Weekly sector brief", how: "Read 3 sector stories this week. Write a 5 line takeaway.", xp: 50, slot: "Morning", cooldown: "weekly", trial: false },
  { id: "exp-2b", stat: "Expertise", rank: 2, title: "Follow the power", how: "Learn why grid power is the main bottleneck for data centres. Summarise in 5 bullets.", xp: 80, slot: "Evening", cooldown: "once", trial: false },
  { id: "exp-2c", stat: "Expertise", rank: 2, title: "Airline economics", how: "Learn load factor, yield and cost per seat mile, and how airlines make or lose money.", xp: 80, slot: "Evening", cooldown: "once", trial: false },
  { id: "exp-2t", stat: "Expertise", rank: 2, title: "TRIAL: NTO as an investment", how: "Write one page: who funded NTO, how investors get repaid, and the top 3 risks.", xp: 250, slot: "Evening", cooldown: "once", trial: true },

  { id: "exp-3a", stat: "Expertise", rank: 3, title: "Map the players", how: "List 10 major data centre developers or investors and what makes each different.", xp: 120, slot: "Evening", cooldown: "once", trial: false },
  { id: "exp-3b", stat: "Expertise", rank: 3, title: "How hyperscalers lease", how: "Learn how cloud giants lease capacity and what makes those contracts attractive to lenders.", xp: 120, slot: "Evening", cooldown: "once", trial: false },
  { id: "exp-3c", stat: "Expertise", rank: 3, title: "Field trip", how: "Tour an infrastructure asset, or watch a detailed tour of a data centre or airport. Note 5 things.", xp: 100, slot: "Day", cooldown: "monthly", trial: false },
  { id: "exp-3t", stat: "Expertise", rank: 3, title: "TRIAL: Airport vs data centre", how: "Compare the two as investments: revenue, risk, capex, who the customer is. Two pages.", xp: 350, slot: "Evening", cooldown: "once", trial: true },

  { id: "exp-4a", stat: "Expertise", rank: 4, title: "Expert call", how: "Have a 30 minute conversation with someone in data centres or airport finance. Prepare 5 questions.", xp: 150, slot: "Day", cooldown: "monthly", trial: false },
  { id: "exp-4b", stat: "Expertise", rank: 4, title: "Earnings call", how: "Listen to a listed infrastructure or data centre company's earnings call. Note 5 points.", xp: 100, slot: "Evening", cooldown: "monthly", trial: false },
  { id: "exp-4t", stat: "Expertise", rank: 4, title: "TRIAL: Sector thesis", how: "Write a 3 page view on where to invest in digital infrastructure over the next 5 years.", xp: 500, slot: "Evening", cooldown: "once", trial: true },

  { id: "exp-5b", stat: "Expertise", rank: 5, title: "Why this sector, why now", how: "Answer it in 2 minutes with no notes. Record it and repeat until sharp.", xp: 100, slot: "Evening", cooldown: "monthly", trial: false },
  { id: "exp-5t", stat: "Expertise", rank: 5, title: "TRIAL: Face the elders", how: "Present your sector thesis to someone senior in the industry and get their honest feedback.", xp: 800, slot: "Day", cooldown: "once", trial: true },

  // ===================================================================
  // CHARISMA: communication and presence
  // ===================================================================
  { id: "cha-1a", stat: "Charisma", rank: 1, title: "Headline first", how: "In every work update today, say the main point in the first sentence. Details second.", xp: 10, slot: "Day", cooldown: "daily", trial: false },
  { id: "cha-1b", stat: "Charisma", rank: 1, title: "Sorry becomes thanks", how: "Replace 'sorry for the delay' with 'thanks for your patience' all day.", xp: 10, slot: "Day", cooldown: "daily", trial: false },
  { id: "cha-1t", stat: "Charisma", rank: 1, title: "TRIAL: Hear yourself", how: "Record a 2 minute explanation of your project. Listen back and write 3 things to fix.", xp: 150, slot: "Evening", cooldown: "once", trial: true },

  { id: "cha-2a", stat: "Charisma", rank: 2, title: "The pause", how: "Pause 2 seconds before answering questions in meetings. Silence reads as confidence.", xp: 10, slot: "Day", cooldown: "daily", trial: false },
  { id: "cha-2b", stat: "Charisma", rank: 2, title: "Word of the day", how: "Learn one precise new word, check its pronunciation, and use it in a real conversation.", xp: 10, slot: "Morning", cooldown: "daily", trial: false },
  { id: "cha-2c", stat: "Charisma", rank: 2, title: "Pronunciation check", how: "Pick 3 words you are unsure how to say. Look them up, practise them out loud 10 times.", xp: 30, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "cha-2t", stat: "Charisma", rank: 2, title: "TRIAL: Before and after", how: "Re-record the same 2 minute explanation from your first trial. Compare and list what improved.", xp: 250, slot: "Evening", cooldown: "once", trial: true },

  { id: "cha-3a", stat: "Charisma", rank: 3, title: "Slow and steady", how: "Give a meeting update at a deliberately slower pace. Notice how people react.", xp: 40, slot: "Day", cooldown: "weekly", trial: false },
  { id: "cha-3b", stat: "Charisma", rank: 3, title: "Tell it as a story", how: "Tell a work story as situation, problem, resolution in under 90 seconds.", xp: 50, slot: "Day", cooldown: "weekly", trial: false },
  { id: "cha-3t", stat: "Charisma", rank: 3, title: "TRIAL: Hard question gauntlet", how: "Write 10 tough questions your boss could ask. Answer each headline first, out loud, until none trip you up.", xp: 350, slot: "Evening", cooldown: "once", trial: true },

  { id: "cha-4a", stat: "Charisma", rank: 4, title: "Take the floor", how: "Volunteer to present at a team meeting.", xp: 150, slot: "Day", cooldown: "monthly", trial: false },
  { id: "cha-4b", stat: "Charisma", rank: 4, title: "Speaking club", how: "Speak at a public speaking club or event (e.g. a Toastmasters meeting).", xp: 200, slot: "Evening", cooldown: "monthly", trial: false },
  { id: "cha-4t", stat: "Charisma", rank: 4, title: "TRIAL: Command the room", how: "Present to a room of 10 or more people and take questions.", xp: 500, slot: "Day", cooldown: "once", trial: true },

  { id: "cha-5a", stat: "Charisma", rank: 5, title: "Respectful pushback", how: "Disagree with a senior person calmly, backed by data, with an alternative.", xp: 150, slot: "Day", cooldown: "monthly", trial: false },
  { id: "cha-5t", stat: "Charisma", rank: 5, title: "TRIAL: No notes", how: "Give a 5 minute talk with no slides and no notes.", xp: 800, slot: "Day", cooldown: "once", trial: true },

  // ===================================================================
  // LEADERSHIP
  // ===================================================================
  { id: "lea-1a", stat: "Leadership", rank: 1, title: "Bring a solution", how: "Before taking a problem to your boss, bring 2 options and your recommendation.", xp: 10, slot: "Day", cooldown: "daily", trial: false },
  { id: "lea-1b", stat: "Leadership", rank: 1, title: "Clear the board", how: "Close or push forward 3 open items on your NCR tracker.", xp: 40, slot: "Day", cooldown: "weekly", trial: false },
  { id: "lea-1t", stat: "Leadership", rank: 1, title: "TRIAL: Your banner", how: "Write 3 sentences: what you want your team to say about you as a leader in a year.", xp: 150, slot: "Evening", cooldown: "once", trial: true },

  { id: "lea-2a", stat: "Leadership", rank: 2, title: "One on one", how: "Have a 15 minute check in with a team member. Ask what is blocking them, then help remove it.", xp: 50, slot: "Day", cooldown: "weekly", trial: false },
  { id: "lea-2b", stat: "Leadership", rank: 2, title: "Delegate fully", how: "Hand off a task with a clear outcome and deadline. Do not take it back.", xp: 50, slot: "Day", cooldown: "weekly", trial: false },
  { id: "lea-2c", stat: "Leadership", rank: 2, title: "Give credit", how: "Recognise someone's good work in front of others.", xp: 30, slot: "Day", cooldown: "weekly", trial: false },
  { id: "lea-2t", stat: "Leadership", rank: 2, title: "TRIAL: Study the masters", how: "Read The Pyramid Principle or another leadership book. Write 3 lessons and apply one for a week.", xp: 250, slot: "Evening", cooldown: "once", trial: true },

  { id: "lea-3a", stat: "Leadership", rank: 3, title: "Run the meeting", how: "Chair a meeting with an agenda. Send decisions and actions within the hour after.", xp: 80, slot: "Day", cooldown: "weekly", trial: false },
  { id: "lea-3b", stat: "Leadership", rank: 3, title: "Ask for feedback", how: "Ask your boss: 'What is one thing I should do differently?' Listen, thank them, act on it.", xp: 120, slot: "Day", cooldown: "monthly", trial: false },
  { id: "lea-3t", stat: "Leadership", rank: 3, title: "TRIAL: Lead the fix", how: "Lead your team through resolving a real problem from start to finish.", xp: 350, slot: "Day", cooldown: "once", trial: true },

  { id: "lea-4a", stat: "Leadership", rank: 4, title: "Honest feedback", how: "Give constructive feedback using situation, behaviour, impact. Private and specific.", xp: 120, slot: "Day", cooldown: "monthly", trial: false },
  { id: "lea-4b", stat: "Leadership", rank: 4, title: "Make the call", how: "Make a decision within your remit without escalating. Write down why.", xp: 60, slot: "Day", cooldown: "weekly", trial: false },
  { id: "lea-4t", stat: "Leadership", rank: 4, title: "TRIAL: Ask for the harder job", how: "Ask your boss for a stretch responsibility, and deliver it.", xp: 500, slot: "Day", cooldown: "once", trial: true },

  { id: "lea-5a", stat: "Leadership", rank: 5, title: "Mentor", how: "Mentor someone more junior, meeting weekly for a month.", xp: 250, slot: "Day", cooldown: "monthly", trial: false },
  { id: "lea-5t", stat: "Leadership", rank: 5, title: "TRIAL: Own a win", how: "Lead an initiative from start to finish and present the results to your boss.", xp: 800, slot: "Day", cooldown: "once", trial: true },

  // ===================================================================
  // WISDOM: general knowledge of anything
  // ===================================================================
  { id: "wis-1a", stat: "Wisdom", rank: 1, title: "Today I learned", how: "Learn one new fact about anything and tell someone about it.", xp: 10, slot: "Evening", cooldown: "daily", trial: false },
  { id: "wis-1b", stat: "Wisdom", rank: 1, title: "Atlas", how: "Pick a country you know little about. Learn its capital, people, history in brief, and one surprising fact.", xp: 30, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "wis-1c", stat: "Wisdom", rank: 1, title: "Meet Marcus Aurelius", how: "Read a short summary of Stoicism. Pick one idea and apply it today.", xp: 40, slot: "Morning", cooldown: "once", trial: false },
  { id: "wis-1t", stat: "Wisdom", rank: 1, title: "TRIAL: Map of thinkers", how: "Learn one thinker each from Ancient Greece, China, India and the Islamic Golden Age. Explain each in a minute.", xp: 150, slot: "Evening", cooldown: "once", trial: true },

  { id: "wis-2a", stat: "Wisdom", rank: 2, title: "Documentary night", how: "Watch a documentary on science, history or nature. Note 3 things you learned.", xp: 40, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "wis-2b", stat: "Wisdom", rank: 2, title: "How it works", how: "Learn how something works (vaccines, nuclear power, black holes, the internet). Explain it in 2 minutes.", xp: 40, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "wis-2c", stat: "Wisdom", rank: 2, title: "Big economic idea", how: "Learn one big idea (inflation, comparative advantage, interest rates) and explain it simply.", xp: 40, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "wis-2t", stat: "Wisdom", rank: 2, title: "TRIAL: Outside your field", how: "Read a whole non-fiction book outside your work (history, science, psychology).", xp: 250, slot: "Evening", cooldown: "once", trial: true },

  { id: "wis-3a", stat: "Wisdom", rank: 3, title: "Art and culture", how: "Learn about one artist, composer, architect or writer and why they matter.", xp: 40, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "wis-3b", stat: "Wisdom", rank: 3, title: "Read the original", how: "Read a short original text, such as a book of Meditations or part of the Tao Te Ching.", xp: 80, slot: "Evening", cooldown: "monthly", trial: false },
  { id: "wis-3c", stat: "Wisdom", rank: 3, title: "Argue both sides", how: "Write the best case for and against a belief you hold strongly.", xp: 60, slot: "Evening", cooldown: "monthly", trial: false },
  { id: "wis-3t", stat: "Wisdom", rank: 3, title: "TRIAL: The great timeline", how: "Learn world history as 10 big eras, from the first cities to today. Explain it start to finish.", xp: 350, slot: "Evening", cooldown: "once", trial: true },

  { id: "wis-4a", stat: "Wisdom", rank: 4, title: "Museum quest", how: "Visit a New York museum and learn 3 things worth telling someone.", xp: 120, slot: "Day", cooldown: "monthly", trial: false },
  { id: "wis-4b", stat: "Wisdom", rank: 4, title: "Philosophy dinner", how: "Discuss one big idea over dinner with your girlfriend or friends.", xp: 80, slot: "Evening", cooldown: "monthly", trial: false },
  { id: "wis-4c", stat: "Wisdom", rank: 4, title: "Stoic journal", how: "Short evening reflection for 7 days: what went well, what to improve, what was out of your control.", xp: 120, slot: "Evening", cooldown: "monthly", trial: false },
  { id: "wis-4t", stat: "Wisdom", rank: 4, title: "TRIAL: Three fields", how: "Read 3 books from 3 different fields. Write one page connecting an idea across them.", xp: 500, slot: "Evening", cooldown: "once", trial: true },

  { id: "wis-5a", stat: "Wisdom", rank: 5, title: "Trivia night", how: "Go to a pub trivia night with friends.", xp: 100, slot: "Evening", cooldown: "monthly", trial: false },
  { id: "wis-5b", stat: "Wisdom", rank: 5, title: "Teach a thinker", how: "Explain a big idea from any field to someone in 3 minutes.", xp: 100, slot: "Evening", cooldown: "monthly", trial: false },
  { id: "wis-5t", stat: "Wisdom", rank: 5, title: "TRIAL: Your code", how: "Write one page on your own principles for work and life, drawing on what you have learned.", xp: 800, slot: "Evening", cooldown: "once", trial: true },

  // ===================================================================
  // STRENGTH: gym, cardio, mobility, sleep, nutrition
  // (Adapt everything to whatever programme you are currently following.)
  // ===================================================================
  { id: "str-1a", stat: "Strength", rank: 1, title: "Show up", how: "Complete a gym session from your current programme.", xp: 10, slot: "Morning", cooldown: "daily", trial: false },
  { id: "str-1b", stat: "Strength", rank: 1, title: "Lights out", how: "Be in bed early enough for 7 or more hours of sleep.", xp: 5, slot: "Evening", cooldown: "daily", trial: false },
  { id: "str-1c", stat: "Strength", rank: 1, title: "Walk the realm", how: "Hit 8,000 steps today.", xp: 5, slot: "Day", cooldown: "daily", trial: false },
  { id: "str-1d", stat: "Strength", rank: 1, title: "Set the trap", how: "Lay out gym gear and wash up before bed so the morning is automatic.", xp: 5, slot: "Evening", cooldown: "daily", trial: false },
  { id: "str-1t", stat: "Strength", rank: 1, title: "TRIAL: Baseline", how: "Record your starting point: resting heart rate, a timed 1 mile or 20 minute cardio distance, bodyweight and a photo.", xp: 150, slot: "Morning", cooldown: "once", trial: true },

  { id: "str-2a", stat: "Strength", rank: 2, title: "Cardio session", how: "30 minutes of running, rowing, cycling or swimming.", xp: 10, slot: "Morning", cooldown: "daily", trial: false },
  { id: "str-2b", stat: "Strength", rank: 2, title: "Three a week", how: "Hit 3 gym sessions this week.", xp: 50, slot: "Morning", cooldown: "weekly", trial: false },
  { id: "str-2c", stat: "Strength", rank: 2, title: "Hydrate", how: "Drink at least 2.5 litres of water today.", xp: 5, slot: "Day", cooldown: "daily", trial: false },
  { id: "str-2t", stat: "Strength", rank: 2, title: "TRIAL: Two week streak", how: "3 gym sessions plus 1 cardio session every week for 2 weeks straight.", xp: 250, slot: "Morning", cooldown: "once", trial: true },

  { id: "str-3a", stat: "Strength", rank: 3, title: "Zone 2", how: "45 minutes of easy cardio at a pace where you can still hold a conversation.", xp: 40, slot: "Morning", cooldown: "weekly", trial: false },
  { id: "str-3b", stat: "Strength", rank: 3, title: "Fuel up", how: "Hit your protein target 5 days this week.", xp: 50, slot: "Day", cooldown: "weekly", trial: false },
  { id: "str-3c", stat: "Strength", rank: 3, title: "Mobility", how: "15 minutes of mobility or stretching.", xp: 5, slot: "Evening", cooldown: "daily", trial: false },
  { id: "str-3t", stat: "Strength", rank: 3, title: "TRIAL: The 5K", how: "Run 5 km without stopping.", xp: 350, slot: "Morning", cooldown: "once", trial: true },

  { id: "str-4a", stat: "Strength", rank: 4, title: "Intervals", how: "A high intensity interval session: e.g. 8 rounds of 30 seconds hard, 90 seconds easy.", xp: 40, slot: "Morning", cooldown: "weekly", trial: false },
  { id: "str-4b", stat: "Strength", rank: 4, title: "Active weekend", how: "A hike, a game of sport, or a long ride.", xp: 50, slot: "Day", cooldown: "weekly", trial: false },
  { id: "str-4c", stat: "Strength", rank: 4, title: "Progress check", how: "Repeat your baseline tests and compare.", xp: 80, slot: "Morning", cooldown: "monthly", trial: false },
  { id: "str-4t", stat: "Strength", rank: 4, title: "TRIAL: Iron month", how: "3 gym sessions plus 2 cardio sessions every week for 4 weeks straight.", xp: 500, slot: "Morning", cooldown: "once", trial: true },

  { id: "str-5a", stat: "Strength", rank: 5, title: "Master's eye", how: "Get your technique reviewed by a coach or physio.", xp: 150, slot: "Morning", cooldown: "monthly", trial: false },
  { id: "str-5b", stat: "Strength", rank: 5, title: "Race day", how: "Sign up for and finish a 10K or similar event.", xp: 300, slot: "Morning", cooldown: "once", trial: false },
  { id: "str-5t", stat: "Strength", rank: 5, title: "TRIAL: Twelve weeks", how: "Hold your weekly routine for 12 weeks straight, then beat your baseline on every measure.", xp: 800, slot: "Morning", cooldown: "once", trial: true },

  // ===================================================================
  // CRAFT: AI, coding, tech
  // ===================================================================
  { id: "cra-1a", stat: "Craft", rank: 1, title: "Course lesson", how: "Complete one lesson of the Career Quest coding course.", xp: 50, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "cra-1b", stat: "Craft", rank: 1, title: "AI vocabulary", how: "Learn what a model, a prompt, an API and an agent are. Explain each in one line.", xp: 60, slot: "Evening", cooldown: "once", trial: false },
  { id: "cra-1t", stat: "Craft", rank: 1, title: "TRIAL: Forge the sheet", how: "Get Career Quest running in your browser with your character sheet.", xp: 150, slot: "Evening", cooldown: "once", trial: true },

  { id: "cra-2a", stat: "Craft", rank: 2, title: "Prompt craft", how: "Rewrite one work prompt 3 different ways. Keep the best version.", xp: 30, slot: "Day", cooldown: "weekly", trial: false },
  { id: "cra-2b", stat: "Craft", rank: 2, title: "Save your progress", how: "Learn Git basics and save your project with version control.", xp: 80, slot: "Evening", cooldown: "once", trial: false },
  { id: "cra-2c", stat: "Craft", rank: 2, title: "Automate a chore", how: "Use Claude to cut time on a repetitive work task, such as summarising your NCR tracker.", xp: 100, slot: "Day", cooldown: "monthly", trial: false },
  { id: "cra-2t", stat: "Craft", rank: 2, title: "TRIAL: Halfway", how: "Finish Week 4 of the course: Career Quest feels like a real game.", xp: 250, slot: "Evening", cooldown: "once", trial: true },

  { id: "cra-3a", stat: "Craft", rank: 3, title: "Ship a feature solo", how: "Add one feature to Career Quest without following the course guide.", xp: 80, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "cra-3b", stat: "Craft", rank: 3, title: "Chips to clouds", how: "Explain how GPUs, TPUs, data centres and AI models connect, in 2 minutes.", xp: 100, slot: "Evening", cooldown: "once", trial: false },
  { id: "cra-3t", stat: "Craft", rank: 3, title: "TRIAL: Summon the Quest Master", how: "Call the Claude API from your app to generate a daily quest.", xp: 350, slot: "Evening", cooldown: "once", trial: true },

  { id: "cra-4a", stat: "Craft", rank: 4, title: "New tool scout", how: "Try a new AI tool or feature and write how it could apply to your work.", xp: 40, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "cra-4b", stat: "Craft", rank: 4, title: "AI at work pitch", how: "Propose one AI use case to your team with an estimate of time saved.", xp: 150, slot: "Day", cooldown: "monthly", trial: false },
  { id: "cra-4t", stat: "Craft", rank: 4, title: "TRIAL: Go live", how: "Deploy Career Quest so you can use it on your phone.", xp: 500, slot: "Evening", cooldown: "once", trial: true },

  { id: "cra-5a", stat: "Craft", rank: 5, title: "Teach the guild", how: "Run a 20 minute AI session for your team.", xp: 200, slot: "Day", cooldown: "monthly", trial: false },
  { id: "cra-5t", stat: "Craft", rank: 5, title: "TRIAL: A tool for the guild", how: "Build a small tool your team actually uses at work.", xp: 800, slot: "Day", cooldown: "once", trial: true },

  // ===================================================================
  // INFLUENCE: networking, negotiation, brand
  // ===================================================================
  { id: "inf-1a", stat: "Influence", rank: 1, title: "Reconnect", how: "Message one former colleague just to catch up.", xp: 20, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "inf-1t", stat: "Influence", rank: 1, title: "TRIAL: The target list", how: "List 20 target companies and 3 people at each you could reach.", xp: 150, slot: "Evening", cooldown: "once", trial: true },

  { id: "inf-2a", stat: "Influence", rank: 2, title: "Coffee chat", how: "20 minute chat with someone in infrastructure investing. Ask about their path, not for a job.", xp: 80, slot: "Day", cooldown: "weekly", trial: false },
  { id: "inf-2b", stat: "Influence", rank: 2, title: "Know your worth", how: "Research total pay for 3 of your target roles.", xp: 80, slot: "Evening", cooldown: "once", trial: false },
  { id: "inf-2t", stat: "Influence", rank: 2, title: "TRIAL: Five chats", how: "Complete 5 coffee chats with people in your target field.", xp: 250, slot: "Day", cooldown: "once", trial: true },

  { id: "inf-3a", stat: "Influence", rank: 3, title: "Tactical empathy", how: "Read a chapter of Never Split the Difference and practise labelling emotions in one real conversation.", xp: 50, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "inf-3b", stat: "Influence", rank: 3, title: "Enter the hall", how: "Go to an industry event and meet 3 new people. Follow up within 48 hours.", xp: 120, slot: "Evening", cooldown: "monthly", trial: false },
  { id: "inf-3t", stat: "Influence", rank: 3, title: "TRIAL: The introduction", how: "Get a warm introduction from a contact to someone at a target company.", xp: 350, slot: "Day", cooldown: "once", trial: true },

  { id: "inf-4a", stat: "Influence", rank: 4, title: "Mock interview", how: "Do a mock interview with a friend or with Claude for a target role.", xp: 80, slot: "Evening", cooldown: "weekly", trial: false },
  { id: "inf-4b", stat: "Influence", rank: 4, title: "Ask for a referral", how: "Ask a contact to refer you to a specific role.", xp: 150, slot: "Day", cooldown: "monthly", trial: false },
  { id: "inf-4c", stat: "Influence", rank: 4, title: "Haggle", how: "Negotiate something real: a bill, a price, or a scope at work.", xp: 80, slot: "Day", cooldown: "monthly", trial: false },
  { id: "inf-4t", stat: "Influence", rank: 4, title: "TRIAL: Earn an audience", how: "Land an interview for a target role.", xp: 500, slot: "Day", cooldown: "once", trial: true },

  { id: "inf-5a", stat: "Influence", rank: 5, title: "Final round", how: "Reach a final round interview.", xp: 250, slot: "Day", cooldown: "monthly", trial: false },
  { id: "inf-5t", stat: "Influence", rank: 5, title: "TRIAL: Claim your reward", how: "Negotiate your next offer. Anchor on total pay, not just base.", xp: 1000, slot: "Day", cooldown: "once", trial: true }
];

// =====================================================================
// BONDS: relationships rank from 1 to 10 using bond points
// A bond loses 1 point for every 14 days with no bond quest done
// (it never drops below the start of its current rank).
// =====================================================================
const BONDS = ["Girlfriend", "Friends", "Family"];

// Total bond points needed to reach each rank (rank 1 starts at 0)
const BOND_THRESHOLDS = [0, 3, 8, 15, 24, 35, 48, 63, 80, 100];

const BOND_QUESTS = [
  { id: "gf-a", bond: "Girlfriend", title: "Phones away dinner", how: "Dinner together with both phones out of sight.", points: 1, slot: "Evening", cooldown: "daily" },
  { id: "gf-b", bond: "Girlfriend", title: "Ask a real question", how: "Ask about something she is working through, then just listen.", points: 1, slot: "Evening", cooldown: "daily" },
  { id: "gf-c", bond: "Girlfriend", title: "Plan a date she would love", how: "Plan the whole thing yourself around something she enjoys.", points: 3, slot: "Evening", cooldown: "weekly" },
  { id: "gf-d", bond: "Girlfriend", title: "Try something new together", how: "A class, a cuisine, a neighbourhood neither of you has been to.", points: 3, slot: "Day", cooldown: "monthly" },
  { id: "gf-e", bond: "Girlfriend", title: "Weekend away", how: "Plan a weekend trip together.", points: 5, slot: "Day", cooldown: "monthly" },

  { id: "fr-a", bond: "Friends", title: "Check in", how: "Message a friend you have not spoken to in a while.", points: 1, slot: "Evening", cooldown: "weekly" },
  { id: "fr-b", bond: "Friends", title: "Rally the party", how: "Organise a night out with the boys.", points: 3, slot: "Evening", cooldown: "weekly" },
  { id: "fr-c", bond: "Friends", title: "Host the feast", how: "Host dinner, games night or a D&D session.", points: 3, slot: "Evening", cooldown: "monthly" },
  { id: "fr-d", bond: "Friends", title: "Show up", how: "Be there for a friend's big moment or tough day.", points: 5, slot: "Day", cooldown: "monthly" },

  { id: "fa-a", bond: "Family", title: "Call home", how: "Call your mum. Mind the time difference.", points: 1, slot: "Morning", cooldown: "weekly" },
  { id: "fa-b", bond: "Family", title: "Family video call", how: "Get the family on one video call.", points: 2, slot: "Morning", cooldown: "weekly" },
  { id: "fa-c", bond: "Family", title: "Small gesture", how: "Send something thoughtful home, a gift or a handwritten note.", points: 3, slot: "Day", cooldown: "monthly" },
  { id: "fa-d", bond: "Family", title: "Plan the next visit", how: "Lock in dates for your next trip home.", points: 5, slot: "Evening", cooldown: "monthly" }
];
