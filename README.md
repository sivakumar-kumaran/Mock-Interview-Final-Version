# Mock Interview Platform (AI-Powered)

An intelligent, full-stack mock interview simulation platform designed for students and job seekers preparing for placements and HR rounds. This application simulates high-stakes exams using live voice/text submissions, enforces browser focus integrity, aggregates visual preparation charts, and leverages Google Gemini AI to grade candidate performances.

This project was built for a final-year engineering project demonstration.

---

## 🎨 Design System & Color Palette
The interface features a premium SaaS dashboard aesthetic utilizing the following curated palette:
- **Brand Purple (Main Accent)**: `#7C3AED` (Main logo, highlights, primary buttons)
- **Electric Blue (Secondary Accent)**: `#6366F1` & `#00D2FF` (Gradients, highlight callouts)
- **Deep Charcoal (Typography Headers)**: `#0F172A` (Strong contrast headers)
- **Base Background**: `#FFFFFF` (Pure white for reading clarity)
- **Ambient Glow Gradients**: `#E0F2FE` (Soft Blue) & `#F3E8FF` (Soft Lavender)
- **Card Surfaces**: `#F8FAFC` (Ultra-light cool gray)
- **Neutral Slate Text**: `#475569` (Readable body paragraphs)

---

## 🚀 Key Features

1. **AI-Powered Evaluation**: Utilizes the Google Gemini Pro API (`gemini-1.5-flash`) to parse transcripts and grade them across six criteria: Technical Accuracy, Keyword Coverage, Communication, Confidence, Clarity, and Completeness.
2. **Speech-To-Text Audio Recording**: Uses HTML5 MediaRecorder APIs and browser Web Speech Recognition to translate voice responses to text, with fallback text inputs for compatibility.
3. **Assessment Integrity Monitoring**: Enforces Full Screen, and logs warnings for tab-switching or focus blur. Auto-submits on 3 violations to log compliance.
4. **Performance Dashboard**: Real-time visual graphs mapping historical trend lines and topic competence bars.
5. **Interactive Question Bank**: Fisher-Yates Shuffler that handles randomised, non-duplicate query logs across 12 tech and HR fields.
6. **Full CRUD Admin Workspace**: Manage topics, seed question sheets, and query active user rosters.

---

## 🧠 DSA Implementations & Architectural Map

To fulfill academic project criteria, the platform incorporates five Data Structures & Algorithms concepts directly in code, documented in script comments:

1. **Array**: Utilized to store and structure the list of interview questions retrieved from the database. Offers $O(1)$ random indexing.
2. **Fisher-Yates Shuffle**: Used to randomize the order of questions in the practice pool and mock setup, ensuring a unique, duplicate-free sequence each session in $O(N)$ runtime.
3. **HashMap**: Used inside `userController.js` to map topic titles to score records dynamically, enabling $O(1)$ lookup for aggregating topic-wise performance metrics.
4. **Queue**: Emplemented in `InterviewContext` to enforce First-In-First-Out (FIFO) question flow. The questions are enqueued, the active item is shown from the queue head, and dequeued (`shift`) once an answer is submitted.
5. **Sorting Algorithms**: Used inside Mongoose aggregation pipelines and array sorting to order historical interview documents chronologically.

---

## 🛠️ Technology Stack
- **Frontend**: React.js (Vite), React Router, Context API, Tailwind CSS, Chart.js, Canvas Confetti
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose schemas)
- **AI Models**: Google Gemini Generative API (`@google/generative-ai` SDK)

---

## ⚙️ Environment Configuration

Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mockinterview
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
ASSEMBLYAI_API_KEY=your_optional_assemblyai_api_key
```

---

## 📦 Setup & Launch Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (Local server or Atlas cloud cluster)

### 1. Database Seeding
First, navigate to the backend folder and run the seed script to populate the 12 interview tracks (OOP, DSA, JS, SQL, OS, networks, etc.) and question bank:
```bash
cd backend
npm install
npm run seed
```

### 2. Launch Backend
Run the development API server:
```bash
npm run dev
```
The server will run on `http://localhost:5000`.

### 3. Launch Frontend
Navigate to the frontend folder, install packages, and boot the Vite server:
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 🔒 Default Demo Accounts (Pre-Seeded)

- **Admin Account**:
  - Email: `admin@mockinterview.com`
  - Password: `admin123`
- **Candidate Account**:
  - Email: `user@mockinterview.com`
  - Password: `user123`
