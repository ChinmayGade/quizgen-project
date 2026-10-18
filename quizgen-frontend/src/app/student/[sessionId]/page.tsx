"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { getQuiz, submitQuiz } from "@/lib/api";

interface QuizQuestion {
    id: number;
    questionText: string;
    type: string;
    questionOrder: number;
    options: string | null;
}

interface QuizData {
    sessionId: string;
    title: string;
    difficulty: string;
    questionType: string;
    totalQuestions: number;
    questions: QuizQuestion[];
}

export default function QuizAttemptPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState("");
    const [started, setStarted] = useState(false);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadQuiz();
    }, [sessionId]);

    const loadQuiz = async () => {
        try {
            const data = await getQuiz(sessionId);
            setQuiz(data);
        } catch {
            setError("Quiz not found");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!quiz) return;
        setSubmitting(true);
        try {
            const answerList = quiz.questions.map((q) => ({
                questionId: q.id,
                answer: answers[q.id] || "",
            }));
            const result = await submitQuiz(sessionId, {
                studentName: studentName || "Anonymous",
                answers: answerList,
            });
            router.push(`/student/${sessionId}/results/${result.attemptId}`);
        } catch {
            setError("Failed to submit. Please try again.");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div className="max-w-sm mx-auto px-6 py-24 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => router.push("/student")} className="rounded-xl bg-primary hover:bg-[#333333]">
                    Go Back
                </Button>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="max-w-sm mx-auto px-6 py-24">
                <div className="bento-card animate-fade-in-up">
                    <h2 className="text-xl font-semibold mb-1 text-center">{quiz.title}</h2>
                    <div className="text-sm text-muted-foreground text-center mb-8">
                        {quiz.difficulty} · {quiz.questionType} · {quiz.totalQuestions} questions
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Your Name</label>
                            <input
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full rounded-[10px] h-12 px-4 border border-border bg-card text-foreground text-center text-lg focus:outline-none focus:border-foreground transition-colors"
                            />
                        </div>
                        <Button
                            onClick={() => setStarted(true)}
                            disabled={!studentName.trim()}
                            className="w-full h-12 rounded-xl text-[15px] font-medium bg-primary hover:bg-[#333333]"
                        >
                            Start Quiz
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const question = quiz.questions[currentQ];
    const options: string[] = question.options ? JSON.parse(question.options) : [];
    const progress = ((currentQ + 1) / quiz.questions.length) * 100;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="max-w-2xl mx-auto px-6 py-8">
            {/* Progress */}
            <div className="mb-8 animate-fade-in-up">
                <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                    <span>Question {currentQ + 1} of {quiz.questions.length}</span>
                    <span>{answeredCount}/{quiz.questions.length} answered</span>
                </div>
                <Progress value={progress} className="h-1 rounded-full" />
            </div>

            {/* Question */}
            <div className="bento-card mb-8 animate-fade-in-up">
                <div className="text-xs text-muted-foreground mb-4 uppercase tracking-wide">
                    {question.type} · Q{question.questionOrder}
                </div>

                <h3 className="text-lg font-semibold mb-8 leading-relaxed">
                    {question.questionText}
                </h3>

                {question.type === "MCQ" && options.length > 0 ? (
                    <div className="pixel-radio-group">
                        {options.map((opt, i) => (
                            <label
                                key={i}
                                className={`pixel-radio${answers[question.id] === opt ? " selected" : ""}`}
                                onClick={() => setAnswers({ ...answers, [question.id]: opt })}
                            >
                                <input
                                    type="radio"
                                    name={`q-${question.id}`}
                                    checked={answers[question.id] === opt}
                                    onChange={() => setAnswers({ ...answers, [question.id]: opt })}
                                />
                                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                                <span className="option-text">{opt}</span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <Textarea
                        value={answers[question.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                        placeholder="Type your answer here…"
                        className="min-h-[150px] rounded-[10px] text-[15px] bg-card border-border focus:border-foreground"
                    />
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
                <Button
                    variant="outline"
                    onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                    disabled={currentQ === 0}
                    className="rounded-xl border-border"
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                </Button>

                {currentQ < quiz.questions.length - 1 ? (
                    <Button onClick={() => setCurrentQ(currentQ + 1)} className="rounded-xl bg-primary hover:bg-[#333333]">
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="rounded-xl bg-primary hover:bg-[#333333] hover:text-white"
                    >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Submit Quiz
                    </Button>
                )}
            </div>

            {/* Question dots */}
            <div className="mt-8 flex flex-wrap gap-2 justify-center">
                {quiz.questions.map((q, i) => (
                    <button
                        key={q.id}
                        onClick={() => setCurrentQ(i)}
                        className={`w-9 h-9 rounded-[10px] text-xs font-medium transition-all duration-200 ${i === currentQ
                            ? "bg-foreground text-background"
                            : answers[q.id]
                                ? "bg-foreground/10 text-foreground border border-foreground/20"
                                : "bg-secondary text-muted-foreground"
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}
