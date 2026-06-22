"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Loader2, Save, MapPin, User, Mail, Lock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { user, profile, loading: authLoading, setProfileLocal } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile State
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        displayName: "",
        birthDate: "",
        address: {
            cep: "",
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: ""
        }
    });

    // Auth State
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [showReauth, setShowReauth] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        if (user) {
            setEmail(user.email || "");
            if (profile) {
                setFormData(prev => ({
                    ...prev,
                    ...profile,
                    address: {
                        cep: profile.address?.cep || "",
                        street: profile.address?.street || "",
                        number: profile.address?.number || "",
                        complement: profile.address?.complement || "",
                        neighborhood: profile.address?.neighborhood || "",
                        city: profile.address?.city || "",
                        state: profile.address?.state || ""
                    }
                }));
            }
            setLoading(false);
        }
    }, [user, profile, authLoading, router]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: "A imagem deve ter no máximo 2MB." });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setFormData(prev => ({ ...prev, photoURL: base64String }));
        };
        reader.readAsDataURL(file);
    };

    const handleCepBlur = async () => {
        const cep = formData.address?.cep.replace(/\D/g, "");
        if (cep && cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        address: {
                            ...(prev.address || {
                                cep: "", number: "", complement: ""
                            }),
                            street: data.logradouro,
                            neighborhood: data.bairro,
                            city: data.localidade,
                            state: data.uf
                        }
                    }));
                }
            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setMessage(null);

        try {
            // Update Profile in Firestore
            await updateUserProfile(user.uid, formData);
            setProfileLocal(formData);

            // Update Email if changed
            if (email !== user.email) {
                try {
                    await updateEmail(user, email);
                } catch (err: any) {
                    if (err.code === 'auth/requires-recent-login') {
                        setShowReauth(true);
                        throw new Error("Necessário reautenticar para mudar o e-mail.");
                    }
                    throw err;
                }
            }

            // Update Password if provided
            if (newPassword) {
                try {
                    await updatePassword(user, newPassword);
                } catch (err: any) {
                    if (err.code === 'auth/requires-recent-login') {
                        setShowReauth(true);
                        throw new Error("Necessário reautenticar para mudar a senha.");
                    }
                    throw err;
                }
            }

            setMessage({ type: 'success', text: "Configurações salvas com sucesso!" });
            setNewPassword("");
            setCurrentPassword("");
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || "Erro ao salvar configurações." });
        } finally {
            setSaving(false);
        }
    };

    const handleReauthenticate = async () => {
        if (!user || !currentPassword) return;
        setSaving(true);
        try {
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);
            setShowReauth(false);
            setMessage({ type: 'success', text: "Reautenticado! Clique em salvar novamente." });
        } catch (error: any) {
            setMessage({ type: 'error', text: "Senha atual incorreta." });
        } finally {
            setSaving(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in-up duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 overflow-hidden relative group cursor-pointer shrink-0"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        title="Alterar foto de perfil"
                    >
                        {formData.photoURL || user?.photoURL ? (
                            <img src={formData.photoURL || user?.photoURL || ""} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="text-indigo-400 w-6 h-6" />
                        )}
                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                            <User className="text-white w-4 h-4" />
                        </div>
                        <input
                            type="file"
                            id="avatar-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Configurações de Conta</h1>
                        <p className="text-white/50 text-sm italic">Gerencie suas informações pessoais e de acesso</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-colors w-fit"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    Voltar
                </button>
            </div>

            {message && (
                <div className={cn(
                    "p-4 rounded-xl mb-6 flex items-center gap-3 border animate-in fade-in slide-in-from-top-2",
                    message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                    <div className={cn("w-2 h-2 rounded-full", message.type === 'success' ? "bg-emerald-500" : "bg-rose-500")} />
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Informações Pessoais */}
                <section className="bg-white/5 rounded-2xl border border-white/5 p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <User className="w-4 h-4 text-white/40" />
                        <h2 className="text-lg font-semibold text-white">Informações Pessoais</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Nome Completo</label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={e => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all outline-none"
                                placeholder="Seu nome"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Telefone / WhatsApp</label>
                            <input
                                type="tel"
                                value={formData.phone || ""}
                                onChange={e => {
                                    let v = e.target.value.replace(/\D/g, "");
                                    if (v.length > 11) v = v.slice(0, 11);
                                    let formatted = v;
                                    if (v.length > 2) formatted = `(${v.slice(0, 2)}) ` + v.slice(2);
                                    if (v.length > 7) formatted = formatted.slice(0, 10) + '-' + formatted.slice(10);
                                    setFormData(prev => ({ ...prev, phone: formatted }));
                                }}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all outline-none"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                        <div className="space-y-2 lg:col-span-1">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1 text-right">Data de Nascimento</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={e => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:border-indigo-500/50 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Endereço */}
                <section className="bg-white/5 rounded-2xl border border-white/5 p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-4 h-4 text-white/40" />
                        <h2 className="text-lg font-semibold text-white">Endereço</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">CEP</label>
                            <input
                                type="text"
                                value={formData.address?.cep || ""}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    address: {
                                        ...(prev.address || { street: "", number: "", complement: "", neighborhood: "", city: "", state: "" }),
                                        cep: e.target.value
                                    }
                                }))}
                                onBlur={handleCepBlur}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 transition-all outline-none"
                                placeholder="00000-000"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Logradouro</label>
                            <input
                                type="text"
                                value={formData.address?.street || ""}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    address: {
                                        ...(prev.address || { cep: "", number: "", complement: "", neighborhood: "", city: "", state: "" }),
                                        street: e.target.value
                                    }
                                }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 transition-all outline-none"
                                placeholder="Rua, Avenida..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Número</label>
                            <input
                                type="text"
                                value={formData.address?.number || ""}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    address: {
                                        ...(prev.address || { cep: "", street: "", complement: "", neighborhood: "", city: "", state: "" }),
                                        number: e.target.value
                                    }
                                }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 transition-all outline-none"
                                placeholder="123"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Complemento</label>
                            <input
                                type="text"
                                value={formData.address?.complement || ""}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    address: {
                                        ...(prev.address || { cep: "", street: "", number: "", neighborhood: "", city: "", state: "" }),
                                        complement: e.target.value
                                    }
                                }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 transition-all outline-none"
                                placeholder="Apto, Bloco..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Bairro</label>
                            <input
                                type="text"
                                value={formData.address?.neighborhood || ""}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    address: {
                                        ...(prev.address || { cep: "", street: "", number: "", complement: "", city: "", state: "" }),
                                        neighborhood: e.target.value
                                    }
                                }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Cidade</label>
                            <input
                                type="text"
                                value={formData.address?.city || ""}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    address: {
                                        ...(prev.address || { cep: "", street: "", number: "", complement: "", neighborhood: "", state: "" }),
                                        city: e.target.value
                                    }
                                }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Estado</label>
                            <input
                                type="text"
                                value={formData.address?.state || ""}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    address: {
                                        ...(prev.address || { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "" }),
                                        state: e.target.value
                                    }
                                }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 transition-all outline-none"
                                placeholder="UF"
                                maxLength={2}
                            />
                        </div>
                    </div>
                </section>

                {/* Acesso */}
                <section className="bg-white/5 rounded-2xl border border-white/5 p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Lock className="w-4 h-4 text-white/40" />
                        <h2 className="text-lg font-semibold text-white">Segurança e Acesso</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">E-mail de Acesso</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:border-indigo-500/50 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Nova Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:border-indigo-500/50 transition-all outline-none"
                                    placeholder="Deixe em branco para manter"
                                />
                            </div>
                        </div>
                    </div>

                    {showReauth && (
                        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                            <p className="text-sm text-amber-500 font-medium italic">Confirme sua senha atual para aplicar as mudanças de segurança:</p>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-amber-500/50 transition-all"
                                    placeholder="Senha atual"
                                />
                                <button
                                    type="button"
                                    onClick={handleReauthenticate}
                                    disabled={saving || !currentPassword}
                                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold px-4 py-2 rounded-lg transition-all"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <div className="flex items-center justify-between pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-[var(--macos-text-secondary)] hover:text-white text-sm font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving || showReauth}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    );
}
