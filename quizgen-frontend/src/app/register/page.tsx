"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { SocialButtons } from "@/components/social-buttons";

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<"TEACHER" | "STUDENT">("TEACHER");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        setError("");

        try {
            await register(name, email, password, role);
            router.push(role === "TEACHER" ? "/teacher" : "/student");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-sm mx-auto px-6 py-16">
            <div className="mb-10 text-center animate-fade-in-up">
                <h2 className="text-2xl font-semibold mb-2">Create an account</h2>
                <p className="text-sm text-muted-foreground">
                    Get started with QuizGen
                </p>
            </div>

            <div className="bento-card animate-fade-in-up">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Role toggle */}
                    <div className="flex gap-2 p-1 bg-secondary rounded-xl">
                        {(["TEACHER", "STUDENT"] as const).map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRole(r)}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${role === r
                                    ? "bg-foreground text-background shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {r.charAt(0) + r.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    <div>
                        <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                            Name
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="pl-10 rounded-[10px] h-11 bg-card border-border focus:border-foreground"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                            Email
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="pl-10 rounded-[10px] h-11 bg-card border-border focus:border-foreground"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="password" className="text-sm font-medium mb-2 block">
                            Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="pl-10 rounded-[10px] h-11 bg-card border-border focus:border-foreground"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword" className="text-sm font-medium mb-2 block">
                            Confirm Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="pl-10 rounded-[10px] h-11 bg-card border-border focus:border-foreground"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 rounded-[10px] p-3 text-center">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl text-[15px] font-medium bg-primary hover:bg-[#333333] transition-all duration-200"
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        Create Account
                    </Button>
                </form>

                <div className="mt-6">
                    <SocialButtons mode="register" />
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-foreground font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
