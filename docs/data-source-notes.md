# Data Source Notes: EDINET DB

Reviewed on 2026-10-12 from:

- API docs: https://edinetdb.jp/developers
- Terms of use: https://edinetdb.jp/legal/terms (last updated 2026-10-06)

EDINET DB is a third-party service run by Cabocia Inc. It extracts structured data from the annual securities reports (有価証券報告書) filed on the FSA's EDINET system. It is not affiliated with the FSA. The underlying EDINET filings are public; Cabocia does not claim copyright on the raw figures, but its terms govern how data obtained through its API may be used.

## 1. Fields we need

### Available

Base URL: `https://edinetdb.jp/v1`. Auth: `X-API-Key` header.

| Endpoint | Use for us |
|---|---|
| `GET /v1/search?q=` | Find a company by name (auth optional) |
| `GET /v1/companies` | List companies (~3,800 listed companies) |
| `GET /v1/companies/{edinet_code}` | Company profile |
| `GET /v1/companies/{edinet_code}/financials` | Yearly time series, includes workplace metrics below |
| `GET /v1/companies/{edinet_code}/text-blocks` | Narrative text from the filing (e.g. business description) |
| `GET /v1/industries`, `/v1/industries/{slug}` | Industry list and companies per industry |

Workplace-related fields returned by `financials` (one row per `fiscal_year`):

| Field | Meaning | Notes |
|---|---|---|
| `female_manager_ratio` | Female manager ratio | Decimal ratio (0.04 = 4%) |
| `male_parental_leave_ratio` | Male parental leave uptake | Decimal ratio |
| `gender_pay_gap_all` | Gender pay gap, all employees | Decimal ratio |
| `gender_pay_gap_regular` | Gender pay gap, regular employees | Decimal ratio |
| `gender_pay_gap_nonregular` | Gender pay gap, non-regular employees | Decimal ratio |
| `female_director_ratio`, `female_directors`, `male_directors` | Board gender composition | |
| `avg_annual_salary` | Average annual salary (JPY) | Filing company only |
| `avg_age`, `avg_tenure_years` | Average age and tenure | Filing company only |
| `num_employees`, `temp_employees` | Headcount, temporary staff | |
| `fiscal_year`, `accounting_standard` | Fiscal year and accounting standard | Needed for "traceable data" |

Coverage is documented as FY2020–FY2025. Fields are omitted (not `null`) when a company does not report them, so the app must handle missing values.

### Gaps to verify or fill from elsewhere

- **Coverage of diversity fields** is not listed in the docs' coverage table. Mandatory disclosure only started with fiscal years ending on or after 2023-03-31, so expect gaps before FY2022. Verify with real calls once we have a key.
- **Link to the source filing** (EDINET document ID / URL): not shown in the field list. Need to check whether `financials` or `companies/{code}` returns a document ID. If not, link to the company's EDINET page by `edinet_code`.
- **English company names**: not confirmed in the docs. Check the `companies` response.
- **えるぼし / くるみん certifications**: not provided by EDINET DB. These come from the Ministry of Health, Labour and Welfare and would need a separate source.
- **Scope of figures**: diversity metrics in securities reports are reported for the filing company and, in some cases, major subsidiaries separately. Check which value EDINET DB returns.

## 2. Rate limits

| Plan | Price (tax incl.) | Requests/day | Max/month |
|---|---|---|---|
| Free | ¥0, no card | 100 | ~3,100 |
| Pro | ¥4,980/month | 1,000 | ~31,000 |
| Developer | ¥29,800/month | 10,000 | ~310,000 |
| Academy | Free for researchers with ac.jp / .edu email | 1,000 | — |

- All plans get every endpoint and every field; only the limits differ.
- One HTTP request (or one MCP tool call) = one request, regardless of response size.
- Over the limit returns HTTP `429`.
- Monthly limit = daily limit × days on the plan that month, reset on the 1st (JST).
- Creating multiple accounts or keys to get around limits is prohibited.

Implication: fetching `financials` for all ~3,800 companies would take ~38 days on Free. We should start with a curated list of companies (e.g. 100–300 large employers) and cache responses.

## 3. Caching and storing data in a public repo

**Allowed** (Terms §4, §5-1):

- Commercial use on all plans.
- Building and publishing an app or dashboard with the data, **with attribution** ("Powered by EDINET DB" or equivalent; badge available).
- Caching API responses **temporarily for performance**, as long as we periodically re-fetch from the API.
- Using one personal key from our own local machine, CI and server is not considered shared use.

**Prohibited** (Terms §4, §5-2, §5-3):

- Redistributing all or most of the data to third parties as a database, file or any other form outside the API.
- Building a wrapper/proxy API that offers equivalent data to others.
- Scraping or crawling the EDINET DB website. Data must come through the API only.
- Publishing, sharing or transferring the API key.
- Storing the data directly in a third party's system or database without a separate contract.

**Conclusion:** committing cached API responses to this public GitHub repo is **not safe**. Anyone could download the files, which looks like file-based redistribution outside the API (§5-2), and a stored copy that is never refreshed is not "temporary caching" (§5-1). A small subset is a grey area, not a clear permission.

Recommended approach:

1. Keep the API key in `.env.local` locally and in the hosting provider's environment variables. Call the API only from server-side code so the key never reaches the browser.
2. Cache responses outside git (a git-ignored folder locally; framework-level caching with periodic revalidation in production).
3. Show "Powered by EDINET DB" and a disclaimer (Terms §3: not investment advice, data may contain extraction errors) on the site.
4. If we later want to commit a data snapshot (e.g. for a static demo), ask Cabocia for written permission first: edinetdb@cabocia.jp.

## Other notes

- No SLA; the service may change or stop without notice. Keep the data layer swappable.
- The official EDINET API from the FSA is a possible fallback or alternative source; its terms have not been reviewed yet.
