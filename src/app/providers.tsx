"use client";

import { AuthProvider } from "@/context/AuthContext";
import { BusinessProvider } from "@/context/BusinessContext";
import { SocketProvider } from "@/context/SocketContext";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "google-client-id"}>
            <ReactQueryProvider>
                <AuthProvider>
                    <BusinessProvider>
                        <SocketProvider>
                            {children}
                        </SocketProvider>
                    </BusinessProvider>
                </AuthProvider>
            </ReactQueryProvider>
        </GoogleOAuthProvider>
    );
}
