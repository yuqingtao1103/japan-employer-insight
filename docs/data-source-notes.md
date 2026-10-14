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

### Verified with real API calls (2026-10-12, Toyota E02144 and Sony E01777)

- **English names**: `search`, `companies` and `companies/{code}` all return `name_en` (e.g. `TOYOTA MOTOR CORPORATION`) alongside `name_ja`. Search accepts Japanese and English queries.
- **Source filing link**: every `financials` row with a filing has `doc_id` (e.g. `S100Y8NY`). The FSA viewer URL `https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?{doc_id}` opens the original securities report.
- **Fiscal year**: `fiscal_year` is the calendar year in which the fiscal year ends. Toyota `fiscal_year: 2026` = April 2025 – March 2026.
- **Diversity coverage**: both companies have diversity figures only for FY2024–FY2026. FY2023 (the first mandatory year) is empty in EDINET DB even though the filings should contain it. Expect at most 3 years of history.
- **Missing values**: fields are omitted, not `null`. Sony has no `male_parental_leave_ratio` in any year (holding company), so the UI must show "not disclosed".
- **Scope**: the response's `meta.non_consolidated_fields` lists `avg_annual_salary` as non-consolidated (filing company only); `num_employees` is consolidated.
- **Rate-limit headers**: responses include `x-ratelimit-remaining`, `x-ratelimit-monthly-remaining` and `x-ratelimit-reset`. The first month's limit is prorated (1,800 for a key created on 2026-10-12).
- **Unknown company**: `GET /companies/{code}` returns `404` with `{"error":{"code":"not_found",...}}`.

### Coverage and data quality (checked 2026-10-12)

- **Not every company has diversity data.** Search covers all 3,979 companies in EDINET DB (3,810 currently listed), but disclosure is only mandatory for larger employers: female manager ratio and pay gap for companies with 301+ employees; male parental leave for 1,000+ employees (300+ from April 2025). Smaller companies often show nothing.
- **Small companies give extreme values.** E.g. 100% female managers when a company has only a handful of managers. Always read figures together with headcount.
- **Extraction errors exist.** The parental leave ranking includes a value of 10,000% (リンコーコーポレーション, FY2026). Values above ~200% can be legitimate under the legal formula; 10,000% is not.
- **Reporting formats differ.** The law asks for women's pay as a percentage of men's, but some companies file the difference instead. Mercari's FY2026 filing reports 29.26 (all workers), which EDINET DB stores as `0.2926`; the real ratio is about 71%. Values cannot be converted automatically, because a low ratio can also be genuine (e.g. retailers with many female part-timers).
- **What the app does:** `lib/metrics.ts` defines a plausible range per metric (ratios 0–100%, parental leave 0–500%, pay ratio 35–150%). Values outside it are shown with ⚠ and excluded from highest/lowest markers on the compare page. The source filing link is always shown so users can check.
- **Ranking endpoint**: `/v1/rankings/{metric}` returns at most the top 500 companies and omits `name_en`, so it cannot be used to measure full coverage.

### Still to fill from elsewhere

- **えるぼし / くるみん certifications**: not provided by EDINET DB. Now taken from MHLW data (see section 4).
- **Extraction gaps**: EDINET DB misses some values that are in the filings. Checked examples: Mitsubishi Corporation FY2026 male parental leave 52.6% (S100YB25) and Shiseido FY2025 91.1% (S100XSCU) are in the reports but missing in EDINET DB.
- **FY2023 diversity figures**: could be filled from the official EDINET API if we want a 4-year history.

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
2. Cache responses outside git: `.cache/` locally during development (`lib/dev-cache.ts`), and `use cache: remote` (Vercel Runtime Cache) in production, kept for a week. Note: with Cache Components enabled, `fetch(..., { cache: "force-cache" })` is not cached on Vercel; this was found on 2026-10-13 after the daily limit was used up by uncached page views.
3. Show "Powered by EDINET DB" and a disclaimer (Terms §3: not investment advice, data may contain extraction errors) on the site.
4. If we later want to commit a data snapshot (e.g. for a static demo), ask Cabocia for written permission first: edinetdb@cabocia.jp.

## Other notes

- No SLA; the service may change or stop without notice. Keep the data layer swappable.
- The official EDINET API from the FSA is a possible fallback or alternative source; its terms have not been reviewed yet.

## 4. Second source: MHLW women's advancement database (open data)

Reviewed 2026-10-12.

- Source: 女性の活躍推進企業データベース オープンデータ, https://positive-ryouritsu.mhlw.go.jp/positivedb/opendata/
- Terms: https://positive-ryouritsu.mhlw.go.jp/positivedb/opendata/riyoukiyaku.html. Government of Japan Standard Terms of Use 2.0, compatible with CC BY 4.0. Copying, redistribution, modification and commercial use are allowed. **Attribution is required**, and processed data must say it was processed and must not look like it was made by the government. Numeric data and simple tables are not copyrighted at all.
- Format: one CSV (UTF-8, ZIP, ~11 MB compressed / 91 MB raw, 66,003 rows, 236 columns), updated daily. The download page blocks scripted downloads (HTTP 403), so download it in a browser.
- Content is entered by the companies themselves, so periods and scopes vary. Each row has the data period and "as of" date.

Fields we use (all per company, filing company scope):

| Field | Column | Listed-company coverage* |
|---|---|---|
| Male parental leave uptake | 5. 男女別の育児休業取得率-男性 | 69% |
| Average monthly overtime (hours) | 6. 平均残業時間 | 53% |
| Paid leave taken | 8.(1) 年次有給休暇の取得率 (fallback 8.(2) first category) | 24% (more with fallback) |
| Female managers | 10. 管理職に占める女性労働者の割合 | 86% |
| Female board members | 11. 役員に占める女性の割合 | 62% |
| Women's pay vs. men's (all / regular / non-regular) | 14. 男女の賃金の差異 1–3 | 82% |
| Remote work / flextime schemes | 在宅勤務・テレワーク / フレックスタイム制度 | flag only |
| えるぼし / くるみん certifications | 企業認定等 | all rows |

\* Share of the 2,302 rows that have a securities code. Many listed companies (e.g. Toyota, Mitsubishi Corporation) have no securities code in this data, so the real coverage is higher.

Matching: rows are joined to EDINET companies by **corporate number (法人番号)**, which EDINET DB returns as `corporate_number`. Securities codes are often blank, so they are not used.

Processing: `scripts/build-mhlw-data.mjs` keeps companies with 301+ employees that report at least one figure (15,412 companies), converts percentages to decimals and writes `data/mhlw-workplace.json` (~3.3 MB). This processed file is committed (allowed by the terms) and credited in the site footer and README.

To refresh: download the full CSV (UTF-8 without BOM) from the open data page, unzip it, then run
`node scripts/build-mhlw-data.mjs <csv> <YYYY-MM-DD>` with the "last updated" date shown on the page.

## 5. What we do when a figure is missing

Each figure goes through these steps, and the page shows which one it came from:

1. **Securities report via EDINET DB** (default). Used if present and plausible.
2. **Manual correction** (`lib/corrections.ts`, tagged "checked"). A value read by hand from the same securities report, with the EDINET document ID. Used only for pool companies where we confirmed EDINET DB missed or misread it (Shiseido parental leave, Mercari pay ratio).
3. **MHLW open data** (tagged "MHLW"). Used if present and plausible. Periods may differ slightly from the securities report, so the period is shown on hover.
4. **Implausible value** (shown with ⚠). Kept visible but excluded from best/weakest markers and from ranking.
5. **No data** (shown as "No data" / "—"). Never treated as zero. Possible reasons: company below the legal size threshold, not reported, or not extracted. The source filing link is always shown so users can check.

In the ranking, each factor is scored only among companies that have it; the total is a weighted average over the factors a company has. Companies with data for less than 60% of the chosen weight are listed separately as "Not enough data to rank" instead of being ranked.

## 6. Gap audit of the 30 ranking companies (2026-10-12)

Every factor used in the ranking was checked for all 30 companies. Where a figure was missing or came from MHLW, the latest securities report was read (sections 従業員の状況 and サステナビリティに関する考え方及び取組).

**EDINET DB misses male parental leave often.** When the report has it, it usually matches MHLW (ORIX 98.4%, JAL 96.4%, Fujitsu 94.1%, Sony 84%, Keyence 84.7%, Mitsubishi Corporation 52.6%). Exceptions, now in `lib/corrections.ts`:

| Company | Figure | Securities report | Other source | Doc ID |
|---|---|---|---|---|
| Astellas | Male parental leave FY2026 | 72.7% | MHLW 82.8% | S100YBPK |
| LY Corporation | Male parental leave FY2026 | 100.0% | none | S100YBXD |
| Shiseido | Male parental leave FY2025 | 91.1% | none | S100XSCU |
| Mercari | Pay ratio FY2026 | 70.74% (reported as gap 29.26%) | MHLW 68.0% (older) | S100Z2BE |
| Mercari | Paid leave FY2026 | 83.4% | MHLW 75.1% (FY2025) | S100Z2BE |
| Oriental Land | Overtime FY2026 | 14h05m / month | none | S100YCJX |
| Oriental Land | Paid leave FY2026 | 99.5% (regular employees) | none | S100YCJX |

**Confirmed not published anywhere we can use** (not in the securities report, not in MHLW data):

- Average overtime: Astellas, LY Corporation, Mercari, Shiseido, Nintendo, Ryohin Keikaku, Komatsu, Rakuten, Shin-Etsu, Keyence, CyberAgent.
- Paid leave taken: Astellas, Hitachi, Ryohin Keikaku, Rakuten.
- Female managers: Keyence (its report discloses only parental leave and the pay gap).

**Flagged as unusual (⚠), kept but not ranked:** Nomura Research Institute overtime 0.0 h (MHLW; likely not measured under a discretionary work system), Komatsu paid leave 103.0% (MHLW; probably counts carried-over days).

Kao and Oriental Land were missing from the first MHLW match because of name differences. Kao is listed as "花王株式会社（Kao Corporation）" and is now matched by corporate number 4010001034760; Oriental Land has no MHLW entry.

## 7. Third source: EDINET code list (local company search)

Added 2026-10-12 so that searching does not spend EDINET DB requests (every new search used to cost one).

- Source: the FSA's EDINET code list, `EdinetcodeDlInfo.csv` inside https://disclosure2dl.edinet-fsa.go.jp/searchdocument/codelist/Edinetcode.zip (Shift_JIS, ~11,400 filers, updated daily). It is offered as a download on the EDINET site; scraping the site is prohibited, so only this file is used.
- Terms: EDINET content is under the Public Data License 1.0 (PDL1.0), which allows redistribution and processing with attribution, and requires saying the data was processed. Credited in the site footer and README.
- Processing: `scripts/build-company-index.mjs` keeps the 3,816 listed companies (上場区分 = 上場) with name, English name, reading (kana), industry, securities code and corporate number, written to `data/listed-companies.json` (~600 KB).
- Use: `lib/company-index.ts` searches names in Japanese, English or kana (hiragana is folded to katakana, full/half width and legal suffixes like 株式会社 / Co., Ltd. are ignored) and by securities code. It also supplies company names and corporate numbers for company and compare pages, so those pages call EDINET DB only for the financial figures.
- To refresh: download the ZIP, unzip, run `node scripts/build-company-index.mjs <EdinetcodeDlInfo.csv>`.
- Delisted companies are not in the list; their pages fall back to the EDINET DB API.

## 8. Industry medians

`lib/benchmarks.ts` joins the EDINET code list (industry, corporate number) with MHLW data and computes, for each of the 33 Tokyo Stock Exchange sectors, the median of: female managers, male parental leave, pay ratio (all workers), female board members, overtime and paid leave. 1,885 of 3,816 listed companies have MHLW data. Implausible values are excluded, and a median is shown only when at least 5 companies in the sector report the figure (sectors such as air and marine transportation currently have fewer). Medians are computed at server start from the committed data files, so they cost no API requests. Salary, tenure and revenue growth have no industry median because those come only from the API.

## 9. Cache check on production (2026-10-14)

- Quota before: 83 left. Warming `/api/warm` loaded all 30 ranking companies and used 22 requests (8 were already cached by earlier visitors).
- A second warm-up plus 11 views of the ranking, company, compare and home pages used 0 requests (the only one counted was the quota check itself).
- The EDINET DB daily limit appears to reset at midnight Japan time (11:00 EDT / 10:00 EST); `x-ratelimit-reset` shows the current Japan date.
