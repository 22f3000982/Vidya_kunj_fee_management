# 📚 VIDYA KUNJ - Student Fee Management System
**Deployment Link** -https://vkfee.vercel.app/
A simple, user-friendly web application for managing student fee records using Google Sheets as the database.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

- **☁️ Google Sheets Database**: Data persists in Google Sheets - accessible anywhere
- **🔍 Smart Search**: Search by student name, father name, ID, or mobile
- **📅 Month Filter**: Filter records by specific month
- **✅ Status Filter**: Quickly view paid or unpaid students
- **✏️ Easy Updates**: Update fee status and receipt numbers with one click
- **⚡ Quick Pay**: One-click mark as paid with auto-generated receipt number
- **⚠️ Defaulters List**: Auto-detect students with 2+ months unpaid fees
- **👤 Student Profiles**: Click student name to view complete payment history
- **📋 Bulk Add**: Add multiple students or months at once
- **📥 Download**: Export current data as Excel file
- **📱 Responsive**: Works on desktop, tablet, and mobile
- **🎨 Conditional Formatting**: Green for paid, Red for unpaid in Google Sheet

## 🚀 Deploy to Vercel

### Step 1: Fork/Clone this repository

### Step 2: Set up Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google Sheets API** and **Google Drive API**
4. Create a Service Account and download the JSON credentials
5. Share your Google Sheet with the service account email

### Step 3: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click "New Project" and import this repository
3. Add Environment Variables:
   - `GOOGLE_CREDENTIALS`: Paste the entire contents of your `credentials.json` file
   - `SPREADSHEET_ID`: Your Google Sheet ID (from the URL)

4. Click Deploy!

### Environment Variables Required:

| Variable | Description |
|----------|-------------|
| `GOOGLE_CREDENTIALS` | Full JSON content of your Google Service Account credentials |
| `SPREADSHEET_ID` | The ID of your Google Sheet (found in the URL) |

## 🖥️ Local Development

### 1. Install Python Dependencies

```bash
cd "c:\VIDYA KUNJ\fee"
pip install -r requirements.txt
```

### 2. Create Sample Data (Optional)

```bash
python create_sample_data.py
```

### 3. Run the Application

```bash
python app.py
```

### 4. Open in Browser

Visit: **http://localhost:5000**

## 📁 Project Structure

```
fee/
├── app.py                  # Flask backend server
├── requirements.txt        # Python dependencies
├── create_sample_data.py   # Script to generate sample data
├── README.md              # This file
├── data/
│   └── students.xlsx      # Excel database file
├── templates/
│   └── index.html         # Main HTML page
└── static/
    ├── style.css          # Styling
    └── script.js          # Frontend JavaScript
```

## 📋 Excel File Format

Your Excel file should have these columns:

| Column | Description | Example |
|--------|-------------|---------|
| Student Name | Full name of student | Rahul Sharma |
| Student ID | Unique identifier | VK001 |
| Course/Batch | Course or batch name | Class 10 - Science |
| Month | Fee month | January 2026 |
| Fee Status | "Paid" or "Not Paid" | Paid |
| Receipt Number | Receipt number (if paid) | RCP-2026-001 |

### Sample Excel Data:

| Student Name | Student ID | Course/Batch | Month | Fee Status | Receipt Number |
|--------------|------------|--------------|-------|------------|----------------|
| Rahul Sharma | VK001 | Class 10 - Science | January 2026 | Paid | RCP-2026-001 |
| Priya Singh | VK002 | Class 10 - Science | January 2026 | Paid | RCP-2026-002 |
| Amit Kumar | VK003 | Class 12 - Commerce | January 2026 | Not Paid | |

## 🎯 How to Use

### For Admin Staff:

1. **Upload Data**: Click "Upload Excel File" to upload your fee records
2. **Add Records**: Click "Add New Record" to add individual entries
3. **Update Status**: Click "Edit" on any row to update fee status
4. **Download**: Click "Download Data" to get the current Excel file

### Searching & Filtering:

1. **Search Box**: Type student name, ID, or course to search
2. **Month Filter**: Select a specific month to filter
3. **Status Filter**: Choose "Paid" or "Not Paid" to filter
4. **Clear**: Click "Clear Filters" to reset all filters

### Visual Indicators:

- ✅ **Green Badge**: Fee has been paid
- ❌ **Red Badge (Pulsing)**: Fee is pending - requires attention

## 🔧 Configuration

The application runs on port 5000 by default. To change:

```python
# In app.py, change the last line:
app.run(debug=True, port=5000)  # Change 5000 to your preferred port
```

## 🛡️ Security Notes

- This is designed for local/intranet use
- For production deployment, add authentication
- Consider using HTTPS for internet deployment

## 📈 Future Enhancements

- [ ] User authentication and roles
- [ ] Email notifications for unpaid fees
- [ ] WhatsApp reminder integration
- [ ] Payment integration
- [ ] PDF receipt generation
- [ ] Dashboard with analytics charts
- [ ] Fee amount tracking with balance
- [ ] Due date reminders

## 🤝 Support

For any issues or questions, please contact the IT administrator.

---

Made with ❤️ for VIDYA KUNJ Coaching Institute
