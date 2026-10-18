"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    AuthUser,
    getToken,
    setToken,
    removeToken,
    loginUser,
    registerUser,
    getMe,
} from "@/lib/auth";

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    register: async () => { },
    logout: () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = getToken();
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const userData = await getMe();
            setUser(userData);
        } catch {
            removeToken();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await loginUser(email, password);
        setToken(response.token);
        setUser(response.user);
    };

    const register = async (name: string, email: string, password: string, role: string) => {
        const response = await registerUser(name, email, password, role);
        setToken(response.token);
        setUser(response.user);
    };

    const logout = () => {
        removeToken();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
