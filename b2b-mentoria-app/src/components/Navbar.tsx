"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Mentoria", href: "#recebe" },
    { label: "Pacotes", href: "#pacotes" },
    { label: "O Mentor", href: "#mentor" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
          isScrolled
            ? "bg-black/85 backdrop-blur-md border-white/10 py-3.5 shadow-sm"
            : "bg-transparent border-transparent py-5"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex flex-col select-none group">
            <span className="font-sans text-lg font-bold tracking-tight text-white transition-colors">
              MICHAEL <span className="text-[#0066cc]">OLIVEIRA</span>
            </span>
            <span className="font-sans text-[7px] uppercase tracking-widest text-white/50 -mt-0.5">
              Direção de Fotografia & Color Grading
            </span>
          </a>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-sans text-xs text-white/70 hover:text-white transition-colors tracking-wide"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA (Desktop) */}
          <div className="hidden md:block">
            <a
              href="#contato"
              className="bg-accent-primary text-white px-4 py-1.5 font-sans text-xs font-medium rounded-full hover:bg-accent-secondary active:scale-95 transition-all duration-150 inline-block"
            >
              Solicitar proposta
            </a>
          </div>

          {/* Hamburger Menu Trigger (Mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:text-accent-primary transition-colors p-1"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-lg md:hidden flex flex-col justify-center items-center gap-8 transition-all duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <nav className="flex flex-col items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-sans text-xl text-white/70 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#contato"
          onClick={() => setIsMobileMenuOpen(false)}
          className="bg-accent-primary text-white px-6 py-2.5 font-sans text-sm font-medium rounded-full hover:bg-accent-secondary active:scale-95 transition-all"
        >
          Solicitar proposta
        </a>
      </div>
    </>
  );
}

