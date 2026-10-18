# QuizGen AI

**AI-Powered Quiz Generation from Documents**

QuizGen AI is a document-based quiz generation platform that helps teachers automatically create quizzes from educational materials and allows students to take them using a unique Session ID.

The platform uses custom NLP techniques, including TF-IDF sentence ranking and keyword extraction, to generate relevant questions without requiring login accounts, paid AI APIs, or external AI services.

## 🚀 Features

- 📄 **Document Upload:** Upload PDF, DOCX, and TXT files.
- 🧠 **NLP-Based Quiz Generation:** Uses custom TF-IDF sentence ranking and keyword extraction.
- 📝 **Multiple Question Types:** Generate MCQ, theory, or mixed quizzes.
- 🎯 **Difficulty Levels:** Choose Easy, Medium, or Hard.
- 🔑 **Session ID System:** Share quizzes with students without requiring login accounts.
- ✅ **Automatic MCQ Grading:** Automatically evaluates multiple-choice answers.
- 📊 **Theory Answer Scoring:** Evaluates theory answers using cosine similarity.
- 📈 **Teacher Analytics Dashboard:** Track student performance and quiz statistics.
- 📉 **Visual Analytics:** View score distributions and question accuracy charts.
- 🏆 **Student Results:** View scores, percentile rankings, and detailed results.
- 📥 **CSV Export:** Export quiz results for further analysis.
- 🌙 **Dark/Light Mode:** Switch between themes.
- 📱 **Responsive UI:** Works across desktop and mobile devices.
- 💻 **Fully Local Processing:** Runs locally without paid APIs or external AI services.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Charts | Recharts |
| Backend | Java 17, Spring Boot 3 |
| Data Access | Spring Data JPA |
| Build Tool | Maven |
| Database | H2 (In-Memory) |
| NLP | Custom TF-IDF Sentence Ranking and Keyword Extraction |

## 📋 Prerequisites

Install the following software before running the project:

- **Node.js 18+** — [Download Node.js](https://nodejs.org/)
- **Java 17+** — [Download Eclipse Temurin](https://adoptium.net/)
- **Maven 3.9+** — [Download Maven](https://maven.apache.org/download.cgi)

Alternatively, use the Maven Wrapper if it is included in the backend project.

## ⚡ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ChinmayGade/quizgen-project.git
cd quizgen
```

### 2. Start the Backend

Open a terminal and navigate to the backend directory:

```bash
cd quizgen-backend
mvn spring-boot:run
```

The backend will start at:

- **Backend API:** http://localhost:8080
- **H2 Database Console:** http://localhost:8080/h2-console

**Note:** The H2 console must be enabled in the application configuration to access it.

### 3. Start the Frontend

Open a second terminal from the project root and navigate to the frontend directory:

```bash
cd quizgen-frontend
npm install
npm run dev
```

The frontend will start at:

- **Frontend Application:** http://localhost:3000

## 📖 How to Use

### 👨‍🏫 Teacher Workflow

1. Open http://localhost:3000/teacher.
2. Upload a PDF, DOCX, or TXT document.
3. Select the difficulty level, question type, and number of questions.
4. Click **Generate Quiz**.
5. Receive a unique Session ID.
6. Share the Session ID with students.
7. Monitor student performance using the teacher analytics dashboard.
8. Export quiz results as a CSV file.

### 🎓 Student Workflow

1. Open http://localhost:3000/student.
2. Enter the Session ID provided by the teacher.
3. Enter your name and start the quiz.
4. Answer the questions and submit your responses.
5. View your score, percentile ranking, and detailed results.

## 🔌 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/quiz/generate` | POST | Upload a document and generate a quiz |
| `/api/quiz/{sessionId}` | GET | Retrieve a quiz using its Session ID |
| `/api/quiz/{sessionId}/submit` | POST | Submit quiz answers |
| `/api/quiz/{sessionId}/analytics` | GET | Retrieve teacher analytics |
| `/api/quiz/{sessionId}/results/{attemptId}` | GET | Retrieve individual student results |
| `/api/quiz/{sessionId}/export` | GET | Export quiz results as CSV |

## 📂 Project Structure

```text
quizgen/
├── quizgen-backend/
│   ├── pom.xml
│   └── src/
│       └── main/
│           └── java/com/quizgen/
│               ├── QuizgenApplication.java
│               ├── config/
│               │   └── CorsConfig.java
│               ├── model/
│               ├── repository/
│               ├── service/
│               ├── dto/
│               └── controller/
│
├── quizgen-frontend/
│   ├── package.json
│   └── src/
│       ├── app/
│       │   ├── teacher/
│       │   └── student/
│       ├── components/
│       └── lib/
│
└── README.md
```

## 🧠 How It Works

QuizGen AI follows a document-to-quiz workflow:

1. **Document Processing:** The backend extracts text from uploaded documents.
2. **Sentence Ranking:** Custom TF-IDF techniques identify relevant sentences.
3. **Keyword Extraction:** Important terms are extracted to help construct questions.
4. **Quiz Generation:** Questions are generated according to the selected question type and difficulty.
5. **Quiz Distribution:** A unique Session ID allows students to access the quiz.
6. **Evaluation:** MCQ answers are automatically graded, while theory answers are evaluated using cosine similarity.
7. **Analytics:** Student scores and question-level performance are calculated and displayed on the teacher dashboard.

## 🗄️ Database

QuizGen AI uses an **H2 in-memory database** for storing application data during runtime.

- No separate database server is required.
- Data is generally lost when the application restarts unless persistence is configured.
- The H2 console can be used to inspect database records when enabled.

## 🔒 Privacy and API Usage

- No login or account registration is required by the application.
- No paid AI APIs are required.
- NLP-based question generation runs locally in the backend.
- Uploaded documents are processed by the application.

**Note:** Actual data persistence, document handling, and privacy depend on the application's configuration and implementation.

## 🔮 Future Enhancements

Potential improvements include:

- More advanced question generation techniques.
- Support for additional document formats.
- Improved semantic evaluation of theory answers.
- More detailed student performance reports.
- Persistent database storage.
- Enhanced quiz sharing and management.

## 👨‍💻 Author

**Chinmay Gade**

- GitHub: [@ChinmayGade](https://github.com/ChinmayGade)

## 📄 License

No license has been specified yet. If you intend to distribute or reuse this project publicly, consider adding an appropriate open-source license.

Until a license is added, the project remains subject to the default copyright rules.

---

**QuizGen AI — Turn your documents into interactive quizzes.**
