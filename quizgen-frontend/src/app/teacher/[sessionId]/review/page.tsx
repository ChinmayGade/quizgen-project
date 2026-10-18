"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2, CheckCircle, Pencil, Save, Send, Copy, ArrowLeft, X,
} from "lucide-react";
import { reviewQuiz, updateQuestions, publishQuiz } from "@/lib/api";

interface ReviewQuestion {
    id: number; questionText: string; type: string;
    questionOrder: number; options: string | null; correctAnswer: string;
}

interface ReviewData {
    sessionId: string; title: string; difficulty: string;
    questionType: string; totalQuestions: number; published: boolean;
    questions: ReviewQuestion[];
}

export default function TeacherReviewPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [quiz, setQuiz] = useState<ReviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [editAnswer, setEditAnswer] = useState("");
    const [editOptions, setEditOptions] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [published, setPublished] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => { loadQuiz(); }, [sessionId]);

    const loadQuiz = async () => {
        try {
            const data = await reviewQuiz(sessionId);
            setQuiz(data); setPublished(data.published);
        } catch { setError("Quiz not found"); }
        finally { setLoading(false); }
    };

    const startEditing = (q: ReviewQuestion) => {
        setEditingId(q.id); setEditText(q.questionText); setEditAnswer(q.correctAnswer);
        if (q.options) { try { setEditOptions(JSON.parse(q.options)); } catch { setEditOptions([]); } }
        else { setEditOptions([]); }
    };

    const cancelEditing = () => { setEditingId(null); setEditText(""); setEditAnswer(""); setEditOptions([]); };

    const saveQuestion = async () => {
        if (!quiz || editingId === null) return;
        setSaving(true);
        try {
            await updateQuestions(sessionId, [{
                id: editingId, questionText: editText, correctAnswer: editAnswer,
                ...(editOptions.length > 0 && { options: JSON.stringify(editOptions) }),
            }]);
            setQuiz({
                ...quiz,
                questions: quiz.questions.map((q) =>
                    q.id === editingId ? { ...q, questionText: editText, correctAnswer: editAnswer, options: editOptions.length > 0 ? JSON.stringify(editOptions) : q.options } : q
                ),
            });
            cancelEditing();
        } catch { setError("Failed to save"); } finally { setSaving(false); }
    };

    const handlePublish = async () => {
        if (!quiz) return; setPublishing(true);
        try { await publishQuiz(sessionId); setPublished(true); }
        catch { setError("Failed to publish"); } finally { setPublishing(false); }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(sessionId);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
    );

    if (error || !quiz) return (
        <div className="max-w-sm mx-auto px-6 py-24 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => router.push("/teacher")} className="rounded-xl bg-primary hover:bg-[#333333]">Go Back</Button>
        </div>
    );

    if (published) return (
        <div className="max-w-md mx-auto px-6 py-24">
            <div className="bento-card bento-shimmer p-8 text-center animate-fade-in-up">
                <div className="bento-glow bg-foreground top-0 left-1/2 -translate-x-1/2" />
                <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center mx-auto mb-6 relative">
                    <CheckCircle className="h-6 w-6 text-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2 relative">Quiz Published</h2>
                <p className="text-sm text-muted-foreground mb-8 relative">Students can now join using the session ID.</p>
                <div className="bg-secondary rounded-xl p-5 mb-8 relative">
                    <div className="text-xs text-muted-foreground mb-1.5">Session ID</div>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl font-mono font-semibold tracking-wider">{quiz.sessionId}</span>
                        <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-opacity">
                            {copied ? <CheckCircle className="h-4 w-4 text-foreground" /> : <Copy className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <div className="flex gap-3 justify-center relative">
                    <Button onClick={() => router.push(`/teacher/${quiz.sessionId}`)} className="rounded-xl bg-primary hover:bg-[#333333]">View Dashboard</Button>
                    <Button variant="outline" onClick={() => router.push("/teacher")} className="rounded-xl border-border">Create Another</Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 animate-fade-in-up">
                <div>
                    <button
                        onClick={() => router.push("/teacher")}
                        className="text-sm text-muted-foreground hover:text-foreground transition-opacity mb-2 flex items-center gap-1"
                    >
                        <ArrowLeft className="h-3 w-3" /> Back
                    </button>
                    <h2 className="text-2xl font-semibold">{quiz.title}</h2>
                    <div className="text-sm text-muted-foreground mt-1">
                        {quiz.difficulty} · {quiz.questionType} · {quiz.totalQuestions} questions · Draft
                    </div>
                </div>
                <Button onClick={handlePublish} disabled={publishing || editingId !== null} className="rounded-xl bg-primary hover:bg-[#333333] hover:text-white">
                    {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Publish
                </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-6 animate-fade-in-up">
                Review each question. Click edit to modify before publishing.
            </p>

            {/* Questions */}
            <div className="space-y-4">
                {quiz.questions.map((q) => (
                    <div key={q.id} className="bento-card animate-fade-in-up">
                        {editingId === q.id ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Q{q.questionOrder} · {q.type} · Editing</div>
                                    <button onClick={cancelEditing} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Question</label>
                                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[80px] rounded-[10px] bg-card border-border focus:border-foreground" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Correct Answer</label>
                                    <Textarea value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} className="min-h-[60px] rounded-[10px] bg-card border-border focus:border-foreground" />
                                </div>
                                {q.type === "MCQ" && editOptions.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">Options</label>
                                        <div className="space-y-2">
                                            {editOptions.map((opt, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${opt === editAnswer ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <Input value={opt} onChange={(e) => { const n = [...editOptions]; n[idx] = e.target.value; setEditOptions(n); }} className="rounded-[10px] h-9 bg-card border-border focus:border-foreground" />
                                                    {opt === editAnswer && <span className="text-xs text-foreground shrink-0">✓ Correct</span>}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">Tip: Update &ldquo;Correct Answer&rdquo; to match an option exactly.</p>
                                    </div>
                                )}
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" onClick={cancelEditing} className="rounded-xl border-border">Cancel</Button>
                                    <Button onClick={saveQuestion} disabled={saving || !editText.trim() || !editAnswer.trim()} className="rounded-xl bg-primary hover:bg-[#333333]">
                                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Q{q.questionOrder} · {q.type}</div>
                                    <button onClick={() => startEditing(q)} className="text-muted-foreground hover:text-foreground transition-opacity shrink-0">
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="font-medium mb-4 whitespace-pre-wrap leading-relaxed">{q.questionText}</p>
                                {q.type === "MCQ" && q.options && (
                                    <div className="space-y-2 mb-4">
                                        {(() => {
                                            try {
                                                const opts: string[] = JSON.parse(q.options);
                                                return opts.map((opt, idx) => (
                                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${opt === q.correctAnswer ? "border-foreground/20 bg-foreground/[0.02]" : "border-border"}`}>
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${opt === q.correctAnswer ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        <span className={opt === q.correctAnswer ? "font-medium" : ""}>{opt}</span>
                                                        {opt === q.correctAnswer && <span className="text-xs text-foreground ml-auto">✓ Correct</span>}
                                                    </div>
                                                ));
                                            } catch { return null; }
                                        })()}
                                    </div>
                                )}
                                {q.type === "THEORY" && (
                                    <div className="p-3 rounded-xl bg-secondary border border-border">
                                        <span className="text-sm text-muted-foreground">Expected: </span>
                                        <span className="text-sm font-medium">{q.correctAnswer.length > 200 ? q.correctAnswer.substring(0, 200) + "…" : q.correctAnswer}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-10 pt-8 border-t border-border text-center">
                <p className="text-sm text-muted-foreground mb-4">When ready, publish to make the quiz available to students.</p>
                <Button onClick={handlePublish} disabled={publishing || editingId !== null} className="rounded-xl px-8 h-12 text-[15px] font-medium bg-primary hover:bg-[#333333] hover:text-white">
                    {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Publish Quiz
                </Button>
            </div>
        </div>
    );
}
