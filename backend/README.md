# Online Quiz & Exam Platform

A premium, production-ready online examination system built with Node.js, Express, and Turso (SQLite).

## 🚀 Features
- **Modern UI**: State-of-the-art Glassmorphism design with responsive layouts.
- **Role-Based Access**: Secure JWT authentication for Admins and Students.
- **Exam Taker**: High-precision synced timer, auto-saving logic, and attempt restoration.
- **Admin Suite**: Comprehensive management of exams, questions, and performance analytics.
- **Persistent Database**: Powered by Turso (libSQL) for reliable and scalable data storage.

## 📁 Project Structure
```text
├── config/             # Database and config settings
├── controllers/        # Business logic for Auth, Exams, Attempts, Results
├── middleware/         # Security and Error handling
├── models/             # Database queries (Ranking, Stats, CRUD)
├── public/             # Frontend (HTML, CSS, JS)
│   ├── css/            # Glassmorphism design system
│   └── js/             # API wrapper, View templates, App logic
├── routes/             # API Endpoints definition
├── utils/              # Token and Grading utilities
├── .env                # Environment variables
├── app.js              # Express app configuration
├── server.js           # Server entry point
└── package.json        # Dependencies and scripts
```

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Ensure your `.env` file contains the following (already configured in workspace):
- `PORT`: 5000
- `TURSO_DATABASE_URL`: Your Turso URL
- `TURSO_AUTH_TOKEN`: Your Turso Token
- `JWT_SECRET`: Your secret key

### 3. Run the Platform
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🎓 User Guide

### For Students
- **Register/Login** to access your dashboard.
- View **Available Exams** and click "Take Exam" to start.
- Your progress is **Auto-Saved**! Feel free to refresh or resume later if time permits.
- Once submitted, view your **Score and Results** instantly.

### For Administrators
- Access the **Admin Dashboard** to see platform statistics.
- Create new Exams and add **MCQ** or **Short Answer** questions.
- Toggle the **Publish** status to make exams available to students.
- View **Analytics** to monitor student performance.
