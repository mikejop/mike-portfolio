"use client";

import React from "react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ errorInfo });
        console.error("[ErrorBoundary] Erro capturado:", error);
        console.error("[ErrorBoundary] Component Stack:", errorInfo.componentStack);
    }

    render() {
        if (this.state.hasError) {
            const { error, errorInfo } = this.state;

            return (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 99999,
                    background: "#0a0a0a",
                    color: "#e5e5e5",
                    fontFamily: "ui-monospace, 'SF Mono', Monaco, 'Cascadia Code', monospace",
                    overflow: "auto",
                    padding: "32px",
                }}>
                    {/* Header */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "24px",
                        paddingBottom: "16px",
                        borderBottom: "1px solid rgba(255,255,255,0.1)"
                    }}>
                        <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            fontWeight: "bold",
                            color: "white",
                            flexShrink: 0,
                        }}>!</div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#ef4444" }}>
                                Erro na Aplicação
                            </h1>
                            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#737373" }}>
                                Roteiro AV capturou um erro. Copie as informações abaixo para diagnóstico.
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    <div style={{
                        background: "#1c1c1c",
                        border: "1px solid #ef4444/30",
                        borderRadius: "12px",
                        padding: "16px",
                        marginBottom: "16px",
                    }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#ef4444", marginBottom: "8px" }}>
                            Mensagem do Erro
                        </div>
                        <pre style={{
                            margin: 0,
                            fontSize: "13px",
                            color: "#fbbf24",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}>
                            {error?.message || "Erro desconhecido"}
                        </pre>
                    </div>

                    {/* Component Stack */}
                    {errorInfo?.componentStack && (
                        <div style={{
                            background: "#1c1c1c",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: "12px",
                            padding: "16px",
                            marginBottom: "16px",
                        }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#3b82f6", marginBottom: "8px" }}>
                                Componentes Envolvidos (Component Stack)
                            </div>
                            <pre style={{
                                margin: 0,
                                fontSize: "11px",
                                color: "#a3a3a3",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                maxHeight: "300px",
                                overflow: "auto",
                            }}>
                                {errorInfo.componentStack}
                            </pre>
                        </div>
                    )}

                    {/* Full Stack Trace */}
                    {error?.stack && (
                        <div style={{
                            background: "#1c1c1c",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: "12px",
                            padding: "16px",
                            marginBottom: "24px",
                        }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", marginBottom: "8px" }}>
                                Stack Trace Completo
                            </div>
                            <pre style={{
                                margin: 0,
                                fontSize: "11px",
                                color: "#737373",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                maxHeight: "300px",
                                overflow: "auto",
                            }}>
                                {error.stack}
                            </pre>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <button
                            onClick={() => {
                                const text = [
                                    `ERRO: ${error?.message}`,
                                    `\nCOMPONENT STACK:${errorInfo?.componentStack || "N/A"}`,
                                    `\nSTACK TRACE:\n${error?.stack || "N/A"}`,
                                    `\nURL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`,
                                    `\nDATA: ${new Date().toISOString()}`,
                                    `\nUSER AGENT: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`,
                                ].join("\n");
                                navigator.clipboard.writeText(text);
                            }}
                            style={{
                                padding: "10px 20px",
                                borderRadius: "10px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "#1c1c1c",
                                color: "#e5e5e5",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            📋 Copiar Erro Completo
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: "10px 20px",
                                borderRadius: "10px",
                                border: "none",
                                background: "#3b82f6",
                                color: "white",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            🔄 Recarregar Página
                        </button>
                        <button
                            onClick={() => {
                                window.location.href = "/roteiroav/";
                            }}
                            style={{
                                padding: "10px 20px",
                                borderRadius: "10px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "transparent",
                                color: "#a3a3a3",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            🏠 Voltar ao Início
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
