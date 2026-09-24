# 🤖 AI Interview Coach

AI Interview Coach is a full-stack web application designed to help candidates practice technical interviews using Generative AI.

The application allows users to create interview sessions, upload resumes, receive personalized interview questions, submit answers, and get AI-generated feedback.

## 🎯 Project Purpose

The main purpose of this project is to provide a personalized and interactive interview practice experience.

Instead of using only predefined questions, the application uses Generative AI to generate questions and feedback based on information such as:

* Candidate's resume
* Skills
* Target role
* Experience level
* Previous interview answers

## ✨ Features

* User Registration and Login
* JWT Authentication
* Resume Upload and Processing
* Resume-based Interview Questions
* AI-generated Interview Questions
* AI-based Answer Evaluation
* Personalized Feedback
* Adaptive Follow-up Questions
* Interview Session Management
* Interview History
* Skill Profile
* Performance Analytics
* PDF Report Generation
* Voice Interview Support

## 🧠 AI Concepts Used

This project demonstrates practical use of Generative AI concepts.

### Generative AI

Generative AI is used to create interview questions, evaluate answers, and generate feedback.

### LLM

The application uses a Large Language Model through the Gemini API to process candidate information and generate natural-language responses.

### Prompt Engineering

Structured prompts are sent from the backend to the AI model with relevant candidate and interview context.

### AI Evaluation

The candidate's answer is sent to the AI model along with the interview question and context. The generated response is processed and displayed as feedback.

### Adaptive Interview

Previous answers and interview context can be used to generate relevant follow-up questions.

## 🛠️ Technology Stack

### Frontend

* React.js
* Vite
* JavaScript
* Redux Toolkit
* Axios
* CSS

### Backend

* Node.js
* Express.js
* REST APIs
* JWT Authentication
* Multer
* PDF Processing

### Database

* MongoDB
* Mongoose

### Generative AI

* Google Gemini API

### Tools

* Git
* GitHub
* VS Code
* Postman
* npm

## 🏗️ Project Structure

```text
ai-interview-coach/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
│
├── frontend/
│   └── ai_interview_prep/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       ├── store/
│       └── App.jsx
│
├── docs/
└── scripts/
```

## 🔄 Application Flow

```text
User
  ↓
React Frontend
  ↓
REST API
  ↓
Node.js + Express
  ↓
Authentication / Business Logic
  ↓
MongoDB
  ↓
Gemini API
  ↓
AI Questions / Evaluation / Feedback
  ↓
React Frontend
```

## 🔐 Authentication Flow

```text
User Registration/Login
        ↓
Backend validates user
        ↓
Password authentication
        ↓
JWT Token generated
        ↓
Token stored by client
        ↓
Protected API Requests
        ↓
Auth Middleware verifies JWT
```

## 📄 Resume Flow

```text
Resume Upload
      ↓
Backend receives PDF
      ↓
PDF Processing
      ↓
Resume Information Extraction
      ↓
Resume Profile
      ↓
AI-based Question Generation
```

## 🎤 Interview Flow

```text
Create Interview Session
        ↓
Select Role & Experience
        ↓
Resume / Skills Context
        ↓
Gemini API
        ↓
Generate Questions
        ↓
User Answers
        ↓
Gemini API
        ↓
Evaluate Answer
        ↓
Feedback
        ↓
Analytics / Session History
```

## 🤖 Gemini API Integration

The backend communicates with the Gemini API through a centralized LLM utility.

The AI service is used for:

* Generating interview questions
* Resume-based question generation
* Answer evaluation
* Feedback generation
* Adaptive follow-up questions

The Gemini API key is stored in environment variables and is not committed to the repository.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
```

## 🗄️ Database Models

The application uses MongoDB with Mongoose.

Main models include:

* `User`
* `Session`
* `Question`
* `AnswerAttempt`
* `SkillProfile`
* `ResumeProfile`

## ▶️ Run the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/Priti2005-ui/ai-interview-coach.git
cd ai-interview-coach
```

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

Backend:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
cd ai_interview_prep
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## ⚙️ Environment Variables

Create a `.env` file inside the `backend` folder.

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/ai-interview-coach

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173

GEMINI_API_KEY=your_gemini_api_key

GEMINI_MODEL=gemini-3.6-flash
```

> Never upload API keys, passwords, or other secrets to GitHub.

## 🧪 Testing

The application was tested locally by running the frontend and backend together and verifying the main application flow, including:

* User authentication
* MongoDB connection
* Resume upload
* Resume processing
* AI question generation
* Interview session creation
* Answer submission
* AI evaluation
* Feedback generation

## 📚 Key Learning Outcomes

Through this project, I gained practical experience with:

* React.js
* Node.js
* Express.js
* MongoDB
* Mongoose
* REST API development
* JWT authentication
* Frontend-backend integration
* Resume/PDF processing
* Gemini API integration
* Generative AI
* LLM concepts
* Prompt-based AI interaction
* AI response processing
* Debugging and dependency management
* End-to-end application testing

## 👩‍💻 Project Contribution

This project was worked on collaboratively.

The project was started from an existing open-source codebase. We worked on understanding, configuring, modifying, integrating, debugging, and testing the application.

My work included the React frontend, Node.js/Express backend setup, MongoDB integration, JWT authentication, Gemini API integration, resume processing, interview session flow, AI-generated questions, answer evaluation, and application testing.

The purpose of using the existing codebase was to understand and gain practical experience with full-stack development and Generative AI integration.

## 📌 Project Status

The application has been configured and tested locally with the main interview workflow and Gemini AI integration.

## 👤 Author

**Priti Raut**

GitHub: [Priti2005-ui](https://github.com/Priti2005-ui)
