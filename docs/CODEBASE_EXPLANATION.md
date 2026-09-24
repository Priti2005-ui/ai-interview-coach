# AI Interview Prep Platform - Codebase Explanation

This document explains the project as an interview-prep reference. The application is a full-stack AI interview practice platform: users authenticate, create interview sessions, receive AI-generated questions, submit answers, get AI feedback, build skill profiles, generate adaptive follow-up questions, upload resumes, view analytics, and export PDF reports.

## Architecture Overview

The app is split into an Express/MongoDB backend and a React/Vite frontend.

Request flow:

```text
React pages/components
  -> apiClient.js adds Bearer JWT
  -> Express routes
  -> protect middleware verifies JWT and sets req.user
  -> controllers apply business logic
  -> Mongoose models persist data
  -> llmRouter.js calls Gemini/OpenRouter/Groq/Hugging Face when AI is needed
```

Core domain relationships:

```text
User
  -> Session[]
       -> Question[]
            -> AnswerAttempt[]
  -> SkillProfile
  -> ResumeProfile[]
```

Interview relevance: this is a classic full-stack architecture with authentication, protected resources, normalized MongoDB references, controller/service separation, third-party API fallback logic, and frontend state orchestration.

## Root Files

### README.md

Purpose: High-level project overview, feature list, tech stack, local setup, and environment variables.

Code breakdown: This file is not executable code, but it frames the system: React/Vite frontend, Express/Mongo backend, JWT auth, AI question generation, resume analysis, adaptive practice, analytics, voice mode, and PDF export.

Key concepts/features: Explains the application pitch and required environment variables such as `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `GEMINI_API_KEY`, and `VITE_API_BASE_URL`.

Interview relevance: Use it to answer "What did you build?" and "What are the main features and technologies?"

### DEPLOYMENT.md

Purpose: Deployment guide for Render, Netlify, and MongoDB Atlas.

Code breakdown: Backend deploys from `backend` using `npm install` and `npm start`. Frontend deploys from `frontend/ai_interview_prep`, publishes `dist`, and requires `VITE_API_BASE_URL`.

Key concepts/features: Separates frontend and backend deployment, explains CORS dependency between Netlify frontend URL and Render backend `CLIENT_URL`.

Interview relevance: Demonstrates awareness of production concerns: environment variables, CORS, cloud DB access, and frontend build output.

### .gitignore

Purpose: Prevents secrets and dependency folders from being committed.

Code breakdown: Ignores `backend/.env`, backend/frontend/script `node_modules`.

Interview relevance: Shows basic security hygiene. `.env` files must not be committed.

## Backend Entry And Configuration

### backend/server.js

Purpose: Main backend entry point. It configures middleware, route mounting, health checks, rate limits, 404 handling, error handling, database connection, and server startup.

Code breakdown:

- Loads `.env` with `dotenv.config()` before reading environment variables.
- Imports Express security/performance middleware: `cors`, `helmet`, `morgan`, `express-rate-limit`, `compression`.
- Exits early if `MONGO_URI` or `JWT_SECRET` is missing.
- Creates an Express app.
- Applies `helmet()` and `helmet.crossOriginResourcePolicy({ policy: "cross-origin" })` to improve browser security while allowing uploaded assets to be loaded cross-origin.
- Builds `allowedOrigins` from `CLIENT_URL`, comma-separated `CLIENT_URLS`, and localhost dev URLs.
- Configures CORS with credentials, common HTTP methods, and `Content-Type`/`Authorization` headers.
- Uses `express.json({ limit: "10kb" })` to reduce large-body abuse.
- Enables URL-encoded parsing, gzip compression, request logging, and `trust proxy` for deployment behind Render-like proxies.
- Serves `/uploads` statically.
- Defines `/api/health` for uptime monitoring.
- Defines `aiLimiter` with 50 AI requests per 15 minutes and applies it to `/api/v1/ai`.
- Mounts versioned route modules: auth, sessions, questions, AI, answers, adaptive, resume, analytics.
- Adds a 404 JSON response for unmatched routes.
- Adds centralized `errorHandler`.
- `startServer()` connects to MongoDB and then starts listening.

Logic/algorithms: Middleware order matters. Security and parsing happen before routes; 404 and error handling happen after routes.

Key concepts/features: CORS allowlist, API versioning, rate limiting, health checks, static file serving, centralized errors.

Interview relevance: Be ready to explain Express middleware order and why AI endpoints need rate limiting.

Potential improvements:

- Include `/api/health` under versioned API if consistency matters.
- Avoid logging sensitive deployment state in production.
- Consider larger JSON body limit only where needed rather than globally.

### backend/config/db.js

Purpose: Connects Mongoose to MongoDB.

Code breakdown:

- Calls `mongoose.connect(process.env.MONGO_URI)`.
- Logs the connected host on success.
- Logs error message and exits process on failure.

Key concepts/features: Centralized DB connection function used by `server.js`.

Interview relevance: Shows async startup sequencing: do not start server until DB is connected.

Potential improvements: Add connection options, retry/backoff, and structured logging.

## Backend Middleware And Utilities

### backend/middleware/authMiddleware.js

Purpose: Protects routes and optionally enforces role-based access.

Code breakdown:

- `protect` is wrapped with `asyncHandler`.
- Extracts JWT from either `req.cookies.token` or `Authorization: Bearer <token>`.
- Returns `401` if no token exists.
- Verifies token with `jwt.verify(token, JWT_SECRET)`.
- Loads user with `User.findById(decoded.id).select("-password")`.
- Returns `401` if user no longer exists.
- Returns `403` if `isActive` is false.
- Attaches `req.user = user` and calls `next()`.
- Handles expired token with a specific `Token expired` message.
- `authorize(...roles)` returns middleware that checks `req.user.role`.

Logic/algorithms: This is stateless token authentication. Every protected request proves identity by presenting a signed JWT.

Key concepts/features: JWT verification, route protection, RBAC.

Interview relevance: Common interview topic: "How do you protect API routes?" Explain client-side route protection is convenience, backend protection is security.

Potential improvements:

- `req.cookies` is checked, but `cookie-parser` is not installed/used in `server.js`, so cookie auth will not actually work unless added.
- Access tokens expire in 15 minutes but refresh-token flow is not implemented.

### backend/middleware/errorMiddleware.js

Purpose: Centralized Express error handler.

Code breakdown:

- Logs `err.stack`.
- Responds with `err.statusCode || 500`.
- Returns JSON `{ success: false, message }`.

Key concepts/features: Keeps controller error responses consistent.

Interview relevance: Async controller errors need to reach error middleware; this pairs with `asyncHandler`.

Potential improvements: Hide stack traces in production and map Mongoose validation/cast errors to `400`.

### backend/middleware/uploadMiddleware.js

Purpose: Configures Multer uploads for profile images and resumes.

Code breakdown:

- Ensures `uploads/` exists using `fs.existsSync` and `fs.mkdirSync`.
- Uses disk storage with destination `uploads/`.
- Generates unique filenames using timestamp plus random number plus original name.
- `imageFileFilter` allows jpeg/jpg/png/gif by extension and MIME type.
- `resumeFileFilter` allows `.pdf`, `.txt`, `.md` and PDF/text MIME types.
- `uploadImage` limits files to 5 MB.
- `uploadResume` limits files to 10 MB.

Key concepts/features: File validation, storage strategy, upload size limits.

Interview relevance: Useful for discussing upload security and MIME validation.

Potential improvements: Sanitize original filenames, store files in object storage like S3, and use stronger content sniffing for untrusted files.

### backend/utils/asyncHandler.js

Purpose: Avoids repetitive `try/catch` blocks in async controllers.

Code breakdown:

- Takes a controller function `fn`.
- Returns `(req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)`.
- Any rejected promise goes to Express error middleware.

Interview relevance: Classic Express pattern. Be ready to explain why async errors otherwise may not be handled cleanly.

### backend/utils/llmRouter.js

Purpose: Provides a multi-provider AI abstraction with fallback, timeout, circuit breaker, prompt builders, and JSON parsing.

Code breakdown:

- Defines provider configs for Gemini, OpenRouter, Groq, and Hugging Face.
- Each provider has `enabled()`, timeout, model, base URL when applicable, and provider kind.
- `providerState` stores fail counts and `blockedUntil` timestamps.
- `isBlocked`, `recordSuccess`, and `recordFailure` implement a simple circuit breaker.
- `withTimeout` races the provider request against a timeout promise.
- `toGeminiPrompt` converts chat-style messages to a plain prompt because Gemini SDK call is prompt-oriented here.
- `createOpenAIClient` creates clients for OpenAI-compatible APIs.
- `getGeminiText` calls Google Gemini.
- `getOpenAICompatibleText` calls OpenRouter/Groq/Hugging Face through the OpenAI SDK.
- `cleanModelText` strips markdown fences and a common "Here is the JSON:" prefix.
- `extractJsonBlock` finds the first JSON array/object and slices through the last matching bracket.
- `parseModelJson` parses strict JSON or throws a clear error.
- `generateWithFallback` orders preferred providers first, skips disabled/blocked providers, tries each with timeout, records failures/successes, and throws aggregated errors if all fail.
- `buildQuestionMessages` and `buildExplanationMessages` build strict-JSON prompts.

Logic/algorithms:

- Fallback chain: try one provider, on failure move to next.
- Circuit breaker: after 3 consecutive failures, skip provider for 5 minutes.
- Timeout control: `Promise.race` prevents one stuck provider from blocking the whole request.
- JSON extraction: robustly handles code fences and extra text around JSON.

Interview relevance: Strong system-design material: resilience, graceful degradation, vendor abstraction, timeout design, circuit breaker pattern.

Potential improvements:

- Circuit breaker state is in-memory, so it resets on deploy and is not shared across instances.
- `parseModelJson` logs raw model output, which may contain user content.
- Default Gemini model string may become outdated and should be configurable.

### backend/utils/aiReliability.js

Purpose: Provides an additional reliability wrapper around `llmRouter`: response caching, retries, exponential backoff, request IDs, and optional JSON parsing.

Code breakdown:

- `aiCache` is an in-memory `Map`.
- `buildCacheKey` hashes `{ scope, messages }` using SHA-1.
- `getCachedAIResponse` returns non-expired cached payloads.
- `setCachedAIResponse` stores payloads with TTL and evicts oldest entry once cache reaches 500 items.
- `generateReliableAIResponse` validates messages, checks cache unless `forceRefresh`, retries `generateWithFallback`, backs off by `500ms * 2^attempt`, optionally parses JSON, caches success, and returns request metadata.

Key concepts/features: Cache-aside pattern, TTL expiration, bounded in-memory cache, exponential backoff.

Interview relevance: Good answer for "How would you reduce AI latency/cost?" or "How do you handle flaky third-party services?"

Potential improvement: Controllers currently call `generateWithFallback` directly; this wrapper appears unused.

## Backend Models

### backend/model/User.js

Purpose: Defines users and password hashing behavior.

Code breakdown:

- `name`: required, trimmed, min length 2.
- `email`: required, unique, lowercase, trimmed, indexed, regex-validated.
- `password`: required, min length 8, `select: false` so it is hidden by default.
- `profilePic`: optional URL/string.
- `role`: `user` or `admin`, default `user`.
- `refreshToken`: hidden by default but not currently used.
- `isActive`: allows disabling accounts.
- `timestamps: true` adds `createdAt` and `updatedAt`.
- `pre("save")`: hashes password only when modified.
- `comparePassword`: compares login password against bcrypt hash.

Interview relevance: Discuss password hashing, pre-save hooks, and why password fields should not be selected by default.

### backend/model/Session.js

Purpose: Stores an interview session and references its questions.

Code breakdown:

- References `user`.
- Stores `jobRole`, `experienceLevel`, `mode`, `difficulty`, `topicsToFocus`, `description`.
- Holds `questions` as `ObjectId[]` references to `Question`.
- Tracks lifecycle with `status`, `startedAt`, `endedAt`, `lastActivityAt`.
- Tracks progress with `currentQuestionIndex`, `completedQuestions`, `score`, `totalQuestions`.
- Stores source metadata (`manual`, `resume`, `template`) and simple AI metadata.
- Indexes support history listing and filtering by status.

Interview relevance: Shows normalized document relationships. Questions live in a separate collection so adaptive questions can be appended and populated.

### backend/model/Question.js

Purpose: Stores individual questions for a session.

Code breakdown:

- References `session`.
- Stores question text, type, difficulty, ideal answer, user notes, and pin state.
- Indexes `{ session: 1, createdAt: -1 }`.

Interview relevance: Demonstrates parent-child modeling in MongoDB.

Potential issue: Controllers attempt to save `topicTags`, but the schema does not define `topicTags`; with default strict Mongoose behavior, it will not be persisted.

### backend/model/AnswerAttempt.js

Purpose: Stores every submitted answer and AI evaluation.

Code breakdown:

- References user, session, and question.
- Stores raw `userAnswer`.
- Embeds `aiEvaluation`: score, strengths, weaknesses, ideal answer, feedback, follow-up question.
- Stores topic tags, difficulty at attempt, time taken, correctness, attempt number, evaluation status, AI provider, and evaluation timestamp.
- Indexes common query patterns: recent user attempts, attempts by session, attempts by session/question.

Logic: Multiple attempts are preserved as separate documents, enabling attempt history instead of overwriting earlier answers.

Interview relevance: Excellent example of immutable event/history modeling.

### backend/model/SkillProfile.js

Purpose: Stores long-term performance summary per user.

Code breakdown:

- One profile per user via unique `user`.
- `topics[]` embedded subdocuments track average score, question count, strengths, weaknesses, confidence, recommended difficulty, and last practiced time.
- Overall aggregates: `overallScore`, `accuracyRate`, `strongestTopics`, `weakestTopics`, total attempts, response time, improvement rate, recommendations, score history.

Logic: This model supports adaptive learning. The app does not recompute everything from raw attempts each time; it updates running aggregates.

Interview relevance: Discuss tradeoff between precomputed aggregates and query-time aggregation.

### backend/model/resumeProfile.js

Purpose: Stores structured resume analysis associated with a user and generated session.

Code breakdown:

- References user and session.
- Stores file metadata, target role, experience level, summary, skills, strong/weak areas, suggested topics, projects, domains, and raw text snippet.
- Indexes `{ user: 1, createdAt: -1 }`.

Interview relevance: Shows how unstructured uploaded text becomes structured domain data through AI analysis.

## Backend Services

### backend/service/resumeServices.js

Purpose: Handles resume text extraction and AI prompt construction/generation.

Code breakdown:

- `extractResumeText(filePath, mimeType)`: rejects missing path; for PDF reads buffer, uses `PDFParse`, returns text; for `.txt`/`.md` reads UTF-8 text; otherwise throws unsupported type.
- `buildResumeAnalysisMessages(resumeText)`: asks AI to return structured JSON with role, level, summary, skills, strengths, weaknesses, topics, projects, domains.
- `buildResumeQuestionMessages(analysis, numberOfQuestions)`: asks AI to generate resume-specific questions with meaningful `topicTags`.
- `analyzeResumeWithAI`: calls fallback LLM and parses JSON.
- `generateResumeQuestionsWithAI`: calls fallback LLM and parses JSON.

Interview relevance: Demonstrates prompt engineering, parsing unstructured files, and strict schema expectations from AI.

Potential improvements: Trim resume text before prompt, cap prompt length, redact sensitive resume data, and use robust PDF extraction error mapping.

### backend/service/skillProfileServices.js

Purpose: Encapsulates skill profile update and adaptive target selection logic.

Code breakdown:

- `GENERIC_TOPICS` avoids weak-topic suggestions like "technical" or "general".
- `getWeakestTopicForUser(skillProfile)`: first checks `weakestTopics`; if empty, sorts topic performance ascending by average score and returns the lowest non-generic topic.
- `updateSkillProfileFromAttempt(...)`: creates a profile if missing, updates or inserts a topic, recalculates averages and confidence/difficulty, updates overall aggregates, strongest/weakest topics, recommendations, and last 50 score history.
- `getAdaptiveTarget(skillProfile, session)`: picks weak topic first, then session topic, then `general`; uses topic recommended difficulty if available.

Logic/algorithms:

```text
nextAverage = (previousAverage * previousCount + newScore) / (previousCount + 1)
```

This is O(1), avoiding full historical recomputation.

Interview relevance: Running averages, ranking weak topics, denormalized analytics, and adaptive learning rules are all interview-friendly topics.

Potential issue: `improvementRate` compares current overall score with the first retained score history item. Once history is sliced to 50, "improvement" becomes relative to the oldest retained score, not necessarily the first-ever score.

## Backend Controllers

### backend/controller/authController.js

Purpose: Handles registration, login, and profile retrieval.

Code breakdown:

- `generateToken(id)`: signs `{ id }` for 15 minutes.
- `registerUser`: validates name/email/password, checks duplicate email, creates user, returns user fields plus token.
- `loginUser`: validates credentials, loads password using `.select("+password")`, compares bcrypt password, blocks disabled users, returns token.
- `getUserProfile`: returns current user loaded from `req.user`.

Interview relevance: Explain difference between authentication and authorization, and why hashing happens in the model instead of controller.

Potential improvements: Remove provider-key debug logs, implement refresh tokens, return consistent `{ success, data }` shape.

### backend/controller/sessionController.js

Purpose: Creates, reads, lists, deletes, and completes interview sessions.

Code breakdown:

- `isOwner`: compares resource user ID to logged-in user ID.
- `createSession`: starts MongoDB transaction, validates role/experience/questions, creates session, inserts question documents, pushes question IDs into session, commits transaction, or aborts on error.
- `getSessionById`: fetches session by `_id` and `user`, populates questions sorted by pinned first then creation time, fetches attempts and populates question metadata, returns merged session object plus attempts.
- `getMySession`: paginated recent sessions for the current user.
- `deleteSession`: verifies ownership, deletes related questions and attempts, then deletes the session.
- `endSession`: marks active session completed, counts distinct completed questions from answer attempts, sets end timestamps, and saves.

Logic/algorithms: Transaction ensures session and question creation are atomic.

Interview relevance: Good example for discussing ownership checks, transactions, pagination, and cleanup of related documents.

Potential improvements: `deleteSession` does not delete related `ResumeProfile`; `getMySession` does not return total count/pages.

### backend/controller/questionController.js

Purpose: Manages question-level actions: pinning, notes, and adding questions.

Code breakdown:

- `togglePinQuestion`: loads question, populates session, checks ownership, flips `pinned`, saves.
- `updateQuestionNote`: validates `note` is a string, checks ownership, updates `userNotes`.
- `addQuestionToSession`: validates session/questions, checks ownership, blocks completed sessions, inserts valid questions, pushes IDs to session, updates total count.

Interview relevance: Shows nested resource authorization: user does not own question directly, but owns the session that owns the question.

Potential issue: `addQuestionToSession` writes `answer`, but schema field is `idealAnswer`, so answer text may be dropped.

### backend/controller/aiController.js

Purpose: Generates AI questions and explanations.

Code breakdown:

- `generateQuestions`: validates role/experience, builds prompt, calls fallback AI providers, parses JSON, ensures response is an array, returns provider and questions.
- `generateExplanation`: validates question text, builds prompt, calls fallback AI providers, parses JSON, ensures response is object, returns explanation.

Interview relevance: Validates external AI output before trusting it. Good for discussing defensive programming around LLMs.

Potential improvements: Use the caching/retry wrapper in `aiReliability.js`; validate each question object shape.

### backend/controller/aiEvaluationContoller.js

Purpose: Core answer evaluation workflow.

Code breakdown:

- `buildEvaluationMessages`: constructs strict JSON prompt asking for score, strengths, weaknesses, ideal answer, feedback, follow-up, topic tags, correctness.
- `safeJsonParse`: parses raw JSON or strips code fences and parses again.
- `normalizeScore`: converts score to number and clamps to 0-100.
- `getTopicFromQuestion`: currently prefers `question.type`, then first session topic, then `general`.
- `evaluateAnswer`: validates input IDs and answer, ensures session belongs to user and is not completed, ensures question belongs to session, sends evaluation prompt to AI, parses output, creates `AnswerAttempt`, backfills ideal answer, updates skill profile via service, updates session score/activity, computes adaptive hint, returns evaluation.

Logic/algorithms:

- Attempts are append-only.
- Attempt number is `countDocuments(...) + 1`.
- Skill profile update uses running averages.
- Difficulty hint: score >= 80 hard, score >= 50 medium, else easy.

Interview relevance: This is the most important backend workflow. Explain validation, authorization, external API call, persistence, aggregate update, and response shaping.

Potential issues:

- File name has typo: `aiEvaluationContoller.js`.
- A duplicate local `updateSkillProfile` function exists but is never used.
- `safeJsonParse` is less robust than `parseModelJson`; prose before JSON can fail.
- `getTopicFromQuestion` returns question type such as `technical` instead of a topic unless AI topic tags are later parsed.

### backend/controller/adaptiveController.js

Purpose: Generates the next adaptive question based on previous performance.

Code breakdown:

- `buildNextQuestionMessages`: prompts AI to generate exactly one question for a role, experience level, topic, difficulty, and previous score.
- `decideNextDifficulty`: high score -> hard, medium score -> current or medium, low score -> easy.
- `pickWeakTopic`: picks first weak topic, then first session topic, then `general`.
- `getNextAdaptiveQuestion`: validates `sessionId`, loads user-owned active session, loads skill profile and latest attempt, computes previous score/topic/difficulty, calls AI, parses JSON, validates question text/type/difficulty, creates question, appends it to session, increments total questions, returns question and adaptive reason.

Interview relevance: Demonstrates a simple recommender/adaptive-learning algorithm.

Potential issue: `topicTags` are passed to `Question.create`, but the Question schema does not define them.

### backend/controller/resumeController.js

Purpose: Handles resume upload, analysis, question generation, session creation, profile storage, and resume profile retrieval.

Code breakdown:

- `createResumeBasedSession`: validates file, clamps question count to 1-10, extracts resume text, rejects unreadable short text, analyzes resume with AI, creates resume-based session, generates questions, inserts them, updates session, creates resume profile, returns session/analysis/questions, and deletes uploaded file in `finally`.
- `getResumeProfiles`: returns current user's resume profiles with session summary populated.
- `getResumeProfileBySession`: validates session ID, finds profile for current user and session, populates session.

Interview relevance: Shows file upload plus AI processing plus persistence. The `finally` cleanup is important: temporary upload is removed even on failure.

Potential issue: It creates the session before question generation; if question generation fails, session may remain without questions because no transaction wraps the whole flow.

### backend/controller/analyticsController.js

Purpose: Builds dashboard and analytics summaries.

Code breakdown:

- `getDashboardAnalytics`: uses `Promise.all` to fetch total sessions, completed sessions, attempts, average score via aggregation, average time via aggregation, recent attempts, and skill profile. It filters generic topics, formats overview, skill insights, topic performance, score trend, recommendations, and recent activity.
- `getWeakTopicAnalytics`: returns non-generic topics with average score below 50.
- `getPerformanceTrend`: returns chronological attempt scores.

Logic/algorithms: Uses MongoDB aggregation for averages and parallel queries for speed.

Interview relevance: Good place to discuss query optimization and when to aggregate from raw data versus stored summary documents.

Potential improvements: Add date filters, pagination for recent activity, and handle empty aggregation more explicitly.

## Backend Routes

### backend/routes/authRoute.js

Purpose: Maps authentication endpoints.

Routes:

- `POST /auth/register` -> `registerUser`
- `POST /auth/login` -> `loginUser`
- `GET /auth/profile` -> `protect`, `getUserProfile`
- `POST /auth/upload-image` -> `protect`, `uploadImage.single("image")`, inline response handler

Interview relevance: Demonstrates route-level middleware composition.

### backend/routes/sessionRoute.js

Purpose: Maps session lifecycle endpoints.

Routes:

- `POST /sessions` -> create session
- `GET /sessions/my-session` -> list current user's sessions
- `PATCH /sessions/:id/end` -> complete session
- `GET /sessions/:id` -> get details
- `DELETE /sessions/:id` -> delete session

### backend/routes/questionRoute.js

Purpose: Maps question management endpoints.

Routes:

- `PATCH /questions/:id/pin`
- `PATCH /questions/:id/note`
- `POST /questions/add`

### backend/routes/aiRoute.js

Purpose: Maps AI generation endpoints.

Routes:

- `POST /ai/questions/generate`
- `POST /ai/explanations/generate`

### backend/routes/answerRoute.js

Purpose: Maps answer evaluation endpoint.

Route:

- `POST /answers/evaluate`

### backend/routes/adaptiveRoute.js

Purpose: Maps adaptive question endpoint.

Route:

- `GET /adaptive/next?sessionId=...`

### backend/routes/resumeRoute.js

Purpose: Maps resume upload and profile endpoints.

Routes:

- `POST /resume/session` -> protected multipart resume upload, create session
- `GET /resume` -> list resume profiles
- `GET /resume/:sessionId` -> profile for session

### backend/routes/analyticsRoute.js

Purpose: Maps analytics endpoints.

Routes:

- `GET /analytics/dashboard`
- `GET /analytics/weak-topics`
- `GET /analytics/performance-trend`

## Frontend Entry, Routing, Store, API

### frontend/ai_interview_prep/src/main.jsx

Purpose: React app entry point.

Code breakdown:

- Creates React root at `#root`.
- Wraps app in `React.StrictMode`.
- Adds Redux `Provider`.
- Adds `BrowserRouter`.
- Renders `App`.
- Adds global toast container at top-right.
- Imports global CSS.

Interview relevance: Shows root provider setup and dependency injection for Redux/router.

### frontend/ai_interview_prep/src/App.jsx

Purpose: Minimal app shell.

Code breakdown: Applies full-screen dark background and renders `AppRoutes`.

Interview relevance: Keeps route configuration separate from visual shell.

### frontend/ai_interview_prep/src/routes/AppRoutes.jsx

Purpose: Defines client-side routes.

Code breakdown:

- Imports public pages, protected layout, protected route, and app pages.
- `withProtectedLayout(page)` wraps a page in `ProtectedRoute` and `ProtectedLayout`.
- Defines public `/login` and `/register`.
- Defines protected dashboard, interview, resume, and analytics routes.
- Redirects `/` to `/dashboard`.
- Uses `NotFoundPage` for `*`.

Interview relevance: Explain client-side protected routes and nested layout composition.

### frontend/ai_interview_prep/src/routes/ProtectedRoute.jsx

Purpose: Guards protected frontend pages.

Code breakdown:

- Reads `userInfo` from Redux.
- If absent, redirects to `/login` and preserves current location in state.
- Otherwise renders children.

Interview relevance: Important distinction: this improves UX but does not secure data by itself. Backend `protect` does real security.

### frontend/ai_interview_prep/src/store/index.js

Purpose: Creates Redux store.

Code breakdown: `configureStore` registers one slice: `auth`.

### frontend/ai_interview_prep/src/store/hooks.js

Purpose: Exports project-specific Redux hooks.

Code breakdown: Aliases `useDispatch` and `useSelector`.

Potential improvement: In TypeScript these would be typed hooks; in JavaScript this is mostly convenience.

### frontend/ai_interview_prep/src/services/apiClient.js

Purpose: Central Axios client for backend communication.

Code breakdown:

- Uses `VITE_API_BASE_URL` or deployed Render URL as base.
- Sets `withCredentials: true` and JSON content type.
- Request interceptor reads `token` from localStorage and sets `Authorization: Bearer <token>`.
- Response interceptor extracts a friendly error message.
- On `401`, clears auth localStorage and redirects to `/login` unless already on login/register.
- Adds `error.customMessage` for consumers.

Interview relevance: Centralized API client prevents repeated auth/error logic in every component.

Potential improvement: Avoid hardcoded production backend as fallback for local dev; use explicit env config.

## Frontend Auth

### frontend/ai_interview_prep/src/features/auth/authSlice.js

Purpose: Stores authentication state and syncs it to localStorage.

Code breakdown:

- `getStoredUser` safely parses `userInfo`; on invalid JSON clears stored auth.
- Initial state reads stored user and token.
- `authStart`: loading true, clear error.
- `authSuccess`: stores user and token in Redux and localStorage.
- `authFailure`: stores error and stops loading.
- `logout`: clears Redux and localStorage.
- `clearAuthError`: resets error.

Interview relevance: Demonstrates persistent auth hydration and reducer side effects. Redux Toolkit uses Immer so direct-looking state mutation is safe inside reducers.

### frontend/ai_interview_prep/src/features/auth/authApi.js

Purpose: Thin API wrapper for auth endpoints.

Code breakdown:

- `registerUserApi`, `loginUserApi`, `getProfileApi`, `uploadProfileImageApi`.
- Upload overrides content type to `multipart/form-data`.

Interview relevance: Separates HTTP details from UI hooks.

### frontend/ai_interview_prep/src/features/auth/authSelectors.js

Purpose: Reusable selectors for auth state.

Code breakdown: Exposes `selectAuth`, `selectUser`, `selectToken`, loading/error selectors, and boolean `selectIsAuthenticated`.

### frontend/ai_interview_prep/src/hooks/useAuth.js

Purpose: Combines auth API calls, Redux dispatches, navigation, and toast notifications.

Code breakdown:

- `login`: dispatch start, call API, dispatch success, toast, navigate dashboard.
- `register`: same pattern.
- `fetchProfile`: refreshes user data using existing token.
- `logout`: dispatches logout, shows toast, navigates login.
- `clearError`: dispatches `clearAuthError`.

Interview relevance: Custom hook encapsulates workflow logic and keeps pages thin.

## Frontend Hooks And Utilities

### frontend/ai_interview_prep/src/hooks/useSpeechRecognition.js

Purpose: Wraps browser speech recognition for voice answers.

Code breakdown:

- Detects `window.SpeechRecognition || window.webkitSpeechRecognition`.
- Stores recognition instance in a ref so it persists without re-rendering.
- Configures continuous interim recognition in English.
- `onresult` concatenates transcript fragments.
- `onerror` maps browser error codes to user-friendly messages.
- `onend` clears listening state.
- Second effect updates duration every 500 ms while listening.
- Exposes start, stop, clear, toggle, transcript, support state, error, and duration.

Interview relevance: Good React hooks example: refs for imperative APIs, cleanup in effects, memoized callbacks.

### frontend/ai_interview_prep/src/hooks/useSpeechSynthesis.js

Purpose: Wraps browser text-to-speech for reading questions aloud.

Code breakdown:

- Checks `speechSynthesis` support.
- On unmount, cancels any active speech.
- `speak(text)` validates support/text, cancels current speech, creates `SpeechSynthesisUtterance`, sets language/rate/pitch, updates speaking state on start/end/error.
- `stop` cancels speech.
- `toggle` speaks or stops based on current state.

Interview relevance: Demonstrates browser API integration and cleanup to avoid stale audio.

### frontend/ai_interview_prep/src/utils/reportPdf.js

Purpose: Generates a downloadable PDF interview report using `jsPDF`.

Code breakdown:

- Defines page margins and text layout constants.
- `formatDate` formats dates safely.
- `addWrappedText` splits long text to page width and adds new pages when needed.
- `addSectionTitle` creates consistent section headings and page-break checks.
- `getAttemptForQuestion` returns the latest attempt matching a question ID.
- `downloadSessionReport` lazy-loads `jspdf`, builds summary, topics, per-question review, feedback, ideal answers, and next-practice suggestions, then saves a file named from job role.

Logic/algorithms: Manual pagination based on current `y` coordinate.

Interview relevance: Useful for explaining lazy imports, client-side document generation, and data transformation.

### frontend/ai_interview_prep/src/utils/styles.js

Purpose: Small class-name join helper.

Code breakdown: `cn(...classes)` filters falsey values and joins remaining classes with spaces.

Interview relevance: Common pattern for conditional Tailwind classes.

## Frontend UI And Layout Components

### frontend/ai_interview_prep/src/components/ui/Button.jsx

Purpose: Reusable styled button.

Code breakdown:

- Defines `variants` for primary, secondary, danger, ghost.
- Defines `sizes` for small/medium/large.
- Accepts `children`, `className`, `variant`, `size`, `type`, and other props.
- Uses `cn` to compose base classes with variant/size/custom classes.

Interview relevance: Component API design and reusable styling.

### frontend/ai_interview_prep/src/components/ui/Card.jsx

Purpose: Reusable card wrapper.

Code breakdown: Supports `as` prop to render as `div`, `section`, `Link`, etc. Adds shared border/background/rounded styling.

Interview relevance: Polymorphic component pattern.

### frontend/ai_interview_prep/src/components/ui/Input.jsx

Purpose: Reusable labeled input.

Code breakdown: Optional label uses `htmlFor={props.id}` and input spreads props.

Potential improvement: Many usages pass no `id`, so labels may not be associated with inputs.

### frontend/ai_interview_prep/src/components/ui/Loader.jsx

Purpose: Small centered loading indicator.

Code breakdown: CSS spinner plus label.

### frontend/ai_interview_prep/src/components/layout/ProtectedLayout.jsx

Purpose: Shared layout for authenticated pages.

Code breakdown:

- Defines nav items.
- Reads `userInfo` and `logout` from `useAuth`.
- Renders sticky header, brand link, nav links, mobile and desktop logout buttons, user name/email, and page content.
- Uses `NavLink` active styling.

Interview relevance: Layout composition and protected app shell.

## Frontend Pages

### frontend/ai_interview_prep/src/pages/auth/LoginPage.jsx

Purpose: Login screen.

Code breakdown:

- Local `formData` stores email/password.
- `handleChange` updates field by name.
- `handleSubmit` prevents default and calls `login`.
- Renders form using `Input`, `Button`, and `Card`.

Interview relevance: Controlled form inputs and custom auth hook usage.

### frontend/ai_interview_prep/src/pages/auth/RegisterPage.jsx

Purpose: Registration screen.

Code breakdown: Same form pattern as login, but collects name, email, password, optional profile picture URL, and calls `register`.

### frontend/ai_interview_prep/src/pages/dashboard/DashboardPage.jsx

Purpose: Authenticated landing/dashboard page.

Code breakdown:

- Reads current user from Redux.
- Fetches `/analytics/dashboard` on mount.
- Stores analytics, loading, and error.
- Uses `useMemo` to derive stat cards from analytics.
- Renders welcome card, stats, error card, quick actions, current weak topics, and recent activity.

Interview relevance: Shows data fetching with `useEffect`, derived UI state with `useMemo`, and graceful empty states.

### frontend/ai_interview_prep/src/pages/interview/SessionHistoryPage.jsx

Purpose: Lists sessions and creates new manual AI sessions.

Code breakdown:

- Fetches `/sessions/my-session` on mount.
- Maintains session list, create form, creating/deleting/downloading flags.
- `handleCreateSession`: validates role, splits comma-separated topics, first calls `/ai/questions/generate`, then calls `/sessions` with generated questions, then navigates to new session.
- `handleDownloadReport`: fetches full session details and calls `downloadSessionReport`.
- `handleDeleteSession`: confirms and deletes session, then removes it from local state.
- Renders create form and history list with Continue, Details, Download Report, Delete actions.

Logic: Session creation is intentionally two-step: AI generation first, DB session creation second.

Interview relevance: Explain orchestration of dependent async calls and optimistic local state update after delete.

### frontend/ai_interview_prep/src/pages/interview/SessionPage.jsx

Purpose: Main live interview page.

Code breakdown:

- Reads `sessionId` from URL.
- Fetches session details on mount.
- Stores session, current question, current index, answer, feedback, timer, loading/submitting/generating/ending flags.
- Timer effect increments `elapsedSeconds` every second while session is active.
- `formattedTime` is memoized.
- `refreshSession` refetches session after mutations.
- `handleSubmitAnswer`: validates answer/current question, posts `/answers/evaluate`, displays evaluation feedback, refreshes session.
- `handleGenerateNextQuestion`: calls `/adaptive/next`, sets new current question, clears answer/feedback/timer, refreshes session.
- `handleSelectQuestion`: switches question and clears answer/feedback/timer.
- `handleEndSession`: confirms, patches `/sessions/:id/end`, navigates to detail page.
- Renders `SessionHeader`, `AnswerBox`, `FeedbackPanel`, `QuestionList`, and `SessionInfo`.

Logic/state machine:

```text
loading -> ready
ready -> submitting -> ready with feedback
ready -> generating adaptive question -> ready
ready -> ending -> details page
```

Interview relevance: This is the key frontend workflow. Explain local state ownership and why child components receive callbacks.

Potential issue: Timer resets on selected question, but submitted `timeTaken` can still reflect time from the current page state rather than stored per-question start time across navigation.

### frontend/ai_interview_prep/src/pages/interview/SessionDetailPage.jsx

Purpose: Read-only session review and report preview/download page.

Code breakdown:

- Fetches full session with attempts.
- `getAttemptForQuestion` returns latest attempt for each question.
- Computes average attempt score and flattened weaknesses.
- Shows session stats, PDF preview summary, topics, detailed question review, strengths/weaknesses, pin state, and timeline.
- `handleDownloadReport` calls PDF utility with loaded session.

Interview relevance: Demonstrates joining related data on the frontend and presenting latest attempt from append-only history.

### frontend/ai_interview_prep/src/pages/resume/ResumeUploadPage.jsx

Purpose: Uploads a resume and starts a resume-based interview session.

Code breakdown:

- Stores selected file and number of questions.
- Validates file exists.
- Builds `FormData` with `resume` and `numberOfQuestions`.
- Posts multipart request to `/resume/session`.
- Navigates to generated session.

Interview relevance: File upload flow with `FormData`, multipart headers, and backend-generated navigation target.

### frontend/ai_interview_prep/src/pages/resume/ResumeProfilePage.jsx

Purpose: Displays AI-generated resume analysis for a session.

Code breakdown:

- Reads `sessionId` from URL.
- Fetches `/resume/:sessionId`.
- Renders target role, experience, summary, skills, suggested topics, strong/weak areas, projects, file metadata, upload date, and session link.

Interview relevance: Shows read-only detail view backed by structured AI extraction.

### frontend/ai_interview_prep/src/pages/analytics/AnalyticsPage.jsx

Purpose: Displays full performance analytics.

Code breakdown:

- Fetches `/analytics/dashboard`.
- Uses `useMemo` for overview cards.
- Renders overview, skill insights, recommendations, topic performance, strongest/weakest topics, recent activity, and score trend.

Interview relevance: Good example of dashboard rendering from aggregated API data.

### frontend/ai_interview_prep/src/pages/NotFoundPage.jsx

Purpose: Custom 404 page.

Code breakdown: Renders dashboard/history/resume/analytics navigation suggestions.

Interview relevance: Shows UX polish and fallback routing.

## Frontend Interview Components

### frontend/ai_interview_prep/src/components/interview/AnswerBox.jsx

Purpose: Displays current question, answer textarea, voice controls, submit button, and adaptive question button.

Code breakdown:

- Uses `useSpeechRecognition` for voice transcript.
- Uses `useSpeechSynthesis` for reading question aloud.
- `handleUseVoiceDraft` appends transcript to existing answer.
- `handleSubmit` stops listening/audio before submitting.
- `handleGenerateNextQuestion` stops voice/audio, clears transcript, then asks parent to generate.
- Effect clears voice/audio whenever current question changes.

Interview relevance: Shows component composition and lifecycle cleanup for browser APIs.

### frontend/ai_interview_prep/src/components/interview/VoiceModePanel.jsx

Purpose: UI for recording voice draft.

Code breakdown: Shows support/listening status, toggle button, error message, transcript draft, Use Draft and Clear Draft buttons.

### frontend/ai_interview_prep/src/components/interview/FeedbackPanel.jsx

Purpose: Displays AI evaluation after answer submission.

Code breakdown:

- Returns `null` when no feedback exists.
- Uses small internal components `ListSection` and `TextSection`.
- Shows score, strengths, weaknesses, feedback, ideal answer, and follow-up question.

Interview relevance: Conditional rendering and decomposition into local presentational helpers.

### frontend/ai_interview_prep/src/components/interview/QuestionList.jsx

Purpose: Sidebar list of session questions.

Code breakdown: Maps questions to buttons, highlights active question with conditional classes, calls parent callback on selection.

### frontend/ai_interview_prep/src/components/interview/SessionHeader.jsx

Purpose: Header card for live session.

Code breakdown: Shows role, experience, difficulty, timer, progress, details link, and end-session button.

### frontend/ai_interview_prep/src/components/interview/SessionInfo.jsx

Purpose: Sidebar summary of status, question count, and score.

## Frontend Styling And Config

### frontend/ai_interview_prep/src/styles/globals.css

Purpose: Global CSS and Tailwind import.

Code breakdown:

- Imports Tailwind.
- Defines root font family, dark color scheme, rendering settings.
- Applies border-box globally.
- Sets body min width, min height, margin reset, dark background.
- Makes form controls inherit font.

### frontend/ai_interview_prep/vite.config.js

Purpose: Vite build/dev config.

Code breakdown: Uses React plugin and Tailwind Vite plugin.

### frontend/ai_interview_prep/eslint.config.js

Purpose: ESLint flat config.

Code breakdown:

- Ignores `dist`.
- Applies recommended JS config, React Hooks rules, and React Refresh Vite config.
- Defines browser globals and JSX parser options.

### frontend/ai_interview_prep/netlify.toml

Purpose: Netlify deployment config.

Code breakdown:

- Build command: `npm run build`.
- Publish directory: `dist`.
- Redirects all routes to `/index.html` so React Router works on refresh.

### frontend/ai_interview_prep/index.html

Purpose: HTML shell for Vite.

Code breakdown: Defines root div and loads `/src/main.jsx` as module.

## Scripts And Generated Docs

### scripts/generate-codebase-docx.cjs

Purpose: Generates a formatted Word document codebase reference.

Code breakdown:

- Uses `docx` package.
- Defines helpers for headings, paragraphs, code blocks, tables, page breaks, borders, colors, and document styles.
- Builds multiple sections: architecture, data models, backend algorithms, frontend architecture, HTTP/Q&A, scenario traces.
- Writes output to `docs/AI_Interview_Prep_Codebase_Reference.docx`.

Interview relevance: Shows programmatic document generation and reusable helper abstractions.

Potential improvements: The generated content is hardcoded. A future version could read source metadata automatically.

### scripts/package.json

Purpose: Node package config for documentation generator.

Code breakdown: Defines `generate-docx` script and `docx` dependency.

### backend/package.json

Purpose: Backend package metadata and dependency manifest.

Code breakdown:

- `"type": "module"` enables ES module imports.
- Scripts: `start` runs server, `dev` uses nodemon.
- Dependencies include Express, Mongoose, JWT, bcrypt, Multer, pdf-parse, AI SDKs, security/performance middleware.

### frontend/ai_interview_prep/package.json

Purpose: Frontend package metadata and dependency manifest.

Code breakdown:

- Scripts: dev/build/lint/preview.
- Dependencies: React, React Router, Redux Toolkit, Axios, toast, jsPDF.
- Dev dependencies: Vite, Tailwind, ESLint plugins.

## End-To-End Feature Flows

### Manual Interview Session

```text
SessionHistoryPage form
  -> POST /ai/questions/generate
  -> POST /sessions
  -> sessionController creates Session + Questions in transaction
  -> navigate /interview/session/:sessionId
```

### Answer Evaluation

```text
SessionPage submit
  -> POST /answers/evaluate
  -> validate ownership and active session
  -> LLM evaluates answer
  -> AnswerAttempt.create
  -> updateSkillProfileFromAttempt
  -> update Session.score and lastActivityAt
  -> return feedback + adaptive hint
```

### Adaptive Question

```text
SessionPage "Next Adaptive Question"
  -> GET /adaptive/next?sessionId=...
  -> load latest attempt and skill profile
  -> pick weak topic + difficulty
  -> LLM generates one question
  -> Question.create
  -> append question ID to Session
```

### Resume-Based Session

```text
ResumeUploadPage
  -> multipart POST /resume/session
  -> Multer saves file
  -> extract text from PDF/TXT/MD
  -> AI analyzes resume
  -> create Session
  -> AI generates questions
  -> insert Question docs
  -> create ResumeProfile
  -> delete temporary uploaded resume
```

### Analytics

```text
DashboardPage / AnalyticsPage
  -> GET /analytics/dashboard
  -> parallel Mongo queries + aggregations
  -> return overview, skill insights, topic performance, recent activity
```

## Edge Cases And Improvements To Mention In Interviews

- Token expires after 15 minutes and there is no implemented refresh-token flow.
- `authMiddleware` checks cookies, but `cookie-parser` is not configured.
- AI output parsing is robust in `llmRouter.parseModelJson`, but answer evaluation uses a weaker `safeJsonParse`.
- `Question` schema lacks `topicTags`, though controllers try to save it.
- Resume-based session creation is not wrapped in a transaction; session can survive if question generation fails.
- `deleteSession` deletes questions and attempts, but not resume profiles.
- Several responses have inconsistent shapes, so frontend uses defensive `data?.data || data?.session || data`.
- `timeTaken` is driven by frontend timer state and may not be perfectly accurate across selected questions.
- In-memory AI circuit breaker/cache does not work across multiple backend instances.
- File uploads use local disk, which is fragile for cloud deployments; S3 or similar storage would be better.
- Package contains generated/binary/upload files that should be managed carefully in production repos.

## Interview Talking Points

- Authentication: JWT, bcrypt, protected routes, role authorization.
- Backend architecture: routes -> middleware -> controllers -> services -> models.
- Data modeling: normalized sessions/questions/attempts plus denormalized skill aggregates.
- Algorithms: running average, weak-topic selection, adaptive difficulty thresholds.
- Reliability: AI provider fallback, timeout, circuit breaker, rate limiting.
- Security: CORS allowlist, Helmet, body size limits, ownership checks, upload validation.
- Frontend: protected routing, Redux auth persistence, Axios interceptors, controlled forms, custom hooks.
- UX features: voice input/output, PDF export, analytics dashboard, session history.
- Scalability upgrades: Redis, queues, React Query, object storage, refresh tokens, schema validation.
