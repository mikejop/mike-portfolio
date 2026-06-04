import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Mentoria de Direção de Fotografia & Color Grading | Michael Oliveira",
  description: "Mentorias inloco de produção audiovisual de alta qualidade para pequenas e médias empresas. Direção de fotografia, color grading e estruturação de produtora com Michael Oliveira.",
  openGraph: {
    title: "Mentoria de Direção de Fotografia & Color Grading | Michael Oliveira",
    description: "Mentorias inloco de produção audiovisual de alta qualidade para pequenas e médias empresas.",
    url: "https://michaeloliveira.online/b2btraining",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="bg-bg-primary text-text-primary min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Course",
                  "@id": "https://michaeloliveira.online/b2btraining#course",
                  "name": "Mentoria & Treinamento de Vídeo Corporativo e Audiovisual",
                  "description": "Mentoria inloco e consultoria de workflows para equipes de vídeo corporativas. Aprenda direção de fotografia, color grading no DaVinci Resolve e estruturação de produtoras internas.",
                  "provider": {
                    "@type": "Person",
                    "name": "Michael Oliveira",
                    "url": "https://michaeloliveira.online"
                  },
                  "educationalCredentialAwarded": "Certificação em Produção Audiovisual Corporativa",
                  "hasCourseInstance": {
                    "@type": "CourseInstance",
                    "courseMode": "In-person",
                    "courseWorkload": "PT20H",
                    "instructor": {
                      "@type": "Person",
                      "name": "Michael Oliveira",
                      "jobTitle": "Diretor de Fotografia e Colorista",
                      "sameAs": [
                        "https://instagram.com/mike_flmmkr",
                        "https://www.youtube.com/@mikeflmmkr",
                        "https://www.linkedin.com/in/mkes8/"
                      ]
                    }
                  }
                },
                {
                  "@type": "ProfessionalService",
                  "@id": "https://michaeloliveira.online/b2btraining#service",
                  "name": "Michael Oliveira Mentoria Audiovisual",
                  "description": "Mentorias inloco de produção audiovisual corporativa e direção de fotografia para empresas.",
                  "url": "https://michaeloliveira.online/b2btraining",
                  "telephone": "+5511994822209",
                  "priceRange": "$$$",
                  "address": {
                    "@type": "PostalAddress",
                    "addressCountry": "BR",
                    "addressRegion": "SP"
                  },
                  "image": "https://michaeloliveira.online/src/assets/michael_oliveira.jpg"
                }
              ]
            })
          }}
        />
        {children}
      </body>
    </html>
  );
}


