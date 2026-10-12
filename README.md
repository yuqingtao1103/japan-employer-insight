# Japan Employer Insight

Compare Japanese employers on the workplace data they are legally required to disclose, in English and Chinese.

## Why

Since fiscal years ending on or after March 31, 2023, Japanese listed companies must disclose workplace diversity metrics in their annual securities reports (有価証券報告書), including the female manager ratio, male parental leave uptake, and the gender pay gap.

This data is public, but it is published only in Japanese and scattered across long filings. International job seekers, who often care most about these questions, have no easy way to compare employers.

## What it does

- **Side-by-side comparison** of up to 4 companies on mandatory workplace disclosures
- **Personalized ranking**: set how much each factor (salary, overtime, paid leave, tenure, growth, diversity) matters to you and see employers ranked by a transparent, explainable score
- **Bilingual (EN/ZH)** interface and plain-language explainers for Japan-specific concepts such as 総合職 / 一般職 and the えるぼし / くるみん certifications
- **Traceable data**: every figure shows its fiscal year and links to its source filing

## Data sources

- EDINET, the Financial Services Agency's electronic disclosure system for securities reports, accessed through [EDINET DB](https://edinetdb.jp) (Powered by EDINET DB)
- 女性の活躍推進企業データベースオープンデータ（2026年10月13日時点）（https://positive-ryouritsu.mhlw.go.jp/positivedb/opendata/）を加工して作成. MHLW open data on overtime, paid leave, parental leave and certifications, processed into `data/mhlw-workplace.json`

How sources are combined and what happens when a figure is missing: [docs/data-source-notes.md](docs/data-source-notes.md).

## Development

Requires Node.js 20+.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set `EDINET_DB_API_KEY` (free key from https://edinetdb.jp/developers). Never commit `.env.local`.
3. Start the dev server: `npm run dev`, then open http://localhost:3000

See [docs/data-source-notes.md](docs/data-source-notes.md) for API fields, rate limits and data usage terms.

## Status

In development. Live demo link and screenshots coming soon.
