"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Trophy, Target, TrendingUp } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { getStudentResults } from "@/lib/api";

interface QuestionResult {
    questionId: number; questionOrder: number; questionText: string;
    type: string; correctAnswer: string; options: string | null;
    studentAnswer: string; score: number; isCorrect: boolean;
}

interface PerformanceData { question: string; score: number; classAverage: number; }

interface Results {
    studentName: string; totalScore: number; maxScore: number;
    percentage: number; percentile: number; classAverage: number;
    questions: QuestionResult[]; performanceData: PerformanceData[];
}

export default function StudentResultsPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;
    const attemptId = Number(params.attemptId);

    const [results, setResults] = useState<Results | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => { loadResults(); }, [sessionId, attemptId]);

    const loadResults = async () => {
        try { const data = await getStudentResults(sessionId, attemptId); setResults(data); }
        catch { setError("Failed to load results"); }
        finally { setLoading(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
    );

    if (error || !results) return (
        <div className="max-w-sm mx-auto px-6 py-24 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => router.push("/student")} className="rounded-xl bg-primary hover:bg-[#333333]">Go Back</Button>
        </div>
    );

    const getScoreColor = () => {
        return "hsl(var(--foreground))";
    };

    const scoreColor = getScoreColor();

    const statCards = [
        { label: "Score", value: `${results.percentage}%`, icon: Target, color: "#111111", bg: "bg-foreground/[0.06]" },
        { label: "Percentile", value: `${results.percentile}th`, icon: Trophy, color: "#111111", bg: "bg-foreground/[0.06]" },
        { label: "Class Average", value: `${results.classAverage}%`, icon: TrendingUp, color: "#111111", bg: "bg-foreground/[0.06]" },
    ];

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Bento score hero */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fade-in-up">
                {/* Large score card */}
                <div className="md:col-span-2 bento-card bento-shimmer text-center py-12">
                    <div className="bento-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ background: scoreColor, width: 300, height: 300 }} />
                    <h2 className="text-xl font-semibold mb-1 relative">
                        Results for {results.studentName}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6 relative">
                        {results.totalScore} / {results.maxScore} points
                    </p>
                    <div className="text-7xl font-bold relative" style={{ color: scoreColor }}>
                        {results.percentage}%
                    </div>
                </div>

                {/* Stats column */}
                <div className="flex flex-col gap-4">
                    {statCards.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="bento-card flex-1 flex items-center gap-4 py-5 px-5">
                                <div className="bento-glow top-0 right-0" style={{ background: stat.color }} />
                                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                                    <Icon className="h-4.5 w-4.5" style={{ color: stat.color }} />
                                </div>
                                <div>
                                    <div className="text-lg font-semibold">{stat.value}</div>
                                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Performance Chart */}
            <div className="bento-card mb-6 animate-fade-in-up">
                <div className="bento-glow bg-foreground bottom-0 left-0" />
                <h3 className="text-base font-semibold mb-6">Performance vs. Class Average</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={results.performanceData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="question" fontSize={12} stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                        <YAxis domain={[0, 100]} fontSize={12} stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#1F1F1F", color: "#FFFFFF" }} />
                        <Legend />
                        <Bar dataKey="score" name="Your Score" fill="#FFFFFF" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="classAverage" name="Class Average" fill="#6B7280" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Question Review */}
            <div className="bento-card mb-8 animate-fade-in-up">
                <div className="bento-glow bg-foreground top-0 right-0" />
                <h3 className="text-base font-semibold mb-6">Question Review</h3>
                <div className="space-y-3">
                    {results.questions.map((q) => (
                        <div key={q.questionId} className={`p-5 rounded-2xl border ${q.isCorrect ? "border-foreground/20 bg-foreground/[0.03]" : "border-destructive/20 bg-destructive/[0.03]"}`}>
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                    Q{q.questionOrder} · {q.type}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {q.isCorrect
                                        ? <CheckCircle className="h-4 w-4 text-foreground" />
                                        : <XCircle className="h-4 w-4 text-destructive" />
                                    }
                                    <span className="text-xs font-medium">{Math.round(q.score * 100)}%</span>
                                </div>
                            </div>
                            <p className="font-medium mb-3 leading-relaxed">{q.questionText}</p>
                            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                <div className="p-3 rounded-xl bg-secondary">
                                    <span className="text-muted-foreground">Your answer: </span>
                                    <span className={`font-medium ${q.isCorrect ? "text-foreground" : "text-destructive"}`}>
                                        {q.studentAnswer || "(no answer)"}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-foreground/[0.04]">
                                    <span className="text-muted-foreground">Correct: </span>
                                    <span className="font-medium text-foreground">{q.correctAnswer}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center">
                <Button onClick={() => router.push("/")} className="rounded-xl bg-primary hover:bg-[#333333]">
                    Back to Home
                </Button>
            </div>
        </div>
    );
}
