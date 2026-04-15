# 💼 BillPro Admin — No Database Version

A professional billing web application for **Kisan Bharti Agro Tech Services** and **Microbact Biocultures Pvt Ltd**.

> ✅ **No MongoDB. No backend. No server required.**
> All data is stored in your browser's localStorage.

---

## 🚀 Quick Start

### Option 1 — Run with React (Recommended)

```bash
cd billing-app-local
npm install
npm start
```

Open **http://localhost:3000**

---

### Option 2 — Build & open as a static website

```bash
npm install
npm run build
```

Then open `build/index.html` in any browser. No server needed!

You can also deploy the `build/` folder to:
- GitHub Pages (free)
- Netlify (free drag & drop)
- Any web hosting

---

## 📱 Install on Mobile (PWA)

### Android (Chrome)
1. Open the app in Chrome
2. Tap **⋮ menu → Add to Home Screen**
3. Tap **Install**

### iPhone (Safari)
1. Open the app in Safari
2. Tap **Share → Add to Home Screen**
3. Tap **Add**

App will work fully **offline** after installation.

---

## 💾 Where is Data Stored?

All invoices and products are saved in **browser localStorage**.

- Data stays on your device
- No internet needed after first load
- No accounts, no passwords

> ⚠️ **Important:** Clearing browser cache/data will delete stored invoices.
> Use the **Export CSV** button regularly to back up your data.

---

## 📊 Features

| Feature | Details |
|---------|---------|
| Invoice creation | Kisan Bharti & Microbact formats |
| Auto invoice no | `MARCH-2026-001`, resets monthly |
| Auto GST calc | CGST 9% + SGST 9% automatic |
| Amount in words | Indian numbering system |
| PDF download | Opens print dialog → Save as PDF |
| CSV export | Download invoices as spreadsheet |
| Payment tracking | Cash / Online / Cheque / Pending |
| Product manager | Add, edit, update rates |
| Admin dashboard | Charts, stats, recent invoices |
| PWA | Install on mobile, works offline |

---

## 🧾 Invoice Number Format

```
MARCH-2026-001
MARCH-2026-002
APRIL-2026-001   ← resets on new month
```

Each company tracks its own counter separately.

---

## 📂 Project Structure

```
billing-app-local/
├── src/
│   ├── utils/
│   │   ├── db.js           ← localStorage database (replaces MongoDB)
│   │   ├── helpers.js      ← formatCurrency, numberToWords, calc
│   │   └── pdfGenerator.js ← browser-based PDF via print
│   ├── pages/
│   │   ├── CompanySelect.js
│   │   ├── InvoiceForm.js
│   │   ├── InvoicePreview.js
│   │   ├── Dashboard.js
│   │   ├── InvoiceList.js
│   │   └── ProductManager.js
│   ├── components/
│   │   ├── Sidebar.js
│   │   └── PaymentModal.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── public/
│   ├── index.html
│   └── manifest.json
├── package.json
└── README.md
```

---

Made for Kisan Bharti Agro Tech Services & Microbact Biocultures Pvt Ltd
