"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";
import { getQuiz } from "@/lib/api";

export default function StudentPage() {
    const router = useRouter();
    const [sessionId, setSessionId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionId.trim()) {
            setError("Please enter a session ID");
            return;
        }
        setLoading(true);
        setError("");

        try {
            await getQuiz(sessionId.trim().toUpperCase());
            router.push(`/student/${sessionId.trim().toUpperCase()}`);
        } catch {
            setError("Quiz not found. Please check the session ID.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-sm mx-auto px-6 py-24">
            <div className="mb-10 animate-fade-in-up">
                <h2 className="text-2xl font-semibold mb-2">Join a Quiz</h2>
                <p className="text-sm text-muted-foreground">
                    Enter the session ID provided by your teacher.
                </p>
            </div>

            <div className="bento-card animate-fade-in-up">
                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <Label htmlFor="sessionId" className="text-sm font-medium mb-2 block">
                            Session ID
                        </Label>
                        <Input
                            id="sessionId"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                            placeholder="e.g. A1B2C3D4"
                            className="rounded-[10px] h-14 text-center text-2xl font-mono tracking-widest bg-card border-border focus:border-foreground"
                            maxLength={8}
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 rounded-[10px] p-3 text-center">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || !sessionId.trim()}
                        className="w-full h-12 rounded-xl text-[15px] font-medium bg-primary hover:bg-[#333333] transition-all duration-200"
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowRight className="mr-2 h-4 w-4" />
                        )}
                        Join Quiz
                    </Button>
                </form>
            </div>
        </div>
    );
}
