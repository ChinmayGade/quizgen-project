"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Loader2, Copy, CheckCircle, Users, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { getAnalytics, getExportUrl } from "@/lib/api";

interface Analytics {
    totalStudents: number;
    quizTitle: string;
    sessionId: string;
    totalQuestions: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    scoreDistribution: { range: string; count: number }[];
    questionAccuracy: {
        questionId: number; questionOrder: number; questionText: string;
        type: string; accuracy: number; totalAttempts: number;
    }[];
    studentScores: {
        attemptId: number; studentName: string; totalScore: number;
        maxScore: number; percentage: number; submittedAt: string;
    }[];
}

const BAR_COLORS = ["#FFFFFF", "#D1D5DB", "#9CA3AF", "#6B7280", "#4B5563"];

export default function TeacherDashboard() {
    const params = useParams();
    const sessionId = params.sessionId as string;
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadAnalytics();
        const interval = setInterval(loadAnalytics, 10000);
        return () => clearInterval(interval);
    }, [sessionId]);

    const loadAnalytics = async () => {
        try {
            const data = await getAnalytics(sessionId);
            setAnalytics(data);
            setError("");
        } catch {
            setError("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(sessionId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="max-w-md mx-auto px-6 py-24 text-center">
                <p className="text-destructive">{error || "No data found"}</p>
            </div>
        );
    }

    const stats = [
        { label: "Students", value: analytics.totalStudents, icon: Users, color: "#111111", bg: "bg-foreground/[0.06]" },
        { label: "Average Score", value: `${analytics.averageScore}%`, icon: BarChart3, color: "#111111", bg: "bg-foreground/[0.06]" },
        { label: "Highest", value: `${analytics.highestScore}%`, icon: TrendingUp, color: "#111111", bg: "bg-foreground/[0.06]" },
        { label: "Lowest", value: `${analytics.lowestScore}%`, icon: TrendingDown, color: "#111111", bg: "bg-foreground/[0.06]" },
    ];

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">{analytics.quizTitle}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Session:</span>
                        <span className="font-mono font-semibold text-foreground">{analytics.sessionId}</span>
                        <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-opacity">
                            {copied ? <CheckCircle className="h-3.5 w-3.5 text-foreground" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                    </div>
                </div>
                <Button
                    onClick={() => window.open(getExportUrl(sessionId), "_blank")}
                    variant="outline"
                    className="rounded-xl border-border"
                    disabled={analytics.totalStudents === 0}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Bento Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-in-up">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bento-card py-6 px-6">
                            <div className="bento-glow top-0 right-0" style={{ background: stat.color }} />
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                <Icon className="h-4.5 w-4.5" style={{ color: stat.color }} />
                            </div>
                            <div className="text-2xl font-semibold mb-0.5">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Bento Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
                {/* Score Distribution — wider */}
                <div className="lg:col-span-3 bento-card">
                    <div className="bento-glow bg-foreground bottom-0 left-0" />
                    <h3 className="text-base font-semibold mb-6">Score Distribution</h3>
                    {analytics.scoreDistribution.some((d) => d.count > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.scoreDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="range" fontSize={12} stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                                <YAxis allowDecimals={false} fontSize={12} stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#1F1F1F", color: "#FFFFFF" }} />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                    {analytics.scoreDistribution.map((_, i) => (
                                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">No submissions yet</div>
                    )}
                </div>

                {/* Question Accuracy — narrower */}
                <div className="lg:col-span-2 bento-card">
                    <div className="bento-glow bg-foreground top-0 right-0" />
                    <h3 className="text-base font-semibold mb-6">Question Accuracy</h3>
                    {analytics.questionAccuracy.length > 0 && analytics.questionAccuracy.some((q) => q.totalAttempts > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.questionAccuracy.map((q) => ({ name: `Q${q.questionOrder}`, accuracy: q.accuracy }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" fontSize={12} stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                                <YAxis domain={[0, 100]} fontSize={12} stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#1F1F1F", color: "#FFFFFF" }} />
                                <Line type="monotone" dataKey="accuracy" stroke="#FFFFFF" strokeWidth={2} dot={{ r: 4, fill: "#FFFFFF" }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">No submissions yet</div>
                    )}
                </div>
            </div>

            {/* Student Scores — Full width bento */}
            <div className="bento-card">
                <div className="bento-glow bg-foreground top-0 right-0" />
                <h3 className="text-base font-semibold mb-6">Student Scores</h3>
                {analytics.studentScores.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                    <TableHead className="text-right">Percentage</TableHead>
                                    <TableHead className="text-right">Submitted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analytics.studentScores
                                    .sort((a, b) => b.percentage - a.percentage)
                                    .map((s, i) => (
                                        <TableRow key={s.attemptId}>
                                            <TableCell className="font-medium">{i + 1}</TableCell>
                                            <TableCell className="font-medium">{s.studentName}</TableCell>
                                            <TableCell className="text-right">{s.totalScore}/{s.maxScore}</TableCell>
                                            <TableCell className="text-right">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.percentage >= 70 ? "bg-foreground/10 text-foreground" :
                                                    s.percentage >= 40 ? "bg-foreground/[0.06] text-muted-foreground" :
                                                        "bg-destructive/10 text-destructive"
                                                    }`}>
                                                    {s.percentage}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">
                                                {new Date(s.submittedAt).toLocaleTimeString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="py-16 text-center text-sm text-muted-foreground">
                        <p>No students have submitted yet.</p>
                        <p className="mt-1">Share the session ID to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
