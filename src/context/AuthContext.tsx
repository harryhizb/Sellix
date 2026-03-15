"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
    id?: string;
    name: string;
    email: string;
    businessId?: string;
    businessName?: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User, redirectPath?: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");
        const tokenExpiry = localStorage.getItem("tokenExpiry");

        if (storedToken && storedUser && tokenExpiry) {
            // Reject tokens that are past their expiry
            if (Date.now() < parseInt(tokenExpiry)) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } else {
                // Token expired — clear storage silently
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                localStorage.removeItem("tokenExpiry");
            }
        } else if (storedToken && storedUser) {
            // Legacy sessions without expiry — accept but stamp an expiry now
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            localStorage.setItem("tokenExpiry", String(Date.now() + sevenDaysMs));
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User, redirectPath: string = "/dashboard") => {
        setToken(newToken);
        setUser(newUser);
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem("accessToken", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem("tokenExpiry", String(Date.now() + sevenDaysMs));
        if (redirectPath) {
            router.push(redirectPath);
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (e) {
            console.error(e);
        }
        setToken(null);
        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("tokenExpiry");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
