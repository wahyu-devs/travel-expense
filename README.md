# Travel Expense

Travel Expense is a simple web app for creating **Travel Advance** and **Travel Expense Realization** documents. It helps users fill out travel expense forms, calculate totals, preview documents, and export them as printable PDFs.

All saved documents are stored locally in the browser using `localStorage`, so the app can be used without a backend.

## Features

- Travel Advance document form
- Travel Expense Realization document form
- Separate editable document information for Travel Advance and Realization
- Automatic cost calculation for IDR and USD
- Realization summary with Receipt, Total Expense, and Difference
- Live document preview
- PDF export
- Print support
- Signature upload
- Save and load multiple documents from local browser storage
- Dark and light mode
- Form reset with default company, note, and approver values preserved

## Data Storage

Documents saved through the **Save** button are stored locally in the user’s browser. No data is sent to any server.

Because the app uses `localStorage`, saved documents may be lost if the browser cache or site data is cleared.

## How to Use

1. Open the app in your browser.
2. Fill in the document information in the **Travel Advance** tab.
3. Add expense items as needed.
4. Open the **Realization** tab to enter actual expenses.
5. Edit the Realization document information if it differs from the Travel Advance document.
6. Review the live document preview.
7. Click **Save** to store the document locally.
8. Click **Load** to reopen previously saved documents.
9. Use **Print** or **Download** to print or export the document as a PDF.

## Tech Stack

- HTML
- CSS
- JavaScript
- Bootstrap Icons
- html2canvas
- jsPDF

## Notes

This app is designed as a lightweight document tool for preparing travel expense forms faster. Please review all information before printing, exporting, or submitting the document.
