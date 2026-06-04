/* ==========================================
   MICHAEL OLIVEIRA PORTFOLIO CORE LOGIC
   Vite + ES Modules + Firebase Integration
   ========================================== */

import './style.css';
import { db, analytics } from './firebase.js';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';

// ------------------------------------------
// 1. Projects Data (Curated 6 Showcase Cases)
// ------------------------------------------
const projectsData = [
  {
    id: 'prj-1',
    title: 'Cachaça Dom Dourado',
    category: 'commercial',
    year: '2022',
    client: 'Dom Dourado Distillery',
    roles: ['Director of Photography', 'Colorist', 'Editor'],
    thumbnail: '/src/assets/dom-dourado/Still_02.webp',
    videoUrl: '/src/assets/dom-dourado.mp4',
    videoType: 'local',
    additionalVideos: [
      { title: 'Still 01', url: '/src/assets/dom-dourado/Still_01.webp', type: 'image' },
      { title: 'Still 02', url: '/src/assets/dom-dourado/Still_02.webp', type: 'image' },
      { title: 'Still 03', url: '/src/assets/dom-dourado/Still_03.webp', type: 'image' },
      { title: 'Still 04', url: '/src/assets/dom-dourado/Still_04.webp', type: 'image' }
    ],
    synopsis: 'This project was born with the challenge of visually translating the essence of Dom Dourado cachaça — a spirit aged in American oak barrels, with a strong presence and sophisticated finish. The proposal was to create a video that respected the product\'s sophistication, with a dense atmosphere, dramatic lighting, and a restrained pace.',
    process: 'I used what was at hand: a Fujifilm X-T4 with a kit lens, some industrial lights, and two small LEDs. Nothing beyond the essentials. I worked with what the production house had available, focusing on crafting an image that spoke to the full-bodied flavor and lingering aromas of the spirit. The lighting choices were precise: a soft rim light highlighting the liquid\'s reflections, well-placed shadows to enhance the label\'s texture, and a background suggesting the barrel wood. In less than four hours, between camera adjustments and lighting setup, the set took shape. In post, I finished the color grading in DaVinci Resolve with precise corrections, simply polishing what was already captured. The result is a direct, elegant film that delivers far more than the equipment itself would promise.',
    results: 'Public reception exceeded all expectations. The film was showcased at the launch of Cachaça Dom Dourado and was met with highly positive acclaim, strengthening the brand\'s premium positioning and generating significant buzz among consumers and partners. The launch quickly stood out with high sales volume, placing Dom Dourado among the brand\'s best-selling products within 24 hours.',
    credits: {
      director: 'Michael Oliveira',
      producer: 'Rafael Lumbert',
      voice: 'Rafael Lumbert',
      editor: 'Michael Oliveira',
      colorGrading: 'Michael Oliveira'
    }
  },
  {
    id: 'prj-2',
    title: 'Dizzon - Diga Adeus',
    category: 'music-video',
    year: '2026',
    client: 'Warner Music',
    roles: ['Director of Photography', 'Colorist', 'Editor'],
    thumbnail: 'https://img.youtube.com/vi/2PQrnQYDkIs/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/2PQrnQYDkIs',
    additionalVideos: [
      { title: 'Still 01', url: '/src/assets/diga-adeus/Still_01.webp', type: 'image' },
      { title: 'Still 02', url: '/src/assets/diga-adeus/Still_02.webp', type: 'image' },
      { title: 'Still 03', url: '/src/assets/diga-adeus/Still_03.webp', type: 'image' },
      { title: 'Still 04', url: '/src/assets/diga-adeus/Still_04.webp', type: 'image' }
    ],
    synopsis: '"Diga Adeus" follows a man consumed by memories of an unequal relationship, treated as a spare part within a bond marked by emotional exhaustion. Amid drinks, music, and silence, the character undergoes an internal confrontation until finding the breaking point — and, finally, the freedom to say goodbye. The figure that haunts him emerges as a constant ghost, present in every space he occupies, reinforcing the feeling of emotional imprisonment and affective dependency. Dance serves as a visual metaphor for this conflict: desire and destruction coexisting in the same body. The music video was filmed in Brasília with support from Goodloc Filmes, AICON Ações Cinematográficas, and Buteco do Encontro.',
    process: 'Created with limited resources but thorough planning, "Diga Adeus" was born from a meticulous design process developed before a single frame was captured. Alongside Renato Mori, my partner in direction and cinematography, every stage was precisely crafted: script, storyboard, moodboard, location scouting, and scheduling. This preparation allowed the set to flow organically and efficiently throughout production. The visual language of the music video directly mirrors the character\'s emotional duality. In the bar scenes where Dizzon sings and drinks, the cinematography takes on intense magenta and cyan tones, inspired by small cabarets and local bars in rural Brazil. In contrast, during the moments where he portrays the bar owner, the aesthetic abandons excess, leaning toward a quieter, more restrained realism. This color contrast serves as a psychological extension of the narrative, shifting between memory, desire, presence, and absence.',
    results: 'The production experience for "Diga Adeus" was defined by creative intensity and meticulous attention to detail, from conceptual development to final delivery. Despite being produced with a lean crew and gear, the project achieved a solid visual identity and an emotionally charged narrative, highlighting the power of strategic planning in independent filmmaking. The music video surpassed 1.4 million views on YouTube, significantly expanding Dizzon\'s reach and contributing directly to his national career breakthrough. The release strengthened his artistic presence, seamlessly connecting the video\'s cinematic aesthetic with the artist\'s musical identity and generating a powerful response across digital platforms. The final result consolidated "Diga Adeus" as a work built with aesthetic and emotional honesty, balancing cinematic language, art direction, and narrative symbolism into an intimate and melancholic sensory experience.',
    credits: {
      director: 'Michael Oliveira/Renato Mori',
      directorOfPhotography: 'Michael Oliveira',
      artist: 'Dizzon',
      editor: 'Renato Mori',
      colorGrading: 'Michael Oliveira',
      production: 'Renato Mori'
    }
  },
  {
    id: 'prj-4',
    title: 'Dizzon - Ter ou Não',
    category: 'music-video',
    year: '2025',
    client: 'Dizzon',
    roles: ['Director of Photography', 'Colorist', 'Editor'],
    thumbnail: 'https://img.youtube.com/vi/BhZWYo-ehic/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/BhZWYo-ehic',
    additionalVideos: [],
    synopsis: '"Ter ou Não" by Dizzon was born out of a bold concept: shooting the music video inside an actual love motel, using the venue itself as a core narrative element. This idea brought an intimate, unpredictable atmosphere charged with emotional tension, transforming the space into an active participant in the project\'s visual storytelling. Unlike other highly structured productions, this piece was built on improvisation, constant adaptation, and creative real-time reading of the environment.',
    process: 'This was the first project where I simultaneously directed and acted as Director of Photography without any pre-production storyboarding or moodboards. Since we didn\'t know which motel room would be selected, its layout, or what props would be available, the entire visual construction had to happen on the fly. In contrast to "Diga Adeus", this project was executed as a solo operation, requiring rapid decision-making and an intuitive approach to staging, lighting, and composition. The video was captured on a Z CAM E2 with a Canon 18-55mm lens. The lighting design used only a single Colbor CL100X and two Pavotubes 15c, utilizing elements of the location to enhance the sense of depth, texture, and mood. Visually, the music video relies on dense colors, low contrast, and tight framing to evoke a sense of emotional confinement and uncomfortable intimacy. Much of the project\'s aesthetic strength emerged from technical limitations and the need for constant improvisation on set.',
    results: 'The final cut became one of the most compelling works in Dizzon\'s discography, driven by an raw visual authenticity born out of an unconventional process. Even with a minimal setup, the music video achieved a strong aesthetic identity, illustrating how adaptability and visual intuition can turn limitations into a powerful cinematic language. The client was highly pleased, highlighting the video as one of the most striking productions of his career.',
    credits: {
      director: 'Michael Oliveira',
      directorOfPhotography: 'Michael Oliveira',
      choreographer: 'Kamilla Rossi',
      producer: 'Dizzon',
      editor: 'Michael Oliveira',
      colorGrading: 'Michael Oliveira'
    }
  },
  {
    id: 'prj-5',
    title: 'Sabin - Marcia Preventiva',
    category: 'documentary',
    year: '2025',
    client: 'Sabin Diagnostic Medicine',
    roles: ['Director of Photography', 'Colorist', 'Editor'],
    thumbnail: 'https://i.vimeocdn.com/video/1981833577-04731e8853c14d3f3100d50d07ca931fe639d2ff84381a58fe0777d0afa5a154-d_640?region=us',
    videoUrl: 'https://player.vimeo.com/video/1056133427',
    additionalVideos: [
      { title: 'Sabin - Video 2', url: 'https://www.youtube.com/embed/n9grCDebxJQ', type: 'iframe' },
      { title: 'Sabin - Video 3', url: 'https://www.youtube.com/embed/zsxTfARn3ts', type: 'iframe' }
    ],
    synopsis: 'Developed for Sabin Laboratories featuring popular mystic Márcia Sensitiva, the campaign aimed to transform a restricted space into multiple visual worlds capable of supporting distinct narratives in a single shoot. The project birthed the "Prevencast", hosted by the character Márcia Preventiva, alongside two other independent setups crafted within the same room. The brief demanded constant visual reinvention, completely reshaping the environment with every new camera setup and art direction change.',
    process: 'Inside a small room not typical for large-scale conversions, we built three distinct setups to bring the campaign to life. I handled the cinematography, editing, and color grading alongside Renato Mori, striving for a unified aesthetic despite physical and technical constraints. The shoot utilized a multi-camera setup including a Sony FX6, a Blackmagic Pocket Cinema Camera 6K Pro, and a Z CAM E2 — which required meticulous color matching, image matching, and multicam synchronization in post-production. The lighting design incorporated two Colbor 100x units and four Pavotubes 15c, allowing us to establish nuanced moods with soft contrast and controlled color accents. Every choice of lighting, color, and framing was chosen to translate the performative nature of the campaign. Despite the cramped space, technical hurdles, and typical on-set challenges, the crew successfully leveraged limitations into visual storytelling, expanding the perceived depth within a compact room. The production was supported by Malala Filmes, with creative direction by Jones.',
    results: 'The campaign achieved international recognition, earning a feature at the Shorty Awards, cementing it as an exemplary creative execution under real-world production constraints. Beyond institutional accolades, the project showcased the team\'s ability to transform a standard space into an atmospheric, emotionally engaging, and cinematically compelling experience. Every set was engineered to appear larger than its physical bounds, using light, composition, and visual direction as core narrative tools.',
    credits: {
      director: 'Fernanda Carvalho',
      producer: 'Malala Filmes',
      cinematographer: 'Michael Oliveira',
      colorGrading: 'Michael Oliveira',
      editor: 'Michael Oliveira'
    }
  },
  {
    id: 'prj-6',
    title: 'Embraturo - Sebrae Latino',
    category: 'documentary',
    year: '2026',
    client: 'Embratur & Sebrae',
    roles: ['Colorist', 'Editor'],
    thumbnail: 'https://i.vimeocdn.com/video/1743184106-a8d384925bd5d6cf4481dd11ce927e068abdb4dc5e4d75a18b82b20c8ffe5e45-d_640?region=us',
    videoUrl: 'https://player.vimeo.com/video/877593749',
    additionalVideos: [],
    synopsis: 'Produced for EMBRATUR, this commercial campaign was created to showcase the cultural, natural, and emotional diversity of Brazil to the Latin American audience. The campaign sought to strengthen the historical connection between Latin America and Brazil through music, gastronomy, joy, and sensory experiences across various Brazilian regions. The film journeys through four distinct locations — Pipa, Porto de Galinhas, Rio de Janeiro, and Florianópolis — capturing a visual portrait of Brazil as a prime destination for adventure, relaxation, nature, and culture.',
    process: 'I was responsible for both the editing and color grading, aiming to build a cohesive visual thread across wildly different environments, weather conditions, and landscapes. The post-production challenge lay in connecting these distinct regions seamlessly, preserving each location\'s unique identity while keeping a unified cinematic language. The film was directed by Thiago Artmonte, whose style emphasized fluid camera movement, spontaneity, and human connection in every frame. The campaign was developed by Calia Agency and produced by Astronautas Filmes. In the color grading suite, the goal was to enhance the natural contrasts of each setting while preserving an organic look. Warm tones, tropical textures, and vibrant cinematography helped reinforce the warmth, freedom, and hospitality that the film aimed to project to the Latin American audience.',
    results: 'The result is a commercial that visually translates Brazil\'s pluralism through rich landscapes, diverse people, and sensory moments. The blend of dynamic editing, naturalistic cinematography, and cinematic color grading created a vibrant narrative that deeply connected with the campaign\'s goals. Working on this project was a brilliant opportunity to collaborate with a top-tier creative team on a production that celebrates Brazilian cultural identity and its power to connect through images, music, and sensory storytelling.',
    credits: {
      director: 'Thiago Artimonte',
      directorOfPhotography: 'Gerônimo',
      editor: 'Michael Oliveira',
      colorGrading: 'Michael Oliveira',
      production: 'Astronautas Filmes'
    }
  },
  {
    id: 'prj-7',
    title: 'Banco do Brasil - Consciência Negra',
    category: 'commercial',
    year: '2025',
    client: 'Banco do Brasil',
    roles: ['Editor'],
    thumbnail: 'https://i.vimeocdn.com/video/1758432980-e9b6a76c8080e872007f0f0c68bf7c6124a4068350144ed961dc64582f39410c-d_640?region=us',
    videoUrl: 'https://player.vimeo.com/video/887747106',
    additionalVideos: [],
    synopsis: 'Produced for Banco do Brasil, this commercial was created as a tribute to Black Consciousness Day, a date dedicated to reflecting on the struggle, resistance, and appreciation of Black culture in Brazil. The campaign proposes a sensitive and human-centric narrative, constructed to celebrate identity, heritage, and representation through imagery charged with presence and meaning.',
    process: 'I handled the editing, shaping the pacing, emotion, and narrative flow around a delicate and contemplative visual style. The challenge in the cutting room was to honor the symbolic power of the imagery while building a fluid and emotionally resonant story. The project was produced by Malala Filmes, directed by Viviane Santos, and photographed by Fydel Botti. The creative concept was developed by Alex Coelho at Brivia. Visually, the film relies on intimate framing, subtle camera moves, and cinematography that highlights skin textures, rich tones, and natural light, reinforcing the human and emotional depth of the tribute.',
    results: 'The final cut delivered a commercial built with aesthetic and narrative sensitivity, utilizing the editing as a tool to amplify emotional resonance and representation. Contributing to this project was an opportunity to collaborate on a campaign of high cultural and social relevance, bridging cinematic language and brand communication to celebrate memory, identity, and belonging.',
    credits: {
      director: 'Viviane Santos',
      directorOfPhotography: 'Fidell',
      editor: 'Michael Oliveira',
      colorist: 'Gabriel Camacho',
      production: 'Malala Filmes'
    }
  },
  {
    id: 'prj-8',
    title: 'Fairlife - Where is Fairlife Made?',
    category: 'commercial',
    year: '2026',
    client: 'Fairlife Global',
    roles: ['Colorist'],
    thumbnail: 'https://i.vimeocdn.com/video/1594464592-60f71ffd0067dc2a0c1f470ef97d7e0eb3c017cbef01dbdaf086b36bcc5c9fd0-d_640?region=us',
    videoUrl: 'https://player.vimeo.com/video/792163336',
    additionalVideos: [],
    synopsis: 'Produced by 647 Media in Canada, "Fairlife" was one of the most prominent campaigns where I acted as colorist. The campaign was developed in two languages — English and French — totaling six deliverables produced for distinct audiences and markets. The brief required strict visual consistency across all versions, preserving the aesthetic identity, natural tones, and cinematic unity throughout the campaign.',
    process: 'I served exclusively as the colorist on the project, grading footage beautifully captured by the crew at 647 Media. The production was shot on an ARRI Alexa Mini in Log-C3, providing a vast dynamic range, rich color fidelity, and incredible flexibility in the grading suite. The raw footage arrived in pristine condition: perfectly exposed, consistent, and technically solid. This allowed me to focus on artistic look development, dedicating time to enhancing the mood, texture, and visual intent rather than technical fixes. The aesthetic aim was to preserve the organic rendering of the ARRI sensor, highlighting natural skin tones, soft contrast roll-offs, and an elegant, clean look. The key challenge was keeping color consistency across all six versions of the project while respecting the individual identity of each cut.',
    results: '"Fairlife" stands out as one of the most rewarding projects in my portfolio due to the high caliber of technical execution in every phase. The alignment of an experienced production team, outstanding cinematography, and a solid post-production workflow resulted in highly polished and visually consistent films. This project solidified my international presence as a colorist and underscored the importance of a seamless camera-to-post pipeline in achieving cinematic imagery with depth, balance, and a strong visual identity.',
    credits: {
      director: 'Chloe Demont',
      producer: 'Clarissa Vance',
      gaffer: 'Bruno Lima',
      editor: 'Guy de Maupassant',
      colorGrading: 'Michael Oliveira',
      production: '647 Media'
    }
  },
  {
    id: 'prj-9',
    title: 'ProVida - AFP',
    category: 'corporate',
    year: '2025',
    client: 'ProVida Chile',
    roles: ['Colorist'],
    thumbnail: 'https://i.vimeocdn.com/video/1743869276-82d622f599e6f0dbc5f1383146364eb34f2f046c2604581fdbc779a38ae1906f-d_640?region=us',
    videoUrl: 'https://player.vimeo.com/video/878075833',
    additionalVideos: [],
    synopsis: 'Produced by Propalta Films for Provida AFP, the campaign aimed to convey sensitivity, trust, and visual sophistication through a clean, emotional cinematic style. I acted as the colorist, working to elevate the visual identity established during the shoot while preserving the organic look and feel of the imagery in every scene.',
    process: 'The project arrived in post-production with a strong visual baseline thanks to the precise work of the Director of Photography. The outstanding capture quality and deliberate lighting design enabled a highly refined color grading workflow, allowing us to focus on enhancing the mood, texture, and aesthetic intent rather than corrective work. The visual direction aimed for an elegant, organic feel, featuring balanced contrast, natural tones, and a sense of warm human connection. The color grading was crafted to amplify the emotional depth and sophistication while preserving authenticity, keeping the cinematography clean and cinematic. When the raw footage is so beautifully lit and captured, look development becomes a playground of creative freedom. This allowed us to shape subtle nuances in light, depth, and color to achieve a consistent and sensory experience.',
    results: 'The final cut delivered a visually delicate and technically refined film, where cinematography and post-production worked in perfect harmony. The combination of a meticulous shoot and a precise color grading process contributed to a sophisticated, emotionally resonant cinematic style. Working on this project was deeply rewarding due to the pristine quality of the source material and the creative freedom in look development, resulting in a project that embodies technical excellence, visual sensitivity, and a strong aesthetic identity.',
    credits: {
      director: 'Roberto Dias',
      producer: 'Pierre Laurent',
      gaffer: 'Thiago Nogueira',
      colorist: 'Michael Oliveira'
    }
  }
];

// ------------------------------------------
// 2. Hydrate Projects Grid with Filters
// ------------------------------------------
const projectsGrid = document.getElementById('projects-grid');
const filterBtns = document.querySelectorAll('.filter-btn');

function renderProjects(filter = 'all') {
  if (!projectsGrid) return;

  const updateDOM = () => {
    projectsGrid.innerHTML = '';

    const filtered = filter === 'all'
      ? projectsData
      : projectsData.filter(p => {
          if (filter === 'cinematography') {
            return p.roles.includes('Director of Photography') || p.roles.includes('Cinematographer');
          } else if (filter === 'color-grading') {
            return p.roles.includes('Colorist') || p.roles.includes('Color Grading');
          } else if (filter === 'editing') {
            return p.roles.includes('Editor') || p.roles.includes('Editing');
          }
          return false;
        });

    if (filtered.length === 0) {
      projectsGrid.innerHTML = '<div class="grid-loading">No projects found in this category.</div>';
      return;
    }

    filtered.forEach((project, index) => {
      const card = document.createElement('article');
      const colors = ['tile-mint', 'tile-purple', 'tile-yellow', 'tile-blue', 'tile-pink', 'tile-white'];
      const colorClass = colors[index % colors.length];
      card.className = `project-card ${colorClass}`;
      card.setAttribute('data-id', project.id);
      card.setAttribute('tabindex', '0');

      // Set unique view-transition-name inline so browser tracks layout changes
      card.style.viewTransitionName = `project-${project.id}`;

      const roleBadges = project.roles
        .map(role => `<span class="project-role-badge">${role}</span>`)
        .join('');

      card.innerHTML = `
        <div class="project-thumbnail">
          <img class="project-img base-layer" src="${project.thumbnail}" alt="${project.title} - ${project.category.replace('-', ' ')} cinematography by Michael Oliveira" title="${project.title} - ${project.category.replace('-', ' ')}" loading="lazy">
          <img class="project-img zoom-layer" src="${project.thumbnail}" alt="${project.title} zoom layer" title="${project.title} zoom layer" loading="lazy" aria-hidden="true">
          <div class="project-overlay"></div>
        </div>
        <div class="project-info-overlay">
          <div class="project-meta">
            <span class="project-category">${project.category.replace('-', ' ')}</span>
            <span class="project-year">${project.year}</span>
          </div>
          <h3 class="project-card-title">${project.title}</h3>
          <div class="project-roles-list">
            ${roleBadges}
          </div>
        </div>
      `;

      // Click to Open Project Page via Hash Routing
      card.addEventListener('click', () => {
        window.location.hash = `#/project/${project.id}`;
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          window.location.hash = `#/project/${project.id}`;
        }
      });

      projectsGrid.appendChild(card);
    });
  };

  if (document.startViewTransition) {
    document.startViewTransition(() => updateDOM());
  } else {
    updateDOM();
  }
}

// Filter Event Listeners
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filterValue = btn.getAttribute('data-filter');
    renderProjects(filterValue);
  });
});

// ------------------------------------------
// 3. Project Detail Page & Hash Router
// ------------------------------------------
const projectPage = document.getElementById('project-page');
const projectPageBody = document.getElementById('project-page-body');
const projectPageLoading = document.getElementById('project-page-loading');
const projectPageClose = document.querySelector('.project-page-close-btn');

const mainVideo = document.getElementById('project-page-main-video');
const mainImage = document.getElementById('project-page-main-image');
const mainHtml5Video = document.getElementById('project-page-main-html5-video');
const moreVideosContainer = document.getElementById('project-page-more-videos-container');
const moreVideosGrid = document.getElementById('project-page-more-videos-grid');

const ppCategory = document.getElementById('project-page-category');
const ppTitle = document.getElementById('project-page-title');
const ppClient = document.getElementById('project-page-client');
const ppYear = document.getElementById('project-page-year');
const ppRoles = document.getElementById('project-page-roles');
const ppSynopsis = document.getElementById('project-page-synopsis');
const ppProcess = document.getElementById('project-page-process');
const ppResults = document.getElementById('project-page-results');
const ppCreditsList = document.getElementById('project-page-credits-list');

// Next/Prev Project Card Elements
const prevProjectBtn = document.getElementById('prev-project-btn');
const prevProjectThumb = document.getElementById('prev-project-thumb');
const prevProjectTitle = document.getElementById('prev-project-title');

const nextProjectBtn = document.getElementById('next-project-btn');
const nextProjectThumb = document.getElementById('next-project-thumb');
const nextProjectTitle = document.getElementById('next-project-title');

// Keep track of scroll position before opening project page
let prePageScrollY = 0;

// Strips platform UI from embed URLs so only raw video shows (no controls, logos, suggested videos)
function cleanEmbedUrl(url, autoplay = false) {
  let base = url;
  const params = new URLSearchParams();

  const isYouTube = url.includes('youtube.com/embed/');
  const isVimeo   = url.includes('player.vimeo.com/');

  if (isYouTube) {
    // Remove any existing query string from the base
    const [path, existing] = url.split('?');
    base = path;
    if (existing) new URLSearchParams(existing).forEach((v, k) => params.set(k, v));
    // Hide all YouTube chrome
    params.set('controls', '0');
    params.set('modestbranding', '1');
    params.set('rel', '0');
    params.set('showinfo', '0');
    params.set('iv_load_policy', '3');
    params.set('disablekb', '1');
    params.set('fs', '0');
    params.set('playsinline', '1');
    params.set('enablejsapi', '1');
    if (autoplay) params.set('autoplay', '1');
  } else if (isVimeo) {
    const [path, existing] = url.split('?');
    base = path;
    if (existing) new URLSearchParams(existing).forEach((v, k) => params.set(k, v));
    // Hide all Vimeo chrome
    params.set('controls', '0');
    params.set('title', '0');
    params.set('byline', '0');
    params.set('portrait', '0');
    params.set('dnt', '1');
    if (autoplay) params.set('autoplay', '1');
  } else {
    // Local or unknown — return as-is with optional autoplay
    if (autoplay) {
      return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
    }
    return url;
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// Derives the best available thumbnail for a video entry
function getVideoThumbnail(vid, projectThumbnail) {
  // If this entry has an explicit thumbnail, use it
  if (vid.thumbnail) return vid.thumbnail;
  // Derive YouTube thumbnail from embed URL
  const ytMatch = vid.url && vid.url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  // Fallback to project thumbnail
  return projectThumbnail;
}

function setTheaterMedia(url, type, forcePlay = false, mediaTitle = '') {
  if (!mainVideo || !mainImage || !mainHtml5Video || !projectPageLoading || !projectPageBody) return;
  const isImg = type === 'image' || url.endsWith('.webp') || url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg');
  // Only route to HTML5 <video> if it is explicitly a local file (mp4/webm/ogg extension or type === 'local')
  const isLocalVideo = type === 'local' || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg');
  
  // Hide the cover layer if we display static image or force autoplay
  const videoCover = document.getElementById('project-page-video-cover');
  if (videoCover && (isImg || forcePlay)) {
    videoCover.style.display = 'none';
  }

  if (isImg) {
    // Hide players
    mainVideo.style.display = 'none';
    mainVideo.src = '';
    mainHtml5Video.style.display = 'none';
    mainHtml5Video.src = '';
    mainHtml5Video.pause();
    
    // Show image
    mainImage.src = url;
    mainImage.alt = mediaTitle ? `Cinematic frame from ${mediaTitle}` : 'Cinematic Still';
    mainImage.title = mediaTitle ? `Cinematic Frame - ${mediaTitle}` : 'Cinematic Still';
    mainImage.style.display = 'block';
    
    // Hide loading spinner and show project body for static images instantly
    projectPageLoading.style.display = 'none';
    projectPageBody.className = 'project-page-body-active';
  } else if (isLocalVideo) {
    // Hide iframe & image
    mainVideo.style.display = 'none';
    mainVideo.src = '';
    mainImage.style.display = 'none';
    mainImage.src = '';
    
    // Show HTML5 video player
    mainHtml5Video.src = url;
    mainHtml5Video.style.display = 'block';
    mainHtml5Video.load();
    if (forcePlay) {
      mainHtml5Video.play().catch(err => console.log('Autoplay blocked or paused:', err));
    }
    
    // Hide loading spinner and show project body for local video instantly
    projectPageLoading.style.display = 'none';
    projectPageBody.className = 'project-page-body-active';
  } else {
    // Hide image & HTML5 video
    mainImage.style.display = 'none';
    mainImage.src = '';
    mainHtml5Video.style.display = 'none';
    mainHtml5Video.src = '';
    mainHtml5Video.pause();
    
    // Show iframe player — always cleaned of platform UI
    mainVideo.style.display = 'block';
    mainVideo.src = cleanEmbedUrl(url, forcePlay);
  }
}

function openProjectPage(id) {
  const prj = projectsData.find(p => p.id === id);
  if (!prj || !projectPage) return;

  // Save scroll position if opening for the first time in this session
  if (!projectPage.classList.contains('active')) {
    prePageScrollY = window.scrollY;
  }

  // Show project page & loading spinner
  projectPage.classList.add('active');
  projectPage.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Stop background scrolling
  
  projectPageLoading.style.display = 'block';
  projectPageBody.className = 'project-page-body-hidden';

  // Load and play media. If it is a video, show cinematic poster first
  const videoCover = document.getElementById('project-page-video-cover');
  const coverImg = document.getElementById('project-page-cover-img');
  const playBtn = document.getElementById('project-page-play-btn');

  if (videoCover && coverImg && playBtn) {
    if (prj.videoType === 'image') {
      videoCover.style.display = 'none';
      setTheaterMedia(prj.videoUrl, prj.videoType, false, prj.title);
    } else {
      // It is a video - hide players and display cinematic poster cover
      mainVideo.style.display = 'none';
      mainVideo.src = '';
      mainHtml5Video.style.display = 'none';
      mainHtml5Video.src = '';
      mainHtml5Video.pause();
      mainImage.style.display = 'none';
      mainImage.src = '';

      coverImg.src = prj.thumbnail;
      coverImg.alt = `${prj.title} - Video Cover Poster`;
      coverImg.title = `${prj.title} - Play Video`;
      videoCover.style.display = 'block';

      const startPlayback = () => {
        videoCover.style.display = 'none';
        setTheaterMedia(prj.videoUrl, prj.videoType, true, prj.title); // true forces autoplay
      };

      videoCover.onclick = startPlayback;
      playBtn.onclick = startPlayback;

      // Hide loading spinner and make details panel interactive
      projectPageLoading.style.display = 'none';
      projectPageBody.className = 'project-page-body-active';
    }
  } else {
    // Fallback if poster elements are not in DOM
    setTheaterMedia(prj.videoUrl, prj.videoType, false, prj.title);
  }

  // Set Details text
  ppCategory.textContent = prj.category.replace('-', ' ');
  ppTitle.textContent = prj.title;
  ppClient.textContent = prj.client;
  ppYear.textContent = prj.year;
  ppRoles.textContent = prj.roles.join(' / ');
  ppSynopsis.textContent = prj.synopsis;
  ppProcess.textContent = prj.process;
  ppResults.textContent = prj.results;

  // Render Credits
  ppCreditsList.innerHTML = '';
  Object.entries(prj.credits).forEach(([role, name]) => {
    const formattedRole = role.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const creditItem = document.createElement('li');
    creditItem.innerHTML = `<strong>${formattedRole}:</strong> ${name}`;
    ppCreditsList.appendChild(creditItem);
  });

  // Render More Videos (if any)
  if (prj.additionalVideos && prj.additionalVideos.length > 0) {
    moreVideosContainer.style.display = 'block';
    moreVideosGrid.innerHTML = '';
    
    // Create the Main Film as the first option in the grid, so they can return to it!
    const allVideos = [
      { title: 'Main Film', url: prj.videoUrl, type: prj.videoType },
      ...prj.additionalVideos
    ];
    
    allVideos.forEach((vid, index) => {
      const vidCard = document.createElement('div');
      const isImg = vid.type === 'image';
      
      vidCard.className = `more-video-item ${isImg ? 'still-item' : ''} ${index === 0 ? 'active' : ''}`;
      
      const thumbUrl = isImg ? vid.url : getVideoThumbnail(vid, prj.thumbnail);
      const previewBg = `background-image: url('${thumbUrl}'); background-size: cover; background-position: center;`;
      
      // Glassmorphic YouTube play icon for videos, and eye icon for images
      const iconMarkup = isImg ? `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="play-tiny-icon">
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
          <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clip-rule="evenodd" />
        </svg>
      ` : `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="play-tiny-icon" style="margin-left: 2px;">
          <path d="M8 5v14l11-7z" />
        </svg>
      `;

      const indicatorClass = isImg ? 'play-indicator-circle' : 'play-indicator-youtube';

      const mediaDesc = isImg ? `Cinematic still frame from ${prj.title}` : `Video clip from ${prj.title}`;
      vidCard.innerHTML = `
        <div class="more-video-preview" style="${previewBg}" title="${mediaDesc}" aria-label="${mediaDesc}">
          <div class="${indicatorClass}">
            ${iconMarkup}
          </div>
        </div>
      `;
      
      vidCard.addEventListener('click', () => {
        // Swap main video src - autoplay if it's a video, regular view if image
        setTheaterMedia(vid.url, vid.type, !isImg, prj.title);
        // Update active class in grid
        document.querySelectorAll('.more-video-item').forEach(item => item.classList.remove('active'));
        vidCard.classList.add('active');
        // Scroll back up to the main video theater smoothly
        projectPage.scrollTo({ top: 0, behavior: 'smooth' });
      });
      
      moreVideosGrid.appendChild(vidCard);
    });
  } else {
    moreVideosContainer.style.display = 'none';
  }

  // Calculate Next and Prev Projects for Continuous Loop Navigation
  const currentIdx = projectsData.findIndex(p => p.id === id);
  
  // Previous Project
  const prevIdx = (currentIdx - 1 + projectsData.length) % projectsData.length;
  const prevPrj = projectsData[prevIdx];
  if (prevProjectBtn && prevPrj) {
    prevProjectBtn.setAttribute('data-target-id', prevPrj.id);
    if (prevProjectThumb) {
      prevProjectThumb.src = prevPrj.thumbnail;
      prevProjectThumb.alt = `Go to previous project: ${prevPrj.title}`;
      prevProjectThumb.title = `Previous: ${prevPrj.title}`;
    }
    if (prevProjectTitle) prevProjectTitle.textContent = prevPrj.title;
  }

  // Next Project
  const nextIdx = (currentIdx + 1) % projectsData.length;
  const nextPrj = projectsData[nextIdx];
  if (nextProjectBtn && nextPrj) {
    nextProjectBtn.setAttribute('data-target-id', nextPrj.id);
    if (nextProjectThumb) {
      nextProjectThumb.src = nextPrj.thumbnail;
      nextProjectThumb.alt = `Go to next project: ${nextPrj.title}`;
      nextProjectThumb.title = `Next: ${nextPrj.title}`;
    }
    if (nextProjectTitle) nextProjectTitle.textContent = nextPrj.title;
  }

  // Reset page container scroll position to top
  projectPage.scrollTop = 0;

  // Reveal body after iframe loads
  mainVideo.onload = () => {
    if (mainVideo.style.display !== 'none') {
      projectPageLoading.style.display = 'none';
      projectPageBody.className = 'project-page-body-active';
    }
  };
}

function closeProjectPage() {
  if (!projectPage) return;
  projectPage.classList.remove('active');
  projectPage.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = ''; // Restore background scrolling
  mainVideo.src = ''; // Clear video source to stop playback immediately
  if (mainImage) {
    mainImage.src = '';
    mainImage.style.display = 'none';
  }
  if (mainHtml5Video) {
    mainHtml5Video.pause();
    mainHtml5Video.src = '';
    mainHtml5Video.style.display = 'none';
  }
  
  // Hide video cover
  const videoCover = document.getElementById('project-page-video-cover');
  if (videoCover) {
    videoCover.style.display = 'none';
  }
  
  // Set URL hash back to empty or projects section to sync state
  if (window.location.hash.startsWith('#/project/')) {
    window.history.pushState('', document.title, window.location.pathname + window.location.search);
  }
  
  // Restore scroll position
  window.scrollTo(0, prePageScrollY);
}

// Router trigger matching URL hashes like #/project/prj-1
function handleRoute() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/project\/([\w-]+)$/);
  if (match) {
    const projectId = match[1];
    openProjectPage(projectId);
  } else {
    closeProjectPage();
  }
}

// Event Listeners for Page UI
if (projectPageClose) {
  projectPageClose.addEventListener('click', () => {
    window.location.hash = '';
  });
}

if (prevProjectBtn) {
  prevProjectBtn.addEventListener('click', () => {
    const targetId = prevProjectBtn.getAttribute('data-target-id');
    if (targetId) {
      window.location.hash = `#/project/${targetId}`;
    }
  });
}

if (nextProjectBtn) {
  nextProjectBtn.addEventListener('click', () => {
    const targetId = nextProjectBtn.getAttribute('data-target-id');
    if (targetId) {
      window.location.hash = `#/project/${targetId}`;
    }
  });
}

// Close on Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && projectPage && projectPage.classList.contains('active')) {
    window.location.hash = '';
  }
});

// Watch URL Hash changes for routing
window.addEventListener('hashchange', handleRoute);

// ------------------------------------------
// Security Sanitizers (Anti-Injection & XSS Protection)
// ------------------------------------------
function sanitizeInput(str, maxLen = 2000) {
  if (typeof str !== 'string') return '';
  let val = str.trim().substring(0, maxLen);
  
  // Clean potential prompt injection override payloads
  const lowerVal = val.toLowerCase();
  if (lowerVal.includes('ignore previous instructions') || 
      lowerVal.includes('system override') || 
      lowerVal.includes('you are now an admin')) {
    val = '[Sanitized Security Warning: Potential Command Injection Blocked] - ' + val;
  }

  // Escape HTML characters to completely secure against HTML/JS injection (XSS)
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function sanitizeDocId(docId) {
  if (typeof docId !== 'string') return 'bypass';
  // Firestore IDs are alphanumeric, hyphens, and underscores only. No slashes or dots.
  const cleaned = docId.replace(/[^a-zA-Z0-9-_]/g, '');
  if (cleaned !== docId || docId.length > 100) {
    console.warn('[Security Alert] Blocked potential path traversal injection on docId:', docId);
    return 'bypass';
  }
  return cleaned;
}

// ------------------------------------------
// 4. Contact Form Firestore Submission
// ------------------------------------------
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (contactForm) {
  const nameInput = document.getElementById('form-name');
  
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      // Restrict to letters and spaces only
      e.target.value = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    });
  }

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameInput ? nameInput.value.trim() : '';
    const company = document.getElementById('form-company') ? document.getElementById('form-company').value.trim() : '';
    const role = document.getElementById('form-role') ? document.getElementById('form-role').value.trim() : '';
    const teamSize = document.getElementById('form-team-size') ? document.getElementById('form-team-size').value : '';
    const projectType = document.getElementById('form-project-type') ? document.getElementById('form-project-type').value : '';
    const modalidade = document.getElementById('form-modalidade') ? document.getElementById('form-modalidade').value : '';
    const budget = document.getElementById('form-budget') ? document.getElementById('form-budget').value : '';
    const message = document.getElementById('form-message') ? document.getElementById('form-message').value.trim() : '';

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Solicitar Proposta';

    if (submitBtn) {
      submitBtn.textContent = 'Enviando...';
      submitBtn.disabled = true;
    }
    
    if (formStatus) {
      formStatus.textContent = '';
      formStatus.className = 'form-status-message';
    }

    if (!name || !company || !role || !teamSize || !projectType || !modalidade || !budget || !message) {
      if (formStatus) {
        formStatus.textContent = 'Por favor, preencha todos os campos obrigatórios.';
        formStatus.className = 'form-status-message form-status-error';
      }
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
      return;
    }

    // Format B2B WhatsApp Message
    const waText = `Olá Michael! Solicitei uma proposta de mentoria técnica pelo site michaeloliveira.online:
• *Nome*: ${name}
• *Empresa*: ${company}
• *Cargo*: ${role}
• *Tamanho da Equipe*: ${teamSize}
• *Tipo de Projeto*: ${projectType}
• *Interesse*: ${modalidade}
• *Orçamento*: ${budget}
• *Dores/Mensagem*: ${message}`;

    const waUrl = `https://wa.me/5511994822209?text=${encodeURIComponent(waText)}`;

    if (formStatus) {
      formStatus.textContent = 'Solicitação processada! Redirecionando para o WhatsApp para iniciar seu atendimento...';
      formStatus.className = 'form-status-message form-status-success';
    }

    contactForm.reset();

    setTimeout(() => {
      window.open(waUrl, '_blank');
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    }, 1500);
  });
}

// ------------------------------------------
// 5. IP/Location Visitor Tracking
// ------------------------------------------
// Helper to calculate total active foreground time spent on the page using performance visibility states
function getTotalForegroundTime(startTime) {
  const entries = performance.getEntriesByType('visibility-state');
  if (entries.length === 0) {
    return Math.round((Date.now() - startTime) / 1000);
  }
  let totalForegroundTimeMs = 0;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].name === 'visible') {
      const start = entries[i].startTime;
      const end = i + 1 < entries.length
        ? entries[i + 1].startTime
        : performance.now();
      totalForegroundTimeMs += (end - start);
    }
  }
  return Math.round(totalForegroundTimeMs / 1000);
}

async function trackVisitor() {
  try {
    // Fetch IP and geolocation data
    const geoRes = await fetch('https://ipapi.co/json/');
    const geo = await geoRes.json();

    const visitorData = {
      ip: geo.ip || 'unknown',
      city: geo.city || 'unknown',
      region: geo.region || 'unknown',
      country: geo.country_name || 'unknown',
      latitude: geo.latitude || null,
      longitude: geo.longitude || null,
      isp: geo.org || 'unknown',
      timezone: geo.timezone || 'unknown',
      language: navigator.language || 'unknown',
      screenResolution: `${screen.width}x${screen.height}`,
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'direct',
      page: window.location.pathname,
      timestamp: serverTimestamp(),
      sessionStart: Date.now()
    };

    // Use IP as document ID to track revisits
    const safeIp = (geo.ip || 'unknown').replace(/\./g, '_');
    const visitorRef = doc(db, 'visitors', safeIp);
    const existing = await getDoc(visitorRef);

    if (existing.exists()) {
      await updateDoc(visitorRef, {
        visitCount: increment(1),
        lastVisit: serverTimestamp(),
        lastReferrer: document.referrer || 'direct',
        lastPage: window.location.pathname
      });
    } else {
      await setDoc(visitorRef, { ...visitorData, visitCount: 1 });
    }

    // Log analytics event
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_location: window.location.href,
        page_title: document.title
      });
    }
  } catch (err) {
    // Silently fail — visitor tracking should never break the portfolio
    console.warn('[Analytics] Visitor tracking skipped:', err.message);
  }
}

// ------------------------------------------
// 6. Intersection Observer (Scroll-Driven Build-up Animations)
// ------------------------------------------
const revealOptions = {
  root: null,
  threshold: 0.15,
  rootMargin: '0px'
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      // Once revealed, we don't need to track it anymore
      observer.unobserve(entry.target);
    }
  });
}, revealOptions);

function setupScrollAnimations() {
  const elements = document.querySelectorAll('.scroll-reveal');
  elements.forEach(el => observer.observe(el));
}

// ------------------------------------------
// 7. Navigation Actions & Mobile Menu
// ------------------------------------------
const header = document.getElementById('main-header');
const logoContainer = header ? header.querySelector('.logo-container') : null;
const heroContent = document.querySelector('.hero-content');
const mobileToggle = document.querySelector('.mobile-nav-toggle');
const navLinksContainer = document.querySelector('.nav-links');
const navLinks = document.querySelectorAll('.nav-link');

// Scroll behavior (glass to frosted bg & dynamic fade effects)
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  
  if (scrollY > 50) {
    header.classList.add('header-scrolled');
  } else {
    header.classList.remove('header-scrolled');
  }
  
  // Whole Header fade-in (fully visible at 150px scroll)
  if (header) {
    const headerOpacity = Math.min(scrollY / 150, 1);
    header.style.opacity = headerOpacity;
    header.style.pointerEvents = headerOpacity > 0.1 ? 'auto' : 'none';
  }
  
  // Hero Content fade-out & subtle parallax translation
  if (heroContent) {
    const fadeEnd = window.innerHeight * 0.6; // fully faded out at 60% of viewport height
    const heroOpacity = Math.max(1 - scrollY / fadeEnd, 0);
    heroContent.style.opacity = heroOpacity;
    heroContent.style.transform = `translateY(${scrollY * 0.2}px)`;
    heroContent.style.pointerEvents = heroOpacity > 0.1 ? 'auto' : 'none';
  }
});

// Mobile menu toggling
if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('active');
    navLinksContainer.classList.toggle('active');
  });
}

// Close mobile menu and set active nav link on click
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    
    mobileToggle.classList.remove('active');
    navLinksContainer.classList.remove('active');
  });
});

// Play Reel buttons triggers BMW project details page immediately via hash routing
const playReelBtn = document.getElementById('play-reel-btn');
if (playReelBtn) {
  playReelBtn.addEventListener('click', () => {
    window.location.hash = '#/project/prj-1';
  });
}

// ------------------------------------------
// 8. Testimonials Carousel Slider
// ------------------------------------------
const testSlider = document.getElementById('testimonial-slider');
const testDots = document.querySelectorAll('.slider-dot');

const testimonials = [
  {
    text: "Michael is an extremely versatile and committed professional. We worked together on several Malala Filmes projects for major brands and institutions such as Banco do Brasil, Sabin, Ministry of Education, Globo, and other large corporations. Beyond his technical excellence as a director of photography, editor, and colorist, he always brought creative solutions even in the most challenging productions. He truly understands storytelling and the filmmaking process, knowing exactly how to elevate any project.",
    name: "Bruno Fleck",
    role: "Producer at Malala Filmes"
  },
  {
    text: "Working with Michael has always given us the confidence of relying on someone who truly commands the craft of filmmaking. Across multiple Malala Filmes projects, he served as director of photography, editor, and colorist, delivering exceptional content for clients like Banco do Brasil, Sabin, Ministry of Education, Globo, and other prominent brands. In addition to his high aesthetic standards, he is an agile, highly creative professional deeply committed to the final result.",
    name: "Marta Rocha",
    role: "Owner of Malala Filmes"
  },
  {
    text: "Michael was key to major Softown projects, including internal campaigns and our partnership work with Noru Sushi. His standout quality is his ability to seamlessly blend creative vision with technical execution. He worked across the entire pipeline—from scripting to directing, cinematography, editing, and color grading—always delivering visually stunning projects perfectly aligned with our brand objectives.",
    name: "Daniel Rocha",
    role: "CMO at Softown"
  },
  {
    text: "Working with Michael on the music videos for 'Diga Adeus' and 'Ter ou Não' was an incredibly powerful experience for me. I had a lot of ideas, and he managed to transform them into something visually massive. From directing all the way to final editing, he brought exactly the atmospheric vibe the songs required. He is a highly creative guy who truly pours himself into the project.",
    name: "Dizzon",
    role: "Singer"
  },
  {
    text: "Michael succeeded in turning a simple concept into something far more artistic than I could have imagined. On the visualizer we shot together, he handled the cinematography, editing, and finishing with meticulous care and artistic sensitivity. The result is exceptionally beautiful, boasting a remarkably strong visual identity.",
    name: "Wolff",
    role: "Musician/Composer"
  },
  {
    text: "Michael demonstrated strong leadership and creative vision while directing projects for Nuibrand Digital. He managed teams across Brazil, Tunisia and Qatar with professionalism and efficiency, always maintaining high production quality. Beyond his technical skills as editor, director and colorist, he understands how to lead international creative teams and deliver work with cinematic quality.",
    name: "Ahmed Mukamil",
    role: "Owner of Nuibrand Digital"
  },
  {
    text: "I worked with Michael on industrial film projects serving major corporations like Shell, Raízen, Cosan, and Moove. In addition to editing, he was also responsible for the color grading—a field where he has always excelled. I remember repeatedly praising his precise technical and artistic care with the image. Michael consistently delivers a finish that is far above average, understanding exactly how to elevate the visual narrative of every project.",
    name: "Fernando Bastos",
    role: "Director/Owner of Mariposa Filmes"
  }
];


function setupTestimonials() {
  if (!testSlider) return;
  
  // Render ALL testimonials inside the slider container
  testSlider.innerHTML = testimonials.map((test, idx) => `
    <div class="testimonial-card" data-idx="${idx}">
      <p class="testimonial-text">"${test.text}"</p>
      <div class="testimonial-author">
        <div class="author-info">
          <h5 class="author-name">${test.name}</h5>
          <p class="author-role">${test.role}</p>
        </div>
      </div>
    </div>
  `).join('');

  let currentIdx = 0;

  function updateCarousel(idx) {
    currentIdx = (idx + testimonials.length) % testimonials.length;
    
    const cards = testSlider.querySelectorAll('.testimonial-card');
    const prevIdx = (currentIdx - 1 + testimonials.length) % testimonials.length;
    const nextIdx = (currentIdx + 1) % testimonials.length;
    
    cards.forEach((card, i) => {
      card.classList.remove('active', 'prev', 'next', 'hidden');
      if (i === currentIdx) {
        card.classList.add('active');
      } else if (i === prevIdx) {
        card.classList.add('prev');
      } else if (i === nextIdx) {
        card.classList.add('next');
      } else {
        card.classList.add('hidden');
      }
    });
    
    // Update dots active class
    const dynamicDots = document.querySelectorAll('.slider-controls .slider-dot');
    dynamicDots.forEach((dot, i) => {
      if (i === currentIdx) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // Render dots dynamically
  const controlsContainer = document.querySelector('.slider-controls');
  if (controlsContainer) {
    controlsContainer.innerHTML = testimonials.map((_, idx) => `
      <button class="slider-dot${idx === 0 ? ' active' : ''}" data-slide="${idx}" aria-label="Ver depoimento ${idx + 1}"></button>
    `).join('');

    const dynamicDots = controlsContainer.querySelectorAll('.slider-dot');
    dynamicDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-slide'));
        updateCarousel(idx);
      });
    });
  }

  // Setup click listeners for left/right arrow buttons
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      updateCarousel(currentIdx - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      updateCarousel(currentIdx + 1);
    });
  }

  // Allow clicking on prev/next side cards directly to move to them
  const cards = testSlider.querySelectorAll('.testimonial-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('prev')) {
        updateCarousel(currentIdx - 1);
      } else if (card.classList.contains('next')) {
        updateCarousel(currentIdx + 1);
      }
    });
  });

  // Initialize carousel view
  updateCarousel(0);
}

// ------------------------------------------
// 9. Hero Background Slideshow (JS driven, 10s interval)
// ------------------------------------------
function setupHeroSlideshow() {
  const slides = document.querySelectorAll('.hero-bg-slide');
  if (slides.length <= 1) return;
  
  let currentIdx = 0;
  
  // Initialize the first active slide animation
  slides[currentIdx].style.transform = 'scale(1.06)';
  
  setInterval(() => {
    const prevIdx = currentIdx;
    currentIdx = (currentIdx + 1) % slides.length;
    
    slides.forEach((slide, idx) => {
      if (idx === currentIdx) {
        slide.classList.add('active');
        slide.style.transform = 'scale(1.06)';
      } else if (idx === prevIdx) {
        slide.classList.remove('active');
        slide.style.transform = 'scale(1.02)';
      } else {
        slide.classList.remove('active');
        slide.style.transform = 'scale(1.02)';
      }
    });
  }, 10000);
}

// ------------------------------------------
// 10. Parallax Effect on Hero Background Slideshow & Dynamic Desaturation
// ------------------------------------------
function setupHeroParallax() {
  const slideshow = document.querySelector('.hero-bg-slideshow');
  if (!slideshow) return;
  
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroHeight = window.innerHeight;
        
        if (scrollY <= heroHeight) {
          // Translate background at 45% of scroll speed for elegant depth
          slideshow.style.transform = `translateY(${scrollY * 0.45}px)`;
          
          // Desaturation effect (from 0% to 100% grayscale as user scrolls down)
          const scrollPercent = Math.min(scrollY / heroHeight, 1);
          slideshow.style.filter = `grayscale(${scrollPercent * 100}%)`;
        } else {
          slideshow.style.filter = 'grayscale(100%)';
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ------------------------------------------
// 11. Advanced Resume Download & Modal System
// ------------------------------------------
function setupResumeModal() {
  const modal = document.getElementById('resume-modal');
  const openBtn = document.getElementById('download-resume-btn');
  const closeBtn = document.getElementById('close-resume-modal');
  const form = document.getElementById('resume-form');
  const status = document.getElementById('resume-form-status');

  if (!modal || !openBtn || !closeBtn || !form) return;

  // Open Modal
  openBtn.addEventListener('click', () => {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    status.textContent = '';
    status.className = 'form-status-message';
    form.reset();
  });

  // Close Modal
  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('resume-name').value.trim();
    const company = document.getElementById('resume-company').value.trim();
    const email = document.getElementById('resume-email').value.trim();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Opening Resume...';
    submitBtn.disabled = true;

    let docId = 'bypass';

    try {
      // 1. Save download details separate from contacts (non-blocking)
      const downloadDocRef = await addDoc(collection(db, 'resume_downloads'), {
        fullName: sanitizeInput(name, 100),
        companyName: sanitizeInput(company, 100),
        email: sanitizeInput(email, 150),
        createdAt: serverTimestamp(),
        downloadCount: 0
      });
      docId = downloadDocRef.id;
    } catch (err) {
      console.warn('Error saving resume access record (proceeding with bypass):', err);
    }

    // 2. Direct seamless redirect to the personalized resume view
    setTimeout(() => {
      // Close modal prior to redirect
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      form.reset();
      
      // Redirect to secure resume URL
      window.location.href = '/resume/' + docId;
    }, 500);
  });
}

async function triggerResumeDownload(rawDocId) {
  const docId = sanitizeDocId(rawDocId);
  if (docId === 'bypass') {
    try {
      const response = await fetch('/resume.html');
      const html = await response.text();
      document.open();
      document.write(html);
      document.close();
      return;
    } catch (err) {
      console.error('Error in local resume bypass loading:', err);
      window.location.href = '/resume.html';
      return;
    }
  }

  // Create download overlay UI
  const overlay = document.createElement('div');
  overlay.className = 'download-overlay';
  overlay.innerHTML = `
    <div class="download-overlay-card form-glass">
      <h3>MICHAEL OLIVEIRA</h3>
      <p id="download-status">Verifying your unique resume access key...</p>
      <div class="download-spinner"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Style overlay dynamically
  const style = document.createElement('style');
  style.innerHTML = `
    .download-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(10px);
      z-index: 9999;
      display: flex; justify-content: center; align-items: center;
    }
    .download-overlay-card {
      padding: 40px; text-align: center; max-width: 420px; width: 90%;
      border: 1px solid var(--color-image-frame); border-radius: 4px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .download-overlay-card h3 {
      font-family: var(--font-display); color: var(--color-primary);
      margin-bottom: 12px; font-size: 1.8rem; letter-spacing: 1px;
    }
    .download-overlay-card p {
      font-family: var(--font-sans); color: var(--color-ink);
      margin-bottom: 24px; font-size: 0.95rem; line-height: 1.6;
    }
    .download-spinner {
      width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1);
      border-top-color: var(--color-primary); border-radius: 50%;
      margin: 0 auto; animation: spin 1s infinite linear;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  try {
    const docRef = doc(db, 'resume_downloads', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      document.getElementById('download-status').textContent = 'Access key verified! Loading your resume...';

      // Increment access/download count and record time
      await updateDoc(docRef, {
        downloadedAt: serverTimestamp(),
        downloadCount: increment(1)
      });

      // Fetch and swap the DOM with the adapted resume page
      const response = await fetch('/resume.html');
      const html = await response.text();
      
      // Stop the overlay view and replace the DOM
      document.open();
      document.write(html);
      document.close();

    } else {
      document.getElementById('download-status').textContent = 'Error: The resume access link is invalid or has expired.';
      const spinner = document.querySelector('.download-spinner');
      if (spinner) spinner.style.display = 'none';
      
      const btn = document.createElement('a');
      btn.href = '/';
      btn.className = 'btn btn-accent';
      btn.style.marginTop = '20px';
      btn.style.display = 'inline-block';
      btn.textContent = 'Go to Portfolio Home';
      document.querySelector('.download-overlay-card').appendChild(btn);
    }
  } catch (err) {
    console.error('Error fetching resume record:', err);
    document.getElementById('download-status').textContent = 'Error verifying link. Directing to home page...';
    
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  }
}

function checkResumeRoute() {
  const path = window.location.pathname;
  if (path.startsWith('/resume/')) {
    const docId = path.substring(8); // Length of '/resume/' is 8
    if (docId) {
      triggerResumeDownload(docId);
    }
  }
}

// ------------------------------------------
// 12. Initializing Page
// ------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  renderProjects('all');
  setupScrollAnimations();
  setupTestimonials();
  setupHeroSlideshow();
  setupHeroParallax();
  setupResumeModal();
  trackVisitor();
  checkResumeRoute(); // Intercept path-based resume download routes
  handleRoute(); // Process any initial routing hashes on page load
  
  // B2B Sales Funnel Initializations
  setupB2BTabs();
  setupColorSlider();
  setupFaqAccordion();
});

// ------------------------------------------
// 13. B2B Sales Funnel Interactive Additions
// ------------------------------------------

function setupB2BTabs() {
  const modalidadeBtns = document.querySelectorAll('.btn-modalidade, .btn-table');
  const selectElem = document.getElementById('form-modalidade');
  const teamSizeSelect = document.getElementById('form-team-size');

  modalidadeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedOffer = btn.getAttribute('data-modalidade') || btn.getAttribute('data-package');
      if (!selectedOffer) return;

      // Handle modalities select mapping
      if (selectElem) {
        if (selectedOffer === 'Inloco' || selectedOffer === 'Online') {
          selectElem.value = selectedOffer;
        } else if (selectedOffer === 'Consultoria PME') {
          selectElem.value = 'Consultoria';
        }
      }

      // Handle packages team size select mapping
      if (teamSizeSelect) {
        if (selectedOffer === 'Starter') {
          teamSizeSelect.value = 'Ate 5';
          if (selectElem) selectElem.value = 'Online';
        } else if (selectedOffer === 'Growth') {
          teamSizeSelect.value = 'Ate 10';
        } else if (selectedOffer === 'Scale') {
          teamSizeSelect.value = 'Ate 15';
        } else if (selectedOffer === 'Enterprise') {
          teamSizeSelect.value = 'Ate 30';
        }
      }
    });
  });
}

function setupColorSlider() {
  const rangeInput = document.querySelector('.color-slider-range');
  const afterWrapper = document.querySelector('.color-after-wrapper');
  const sliderHandle = document.querySelector('.color-slider-handle');

  if (rangeInput && afterWrapper && sliderHandle) {
    rangeInput.addEventListener('input', (e) => {
      const value = e.target.value;
      afterWrapper.style.width = `${value}%`;
      sliderHandle.style.left = `${value}%`;
    });
  }
}

function setupFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    if (question && answer) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Toggle active class
        item.classList.toggle('active');
        
        if (isActive) {
          answer.style.maxHeight = '0px';
        } else {
          // Open answer and set max-height to its scrollHeight
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    }
  });
}

