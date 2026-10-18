const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export async function generateQuiz(formData: FormData) {
    const res = await fetch(`${API_BASE}/quiz/generate`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to generate quiz" }));
        throw new Error(err.error || "Failed to generate quiz");
    }
    return res.json();
}

export async function getQuiz(sessionId: string) {
    const res = await fetch(`${API_BASE}/quiz/${sessionId}`);
    if (!res.ok) {
        throw new Error("Quiz not found");
    }
    return res.json();
}

export async function submitQuiz(sessionId: string, data: {
    studentName: string;
    answers: { questionId: number; answer: string }[];
}) {
    const res = await fetch(`${API_BASE}/quiz/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error("Failed to submit quiz");
    }
    return res.json();
}

export async function getAnalytics(sessionId: string) {
    const res = await fetch(`${API_BASE}/quiz/${sessionId}/analytics`);
    if (!res.ok) {
        throw new Error("Failed to load analytics");
    }
    return res.json();
}

export async function getStudentResults(sessionId: string, attemptId: number) {
    const res = await fetch(`${API_BASE}/quiz/${sessionId}/results/${attemptId}`);
    if (!res.ok) {
        throw new Error("Failed to load results");
    }
    return res.json();
}

export function getExportUrl(sessionId: string) {
    return `${API_BASE}/quiz/${sessionId}/export`;
}

export async function reviewQuiz(sessionId: string) {
    const res = await fetch(`${API_BASE}/quiz/${sessionId}/review`);
    if (!res.ok) {
        throw new Error("Quiz not found");
    }
    return res.json();
}

export async function updateQuestions(sessionId: string, questions: {
    id: number;
    questionText: string;
    correctAnswer: string;
    options?: string;
}[]) {
    const res = await fetch(`${API_BASE}/quiz/${sessionId}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questions),
    });
    if (!res.ok) {
        throw new Error("Failed to update questions");
    }
    return res.json();
}

export async function publishQuiz(sessionId: string) {
    const res = await fetch(`${API_BASE}/quiz/${sessionId}/publish`, {
        method: "POST",
    });
    if (!res.ok) {
        throw new Error("Failed to publish quiz");
    }
    return res.json();
}
