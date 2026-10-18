"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Copy, Upload, FileText, Brain, Settings2 } from "lucide-react";
import { generateQuiz } from "@/lib/api";

export default function TeacherPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState("MEDIUM");
    const [questionCount, setQuestionCount] = useState(5);
    const [questionType, setQuestionType] = useState("MIXED");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<{
        sessionId: string;
        totalQuestions: number;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError("Please select a file");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("difficulty", difficulty);
            formData.append("questionCount", questionCount.toString());
            formData.append("questionType", questionType);
            if (title) formData.append("title", title);

            const data = await generateQuiz(formData);
            setResult(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to generate quiz");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result.sessionId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (result) {
        return (
            <div className="max-w-md mx-auto px-6 py-24">
                <div className="bento-card bento-shimmer p-8 text-center animate-fade-in-up">
                    <div className="bento-glow bg-foreground top-0 left-1/2 -translate-x-1/2" />
                    <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center mx-auto mb-6 relative">
                        <CheckCircle className="h-7 w-7 text-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2 relative">Quiz Generated</h2>
                    <p className="text-sm text-muted-foreground mb-8 relative">
                        {result.totalQuestions} questions created. Review and edit before publishing.
                    </p>

                    <div className="bg-secondary rounded-2xl p-5 mb-8 relative">
                        <div className="text-xs text-muted-foreground mb-1.5">Session ID</div>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-2xl font-mono font-semibold tracking-wider">
                                {result.sessionId}
                            </span>
                            <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
                                {copied ? <CheckCircle className="h-4 w-4 text-foreground" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-center relative">
                        <Button
                            onClick={() => router.push(`/teacher/${result.sessionId}/review`)}
                            className="rounded-xl bg-primary hover:opacity-90"
                        >
                            Review & Publish
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => { setResult(null); setFile(null); }}
                            className="rounded-xl border-border"
                        >
                            Create Another
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="mb-10 animate-fade-in-up">
                <h2 className="text-2xl font-semibold mb-2">Create a Quiz</h2>
                <p className="text-sm text-muted-foreground">
                    Upload a document and configure your quiz settings.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Bento Grid Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fade-in-up">
                    {/* File Upload — Large card */}
                    <div className="md:col-span-2 bento-card bento-shimmer">
                        <div className="bento-glow bg-foreground top-0 right-0" />
                        <div className="flex items-center gap-3 mb-6 relative">
                            <div className="w-10 h-10 rounded-xl bg-foreground/[0.06] flex items-center justify-center">
                                <Upload className="h-4.5 w-4.5 text-foreground" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold">Upload Document</h3>
                                <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT — max 50MB</p>
                            </div>
                        </div>
                        <label
                            className={`flex flex-col items-center justify-center w-full h-44 border border-dashed rounded-2xl cursor-pointer transition-all duration-200 relative ${file
                                ? "border-foreground bg-foreground/[0.02]"
                                : "border-border hover:border-muted-foreground"
                                }`}
                        >
                            {file ? (
                                <div className="text-center">
                                    <FileText className="h-8 w-8 text-foreground mx-auto mb-3" />
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <span className="block text-xs text-muted-foreground mt-1">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </span>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                                    <span className="text-sm text-muted-foreground">
                                        Drop your file here or click to browse
                                    </span>
                                </div>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.docx,.txt"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </label>
                    </div>

                    {/* Title + Count */}
                    <div className="flex flex-col gap-4">
                        <div className="bento-card flex-1">
                            <div className="bento-glow bg-foreground bottom-0 left-0" />
                            <div className="flex items-center gap-2 mb-4 relative">
                                <FileText className="h-4 w-4 text-foreground" />
                                <span className="text-sm font-medium">Title</span>
                                <span className="text-xs text-muted-foreground">(optional)</span>
                            </div>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Quiz title"
                                className="rounded-[10px] h-11 bg-card border-border focus:border-foreground relative"
                            />
                        </div>
                        <div className="bento-card flex-1">
                            <div className="bento-glow bg-foreground top-0 right-0" />
                            <div className="flex items-center gap-2 mb-4 relative">
                                <Settings2 className="h-4 w-4 text-foreground" />
                                <span className="text-sm font-medium">Questions</span>
                            </div>
                            <Input
                                type="number"
                                min={1}
                                max={50}
                                value={questionCount}
                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                                className="rounded-[10px] h-11 bg-card border-border focus:border-foreground relative"
                            />
                            <p className="text-xs text-muted-foreground mt-2 relative">1–50 questions</p>
                        </div>
                    </div>
                </div>

                {/* Settings row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-fade-in-up">
                    <div className="bento-card">
                        <div className="bento-glow bg-foreground top-0 left-0" />
                        <div className="flex items-center gap-2 mb-4 relative">
                            <Brain className="h-4 w-4 text-foreground" />
                            <Label className="text-sm font-medium">Difficulty</Label>
                        </div>
                        <div className="flex gap-2 relative">
                            {["EASY", "MEDIUM", "HARD"].map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDifficulty(d)}
                                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${difficulty === d
                                        ? "bg-foreground text-background"
                                        : "bg-secondary text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {d.charAt(0) + d.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bento-card">
                        <div className="bento-glow bg-foreground bottom-0 right-0" />
                        <div className="flex items-center gap-2 mb-4 relative">
                            <Settings2 className="h-4 w-4 text-foreground" />
                            <Label className="text-sm font-medium">Question Type</Label>
                        </div>
                        <div className="flex gap-2 relative">
                            {["MCQ", "THEORY", "MIXED"].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setQuestionType(t)}
                                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${questionType === t
                                        ? "bg-foreground text-background"
                                        : "bg-secondary text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {t === "MCQ" ? "MCQ" : t.charAt(0) + t.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-3 mb-6 animate-fade-in-up">
                        {error}
                    </div>
                )}

                <div className="animate-fade-in-up">
                    <Button
                        type="submit"
                        disabled={loading || !file}
                        className="w-full h-14 rounded-2xl text-base font-medium bg-primary hover:bg-[#333333] transition-all duration-200 hover:scale-[1.01]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Generating…
                            </>
                        ) : (
                            <>
                                <Brain className="mr-2 h-5 w-5" />
                                Generate Quiz
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
