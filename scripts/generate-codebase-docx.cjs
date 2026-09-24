const path = require("path");
const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  HeadingLevel,
  AlignmentType,
  LevelFormat,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  PageBreak,
} = require("docx");

const PAGE_W = 9360;
const DARK_BLUE = "1E3A5F";
const MID_BLUE = "2E6DA4";
const LIGHT_BLUE = "EAF4FB";

const cellBorder = (color = "BBBBBB") => ({
  style: BorderStyle.SINGLE,
  size: 1,
  color,
});
const borders = (c) => {
  const b = cellBorder(c);
  return { top: b, bottom: b, left: b, right: b };
};

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [
      new TextRun({ text, bold: true, size: 32, color: DARK_BLUE, font: "Arial" }),
    ],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({ text, bold: true, size: 26, color: MID_BLUE, font: "Arial" }),
    ],
  });
}
function h3(text) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [
      new TextRun({ text, bold: true, size: 22, color: "333333", font: "Arial" }),
    ],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 20, font: "Arial", ...opts })],
  });
}
function code(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 360 },
    children: [
      new TextRun({ text, font: "Courier New", size: 18, color: "333333" }),
    ],
  });
}
function codeBlock(lines) {
  return lines.map((l) => code(l));
}
function spacer(size = 120) {
  return new Paragraph({ spacing: { before: size, after: 0 }, children: [] });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function headerRow(cells, colWidths, bg = DARK_BLUE) {
  return new TableRow({
    tableHeader: true,
    children: cells.map(
      (text, i) =>
        new TableCell({
          borders: borders("FFFFFF"),
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: bg, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text,
                  bold: true,
                  size: 18,
                  color: "FFFFFF",
                  font: "Arial",
                }),
              ],
            }),
          ],
        })
    ),
  });
}
function dataRow(cells, colWidths, bg = "FFFFFF") {
  return new TableRow({
    children: cells.map(
      (text, i) =>
        new TableCell({
          borders: borders("CCCCCC"),
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: bg, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: text || "", size: 18, font: "Arial" }),
              ],
            }),
          ],
        })
    ),
  });
}
function simpleTable(headers, rows, colWidths, altColor = LIGHT_BLUE) {
  return new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      headerRow(headers, colWidths),
      ...rows.map((r, idx) =>
        dataRow(r, colWidths, idx % 2 === 0 ? "FFFFFF" : altColor)
      ),
    ],
  });
}

// ============================================================
// FILE 1: Architecture & Tech Stack
// ============================================================
function buildFile1() {
  const cols2 = [2800, 6560];

  return [
    h1("File 1: Architecture & Tech Stack"),
    p(
      "AI Interview Prep Platform — Full-Stack Codebase Reference for Technical Interviews"
    ),
    spacer(80),

    h2("One-Line Pitch"),
    p(
      "Full-stack AI mock interview app: JWT auth → AI generates questions → user answers → AI evaluates → skill profile updates → adaptive next questions → analytics + PDF reports."
    ),
    spacer(80),

    h2("Tech Stack"),
    simpleTable(
      ["Layer", "Technology / Libraries"],
      [
        [
          "Frontend",
          "React 19, Vite, React Router 7, Redux Toolkit, Axios, Tailwind 4, jsPDF",
        ],
        [
          "Backend",
          "Node.js, Express 5, Mongoose, JWT, Multer, bcrypt, pdf-parse",
        ],
        [
          "AI Providers",
          "Google Gemini → OpenRouter → Groq → Hugging Face (fallback chain)",
        ],
        [
          "Database",
          "MongoDB Atlas (Mongoose ODM, replica set required for transactions)",
        ],
        ["Deploy", "Netlify (frontend), Render (backend)"],
      ],
      cols2
    ),
    spacer(80),

    h2("Architecture Flow"),
    ...codeBlock([
      "React UI",
      "  └─ apiClient.js (Axios + Bearer JWT)",
      "       └─ Express Routes",
      "            ├─ Middleware: protect → authorize → errorHandler",
      "            ├─ Controllers → MongoDB (via Mongoose)",
      "            └─ llmRouter.js → AI providers (Gemini, OpenRouter, Groq, HF)",
    ]),
    spacer(80),

    h2("Middleware Stack (server.js)"),
    simpleTable(
      ["Order", "Middleware", "Purpose"],
      [
        ["1", "helmet()", "Security HTTP headers"],
        ["2", "CORS allowlist", "Block unknown origins, allow CLIENT_URL + dev"],
        ["3", "express.json({ limit: '10kb' })", "Parse body; limit prevents DoS"],
        ["4", "compression + morgan", "Gzip responses; request logging"],
        ["5", "trust proxy: 1", "Correct IP behind Render/Heroku proxy"],
        ["6", "Rate limit /api/v1/ai", "50 requests / 15 min per IP"],
        ["7", "Routes", "Versioned under /api/v1/*"],
        ["8", "404 catch-all", "Unknown routes → 404 JSON"],
        ["9", "errorMiddleware", "Centralized error → { success, message }"],
      ],
      [800, 3200, 5360]
    ),
    spacer(80),

    h2("Environment Variables"),
    simpleTable(
      ["Variable", "Required", "Purpose"],
      [
        ["MONGO_URI", "Yes", "MongoDB connection string"],
        ["JWT_SECRET", "Yes", "Sign/verify tokens — app exits if missing"],
        ["CLIENT_URL", "Prod", "CORS allowed origin"],
        ["CLIENT_URLS", "Optional", "Comma-separated extra origins"],
        ["GEMINI_API_KEY", "At least one", "Primary LLM provider"],
        ["OPENROUTER_API_KEY", "Optional", "Fallback LLM"],
        ["GROQ_API_KEY", "Optional", "Fallback LLM"],
        ["HF_API_KEY + HF_BASE_URL", "Optional", "Fallback LLM (Hugging Face)"],
        ["VITE_API_BASE_URL", "Frontend", "API base URL for Axios"],
      ],
      [3000, 1500, 4860]
    ),
    spacer(80),

    h2("Key Files Map"),
    simpleTable(
      ["File", "Role"],
      [
        ["backend/server.js", "App entry: middleware, routes, startup"],
        [
          "backend/utils/llmRouter.js",
          "AI fallback chain, circuit breaker, JSON parse",
        ],
        [
          "backend/utils/aiReliability.js",
          "Cache + retry wrapper (EXISTS but unused by controllers)",
        ],
        [
          "backend/controller/aiEvaluationContoller.js",
          "Evaluate answer — core business logic",
        ],
        ["backend/controller/adaptiveController.js", "Adaptive next question decision"],
        ["backend/controller/sessionController.js", "Session CRUD + MongoDB transaction"],
        [
          "backend/service/skillProfileServices.js",
          "Running averages, weakest topic logic",
        ],
        ["backend/middleware/authMiddleware.js", "JWT protect + authorize(roles)"],
        ["frontend/src/services/apiClient.js", "Axios instance + 401 interceptor"],
        [
          "frontend/src/features/auth/authSlice.js",
          "Redux auth + localStorage persistence",
        ],
        [
          "frontend/src/pages/interview/SessionPage.jsx",
          "Live interview orchestration",
        ],
        ["frontend/src/utils/reportPdf.js", "Client-side PDF export (lazy-loaded)"],
      ],
      cols2
    ),
    pageBreak(),
  ];
}

// ============================================================
// FILE 2: MongoDB Data Models
// ============================================================
function buildFile2() {
  const cols2 = [2800, 6560];

  return [
    h1("File 2: MongoDB Data Models"),
    spacer(60),

    h2("Entity Relationships"),
    ...codeBlock([
      "User (_id)",
      "  ├── Session[]      user → Session.user",
      "  │    └── Question[]   Question.session → Session._id",
      "  │         └── AnswerAttempt[]   links user + session + question",
      "  ├── SkillProfile   1:1, SkillProfile.user (unique index)",
      "  └── ResumeProfile[]  user + session refs",
    ]),
    spacer(80),

    h2("User Schema"),
    simpleTable(
      ["Field", "Type / Constraint", "Notes"],
      [
        ["email", "String, unique, regex, lowercase", "Indexed for login lookup"],
        [
          "password",
          "String, min 8, select: false",
          "Never returned by default; bcrypt hashed in pre-save hook",
        ],
        ["role", "Enum: user | admin", "RBAC via authorize() middleware"],
        ["isActive", "Boolean, default true", "Soft-disable; 403 if false on login"],
        ["refreshToken", "String", "Schema field exists — NO endpoint uses it yet"],
      ],
      [2000, 3000, 4360]
    ),
    spacer(60),
    p(
      'Pre-save hook: if password modified → bcrypt.genSalt(10) + bcrypt.hash. Login uses .select("+password") to include hidden field.',
      { italics: true }
    ),
    spacer(80),

    h2("Session Schema"),
    simpleTable(
      ["Field", "Type", "Notes"],
      [
        ["user", "ObjectId ref User", "Ownership filter on every query"],
        ["jobRole / experienceLevel", "String / Enum", "fresher | junior | mid | senior"],
        ["mode", "Enum", "practice | mock | resume-based"],
        ["source", "Enum", "manual | resume | template"],
        ["questions", "ObjectId[] ref Question", "Normalized — allows appending adaptive Qs"],
        ["status", "Enum", "active | completed | paused"],
        ["score", "Number", "Updated after each evaluate call"],
        ["completedQuestions", "Number", "Set only on endSession via distinct()"],
        ["totalQuestions", "Number", "Incremented on adaptive question add"],
      ],
      [2500, 2000, 4860]
    ),
    p(
      "Indexes: { user:1, createdAt:-1 }  { user:1, status:1 } — for list + filter queries.",
      { italics: true }
    ),
    spacer(80),

    h2("AnswerAttempt Schema"),
    simpleTable(
      ["Field", "Type", "Notes"],
      [
        ["user, session, question", "ObjectId refs", "All three indexed for lookup patterns"],
        ["userAnswer", "String", "Raw user text"],
        [
          "aiEvaluation",
          "Subdocument",
          "score, strengths[], weaknesses[], idealAnswer, feedback, followUpQuestion",
        ],
        ["topicTags", "String[]", "From AI; used as primaryTopic for skill profile"],
        ["attemptNumber", "Number", "Each submit = new doc; count prior attempts + 1"],
        ["evaluationStatus", "Enum", "pending | completed | failed"],
        ["timeTaken", "Number", "Session elapsed timer from frontend (not per-question)"],
        ["isCorrect", "Boolean", "From AI; fallback: score >= 60 if omitted"],
      ],
      [2500, 1800, 5060]
    ),
    spacer(80),

    h2("SkillProfile Schema"),
    simpleTable(
      ["Field", "Type", "Notes"],
      [
        ["user", "ObjectId, unique", "One profile per user — all attempts accumulate here"],
        [
          "topics[]",
          "Embedded subdoc",
          "Per topic: averageScore, totalQuestions, confidenceLevel, recommendedDifficulty",
        ],
        ["overallScore", "Number", "Running average across all attempts"],
        ["accuracyRate", "Number", "Running % of isCorrect attempts"],
        ["strongestTopics", "String[]", "Topics with avg ≥ 70"],
        ["weakestTopics", "String[]", "Topics with avg < 50"],
        ["scoreHistory", "Array capped at 50", "Last 50 {score, date} — used for improvementRate"],
        ["aiRecommendations", "String[]", "Rule-based suggestions"],
      ],
      [2500, 2000, 4860]
    ),
    spacer(80),

    h2("MongoDB Indexes Quick Reference"),
    simpleTable(
      ["Collection", "Index", "Optimizes"],
      [
        ["users", "{ email:1 } unique", "Login lookup"],
        ["sessions", "{ user:1, createdAt:-1 }", "History list (most recent first)"],
        ["sessions", "{ user:1, status:1 }", "Filter active / completed"],
        ["questions", "{ session:1, createdAt:-1 }", "Questions per session"],
        ["answerattempts", "{ user:1, createdAt:-1 }", "Recent activity feed"],
        ["answerattempts", "{ session:1, question:1, attemptNumber:1 }", "Count prior attempts"],
        ["resumeprofiles", "{ user:1, createdAt:-1 }", "Resume history list"],
      ],
      [2200, 3000, 4160]
    ),
    spacer(80),

    h2("Known Schema Issues (Interview Discussion)"),
    simpleTable(
      ["Issue", "Impact"],
      [
        [
          "Question schema has no topicTags field",
          "adaptiveController sets it on create — Mongoose strict mode silently drops it",
        ],
        ["refreshToken field exists, no endpoint", "Users logged out after 15-min JWT expiry"],
        [
          "addQuestionToSession maps answer:, schema uses idealAnswer:",
          "Field mismatch — data not saved",
        ],
        [
          "timeTaken is session-level timer",
          "Not per-question accurate after first question",
        ],
      ],
      [3500, 5860]
    ),
    pageBreak(),
  ];
}

// ============================================================
// FILE 3: Backend Logic & Algorithms
// ============================================================
function buildFile3() {
  return [
    h1("File 3: Backend Logic & Algorithms"),
    spacer(60),

    h2("1. Authentication Flow"),
    ...codeBlock([
      "POST /auth/register",
      "  1. Validate fields → check duplicate email",
      "  2. User.create({ password plaintext })",
      "  3. pre-save hook: bcrypt.genSalt(10) + hash → saved",
      "  4. jwt.sign({ id }, JWT_SECRET, { expiresIn: '15m' })",
      "  5. Return { user, token }",
      "",
      "POST /auth/login",
      "  1. User.findOne({ email }).select('+password')",
      "  2. bcrypt.compare(plaintext, hash)",
      "  3. Check isActive → generate token",
      "",
      "protect middleware (every protected route)",
      "  1. Extract token from cookie OR Bearer header",
      "  2. jwt.verify(token, JWT_SECRET)",
      "  3. User.findById(decoded.id).select('-password')",
      "  4. Check isActive → attach req.user → next()",
    ]),
    spacer(80),

    h2("2. Running Average Algorithm (skillProfileServices.js)"),
    ...codeBlock([
      "nextAvg = (prevAvg * prevCount + newScore) / (prevCount + 1)",
      "",
      "Example: topic 'React', prevAvg=68, prevCount=4, newScore=80",
      "  nextAvg = (68*4 + 80) / 5 = 70.4",
      "",
      "Applied to: topic.averageScore, overallScore, accuracyRate, averageResponseTime",
    ]),
    spacer(80),

    h2("3. Score Thresholds & Adaptive Difficulty"),
    simpleTable(
      ["Score Range", "confidenceLevel", "recommendedDifficulty", "strongestTopics", "weakestTopics"],
      [
        ["≥ 80", "high", "hard", "avg ≥ 70", "—"],
        ["50 – 79", "medium", "medium", "—", "—"],
        ["< 50", "low", "easy", "—", "avg < 50"],
      ],
      [2000, 2000, 2500, 2000, 860]
    ),
    spacer(60),
    h3("Adaptive Next Question Decision (adaptiveController.js)"),
    ...codeBlock([
      "topic = skillProfile.weakestTopics[0]",
      "     ?? session.topicsToFocus[0]",
      "     ?? 'general'",
      "",
      "difficulty:",
      "  score >= 80  →  'hard'",
      "  score >= 50  →  keep current OR bump 'easy' → 'medium'",
      "  else         →  'easy'",
      "",
      "→ LLM generates 1 question with topic + difficulty context",
      "→ Question.create() + session.questions.push() + totalQuestions++",
    ]),
    spacer(80),

    h2("4. LLM Router (llmRouter.js)"),
    h3("Provider order (default)"),
    ...codeBlock([
      "Gemini (12s timeout) → OpenRouter (12s) → Groq (10s) → Hugging Face (15s)",
    ]),
    h3("Circuit Breaker"),
    simpleTable(
      ["Failures", "State", "Behavior"],
      [
        ["0-2", "Trying", "Normal"],
        ["3", "Blocked 5 min", "Skipped until blockedUntil timestamp passes"],
        ["Success", "Reset", "failures back to 0"],
      ],
      [2000, 2500, 4860]
    ),
    p(
      "In-memory — breaks across multiple server instances (fix: Redis-backed state)",
      { italics: true }
    ),
    spacer(60),
    h3("JSON parsing utilities"),
    simpleTable(
      ["Function", "Handles fences?", "Handles prose before JSON?", "Used by"],
      [
        ["parseModelJson", "Yes", "Yes (finds first { or [)", "Question gen, adaptive, resume"],
        ["safeJsonParse", "Yes", "NO — fails on prose prefix", "Answer evaluate only"],
      ],
      [2500, 2000, 2800, 2060]
    ),
    spacer(80),

    h2("5. Answer Evaluation Pipeline (aiEvaluationContoller.js)"),
    simpleTable(
      ["Step", "Action", "MongoDB write?"],
      [
        ["1", "Validate sessionId, questionId, userAnswer (ObjectId format)", "No"],
        ["2", "Load session — must belong to user + status !== 'completed'", "No"],
        ["3", "Load question — must belong to that session", "No"],
        ["4", "Derive topic: topicTags[0] → question.type → 'general'", "No"],
        ["5", "LLM evaluation call → safeJsonParse → normalizeScore(0–100)", "No"],
        ["6", "Count prior attempts → create AnswerAttempt (attemptNumber++)", "INSERT answerattempts"],
        ["7", "Backfill question.idealAnswer if empty", "UPDATE questions"],
        ["8", "updateSkillProfileFromAttempt (service layer)", "UPSERT skillprofiles"],
        ["9", "Update session.score + lastActivityAt", "UPDATE sessions"],
        ["10", "Return evaluation + adaptive hints + skill snapshot", "No"],
      ],
      [600, 5200, 3560]
    ),
    p(
      "Dead code: lines 95–235 in same file define duplicate updateSkillProfile — never called.",
      { italics: true }
    ),
    spacer(80),

    h2("6. Session Creation Transaction (sessionController.js)"),
    ...codeBlock([
      "const dbSession = await mongoose.startSession();",
      "dbSession.startTransaction();",
      "try {",
      "  Session.create([{...}], { session: dbSession })",
      "  Question.insertMany([...], { session: dbSession })",
      "  Session.update questions array + totalQuestions",
      "  await dbSession.commitTransaction();",
      "} catch (e) {",
      "  await dbSession.abortTransaction(); throw e;",
      "}",
      "",
      "Why: Session + questions are atomic — no orphan sessions if insert fails.",
      "Requires MongoDB replica set (Atlas provides this).",
    ]),
    spacer(80),

    h2("7. Resume Pipeline (resumeController.js)"),
    ...codeBlock([
      "Upload PDF/TXT → Multer saves to uploads/",
      "  ↓ extractResumeText: pdf-parse or fs.readFile UTF-8",
      "  ↓ Reject if text < 50 chars",
      "  ↓ analyzeResumeWithAI → structured JSON analysis",
      "  ↓ Session.create (mode: 'resume-based', source: 'resume')",
      "  ↓ generateResumeQuestionsWithAI",
      "  ↓ Question.insertMany",
      "  ↓ ResumeProfile.create (stores rawTextSnippet first 2000 chars)",
      "  finally: fs.unlink → delete uploaded file from disk",
    ]),
    spacer(80),

    h2("8. normalizeScore Function"),
    ...codeBlock([
      "normalizeScore(raw):",
      "  n = Number(raw)           // 'eighty' → NaN, 150 → 150",
      "  if NaN → return 0         // missing or non-numeric score",
      "  return Math.min(100, Math.max(0, n))  // clamp 0–100",
    ]),
    pageBreak(),
  ];
}

// ============================================================
// FILE 4: Frontend Deep Dive
// ============================================================
function buildFile4() {
  return [
    h1("File 4: Frontend Architecture & State"),
    spacer(60),

    h2("Route Map (AppRoutes.jsx)"),
    simpleTable(
      ["Path", "Component", "Protected"],
      [
        ["/login, /register", "LoginPage, RegisterPage", "No"],
        ["/ → redirect", "DashboardPage", "Yes"],
        ["/dashboard", "DashboardPage", "Yes"],
        ["/interview/history", "SessionHistoryPage — create + list", "Yes"],
        ["/interview/session/:id", "SessionPage — live interview", "Yes"],
        ["/interview/details/:id", "SessionDetailPage — read-only review", "Yes"],
        ["/resume/upload", "ResumeUploadPage", "Yes"],
        ["/resume/:sessionId", "ResumeProfilePage — analysis view", "Yes"],
        ["/analytics", "AnalyticsPage", "Yes"],
        ["*", "NotFoundPage", "No"],
      ],
      [3000, 3500, 2860]
    ),
    spacer(80),

    h2("State Architecture"),
    simpleTable(
      ["State type", "Where stored", "Examples"],
      [
        ["Global auth", "Redux authSlice", "userInfo, token, loading, error"],
        ["Page-local", "useState in each page", "session, feedback, formData, timers"],
        ["Server cache", "None (no React Query)", "Each page fetches on mount"],
        ["Persistence", "localStorage", "token, userInfo (hydrated on app load)"],
      ],
      [2500, 2500, 4360]
    ),
    p(
      "Only auth is global Redux. Everything else is fetch-on-mount local state.",
      { italics: true }
    ),
    spacer(80),

    h2("authSlice.js — Redux Actions"),
    simpleTable(
      ["Action", "Sets", "localStorage"],
      [
        ["authStart", "loading: true", "—"],
        ["authSuccess", "userInfo + token, loading: false", "Write both"],
        ["authFailure", "error message, loading: false", "—"],
        ["logout", "null userInfo + token", "Remove both"],
      ],
      [2500, 3500, 2860]
    ),
    spacer(80),

    h2("apiClient.js — Axios Interceptors"),
    h3("Request interceptor"),
    ...codeBlock(["headers.Authorization = 'Bearer ' + localStorage.getItem('token')"]),
    h3("Response interceptor — 401 handler"),
    ...codeBlock([
      "if (status === 401) {",
      "  localStorage.removeItem('userInfo');",
      "  localStorage.removeItem('token');",
      "  if (not on /login or /register) {",
      "    toast.error('Session expired. Please login again.');",
      "    window.location.href = '/login';",
      "  }",
      "}",
    ]),
    spacer(80),

    h2("SessionPage.jsx — State Machine"),
    ...codeBlock([
      "States: loading → ready → submitting → readyWithFeedback",
      "                → generating (adaptive) → ready",
      "                → ending → navigate away",
      "",
      "Timer: setInterval(+1s) while session.status === 'active'",
      "On question change: answer='', feedback=null, elapsedSeconds=0",
    ]),
    spacer(80),

    h2("SessionPage Key State Variables"),
    simpleTable(
      ["State", "Set when", "Cleared when"],
      [
        ["session", "fetch / refresh", "Updated in-place on refresh"],
        ["currentQuestion", "first load / select / adaptive", "Question change"],
        ["answer", "user typing / voice draft", "Submit success / question change"],
        ["feedback", "evaluate 200", "New submit / question change"],
        ["elapsedSeconds", "timer tick", "Question change / adaptive generate"],
      ],
      [2500, 3000, 3860]
    ),
    spacer(80),

    h2("Two-Step Session Creation (SessionHistoryPage)"),
    ...codeBlock([
      "Step 1: POST /ai/questions/generate → questions array in memory",
      "Step 2: POST /sessions with that questions array",
      "Step 1 fails → never calls Step 2 → no orphan in DB",
      "Step 2 fails → transaction rolls back → no orphan session",
    ]),
    spacer(80),

    h2("Frontend Component Map"),
    simpleTable(
      ["Component", "Key functionality"],
      [
        ["SessionHistoryPage", "Create (2-step), list, delete, PDF download"],
        ["SessionPage", "Live interview — answer, voice, feedback, adaptive, end"],
        ["SessionDetailPage", "Read-only review, latest attempt per Q, PDF"],
        ["AnswerBox", "Textarea + voice draft + submit + adaptive button"],
        ["FeedbackPanel", "Null if no feedback; score/strengths/weaknesses/followUp"],
        ["useSpeechRecognition", "Browser speech API wrapper with cleanup"],
        ["reportPdf.js", "Lazy jsPDF import, pagination, latest attempt per Q"],
      ],
      [3000, 6360]
    ),
    pageBreak(),
  ];
}

// ============================================================
// FILE 5: HTTP Status Map, Interview Q&A, Known Issues
// ============================================================
function buildFile5() {
  return [
    h1("File 5: HTTP Status Map, Q&A & Known Issues"),
    spacer(60),

    h2("HTTP Status Code Reference"),
    simpleTable(
      ["Code", "When", "Frontend action"],
      [
        ["200", "GET / PATCH success", "Render data, update state"],
        ["201", "POST register/createSession/resume", "Success toast + navigate"],
        ["400", "Validation / completed session / missing file", "toast.error(message)"],
        ["401", "No token / expired / bad signature", "Clear localStorage → redirect /login"],
        ["403", "Not owner / disabled account", "toast.error(message)"],
        ["404", "Not found or wrong user's resource", "toast.error + error UI card"],
        ["429", "AI rate limit (50 / 15 min)", "toast.error rate limit message"],
        ["500", "LLM fail / parse fail / DB error", "toast.error(message)"],
        ["502", "AI wrong JSON shape (question gen)", "toast.error bad AI shape"],
      ],
      [1000, 3500, 4860]
    ),
    spacer(80),

    h2("Top 10 Interview Questions & Answers"),
    spacer(40),

    h3("Q1: Why use MongoDB transactions for session creation?"),
    p(
      "Session and Question documents must be created atomically. Without a transaction, if Question.insertMany() fails after Session is created, you get an empty orphan session. Requires MongoDB replica set (Atlas)."
    ),
    spacer(60),

    h3("Q2: How does the LLM fallback work?"),
    p(
      "Ordered provider list, skip disabled/circuit-open, Promise.race timeout per provider, try in order. After 3 consecutive failures a provider is blocked 5 minutes. All fail → throw with aggregated errors."
    ),
    spacer(60),

    h3("Q3: How is adaptive difficulty calculated?"),
    p(
      "Rule-based thresholds on last score + weakest topic from SkillProfile + LLM generates one targeted question."
    ),
    spacer(60),

    h3("Q4: How do re-attempts work?"),
    p(
      "Each submit creates new AnswerAttempt (attemptNumber++). Skill profile averages all attempts. Detail page + PDF show latest attempt only: matches[matches.length - 1]."
    ),
    spacer(60),

    h3("Q5: How is user data isolation enforced?"),
    p(
      "Every query filters by req.user._id from JWT. Returns 404 (not 403) on read mismatches to avoid confirming resource existence."
    ),
    spacer(60),

    h3("Q6–Q10: Scale, 401 interceptor, separate collections, code smells, running average"),
    p(
      "Scale: Redis cache/circuit breaker, BullMQ for AI, S3 uploads, refresh tokens, React Query. 401: apiClient clears localStorage + hard redirect. Separate AnswerAttempt: immutable history, multiple attempts, analytics. Code smell: safeJsonParse vs parseModelJson inconsistency; dead updateSkillProfile; unused aiReliability.js. Running average: nextAvg = (prevAvg*prevCount + newScore)/(prevCount+1)."
    ),
    spacer(80),

    h2("Full Session Lifecycle"),
    ...codeBlock([
      "create (status: active)",
      "  → evaluate answers (score updates each time)",
      "  → optional: adaptive questions (totalQuestions++)",
      "  → PATCH /sessions/:id/end → status: completed",
      "  → SessionDetailPage + PDF download",
      "Blocked after completed: evaluate, adaptive, add questions",
    ]),
    pageBreak(),
  ];
}

// ============================================================
// FILE 6: Extended Traces (Re-attempt, Security, Edge Cases)
// ============================================================
function buildFile6() {
  return [
    h1("File 6: Extended Scenario Traces"),
    spacer(60),

    h2("Re-Attempt on Same Question"),
    simpleTable(
      ["Event", "MongoDB", "UI"],
      [
        ["1st submit score 68", "INSERT att_001 attemptNumber:1", "FeedbackPanel shows 68"],
        ["2nd submit score 85", "INSERT att_002 attemptNumber:2 (att_001 kept)", "FeedbackPanel shows 85"],
        ["Skill profile", "React avg: (68+85)/2 = 76.5", "SessionInfo score: 76.5"],
        ["Session detail", "Both attempts in DB", "Shows att_002 only (latest)"],
        ["After end session", "evaluate → 400 blocked", "AnswerBox disabled"],
      ],
      [2800, 3800, 2760]
    ),
    spacer(80),

    h2("Multi-User Security (User B vs User A's session)"),
    simpleTable(
      ["Alex's action", "HTTP", "Priya's data affected?"],
      [
        ["GET /sessions/sess_priya", "404", "No"],
        ["POST /answers/evaluate", "404", "No"],
        ["DELETE /sessions/sess_priya", "403", "No"],
        ["PATCH /sessions/:id/end", "404", "No"],
        ["GET /adaptive/next", "404", "No"],
        ["Cross-session questionId tamper", "404", "No"],
        ["No JWT token", "401", "No"],
      ],
      [3500, 1200, 4660]
    ),
    p(
      "Defense layers: ProtectedRoute (client) → JWT verify (server) → ownership filter on every query.",
      { italics: true }
    ),
    spacer(80),

    h2("Parallel Users — Data Isolation"),
    simpleTable(
      ["Collection", "Priya (user_001)", "Alex (user_002)"],
      [
        ["sessions", "sess_priya_001 (Frontend Dev)", "sess_alex_001 (Backend Dev)"],
        ["skillprofiles", "skill_p_001 overall 82", "skill_a_001 overall 45"],
        ["answerattempts", "att_p_* only", "att_a_* only"],
        ["Analytics dashboard", "Sees own stats only", "Sees own stats only"],
      ],
      [2500, 3430, 3430]
    ),
    p("SkillProfile.user has unique index — one profile per user, never shared.", {
      italics: true,
    }),
    spacer(80),

    h2("Malformed AI Response — Evaluate Path"),
    simpleTable(
      ["LLM output", "parse result", "DB write?", "User sees"],
      [
        ["JSON in ``` fences", "safeJsonParse OK", "Yes", "Feedback panel"],
        ["Prose before { ... }", "Parse FAIL", "No", "toast 500, answer kept"],
        ['score: "eighty"', "normalizeScore → 0", "Yes (score 0)", "Confusing score 0"],
        ["Valid JSON array not object", "parsed.score undefined → 0", "Yes (empty feedback)", "Silent data loss"],
        ["All providers fail", "Never reaches parse", "No", "toast all providers failed"],
      ],
      [2800, 2200, 1800, 2560]
    ),
    spacer(80),

    h2("Full 5-Question Session — Score Progression Example"),
    simpleTable(
      ["Question", "Score", "Running overallScore", "SessionPage state after"],
      [
        ["Q1 useEffect", "68", "68", "feedback visible, timer continues"],
        ["Q2 Virtual DOM", "75", "71.5", "select Q2 → timer reset"],
        ["Q3 Flexbox", "55", "66", "weakestTopics still empty (55 ≥ 50)"],
        ["Q4 React perf", "82", "70", "strongestTopics: [React]"],
        ["Q5 ARIA", "60", "68", "Progress 5/5"],
        ["End session", "—", "68", "navigate → /interview/details/:id"],
      ],
      [2200, 1200, 2200, 3760]
    ),
    spacer(80),

    h2("Analytics Delta (Before vs After Full Session)"),
    simpleTable(
      ["Metric", "Before any answers", "After 5 answers + end"],
      [
        ["totalAttempts", "0", "5"],
        ["completedSessions", "0", "1"],
        ["averageScore", "0", "68"],
        ["overallScore (skill profile)", "0", "68"],
        ["recentActivity", "empty", "5 items"],
      ],
      [3500, 2930, 2930]
    ),
    spacer(80),

    h2("What Happens When — Quick Reference"),
    simpleTable(
      ["Scenario", "HTTP", "DB writes?", "User sees"],
      [
        ["Submit, LLM parse fails", "500", "No", "toast, answer kept"],
        ["Submit on completed session", "400", "No", "toast blocked"],
        ["JWT expires mid-session", "401", "No", "redirect login"],
        ["Create session, DB tx fails", "500", "No (rollback)", "toast, stay on form"],
        ["End session twice", "200 both", "No change 2nd", "navigate anyway"],
        ["PDF download", "—", "No", "file saved locally"],
      ],
      [2800, 1200, 2200, 3160]
    ),
  ];
}

// ============================================================
// Assemble Document
// ============================================================
const numbering = {
  config: [
    {
      reference: "bullets",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
      ],
    },
  ],
};

const styles = {
  default: { document: { run: { font: "Arial", size: 20 } } },
  paragraphStyles: [
    {
      id: "Heading1",
      name: "Heading 1",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { size: 32, bold: true, font: "Arial", color: DARK_BLUE },
      paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 },
    },
    {
      id: "Heading2",
      name: "Heading 2",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { size: 26, bold: true, font: "Arial", color: MID_BLUE },
      paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
    },
  ],
};

const doc = new Document({
  numbering,
  styles,
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "AI Interview Prep Platform — Codebase Reference",
                  size: 16,
                  color: "888888",
                  font: "Arial",
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        ...buildFile1(),
        ...buildFile2(),
        ...buildFile3(),
        ...buildFile4(),
        ...buildFile5(),
        ...buildFile6(),
      ],
    },
  ],
});

const outDir = path.join(__dirname, "..", "docs");
const outFile = path.join(outDir, "AI_Interview_Prep_Codebase_Reference.docx");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

Packer.toBuffer(doc)
  .then((buf) => {
    fs.writeFileSync(outFile, buf);
    console.log(`Generated: ${outFile}`);
  })
  .catch((err) => {
    console.error("Failed to generate document:", err);
    process.exit(1);
  });
