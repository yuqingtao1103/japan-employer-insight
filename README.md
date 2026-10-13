# Japan Employer Insight

Compare Japanese employers on the workplace data they are legally required to disclose, in English and Chinese.

## Why

Since fiscal years ending on or after March 31, 2023, Japanese listed companies must disclose workplace diversity metrics in their annual securities reports (有価証券報告書), including the female manager ratio, male parental leave uptake, and the gender pay gap.

This data is public, but it is published only in Japanese and scattered across long filings. International job seekers, who often care most about these questions, have no easy way to compare employers.

## What it does

- **Side-by-side comparison** of up to 4 companies on mandatory workplace disclosures
- **Personalized ranking**: set how much each factor (salary, overtime, paid leave, tenure, growth, diversity) matters to you and see employers ranked by a transparent, explainable score
- **Browse by industry**: all ~1,900 listed companies with published workplace data, grouped by Tokyo Stock Exchange sector and sortable by each figure, with the sector median for comparison
- **Bilingual (EN/ZH)** interface and plain-language explainers for Japan-specific concepts such as 総合職 / 一般職 and the えるぼし / くるみん certifications
- **Traceable data**: every figure shows its fiscal year and links to its source filing

## Data sources

- EDINET, the Financial Services Agency's electronic disclosure system for securities reports, accessed through [EDINET DB](https://edinetdb.jp) (Powered by EDINET DB)
- 女性の活躍推進企業データベースオープンデータ（2026年10月13日時点）（https://positive-ryouritsu.mhlw.go.jp/positivedb/opendata/）を加工して作成. MHLW open data on overtime, paid leave, parental leave and certifications, processed into `data/mhlw-workplace.json`

- EDINET閲覧（提出）サイト EDINETコードリスト（https://disclosure2.edinet-fsa.go.jp/）をもとに作成 (PDL1.0). Listed company names, industries and corporate numbers, processed into `data/listed-companies.json` for local search

How sources are combined and what happens when a figure is missing: [docs/data-source-notes.md](docs/data-source-notes.md).

## Search engines and link previews

- `app/sitemap.ts` lists the main pages, all industry pages and the 30 ranking companies in both languages (other company pages are left out because each first visit uses an API request). `app/robots.ts` points crawlers to it.
- Every page declares its English and Chinese versions (hreflang) and a canonical URL.
- Shared links show a preview image: a site card by default, and for company pages the company name with the three mandatory figures (`opengraph-image.tsx`). Chinese and Japanese text uses Noto Sans SC, downloaded from Google Fonts with only the needed characters.

## Reporting a data error

Every company and industry page has a "Report a data error" link. It opens a GitHub issue form (`.github/ISSUE_TEMPLATE/data-error.yml`) with the company and page filled in; reports get the `data error` label. Confirmed fixes go into `lib/corrections.ts` with the filing's document ID.

## Development

Requires Node.js 20+.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set `EDINET_DB_API_KEY` (free key from https://edinetdb.jp/developers). Never commit `.env.local`.
3. Start the dev server: `npm run dev`, then open http://localhost:3000

See [docs/data-source-notes.md](docs/data-source-notes.md) for API fields, rate limits and data usage terms.

### Checks

- `npm test`: unit tests (Vitest) for search, data merging, ranking and industry medians
- `npm run typecheck`: TypeScript
- `npm run lint`: ESLint

GitHub Actions runs all three plus a production build on every push to `main` and on pull requests.

## Deployment

The site runs on [Vercel](https://vercel.com) (Hobby plan) with the GitHub integration: every push to `main` deploys automatically.

1. Import the GitHub repository in Vercel (framework preset: Next.js, no build settings to change).
2. In **Settings → Environment Variables**, add `EDINET_DB_API_KEY` (type Secret) for Production.
3. Deploy.

Company search runs locally on the EDINET code list, so it never uses the API. EDINET DB responses (company figures) are cached for a week with `use cache: remote` (Vercel Runtime Cache, kept across deploys); failed responses such as the daily limit are cached for one minute only. On Vercel this cache is shared across server instances and kept across deploys, so the free plan's 100 requests per day is enough for normal traffic. When the limit is reached, pages show a message instead of failing.

## Automatic updates

- **Company list**: the "Update company list" GitHub Action downloads the EDINET code list on the 2nd of each month, rebuilds `data/listed-companies.json`, runs the tests and commits if anything changed. It can also be started by hand from the Actions tab.
- **Ranking data**: Vercel Cron calls `/api/warm` every Monday at 01:00 UTC to load the 30 ranking companies into the cache. It does the same as opening the ranking page and reuses cached data, so it needs no secret; setting a `CRON_SECRET` environment variable in Vercel optionally restricts it to Vercel Cron.
- **MHLW data**: the download page blocks scripts, so refresh it by hand every few months (see [docs/data-source-notes.md](docs/data-source-notes.md), section 4).

## Status

Live at https://japan-employer-insight.vercel.app (English and Simplified Chinese).
