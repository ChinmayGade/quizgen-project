const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: "TEACHER" | "STUDENT";
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

// Token helpers
export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("quizgen_token");
}

export function setToken(token: string): void {
    localStorage.setItem("quizgen_token", token);
}

export function removeToken(): void {
    localStorage.removeItem("quizgen_token");
}

// API functions
export async function registerUser(
    name: string,
    email: string,
    password: string,
    role: string
): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Registration failed");
    }
    return data;
}

export async function loginUser(
    email: string,
    password: string
): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Login failed");
    }
    return data;
}

export async function getMe(): Promise<AuthUser> {
    const token = getToken();
    if (!token) throw new Error("No token");

    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Unauthorized");
    }
    return data;
}
