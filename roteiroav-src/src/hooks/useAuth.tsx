"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, UserProfile } from "@/lib/firestore";

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    setProfileLocal: (updatedProfile: Partial<UserProfile>) => void;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    setProfileLocal: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            // Set loading false immediately — routing decisions only need the user object.
            setLoading(false);

            if (firebaseUser) {
                // Fetch profile in the background; it is display-only, not needed for auth guards.
                getUserProfile(firebaseUser.uid)
                    .then((userProfile) => setProfile(userProfile))
                    .catch((error) => console.error("Error fetching user profile:", error));
            } else {
                setProfile(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const setProfileLocal = (updatedProfile: Partial<UserProfile>) => {
        setProfile((prev) => prev ? { ...prev, ...updatedProfile } : null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, setProfileLocal }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
