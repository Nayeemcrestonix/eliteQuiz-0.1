# EliteQuiz - Premium Examination Platform (v2.0)

EliteQuiz is a high-performance, responsive examination platform designed for secure and feature-rich assessment workflows. Featuring a modern glassmorphic UI, real-time synchronization, and automated grading, it provides a seamless experience for both students and administrators.

## 🚀 Key Features

### 👨‍🎓 Student Experience
- **Interactive Exam Taker**: A distraction-free, full-screen examination environment.
- **Session Resilience**: Automatic session recovery via `localStorage`. Never lose progress due to page refreshes or connection drops.
- **Live Leaderboard**: Real-time global rankings based on score and completion precision.
- **Detailed Result Scorecard**: Immediate feedback with precision indices, point tallies, and certification badges.
- **Verified PDF Transcripts**: Generate professional result audits showing correct answers and explanations for every question.

### 🛡️ Administrative Portal
- **Exam Management**: Full CRUD operations for exams and questions.
- **Student Monitoring**: Live tracking of student attempts and performance analytics.
- **Automated Grading**: Instant results for MCQ and Short Answer questions with immediate notification triggers.
- **Session Control**: Manually override or reset student attempts as needed.

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Modern Glassmorphic Design).
- **Backend**: Node.js & Express.
- **Database**: Turso (LibSQL/SQLite) for high-performance edge data storage.
- **Security**: JWT Authentication, Helmet.js for CSP, and bcryptjs for password hashing.
- **Utilities**: `jspdf` & `html2canvas` for PDF generation, `multer` for asset handling.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- Turso Database Token (or local SQLite setup)

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/Nayeemcrestonix/eliteQuiz-0.1.git
   ```
2. Setup Backend
   ```bash
   cd backend
   npm install
   cp .env.example .env # Add your TURSO_DATABASE_URL and JWT_SECRET
   npm run dev
   ```
3. Setup Frontend
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 📜 License
This project is licensed under the ISC License.

---
*Built with ❤️ by the EliteQuiz Team*
