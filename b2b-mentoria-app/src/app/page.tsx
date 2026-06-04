import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import CredibilityBar from "@/components/sections/CredibilityBar";
import PainPoints from "@/components/sections/PainPoints";
import AboutMentor from "@/components/sections/AboutMentor";
import WhatYouGet from "@/components/sections/WhatYouGet";
import Packages from "@/components/sections/Packages";
import InfoSaaS from "@/components/sections/InfoSaaS";
import Testimonials from "@/components/sections/Testimonials";
import FAQ from "@/components/sections/FAQ";
import ContactCTA from "@/components/sections/ContactCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      {/* Navigation Header */}
      <Navbar />

      <main className="flex-1">
        {/* Section 1: Hero (Above the fold) */}
        <Hero />

        {/* Section 2: Credibility Bar */}
        <CredibilityBar />

        {/* Section 3: Diagnostic of Pain Points */}
        <PainPoints />

        {/* Section 4: The Mentor */}
        <AboutMentor />

        {/* Section 5: What You Get */}
        <WhatYouGet />

        {/* Section 6: Packages and Pricing */}
        <Packages />

        {/* Section 7: InfoSaaS Tools */}
        <InfoSaaS />

        {/* Section 8: Testimonials */}
        <Testimonials />

        {/* Section 9: FAQ */}
        <FAQ />

        {/* Section 10: Final CTA and Contact Form */}
        <ContactCTA />
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
