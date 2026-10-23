# Clinical Dataset Checker

**English** | [简体中文](README.zh-CN.md)

[![GitHub License](https://img.shields.io/github/license/YSH2015Ryan/Clinical-Dataset-Checker)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/YSH2015Ryan/Clinical-Dataset-Checker?style=social)](https://github.com/YSH2015Ryan/Clinical-Dataset-Checker)
[![GitHub Issues](https://img.shields.io/github/issues/YSH2015Ryan/Clinical-Dataset-Checker)](https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/issues)

**A privacy-first, local data quality pre-check tool for clinical research datasets.**

**[Try It Online →](https://ysh2015ryan.github.io/Clinical-Dataset-Checker/)**

---

## Value Proposition

Before diving into statistical analysis, researchers often spend hours manually inspecting data for:

- Missing values and inconsistent missing-data codes
- Duplicate records and duplicate participant IDs
- Formatting issues (dates, numbers, categories)
- Mixed types and anomalous values

**Clinical Dataset Checker** automates this tedious process with **15 deterministic rules** that identify common data quality issues in seconds — all without uploading your data anywhere.

### Key Benefits

| Feature              | Benefit                                                  |
| -------------------- | -------------------------------------------------------- |
| **Local Processing** | Your data never leaves your device — no server uploads   |
| **Privacy-First**    | Zero tracking, no analytics, no accounts required        |
| **15 Rules**         | Comprehensive coverage of common structural problems     |
| **Bilingual UI**     | Full support for English and Simplified Chinese          |
| **Multiple Formats** | CSV and XLSX support with separator auto-detection       |
| **Export Reports**   | HTML, JSON, and CSV formats                              |

---

## Quick Start

### Option 1: Use Online (Recommended)

Visit **<https://ysh2015ryan.github.io/Clinical-Dataset-Checker/>** — no installation, no data uploaded.

### Option 2: Run Locally

```bash
git clone https://github.com/YSH2015Ryan/Clinical-Dataset-Checker.git
cd Clinical-Dataset-Checker
npm install
npm run dev
# Open http://localhost:5173 in your browser
```

### Option 3: Build for Production

```bash
npm run build
# Outputs to dist/ — deployable to any static hosting
```

---

## How to Use (Step by Step)

The application guides you through five pages: **Home → Import → Preview → Results → Export**.

### Step 1 — Home

Two entry points:

- **Try Sample Dataset** — loads the bundled `sample-clinical-data.csv`, which contains intentional issues (duplicates, missing values, repeated IDs). Recommended for a first tour.
- **Check My File** — upload your own CSV or XLSX file.

The language switch button in the header toggles between English and 简体中文 at any time.

### Step 2 — Import & Configure

Drag and drop your file (or click to select). Limits: **25 MB**, **100,000 rows**, **500 columns**.

After parsing, configure how the file should be interpreted:

| Option                                | What it does                                                                                                                            |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Worksheet** (XLSX only)             | Choose which worksheet to analyze.                                                                                                      |
| **Separator** (CSV only)              | Field delimiter. Auto-detected by default (comma, semicolon, or tab); override if detection is wrong.                                   |
| **Header Row**                        | Which row contains your column names (default: row 1). Increase if your file has metadata lines above the headers.                      |
| **ID Column (optional)**              | The column that identifies participants. Enables the duplicate-ID check.                                                                |
| **Study Design**                      | Check *"Is this longitudinal data?"* if one participant has multiple rows. This downgrades duplicate IDs from a blocker to a warning.   |
| **Analysis Unit**                     | Free-text description of the unit of analysis (e.g., `per-participant`, `per-visit`). Recorded in the report for traceability.          |
| **Missing Data Markers**              | Comma-separated codes treated as missing, in addition to empty cells. Default: `NA, N/A, NULL, unknown, -`. Matching is case-insensitive. |
| **Date Columns**                      | Tick columns that should contain dates. Expected format is ISO `YYYY-MM-DD` (or `YYYY/MM/DD`); other values are flagged.                |
| **Start / End Date Column (optional)**| If set, rows where end date precedes start date are flagged.                                                                            |

Parsing warnings are shown here, e.g.:

- **Formula warning** (XLSX): cells contained formulas — only cached values are read, and they may be stale. Re-save the file in Excel if values look wrong.
- **CSV parser warnings**: malformed rows reported by the parser.

Click **Preview Data** to continue.

### Step 3 — Preview

Verify before checking:

- File name, size, total rows and columns
- The first 20 rows rendered as a table
- Any parsing warnings

If something looks wrong (wrong separator, wrong header row), use **Back to Import** to adjust the configuration. Otherwise click **Start Quality Check**.

### Step 4 — Review Results

The results page shows:

1. **Data Summary** — total rows, total columns, missing cells, total cells, missing rate.
2. **Issue list grouped by severity:**
   - **Blockers** (red) — the data cannot be reliably interpreted with the current configuration (e.g., duplicate column names). Fix these first.
   - **Warnings** (yellow) — issues you should review (e.g., duplicate IDs, invalid dates).
   - **Information** (blue) — facts worth knowing (e.g., missing-value counts, potential outliers).
3. **Filter by severity** to focus on one level at a time.

Click any issue card to expand it and see:

- **Columns** affected
- **Affected Rows** count
- **Sample data rows** (1-based row numbers, so you can locate them in your source file)
- **Suggested action** — concrete guidance on what to check or fix

If blockers are present, a banner warns that they must be reviewed before exporting.

### Step 5 — Export Report

Three formats are available:

| Format          | Contents                                                                     | Best for                            |
| --------------- | ---------------------------------------------------------------------------- | ----------------------------------- |
| **HTML Report** | Human-readable report with summary, severity sections, and issue details     | Sharing with collaborators, archiving |
| **JSON Data**   | Machine-readable report (`schemaVersion` included); **no raw data rows**     | Pipeline integration, audit trails  |
| **Issues (CSV)**| One row per issue detail, spreadsheet-compatible                             | Tracking fixes in Excel             |

If blockers were found, you must tick **"I have reviewed the blocker issues and want to export anyway"** before downloading. The exported report is marked as containing unresolved blockers.

Reports contain **check results only — never your raw dataset**.

---

## What It Checks

### Critical Issues (Blockers)

- **Duplicate Column Names** — columns that can't be uniquely identified after normalization

### Important Warnings

- **Empty Headers** — missing column names
- **Empty Rows / Columns** — completely blank records or fields
- **Exact Duplicate Rows** — identical records appearing multiple times
- **Duplicate IDs** — non-unique participant identifiers (warning only, or blocker if not longitudinal)
- **Mixed Data Types** — single column containing numbers, text, and/or dates
- **Numeric Format Ambiguity** — unclear decimal/thousand separators (e.g., `1,234` vs `1.234`)
- **Invalid Dates** — unparseable values in declared date columns
- **Date Order Issues** — end date earlier than start date
- **Possible Outcome Leakage** — column names suggesting outcome information

### Informational Items

- **Missing Values** — count and percentage per column
- **Constant Columns** — columns with only one unique value
- **High-Cardinality Categories** — text columns with >50% unique values
- **Outlier Detection** — IQR method (values beyond Q1 − 1.5×IQR or Q3 + 1.5×IQR, R Type 7 quantile definition)

All rules are **deterministic**: the same file and configuration always produce the same result.

---

## Privacy & Security

- **100% local processing** — all parsing and analysis happens in your browser's JavaScript engine
- **Zero transmissions** — no `fetch`/XHR/WebSocket calls to external servers; no uploads
- **No tracking** — no analytics, cookies, or accounts
- **Data lifecycle**: load → analyze in memory → display → export to your device → discarded on page close

**Verify it yourself:** open Developer Tools (F12) → Network tab, import a file, and confirm no external requests are made.

---

## Supported Formats

| Format | Details                                                                                  |
| ------ | ---------------------------------------------------------------------------------------- |
| CSV    | Comma / semicolon / tab delimiters, auto-detected; UTF-8 with BOM support                |
| XLSX   | Worksheet selection; configurable header row; formula cells read as cached values        |

**Not supported:** XLS, SAV, DTA, Parquet, databases. Limits: 25 MB / 100,000 rows / 500 columns.

---

## What This Tool Does NOT Do

- **No medical interpretation** — does not assess clinical significance
- **No automatic repair** — never modifies your data
- **No statistical advice** — does not recommend analysis methods
- **No compliance verification** — does not certify HIPAA/GDPR/21 CFR Part 11 compliance
- **Not for regulatory submissions** — not validated software for FDA/EMA filings

Use this as a **first-pass quality check** before formal analysis, combined with your domain expertise and data management policies.

---

## Troubleshooting

| Error message                                                        | Cause & fix                                                                                  |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| "This file format is not supported"                                  | Only `.csv` and `.xlsx` are accepted. Convert other formats first.                            |
| "File exceeds 25 MB limit"                                           | Split the file or remove unneeded columns.                                                    |
| "This file contains no data"                                         | The file is empty or all rows were consumed by the header row setting.                        |
| "Data exceeds limits: 100,000 rows or 500 columns"                   | Subset the data before checking.                                                              |
| "Duplicate column names found"                                       | Rename duplicate headers in the source file, then re-import.                                  |
| "Unable to read this file"                                           | Corrupted or mis-encoded file. Re-export as UTF-8 CSV or re-save in Excel.                    |
| "Invalid header row index"                                           | The header row number is larger than the file's row count.                                    |
| Formula warning (XLSX)                                               | Formulas are not recalculated; open the file in Excel, re-save, and re-import.                |
| Everything parsed into one column (CSV)                              | Wrong separator — go back and select the correct one manually.                                |

---

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Available Scripts

```bash
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run test       # Unit tests (Vitest, 120+ cases)
npm run e2e        # End-to-end tests (Playwright, Chromium + Firefox)
npm run lint       # ESLint
npm run format     # Prettier
```

### Tech Stack

React 18 · TypeScript (strict) · Vite 5 · PapaParse · SheetJS · i18next · Vitest · Playwright

### Project Structure

```
src/
├── lib/
│   ├── rules/        # 15 deterministic quality rules
│   ├── parsers/      # CSV/XLSX parsing
│   └── export/       # HTML/JSON/CSV report builders
├── components/       # React pages (Home, Import, Preview, Results, Export, ...)
├── i18n/             # en.json + zh-CN.json
└── types/            # TypeScript definitions

tests/
├── unit/             # Vitest unit tests (rules, parsers, export)
├── e2e/              # Playwright end-to-end tests
└── fixtures/         # Test datasets (clean, missing codes, bad headers, ...)

docs/                 # Privacy policy, failure catalog
.github/workflows/    # CI (test) + CD (deploy to GitHub Pages)
```

---

## Deployment (GitHub Pages)

The `deploy` workflow uses [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages), which publishes `dist/` to the **`gh-pages` branch**. Therefore:

1. Push to `main` — the workflow builds and pushes the `gh-pages` branch automatically.
2. Go to **Settings → Pages → Source: "Deploy from a branch" → Branch: `gh-pages`** (root). Save.
3. The site appears at `https://<username>.github.io/<repo>/` within a minute or two.

> Do **not** select "GitHub Actions" as the Pages source — that mode expects a different deployment flow and the `gh-pages` branch will not be served.

---

## Testing

```bash
npm run test   # 120+ unit tests: rule oracles, Type-7 quantile checks, parser edge cases,
               # export safety (no raw data, XSS escaping), determinism
npm run e2e    # 5 end-to-end flows: sample→check→export, i18n switch,
               # static pages, "no external requests" privacy assertion
```

---

## FAQ

**Q: Will my data be safe?**
Yes — all processing is local. Verify via DevTools → Network: zero external requests.

**Q: Can I use this for large datasets?**
Up to 100,000 rows × 500 columns. For larger data, use R/Python/SQL tooling.

**Q: Which languages are supported?**
English and Simplified Chinese. Contributions of other translations are welcome.

**Q: Can I customize the rules?**
Not in v1.0 — rules are fixed. Feature requests: open an Issue.

**Q: Can I use it offline?**
Yes — clone the repo, `npm install && npm run dev`, or serve the built `dist/` folder locally.

**Q: Does it work for regulatory submissions?**
No. It is a pre-check aid, not validated software for FDA/EMA submissions.

---

## Documentation

| Document                                                       | Purpose                                   |
| -------------------------------------------------------------- | ----------------------------------------- |
| [docs/privacy-and-limitations.md](docs/privacy-and-limitations.md) | Data handling policy, tool scope       |
| [docs/failure-catalog.md](docs/failure-catalog.md)             | Error messages and troubleshooting        |
| [01_clinical_dataset_checker_plan.md](01_clinical_dataset_checker_plan.md) | v1.0 specification (Chinese) |

---

## Contributing

Contributions welcome — bug reports, feature requests, translations, and pull requests. Guidelines:

- TypeScript strict mode, no `any`
- New rules require unit tests and must be deterministic
- No external API dependencies (privacy requirement)
- Update both `en.json` and `zh-CN.json` for user-facing text

---

## License

MIT — see [LICENSE](LICENSE).

---

## Resources

- **Live App**: <https://ysh2015ryan.github.io/Clinical-Dataset-Checker/>
- **Issues**: <https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/issues>
- **Discussions**: <https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/discussions>
