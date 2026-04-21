# Travel Expense

Travel Expense is a lightweight web app for preparing travel advance and travel expense realization documents. It lets users fill in trip details, manage expense rows, upload signatures, preview the generated document, and print or download the result as a PDF.

The app runs fully in the browser and stores drafts in `localStorage`. There is no backend service or build step required.

## Current Features

- Travel Advance form for request data, cost estimates, notes, and signatures.
- Travel Expense Realization form with separate editable document information.
- Realization fields can start from Travel Advance data and remain editable when the final document differs.
- Expense editor supports item and sub-item rows.
- IDR and USD amount inputs are formatted with thousand separators.
- Automatic totals for Travel Advance and Realization.
- Realization summary calculates Receipt, Total Expense, and Difference for IDR and USD.
- Live document preview follows the active tab.
- Preview can be shown or hidden from the top action menu.
- Save and load multiple local drafts.
- Delete saved drafts from the load dialog.
- Reset form back to the default company, note, and approver values.
- Upload, preview, and remove prepared, checked, and approved signature images.
- Print support through the generated PDF view.
- Vector PDF download through `jsPDF`.
- Dark and light mode.
- Responsive desktop and mobile layout.

## Mobile Layout

- Fixed navbar with a travel logo, title, and subtitle.
- Hamburger action menu is used below `1024px`.
- Mobile action menu opens as a compact vertical dropdown.
- Fixed one-line footer remains visible at the bottom.
- Tab buttons use compact labels, centered step numbers, and green status checks.
- Travel cost editor is compact on small screens and can collapse to show only the first row.
- The expand/collapse button appears directly after the visible cost rows.
- Realization summary is ordered on mobile as all IDR fields first, followed by all USD fields.
- Preview section spacing is optimized for mobile and stays directly below the active editor content.

## Data Storage

The app stores data only in the user browser:

- Current working document is stored in `localStorage`.
- Saved drafts are stored as a local draft collection.
- Theme preference is stored in `localStorage`.
- No form data, signatures, or generated documents are sent to a server.

Saved data can be lost if the browser cache, site data, or `localStorage` is cleared.

## How to Use

1. Open `index.html` in a browser.
2. Fill in the Travel Advance document information.
3. Add expense item or sub-item rows.
4. Add notes and upload signatures if needed.
5. Open the Realization tab to review receipt values and enter actual expenses.
6. Edit Realization document information if it differs from the Travel Advance data.
7. Review the live preview for the active tab.
8. Use Save to store a draft locally.
9. Use Load to reopen or delete saved drafts.
10. Use Print or Download to generate the final PDF output.

## Project Files

- `index.html` contains the app structure, forms, preview document, modal, and CDN dependencies.
- `styles.css` contains the responsive layout, theme styling, document preview styling, and mobile refinements.
- `app.js` contains state management, draft storage, calculations, preview rendering, signature handling, theme control, and vector PDF generation.

## Tech Stack

- HTML
- CSS
- JavaScript
- Bootstrap 5 CSS
- Bootstrap Icons
- Bootstrap JavaScript
- jsPDF
- Browser `localStorage`

## Running Locally

No installation is required. Open `index.html` directly in a browser.

The app loads Bootstrap, Bootstrap Icons, and jsPDF from CDN links, so an internet connection is needed when those assets are not already cached by the browser.

## Notes

Review all document information, totals, signatures, and preview output before printing, downloading, or submitting the generated document.
