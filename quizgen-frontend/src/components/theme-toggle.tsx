"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-9 h-9" />;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full hover:bg-accent transition-all duration-300"
        >
            {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-400 transition-transform duration-300 rotate-0" />
            ) : (
                <Moon className="h-5 w-5 text-primary transition-transform duration-300 rotate-0" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
