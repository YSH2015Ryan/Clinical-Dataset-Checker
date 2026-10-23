# Error Handling & Failure Catalog

## File Reading Errors

### FILE_UNSUPPORTED
- **Trigger**: Uploaded file extension is not `.csv` or `.xlsx`
- **UI Action**: Show clear message, don't attempt parsing
- **Message**: "This file format is not supported. Please use CSV or XLSX."

### FILE_TOO_LARGE
- **Trigger**: File size exceeds 25 MB
- **UI Action**: Block import, show exact limit
- **Message**: "File exceeds 25 MB limit. Please choose a smaller file."

### FILE_EMPTY
- **Trigger**: Parsed file has 0 rows or 0 columns
- **UI Action**: Block import
- **Message**: "This file contains no data."

### FILE_PARSE_ERROR
- **Trigger**: CSV parsing or XLSX extraction fails
- **UI Action**: Show error, preserve page state
- **Message**: "Unable to read this file. Please check that it's valid CSV/XLSX and try again."

## Data Structure Errors

### HEADER_EMPTY
- **Trigger**: One or more column headers are empty strings
- **Severity**: warning
- **UI Action**: Flag columns by position, ask user to rename or confirm
- **Resolution**: User must manually name or skip empty headers

### HEADER_DUPLICATE
- **Trigger**: Two or more columns have identical names after normalization
- **Severity**: blocker
- **UI Action**: Block further analysis until resolved
- **Message**: "Column names must be unique. Found duplicates: [list]. Please rename them."

### ROW_COLUMN_LIMIT
- **Trigger**: Data exceeds 100,000 rows or 500 columns
- **Severity**: blocker
- **UI Action**: Block import
- **Message**: "Data exceeds limits: 100,000 rows or 500 columns."

## Data Type & Format Errors

### MIXED_TYPES
- **Trigger**: Single column contains mix of numbers, text, dates
- **Severity**: warning
- **UI Action**: Report type distribution, allow user to proceed
- **Message**: "Column contains mixed data types: 60% numeric, 40% text"

### NUMERIC_PARSE_AMBIGUITY
- **Trigger**: Numeric column uses non-standard separators (e.g., `1,234` vs `1.234`)
- **Severity**: warning
- **UI Action**: Show examples, ask for clarification
- **Message**: "Number format unclear. Examples: '1,234', '1.234'. Confirm decimal separator:"

### INVALID_DATE_CANDIDATE
- **Trigger**: Column marked as date, but some values can't be parsed
- **Severity**: warning
- **UI Action**: Show failed examples and counts
- **Message**: "Could not parse as date: 5 values failed. Examples: [...]"

## Data Completeness & Quality

### ROW_EMPTY
- **Trigger**: All cells in a row are empty/missing
- **Severity**: warning
- **Action**: Count and show sample rows
- **Note**: Do NOT auto-delete

### COLUMN_EMPTY
- **Trigger**: All cells in a column are empty
- **Severity**: warning
- **Action**: Count affected columns
- **Note**: Do NOT auto-delete

### MISSING_VALUES
- **Trigger**: Cells match user-defined missing markers (or null/empty string)
- **Severity**: info
- **Action**: Compute count and percentage per column
- **Note**: Do NOT auto-impute

### EXACT_DUPLICATE_ROWS
- **Trigger**: Two or more rows have identical values (after space normalization)
- **Severity**: warning
- **Action**: Count, show samples, do NOT auto-delete
- **Note**: Could be valid replicates or measurement repeats

### DUPLICATE_ID
- **Trigger**: ID column (if specified) has non-unique values
- **Severity**: warning OR blocker (depends on user's study design choice)
- **UI Action**: Ask "Is this longitudinal data (one participant, multiple rows allowed)?" or "Should each ID appear once?"

## Recoverable Parse Issues

| Issue | Detection | User Action | System Response |
|-------|-----------|-------------|-----------------|
| Excel cached formulas | XLSX detected formulas without values | Review source spreadsheet | Show warning during import |
| Multi-row headers | First N rows look like headers | Select actual header row | Prevent auto-merge |
| Encoding mismatch | Non-UTF8 detected | Re-export as UTF-8 | Suggest re-save |
| Special characters | Unicode, full-width, unusual punctuation | Proceed or clean | Report but don't modify |

## System/Runtime Errors

### OUT_OF_MEMORY
- **Trigger**: Browser can't allocate memory for large dataset
- **UI Action**: Show message, suggest close other tabs or smaller file
- **Message**: "Out of memory. Try closing other tabs or using a smaller file."
- **Recovery**: Do NOT send data to server; let user handle locally

### UNKNOWN_ERROR
- **Trigger**: Unexpected exception
- **UI Action**: Show generic message, log error code internally (not to server)
- **Message**: "An unexpected error occurred. Please refresh and try again."
- **Note**: Stack trace NOT shown to user

## Best Practices

1. **Always confirm user intent** for ambiguous situations (date format, duplicate handling)
2. **Never auto-fix without explicit user consent**
3. **Show sample data** for discovered issues
4. **Preserve original data** — all analysis is read-only
5. **Clear error messages** — actionable, not technical
6. **No silent failures** — blocker-level issues must stop the workflow
