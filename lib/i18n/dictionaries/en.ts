// English UI text. zh.ts must provide the same keys (enforced by the type).
// Placeholders like {year} are filled with fmt() from lib/i18n/config.ts.
export const en = {
  site: {
    name: "Japan Employer Insight",
    description: "Compare Japanese employers on the workplace data they are legally required to disclose.",
  },
  nav: {
    search: "Search",
    compare: "Compare",
    rank: "Rank",
    guide: "Guide",
    switchLanguage: "中文",
    switchLanguageLabel: "切换到简体中文",
  },
  footer: {
    poweredBy: "Powered by",
    edinetSource: ". Source data: annual securities reports (有価証券報告書) filed on the FSA's EDINET system.",
    mhlwPrefix: "Also uses",
    mhlwSuffix: "(as of {date}), processed by Japan Employer Insight.",
    disclaimer:
      "Figures are extracted automatically and may contain errors. Check the original filing before relying on any number. This site is not investment advice.",
  },
  common: {
    loading: "Loading…",
    noData: "No data",
    fy: "FY{year}",
    backToSearch: "← Back to search",
    metric: "Metric",
    learnMore: "What does this mean?",
  },
  errors: {
    limit: "The daily data request limit has been reached. Please try again tomorrow.",
    search: "Could not load search results. Please try again later.",
    company: "Could not load this company's data. Please try again later.",
    column: "Could not load data.",
  },
  home: {
    title: "Find a Japanese employer",
    intro:
      "See the workplace figures Japanese companies publish: female managers, male parental leave, the gender pay gap, overtime, paid leave and more. Pick up to 4 companies to compare side by side, or rank them by what matters to you.",
    searchPlaceholder: "Company name, e.g. Toyota or トヨタ",
    searchLabel: "Company name",
    searchButton: "Search",
    searching: "Searching…",
    noResults: "No listed companies found for “{query}”. Try the Japanese name or a shorter keyword.",
    delisted: "Delisted",
    featuredTitle: "Featured employers",
    featuredNote:
      "Latest fiscal year with workplace data. Tags show where a figure came from when it is not in the securities report data; ⚠ marks an unusual value.",
  },
  company: {
    securitiesCode: "Securities code {code}",
    mandatoryTitle: "Mandatory disclosures",
    noCoreData:
      "No workplace diversity figures were found for this company. Companies with 300 or fewer employees are not required to disclose them.",
    viewReport: "View the FY{year} securities report on EDINET ↗",
    moreTitle: "Work-life balance, pay and growth",
    historyTitle: "Recent years (securities reports)",
    openFiling: "Open the source filing on EDINET",
    scopeNote:
      "FY = the fiscal year ending in that calendar year. Workplace figures and average salary cover the filing company itself; employee count and revenue are for the whole group.",
  },
  sources: {
    note:
      "Figures come from the securities report first. Gaps are filled by hand from the same report (tagged “checked”) or from the MHLW women's advancement database (tagged “MHLW”). ⚠ marks an unusual value (a possible data error or a different reporting format).",
    mhlwTag: "MHLW",
    mhlwTitle: "From the MHLW women's advancement database",
    mhlwTitlePeriod: "From the MHLW women's advancement database (period {period})",
    checkedTag: "checked",
    checkedTitle:
      "Read by hand from the securities report because the automated data was missing or wrong.",
    noDataTitle: "No data found in the securities report or the MHLW database.",
    unusualTitle:
      "Unusual value: it may be a data error or reported in a different format. Check the source filing.",
  },
  metrics: {
    female_manager_ratio: { label: "Female managers", help: "Share of managers who are women." },
    male_parental_leave_ratio: {
      label: "Male parental leave uptake",
      help: "Men who took parental leave, relative to men whose child was born that year. Can exceed 100%.",
    },
    gender_pay_gap_all: {
      label: "Women's pay vs. men's",
      help: "Women's average pay as a share of men's, all employees. 100% means the averages are equal.",
    },
    gender_pay_gap_regular: { label: "Women's pay vs. men's (regular)", help: "" },
    gender_pay_gap_nonregular: { label: "Women's pay vs. men's (non-regular)", help: "" },
    female_director_ratio: { label: "Female board members", help: "" },
    overtime_hours: { label: "Average overtime", help: "Average overtime per employee per month." },
    paid_leave_ratio: {
      label: "Paid leave taken",
      help: "Share of annual paid leave days that employees actually took.",
    },
    avg_annual_salary: { label: "Average annual salary", help: "Includes bonuses. Filing company only." },
    avg_tenure_years: {
      label: "Average tenure",
      help: "How long employees have stayed on average. A rough sign of retention.",
    },
    revenue_growth: {
      label: "Revenue growth",
      help: "Average yearly revenue growth over the last 3 fiscal years (group).",
    },
    num_employees: { label: "Employees (group)", help: "" },
  },
  units: {
    hoursPerMonth: "{value} h/month",
    years: "{value} years",
    perYear: "{value} / year",
  },
  groups: {
    diversity: "Diversity",
    workLife: "Work-life balance",
    payGrowth: "Pay, retention and growth",
  },
  badges: {
    remoteWork: "Remote work",
    remoteWorkHelp: "Has a remote work / work-from-home scheme.",
    flextime: "Flextime",
    flextimeHelp: "Has a flexible working hours scheme.",
    eruboshiLevel: "Eruboshi level {level}",
    platinumEruboshi: "Platinum Eruboshi",
    eruboshiHelp:
      "えるぼし: government certification for advancing women in the workplace (levels 1–3, Platinum is the highest).",
    kurumin: "Kurumin",
    platinumKurumin: "Platinum Kurumin",
    kuruminHelp: "くるみん: government certification for supporting employees raising children.",
    none: "No flexible work schemes or certifications listed in MHLW data.",
    noMhlw: "This company has not published data in the MHLW database.",
  },
  compare: {
    title: "Compare employers",
    metaTitle: "Compare employers",
    addAnother: "Add another company",
    upTo: "(up to {max}).",
    remove: "Remove",
    report: "FY{year} report ↗",
    noFiling: "No filing data",
    flexRow: "Flexible work & certifications",
    legend:
      "▲ best and ▼ weakest among the companies shown (for overtime, lower is better). Values marked ⚠ are unusual and are not ranked.",
    periodsNote:
      "Figures tagged MHLW or checked may cover a slightly different period from the securities report. Workplace figures and average salary cover the filing company itself; employee count and revenue are for the whole group.",
    best: "Best among companies shown",
    weakest: "Weakest among companies shown",
  },
  rank: {
    title: "Rank employers by what matters to you",
    metaTitle: "Rank employers",
    intro:
      "{count} well-known employers across industries. For each factor, a company scores 0–100 by how many of the others it beats. The total is the average of those scores, weighted by what you choose below. Missing data is skipped, never counted as zero.",
    failed: "{count} companies could not be loaded right now (the daily data limit may have been reached) and are not shown.",
    chooseFactor: "Choose at least one factor to see a ranking.",
    insufficientTitle: "Not enough data to rank",
    insufficientNote: "These companies have data for less than {percent}% of the factors you weighted.",
    footnote:
      "Scores are relative to the companies listed here, not to all employers in Japan. Overtime and paid leave come from the MHLW women's advancement database; other figures come from the latest securities reports.",
    strongOn: "Strong on: {list}",
    dataShare: "{percent}% data",
    howCalculated: "How this score is calculated",
    factor: "Factor",
    value: "Value",
    score: "Score",
    weight: "Weight",
    skipped: "skipped",
  },
  // Strings used by client components. Plain strings only (no functions),
  // because they are passed from the server to the browser.
  client: {
    compareAdd: "+ Compare",
    compareAdded: "✓ Comparing",
    compareFull: "You can compare up to {max} companies",
    trayLabel: "Compare ({count}/{max}):",
    trayRemove: "Remove {name}",
    trayClear: "Clear",
    trayGo: "Compare →",
    // {button} and {link} are replaced with the button label and a link.
    emptyCompare: "No companies selected yet. Use {button} on the {link} to add up to {max} companies.",
    emptyCompareLink: "search page",
    weightsLegend: "How much does each factor matter to you?",
    weightsReset: "Reset to defaults",
    weightsUpdating: "Updating…",
    weight0: "Ignore",
    weight1: "A little",
    weight2: "Important",
    weight3: "Very important",
  },
  // Industry names: pool industry keys (lib/companies.ts) and the Tokyo Stock
  // Exchange's 33 sector names returned by EDINET DB.
  industries: {
    automotive: "Automotive",
    electronics: "Electronics",
    itServices: "IT services",
    games: "Games",
    internet: "Internet services",
    telecom: "Telecom",
    pharma: "Pharmaceuticals",
    trading: "Trading",
    cosmetics: "Cosmetics",
    consumerGoods: "Consumer goods",
    food: "Food",
    retail: "Retail",
    financial: "Financial services",
    realEstate: "Real estate",
    airlines: "Airlines",
    leisure: "Leisure",
    machinery: "Machinery",
    chemicals: "Chemicals",
    "水産・農林業": "Fishery, agriculture & forestry",
    "鉱業": "Mining",
    "建設業": "Construction",
    "食料品": "Foods",
    "繊維製品": "Textiles & apparel",
    "パルプ・紙": "Pulp & paper",
    "化学": "Chemicals",
    "医薬品": "Pharmaceuticals",
    "石油・石炭製品": "Oil & coal products",
    "ゴム製品": "Rubber products",
    "ガラス・土石製品": "Glass & ceramics",
    "鉄鋼": "Iron & steel",
    "非鉄金属": "Nonferrous metals",
    "金属製品": "Metal products",
    "機械": "Machinery",
    "電気機器": "Electric appliances",
    "輸送用機器": "Transportation equipment",
    "精密機器": "Precision instruments",
    "その他製品": "Other products",
    "電気・ガス業": "Electric power & gas",
    "陸運業": "Land transportation",
    "海運業": "Marine transportation",
    "空運業": "Air transportation",
    "倉庫・運輸関連業": "Warehousing & logistics",
    "情報・通信業": "Information & communication",
    "卸売業": "Wholesale trade",
    "小売業": "Retail trade",
    "銀行業": "Banks",
    "証券、商品先物取引業": "Securities & commodity futures",
    "保険業": "Insurance",
    "その他金融業": "Other financial services",
    "不動産業": "Real estate",
    "サービス業": "Services",
  } as Record<string, string>,
  guide: {
    title: "Guide to Japanese workplace data",
    metaTitle: "Guide",
    intro:
      "Plain-language explanations of the terms and figures on this site, and how to read them when choosing an employer in Japan.",
    sections: [
      {
        id: "securities-report",
        title: "Securities report (有価証券報告書)",
        body: [
          "Every listed company in Japan files an annual securities report with the Financial Services Agency. It is published on the government's EDINET system and is the main source for this site.",
          "Since fiscal years ending on or after 31 March 2023, the report must include three workplace figures: the share of female managers, male parental leave uptake, and the gender pay gap.",
        ],
      },
      {
        id: "pay-gap",
        title: "Women's pay vs. men's (男女の賃金の差異)",
        body: [
          "This is women's average annual pay as a percentage of men's. 70% means women earn 70 yen on average for every 100 yen men earn.",
          "It is not a comparison of pay for the same job. A low figure usually means fewer women in senior or career-track roles, or more women in part-time work. Companies often explain the reasons in a note in the report.",
          "Some companies report the difference (e.g. 30%) instead of the ratio (70%). This site flags such values and corrects them by hand when confirmed.",
        ],
      },
      {
        id: "parental-leave",
        title: "Why male parental leave can exceed 100%",
        body: [
          "The legal formula divides the number of men who started parental leave this year by the number of men whose child was born this year.",
          "A father whose child was born last year but who takes leave this year is counted on top, so the rate can go above 100%. Some companies also count short childcare leave, which makes rates higher. Check the note in the report to see what is included.",
        ],
      },
      {
        id: "career-tracks",
        title: "Career track (総合職) and clerical track (一般職)",
        body: [
          "Many Japanese companies hire into separate tracks. Career-track (総合職) employees do core work, can be transferred to other cities or countries, and are on the path to management.",
          "Clerical-track (一般職) employees mainly do support work, rarely relocate, and have a lower pay ceiling. Historically most clerical-track employees have been women, which is a major reason for gender pay gaps. Some companies have merged or renamed these tracks.",
        ],
      },
      {
        id: "eruboshi",
        title: "Eruboshi certification (えるぼし)",
        body: [
          "A certification from the Minister of Health, Labour and Welfare for companies that advance women in the workplace. It looks at hiring, retention, working hours, the share of women in management, and career options.",
          "There are levels 1 to 3 depending on how many criteria are met. Platinum Eruboshi is the highest level.",
        ],
      },
      {
        id: "kurumin",
        title: "Kurumin certification (くるみん)",
        body: [
          "A certification for companies that support employees raising children, for example through parental leave uptake and reduced overtime. Platinum Kurumin is awarded to companies with an even higher standard.",
        ],
      },
      {
        id: "scope",
        title: "Filing company vs. group",
        body: [
          "Workplace figures and average salary usually cover only the company that files the report (単体), not its subsidiaries. Employee count and revenue cover the whole group (連結).",
          "For holding companies, the filing company may be a small head office, so its figures can differ a lot from the people who work at the operating companies.",
        ],
      },
      {
        id: "overtime-leave",
        title: "Overtime and paid leave",
        body: [
          "Since 2019, overtime is capped by law at 45 hours a month and 360 hours a year in principle. The figure here is the company's reported average per employee per month.",
          "Full-time employees get at least 10 days of annual paid leave after six months, rising with years of service. The paid leave figure shows the share of those days employees actually took.",
          "These figures come from the MHLW women's advancement database, where companies publish them voluntarily, so many companies have no data.",
        ],
      },
      {
        id: "sources",
        title: "Where the data comes from and what the tags mean",
        body: [
          "Untagged figures come from the securities report data provided by EDINET DB.",
          "“checked” means we read the figure by hand from the securities report because the automated data was missing or wrong.",
          "“MHLW” means the figure comes from the Ministry of Health, Labour and Welfare's women's advancement database, which companies update themselves. Its period may differ slightly from the securities report.",
          "⚠ marks a value outside the plausible range, for example a parental leave rate of 10,000%. It is shown but not used for comparisons or rankings. “No data” is never treated as zero.",
        ],
      },
    ],
  },
};

export type Dictionary = typeof en;
export type ClientDictionary = Dictionary["client"];
