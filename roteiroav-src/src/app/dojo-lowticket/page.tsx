"use client";

import { useEffect } from "react";
import Head from "next/head";

export default function DojoLowTicketPage() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 70);
        }
      });
    }, { threshold: 0.07 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    const pills = document.querySelectorAll('.nav-pill');
    const handleScroll = () => {
      const p2 = document.getElementById('part2');
      if (p2) {
        if (window.scrollY >= p2.offsetTop - 200) {
          pills[0].classList.remove('active');
          pills[1].classList.add('active');
        } else {
          pills[0].classList.add('active');
          pills[1].classList.remove('active');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      obs.disconnect();
    };
  }, []);

  return (
    <div className="landing-page-root">
      <style jsx global>{`
        :root {
          --bg:       #07070a;
          --bg2:      #0f0f15;
          --bg3:      #161622;
          --gold:     #d4a843;
          --gold-lt:  #f0c86a;
          --gold-dim: rgba(212,168,67,0.12);
          --teal:     #2ae8c4;
          --teal-dim: rgba(42,232,196,0.10);
          --white:    #f5f3ee;
          --muted:    #777;
          --border:   rgba(255,255,255,0.07);
          --r:        4px;
        }

        .landing-page-root {
          background: var(--bg);
          color: var(--white);
          font-family: 'Outfit', sans-serif;
          overflow-x: hidden;
          min-height: 100vh;
          position: relative;
        }

        .landing-page-root::after {
          content:''; position:fixed; inset:0; pointer-events:none; z-index:9999;
          opacity:.3;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
        }

        nav {
          position:fixed; top:0; left:0; right:0; z-index:200;
          display:flex; align-items:center; justify-content:space-between;
          padding:1.1rem 4%;
          backdrop-filter:blur(18px);
          background:rgba(7,7,10,.85);
          border-bottom:1px solid var(--border);
        }
        .nav-logo {
          font-family:'Space Mono',monospace;
          font-size:1rem; font-weight:700; color:var(--gold);
          letter-spacing:.06em;
        }
        .nav-pills { display:flex; gap:.4rem; }
        .nav-pill {
          padding:.35rem .95rem;
          border:1px solid var(--border); border-radius:100px;
          font-size:.75rem; font-weight:500; color:var(--muted);
          text-decoration:none; transition:all .2s;
        }
        .nav-pill:hover, .nav-pill.active {
          border-color:var(--gold); color:var(--gold);
          background:var(--gold-dim);
        }

        .hero {
          min-height:100vh;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:9rem 4% 7rem;
          position:relative; overflow:hidden; text-align:center;
        }
        .hero-grid {
          position:absolute; inset:0; pointer-events:none;
          background-image:
            linear-gradient(rgba(212,168,67,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,168,67,.04) 1px, transparent 1px);
          background-size:56px 56px;
          mask-image:radial-gradient(ellipse 70% 60% at 50% 50%, black 10%, transparent 75%);
        }
        .hero-glow {
          position:absolute; border-radius:50%; filter:blur(110px); pointer-events:none;
        }
        .hero-glow-1 { width:550px; height:550px; background:rgba(212,168,67,.07); top:-200px; left:-180px; }
        .hero-glow-2 { width:380px; height:380px; background:rgba(42,232,196,.04); bottom:-80px; right:-80px; }

        .hero-badge {
          display:inline-flex; align-items:center; gap:.5rem;
          padding:.38rem 1rem;
          border:1px solid var(--gold); border-radius:100px;
          font-family:'Space Mono',monospace;
          font-size:.68rem; letter-spacing:.1em; color:var(--gold);
          margin-bottom:2.5rem;
          animation:fadeUp .7s ease both;
        }
        .hero-badge-dot {
          width:6px; height:6px; border-radius:50%;
          background:var(--gold); animation:blink 1.6s infinite;
        }
        .hero-title {
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(3.2rem,8vw,6.8rem);
          font-weight:300; line-height:1; letter-spacing:-.02em;
          animation:fadeUp .7s .1s ease both;
        }
        .hero-title em { font-style:italic; color:var(--gold); }
        .hero-title strong { font-weight:700; }
        .hero-sub {
          max-width:580px; margin:2rem auto 3rem;
          font-size:1.05rem; font-weight:300;
          color:rgba(245,243,238,.6); line-height:1.75;
          animation:fadeUp .7s .2s ease both;
        }
        .hero-ctas {
          display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;
          animation:fadeUp .7s .3s ease both;
        }

        .btn {
          display:inline-flex; align-items:center; gap:.5rem;
          padding:.85rem 2rem; border-radius:var(--r);
          font-size:.88rem; font-weight:600;
          text-decoration:none; cursor:pointer; border:none;
          transition:all .22s;
        }
        .btn-gold { background:var(--gold); color:#07070a; }
        .btn-gold:hover { background:var(--gold-lt); transform:translateY(-2px); box-shadow:0 8px 28px rgba(212,168,67,.28); }
        .btn-outline { background:transparent; border:1px solid var(--border); color:var(--white); }
        .btn-outline:hover { border-color:var(--gold); color:var(--gold); }

        .sec-label {
          display:inline-flex; align-items:center; gap:.75rem;
          font-family:'Space Mono',monospace;
          font-size:.66rem; letter-spacing:.2em; text-transform:uppercase;
          color:var(--gold); margin-bottom:1.4rem;
        }
        .sec-label::before { content:''; display:block; width:28px; height:1px; background:var(--gold); }

        #part1 { padding:8rem 4% 4rem; }

        .part1-header {
          max-width:1200px; margin:0 auto 5rem;
          display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:end;
        }
        .part-title {
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(2.6rem,5vw,4.2rem);
          font-weight:300; line-height:1.05; letter-spacing:-.02em;
        }
        .part-title em { font-style:italic; color:var(--gold); }
        .part-desc {
          font-size:.95rem; font-weight:300;
          color:rgba(245,243,238,.6); line-height:1.8;
          border-left:2px solid var(--gold); padding-left:1.4rem;
        }

        .def-box {
          max-width:1200px; margin:0 auto 5rem;
          background:var(--bg2); border:1px solid var(--border);
          border-left:3px solid var(--gold); border-radius:var(--r);
          padding:2.5rem 3rem;
          display:grid; grid-template-columns:160px 1fr; gap:3rem; align-items:center;
        }
        .def-inner { text-align:center; }
        .def-lbl {
          font-family:'Space Mono',monospace;
          font-size:.62rem; letter-spacing:.18em; color:var(--gold); margin-bottom:.5rem;
        }
        .def-range {
          font-family:'Cormorant Garamond',serif;
          font-size:2.4rem; font-weight:700; color:var(--gold); opacity:.4; line-height:1;
        }
        .def-text { font-size:1rem; line-height:1.8; color:rgba(245,243,238,.8); }
        .def-text strong { color:var(--gold); font-weight:600; }

        .strat-grid {
          max-width:1200px; margin:0 auto 6rem;
          display:grid; grid-template-columns:repeat(3,1fr);
          gap:1px; background:var(--border);
          border:1px solid var(--border); border-radius:var(--r); overflow:hidden;
        }
        .strat-card {
          background:var(--bg); padding:2.5rem;
          position:relative; overflow:hidden; transition:background .3s;
        }
        .strat-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg,var(--gold),transparent);
          transform:scaleX(0); transform-origin:left; transition:transform .4s;
        }
        .strat-card:hover { background:var(--bg2); }
        .strat-card:hover::before { transform:scaleX(1); }
        .strat-num {
          font-family:'Space Mono',monospace;
          font-size:.62rem; letter-spacing:.14em; color:var(--gold); margin-bottom:1.4rem;
        }
        .strat-ico { margin-bottom:1rem; color:var(--gold); }
        .strat-ico svg { width:28px; height:28px; stroke:var(--gold); fill:none; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
        .strat-title {
          font-family:'Cormorant Garamond',serif;
          font-size:1.55rem; font-weight:600; line-height:1.2; margin-bottom:.9rem;
        }
        .strat-desc { font-size:.88rem; line-height:1.72; color:rgba(245,243,238,.6); }
        .strat-tag {
          display:inline-block; margin-top:1.2rem;
          padding:.22rem .7rem;
          background:var(--gold-dim); border-radius:100px;
          font-size:.68rem; color:var(--gold); font-family:'Space Mono',monospace;
        }

        .funnel-sec { max-width:1200px; margin:0 auto 6rem; }
        .funnel-title {
          font-family:'Cormorant Garamond',serif;
          font-size:2.4rem; font-weight:300; text-align:center; margin-bottom:3rem;
        }
        .funnel-title em { font-style:italic; color:var(--gold); }
        .funnel-steps { display:flex; flex-direction:column; }
        .funnel-step {
          display:grid; grid-template-columns:56px 1fr 180px;
          gap:2rem; align-items:center;
          padding:1.8rem 2rem;
          background:var(--bg2); border:1px solid var(--border); border-bottom:none;
          transition:background .3s;
        }
        .funnel-step:first-child { border-radius:var(--r) var(--r) 0 0; }
        .funnel-step:last-child  { border-bottom:1px solid var(--border); border-radius:0 0 var(--r) var(--r); }
        .funnel-step:hover { background:var(--bg3); }
        .funnel-num {
          width:46px; height:46px; border:1px solid var(--gold); border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-family:'Space Mono',monospace; font-size:.85rem; color:var(--gold);
        }
        .funnel-step h4 { font-size:1.05rem; font-weight:600; margin-bottom:.35rem; }
        .funnel-step p { font-size:.87rem; color:rgba(245,243,238,.6); line-height:1.55; }
        .funnel-price { text-align:right; }
        .funnel-price .lbl { font-family:'Space Mono',monospace; font-size:.6rem; letter-spacing:.1em; color:var(--muted); margin-bottom:.3rem; }
        .funnel-price .val {
          font-family:'Cormorant Garamond',serif;
          font-size:1.7rem; font-weight:700; color:var(--gold);
        }

        .int-sec { max-width:1200px; margin:0 auto 6rem; }
        .int-grid { display:grid; grid-template-columns:1fr 1fr; gap:2rem; margin-top:3rem; }
        .int-card {
          background:var(--bg2); border:1px solid var(--border);
          border-radius:var(--r); padding:2.5rem; position:relative; overflow:hidden;
        }
        .int-card::after {
          content:''; position:absolute; bottom:0; right:0;
          width:120px; height:120px;
          background:radial-gradient(circle,var(--teal-dim),transparent 70%);
          border-radius:50%;
        }
        .int-card-head {
          display:flex; align-items:center; gap:.8rem; margin-bottom:1.4rem;
        }
        .int-card-head svg { width:20px; height:20px; stroke:var(--teal); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .int-card h3 {
          font-family:'Cormorant Garamond',serif;
          font-size:1.45rem; font-weight:600;
        }
        .int-list { list-style:none; }
        .int-list li {
          display:flex; align-items:flex-start; gap:.75rem;
          padding:.75rem 0; border-bottom:1px solid var(--border);
          font-size:.87rem; color:rgba(245,243,238,.75); line-height:1.55;
        }
        .int-list li:last-child { border-bottom:none; }
        .int-list li svg { width:14px; height:14px; stroke:var(--teal); fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; flex-shrink:0; margin-top:3px; }

        .psych-sec {
          max-width:1200px; margin:0 auto 6rem;
          background:var(--bg2); border:1px solid var(--border);
          border-radius:var(--r); padding:4rem;
        }
        .psych-title {
          font-family:'Cormorant Garamond',serif;
          font-size:2rem; font-weight:300; text-align:center; margin-bottom:3rem;
        }
        .psych-title em { font-style:italic; color:var(--gold); }
        .psych-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:2rem; }
        .psych-item { text-align:center; }
        .psych-val {
          font-family:'Cormorant Garamond',serif;
          font-size:3.4rem; font-weight:700; color:var(--gold); line-height:1; margin-bottom:.5rem;
        }
        .psych-val span { font-size:1.5rem; }
        .psych-lbl { font-size:.82rem; color:rgba(245,243,238,.55); line-height:1.45; }

        .divider {
          max-width:1200px; margin:0 auto 8rem;
          height:1px;
          background:linear-gradient(90deg,transparent,var(--gold),transparent);
        }

        #part2 { padding:2rem 4% 8rem; }

        .part2-header { max-width:1200px; margin:0 auto 6rem; text-align:center; }
        .dojo-badge {
          display:inline-flex; align-items:center; gap:.6rem;
          background:var(--teal-dim); border:1px solid rgba(42,232,196,.3);
          border-radius:100px; padding:.38rem 1.1rem;
          font-family:'Space Mono',monospace; font-size:.68rem;
          letter-spacing:.1em; color:var(--teal); margin-bottom:1.8rem;
        }
        .dojo-badge svg { width:14px; height:14px; stroke:var(--teal); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .part2-title {
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(2.4rem,5vw,4.2rem);
          font-weight:300; line-height:1.1; letter-spacing:-.02em; margin-bottom:1.4rem;
        }
        .part2-title em { font-style:italic; color:var(--teal); }
        .part2-desc { max-width:580px; margin:0 auto; font-size:.95rem; color:rgba(245,243,238,.6); line-height:1.75; }

        .eco-sec { max-width:1200px; margin:0 auto 6rem; }
        .eco-heading {
          font-family:'Cormorant Garamond',serif;
          font-size:2rem; font-weight:300; margin-bottom:2.5rem;
        }
        .eco-heading em { font-style:italic; color:var(--teal); }
        .eco-grid {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:1px; background:var(--border);
          border:1px solid var(--border); border-radius:var(--r); overflow:hidden;
        }
        .eco-item {
          background:var(--bg); padding:1.8rem 1.4rem;
          text-align:center; transition:background .3s;
        }
        .eco-item:hover { background:var(--bg2); }
        .eco-ico { margin-bottom:.8rem; display:flex; justify-content:center; }
        .eco-ico svg { width:24px; height:24px; stroke:var(--teal); fill:none; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
        .eco-name {
          font-family:'Space Mono',monospace;
          font-size:.68rem; letter-spacing:.1em; color:var(--teal); margin-bottom:.4rem;
        }
        .eco-desc { font-size:.82rem; color:rgba(245,243,238,.5); line-height:1.4; }

        .apply-sec { max-width:1200px; margin:0 auto 6rem; }
        .apply-heading {
          font-family:'Cormorant Garamond',serif;
          font-size:2.4rem; font-weight:300; margin-bottom:3rem;
        }
        .apply-heading em { font-style:italic; color:var(--gold); }
        .apply-item {
          display:grid; grid-template-columns:70px 1fr;
          border:1px solid var(--border); border-bottom:none;
          background:var(--bg2);
        }
        .apply-item:first-of-type { border-radius:var(--r) var(--r) 0 0; }
        .apply-item:last-of-type  { border-bottom:1px solid var(--border); border-radius:0 0 var(--r) var(--r); }
        .apply-n {
          border-right:1px solid var(--border);
          background:var(--bg);
          display:flex; align-items:center; justify-content:center;
          font-family:'Cormorant Garamond',serif;
          font-size:2.2rem; font-weight:700; color:var(--gold); opacity:.22;
        }
        .apply-body { padding:2.2rem 2.5rem; }
        .apply-tag {
          font-family:'Space Mono',monospace;
          font-size:.62rem; letter-spacing:.14em; color:var(--teal); margin-bottom:.7rem;
        }
        .apply-body h3 { font-size:1.12rem; font-weight:600; margin-bottom:.65rem; }
        .apply-body p { font-size:.88rem; color:rgba(245,243,238,.65); line-height:1.72; margin-bottom:.9rem; }
        .chips { display:flex; flex-wrap:wrap; gap:.4rem; }
        .chip {
          padding:.24rem .75rem;
          background:var(--teal-dim); border:1px solid rgba(42,232,196,.2);
          border-radius:100px; font-size:.72rem; color:var(--teal);
        }

        .price-sec { max-width:1200px; margin:0 auto 6rem; }
        .price-heading {
          font-family:'Cormorant Garamond',serif;
          font-size:2.4rem; font-weight:300; margin-bottom:3rem;
        }
        .price-heading em { font-style:italic; color:var(--gold); }
        .price-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem; }
        .price-card {
          background:var(--bg2); border:1px solid var(--border);
          border-radius:var(--r); padding:2.5rem;
          transition:all .3s; position:relative; overflow:hidden;
        }
        .price-card:hover { border-color:rgba(212,168,67,.3); transform:translateY(-4px); }
        .price-card.feat { border-color:var(--gold); background:linear-gradient(135deg,var(--bg2),rgba(212,168,67,.05)); }
        .price-lbl {
          font-family:'Space Mono',monospace;
          font-size:.62rem; letter-spacing:.18em; color:var(--muted); margin-bottom:.9rem;
        }
        .feat .price-lbl { color:var(--gold); }
        .price-name {
          font-family:'Cormorant Garamond',serif;
          font-size:1.75rem; font-weight:600; margin-bottom:.4rem;
        }
        .price-amount {
          font-family:'Cormorant Garamond',serif;
          font-size:3.4rem; font-weight:700; color:var(--gold); line-height:1;
          margin:1.4rem 0 .3rem;
        }
        .price-amount small { font-size:1.1rem; font-weight:400; color:var(--muted); }
        .price-period { font-size:.78rem; color:var(--muted); margin-bottom:1.8rem; }
        .price-feats { list-style:none; }
        .price-feats li {
          display:flex; align-items:center; gap:.55rem;
          padding:.55rem 0; border-top:1px solid var(--border);
          font-size:.83rem; color:rgba(245,243,238,.7);
        }
        .price-feats li svg { width:14px; height:14px; stroke:var(--gold); fill:none; stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round; flex-shrink:0; }
        .price-btn {
          display:block; width:100%; text-align:center;
          margin-top:1.8rem; padding:.82rem;
          border-radius:var(--r); font-size:.88rem; font-weight:600;
          text-decoration:none; cursor:pointer; border:none; transition:all .22s;
        }
        .price-card .price-btn { background:transparent; border:1px solid var(--border); color:var(--white); }
        .price-card .price-btn:hover { border-color:var(--gold); color:var(--gold); }
        .feat .price-btn { background:var(--gold); color:#07070a; border:none; }
        .feat .price-btn:hover { background:var(--gold-lt); }

        .engine-sec { max-width:1200px; margin:0 auto 6rem; }
        .engine-heading {
          font-family:'Cormorant Garamond',serif;
          font-size:2.4rem; font-weight:300; margin-bottom:3rem;
        }
        .engine-heading em { font-style:italic; color:var(--teal); }
        .engine-flow { display:grid; grid-template-columns:repeat(5,1fr); }
        .engine-step {
          background:var(--bg2); border:1px solid var(--border); border-right:none;
          padding:2rem 1.4rem; text-align:center;
          position:relative; transition:background .3s;
        }
        .engine-step:last-child { border-right:1px solid var(--border); }
        .engine-step:hover { background:var(--bg3); }
        .engine-step::after {
          content:'›'; position:absolute; right:-12px; top:50%; transform:translateY(-50%);
          font-size:1.4rem; color:var(--gold); z-index:2;
          font-family:'Cormorant Garamond',serif;
        }
        .engine-step:last-child::after { display:none; }
        .engine-ico { display:flex; justify-content:center; margin-bottom:.8rem; }
        .engine-ico svg { width:22px; height:22px; stroke:var(--gold); fill:none; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
        .engine-lbl { font-family:'Space Mono',monospace; font-size:.58rem; letter-spacing:.1em; color:var(--gold); margin-bottom:.4rem; }
        .engine-title { font-size:.88rem; font-weight:600; margin-bottom:.4rem; }
        .engine-desc { font-size:.78rem; color:rgba(245,243,238,.5); line-height:1.4; }

        .intl-sec {
          max-width:1200px; margin:0 auto 6rem;
          background:var(--bg2); border:1px solid var(--border);
          border-radius:var(--r); padding:4rem;
        }
        .intl-heading {
          font-family:'Cormorant Garamond',serif;
          font-size:2rem; font-weight:300; margin-bottom:1rem;
        }
        .intl-heading em { font-style:italic; color:var(--teal); }
        .intl-sub { font-size:.9rem; color:rgba(245,243,238,.55); line-height:1.7; margin-bottom:2.5rem; }
        .intl-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1.5rem; }
        .intl-market {
          background:var(--bg3); border:1px solid var(--border);
          border-radius:var(--r); padding:1.6rem;
          text-align:center; transition:all .3s;
        }
        .intl-market:hover { border-color:rgba(42,232,196,.3); }
        .intl-ico { display:flex; justify-content:center; margin-bottom:.8rem; }
        .intl-ico svg { width:22px; height:22px; stroke:var(--teal); fill:none; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
        .intl-mname {
          font-family:'Space Mono',monospace;
          font-size:.68rem; letter-spacing:.1em; color:var(--teal); margin-bottom:.4rem;
        }
        .intl-price {
          font-family:'Cormorant Garamond',serif;
          font-size:1.9rem; font-weight:700; color:var(--gold);
        }
        .intl-price-sub { font-size:.78rem; color:var(--muted); }

        .tactics-sec { max-width:1200px; margin:0 auto 6rem; }
        .tactics-heading {
          font-family:'Cormorant Garamond',serif;
          font-size:2.4rem; font-weight:300; margin-bottom:3rem;
        }
        .tactics-heading em { font-style:italic; color:var(--gold); }
        .tactics-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }
        .tactic {
          background:var(--bg2); border:1px solid var(--border);
          border-radius:var(--r); padding:2rem;
          display:flex; gap:1.4rem; transition:all .3s;
        }
        .tactic:hover { border-color:rgba(212,168,67,.3); }
        .tactic-ico {
          width:46px; height:46px; flex-shrink:0;
          background:var(--gold-dim); border-radius:var(--r);
          display:flex; align-items:center; justify-content:center;
        }
        .tactic-ico svg { width:22px; height:22px; stroke:var(--gold); fill:none; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
        .tactic-body h4 { font-size:1rem; font-weight:600; margin-bottom:.5rem; }
        .tactic-body p { font-size:.86rem; color:rgba(245,243,238,.6); line-height:1.62; }
        .tactic-tag {
          display:inline-block; margin-top:.75rem;
          font-family:'Space Mono',monospace;
          font-size:.62rem; letter-spacing:.08em; color:var(--gold);
          background:var(--gold-dim); padding:.2rem .6rem; border-radius:100px;
        }

        .cta-final {
          max-width:1200px; margin:0 auto 0;
          text-align:center; padding:6rem 4%;
          position:relative; overflow:hidden;
          background:var(--bg2); border:1px solid var(--border);
          border-radius:var(--r);
        }
        .cta-final::before {
          content:''; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:580px; height:580px;
          background:radial-gradient(circle,rgba(212,168,67,.05),transparent 70%);
          border-radius:50%;
        }
        .cta-final-title {
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(2.2rem,5vw,3.8rem);
          font-weight:300; line-height:1.1; margin-bottom:1.4rem;
        }
        .cta-final-title em { font-style:italic; color:var(--gold); }
        .cta-final-sub {
          font-size:.96rem; color:rgba(245,243,238,.6); line-height:1.72;
          max-width:480px; margin:0 auto 2.8rem;
        }
        .cta-btns { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; }

        footer {
          border-top:1px solid var(--border); padding:2.5rem 4%;
          display:flex; align-items:center; justify-content:space-between;
          max-width:1200px; margin:3rem auto 0;
        }
        .footer-logo { font-family:'Space Mono',monospace; font-size:.95rem; color:var(--gold); }
        .footer-copy { font-size:.76rem; color:var(--muted); }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes blink {
          0%,100% { opacity:1; } 50% { opacity:.25; }
        }
        .reveal { opacity:0; transform:translateY(28px); transition:opacity .65s ease, transform .65s ease; }
        .reveal.visible { opacity:1; transform:translateY(0); }

        @media(max-width:900px){
          .part1-header,.int-grid,.tactics-grid { grid-template-columns:1fr; }
          .strat-grid,.engine-flow { grid-template-columns:1fr; }
          .strat-grid { gap:1px; }
          .engine-step { border-right:1px solid var(--border); }
          .engine-step::after { display:none; }
          .psych-grid,.eco-grid { grid-template-columns:repeat(2,1fr); }
          .price-grid,.intl-grid { grid-template-columns:1fr; }
          .def-box { grid-template-columns:1fr; gap:1rem; }
          nav .nav-pills { display:none; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <span className="nav-logo">DOJO × LOW-TICKET</span>
        <div className="nav-pills">
          <a href="#part1" className="nav-pill active">Parte 1 — Estratégias</a>
          <a href="#part2" className="nav-pill">Parte 2 — Aplicação Dojo</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid"></div>
        <div className="hero-glow hero-glow-1"></div>
        <div className="hero-glow hero-glow-2"></div>

        <div className="hero-badge">
          <span className="hero-badge-dot"></span>
          Guia Completo · Brasil &amp; Internacional
        </div>

        <h1 className="hero-title">
          A arte de vender<br />
          <em>low-ticket</em> <strong>que escala</strong>
        </h1>

        <p className="hero-sub">
          Destrinchando as melhores estratégias do mercado brasileiro e internacional — e como a Dojo pode usar cada uma delas para crescer com consistência.
        </p>

        <div className="hero-ctas">
          <a href="#part1" className="btn btn-gold">Ver estratégias</a>
          <a href="#part2" className="btn btn-outline">Como aplicar na Dojo</a>
        </div>
      </section>

      {/* PART 1 */}
      <section id="part1">
        <div className="part1-header reveal">
          <div>
            <div className="sec-label">Parte 01 — Estratégias</div>
            <h2 className="part-title">O que os melhores ensinam sobre vender <em>low-ticket</em></h2>
          </div>
          <p className="part-desc">
            Tanto no Brasil quanto no mercado internacional, as estratégias de low-ticket convergem para o mesmo princípio: transformar desconhecidos em compradores com o menor atrito possível, para depois conduzi-los a ofertas maiores. O que muda é o contexto, o preço e as plataformas.
          </p>
        </div>

        <div className="def-box reveal">
          <div className="def-inner">
            <div className="def-lbl">Faixa de preço</div>
            <div className="def-range">R$7–97</div>
          </div>
          <p className="def-text">
            <strong>Low-ticket</strong> é um produto digital vendido a um preço acessível — geralmente entre R$7 e R$97 — com o objetivo de <strong>reduzir a barreira de entrada</strong> do cliente. Não é sobre ganhar dinheiro na primeira venda. É sobre transformar curiosos em compradores reais, qualificar sua lista e <strong>financiar seu tráfego pago</strong> enquanto constrói confiança para ofertas de maior valor.
          </p>
        </div>

        <div className="strat-grid reveal">
          {/* Strat items... abbreviated for brevity but following the pattern */}
          <div className="strat-card">
            <div className="strat-num">01 / 06</div>
            <div className="strat-ico">
              <svg viewBox="0 0 24 24"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
            </div>
            <h3 className="strat-title">Substitua a isca grátis pelo low-ticket</h3>
            <p className="strat-desc">Em vez de oferecer e-books gratuitos para capturar leads, cobre um valor simbólico (R$9–R$27). Quem paga, mesmo que pouco, demonstra intenção real. Você qualifica a lista, gera caixa e reduz o CAC para futuros produtos.</p>
            <span className="strat-tag">Lead Generation</span>
          </div>

          <div className="strat-card">
            <div className="strat-num">02 / 06</div>
            <div className="strat-ico">
              <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
            </div>
            <h3 className="strat-title">O Funil Auto-Liquidante (SLO)</h3>
            <p className="strat-desc">O Self-Liquidating Offer é a estratégia mais poderosa: seu produto low-ticket cobre o custo do tráfego pago. Investe R$100 em anúncios, vende o suficiente para pagar os anúncios — e ainda ganha leads qualificados de graça.</p>
            <span className="strat-tag">Tráfego Pago</span>
          </div>

          <div className="strat-card">
            <div className="strat-num">03 / 06</div>
            <div className="strat-ico">
              <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
            </div>
            <h3 className="strat-title">Order Bump + Upsell imediato</h3>
            <p className="strat-desc">No momento do checkout, ofereça um complemento a 30–50% do valor principal (order bump). Na página de obrigado, ofereça o próximo nível do produto (upsell de R$97–R$197).</p>
            <span className="strat-tag">Checkout</span>
          </div>

          <div className="strat-card">
            <div className="strat-num">04 / 06</div>
            <div className="strat-ico">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <h3 className="strat-title">Estratégia Perpétua — venda todo dia</h3>
            <p className="strat-desc">Não faça lançamentos episódicos. Estruture um funil sempre ativo, com tráfego contínuo, sequência de e-mails automatizada e conteúdo evergreen. Teste páginas constantemente.</p>
            <span className="strat-tag">Automação</span>
          </div>

          <div className="strat-card">
            <div className="strat-num">05 / 06</div>
            <div className="strat-ico">
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
            </div>
            <h3 className="strat-title">Programa de Afiliados e Parcerias</h3>
            <p className="strat-desc">Mais de 80% dos afiliados preferem produtos low-ticket — a conversão é alta e o volume compensa. Abra seu produto para afiliados e multiplique o alcance sem custo adicional.</p>
            <span className="strat-tag">Crescimento</span>
          </div>

          <div className="strat-card">
            <div className="strat-num">06 / 06</div>
            <div className="strat-ico">
              <svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
            </div>
            <h3 className="strat-title">Construa o ecossistema de confiança</h3>
            <p className="strat-desc">Low-ticket não é o destino — é o primeiro degrau. A lógica é: mini-curso → curso completo → mentoria → high-ticket. Cada produto prepara o cliente para o próximo.</p>
            <span className="strat-tag">Funil Completo</span>
          </div>
        </div>

        <div className="funnel-sec reveal">
          <h2 className="funnel-title">O Funil <em>Ideal</em> de Low-Ticket</h2>
          <div className="funnel-steps">
            <div className="funnel-step">
              <div className="funnel-num">01</div>
              <div>
                <h4>Tráfego Pago ou Orgânico</h4>
                <p>Anúncios no Meta/Google, conteúdo no Instagram/TikTok, SEO, parcerias. O objetivo é atrair o público certo.</p>
              </div>
              <div className="funnel-price"><div className="lbl">Custo</div><div className="val">Variável</div></div>
            </div>
            <div className="funnel-step">
              <div className="funnel-num">02</div>
              <div>
                <h4>Oferta Low-Ticket (Trip Wire)</h4>
                <p>Página de vendas simples, proposta irresistível, preço de impulso. Resolve um problema específico e entrega valor imediato.</p>
              </div>
              <div className="funnel-price"><div className="lbl">Preço BR</div><div className="val">R$27–97</div></div>
            </div>
            <div className="funnel-step">
              <div className="funnel-num">03</div>
              <div>
                <h4>Order Bump no Checkout</h4>
                <p>Um clique para adicionar um complemento ao pedido. Deve ser óbvio que faz sentido com a compra principal.</p>
              </div>
              <div className="funnel-price"><div className="lbl">Valor</div><div className="val">+30–50%</div></div>
            </div>
            <div className="funnel-step">
              <div className="funnel-num">04</div>
              <div>
                <h4>Upsell na Página de Obrigado</h4>
                <p>Logo após o pagamento, enquanto a euforia da compra está no pico, ofereça o produto completo ou o acesso à comunidade.</p>
              </div>
              <div className="funnel-price"><div className="lbl">Preço BR</div><div className="val">R$97–197</div></div>
            </div>
            <div className="funnel-step">
              <div className="funnel-num">05</div>
              <div>
                <h4>Sequência de E-mail (Nurturing)</h4>
                <p>7–14 e-mails entregando valor, construindo autoridade e conduzindo o novo comprador para a oferta principal.</p>
              </div>
              <div className="funnel-price"><div className="lbl">Converte para</div><div className="val">High ↑</div></div>
            </div>
          </div>
        </div>

        <div className="int-sec reveal">
          <h2 className="part-title">O que o mercado <em>internacional</em> ensina</h2>
          <div className="int-grid">
            <div className="int-card">
              <div className="int-card-head">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                <h3>Mercado Internacional</h3>
              </div>
              <ul className="int-list">
                <li><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>SLO já é mainstream: produto de $7–$27 cobre o custo do anúncio</li>
                <li><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>Stan Store, Gumroad e Whop como plataformas de baixo atrito</li>
                <li><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>Mini memberships como lead magnet pago: 30 dias por $7</li>
                <li><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>Bundles e stacks: pacote com 3–5 itens por preço unificado</li>
              </ul>
            </div>
            <div className="int-card">
              <div className="int-card-head">
                <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                <h3>Mercado Brasileiro</h3>
              </div>
              <ul className="int-list">
                <li><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>Ellen Salomão: trocar a lista grátis pelo low-ticket gera caixa</li>
                <li><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>Meta Advantage+ com IA para segmentação automática</li>
                <li><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>Order bumps de R$15–R$47 aumentam o ticket médio em 40-60%</li>
                <li><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>WhatsApp e Telegram como canais de vendas frequentes</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="psych-sec reveal">
          <h2 className="psych-title">A <em>psicologia</em> por trás dos números</h2>
          <div className="psych-grid">
            <div className="psych-item"><div className="psych-val">72<span>%</span></div><div className="psych-lbl">dos novos produtores em 2024 (Hotmart)</div></div>
            <div className="psych-item"><div className="psych-val">80<span>%</span></div><div className="psych-lbl">preferência dos afiliados por low-ticket</div></div>
            <div className="psych-item"><div className="psych-val">45<span>%</span></div><div className="psych-lbl">crescimento em materiais práticos 2025</div></div>
            <div className="psych-item"><div className="psych-val">3<span>×</span></div><div className="psych-lbl">mais chances de recompra após a 1ª venda</div></div>
          </div>
        </div>
        <div className="divider"></div>
      </section>

      {/* PART 2 */}
      <section id="part2">
        <div className="part2-header reveal">
          <div className="dojo-badge">
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            DOJO COMMUNITY
          </div>
          <h2 className="part2-title">Como a <em>Dojo</em> aplica<br />cada estratégia</h2>
          <p className="part2-desc">A Dojo já tem os ativos perfeitos: mini-cursos, workshops, masterclasses, ferramentas e uma comunidade ativa. Agora é estruturar o funil certo.</p>
        </div>

        <div className="eco-sec reveal">
          <h2 className="eco-heading">O ecossistema <em>Dojo</em> como ativo de vendas</h2>
          <div className="eco-grid">
            <div className="eco-item">
              <div className="eco-ico"><svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg></div>
              <div className="eco-name">Mini-Cursos</div>
              <div className="eco-desc">Produtos low-ticket autônomos</div>
            </div>
            <div className="eco-item">
              <div className="eco-ico"><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg></div>
              <div className="eco-name">Workshops</div>
              <div className="eco-desc">Alto valor percebido e preço de impulso</div>
            </div>
            <div className="eco-item">
              <div className="eco-ico"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg></div>
              <div className="eco-name">Masterclasses</div>
              <div className="eco-desc">Premium upsell imediato</div>
            </div>
            <div className="eco-item">
              <div className="eco-ico"><svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg></div>
              <div className="eco-name">Dojo Utilities</div>
              <div className="eco-desc">Ferramentas práticas e operacionais</div>
            </div>
          </div>
        </div>

        <div className="apply-sec reveal">
          <h2 className="apply-heading">Estratégia por estratégia</h2>
          <div className="apply-item">
            <div className="apply-n">1</div>
            <div className="apply-body">
              <div className="apply-tag">ESTRATÉGIA 01 — SUBSTITUA A ISCA GRÁTIS</div>
              <h3>Mini-cursos e workshops avulsos como produto de entrada</h3>
              <p>Crie workshops e mini-cursos avulsos por R$27–R$67. "Workshop: Como criar seu portfólio em 2h", "Mini-curso: Gestão de clientes".</p>
            </div>
          </div>
          <div className="apply-item">
            <div className="apply-n">2</div>
            <div className="apply-body">
              <div className="apply-tag">ESTRATÉGIA 02 — FUNIL SLO</div>
              <h3>Cresça com CAC zero</h3>
              <p>Invista em anúncios para um workshop por R$47. O objetivo é recuperar o custo do anúncio e adquirir membros qualificados.</p>
            </div>
          </div>
        </div>

        <div className="price-sec reveal">
          <h2 className="price-heading">Estrutura de preços <em>sugerida</em></h2>
          <div className="price-grid">
            <div className="price-card">
              <div className="price-lbl">ENTRADA · LOW-TICKET</div>
              <div className="price-name">Dojo Acesso</div>
              <div className="price-amount">R$<span>47</span></div>
              <div className="price-period">por workshop avulso</div>
              <button className="price-btn">Produto de entrada</button>
            </div>
            <div className="price-card feat">
              <div className="price-lbl">POPULAR · RECORRENTE</div>
              <div className="price-name">Dojo Completa</div>
              <div className="price-amount">R$<span>97</span></div>
              <div className="price-period">por mês</div>
              <button className="price-btn">Upsell natural</button>
            </div>
            <div className="price-card">
              <div className="price-lbl">PREMIUM · HIGH-TICKET</div>
              <div className="price-name">Dojo Masters</div>
              <div className="price-amount">R$<span>197</span><small>+</small></div>
              <div className="price-period">por evento premium</div>
              <button className="price-btn">Topo do funil</button>
            </div>
          </div>
        </div>

        <div className="cta-final reveal">
          <h2 className="cta-final-title">A Dojo já tem tudo<br />para <em>escalar</em></h2>
          <p className="cta-final-sub">O ecossistema está pronto. Estruture o funil e configure os upsells.</p>
          <div className="cta-btns">
            <a href="#part1" className="btn btn-gold">Rever estratégias</a>
            <a href="#part2" className="btn btn-outline">Voltar ao topo</a>
          </div>
        </div>
      </section>

      <footer>
        <span className="footer-logo">DOJO</span>
        <span className="footer-copy">Estratégia Low-Ticket × Comunidade Dojo · 2025</span>
      </footer>
    </div>
  );
}
