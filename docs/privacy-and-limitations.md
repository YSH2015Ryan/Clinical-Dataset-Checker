# Privacy & Data Handling

## Overview

Clinical Dataset Checker is designed with privacy as a core principle. Your data never leaves your device.

## Data Processing

- **Local Only**: All file parsing, analysis, and rule checking happens entirely in your web browser
- **No Uploads**: We do not transmit file contents, column names, data values, or analysis results to any server
- **No Registration**: No user accounts, login, or authentication required
- **No Tracking**: No analytics, session replay, error reporting, or third-party tools

## What We Don't Do

- Store your data on servers
- Send data to LLMs or APIs
- Track user behavior or usage patterns
- Collect personally identifiable information
- Use cookies for tracking (only for UI state if needed)
- Execute external scripts or load code from CDNs

## Browser Security

The application is served as static HTML/CSS/JavaScript files. You can verify this by:

1. Opening your browser's Developer Tools (F12)
2. Going to the **Network** tab
3. Importing a data file
4. Confirming no requests to external APIs or servers are made

## Report Exports

When you export reports:

- **HTML Report**: Self-contained file with analysis results (no data leakage)
- **JSON Report**: Structured results; download stays on your device
- **CSV Export**: Issue list for further review

## Limitations

This tool is not:

- A clinical decision-support system
- A data warehouse or data management solution
- A substitute for proper data governance or regulatory compliance review
- Capable of diagnosing errors or prescribing statistical methods

## Questions?

If you have concerns about data handling or privacy, please review the source code or contact us via the project repository.
