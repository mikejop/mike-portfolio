import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { CloudSync } from "@/components/auth/CloudSync";
import { LayoutContent } from "@/components/macos/LayoutContent";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  metadataBase: new URL("https://dojo.hirocontents.com.br"),
  title: "Roteiro AV – Escrita de Roteiro Audiovisual",
  description: "Roteiro AV é um editor de roteiros profissional e colaborativo para produção audiovisual.",
  openGraph: {
    title: "Roteiro AV – Escrita de Roteiro Audiovisual",
    description: "Roteiro AV é um editor de roteiros profissional e colaborativo para produção audiovisual.",
    url: "https://dojo.hirocontents.com.br",
    siteName: "Roteiro AV",
    images: [
      {
        url: "/img/dojo.jpg",
        width: 1200,
        height: 630,
        alt: "Roteiro AV Social Preview",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roteiro AV – Escrita de Roteiro Audiovisual",
    description: "Roteiro AV é um editor de roteiros profissional e colaborativo para produção audiovisual.",
    images: ["/img/dojo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen font-sans" suppressHydrationWarning>
        <ErrorBoundary>
          <AuthProvider>
            <CloudSync />
            <LayoutContent>{children}</LayoutContent>
          </AuthProvider>
        </ErrorBoundary>
        <Script src="/tracker.js" type="module" strategy="lazyOnload" />
      </body>
    </html>
  );
}

