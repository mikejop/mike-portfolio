export default function Footer() {
  const socialLinks = [
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
      href: "https://instagram.com/mike_flmmkr",
      label: "Instagram"
    },
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
      ),
      href: "https://www.youtube.com/@mikeflmmkr",
      label: "YouTube"
    },
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
      href: "https://www.linkedin.com/in/mkes8/",
      label: "LinkedIn"
    },
  ];

  return (
    <footer className="bg-[#f5f5f7] border-t border-[#e0e0e0] py-12 md:py-20 text-[#1d1d1f]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12 md:mb-16">
          {/* Brand info */}
          <div className="md:col-span-2">
            <a href="#" className="flex flex-col select-none mb-4">
              <span className="font-sans text-lg font-bold tracking-tight text-[#1d1d1f]">
                MICHAEL <span className="text-[#0066cc]">OLIVEIRA</span>
              </span>
              <span className="font-sans text-[8px] uppercase tracking-widest text-[#7a7a7a] -mt-0.5">
                Direção de Fotografia & Color Grading
              </span>
            </a>
            <p className="text-[#7a7a7a] font-sans text-sm max-w-sm leading-relaxed">
              Mentorias inloco e consultoria de workflows para elevar o padrão estético e operacional da sua produção de vídeo corporativo.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-sans text-[10px] uppercase tracking-wider text-[#1d1d1f]/40 font-bold mb-4">
              Navegação
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="#recebe" className="text-sm text-[#7a7a7a] hover:text-[#0066cc] transition-colors font-medium">
                  Mentoria
                </a>
              </li>
              <li>
                <a href="#pacotes" className="text-sm text-[#7a7a7a] hover:text-[#0066cc] transition-colors font-medium">
                  Pacotes
                </a>
              </li>
              <li>
                <a href="#mentor" className="text-sm text-[#7a7a7a] hover:text-[#0066cc] transition-colors font-medium">
                  O Mentor
                </a>
              </li>
              <li>
                <a href="#faq" className="text-sm text-[#7a7a7a] hover:text-[#0066cc] transition-colors font-medium">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Direct */}
          <div>
            <h3 className="font-sans text-[10px] uppercase tracking-wider text-[#1d1d1f]/40 font-bold mb-4">
              Redes Sociais
            </h3>
            <div className="flex gap-3 mb-6">
              {socialLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#7a7a7a] hover:text-[#0066cc] hover:bg-white transition-colors p-2 bg-white/60 rounded-md border border-black/[0.05]"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
            <p className="text-xs text-[#7a7a7a] font-sans font-medium">
              contato@michaeloliveira.online
            </p>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-black/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-xs text-[#7a7a7a] font-sans">
            © 2026 Michael Oliveira. Todos os direitos reservados.
          </p>
          <a
            href="https://michaeloliveira.online"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#7a7a7a] hover:text-[#0066cc] transition-colors font-sans font-medium"
          >
            michaeloliveira.online
          </a>
        </div>


      </div>
    </footer>
  );
}

