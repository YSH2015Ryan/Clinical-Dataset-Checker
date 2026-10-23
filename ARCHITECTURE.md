# Architecture & Process Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Browser (Client-Side Only)                │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    React UI Layer                      │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ Home → Import → Preview → Results → Export       │  │ │
│  │  │ (English / 简体中文 Toggle)                       │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           File Processing Engine                       │ │
│  │  ┌──────────────┬──────────────────────────────────┐   │ │
│  │  │              │   Data Parsing Layer             │   │ │
│  │  │  CSV/XLSX    │  ┌────────────────────────────┐  │   │ │
│  │  │  Detection   │  │ PapaParse (CSV)            │  │   │ │
│  │  │  │           │  │ SheetJS (XLSX)             │  │   │ │
│  │  │  └─→ Parse   │  │ Auto Delimiter Detection   │  │   │ │
│  │  │              │  └────────────────────────────┘  │   │ │
│  │  └──────────────┴──────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │      Quality Check Engine (15 Deterministic Rules)     │ │
│  │                                                         │ │
│  │  ├─ HEADER_EMPTY, HEADER_DUPLICATE                    │ │
│  │  ├─ ROW_EMPTY, COLUMN_EMPTY                           │ │
│  │  ├─ MISSING_VALUES, DUPLICATE_ROWS, DUPLICATE_ID      │ │
│  │  ├─ MIXED_TYPES, NUMERIC_PARSE_AMBIGUITY             │ │
│  │  ├─ INVALID_DATE, DATE_ORDER                          │ │
│  │  ├─ CONSTANT_COLUMN, HIGH_CARDINALITY                │ │
│  │  ├─ OUTLIER_IQR_FLAG                                  │ │
│  │  └─ POSSIBLE_OUTCOME_LEAKAGE                          │ │
│  │                                                         │ │
│  │  Output: Issue[] {                                     │ │
│  │    ruleId, severity, columnNames,                      │ │
│  │    rowIndexes, affectedCount, details                  │ │
│  │  }                                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Report Generation & Export                    │ │
│  │                                                         │ │
│  │  ├─ HTML Report (Browser viewable)                    │ │
│  │  ├─ JSON Export (Machine readable)                    │ │
│  │  └─ CSV Export (Spreadsheet compatible)               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  🔒 IMPORTANT: All data stays here ↑                        │
│     No API calls, No server uploads, No tracking           │
└─────────────────────────────────────────────────────────────┘
```

---

## User Workflow

```
START
  │
  ▼
┌──────────────────┐
│   Home Page      │  "I have research data to check"
│  Try Sample or   │  
│  Check My File   │
└────────┬─────────┘
         │
         ▼
    ┌─────────────────────────────┐
    │ IMPORT & CONFIGURE          │
    ├─────────────────────────────┤
    │ ✓ Upload CSV/XLSX           │
    │ ✓ Select delimiter (CSV)    │
    │ ✓ Specify header row        │
    │ ✓ Choose ID column          │
    │ ✓ Set missing markers       │
    │ ✓ Declare study design      │
    └────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ PREVIEW                     │
    ├─────────────────────────────┤
    │ ✓ Display 20 sample rows    │
    │ ✓ Show metadata             │
    │ ✓ Report parsing warnings   │
    └────────┬────────────────────┘
             │
        ┌────┴─────┐
        │ Looks OK? │
        └────┬──────┘
             │ Yes
             ▼
    ┌─────────────────────────────┐
    │ QUALITY CHECK (15 Rules)    │
    ├─────────────────────────────┤
    │ Run all rules in sequence   │
    │ Collect issues              │
    │ Calculate statistics        │
    │ Generate metadata           │
    └────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ RESULTS                     │
    ├─────────────────────────────┤
    │ Blockers (Red)    [0-N]     │
    │ Warnings (Yellow) [0-N]     │
    │ Info (Blue)       [0-N]     │
    │                             │
    │ Sort/Filter by severity     │
    │ Click to view details       │
    │ See affected rows/columns   │
    └────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ EXPORT REPORT               │
    ├─────────────────────────────┤
    │ □ HTML (browser view)       │
    │ □ JSON (machine readable)   │
    │ □ CSV (spreadsheet)         │
    │                             │
    │ Download to local machine   │
    └────────┬────────────────────┘
             │
             ▼
           END
    "Ready for analysis!"
```

---

## Data Processing Pipeline

```
Input File (CSV/XLSX)
        │
        ▼
┌──────────────────────┐
│ File Validation      │
├──────────────────────┤
│ • Check extension    │
│ • Verify size (25MB) │
│ • Detect format      │
└─────────┬────────────┘
          │ Valid?
          ├─── No ──→ Error Message → Retry
          │
          Yes
          │
          ▼
┌──────────────────────────────┐
│ Parsing                      │
├──────────────────────────────┤
│ • CSV: Auto-detect separator │
│ • XLSX: Read first sheet     │
│ • Normalize encodings        │
└─────────┬────────────────────┘
          │
          ▼
┌──────────────────────────────┐
│ Column Configuration         │
├──────────────────────────────┤
│ • Extract headers            │
│ • Set header row index       │
│ • Select ID column           │
│ • Define missing markers     │
└─────────┬────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Build DatasetProfile Object      │
├──────────────────────────────────┤
│ {                                │
│   fileName, fileSize, format,    │
│   headers[], rows[][],           │
│   totalRows, totalColumns,       │
│   idColumnIndex, allowedMarkers, │
│   isLongitudinal, analysisUnit   │
│ }                                │
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Execute Quality Check Rules      │
├──────────────────────────────────┤
│ 1. HEADER_EMPTY                  │
│ 2. HEADER_DUPLICATE → BLOCKER!   │
│ 3. ROW_EMPTY                     │
│ 4. COLUMN_EMPTY                  │
│ 5. MISSING_VALUES                │
│ 6. EXACT_DUPLICATE_ROWS          │
│ 7. DUPLICATE_ID                  │
│ 8. MIXED_TYPES                   │
│ 9. NUMERIC_PARSE_AMBIGUITY       │
│ 10. INVALID_DATE_CANDIDATE       │
│ 11. DATE_ORDER                   │
│ 12. CONSTANT_COLUMN              │
│ 13. HIGH_CARDINALITY_CATEGORY    │
│ 14. OUTLIER_IQR_FLAG             │
│ 15. POSSIBLE_OUTCOME_LEAKAGE     │
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Collect Issues                   │
├──────────────────────────────────┤
│ Issue[] {                        │
│   ruleId, severity,              │
│   titleKey, descriptionKey,      │
│   columnNames, rowIndexes,       │
│   affectedCount, details,        │
│   actionKey                      │
│ }                                │
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Generate CheckResult             │
├──────────────────────────────────┤
│ {                                │
│   datasetProfile,                │
│   issues[],                      │
│   ruleVersion: "1.0.0",          │
│   appVersion: "1.0.0",           │
│   runTimestamp,                  │
│   config                         │
│ }                                │
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Render Results to UI             │
├──────────────────────────────────┤
│ • Sort by severity               │
│ • Display summary counts         │
│ • Show affected rows/columns     │
│ • Provide actionable suggestions │
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ User Exports Report              │
├──────────────────────────────────┤
│ • HTML (self-contained)          │
│ • JSON (structured data)         │
│ • CSV (spreadsheet compatible)   │
└──────────────────────────────────┘
```

---

## Quality Check Rules (15 Total)

```
Category 1: HEADER VALIDATION
┌──────────────────────────────────────────────────┐
│ HEADER_EMPTY                                     │
│ Description: Empty or blank column names         │
│ Severity: ⚠️ WARNING                            │
│ Action: Rename or confirm these columns          │
│ Example: ["Column1", "", "Column3"]              │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ HEADER_DUPLICATE                                 │
│ Description: Two+ columns have identical names   │
│ Severity: 🚫 BLOCKER (halts analysis)           │
│ Action: Rename duplicate columns to make unique  │
│ Example: ["id", "name", "id"]                    │
└──────────────────────────────────────────────────┘

Category 2: ROW/COLUMN COMPLETENESS
┌──────────────────────────────────────────────────┐
│ ROW_EMPTY                                        │
│ Description: Entire row is blank                 │
│ Severity: ⚠️ WARNING                            │
│ Count: Number of empty rows                      │
│ Action: Verify if rows should be removed         │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ COLUMN_EMPTY                                     │
│ Description: Entire column is blank              │
│ Severity: ⚠️ WARNING                            │
│ Count: Number of empty columns                   │
│ Action: Consider removing unused columns         │
└──────────────────────────────────────────────────┘

Category 3: DATA DUPLICATES
┌──────────────────────────────────────────────────┐
│ EXACT_DUPLICATE_ROWS                             │
│ Description: Identical records appear 2+ times   │
│ Severity: ⚠️ WARNING                            │
│ Count: Number of duplicate rows                  │
│ Action: Verify if intentional or data errors     │
│ Note: Could be valid replicates or measurements  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ DUPLICATE_ID                                     │
│ Description: ID values are not unique            │
│ Severity: ⚠️ WARNING (⚠️ or 🚫 based on design) │
│ Severity: 🚫 BLOCKER if one-ID-per-participant  │
│ Severity: ⚠️ WARNING if longitudinal data OK     │
│ Action: Confirm study design allows this         │
│ Note: User declares expected design              │
└──────────────────────────────────────────────────┘

Category 4: COMPLETENESS
┌──────────────────────────────────────────────────┐
│ MISSING_VALUES                                   │
│ Description: Tally of missing data per column    │
│ Severity: ℹ️ INFO                               │
│ Metrics: Count, rate (%), columns affected       │
│ Action: Review missingness patterns              │
│ Definition: null, empty, or user-specified codes │
└──────────────────────────────────────────────────┘

Category 5: TYPE CONSISTENCY
┌──────────────────────────────────────────────────┐
│ MIXED_TYPES                                      │
│ Description: Column has multiple data types      │
│ Severity: ⚠️ WARNING                            │
│ Types: number, text, date, boolean               │
│ Action: Standardize column types                 │
│ Example: ["1", 2, true, "2024-01-01"]           │
└──────────────────────────────────────────────────┘

Category 6: FORMAT ISSUES
┌──────────────────────────────────────────────────┐
│ NUMERIC_PARSE_AMBIGUITY                          │
│ Description: Unclear number formatting           │
│ Severity: ⚠️ WARNING                            │
│ Examples: 1,234 vs 1.234 vs 1 234                │
│ Action: Clarify decimal point vs thousands sep   │
│ Impact: Affects later statistical analysis       │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ INVALID_DATE_CANDIDATE                           │
│ Description: Date values cannot be parsed        │
│ Severity: ⚠️ WARNING                            │
│ Supported: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY   │
│ Action: Standardize date format                  │
│ Note: ISO 8601 (YYYY-MM-DD) recommended          │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ DATE_ORDER                                       │
│ Description: End date < Start date               │
│ Severity: ⚠️ WARNING                            │
│ Action: Verify if intentional (retrospective)    │
│ Note: May be valid for some study designs        │
└──────────────────────────────────────────────────┘

Category 7: STATISTICAL INDICATORS
┌──────────────────────────────────────────────────┐
│ CONSTANT_COLUMN                                  │
│ Description: Only one unique value in column     │
│ Severity: ℹ️ INFO                               │
│ Example: ["A", "A", "A", "A"]                    │
│ Action: Consider if useful for analysis          │
│ Recommendation: Might be redundant               │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ HIGH_CARDINALITY_CATEGORY                        │
│ Description: Text column has very many unique    │
│ Severity: ℹ️ INFO                               │
│ Threshold: >50% unique, >20 distinct values      │
│ Example: Free-text responses, IDs                │
│ Action: Verify column type (should be ID?)       │
│ Note: May indicate need for standardization      │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ OUTLIER_IQR_FLAG                                 │
│ Description: Potential extreme values (IQR)      │
│ Severity: ℹ️ INFO                               │
│ Method: Values < Q1-1.5*IQR or > Q3+1.5*IQR    │
│ Purpose: Exploratory - manual review needed      │
│ Action: Verify values are valid measurements     │
│ Note: Not all outliers are errors!              │
└──────────────────────────────────────────────────┘

Category 8: HEURISTIC WARNINGS
┌──────────────────────────────────────────────────┐
│ POSSIBLE_OUTCOME_LEAKAGE                         │
│ Description: Column name suggests outcome info   │
│ Severity: ⚠️ WARNING (heuristic, not proof)     │
│ Examples: "outcome", "diagnosis", "result",      │
│           "treatment", "prognosis", "endpoint"   │
│ Action: Verify this column is NOT the outcome   │
│ Note: Requires manual domain review              │
└──────────────────────────────────────────────────┘
```

---

## Severity Levels

```
🚫 BLOCKER (Critical)
├─ Prevents reliable analysis
├─ Must be resolved before proceeding
├─ Example: Duplicate column names
└─ Action: Fix, then re-run check

⚠️ WARNING (Should Address)
├─ May impact analysis validity
├─ Requires user judgment
├─ Examples: Missing values, duplicates
└─ Action: Review and decide

ℹ️ INFO (For Reference)
├─ Descriptive information
├─ No action required
├─ Examples: Missing rate, outliers
└─ Action: Inform decision-making
```

---

## Data Flow Diagram

```
User's Device (Laptop/Desktop)
        │
        ▼
    Browser
        │
    ┌───┴───────────────┬──────────────────────┐
    │                   │                      │
    ▼                   ▼                      ▼
HTML/CSS/JS     CSV File (disk)      XLSX File (disk)
    │                   │                      │
    │         File Input────────────────────────┤
    │                   │                      │
    └─────────┬─────────┴──────────────────────┘
              │
              ▼
        Local Memory
    (DatasetProfile)
              │
              ▼
    Quality Check Engine
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
Parsing   Rules      Stats
          Engine
              │
              ▼
          Issue[]
              │
              ▼
        CheckResult
              │
              ▼
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼
HTML Display       Export Files
    │              (HTML/JSON/CSV)
    │                    │
    └────────┬───────────┘
             │
             ▼
    User's Downloads Folder
```

---

## Technology Decisions

| Component | Choice | Why |
|-----------|--------|-----|
| **Language** | TypeScript | Type safety, catches errors at compile time |
| **Framework** | React 18 | Modern UI, component reusability |
| **Build Tool** | Vite | Fast development, optimized production builds |
| **CSV Parser** | PapaParse | Mature, battle-tested, handles edge cases |
| **XLSX Parser** | SheetJS | Robust XLSX support, auto-detection |
| **i18n** | i18next | Industry standard, extensible |
| **Testing** | Vitest | Fast, TypeScript-native |
| **Linting** | ESLint | Code quality, consistent style |
| **Deployment** | GitHub Pages | Free, integrated with CI/CD |

---

## Key Design Principles

✅ **Deterministic**: Same input → Same output (every time)
✅ **Local**: 100% browser-side processing
✅ **Transparent**: All rules are code, not magic
✅ **Safe**: Never modifies user data
✅ **Fast**: Analyzes 100K rows in 1-2 seconds
✅ **Accessible**: Works offline, keyboard navigable
✅ **International**: English + Simplified Chinese (extensible)

---

## Performance Characteristics

```
Operation              Time (100K rows)    Notes
─────────────────────────────────────────────────
File Parse             ~1-3 seconds        Browser speed dependent
Quality Checks         ~1-2 seconds        All 15 rules parallelizable
Report Generation      <1 second           JSON serialization
Export Download        <1 second           Browser download

Total Workflow         3-6 seconds         Import to export
```

---

*Last Updated: October 22, 2026*
