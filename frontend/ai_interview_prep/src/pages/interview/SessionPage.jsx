// src/pages/interview/SessionPage.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import AnswerBox from "../../components/interview/AnswerBox.jsx";
import FeedbackPanel from "../../components/interview/FeedbackPanel.jsx";
import QuestionList from "../../components/interview/QuestionList.jsx";
import SessionHeader from "../../components/interview/SessionHeader.jsx";
import SessionInfo from "../../components/interview/SessionInfo.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Loader from "../../components/ui/Loader.jsx";
import apiClient from "../../services/apiClient.js";

const SessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }, [elapsedSeconds]);

  // TIMER
  useEffect(() => {
    let timer;

    if (session?.status === "active") {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [session]);

  // FETCH SESSION
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await apiClient.get(
          `/sessions/${sessionId}`
        );

        const sessionData = data?.data || data?.session || data;

        setSession(sessionData);

        if (sessionData?.questions?.length > 0) {
          setCurrentQuestion(sessionData.questions[0]);
          setCurrentQuestionIndex(0);
        }
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.customMessage ||
          "Failed to load session";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  // REFRESH SESSION
  const refreshSession = async () => {
    const { data } = await apiClient.get(
      `/sessions/${sessionId}`
    );

    const sessionData = data?.data || data?.session || data;

    setSession(sessionData);

    return sessionData;
  };

  // SUBMIT ANSWER
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();

    if (!currentQuestion) {
      toast.error("No active question");
      return;
    }

    if (!answer.trim()) {
      toast.error("Please write your answer");
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const payload = {
        sessionId,
        questionId: currentQuestion._id,
        userAnswer: answer.trim(),
        timeTaken: elapsedSeconds,
      };

      const { data } = await apiClient.post(
        "/answers/evaluate",
        payload
      );

      const evaluation =
        data?.data?.evaluation || data?.evaluation;

      setFeedback(evaluation);

      toast.success("Answer evaluated");

      await refreshSession();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.customMessage ||
        "Failed to evaluate answer";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // NEXT ADAPTIVE QUESTION
  const handleGenerateNextQuestion = async () => {
    try {
      setGenerating(true);

      const { data } = await apiClient.get(
        `/adaptive/next?sessionId=${sessionId}`
      );

      const nextQuestion =
        data?.data?.question || data?.question;

      if (!nextQuestion) {
        toast.error("No next question generated");
        return;
      }

      setCurrentQuestion(nextQuestion);
      setCurrentQuestionIndex((prev) => prev + 1);

      setAnswer("");
      setFeedback(null);
      setElapsedSeconds(0);

      toast.success("Adaptive question generated");

      await refreshSession();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.customMessage ||
        "Failed to generate next question";

      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  // CHANGE QUESTION
  const handleSelectQuestion = (question, index) => {
    setCurrentQuestion(question);
    setCurrentQuestionIndex(index);

    setAnswer("");
    setFeedback(null);
    setElapsedSeconds(0);
  };

  const handleEndSession = async () => {
    const shouldEnd = window.confirm(
      "End this interview session? You can still view details and download the report after ending."
    );

    if (!shouldEnd) return;

    try {
      setEnding(true);
      const { data } = await apiClient.patch(`/sessions/${sessionId}/end`);
      const completedSession = data?.data || data?.session || data;

      setSession(completedSession);
      toast.success("Session completed");
      navigate(`/interview/details/${sessionId}`);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.customMessage ||
        "Failed to end session";

      toast.error(message);
    } finally {
      setEnding(false);
    }
  };

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Loader label="Loading session..." />
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-6 text-center">
          <h2 className="text-2xl font-semibold">
            Failed to load session
          </h2>

          <p className="text-slate-400 mt-3">{error}</p>

          <Button
            onClick={() => navigate("/dashboard")}
            className="mt-6"
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6">
        {/* MAIN */}
        <div className="space-y-6">
          <SessionHeader
            session={session}
            formattedTime={formattedTime}
            currentQuestionIndex={currentQuestionIndex}
            detailTo={`/interview/details/${sessionId}`}
            ending={ending}
            onEndSession={handleEndSession}
            totalQuestions={session?.questions?.length || 0}
          />

          <AnswerBox
            answer={answer}
            currentQuestion={currentQuestion}
            generating={generating}
            onAnswerChange={setAnswer}
            onGenerateNextQuestion={handleGenerateNextQuestion}
            onSubmit={handleSubmitAnswer}
            submitting={submitting}
            disabled={session?.status === "completed" || ending}
          />

          <FeedbackPanel feedback={feedback} />
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">
          <QuestionList
            currentQuestionId={currentQuestion?._id}
            questions={session?.questions || []}
            onSelectQuestion={handleSelectQuestion}
          />

          <SessionInfo session={session} />
        </aside>
      </div>
    </div>
  );
};

export default SessionPage;
