"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
    const glowRef = useRef<HTMLDivElement>(null);
    const trailRef = useRef<HTMLDivElement>(null);
    const pos = useRef({ x: 0, y: 0 });
    const target = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            target.current = { x: e.clientX, y: e.clientY };
        };

        let rafId: number;

        const animate = () => {
            // Smooth lerp — glow follows cursor with delay
            pos.current.x += (target.current.x - pos.current.x) * 0.08;
            pos.current.y += (target.current.y - pos.current.y) * 0.08;

            if (glowRef.current) {
                glowRef.current.style.transform = `translate(${target.current.x}px, ${target.current.y}px) translate(-50%, -50%)`;
            }
            if (trailRef.current) {
                trailRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
            }

            rafId = requestAnimationFrame(animate);
        };

        window.addEventListener("mousemove", handleMouseMove);
        rafId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <>
            {/* Primary glow — follows cursor instantly */}
            <div
                ref={glowRef}
                className="pointer-events-none fixed top-0 left-0 z-[1] will-change-transform"
                style={{
                    width: 400,
                    height: 400,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(circle, var(--cursor-glow-color, rgba(17,17,17,0.03)) 0%, transparent 70%)",
                    filter: "blur(2px)",
                    transition: "opacity 0.3s",
                }}
            />
            {/* Trail — follows with lag */}
            <div
                ref={trailRef}
                className="pointer-events-none fixed top-0 left-0 z-[1] will-change-transform"
                style={{
                    width: 600,
                    height: 600,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(circle, var(--cursor-trail-color, rgba(17,17,17,0.015)) 0%, transparent 70%)",
                    filter: "blur(4px)",
                }}
            />
        </>
    );
}
