"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserCollection, getUserDocument, updateUserProfile } from "@/lib/firestore";
import { getTrafficSource } from "@/hooks/useTrafficSource";
import { useScriptStore } from "@/features/tools/script-editor/store/useScriptStore";
import { useBudgetStore } from "@/features/tools/budget-editor/store/useBudgetStore";
import { usePricingStore } from "@/features/tools/pricing-editor/store/usePricingStore";
import { ScriptMetadata as Script } from "@/features/tools/script-editor/store/types";
import { BudgetStoreState } from "@/features/tools/budget-editor/store/types";
import { PricingState } from "@/features/tools/pricing-editor/store/types";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export function CloudSync() {
    const { user, profile, loading } = useAuth();
    const setScripts = useScriptStore((state) => state.setScripts);
    const setBudgets = useBudgetStore((state) => state.setBudgets);
    const setPricingConfig = usePricingStore((state) => state.setPricingConfig);

    // Use a ref to track if we've already synced for this user session
    const hasSyncedRef = useRef<string | null>(null);
    // Use a ref to access `profile` inside the effect without it being a dependency
    const profileRef = useRef(profile);
    profileRef.current = profile;

    // Ref to hold the unsubscribe function for real-time scripts listener
    const unsubScriptsRef = useRef<(() => void) | null>(null);

    // Cleanup scripts listener on component unmount
    useEffect(() => {
        return () => {
            if (unsubScriptsRef.current) {
                unsubScriptsRef.current();
                unsubScriptsRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            // Clear stores on logout
            setScripts([]);
            setBudgets([]);
            hasSyncedRef.current = null;
            if (unsubScriptsRef.current) {
                unsubScriptsRef.current();
                unsubScriptsRef.current = null;
            }
            return;
        }

        // Prevent re-syncing for the same user session
        if (hasSyncedRef.current === user.uid) return;
        hasSyncedRef.current = user.uid;

        const syncData = async () => {
            console.log("CloudSync: Inicia sincronização para usuário", user.uid);

            try {
                // 1. Subscribe to Scripts (Metadata) in real-time immediately
                if (unsubScriptsRef.current) {
                    unsubScriptsRef.current();
                }
                unsubScriptsRef.current = useScriptStore.getState().subscribeToScripts();
                console.log("CloudSync: Inscrito em roteiros em tempo real.");

                // 2. Ensure root user document is present for email search indexing (in background)
                (async () => {
                    try {
                        const rootDocRef = doc(db, "users", user.uid);
                        await setDoc(rootDocRef, {
                            uid: user.uid,
                            email: (user.email || '').toLowerCase().trim(),
                            displayName: user.displayName || profileRef.current?.displayName || '',
                            photoURL: user.photoURL || profileRef.current?.photoURL || '',
                            updatedAt: serverTimestamp()
                        }, { merge: true });
                        console.log("CloudSync: Usuário indexado na coleção raiz.");
                    } catch (err) {
                        console.error("CloudSync: Erro ao indexar usuário na raiz:", err);
                    }
                })();

                // 2. Fetch Budgets
                const budgetsPayload = await getUserCollection('budgets');
                if (budgetsPayload && budgetsPayload.length > 0) {
                    setBudgets(budgetsPayload as unknown as BudgetStoreState[]);
                    console.log(`CloudSync: ${budgetsPayload.length} orçamentos carregados.`);
                }

                // 3. Fetch Pricing Config
                const pricingPayload = await getUserDocument('pricing', 'config');
                if (pricingPayload) {
                    setPricingConfig(pricingPayload as Partial<PricingState>);
                    console.log("CloudSync: Configurações de precificação carregadas.");
                }

                // 4. Check & Initialize Profile (read from ref to avoid dependency)
                const currentProfile = profileRef.current;
                if (currentProfile === null) {
                    console.log("CloudSync: Perfil não encontrado no banco. Inicializando...");
                    const source = getTrafficSource();

                    let ipData: { ip: string | null; location: any } = { ip: null, location: null };
                    try {
                        const res = await fetch('https://ipapi.co/json/');
                        if (res.ok) {
                            const data = await res.json();
                            ipData.ip = data.ip;
                            ipData.location = {
                                city: data.city,
                                region: data.region,
                                country: data.country_name
                            };
                        }
                    } catch {
                        // Silent fail — AdBlock or network issue
                    }

                    await updateUserProfile(user.uid, {
                        displayName: user.displayName || '',
                        email: user.email || '',
                        photoURL: user.photoURL || '',
                        source: source,
                        ip: ipData.ip || null,
                        location: ipData.location || null
                    });
                    console.log("CloudSync: Perfil inicializado com origem e localização.");
                } else {
                    // 5. Update IP/Location if changed (fire-and-forget, no await)
                    fetch('https://ipapi.co/json/')
                        .then(res => res.ok ? res.json() : null)
                        .then(data => {
                            if (data && data.ip !== currentProfile.ip) {
                                console.log("CloudSync: IP alterado detectado. Atualizando localização...");
                                updateUserProfile(user.uid, {
                                    ip: data.ip || null,
                                    location: {
                                        city: data.city || null,
                                        region: data.region || null,
                                        country: data.country_name || null
                                    }
                                });
                            }
                        })
                        .catch(() => { /* Silent fail for background location check */ });
                }

            } catch (error) {
                console.error("CloudSync: Erro ao sincronizar dados do Firebase", error);
            }
        };

        syncData();
    }, [user, loading, setScripts, setBudgets, setPricingConfig]);

    return null; // This is a logic-only component
}
