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

### Phase 1: Core Mock Platform
1. **AI-Powered Evaluation**: Utilizes the Google Gemini Pro API (`gemini-1.5-flash`) to parse transcripts and grade them across six criteria: Technical Accuracy, Keyword Coverage, Communication, Confidence, Clarity, and Completeness.
2. **Speech-To-Text Audio Recording**: Uses HTML5 MediaRecorder APIs and browser Web Speech Recognition to translate voice responses to text, with fallback text inputs for compatibility.
3. **Assessment Integrity Monitoring**: Enforces Full Screen, and logs warnings for tab-switching or focus blur. Auto-submits on 3 violations to log compliance.
4. **Performance Dashboard**: Real-time visual graphs mapping historical trend lines and topic competence bars.
5. **Interactive Question Bank**: Fisher-Yates Shuffler that handles randomised, non-duplicate query logs across 12 tech and HR fields.
6. **Full CRUD Admin Workspace**: Manage topics, seed question sheets, and query active user rosters.

---

### 🌟 Phase 2: Resume-Based AI Interview Workflows (Intelligence Engine)

1. **PDF Resume Parsing & Extraction Engine**:
   - High-precision PDF parser with NLP regex rule engine extracting genuine candidate contact links (GitHub, LinkedIn, LeetCode, Portfolio), work history, projects, and certifications.
   - Strict sanitization: Zero synthetic/phantom URLs or duplicate projects.

2. **Categorized Skills Architecture**:
   - Skills are automatically deduplicated and cataloged into structured categories:
     - **Languages & Core**: *Java, Python, JavaScript, TypeScript, C++, SQL, DSA, OOP*
     - **Frameworks & Web**: *React, Next.js, Node.js, Express, Spring Boot, Django*
     - **Databases & Storage**: *MongoDB, MySQL, PostgreSQL, Redis, SQLite*
     - **Developer Tools**: *Git, GitHub, Docker, Kubernetes, AWS, Vercel*
     - **Soft Skills & Practices**: *Problem Solving, Communication, Agile*

3. **AI-Assigned Target Role Detection**:
   - Automatically maps candidate projects, tech stacks, and experience to their target job role (e.g., *Full Stack Developer*, *AI/ML Engineer*, *Java Developer*, *Backend Engineer*).

4. **Adaptive 6-Stage Contextual Interview Pipeline**:
   - **Stage 1 (Intro & Projects)**: Deep dive into the candidate's actual resume projects, technical tradeoffs, and architectural decisions.
   - **Stage 2 (Core Tech)**: In-depth questions based on extracted languages and framework proficiencies.
   - **Stage 3 (Compulsory SQL Challenge)**: Hands-on database query problem with 10-minute timer.
   - **Stage 4 (Algorithmic Coding Challenge)**: Live coding test with embedded Monaco Code Editor, automated testcases, and multi-language execution (Java, Python, JS, SQL).
   - **Stage 5 (System Architecture & Scalability)**: High-level design and database schema questions.
   - **Stage 6 (Behavioral & HR)**: STAR-method leadership and teamwork scenario questions.

5. **Interactive Zero-Scroll Interview Room**:
   - **Top Full-Width Question Banner**: Real-time question prompt with audio replay.
   - **Dual Synchronized Screens**:
     - **AI Interviewer**: Holographic avatar with concentric animated speaking waves and live audio equalizer.
     - **Candidate Webcam**: Live video stream with glowing soundwave indicators when speaking.
   - **Fixed Bottom Control Dock**: Instant speech-to-text transcript input, recording controls, word counters, and quick actions without page scroll.

6. **Resume Versioning & Skill Growth Tracking**:
   - Automatically snapshots resume versions upon replacement.
   - Calculates skill delta (`skillsAddedSinceLastVersion`) to visualize candidate learning and readiness growth across resume iterations.

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
