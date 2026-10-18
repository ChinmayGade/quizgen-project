"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-context";
import { LogOut, User } from "lucide-react";

export function Header() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <header className="border-b border-border">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    <Link
                        href="/"
                        className="text-[15px] font-semibold text-foreground tracking-tight"
                    >
                        QuizGen
                    </Link>
                    <nav className="flex items-center gap-6">
                        {!loading && (
                            <>
                                {user ? (
                                    <>
                                        <Link
                                            href={user.role === "TEACHER" ? "/teacher" : "/student"}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                                        >
                                            {user.role === "TEACHER" ? "Dashboard" : "Quizzes"}
                                        </Link>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm">
                                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="font-medium text-foreground">{user.name}</span>
                                            <span className="text-muted-foreground text-xs">
                                                ({user.role.toLowerCase()})
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                                        >
                                            <LogOut className="h-3.5 w-3.5" />
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/teacher"
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                                        >
                                            Teacher
                                        </Link>
                                        <Link
                                            href="/student"
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                                        >
                                            Student
                                        </Link>
                                        <Link
                                            href="/login"
                                            className="text-sm font-medium text-foreground bg-secondary px-4 py-2 rounded-lg hover:bg-accent transition-colors duration-200"
                                        >
                                            Login
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                        <ThemeToggle />
                    </nav>
                </div>
            </div>
        </header>
    );
}
