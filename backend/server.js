import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

import connectDB from './config/db.js';

import authRoute from "./routes/authRoute.js";
import sessionRoute from './routes/sessionRoute.js';
import questionRoute from './routes/questionRoute.js';
import aiRoute from './routes/aiRoute.js';
import answerRoute from "./routes/answerRoute.js";
import adaptiveRoute from "./routes/adaptiveRoute.js";
import resumeRoute from "./routes/resumeRoute.js";
import analyticsRoute from "./routes/analyticsRoute.js";


import errorHandler from './middleware/errorMiddleware.js';



if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error(" Missing required environment variables");
  process.exit(1);
}

const app = express();

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

const envOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const allowedOrigins = [
  ...envOrigins,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(compression());

app.use(morgan('dev'));
app.set("trust proxy", 1);


app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many AI requests, try later",
});

app.use('/api/v1/ai', aiLimiter);


app.use("/api/v1/auth", authRoute);
app.use("/api/v1/sessions", sessionRoute);
app.use("/api/v1/questions", questionRoute);
app.use("/api/v1/ai", aiRoute);
app.use("/api/v1/answers", answerRoute);
app.use("/api/v1/adaptive", adaptiveRoute);
app.use("/api/v1/resume", resumeRoute);
app.use("/api/v1/analytics", analyticsRoute);
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


app.use(errorHandler);


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ DB connection failed:", error);
    process.exit(1);
  }
};

startServer();

