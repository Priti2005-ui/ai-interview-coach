const page = {
  marginX: 16,
  marginTop: 18,
  lineHeight: 7,
  bottom: 282,
};

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
};

const addWrappedText = (doc, text, x, y, maxWidth, lineHeight = page.lineHeight) => {
  const lines = doc.splitTextToSize(String(text || "N/A"), maxWidth);
  lines.forEach((line) => {
    if (y > page.bottom) {
      doc.addPage();
      y = page.marginTop;
    }

    doc.text(line, x, y);
    y += lineHeight;
  });

  return y;
};

const addSectionTitle = (doc, title, y) => {
  if (y > page.bottom - 8) {
    doc.addPage();
    y = page.marginTop;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, page.marginX, y);
  doc.setDrawColor(79, 70, 229);
  doc.line(page.marginX, y + 2, 194, y + 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  return y + 10;
};

const getAttemptForQuestion = (attempts, questionId) => {
  const matches = attempts.filter((attempt) => {
    const attemptQuestionId =
      typeof attempt.question === "string"
        ? attempt.question
        : attempt.question?._id;

    return String(attemptQuestionId) === String(questionId);
  });

  return matches[matches.length - 1];
};

export const downloadSessionReport = async (session) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const questions = session?.questions || [];
  const attempts = session?.attempts || [];
  const averageAttemptScore =
    attempts.length > 0
      ? attempts.reduce(
          (sum, attempt) => sum + (attempt.aiEvaluation?.score || 0),
          0
        ) / attempts.length
      : 0;

  let y = page.marginTop;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Mock Interview Report", page.marginX, y);

  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = addWrappedText(
    doc,
    `${session?.jobRole || "Interview Session"} - ${session?.experienceLevel || "N/A"} - ${session?.difficulty || "N/A"}`,
    page.marginX,
    y,
    178
  );

  y += 3;
  y = addSectionTitle(doc, "Summary", y);

  const summaryRows = [
    ["Status", session?.status || "N/A"],
    ["Session Score", Math.round(session?.score || 0)],
    ["Average Attempt Score", Math.round(averageAttemptScore)],
    ["Questions", questions.length],
    ["Answered", attempts.length],
    ["Started At", formatDate(session?.startedAt)],
    ["Last Activity", formatDate(session?.lastActivityAt)],
  ];

  summaryRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, page.marginX, y);
    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, value, 58, y, 136);
  });

  y += 3;
  y = addSectionTitle(doc, "Topics To Focus", y);
  y = addWrappedText(
    doc,
    (session?.topicsToFocus || []).join(", ") || "No topics selected.",
    page.marginX,
    y,
    178
  );

  y += 3;
  y = addSectionTitle(doc, "Question Review", y);

  questions.forEach((question, index) => {
    const attempt = getAttemptForQuestion(attempts, question._id);
    const evaluation = attempt?.aiEvaluation || {};

    if (y > page.bottom - 35) {
      doc.addPage();
      y = page.marginTop;
    }

    doc.setFont("helvetica", "bold");
    doc.text(`Question ${index + 1}`, page.marginX, y);
    y += page.lineHeight;

    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, question.question, page.marginX, y, 178);

    y += 1;
    doc.setFont("helvetica", "bold");
    doc.text("Your Answer:", page.marginX, y);
    y += page.lineHeight;
    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, attempt?.userAnswer || "Not answered yet.", page.marginX, y, 178);

    doc.setFont("helvetica", "bold");
    doc.text(`Score: ${evaluation.score ?? "N/A"}`, page.marginX, y);
    y += page.lineHeight;

    doc.text("Feedback:", page.marginX, y);
    y += page.lineHeight;
    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, evaluation.feedback || "No feedback recorded.", page.marginX, y, 178);

    doc.setFont("helvetica", "bold");
    doc.text("Ideal Answer:", page.marginX, y);
    y += page.lineHeight;
    doc.setFont("helvetica", "normal");
    y = addWrappedText(
      doc,
      evaluation.idealAnswer || question.idealAnswer || question.answer || "N/A",
      page.marginX,
      y,
      178
    );

    y += 5;
  });

  y = addSectionTitle(doc, "Next Practice Suggestions", y);

  const weakAreas = attempts
    .flatMap((attempt) => attempt.aiEvaluation?.weaknesses || [])
    .filter(Boolean);

  if (weakAreas.length > 0) {
    weakAreas.slice(0, 6).forEach((weakness, index) => {
      y = addWrappedText(doc, `${index + 1}. ${weakness}`, page.marginX, y, 178);
    });
  } else {
    y = addWrappedText(
      doc,
      "Complete more answers to unlock weakness-based practice suggestions.",
      page.marginX,
      y,
      178
    );
  }

  const safeRole = String(session?.jobRole || "interview")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  doc.save(`${safeRole || "interview"}-report.pdf`);
};
