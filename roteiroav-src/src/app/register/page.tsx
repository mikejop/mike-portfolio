"use client";

import { useEffect, useRef } from 'react';

export default function FormPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Escuta mensagens do iframe se houver sistema de redirecionamento manual
    const handleMessage = (event: MessageEvent) => {
      // Logic for redirect if needed
      if (event.data === 'registration-success') {
        window.location.href = '/roteiroav/';
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="w-full h-screen bg-[#111113] overflow-hidden">
      <iframe
        ref={iframeRef}
        src="/cadastro-dojo.html"
        className="w-full h-full border-none"
        title="Cadastro Dojo"
      />
    </div>
  );
}
