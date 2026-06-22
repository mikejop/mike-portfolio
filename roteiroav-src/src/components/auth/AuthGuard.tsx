"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Redirect to login if not authenticated and not already on a bypass route
        // (Bypass routes are handled by LayoutContent, but this is a safety net)
        if (!loading && !user && !["/login", "/register", "/forgot-password", "/reset-password", "/login/", "/register/", "/forgot-password/", "/reset-password/"].includes(pathname)) {
            router.push("/login");
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#050505]">
                <Loader2 className="h-8 w-8 animate-spin text-white/20" />
            </div>
        );
    }

    if (!user && !["/login", "/register", "/forgot-password", "/reset-password", "/login/", "/register/", "/forgot-password/", "/reset-password/"].includes(pathname)) {
        return null;
    }

    return <>{children}</>;
}
