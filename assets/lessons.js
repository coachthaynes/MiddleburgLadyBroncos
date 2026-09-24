/* Life Skills Mentorship Curriculum content.
   Writing rule for all visible text in this file: no hyphens or dashes.
   URLs are the only place a hyphen may appear. */

window.LESSONS = [
  /* ============================ 1 ============================ */
  {
    id: "finance",
    num: 1,
    date: "2026-11-07",
    title: "Personal Finance",
    presenter: "Host, with invited business prospects",
    point: "Financial mistakes made between 18 and 25 can take decades to recover from. Good habits built now compound for the rest of your life.",
    goals: [
      "Build a simple monthly budget using the 50/30/20 guideline",
      "Explain why an emergency fund comes before almost everything else",
      "Know the difference between checking and savings accounts",
      "Use a credit card without paying a cent of interest",
      "Name the five things that make up a credit score",
      "See how interest works for you when investing and against you when borrowing"
    ],
    agenda: [
      { min: 3, label: "Hook", detail: "The $400 question" },
      { min: 10, label: "Teach", detail: "Budget, accounts, credit, interest" },
      { min: 3, label: "Watch", detail: "One short video on budgeting or credit" },
      { min: 10, label: "Activity", detail: "First Apartment Budget" },
      { min: 3, label: "Wrap", detail: "Take home challenge and questions" }
    ],
    hook: {
      title: "The $400 question",
      text: "Ask the room: “If your car needed a $400 repair tomorrow, how would you pay for it?” Let a few players answer. Then share that about 1 in 3 American adults say they could not cover a $400 surprise with cash. Today is about making sure that is never you."
    },
    sections: [
      {
        title: "Creating and following a budget",
        points: [
          "A budget is a plan that tells every dollar where to go before the month starts.",
          "Start with take home pay, the amount that actually lands in your account after taxes.",
          "The 50/30/20 guideline: 50% needs (rent, food, transportation, phone), 30% wants (eating out, streaming, clothes), 20% savings and paying down debt.",
          "Track spending for 30 days. Most people are surprised by food and subscriptions.",
          "Pay yourself first: set savings to move automatically on payday so you never see it."
        ],
        tip: "Ask players to guess how much they spend on food and drinks in a week, then check their banking app. The gap is the lesson."
      },
      {
        title: "Building an emergency fund",
        points: [
          "An emergency fund is cash set aside only for true surprises: car repairs, medical bills, a lost job.",
          "Step one goal: $500 to $1,000. Long range goal: three to six months of living expenses.",
          "Keep it in a separate savings account so it is easy to reach but not tempting to spend.",
          "Without one, every surprise goes on a credit card and starts costing interest."
        ]
      },
      {
        title: "Checking versus savings",
        points: [
          "Checking: for everyday spending. Debit card, bill pay, direct deposit. Usually earns little or no interest.",
          "Savings: for money you are keeping. Earns interest. High yield savings accounts at online banks and credit unions often pay much more than big bank savings.",
          "Look for no monthly fees and no minimum balance. Credit unions are often a great first bank.",
          "FDIC (banks) and NCUA (credit unions) insure deposits up to $250,000 per depositor, per institution, per ownership category.",
          "Overdraft fees can be $30 or more each time. Turn on low balance alerts in your banking app."
        ]
      },
      {
        title: "Using credit cards responsibly",
        points: [
          "A credit card is a short term loan. Pay the full statement balance every month and you pay zero interest.",
          "Paying only the minimum is how debt snowballs. Average card interest rates are above 20% a year.",
          "Keep your balance under 30% of your limit, and under 10% is even better for your score.",
          "Never use a credit card for cash advances. Interest starts immediately and fees are high.",
          "A secured card or a student card is a smart first card for building credit."
        ]
      },
      {
        title: "Reading a credit report",
        points: [
          "Your credit report is your borrowing history. Your credit score is a number (300 to 850) calculated from it.",
          "Get free reports weekly from all three bureaus (Equifax, Experian, TransUnion) at AnnualCreditReport.com. That is the only official free site.",
          "Check for accounts you do not recognize, wrong late payments, and misspelled personal information. Dispute errors directly with the bureau.",
          "Scores affect apartment approvals, car loan rates, insurance prices, and sometimes job offers."
        ]
      },
      {
        title: "Interest, loans, and investing basics",
        points: [
          "Interest is the price of using money. When you borrow, you pay it. When you save or invest, you earn it.",
          "APR is the yearly cost of a loan including fees. Always compare APR, not the monthly payment.",
          "A longer loan means a lower payment but a lot more total interest.",
          "Compound interest means you earn interest on your interest. Time is the most powerful ingredient.",
          "Index funds own small pieces of hundreds of companies at once. They are a low cost, simple way to start investing.",
          "Rule of 72: divide 72 by your interest rate to estimate how many years it takes money to double. At 7%, about 10 years."
        ],
        tip: "Use the compound growth tool below live on screen. Change the starting age from 18 to 28 and let the room react."
      }
    ],
    terms: [
      { t: "Take home pay", d: "Your paycheck after taxes and deductions. Also called net pay." },
      { t: "Emergency fund", d: "Savings kept only for real, unplanned emergencies." },
      { t: "APR", d: "Annual percentage rate. The yearly cost of borrowing, including fees." },
      { t: "Statement balance", d: "What you owe on a credit card at the end of a billing cycle. Pay this in full to avoid interest." },
      { t: "Credit utilization", d: "How much of your available credit you are using. Lower is better." },
      { t: "Compound interest", d: "Earning interest on both your money and the interest it already earned." },
      { t: "Index fund", d: "An investment that holds a whole slice of the market instead of picking single stocks." }
    ],
    data: [
      { stat: "63%", text: "of U.S. adults said they would cover a $400 emergency expense using cash or its equivalent. The rest would borrow, sell something, or could not pay.", source: "Federal Reserve, Economic Well Being of U.S. Households (2023)", url: "https://www.federalreserve.gov/consumerscommunities/shed.htm" },
      { stat: "35%", text: "of a FICO score comes from payment history. Amounts owed is 30%, length of history 15%, new credit 10%, credit mix 10%.", source: "myFICO", url: "https://www.myfico.com/credit-education/whats-in-your-credit-score" },
      { stat: "52 months", text: "to pay off a $1,000 credit card balance at 22% APR paying $30 a month. You would pay about $560 in interest. Paying $100 a month clears it in 12 months with about $115 in interest.", source: "Calculated example", url: "" },
      { stat: "$438,000", text: "is roughly what $100 a month grows to from age 18 to 65 at a 7% average yearly return. Start at 28 instead and it is about $210,000. Ten years of waiting costs over $200,000.", source: "Calculated example, not a guaranteed return", url: "" }
    ],
    videos: [
      { title: "How to make a budget", source: "Two Cents (PBS) and similar channels", url: "https://www.youtube.com/results?search_query=two+cents+pbs+how+to+budget", note: "Pick one video under 8 minutes and play the first 3." },
      { title: "How credit scores work", source: "YouTube search", url: "https://www.youtube.com/results?search_query=how+credit+scores+work+explained+for+teens", note: "Look for one that covers the five score factors." },
      { title: "Compound interest explained", source: "Khan Academy and others", url: "https://www.youtube.com/results?search_query=compound+interest+explained+simply", note: "Good backup if the room needs a second explanation." }
    ],
    resources: [
      { title: "Consumer Financial Protection Bureau: Money topics", url: "https://www.consumerfinance.gov/consumer-tools/", note: "Plain language guides on credit, banking, and loans." },
      { title: "AnnualCreditReport.com", url: "https://www.annualcreditreport.com/", note: "The only official site for free credit reports." },
      { title: "Investor.gov compound interest calculator", url: "https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator", note: "Free calculator from the SEC." },
      { title: "Next Gen Personal Finance", url: "https://www.ngpf.org/", note: "Free lessons, activities, and games for teens." },
      { title: "FDIC deposit insurance", url: "https://www.fdic.gov/resources/deposit-insurance", note: "How your bank money is protected." }
    ],
    activity: {
      name: "First Apartment Budget",
      time: "10 minutes",
      format: "Groups of 3 or 4",
      materials: ["Budget tool on this page (or paper and pencil)", "One scenario card per group (below)"],
      setup: "Each group gets a scenario. Their job is to build a monthly budget that pays all the needs, saves at least 10%, and still leaves some fun money.",
      steps: [
        "Read your scenario card and write down the monthly take home pay.",
        "List the needs first: rent, utilities, phone, groceries, car or transportation, insurance.",
        "Assign savings next. Pay yourself first.",
        "Whatever is left goes to wants. If it goes negative, you must cut something. Decide as a group.",
        "Pick one spokesperson to share the hardest cut your group made."
      ],
      scenarios: [
        "Scenario A: Medical assistant earning $17 an hour, 40 hours a week. Take home about $2,350 a month. Rent with a roommate: $750.",
        "Scenario B: College student working part time at $15 an hour, 20 hours a week. Take home about $1,100 a month. Lives in a dorm, meal plan is paid.",
        "Scenario C: Electrical apprentice earning $21 an hour, 40 hours a week. Take home about $2,900 a month. Car payment: $420. Rent alone: $1,150.",
        "Scenario D: Retail shift lead earning $18 an hour, 36 hours a week. Take home about $2,250 a month. Surprise: car needs $600 in repairs this month and there is no emergency fund."
      ],
      debrief: [
        "Which category was hardest to fit? Why?",
        "What would change if you had no roommate?",
        "Group D: how did the surprise repair change everything? That is why the emergency fund comes first."
      ]
    },
    tool: "budget",
    tool2: "compound",
    takeHome: "Track every dollar you spend for 7 days. Write it down or screenshot it. Next week, share one thing that surprised you.",
    discussion: [
      "What is one money habit you have seen in an adult that you want to copy? One you want to avoid?",
      "Why do you think companies make the minimum credit card payment so low?",
      "If you got $1,000 today, what would you do with it and why?"
    ],
    coachNotes: [
      "This is a great session for the business prospects to share a real story about a money mistake or a smart early decision.",
      "Keep examples realistic for Middleburg and Clay County rents.",
      "Do not ask players to share family finances out loud. Keep it about their own future."
    ]
  },

  /* ============================ 2 ============================ */
  {
    id: "taxes",
    num: 2,
    date: "2026-11-14",
    title: "Taxes and Employment",
    presenter: "Open",
    point: "Every player should be able to start a first job without feeling lost: fill out the paperwork, read the paycheck, and know what benefits are worth.",
    goals: [
      "Fill out a Form W4 with confidence",
      "Read every line of a pay stub and explain where the money went",
      "Understand the basics of filing a simple tax return",
      "Know what health insurance and retirement plans are and why they matter",
      "Know what to look for in an employment agreement"
    ],
    agenda: [
      { min: 3, label: "Hook", detail: "Where did my money go?" },
      { min: 10, label: "Teach", detail: "W4, pay stub, tax return, benefits, contracts" },
      { min: 3, label: "Watch", detail: "How to read a pay stub" },
      { min: 10, label: "Activity", detail: "Decode the Paycheck" },
      { min: 2, label: "Wrap", detail: "Take home challenge" }
    ],
    hook: {
      title: "Where did my money go?",
      text: "Say: “You worked 60 hours over two weeks at $15 an hour. That is $900. Your paycheck says $793. Who took $107?” Let them guess. By the end of today they will be able to point to every dollar."
    },
    sections: [
      {
        title: "First day paperwork: Form W4 and Form I9",
        points: [
          "Form W4 tells your employer how much federal income tax to hold back from each check.",
          "Most first jobs: fill in Step 1 (name, address, filing status single) and sign Step 5. Steps 2 through 4 are for multiple jobs, dependents, or extra adjustments.",
          "Too little withheld means you may owe in April. Too much withheld means a bigger refund, which is really your own money returned without interest.",
          "Form I9 proves you are allowed to work in the U.S. Bring original documents such as a passport, or a driver license plus a Social Security card.",
          "Never text or email a photo of your Social Security card to anyone you have not verified."
        ]
      },
      {
        title: "Reading a paycheck",
        points: [
          "Gross pay: hours times hourly rate, before anything comes out.",
          "Federal income tax: based on your W4 and how much you earn.",
          "Social Security (6.2%) and Medicare (1.45%): together called FICA. Everyone pays these.",
          "State income tax: Florida has no state personal income tax, so you will not see this line on a Florida job.",
          "Other deductions: health insurance, retirement contributions, uniforms.",
          "Net pay: what actually lands in your account.",
          "YTD means year to date: totals since January 1."
        ],
        tip: "Florida minimum wage rises to $15 an hour on September 30, 2026, so $15 is a real starting number for this group."
      },
      {
        title: "Filing a basic tax return",
        points: [
          "In January your employer sends a Form W2 showing what you earned and what was withheld. Gig or freelance work comes on a Form 1099.",
          "The tax return (Form 1040) compares what you actually owe to what was already withheld. Then you get a refund or you owe the difference.",
          "The deadline is usually April 15.",
          "Most young workers take the standard deduction, a set amount of income that is not taxed at all. It was $15,750 for a single filer for tax year 2025 and adjusts each year.",
          "File for free: IRS Free File, or free in person help through VITA sites. You do not need to pay for simple returns.",
          "Even if you earned little, file. You may get all your withheld money back."
        ]
      },
      {
        title: "Benefits: health insurance and retirement",
        points: [
          "You can usually stay on a parent's health plan until age 26.",
          "Premium: what you pay every month to have insurance.",
          "Deductible: what you pay for care before insurance starts paying most of the bill.",
          "Copay: a flat fee for a visit. Coinsurance: a percentage you split with the insurer.",
          "Out of pocket maximum: the most you will pay in a year. After that, insurance pays 100% for covered care.",
          "401(k) or 403(b): retirement accounts through work. If the employer offers a match, contribute at least enough to get all of it. A match is free money.",
          "Roth IRA: a retirement account you open yourself once you have earned income. Money grows tax free."
        ]
      },
      {
        title: "Employment contracts and offer letters",
        points: [
          "Most jobs in Florida are at will: you or the employer can end the job at any time for almost any legal reason.",
          "Read: pay rate, schedule, overtime rules, job duties, start date, probation period, benefits start date.",
          "Watch for: non compete clauses, required notice before quitting, repayment of training or signing bonuses if you leave early.",
          "Get the offer in writing. Ask questions before you sign. It is normal and professional."
        ]
      }
    ],
    terms: [
      { t: "Gross pay", d: "Total earnings before any deductions." },
      { t: "Net pay", d: "What you take home after deductions." },
      { t: "Withholding", d: "Tax your employer holds back from each paycheck and sends to the IRS." },
      { t: "FICA", d: "Social Security plus Medicare taxes. 7.65% of your pay." },
      { t: "Form W2", d: "Yearly summary of your wages and taxes from an employer." },
      { t: "Standard deduction", d: "A set amount of income that is not taxed." },
      { t: "Employer match", d: "Money your employer adds to your retirement account when you contribute." }
    ],
    data: [
      { stat: "7.65%", text: "of every paycheck goes to FICA: 6.2% Social Security plus 1.45% Medicare. Your employer pays the same amount on top.", source: "IRS / Social Security Administration", url: "https://www.ssa.gov/" },
      { stat: "$0", text: "state income tax on wages in Florida. Players who move to Georgia, Alabama, or most other states will see a state tax line.", source: "Florida Department of Revenue", url: "https://floridarevenue.com/" },
      { stat: "Age 26", text: "is how long most young adults can stay on a parent's health insurance plan under federal law.", source: "HealthCare.gov", url: "https://www.healthcare.gov/young-adults/children-under-26/" },
      { stat: "Free", text: "tax filing is available through IRS Free File and IRS sponsored VITA sites for most young workers.", source: "IRS", url: "https://www.irs.gov/filing/irs-free-file-do-your-taxes-for-free" }
    ],
    videos: [
      { title: "How to fill out a W4", source: "YouTube search", url: "https://www.youtube.com/results?search_query=how+to+fill+out+w4+first+job", note: "Choose a video made for the current year's form." },
      { title: "How to read your pay stub", source: "YouTube search", url: "https://www.youtube.com/results?search_query=how+to+read+your+pay+stub", note: "Play while players look at the sample stub below." },
      { title: "Health insurance terms explained", source: "YouTube search", url: "https://www.youtube.com/results?search_query=deductible+copay+coinsurance+explained", note: "Good 3 minute explainer for the benefits section." }
    ],
    resources: [
      { title: "IRS: About Form W4", url: "https://www.irs.gov/forms-pubs/about-form-w-4", note: "Current form and instructions." },
      { title: "IRS Tax Withholding Estimator", url: "https://www.irs.gov/individuals/tax-withholding-estimator", note: "Checks whether your W4 is set right." },
      { title: "IRS Free File", url: "https://www.irs.gov/filing/irs-free-file-do-your-taxes-for-free", note: "File a federal return for free." },
      { title: "Find free tax help (VITA)", url: "https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers", note: "In person, volunteer tax help." },
      { title: "HealthCare.gov glossary", url: "https://www.healthcare.gov/glossary/", note: "Every insurance word in plain English." },
      { title: "my Social Security account", url: "https://www.ssa.gov/myaccount/", note: "See your earnings record as it builds." }
    ],
    handout: "paystub",
    activity: {
      name: "Decode the Paycheck",
      time: "10 minutes",
      format: "Pairs",
      materials: ["Sample pay stub below (on screen or printed)", "Pencil and scratch paper", "Blank Form W4 from IRS.gov (optional)"],
      setup: "Show the sample pay stub. Each pair works through the questions and must be able to point to the exact line that answers each one.",
      steps: [
        "Find the gross pay. Show how it was calculated.",
        "Add up every deduction. Does gross minus deductions equal net pay?",
        "Which deduction would change if she updated her W4?",
        "Which deductions would stay the same no matter what she put on her W4?",
        "Bonus: she wants to put 5% into a 401(k) with a 5% employer match. How much comes out of her check? How much does the employer add?"
      ],
      debrief: [
        "What surprised you most on the stub?",
        "Why is a big tax refund not really a gift?",
        "Answer key for the bonus: 5% of $900 is $45 from her check, and the employer adds another $45 for a total of $90 every two weeks."
      ]
    },
    takeHome: "Ask a parent, guardian, or working adult if you can look at an old pay stub together (they can cover the dollar amounts). Find gross pay, FICA, and net pay on it.",
    discussion: [
      "Would you rather get a bigger check each payday or a bigger refund in April? Why?",
      "What benefits would matter most to you in a first full time job?",
      "What would you ask before signing a job offer?"
    ],
    coachNotes: [
      "A local tax preparer, HR manager, or VITA volunteer would be an ideal guest for this session.",
      "Tax numbers change every year. Check IRS.gov the week before presenting."
    ]
  },

  /* ============================ 3 ============================ */
  {
    id: "legal",
    num: 3,
    date: "2026-11-21",
    title: "Legal Documents",
    presenter: "Tenise Haynes, Realtor",
    point: "The goal is not to become a lawyer. It is knowing what questions to ask before you sign. Once your name is on the line, you own it.",
    goals: [
      "Read an apartment lease and spot the terms that cost money",
      "Know the numbers that matter in a car purchase agreement",
      "Understand the basic steps and documents in buying a home",
      "Read a loan agreement for APR, term, and total cost",
      "Tell the difference between a warranty and a service contract",
      "Leave with a list of questions to ask before signing anything"
    ],
    agenda: [
      { min: 3, label: "Hook", detail: "The signature test" },
      { min: 10, label: "Teach", detail: "Leases, cars, homes, loans, contracts, warranties" },
      { min: 2, label: "Watch", detail: "Short clip on lease red flags or car buying" },
      { min: 12, label: "Activity", detail: "Red Flag Hunt" },
      { min: 3, label: "Wrap", detail: "The 8 questions to ask" }
    ],
    hook: {
      title: "The signature test",
      text: "Hold up a blank sheet and a pen. Ask: “Would you sign this if I told you I would fill in the rest later?” Everyone says no. Then say: “Most people do basically that every time they sign a lease or car contract without reading it.”"
    },
    sections: [
      {
        title: "Apartment leases",
        points: [
          "Lease term: how long you are committed. Breaking it early can cost one or two months of rent or more.",
          "Rent, due date, grace period, and late fees. Know the exact dollar amount of a late fee.",
          "Security deposit: how much, and what can be deducted. In Florida, a landlord must return it within 15 days, or send written notice within 30 days explaining any claim on it.",
          "Move in inspection: photograph and video every room before you move in. Email the photos to yourself and the landlord.",
          "Who fixes what: repairs, pests, appliances, lawn.",
          "Rules on guests, pets, subletting, parking, and noise.",
          "Renewal: does it renew automatically? How much notice do you need to give to move out?",
          "Everyone who signs is responsible for the full rent, not just their share. Choose roommates carefully."
        ]
      },
      {
        title: "Car purchase agreements",
        points: [
          "Negotiate the out the door price (price plus taxes, tag, title, and all fees), not the monthly payment.",
          "Get preapproved for a loan at a bank or credit union before visiting the dealer. It gives you a rate to beat.",
          "Watch for add ons you did not ask for: extended warranties, GAP insurance, paint protection, VIN etching. All are optional.",
          "Used cars at dealers must show a Buyers Guide window sticker. “As is” means no warranty from the dealer.",
          "There is no automatic three day cooling off period for cars bought at a dealership. When you sign, it is done.",
          "Get an independent mechanic to inspect any used car before you buy it."
        ]
      },
      {
        title: "Real estate purchase documents (the basics)",
        points: [
          "Purchase agreement: the offer. Price, earnest money deposit, closing date, and contingencies.",
          "Contingencies protect the buyer: inspection, financing, and appraisal. They let you back out if something goes wrong.",
          "Loan Estimate: the lender must give it within 3 business days of your application. Compare these from different lenders.",
          "Closing Disclosure: final loan terms. You must receive it at least 3 business days before closing. Compare it to the Loan Estimate.",
          "Title insurance protects against problems with ownership history.",
          "A realtor, lender, inspector, and closing agent each have a job. Ask each of them questions."
        ],
        tip: "Tenise: a quick story about a buyer who was saved by an inspection contingency will stick with them more than any slide."
      },
      {
        title: "Loan agreements",
        points: [
          "Find four numbers: amount borrowed, APR, length of loan, and total you will pay back.",
          "Prepayment penalty: a fee for paying off early. Avoid loans that have one.",
          "Cosigning means you owe the entire debt if the other person does not pay. It is on your credit report too.",
          "Payday loans and title loans can carry yearly rates of several hundred percent. Avoid them."
        ]
      },
      {
        title: "Service contracts and warranties",
        points: [
          "Service contract (phone plan, gym, internet): check the length, the cancellation fee, and whether it renews automatically.",
          "A warranty comes with the product and is included in the price. A “full” warranty is stronger than a “limited” one.",
          "An extended warranty is really a service contract you pay extra for. Often not worth it on small electronics.",
          "Keep receipts and warranty cards. Take a photo of each one."
        ]
      },
      {
        title: "The 8 questions to ask before signing anything",
        points: [
          "What is the total cost, including every fee?",
          "How long am I committed?",
          "How do I get out early, and what does it cost?",
          "What happens if I pay late?",
          "Does it renew automatically?",
          "Who is responsible for repairs or problems?",
          "Can I take this home and read it before I sign?",
          "Can I have a copy of everything I sign?"
        ]
      }
    ],
    terms: [
      { t: "Security deposit", d: "Money held by a landlord to cover damage or unpaid rent. Returned at move out if there is no valid claim." },
      { t: "Earnest money", d: "A deposit a home buyer makes to show the offer is serious." },
      { t: "Contingency", d: "A condition that must be met for a contract to go forward." },
      { t: "Cosigner", d: "A person who promises to repay a loan if the borrower does not." },
      { t: "As is", d: "Sold with no warranty. Any problems after purchase are yours." },
      { t: "Automatic renewal", d: "A contract that restarts on its own unless you cancel in time." }
    ],
    data: [
      { stat: "15 days", text: "is how long a Florida landlord has to return a security deposit when there is no claim on it. With a claim, they must send written notice within 30 days.", source: "Florida Statutes, Section 83.49", url: "https://www.flsenate.gov/Laws/Statutes/2024/83.49" },
      { stat: "0 days", text: "of cooling off period for most car purchases. The FTC three day rule does not cover cars bought at a dealer's lot.", source: "Federal Trade Commission", url: "https://consumer.ftc.gov/articles/buyers-remorse-ftcs-cooling-rule-may-help" },
      { stat: "3 days", text: "before a home closing is the minimum time you must have the Closing Disclosure in hand to review.", source: "Consumer Financial Protection Bureau", url: "https://www.consumerfinance.gov/owning-a-home/closing-disclosure/" }
    ],
    videos: [
      { title: "Lease red flags for first time renters", source: "YouTube search", url: "https://www.youtube.com/results?search_query=apartment+lease+red+flags+first+time+renter", note: "Preview and choose one under 6 minutes." },
      { title: "Car dealership tricks to avoid", source: "YouTube search", url: "https://www.youtube.com/results?search_query=car+dealership+finance+office+tricks+to+avoid", note: "Focus on the finance office add ons." },
      { title: "Home buying process step by step", source: "YouTube search", url: "https://www.youtube.com/results?search_query=home+buying+process+explained+first+time+buyer", note: "Optional, Tenise may prefer her own walkthrough." }
    ],
    resources: [
      { title: "CFPB: Buying a house", url: "https://www.consumerfinance.gov/owning-a-home/", note: "Step by step guide and sample Loan Estimate." },
      { title: "FTC: Buying a used car from a dealer", url: "https://consumer.ftc.gov/articles/buying-used-car-dealer", note: "Buyers Guide, warranties, and inspections." },
      { title: "FTC: Warranties", url: "https://consumer.ftc.gov/articles/warranties", note: "Full versus limited, and extended warranties." },
      { title: "Florida Landlord Tenant Law (Chapter 83)", url: "https://www.flsenate.gov/Laws/Statutes/2024/Chapter83", note: "The actual rules for Florida rentals." },
      { title: "CFPB: Auto loans", url: "https://www.consumerfinance.gov/consumer-tools/auto-loans/", note: "How to shop for a car loan." }
    ],
    handout: "lease",
    activity: {
      name: "Red Flag Hunt",
      time: "12 minutes",
      format: "Pairs",
      materials: ["Sample lease excerpt below (on screen or printed)", "Highlighter or pen"],
      setup: "The sample lease has at least six clauses that should make a renter stop and ask questions. Pairs have 7 minutes to find as many as they can and write the question they would ask the landlord for each.",
      steps: [
        "Read the lease excerpt once all the way through without marking anything.",
        "Read it again and mark any clause that costs money, limits your rights, or is unclear.",
        "For each flag, write the question you would ask before signing.",
        "Compare with another pair. Did they find any you missed?",
        "Coach reveals the answer key. Tenise shares which ones she sees most often in real life."
      ],
      debrief: [
        "Which red flag would have cost you the most money?",
        "Which one was hardest to spot?",
        "What would you do if the landlord refused to change a clause?"
      ]
    },
    takeHome: "Find one contract in your life: a phone plan, a gym membership, a streaming service, or an app's terms. Find the cancellation policy and whether it renews automatically.",
    discussion: [
      "Why do you think contracts are written in such hard language?",
      "Would you cosign a car loan for a close friend? Why or why not?",
      "What is the most expensive thing you think you will sign for in the next five years?"
    ],
    coachNotes: [
      "Let Tenise lead the real estate section and the Red Flag Hunt answer key.",
      "Encourage players to say out loud: “Can I take this home and read it first?” Practicing the sentence makes it easier to say later."
    ]
  },

  /* ============================ 4 ============================ */
  {
    id: "maintenance",
    num: 4,
    date: "2026-12-05",
    title: "Home and Vehicle Maintenance",
    presenter: "Open",
    point: "These skills can save hundreds or thousands of dollars, and they keep you safe when you are stuck on the side of the road or something goes wrong at home.",
    goals: [
      "Change a tire safely, step by step",
      "Jump start a car in the correct cable order",
      "Check oil level and tire pressure",
      "Find and use the water, gas, and electric shutoffs in a home",
      "Replace an HVAC filter facing the right way",
      "Name and use the basic hand tools every home should have"
    ],
    agenda: [
      { min: 3, label: "Hook", detail: "Stranded at night" },
      { min: 8, label: "Teach", detail: "Car skills, then home shutoffs and tools" },
      { min: 3, label: "Watch", detail: "Tire change or jump start demo" },
      { min: 14, label: "Activity", detail: "Four station rotation" },
      { min: 2, label: "Wrap", detail: "Take home challenge" }
    ],
    hook: {
      title: "Stranded at night",
      text: "Ask: “It is 10 p.m., you are on State Road 21, and your tire is flat. Your phone is at 8%. Who can change it?” Count hands. Then: “By the end of today, every hand goes up.”"
    },
    sections: [
      {
        title: "Changing a tire",
        points: [
          "Pull fully off the road onto flat, solid ground. Hazard lights on, parking brake on.",
          "Find the spare, jack, and lug wrench (usually under the trunk floor). Check the owner's manual for the jack point.",
          "Loosen the lug nuts about half a turn while the tire is still on the ground.",
          "Jack the car up until the flat tire is a few inches off the ground. Never put any part of your body under a car on a jack.",
          "Remove the lug nuts and the flat. Mount the spare.",
          "Hand tighten the lug nuts, lower the car, then fully tighten in a star pattern.",
          "Most compact spares are only for short distances at lower speeds (often 50 mph). Check the sticker on the spare and get the tire fixed soon."
        ]
      },
      {
        title: "Jump starting a battery",
        points: [
          "Park the working car close, both cars off.",
          "1. Red clamp to the dead battery's positive (+) terminal.",
          "2. Other red clamp to the good battery's positive (+) terminal.",
          "3. Black clamp to the good battery's negative (NEG) terminal.",
          "4. Last black clamp to unpainted metal on the dead car's engine, away from the battery.",
          "Start the good car, wait a few minutes, then start the dead car. Remove clamps in reverse order.",
          "A portable jump starter pack (around $50 to $100) lets you do this with no second car."
        ],
        tip: "Memory line: Red to dead, red to good, black to good, black to metal."
      },
      {
        title: "Checking oil and tire pressure",
        points: [
          "Oil: engine off and cool, car on level ground. Pull the dipstick, wipe it, push it back in, pull it again. Oil should be between the two marks.",
          "Oil should look amber to dark brown. Milky or gritty oil means see a mechanic.",
          "Follow the owner's manual for oil change timing. Many modern cars go 5,000 to 10,000 miles.",
          "Correct tire pressure is on the sticker inside the driver's door, not the number on the tire.",
          "Check pressure monthly when tires are cold, using a $5 gauge.",
          "Penny test: put Lincoln's head upside down in the tread. If you can see all of his head, the tires are worn out."
        ]
      },
      {
        title: "Home shutoffs: water, gas, electricity",
        points: [
          "Water: the main shutoff is usually where the water line enters the house, in the garage, or near the water heater. Turn clockwise to close. Sinks and toilets have their own small valves too.",
          "Gas: the shutoff is next to the gas meter. A quarter turn so the handle is crosswise to the pipe closes it.",
          "If you smell gas, do not flip switches or light anything. Leave the house and call 911 or the gas company from outside. Only the gas company should turn it back on.",
          "Electricity: the breaker panel has a main breaker at the top. Each breaker is labeled for a room or appliance.",
          "A tripped breaker sits in the middle. Push it fully off, then back on.",
          "Know where all three are before an emergency. Do this the first week in any new home."
        ]
      },
      {
        title: "HVAC filters and basic hand tools",
        points: [
          "Replace the air filter every 1 to 3 months. More often with pets or allergies.",
          "The size is printed on the edge of the old filter. Take a photo before you shop.",
          "The arrow on the filter points toward the unit, in the direction the air flows.",
          "Starter toolkit: tape measure, Phillips and flathead screwdrivers, adjustable wrench, pliers, hammer, level, utility knife, flashlight, and a stud finder.",
          "Righty tighty, lefty loosey works for almost every screw, bolt, and valve."
        ]
      }
    ],
    terms: [
      { t: "Lug nuts", d: "The nuts that hold a wheel onto the car." },
      { t: "Jack point", d: "The reinforced spot under the car where the jack must go." },
      { t: "PSI", d: "Pounds per square inch. The unit for tire pressure." },
      { t: "Dipstick", d: "The metal stick used to check the engine oil level." },
      { t: "Breaker", d: "A switch in the electrical panel that shuts off power when a circuit is overloaded." },
      { t: "MERV", d: "A rating for air filters. Higher numbers catch smaller particles." }
    ],
    data: [
      { stat: "Up to 3%", text: "better gas mileage just from keeping tires at the right pressure.", source: "U.S. Department of Energy, FuelEconomy.gov", url: "https://www.fueleconomy.gov/feg/maintain.jsp" },
      { stat: "5% to 15%", text: "less air conditioner energy use by replacing a dirty filter with a clean one.", source: "U.S. Department of Energy", url: "https://www.energy.gov/energysaver/maintaining-your-air-conditioner" },
      { stat: "2/32 inch", text: "of tread is the point where tires are considered worn out. That is where the penny test comes from.", source: "NHTSA tire safety", url: "https://www.nhtsa.gov/equipment/tires" },
      { stat: "$75 to $150+", text: "is a common price for a roadside tire change or jump start if you pay for a service call. Doing it yourself costs nothing. Prices vary by area.", source: "Typical local estimate", url: "" }
    ],
    videos: [
      { title: "How to change a flat tire", source: "YouTube search", url: "https://www.youtube.com/results?search_query=how+to+change+a+flat+tire+step+by+step", note: "Pick one that shows loosening lug nuts before jacking." },
      { title: "How to jump start a car", source: "YouTube search", url: "https://www.youtube.com/results?search_query=how+to+jump+start+a+car+safely", note: "Confirm it shows the final ground on metal, not the dead battery." },
      { title: "How to shut off water, gas, and power", source: "YouTube search", url: "https://www.youtube.com/results?search_query=how+to+shut+off+main+water+gas+electricity+house", note: "Good for players who have never seen a breaker panel." }
    ],
    resources: [
      { title: "NHTSA: Tire safety", url: "https://www.nhtsa.gov/equipment/tires", note: "Pressure, tread, and age." },
      { title: "FuelEconomy.gov: Keeping your car in shape", url: "https://www.fueleconomy.gov/feg/maintain.jsp", note: "Simple maintenance that saves money." },
      { title: "Energy Saver: Air conditioner maintenance", url: "https://www.energy.gov/energysaver/maintaining-your-air-conditioner", note: "Filters, coils, and more." },
      { title: "Ready.gov: Home safety and utilities", url: "https://www.ready.gov/", note: "Emergency planning for homes." }
    ],
    activity: {
      name: "Four Station Rotation",
      time: "14 minutes (about 3 minutes per station)",
      format: "Four groups rotate on a whistle",
      materials: ["One or two cars in the parking lot (with owner permission)", "Tire pressure gauge and a penny", "Jumper cables (not connected to power) or a jump starter pack", "Photos of a breaker panel, water main, and gas meter, or a real one if available", "A spare HVAC filter"],
      setup: "Set up four stations with an adult at each one. Groups rotate every 3 minutes. Every player must physically do the task, not just watch.",
      steps: [
        "Station 1, Tires: find the pressure sticker, check one tire with the gauge, and do the penny test.",
        "Station 2, Oil: pull the dipstick, read the level, and explain it back to the station leader.",
        "Station 3, Jump start: say the four clamp steps out loud while placing the cable clamps on the correct terminals of a car that is off.",
        "Station 4, Home: identify the water main, gas shutoff, and main breaker from photos, and show which way the filter arrow faces.",
        "Back together: each group names one thing they did for the first time today."
      ],
      debrief: [
        "Which station felt most useful?",
        "Who would now feel confident helping a friend with a dead battery?",
        "Where is the water shutoff in your house? If you do not know, that is tonight's job."
      ]
    },
    takeHome: "Find the water main shutoff, the breaker panel, and the HVAC filter in your home. Take a photo of each and note the filter size.",
    discussion: [
      "What is something at home or on a car that you always let someone else handle?",
      "What should go in an emergency kit that lives in your car?",
      "Why is it important to learn these before you need them?"
    ],
    coachNotes: [
      "Recruit a parent who is a mechanic or works in trades to run the car stations.",
      "Hold the session outdoors if possible. Have a rain plan using photos and videos.",
      "Safety first: no one goes under a car and cables are never connected to a live battery during practice."
    ]
  },

  /* ============================ 5 ============================ */
  {
    id: "cooking",
    num: 5,
    date: "2026-12-12",
    title: "Cooking and Nutrition",
    presenter: "Tenise Haynes",
    point: "Cooking is one of the highest return life skills. It saves money every single day, fuels your body for sport and school, and it is a skill you will use for life.",
    goals: [
      "Leave with 15 simple, healthy meals you can cook",
      "Read a nutrition label in under 30 seconds",
      "Shop for groceries with a list and a budget",
      "Store food safely and know the temperature danger zone",
      "Plan a week of inexpensive meals"
    ],
    agenda: [
      { min: 3, label: "Hook", detail: "Drive through math" },
      { min: 9, label: "Teach", detail: "Labels, shopping, food safety, meal planning" },
      { min: 3, label: "Watch", detail: "A quick meal prep video" },
      { min: 12, label: "Activity", detail: "The $50 Week Challenge" },
      { min: 3, label: "Wrap", detail: "Pick your first recipe" }
    ],
    hook: {
      title: "Drive through math",
      text: "Ask: “How much does a fast food meal cost now?” Most will say $10 to $14. Multiply by 5 days, then by 52 weeks. That is $2,600 to $3,600 a year for one meal a day. A home cooked meal often costs $2 to $4 a serving."
    },
    sections: [
      {
        title: "Reading nutrition labels",
        points: [
          "Start with serving size. Every number on the label is for one serving, and the package may hold several.",
          "Use the 5 and 20 rule on % Daily Value: 5% or less is low, 20% or more is high.",
          "Aim high: fiber, protein, vitamin D, calcium, iron, potassium.",
          "Aim low: added sugars, sodium, saturated fat.",
          "Ingredients are listed from most to least by weight. If sugar is in the first three, it is a treat.",
          "Adults should keep sodium under 2,300 mg a day. One can of soup can be half of that."
        ]
      },
      {
        title: "Fueling an athlete",
        points: [
          "Use the MyPlate model: half the plate fruits and vegetables, a quarter lean protein, a quarter whole grains or starch.",
          "Carbohydrates are your main fuel for practice and games. Do not skip them.",
          "Protein helps muscles recover. Spread it across the day: eggs, chicken, fish, beans, Greek yogurt, milk.",
          "Hydrate all day, not just at practice. Pale yellow urine is the goal.",
          "Eat a meal 2 to 3 hours before a game, or a light snack 30 to 60 minutes before."
        ]
      },
      {
        title: "Grocery shopping efficiently",
        points: [
          "Plan meals first, then write a list. Shop the list.",
          "Never shop hungry.",
          "Compare the unit price (price per ounce) on the shelf tag, not the sticker price.",
          "Store brands are usually the same quality for less.",
          "Frozen fruits and vegetables are just as nutritious as fresh and do not spoil.",
          "Buy staples in bulk: rice, oats, dried beans, pasta, frozen chicken."
        ]
      },
      {
        title: "Storing food safely",
        points: [
          "Four steps: Clean, Separate, Cook, Chill.",
          "The danger zone is 40°F to 140°F. Bacteria multiply fast in that range.",
          "Refrigerate leftovers within 2 hours (1 hour if it is over 90°F outside, like a tailgate).",
          "Fridge at 40°F or below. Freezer at 0°F.",
          "Leftovers are good for 3 to 4 days in the fridge.",
          "Use a food thermometer: chicken 165°F, ground meat 160°F, fish and whole cuts of beef or pork 145°F.",
          "Use separate cutting boards for raw meat and for produce."
        ]
      },
      {
        title: "15 healthy meals to learn",
        points: [
          "Breakfast: overnight oats with fruit; veggie egg scramble with toast; Greek yogurt parfait; peanut butter banana smoothie.",
          "Lunch: turkey and veggie wraps; chickpea or tuna salad; black bean quesadillas.",
          "Dinner: sheet pan chicken with vegetables; turkey tacos; chicken and rice burrito bowls; beef or turkey chili; vegetable stir fry with chicken; pasta with meat sauce and spinach; baked salmon with rice and green beans; egg fried rice.",
          "Most of these take 30 minutes or less and cost $2 to $4 a serving.",
          "Cook once, eat twice: double the recipe and pack lunches."
        ],
        tip: "Tenise: demo one meal live if a kitchen is available. Egg fried rice or quesadillas both work in under 10 minutes."
      },
      {
        title: "Planning inexpensive weekly meals",
        points: [
          "Pick 4 or 5 dinners. Plan for leftovers on the other nights.",
          "Choose meals that share ingredients: one bag of peppers for tacos, stir fry, and eggs.",
          "Build around cheap proteins: eggs, beans, lentils, chicken thighs, canned tuna, ground turkey.",
          "Check what is already in the fridge before you shop.",
          "Spend one hour on Sunday prepping: cook rice, chop vegetables, portion snacks."
        ]
      }
    ],
    terms: [
      { t: "Serving size", d: "The amount all label numbers are based on." },
      { t: "% Daily Value", d: "How much of a day's recommended amount one serving provides." },
      { t: "Unit price", d: "Price per ounce, pound, or count. The fair way to compare sizes." },
      { t: "Danger zone", d: "40°F to 140°F, where bacteria grow fastest." },
      { t: "Meal prep", d: "Cooking or preparing food ahead of time for the week." }
    ],
    data: [
      { stat: "5% / 20%", text: "The quick label rule: 5% Daily Value or less is low, 20% or more is high.", source: "U.S. Food and Drug Administration", url: "https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label" },
      { stat: "2 hours", text: "is the most time perishable food should sit out. One hour when it is above 90°F.", source: "FoodSafety.gov", url: "https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts" },
      { stat: "165°F", text: "is the safe internal temperature for all chicken and turkey.", source: "FoodSafety.gov", url: "https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures" },
      { stat: "$2,600+", text: "a year is what one $10 fast food meal each weekday adds up to. Cooking the same meal at home often costs a third of that.", source: "Calculated example", url: "" }
    ],
    videos: [
      { title: "Easy meal prep for beginners", source: "YouTube search", url: "https://www.youtube.com/results?search_query=easy+cheap+meal+prep+for+beginners", note: "Choose one with a budget focus." },
      { title: "How to read a nutrition label", source: "YouTube search", url: "https://www.youtube.com/results?search_query=how+to+read+a+nutrition+facts+label", note: "Pause on the serving size part." },
      { title: "Basic knife skills", source: "YouTube search", url: "https://www.youtube.com/results?search_query=basic+knife+skills+for+beginners", note: "Optional if doing a live demo." }
    ],
    resources: [
      { title: "MyPlate", url: "https://www.myplate.gov/", note: "Build a plate, plus free recipes and a meal planning app." },
      { title: "FDA: Reading the Nutrition Facts label", url: "https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label", note: "The official guide." },
      { title: "FoodSafety.gov: Safe temperatures", url: "https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures", note: "Printable chart for your kitchen." },
      { title: "Budget Bytes", url: "https://www.budgetbytes.com/", note: "Recipes with cost per serving listed." },
      { title: "MyPlate Kitchen recipes", url: "https://www.myplate.gov/myplate-kitchen", note: "Free healthy recipes searchable by ingredient." }
    ],
    activity: {
      name: "The $50 Week Challenge",
      time: "12 minutes",
      format: "Groups of 3 or 4",
      materials: ["Grocery price list tool on this page", "Paper to write the meal plan"],
      setup: "Each group has $50 to feed one person dinner for 5 nights. Use the grocery list tool below to shop. Every dinner needs a protein, a vegetable, and a grain or starch.",
      steps: [
        "Pick 5 dinners from the 15 meal list or invent your own.",
        "Check off the groceries you need in the tool. Watch the total.",
        "If you go over $50, swap an ingredient or reuse one across meals.",
        "Write the 5 dinners and which ingredients each one uses.",
        "Share: which ingredient did your group use the most times?"
      ],
      debrief: [
        "What was the most expensive item you bought? Was it worth it?",
        "How did reusing ingredients help your budget?",
        "Which meal will you actually cook at home this week?"
      ]
    },
    tool: "grocery",
    takeHome: "Cook one meal from the list for your family or yourself this week. Take a picture and share it with the team chat.",
    discussion: [
      "What is a meal someone in your family makes that you want to learn?",
      "What gets in the way of cooking at home? How could you solve it?",
      "What do you eat before a game? Has today changed that?"
    ],
    coachNotes: [
      "Tenise is leading this one. Ask about any food allergies before any tasting or demo.",
      "Grocery prices in the tool are sample prices. Adjust them to a current local ad if you like."
    ]
  },

  /* ============================ 6 ============================ */
  {
    id: "homemaker",
    num: 6,
    date: "2026-12-19",
    title: "Homemaker Skills",
    presenter: "Open",
    point: "Knowing how a home works lets you fix small problems yourself, spot big ones early, and know exactly when to call a professional.",
    goals: [
      "Fix a running toilet and clear a clogged drain",
      "Reset a tripped breaker and a GFCI outlet safely",
      "Know simple HVAC care and thermostat habits",
      "Spot signs of roof and structural trouble",
      "Care for a lawn and start a small garden",
      "Keep important papers organized and safe"
    ],
    agenda: [
      { min: 2, label: "Hook", detail: "Drip math" },
      { min: 12, label: "Teach", detail: "Plumbing, electric, HVAC, roof, structure, yard, records" },
      { min: 3, label: "Watch", detail: "Fixing a running toilet" },
      { min: 10, label: "Activity", detail: "Fix It, Call It, or Get Out" },
      { min: 3, label: "Wrap", detail: "Take home challenge" }
    ],
    hook: {
      title: "Drip math",
      text: "Tap a pen on the table once a second for 10 seconds. Say: “A faucet dripping that fast wastes over 3,000 gallons a year. A running toilet can waste 200 gallons a day. Most of these fixes cost under $20.”"
    },
    sections: [
      {
        title: "Basic plumbing repairs",
        points: [
          "Every sink and toilet has its own shutoff valve underneath. Turn it off before any repair.",
          "Running toilet: usually the flapper in the tank. Replace it for about $5 to $10.",
          "Leak test: put a few drops of food coloring in the toilet tank. If color shows up in the bowl without flushing, the flapper leaks.",
          "Clogged sink: use a cup plunger. Clogged toilet: use a flange plunger (it has an extra rubber lip).",
          "Hair clogs: a $3 plastic drain snake works better than chemicals.",
          "Avoid chemical drain cleaners. They can damage pipes and burn skin.",
          "Never flush wipes, even the ones labeled flushable."
        ]
      },
      {
        title: "Electrical knowledge",
        points: [
          "If a breaker trips, unplug what was running, then reset the breaker. If it trips again, call an electrician.",
          "GFCI outlets (the ones with Test and Reset buttons) protect you near water: kitchens, bathrooms, outside. If one is dead, press Reset.",
          "Warm outlets, burning smells, buzzing, or flickering lights are warning signs. Call a pro.",
          "Do not plug power strips into other power strips. Do not run cords under rugs.",
          "Any work inside a wall, outlet, or panel is for a licensed electrician."
        ]
      },
      {
        title: "HVAC knowledge",
        points: [
          "Change the filter every 1 to 3 months.",
          "Keep 2 feet of clear space around the outdoor unit. No plants or trash against it.",
          "Summer: about 78°F when home is a good energy saving setting. Set it higher when you are away.",
          "Turning the thermostat back 7° to 10° for 8 hours a day can save up to 10% a year on heating and cooling.",
          "Water around the indoor unit usually means a clogged drain line. Turn the system off and call for service.",
          "Get a professional tune up once a year, before summer."
        ]
      },
      {
        title: "Spotting roofing and structural issues",
        points: [
          "From the ground, look for missing, curling, or cracked shingles and damaged flashing around vents and chimneys.",
          "Granules in the gutters mean shingles are wearing out.",
          "Inside, brown water stains on ceilings are often a roof leak.",
          "Structure warning signs: cracks wider than a quarter inch, stair step cracks in block or brick, doors and windows that suddenly stick, sloping floors.",
          "Never walk on a roof. After a storm, take photos from the ground and call your insurance and a licensed roofer."
        ]
      },
      {
        title: "Lawn care, gardening, and food preservation",
        points: [
          "Mow high and never cut more than one third of the grass blade at a time.",
          "Water early in the morning, deeply, one or two times a week. Not every day.",
          "Easy first garden in Florida: herbs, peppers, cherry tomatoes, and leafy greens in the cooler months.",
          "Food preservation: freezing is the easiest. Refrigerator pickles are a great first project.",
          "Home canning must follow tested recipes from the National Center for Home Food Preservation to be safe."
        ]
      },
      {
        title: "Personal organization and record keeping",
        points: [
          "Keep in a fireproof box: birth certificate, Social Security card, passport, car title, insurance policies.",
          "Keep tax returns and records for at least 3 years.",
          "Keep pay stubs until you match them to your W2.",
          "Scan or photograph important documents into a secure cloud folder.",
          "Use a password manager and turn on two step verification for email and banking.",
          "One folder for each area: school, medical, money, car, home."
        ]
      }
    ],
    terms: [
      { t: "Flapper", d: "The rubber seal at the bottom of a toilet tank." },
      { t: "GFCI", d: "Ground fault circuit interrupter. An outlet that cuts power fast to prevent shock." },
      { t: "Flashing", d: "Metal strips that seal gaps where the roof meets vents, walls, or chimneys." },
      { t: "Condensate line", d: "The pipe that drains water away from the indoor AC unit." },
      { t: "Two step verification", d: "A second code needed to log in, usually sent to your phone." }
    ],
    data: [
      { stat: "10,000 gallons", text: "of water can be wasted every year by the leaks in an average household.", source: "EPA WaterSense", url: "https://www.epa.gov/watersense/fix-leak-week" },
      { stat: "10%", text: "of homes have leaks that waste 90 gallons or more every day.", source: "EPA WaterSense", url: "https://www.epa.gov/watersense/fix-leak-week" },
      { stat: "Up to 10%", text: "a year saved on heating and cooling by setting the thermostat back 7° to 10° for 8 hours a day.", source: "U.S. Department of Energy", url: "https://www.energy.gov/energysaver/programmable-thermostats" },
      { stat: "3 years", text: "is the general period the IRS says to keep tax records.", source: "IRS", url: "https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records" }
    ],
    videos: [
      { title: "How to fix a running toilet", source: "YouTube search", url: "https://www.youtube.com/results?search_query=how+to+fix+a+running+toilet+flapper", note: "Most are under 5 minutes." },
      { title: "How to reset a GFCI outlet and breaker", source: "YouTube search", url: "https://www.youtube.com/results?search_query=how+to+reset+gfci+outlet+and+tripped+breaker", note: "Short and very practical." },
      { title: "Signs of roof damage from the ground", source: "YouTube search", url: "https://www.youtube.com/results?search_query=signs+of+roof+damage+homeowner+inspection+from+ground", note: "Great for Florida storm season." }
    ],
    resources: [
      { title: "EPA WaterSense: Fix a Leak", url: "https://www.epa.gov/watersense/fix-leak-week", note: "Leak checks and simple fixes." },
      { title: "Energy Saver: Thermostats", url: "https://www.energy.gov/energysaver/programmable-thermostats", note: "Settings that save money." },
      { title: "UF/IFAS Solutions for Your Life", url: "https://sfyl.ifas.ufl.edu/", note: "Florida lawn, garden, and home advice." },
      { title: "National Center for Home Food Preservation", url: "https://nchfp.uga.edu/", note: "Safe, tested canning and freezing guides." },
      { title: "Electrical Safety Foundation", url: "https://www.esfi.org/", note: "Home electrical safety tips." },
      { title: "IRS: How long to keep records", url: "https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records", note: "Official record keeping guide." }
    ],
    handout: "fixit",
    activity: {
      name: "Fix It, Call It, or Get Out",
      time: "10 minutes",
      format: "Teams of 3 or 4, then whole group",
      materials: ["Scenario cards below (read aloud or print and cut)", "Three signs on the wall: FIX IT, CALL IT, GET OUT"],
      setup: "Read a home problem out loud. Teams have 20 seconds to decide: Fix It yourself, Call It in to a professional, or Get Out and call 911. Teams walk to the sign or hold up a card.",
      steps: [
        "Read a scenario card.",
        "Teams discuss for 20 seconds and choose.",
        "Reveal the answer and one sentence of why.",
        "Award a point for each correct answer. Play all 12 cards.",
        "Winning team picks the music for the next practice."
      ],
      debrief: [
        "Which scenario surprised you?",
        "What is the danger in trying to Fix It when you should Call It?",
        "What should you always do first before fixing anything with water or power?"
      ]
    },
    takeHome: "Do the food coloring leak test on one toilet at home. Then find the shutoff valve under that toilet and one sink.",
    discussion: [
      "What is a home problem you have seen someone fix? What did they do?",
      "Why do you think people wait too long to call a professional?",
      "Where do your important documents live right now?"
    ],
    coachNotes: [
      "A parent who is a plumber, electrician, or HVAC tech would be a great guest.",
      "Bring a toilet flapper and plunger as props. Holding the real thing makes it stick."
    ]
  },

  /* ============================ 7 ============================ */
  {
    id: "communication",
    num: 7,
    date: "2027-01-02",
    title: "Communication",
    presenter: "Open",
    point: "Strong communicators tend to outperform equally skilled peers. On a team, at a job, or in a relationship, how you say it matters as much as what you say.",
    goals: [
      "Write a clear, professional email",
      "Speak to a group using a simple structure",
      "Negotiate with preparation instead of pressure",
      "Listen actively so people feel heard",
      "Handle conflict without making it worse",
      "Give and receive feedback like a leader",
      "Recognize and manage emotions in the moment"
    ],
    agenda: [
      { min: 2, label: "Hook", detail: "Read the room" },
      { min: 10, label: "Teach", detail: "Email, speaking, listening, conflict, feedback" },
      { min: 3, label: "Watch", detail: "Active listening or public speaking clip" },
      { min: 12, label: "Activity", detail: "Rewrite and Replay" },
      { min: 3, label: "Wrap", detail: "One thing I will use this week" }
    ],
    hook: {
      title: "Read the room",
      text: "Say “Great job” three times: once sincerely, once sarcastically, once bored. Ask what changed. The words were the same. Tone, face, and timing carry most of the message."
    },
    sections: [
      {
        title: "Writing professional emails",
        points: [
          "Subject line tells the whole story: “Question about Saturday shift” not “Hey”.",
          "Greeting with a name: “Hello Ms. Carter,”",
          "Put the purpose in the first sentence.",
          "Keep it to one topic and a few short sentences.",
          "End with a clear ask and a thank you.",
          "Sign with your full name and phone number.",
          "Reread once before sending. Check the name spelling and the To line."
        ],
        tip: "Show a real bad email on screen (no greeting, all lowercase, no name) and have the group fix it together."
      },
      {
        title: "Public speaking",
        points: [
          "Use PREP: Point, Reason, Example, Point again.",
          "Know your first sentence cold. Nerves drop once you start.",
          "Slow down and pause. A pause sounds confident.",
          "Look at one person per sentence, then move to another.",
          "Nerves are normal. Your body treats it like a big game. Breathe in for 4, out for 6."
        ]
      },
      {
        title: "Active listening",
        points: [
          "Put the phone away and face the person.",
          "Listen to understand, not to reply.",
          "Paraphrase: “So what I am hearing is...”",
          "Ask one follow up question.",
          "Do not jump in with your own story or advice unless asked."
        ]
      },
      {
        title: "Conflict resolution",
        points: [
          "Cool down first. Say: “I want to talk about this, can we do it in 10 minutes?”",
          "Use I statements: “I felt left out when the plan changed without me” instead of “You always ignore me.”",
          "Attack the problem, not the person.",
          "Find what you both want. Usually it is more than you think.",
          "Agree on one next step."
        ]
      },
      {
        title: "Giving and receiving feedback",
        points: [
          "Give feedback with SBI: Situation, Behavior, Impact. “In the last quarter (S), when you called out the switch early (B), it stopped their layup (I).”",
          "Be specific. “Good job” is nice. Specific praise teaches.",
          "Receiving feedback: listen, say thank you, ask one clarifying question, decide what to use.",
          "Do not defend in the moment. You can think about it later."
        ]
      },
      {
        title: "Negotiation and emotional intelligence",
        points: [
          "Negotiation starts with preparation: what do you want, what is your walk away point, what does the other side need?",
          "Ask open questions and let silence work for you.",
          "Emotional intelligence: noticing your own feelings, managing them, reading other people's, and responding well.",
          "Name it to tame it: saying “I am frustrated” out loud lowers its power.",
          "Before reacting, pause for one breath. That one breath is the skill."
        ]
      }
    ],
    terms: [
      { t: "PREP", d: "Point, Reason, Example, Point. A structure for speaking on the spot." },
      { t: "Paraphrase", d: "Repeating back what someone said in your own words." },
      { t: "I statement", d: "Describing your feelings without blaming. “I felt... when...”" },
      { t: "SBI", d: "Situation, Behavior, Impact. A clear way to give feedback." },
      { t: "Walk away point", d: "The least you will accept before ending a negotiation." },
      { t: "Emotional intelligence", d: "The ability to understand and manage emotions in yourself and others." }
    ],
    data: [
      { stat: "Top 3", text: "Communication, teamwork, and problem solving consistently rank among the attributes employers most want to see in new graduates.", source: "National Association of Colleges and Employers, Job Outlook surveys", url: "https://www.naceweb.org/" },
      { stat: "SBI", text: "The Situation, Behavior, Impact feedback model is used by leadership programs worldwide because it keeps feedback about actions, not personality.", source: "Center for Creative Leadership", url: "https://www.ccl.org/" }
    ],
    videos: [
      { title: "Active listening skills", source: "YouTube search", url: "https://www.youtube.com/results?search_query=active+listening+skills+examples", note: "Look for one with role play examples." },
      { title: "How to write a professional email", source: "YouTube search", url: "https://www.youtube.com/results?search_query=how+to+write+a+professional+email+for+students", note: "Keep it under 5 minutes." },
      { title: "Public speaking tips (TED)", source: "TED", url: "https://www.youtube.com/results?search_query=ted+public+speaking+tips", note: "Show a 3 minute segment." }
    ],
    resources: [
      { title: "Toastmasters International", url: "https://www.toastmasters.org/", note: "Public speaking clubs and tips." },
      { title: "Center for Creative Leadership", url: "https://www.ccl.org/", note: "Research on feedback and leadership." },
      { title: "Harvard Program on Negotiation", url: "https://www.pon.harvard.edu/", note: "Free articles on negotiation skills." },
      { title: "NACE", url: "https://www.naceweb.org/", note: "What employers look for in new hires." }
    ],
    handout: "email",
    activity: {
      name: "Rewrite and Replay",
      time: "12 minutes",
      format: "Pairs, two rounds",
      materials: ["The bad email below", "A timer"],
      setup: "Round 1 is writing. Round 2 is speaking and listening.",
      steps: [
        "Round 1 (5 minutes): pairs rewrite the bad email below into a professional one. Read two out loud.",
        "Round 2 (6 minutes): Partner A talks for 60 seconds about a tough moment this season. Partner B listens without interrupting, then paraphrases it back in 20 seconds and asks one follow up question.",
        "Switch roles.",
        "Partner A tells Partner B one thing they did well as a listener using SBI."
      ],
      debrief: [
        "How did it feel to be really listened to?",
        "What was hardest: not interrupting, or remembering what they said?",
        "Where could you use SBI with a teammate this week?"
      ]
    },
    takeHome: "Send one professional email this week: to a teacher, a coach, or a possible employer. Use a subject line, greeting, clear ask, and your full name.",
    discussion: [
      "Who is the best communicator you know? What do they do?",
      "How do you prefer to receive feedback?",
      "What is one conflict on a team you handled well? What worked?"
    ],
    coachNotes: [
      "Model SBI feedback yourself during the session. They will copy what you do.",
      "Keep the listening pairs mixed across grade levels."
    ]
  },

  /* ============================ 8 ============================ */
  {
    id: "career",
    num: 8,
    date: "2027-01-09",
    title: "Career and Job Skills",
    presenter: "Open",
    point: "These skills directly affect lifetime earnings. A strong resume, a good interview, and one confident negotiation can be worth tens of thousands of dollars.",
    goals: [
      "Build a one page resume that shows results",
      "Set up a LinkedIn profile the right way",
      "Answer interview questions using the STAR method",
      "Introduce yourself and network with confidence",
      "Compare job offers beyond the hourly wage",
      "Negotiate pay politely and professionally"
    ],
    agenda: [
      { min: 2, label: "Hook", detail: "The 7 second resume" },
      { min: 10, label: "Teach", detail: "Resume, LinkedIn, interview, network, offers" },
      { min: 3, label: "Watch", detail: "Mock interview clip" },
      { min: 12, label: "Activity", detail: "From the Court to the Resume" },
      { min: 3, label: "Wrap", detail: "Your 30 second intro" }
    ],
    hook: {
      title: "The 7 second resume",
      text: "Flash a sample resume on screen for 7 seconds, then hide it. Ask what they remember. Recruiters often decide whether to keep reading that fast. Clean layout and clear results win."
    },
    sections: [
      {
        title: "Building a resume",
        points: [
          "One page. Name and contact at the top. Use a professional email address.",
          "Sections: Education, Experience, Activities and Leadership, Skills, Awards.",
          "Start every bullet with an action verb: Led, Organized, Trained, Managed, Created, Improved.",
          "Add numbers: “Team captain for a 14 player varsity roster” beats “Team captain.”",
          "Sports count: discipline, teamwork, leadership, and time management are exactly what employers want.",
          "Save as a PDF named FirstName LastName Resume."
        ]
      },
      {
        title: "Creating a LinkedIn profile",
        points: [
          "You must be at least 16 to join.",
          "Clear headshot with a plain background, smiling, shoulders up.",
          "Headline: “Varsity Basketball Captain | Middleburg High School | Future Nursing Student”.",
          "About section: 3 to 4 sentences on who you are and what you are working toward.",
          "Add experience, volunteering, skills, and honors.",
          "Connect with coaches, teachers, employers, and people you meet. Add a note when you connect."
        ]
      },
      {
        title: "Interviewing well",
        points: [
          "Research the company for 10 minutes. Know what they do and one recent thing about them.",
          "Answer behavior questions with STAR: Situation, Task, Action, Result.",
          "Prepare three STAR stories from sports, school, and work or volunteering.",
          "Arrive 10 minutes early. Dress one step above the job's normal outfit.",
          "Firm handshake, eye contact, phone silenced and out of sight.",
          "Ask two questions at the end, like “What does success look like in this role in the first 90 days?”",
          "Send a thank you email within 24 hours."
        ]
      },
      {
        title: "Networking professionally",
        points: [
          "Networking is just building real relationships before you need them.",
          "Have a 30 second intro: name, what you are doing now, what you are interested in, and a question.",
          "Ask for advice, not a job. People love to give advice.",
          "Informational interview: ask someone in a career you like for 15 minutes to learn about their path.",
          "Follow up. Thank people, and let them know when their advice helped."
        ]
      },
      {
        title: "Evaluating job offers and negotiating salary",
        points: [
          "Hourly to yearly: multiply the hourly rate by 2,080 (40 hours times 52 weeks).",
          "Compare the whole package: pay, health insurance, retirement match, paid time off, schedule, commute, and room to grow.",
          "Research pay ranges on the BLS Occupational Outlook Handbook and job sites before any offer.",
          "Always thank them first, then ask: “Is there any flexibility on the starting pay?”",
          "Give a reason: your skills, certifications, or market research.",
          "Get the final offer in writing."
        ],
        tip: "Show the math: $2,000 more at your first job, with 3% raises every year, adds up to about $150,000 more over a 40 year career."
      }
    ],
    terms: [
      { t: "Action verb", d: "A strong word that starts a resume bullet: led, built, trained." },
      { t: "STAR", d: "Situation, Task, Action, Result. A structure for interview answers." },
      { t: "Informational interview", d: "A short conversation to learn about someone's job or career path." },
      { t: "Total compensation", d: "Pay plus the value of all benefits." },
      { t: "Counteroffer", d: "Your response to an offer asking for different terms." }
    ],
    data: [
      { stat: "$899 vs $1,493", text: "Median weekly earnings in 2023 for high school graduates versus bachelor's degree holders. Associate degree holders earned $1,058.", source: "U.S. Bureau of Labor Statistics", url: "https://www.bls.gov/emp/chart-unemployment-earnings-education.htm" },
      { stat: "3.9% vs 2.2%", text: "Unemployment rate in 2023 for high school graduates versus bachelor's degree holders.", source: "U.S. Bureau of Labor Statistics", url: "https://www.bls.gov/emp/chart-unemployment-earnings-education.htm" },
      { stat: "~$150,000", text: "more in lifetime earnings from negotiating just $2,000 more at your first salary, with 3% yearly raises over 40 years.", source: "Calculated example", url: "" },
      { stat: "2,080", text: "work hours in a full time year. Multiply by the hourly rate to get yearly pay.", source: "Standard payroll calculation", url: "" }
    ],
    videos: [
      { title: "STAR method interview answers", source: "YouTube search", url: "https://www.youtube.com/results?search_query=STAR+method+interview+answers+examples", note: "Choose one with a full sample answer." },
      { title: "Mock interview for a first job", source: "YouTube search", url: "https://www.youtube.com/results?search_query=mock+interview+first+job+teen", note: "Pause and ask players to rate the answers." },
      { title: "How to negotiate your first salary", source: "YouTube search", url: "https://www.youtube.com/results?search_query=how+to+negotiate+first+job+salary", note: "Great clip to set up the negotiation practice." }
    ],
    resources: [
      { title: "BLS Occupational Outlook Handbook", url: "https://www.bls.gov/ooh/", note: "Pay, education, and job growth for hundreds of careers." },
      { title: "CareerOneStop", url: "https://www.careeronestop.org/", note: "Free career tools from the U.S. Department of Labor." },
      { title: "LinkedIn", url: "https://www.linkedin.com/", note: "Build your professional profile." },
      { title: "BLS: Earnings and unemployment by education", url: "https://www.bls.gov/emp/chart-unemployment-earnings-education.htm", note: "The data behind the chart." }
    ],
    activity: {
      name: "From the Court to the Resume",
      time: "12 minutes",
      format: "Individually, then pairs",
      materials: ["Paper or phone notes", "Action verb list: Led, Organized, Trained, Mentored, Managed, Coordinated, Improved, Achieved, Represented, Volunteered"],
      setup: "Every player already has resume material from basketball. This activity turns it into bullets and one interview story.",
      steps: [
        "Write 3 resume bullets from your basketball experience. Start each with an action verb and include one number.",
        "Pick one tough moment from a season. Write it as a STAR story in 4 short lines.",
        "In pairs, one player asks: “Tell me about a time you faced a challenge on a team.” The other answers with their STAR story in under 90 seconds.",
        "Switch roles.",
        "Each partner gives one piece of SBI feedback."
      ],
      debrief: [
        "Share your best resume bullet with the group.",
        "Which part of STAR is easiest to forget? (Usually the Result.)",
        "What other experiences outside basketball could become STAR stories?"
      ],
      examples: [
        "Led team warmups for a 14 player varsity roster during the 2026 to 2027 season.",
        "Balanced 20+ hours a week of practice and games while maintaining a 3.5 GPA.",
        "Mentored 4 junior varsity players on offensive sets and film review."
      ]
    },
    takeHome: "Write a full draft of your one page resume and email it to yourself as a PDF. Bring it next week for a quick peer review.",
    discussion: [
      "What job or career are you curious about? Who could you talk to about it?",
      "Is the highest paying offer always the best offer? Why or why not?",
      "What makes you nervous about interviews? What would make it easier?"
    ],
    coachNotes: [
      "Invite a local HR manager or hiring manager to run quick mock interviews.",
      "Players under 16 can build the resume now and add LinkedIn later."
    ]
  },

  /* ============================ 9 ============================ */
  {
    id: "health",
    num: 9,
    date: "2027-01-16",
    title: "Health and Emergency Preparedness",
    presenter: "Open",
    point: "Being able to respond in an emergency can save lives. Knowing how to take care of your own body and mind, and how to use the health system, protects your future.",
    goals: [
      "Perform Hands Only CPR and know when to use an AED",
      "Handle common first aid situations: bleeding, burns, choking, heat illness, concussion",
      "Know the basics of mental health and where to get help",
      "Use health insurance and schedule appointments on your own",
      "Choose correctly between urgent care and the emergency room",
      "Take medications safely"
    ],
    agenda: [
      { min: 2, label: "Hook", detail: "The 4 minute window" },
      { min: 10, label: "Teach", detail: "CPR, first aid, mental health, care decisions" },
      { min: 3, label: "Watch", detail: "Hands Only CPR demonstration" },
      { min: 12, label: "Activity", detail: "CPR rhythm drill and ER or Urgent Care" },
      { min: 3, label: "Wrap", detail: "Save 988 and Poison Control in your phone" }
    ],
    hook: {
      title: "The 4 minute window",
      text: "Ask: “If a fan collapses at a game, how long until an ambulance gets there?” Often 7 to 10 minutes or more. Brain damage can start within about 4 to 6 minutes without oxygen. The people in the gym are the first responders. Today, that is you."
    },
    sections: [
      {
        title: "Hands Only CPR and AEDs",
        points: [
          "Check: tap and shout. Not responsive and not breathing normally? Act.",
          "Call 911 (or point to someone: “You in the red shirt, call 911 and bring the AED”).",
          "Push hard and fast in the center of the chest: at least 2 inches deep, 100 to 120 times a minute.",
          "Keep time to a song around 100 to 120 beats per minute, like “Stayin' Alive.”",
          "Use the AED as soon as it arrives. Turn it on and it talks you through every step.",
          "Do not stop until help takes over or the person starts breathing.",
          "This lesson is an introduction. A certified CPR course through the Red Cross or American Heart Association is the next step."
        ]
      },
      {
        title: "Basic first aid",
        points: [
          "Bleeding: firm, direct pressure with a clean cloth. Do not lift to check. Add more cloth on top.",
          "Burns: cool running water for about 10 minutes. No ice, no butter.",
          "Choking: if they cannot talk or cough, give abdominal thrusts (the Heimlich). The Red Cross teaches 5 back blows then 5 abdominal thrusts.",
          "Heat illness: heavy sweating, cramps, and dizziness means move to shade, cool down, sip water. Confusion or no sweating can mean heat stroke. Call 911 and cool them fast with cold water or ice.",
          "Concussion: headache, dizziness, confusion, or light sensitivity after a hit. When in doubt, sit them out. No return to play until cleared by a medical professional."
        ]
      },
      {
        title: "Mental health basics",
        points: [
          "Mental health is health. Everyone has it, just like physical health.",
          "Warning signs: big changes in sleep or eating, pulling away from friends, losing interest in things, hopelessness.",
          "Helping a friend: ask directly, listen without judging, and connect them with a trusted adult.",
          "Call or text 988 any time for the Suicide and Crisis Lifeline. It is free and confidential.",
          "Basics that help: sleep 8 to 10 hours, move your body, eat regularly, limit late night scrolling, talk to people.",
          "Asking for help is strength. Coaches, counselors, and teammates want to help."
        ]
      },
      {
        title: "Health insurance and making appointments",
        points: [
          "Carry your insurance card, or a photo of both sides of it.",
          "In network providers cost much less. Check your insurer's website or app before booking.",
          "Find a primary care doctor. They are your home base for checkups and referrals.",
          "When calling: have your insurance card, date of birth, reason for the visit, and your calendar ready.",
          "Write down your questions before the visit.",
          "An Explanation of Benefits (EOB) is not a bill. It shows what insurance paid."
        ]
      },
      {
        title: "Urgent care or the emergency room?",
        points: [
          "ER, call 911: chest pain, trouble breathing, stroke signs, severe bleeding, head injury with confusion or passing out, seizures, serious burns, broken bones through the skin.",
          "Stroke signs, BE FAST: Balance, Eyes, Face drooping, Arm weakness, Speech trouble, Time to call 911.",
          "Urgent care: sprains, minor cuts that need stitches, fever, flu, sore throat, ear infections, mild allergic reactions, minor burns.",
          "Primary care or telehealth: medication refills, ongoing issues, minor rashes, checkups.",
          "An ER visit usually costs much more than urgent care for the same minor problem."
        ]
      },
      {
        title: "Basic medication safety",
        points: [
          "Read the Drug Facts label every time: active ingredient, dose, and warnings.",
          "Do not double up on the same active ingredient. Acetaminophen is in many cold medicines and too much can damage the liver.",
          "Never share prescription medications, including ADHD or pain medications.",
          "Tell the doctor or pharmacist everything you take, including supplements.",
          "Poison Control is free, 24/7: (800) 222 1222.",
          "Get rid of old medications at a pharmacy drop box or a Drug Take Back Day."
        ]
      }
    ],
    terms: [
      { t: "AED", d: "Automated external defibrillator. A device that can restart a heart's rhythm. It gives voice directions." },
      { t: "CPR", d: "Cardiopulmonary resuscitation. Chest compressions that keep blood moving to the brain." },
      { t: "Heat stroke", d: "A life threatening rise in body temperature. Call 911." },
      { t: "In network", d: "Doctors and facilities that have a deal with your insurance to charge less." },
      { t: "Active ingredient", d: "The part of a medicine that does the work. Check it to avoid doubling up." },
      { t: "988", d: "The Suicide and Crisis Lifeline. Call or text any time." }
    ],
    data: [
      { stat: "100 to 120", text: "chest compressions per minute, at least 2 inches deep, is the Hands Only CPR target for adults.", source: "American Heart Association", url: "https://cpr.heart.org/" },
      { stat: "40%", text: "of U.S. high school students reported persistent feelings of sadness or hopelessness in 2023. Among female students it was 53%.", source: "CDC Youth Risk Behavior Survey", url: "https://www.cdc.gov/yrbs/" },
      { stat: "988", text: "Call or text for the Suicide and Crisis Lifeline. Free, confidential, 24/7.", source: "988 Lifeline", url: "https://988lifeline.org/" },
      { stat: "24/7", text: "free help from Poison Control at (800) 222 1222 or online.", source: "America's Poison Centers", url: "https://www.poison.org/" }
    ],
    videos: [
      { title: "Hands Only CPR (American Heart Association)", source: "YouTube search", url: "https://www.youtube.com/results?search_query=american+heart+association+hands+only+cpr", note: "Short and very clear. Must show this one." },
      { title: "How to use an AED", source: "YouTube search", url: "https://www.youtube.com/results?search_query=how+to+use+an+AED+red+cross", note: "Shows how the AED talks you through it." },
      { title: "Heat exhaustion versus heat stroke", source: "YouTube search", url: "https://www.youtube.com/results?search_query=heat+exhaustion+vs+heat+stroke+athletes", note: "Very relevant for Florida athletes." }
    ],
    resources: [
      { title: "American Heart Association CPR", url: "https://cpr.heart.org/", note: "Find a class and learn Hands Only CPR." },
      { title: "American Red Cross: Take a class", url: "https://www.redcross.org/take-a-class", note: "CPR, first aid, and lifeguard classes." },
      { title: "988 Suicide and Crisis Lifeline", url: "https://988lifeline.org/", note: "Help for yourself or a friend." },
      { title: "CDC HEADS UP concussion", url: "https://www.cdc.gov/heads-up/", note: "Concussion signs for athletes." },
      { title: "Poison Control", url: "https://www.poison.org/", note: "Online help tool and phone line." },
      { title: "Ready.gov: Build a kit", url: "https://www.ready.gov/kit", note: "Emergency kit checklist for hurricanes and more." }
    ],
    handout: "ervsurgent",
    activity: {
      name: "CPR Rhythm Drill and ER or Urgent Care",
      time: "12 minutes",
      format: "Whole group, then teams",
      materials: ["A speaker to play “Stayin' Alive”", "CPR manikins if available, otherwise firm foam balls or rolled towels", "Scenario list below"],
      setup: "Part 1 builds muscle memory. Part 2 builds decision making.",
      steps: [
        "Part 1 (5 minutes): everyone kneels. Coach models hand position: heel of one hand in the center of the chest, other hand on top, arms straight, shoulders over hands.",
        "Play the song. Everyone compresses for 30 seconds. Rest. Repeat twice.",
        "Practice the call out: point at someone and say “You, call 911 and bring the AED.”",
        "Part 2 (7 minutes): read each scenario. Teams hold up ER, URGENT, or DOCTOR. Explain the answer after each.",
        "Finish by having everyone save 988 and Poison Control in their phones."
      ],
      debrief: [
        "How tired did your arms get in 30 seconds? That is why you switch with someone every 2 minutes.",
        "Which scenario was hardest to decide?",
        "Who would you tell if a teammate was struggling mentally?"
      ]
    },
    takeHome: "Show a family member Hands Only CPR and teach them the two steps: call 911, push hard and fast. Find where the AED is in our gym.",
    discussion: [
      "Where is the nearest AED in our school and gym?",
      "What makes it hard for teens to talk about mental health? How can our team make it easier?",
      "Have you ever booked your own doctor appointment? What would you need to do it?"
    ],
    coachNotes: [
      "Consider inviting the Clay County Fire Rescue or the school athletic trainer. Many offer free Hands Only CPR demos.",
      "Handle the mental health section with care. Let players know you and the school counselor are available.",
      "Have the school counselor's contact information on the screen at the end."
    ]
  },

  /* ============================ 10 ============================ */
  {
    id: "thinking",
    num: 10,
    date: "2027-01-23",
    title: "Critical Thinking and Decision Making",
    presenter: "Open",
    point: "This is the skill that improves every other area of life. Better thinking leads to better choices about money, health, relationships, and careers.",
    goals: [
      "Check whether evidence is strong or weak",
      "Spot common logical fallacies",
      "Recognize bias in yourself and others",
      "Weigh risks and consequences, short term and long term",
      "Make a solid decision even without all the information"
    ],
    agenda: [
      { min: 3, label: "Hook", detail: "Would you believe it?" },
      { min: 10, label: "Teach", detail: "Evidence, fallacies, bias, risk, decisions" },
      { min: 2, label: "Watch", detail: "A short fallacy or bias clip" },
      { min: 12, label: "Activity", detail: "Fallacy Hunt and the Decision Matrix" },
      { min: 3, label: "Wrap", detail: "The 10 / 10 / 10 question" }
    ],
    hook: {
      title: "Would you believe it?",
      text: "Read this: “A new study shows players who drink Brand X sports drink score 20% more points.” Ask: what questions should we ask before we believe it? Who paid for the study? How many players? Were they already better players? That is critical thinking."
    },
    sections: [
      {
        title: "Evaluating evidence",
        points: [
          "Who is saying it, and what do they gain if you believe it?",
          "How big was the sample? Ten people is a story, not a study.",
          "Correlation is not causation. Ice cream sales and sunburns rise together because of summer, not because ice cream causes sunburn.",
          "Look for the original source. Headlines often exaggerate.",
          "Use SIFT: Stop, Investigate the source, Find better coverage, Trace claims back to the original.",
          "Strong claims need strong evidence."
        ]
      },
      {
        title: "Spotting logical fallacies",
        points: [
          "Ad hominem: attacking the person instead of the argument. “She's a freshman, so her idea is dumb.”",
          "Straw man: twisting someone's point to make it easier to attack.",
          "False choice: acting like there are only two options when there are more.",
          "Slippery slope: claiming one small step will lead to disaster with no proof.",
          "Bandwagon: “Everyone is doing it, so it must be right.”",
          "Hasty generalization: judging a whole group from one or two examples.",
          "False cause: “I wore these socks and we won, so the socks made us win.”"
        ]
      },
      {
        title: "Recognizing bias",
        points: [
          "Confirmation bias: noticing only information that agrees with what you already believe.",
          "Anchoring: the first number you hear shapes your judgment. Car prices and salary offers use this.",
          "Sunk cost: sticking with something only because you already put time or money into it.",
          "Availability: judging how likely something is by how easily examples come to mind.",
          "Groupthink: going along with the team to avoid conflict, even when something feels wrong.",
          "Fix: ask “What would change my mind?” and seek out someone who disagrees."
        ]
      },
      {
        title: "Assessing risk and consequences",
        points: [
          "Risk has two parts: how likely it is and how bad it would be.",
          "A small chance of a huge, permanent loss (like a DUI or a criminal record) is not a risk worth taking.",
          "The 10 / 10 / 10 question: how will I feel about this in 10 minutes, 10 months, and 10 years?",
          "Short term gains that create long term costs are the most common trap: payday loans, skipping class, posting in anger."
        ]
      },
      {
        title: "Deciding under uncertainty",
        points: [
          "You will rarely have all the facts. Decide with the best information you have.",
          "List your options. There are usually more than two.",
          "Use a decision matrix: list what matters, give each factor a weight, score each option.",
          "Premortem: imagine it is a year from now and the choice failed. Why did it fail? Fix that now.",
          "Separate the decision from the outcome. A good decision can still have a bad result because of luck.",
          "Sleep on big decisions when you can."
        ],
        tip: "Use the Decision Matrix tool below live with one volunteer's real choice, like two colleges or two summer jobs."
      }
    ],
    terms: [
      { t: "Fallacy", d: "A mistake in reasoning that makes an argument seem stronger than it is." },
      { t: "Bias", d: "A mental shortcut that tilts judgment in a predictable direction." },
      { t: "Correlation", d: "Two things happening together. It does not prove one causes the other." },
      { t: "Sunk cost", d: "Time or money already spent that cannot be recovered." },
      { t: "Premortem", d: "Imagining a plan failed and working out why, before you start." },
      { t: "SIFT", d: "Stop, Investigate the source, Find better coverage, Trace claims." }
    ],
    data: [
      { stat: "SIFT", text: "A four step method for checking online information, developed by researcher Mike Caulfield and used in schools and universities.", source: "News Literacy Project and university libraries", url: "https://newslit.org/" },
      { stat: "10 / 10 / 10", text: "A simple test for long term thinking: how will this feel in 10 minutes, 10 months, and 10 years?", source: "Suzy Welch, 10 10 10", url: "" }
    ],
    videos: [
      { title: "Logical fallacies explained", source: "YouTube search", url: "https://www.youtube.com/results?search_query=logical+fallacies+explained+for+students", note: "Pick one with everyday examples." },
      { title: "Confirmation bias", source: "YouTube search", url: "https://www.youtube.com/results?search_query=confirmation+bias+explained+short", note: "Keep it under 4 minutes." },
      { title: "Correlation versus causation", source: "YouTube search", url: "https://www.youtube.com/results?search_query=correlation+vs+causation+explained", note: "Funny examples help this stick." }
    ],
    resources: [
      { title: "News Literacy Project", url: "https://newslit.org/", note: "Free tools to sort fact from fiction." },
      { title: "Checkology", url: "https://get.checkology.org/", note: "Free news literacy lessons for students." },
      { title: "Your Logical Fallacy Is", url: "https://yourlogicalfallacyis.com/", note: "One page summaries of common fallacies." },
      { title: "Common Sense Education", url: "https://www.commonsense.org/education", note: "Digital citizenship and media literacy." }
    ],
    handout: "fallacies",
    activity: {
      name: "Fallacy Hunt and the Decision Matrix",
      time: "12 minutes",
      format: "Teams, then one live demo",
      materials: ["Fallacy statements below", "Decision Matrix tool on this page"],
      setup: "Part 1 trains spotting bad reasoning. Part 2 practices a good decision process.",
      steps: [
        "Part 1 (6 minutes): read each statement. Teams name the fallacy. Point for each correct answer.",
        "Part 2 (6 minutes): a volunteer shares a real decision (two schools, two jobs, two sports camps).",
        "The group lists 4 or 5 factors that matter and weights them from 1 to 5.",
        "Score each option from 1 to 10 on each factor in the Decision Matrix tool.",
        "Discuss: does the result match the volunteer's gut feeling? If not, why?"
      ],
      debrief: [
        "Where do you see fallacies most often: social media, ads, arguments with friends?",
        "Did the matrix change anyone's mind?",
        "What is one decision coming up where you will use the 10 / 10 / 10 question?"
      ]
    },
    tool: "decision",
    takeHome: "Find one post or ad this week that uses a fallacy or a misleading statistic. Screenshot it and name the fallacy.",
    discussion: [
      "What is a time you changed your mind about something important? What changed it?",
      "Why is it hard to admit when we are wrong?",
      "Which bias do you think affects teenagers the most?"
    ],
    coachNotes: [
      "Keep the tone fun. This works best as a game.",
      "Avoid political examples. Sports, food, and ads work well and keep the focus on the skill."
    ]
  },

  /* ============================ 11 ============================ */
  {
    id: "business",
    num: 11,
    date: "2027-01-30",
    title: "Business and Entrepreneurship",
    presenter: "Open",
    point: "Whether you start a company or work for one, thinking like an owner makes you more valuable. This final session ties everything together.",
    goals: [
      "Understand the basic steps to start a small business",
      "Know the basics of investing and retirement planning",
      "Manage time with simple, proven tools",
      "See how basic coding and automation save time",
      "Read media with a critical eye",
      "Negotiate, know your consumer rights, and plan a trip on a budget"
    ],
    agenda: [
      { min: 2, label: "Hook", detail: "The lemonade stand" },
      { min: 11, label: "Teach", detail: "Business, investing, time, tech, media, rights, travel" },
      { min: 2, label: "Watch", detail: "A young founder story" },
      { min: 12, label: "Activity", detail: "Bronco Pitch" },
      { min: 3, label: "Wrap", detail: "Series celebration" }
    ],
    hook: {
      title: "The lemonade stand",
      text: "Ask: “You sell 100 cups of lemonade at $2. Did you make $200?” No. Take out lemons, sugar, cups, and ice. Profit is what is left. Every business in the world, from a lemonade stand to Nike, runs on that one idea."
    },
    sections: [
      {
        title: "Starting a small business",
        points: [
          "Start with a problem people will pay to solve. Talk to 10 possible customers before spending money.",
          "Profit = Revenue minus Costs. Know both.",
          "Price to cover your costs, your time, and a profit.",
          "Start small and test: sell to friends, family, or at one event first.",
          "Business types: sole proprietorship is simplest. An LLC separates personal and business money. In Florida, you register through Sunbiz.",
          "Keep business money in a separate account from day one.",
          "Free help: SCORE mentors and the Small Business Administration."
        ]
      },
      {
        title: "Basic investing and retirement planning",
        points: [
          "Order of operations: emergency fund, get the full employer match, pay off high interest debt, then invest more.",
          "Diversify: index funds spread money across many companies.",
          "Keep costs low. Look for funds with low expense ratios.",
          "Invest regularly no matter what the market is doing.",
          "A Roth IRA can be opened with any earned income, even a part time job.",
          "Avoid anything promising guaranteed high returns. That is a warning sign of a scam."
        ]
      },
      {
        title: "Time management and productivity",
        points: [
          "Eisenhower Matrix: sort tasks into urgent and important, important but not urgent, urgent but not important, and neither.",
          "Schedule the important but not urgent: studying, workouts, sleep.",
          "Time blocking: give each task a set block on your calendar.",
          "Do the hardest task first when your energy is highest.",
          "Phone in another room during focused work. It makes a real difference."
        ]
      },
      {
        title: "Basic coding and automation",
        points: [
          "Code is a set of instructions for a computer. Anyone can learn the basics.",
          "Start free: Code.org, Khan Academy, or freeCodeCamp.",
          "Automation you can use now: spreadsheet formulas, calendar reminders, auto bill pay, email filters.",
          "AI tools can help you brainstorm, draft, and learn. Always check facts and never paste private information.",
          "Every career uses technology. Being comfortable with it is a raise waiting to happen."
        ]
      },
      {
        title: "Media literacy",
        points: [
          "Ask: who made this, why, and who paid for it?",
          "Sponsored posts must be labeled, look for #ad or “paid partnership.”",
          "Read laterally: open a new tab and see what other sources say.",
          "Be careful with screenshots and clips. They can be cropped, edited, or fake.",
          "If a post makes you instantly angry, pause before sharing. Outrage spreads fastest."
        ]
      },
      {
        title: "Negotiation, consumer rights, and travel planning",
        points: [
          "Negotiation recap: prepare, ask, listen, and be willing to walk away.",
          "Consumer rights: you can dispute credit card charges for things never delivered. Act quickly, generally within 60 days of the statement.",
          "Report scams and fraud to the FTC at ReportFraud.ftc.gov. File money complaints with the CFPB.",
          "Travel: set a total budget first. Compare flights, and book lodging with free cancellation when possible.",
          "Flying in the U.S. requires a REAL ID or passport for adults. Liquids in carry ons must be 3.4 ounces or less and fit in one quart size bag.",
          "Share your trip plans with someone at home and keep copies of your ID."
        ]
      }
    ],
    terms: [
      { t: "Revenue", d: "All the money that comes in from sales." },
      { t: "Profit", d: "Revenue minus all costs." },
      { t: "Break even", d: "The point where revenue exactly covers costs." },
      { t: "LLC", d: "Limited liability company. A business structure that separates personal and business finances." },
      { t: "Expense ratio", d: "The yearly fee a fund charges, as a percentage." },
      { t: "Chargeback", d: "Reversing a card payment through your bank when a seller does not deliver." }
    ],
    data: [
      { stat: "About 1 in 5", text: "new businesses close in their first year, and roughly half close within five years. Planning and testing matter.", source: "U.S. Bureau of Labor Statistics, Business Employment Dynamics", url: "https://www.bls.gov/bdm/" },
      { stat: "Rule of 72", text: "Divide 72 by the yearly return to estimate how long money takes to double. At 8%, about 9 years.", source: "Investor.gov", url: "https://www.investor.gov/" },
      { stat: "Free", text: "business mentoring is available through SCORE volunteers, many of them retired business owners.", source: "SCORE", url: "https://www.score.org/" }
    ],
    videos: [
      { title: "Teen entrepreneurs who started small", source: "YouTube search", url: "https://www.youtube.com/results?search_query=teen+entrepreneur+how+i+started+my+business", note: "Pick a short, relatable story." },
      { title: "Eisenhower Matrix explained", source: "YouTube search", url: "https://www.youtube.com/results?search_query=eisenhower+matrix+explained", note: "Under 5 minutes." },
      { title: "Index funds for beginners", source: "YouTube search", url: "https://www.youtube.com/results?search_query=index+funds+explained+for+beginners", note: "Connects back to Lesson 1." }
    ],
    resources: [
      { title: "U.S. Small Business Administration", url: "https://www.sba.gov/", note: "Planning, launching, and funding a business." },
      { title: "SCORE", url: "https://www.score.org/", note: "Free mentors and workshops." },
      { title: "Florida Sunbiz", url: "https://dos.fl.gov/sunbiz/", note: "Register a Florida business." },
      { title: "Investor.gov", url: "https://www.investor.gov/", note: "Investing basics from the SEC." },
      { title: "Code.org", url: "https://code.org/", note: "Free beginner coding." },
      { title: "freeCodeCamp", url: "https://www.freecodecamp.org/", note: "Free coding lessons and certifications." },
      { title: "Report fraud to the FTC", url: "https://reportfraud.ftc.gov/", note: "Report scams and bad businesses." },
      { title: "TSA liquids rule", url: "https://www.tsa.gov/travel/security-screening/liquids-rule", note: "What you can bring in a carry on." }
    ],
    activity: {
      name: "Bronco Pitch",
      time: "12 minutes",
      format: "Teams of 3 or 4",
      materials: ["Profit calculator on this page", "Paper for a pitch outline"],
      setup: "Each team invents a small business that could raise money for the team or serve our community. They must price it, estimate costs, and pitch it in 60 seconds.",
      steps: [
        "Pick a product or service: car wash, custom shirts, bake sale, youth basketball clinic, lawn care, tutoring.",
        "Name the customer: who will buy it and why?",
        "Use the profit calculator: set a price, cost per unit, fixed costs, and how many you expect to sell.",
        "Find the break even point: how many sales before you make a profit?",
        "Pitch in 60 seconds: problem, product, price, profit, and why your team will win.",
        "The group votes for the winner. The best idea could become a real team fundraiser."
      ],
      debrief: [
        "Which business had the best profit margin? Why?",
        "What skills from earlier sessions did you use today? (Budgeting, communication, critical thinking, negotiation.)",
        "What is one skill from this whole series you will use first?"
      ]
    },
    tool: "profit",
    takeHome: "Write down one skill from this 11 week series that you will use in the next month and one adult you can ask for help with it.",
    discussion: [
      "If you could start any business with no risk, what would it be?",
      "Who in your life is a good example of thinking like an owner?",
      "Which session from this series surprised you the most?"
    ],
    coachNotes: [
      "Bring back the business prospects from Session 1 as judges for the Bronco Pitch.",
      "End the series with a short celebration and recognition of attendance."
    ]
  }
];

/* Handouts: sample documents used in activities. */
window.HANDOUTS = {
  paystub: {
    title: "Sample Pay Stub",
    intro: "Jordan Ellis, Sales Associate. Pay period: two weeks. Rate $15.00 an hour. This is a teaching example; the federal withholding is an estimate.",
    table: {
      head: ["Line", "Hours / Rate", "This period", "Year to date"],
      rows: [
        ["Regular pay", "60.00 @ $15.00", "$900.00", "$9,900.00"],
        ["Gross pay", "", "$900.00", "$9,900.00"],
        ["Federal income tax", "", "$38.00", "$418.00"],
        ["Social Security (6.2%)", "", "$55.80", "$613.80"],
        ["Medicare (1.45%)", "", "$13.05", "$143.55"],
        ["State income tax (Florida)", "", "$0.00", "$0.00"],
        ["Total deductions", "", "$106.85", "$1,175.35"],
        ["Net pay", "", "$793.15", "$8,724.65"]
      ]
    }
  },
  lease: {
    title: "Sample Lease Excerpt",
    intro: "Palmetto Pines Apartments, Unit 214. Read carefully. Some of these clauses should make you stop and ask questions.",
    clauses: [
      "1. TERM. This lease begins January 1 and ends December 31. Tenant may not end the lease early for any reason. If Tenant leaves early, Tenant owes all remaining rent for the full term.",
      "2. RENT. Rent is $1,150 per month, due on the 1st. A late fee of $100 applies on the 2nd, plus $25 per day until paid.",
      "3. DEPOSIT. Tenant pays a $1,500 security deposit. A $300 cleaning fee will be kept from the deposit at move out regardless of condition.",
      "4. RENEWAL. This lease automatically renews for another 12 months unless Tenant gives written notice 90 days before the end date.",
      "5. REPAIRS. Tenant is responsible for all repairs under $500, including appliances and air conditioning.",
      "6. ENTRY. Landlord may enter the unit at any time without notice.",
      "7. GUESTS. Guests may not stay more than 3 nights in any month without written approval.",
      "8. UTILITIES. Tenant pays electricity and internet. Water, trash, and pest control are billed monthly by Landlord at a rate set by Landlord."
    ],
    answers: [
      "Clause 1: No early exit option. Ask about an early termination fee or a job relocation clause instead of owing the full year.",
      "Clause 2: Late fees stack up fast. $100 plus $25 a day could be $400+ in two weeks. Ask for a grace period and a cap.",
      "Clause 3: A cleaning fee kept regardless of condition. Ask how deductions are decided and get it in writing. Florida law has rules for deposit claims.",
      "Clause 4: Automatic 12 month renewal with 90 days notice. Put the notice date in your phone calendar the day you sign.",
      "Clause 5: Tenant pays AC and appliance repairs. Very unusual and expensive in Florida. Ask for the landlord to cover major systems.",
      "Clause 6: Entry without notice. Florida law generally requires reasonable notice (usually at least 24 hours) for repairs. Ask to change this.",
      "Clause 8: Utilities at a rate set by the landlord. Ask for the average monthly amount over the last year."
    ]
  },
  fixit: {
    title: "Fix It, Call It, or Get Out: Scenario Cards",
    cards: [
      ["The toilet keeps running after every flush.", "FIX IT", "Usually a $5 to $10 flapper. Shut off the valve behind the toilet first."],
      ["You smell rotten eggs near the stove.", "GET OUT", "That smell is added to natural gas. Leave, then call 911 or the gas company from outside."],
      ["A breaker trips when the microwave and toaster run together.", "FIX IT", "Too much on one circuit. Reset the breaker and run them at different times."],
      ["The same breaker trips again right after you reset it, with nothing plugged in.", "CALL IT", "Could be a wiring fault. Call a licensed electrician."],
      ["The bathroom outlet is dead but has Test and Reset buttons.", "FIX IT", "It is a GFCI. Press Reset."],
      ["A brown water stain is spreading on the ceiling after rain.", "CALL IT", "Likely a roof leak. Take photos and call a roofer and your landlord or insurance."],
      ["The kitchen sink drains slowly.", "FIX IT", "Try a cup plunger or a plastic drain snake. Skip the chemicals."],
      ["An outlet cover feels hot and you smell burning plastic.", "GET OUT", "If there is smoke or fire, leave and call 911. If not, shut off the breaker and call an electrician."],
      ["Water is pooling under the indoor AC unit.", "CALL IT", "Probably a clogged condensate line. Turn the system off and call for service."],
      ["The AC filter is gray and dusty.", "FIX IT", "Replace it. Arrow points toward the unit."],
      ["A new crack wider than a quarter inch appears in a block wall.", "CALL IT", "Could be a structural issue. Have it inspected."],
      ["A pipe bursts and water is pouring from the ceiling.", "FIX IT, then CALL IT", "Shut off the main water valve right away, turn off power to wet areas at the breaker if safe, then call a plumber."]
    ]
  },
  email: {
    title: "The Bad Email",
    bad: "To: manager@shop.com\nSubject: hey\n\nhey so i cant come in saturday bc i have a game. can someone cover. thx",
    good: "To: manager@shop.com\nSubject: Request to swap my Saturday, Feb 6 shift\n\nHello Ms. Carter,\n\nI am writing to ask if I can swap my Saturday, February 6 shift (10 a.m. to 4 p.m.). I have a varsity basketball game that day that was added to our schedule this week.\n\nI have already asked Maya, and she can cover the shift if you approve. I can work her Sunday shift in return.\n\nThank you for considering this. Please let me know if that works.\n\nBest,\nAaliyah Brooks\n(904) 555 0142"
  },
  ervsurgent: {
    title: "ER, Urgent Care, or Doctor? Scenarios",
    cards: [
      ["A teammate collapses during practice and is not breathing normally.", "ER / 911", "Start CPR, get the AED, call 911."],
      ["You rolled your ankle. It is swollen but you can put some weight on it.", "URGENT", "Urgent care can X ray it and wrap it."],
      ["Your friend's face is drooping on one side and her speech is slurred.", "ER / 911", "Stroke signs. BE FAST. Call 911 now."],
      ["You have a sore throat and a fever of 101°F.", "URGENT", "Urgent care or a telehealth visit can test for strep or flu."],
      ["You need a refill of your allergy prescription.", "DOCTOR", "Call your primary care office or use their patient app."],
      ["A cut on your hand is still bleeding after 10 minutes of pressure.", "URGENT", "It likely needs stitches. If bleeding is heavy and will not slow, go to the ER."],
      ["After a hard fall, a player is confused and vomiting.", "ER / 911", "Signs of a serious head injury."],
      ["You feel sad and unmotivated most days for a few weeks.", "DOCTOR", "Talk to a trusted adult, your doctor, or the school counselor. If you ever feel unsafe, call or text 988."]
    ]
  },
  fallacies: {
    title: "Fallacy Hunt Statements",
    cards: [
      ["“Every team in the conference wears these shoes, so they must be the best.”", "Bandwagon"],
      ["“Don't listen to her advice on defense. She can't even make a free throw.”", "Ad hominem"],
      ["“Either we run full court press all game, or we lose.”", "False choice"],
      ["“If we let one player skip warmups, soon nobody will warm up and everyone will get hurt.”", "Slippery slope"],
      ["“I ate pasta before the game and scored 25. Pasta makes me a better shooter.”", "False cause"],
      ["“I met two people from that school and they were rude. Everyone there is rude.”", "Hasty generalization"],
      ["Coach: “We need more conditioning.” Player: “So Coach wants us to run until we pass out?”", "Straw man"],
      ["“This supplement is used by pro athletes, so it is safe and it works.”", "Appeal to authority"]
    ]
  }
};

/* Grocery price list for the $50 Week Challenge (sample prices). */
window.GROCERIES = [
  { item: "Eggs, 18 count", price: 4.29, group: "Protein" },
  { item: "Chicken thighs, 3 lb", price: 7.49, group: "Protein" },
  { item: "Ground turkey, 1 lb", price: 4.99, group: "Protein" },
  { item: "Canned tuna, 3 pack", price: 3.49, group: "Protein" },
  { item: "Black beans, 2 cans", price: 2.18, group: "Protein" },
  { item: "Frozen salmon fillets, 1 lb", price: 7.99, group: "Protein" },
  { item: "Greek yogurt, 32 oz", price: 4.79, group: "Protein" },
  { item: "Brown rice, 2 lb", price: 2.69, group: "Grain" },
  { item: "Spaghetti, 1 lb", price: 1.29, group: "Grain" },
  { item: "Tortillas, 10 count", price: 2.99, group: "Grain" },
  { item: "Oats, 42 oz", price: 4.49, group: "Grain" },
  { item: "Whole wheat bread", price: 2.79, group: "Grain" },
  { item: "Frozen mixed vegetables, 2 lb", price: 3.29, group: "Produce" },
  { item: "Bell peppers, 3 pack", price: 3.99, group: "Produce" },
  { item: "Onions, 3 lb bag", price: 2.99, group: "Produce" },
  { item: "Bananas, 1 bunch", price: 1.69, group: "Produce" },
  { item: "Spinach, 10 oz", price: 2.99, group: "Produce" },
  { item: "Frozen broccoli, 2 lb", price: 3.49, group: "Produce" },
  { item: "Apples, 3 lb bag", price: 4.49, group: "Produce" },
  { item: "Pasta sauce, 24 oz jar", price: 2.49, group: "Pantry" },
  { item: "Shredded cheese, 8 oz", price: 2.79, group: "Pantry" },
  { item: "Salsa, 16 oz", price: 2.59, group: "Pantry" },
  { item: "Soy sauce, 10 oz", price: 2.29, group: "Pantry" },
  { item: "Peanut butter, 16 oz", price: 2.79, group: "Pantry" },
  { item: "Milk, 1 gallon", price: 3.89, group: "Pantry" }
];
