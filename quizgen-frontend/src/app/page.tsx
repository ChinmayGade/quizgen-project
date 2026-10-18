"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, Brain, Share2, BarChart3, Shield, Zap } from "lucide-react";

const FILE_TYPES = [".pdf", ".txt", ".docx"];

export default function HomePage() {
  const [typeIndex, setTypeIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(false);
      setTimeout(() => {
        setTypeIndex((prev) => (prev + 1) % FILE_TYPES.length);
        setAnimate(true);
      }, 200);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center py-28 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at center, var(--accent), transparent 70%)",
          }}
        />
        <div className="relative animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border text-xs font-medium text-muted-foreground uppercase tracking-wider mb-8">
            <Zap className="h-3 w-3 text-foreground" />
            AI-powered quiz generator
          </div>

          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
            Generate quizzes<br />
            <span className="text-muted-foreground">from any </span>
            <span
              className={`inline-block transition-all duration-300 ${animate
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
                }`}
              style={{ minWidth: "160px" }}
            >
              <span className="text-foreground font-semibold border-b-2 border-foreground/20 pb-0.5">
                {FILE_TYPES[typeIndex]}
              </span>
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
            Upload your files and instantly create intelligent quizzes.
            No login required.
          </p>

          <div className="flex items-center gap-4 justify-center">
            <Link href="/teacher">
              <Button className="h-12 px-7 rounded-xl text-[15px] font-medium bg-primary hover:opacity-90 transition-all duration-200 hover:scale-[1.02]">
                Create a Quiz
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/student">
              <Button variant="outline" className="h-12 px-7 rounded-xl text-[15px] font-medium border-border hover:bg-secondary transition-all duration-200">
                Join a Quiz
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-16 animate-fade-in-up">
        {/* Large card — Upload */}
        <div className="md:col-span-2 bento-card bento-shimmer group">
          <div className="bento-glow bg-foreground top-0 right-0" />
          <div className="flex items-start justify-between">
            <div>
              <div className="bento-icon bg-foreground/[0.06]">
                <Upload className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Any Document</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                Support for PDF, DOCX, and TXT files. Our NLP engine extracts the key concepts, facts, and relationships from your content.
              </p>
            </div>
            <span className="text-6xl font-bold text-foreground/[0.04] select-none">01</span>
          </div>
          {/* Mini file cards */}
          <div className="flex gap-3 mt-6">
            {["PDF", "DOCX", "TXT"].map((f) => (
              <div key={f} className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-xs font-medium text-muted-foreground">
                .{f.toLowerCase()}
              </div>
            ))}
          </div>
        </div>

        {/* Small card — AI Generation */}
        <div className="bento-card bento-shimmer group">
          <div className="bento-glow bg-foreground bottom-0 left-0" />
          <div className="bento-icon bg-foreground/[0.08]">
            <Brain className="h-5 w-5 text-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">AI Generation</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Intelligent MCQ and theory questions generated automatically from extracted facts.
          </p>
          <span className="absolute bottom-6 right-6 text-5xl font-bold text-foreground/[0.04] select-none">02</span>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-16">
        {/* Small card — Share */}
        <div className="bento-card bento-shimmer group">
          <div className="bento-glow bg-foreground top-0 left-0" />
          <div className="bento-icon bg-foreground/[0.08]">
            <Share2 className="h-5 w-5 text-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Instant Sharing</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Get a unique session ID. Students join and take the quiz with zero setup.
          </p>
          <span className="absolute bottom-6 right-6 text-5xl font-bold text-foreground/[0.04] select-none">03</span>
        </div>

        {/* Medium card — Analytics */}
        <div className="bento-card bento-shimmer group">
          <div className="bento-glow bg-foreground bottom-0 right-0" />
          <div className="bento-icon bg-foreground/[0.08]">
            <BarChart3 className="h-5 w-5 text-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Live Analytics</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Real-time score distribution, per-question accuracy, and student rankings.
          </p>
          <span className="absolute bottom-6 right-6 text-5xl font-bold text-foreground/[0.04] select-none">04</span>
        </div>

        {/* Small card — Security */}
        <div className="bento-card bento-shimmer group">
          <div className="bento-glow bg-foreground bottom-0 left-0" />
          <div className="bento-icon bg-foreground/[0.06]">
            <Shield className="h-5 w-5 text-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Login Required</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Start creating immediately. No accounts, no tracking, just quizzes.
          </p>
          <span className="absolute bottom-6 right-6 text-5xl font-bold text-foreground/[0.04] select-none">05</span>
        </div>
      </div>

      {/* Stats ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-32">
        {[
          { label: "File Types", value: "3+", sub: "PDF, DOCX, TXT" },
          { label: "Question Types", value: "2", sub: "MCQ & Theory" },
          { label: "Difficulty Levels", value: "3", sub: "Easy, Medium, Hard" },
          { label: "Auth Required", value: "None", sub: "Zero friction" },
        ].map((s, i) => (
          <div key={i} className="bento-card text-center py-8">
            <div className="text-3xl font-bold text-foreground mb-1">{s.value}</div>
            <div className="text-sm font-medium mb-0.5">{s.label}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
