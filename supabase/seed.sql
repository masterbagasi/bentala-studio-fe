-- ============================================
-- Bentala Studio Indonesia — Seed Data
-- ============================================

-- Hero
INSERT INTO bsi_hero (headline, subtitle, cta_text, cta_url, video_urls, poster_url, is_active) VALUES (
  'CREATE STORIES BEYOND BORDERS',
  'Indonesia''s creative agency producing cinematic content from around the world. Bold vision. Global execution.',
  'Start Collaboration',
  'https://wa.me/6281284731599?text=Hi%20Bentala%20Studio!%20Let''s%20collaborate!',
  ARRAY[
    'https://videos.pexels.com/video-files/6774849/6774849-hd_1920_1080_25fps.mp4',
    'https://videos.pexels.com/video-files/5985975/5985975-hd_1920_1080_25fps.mp4',
    'https://videos.pexels.com/video-files/4625596/4625596-hd_1920_1080_25fps.mp4',
    'https://videos.pexels.com/video-files/3048815/3048815-hd_1920_1080_24fps.mp4',
    'https://videos.pexels.com/video-files/2792369/2792369-hd_1920_1080_30fps.mp4'
  ],
  'https://images.unsplash.com/photo-1579632652768-6cb9dcf85912?w=1920&q=80',
  true
);

-- Services
INSERT INTO bsi_services (name, sort_order) VALUES
  ('Video Production', 1),
  ('Social Media', 2),
  ('International Content', 3),
  ('KOL Campaign', 4),
  ('Brand Design', 5),
  ('Advertising', 6);

-- Social Links
INSERT INTO bsi_social_links (platform, handle, url) VALUES
  ('ig', '@bentalastudioindonesia', 'https://instagram.com/bentalastudioindonesia'),
  ('ig', '@bentalaprojectindonesia', 'https://instagram.com/bentalaprojectindonesia'),
  ('tiktok', '@bentalaprojectindonesia', 'https://tiktok.com/@bentalaprojectindonesia'),
  ('whatsapp', '+62 812-8473-1599', 'https://wa.me/6281284731599');

-- Collaborations (30+ brands with SVG logos)
INSERT INTO bsi_collaborations (brand_name, logo_svg, tint_color, sort_order) VALUES
  ('Gojek', '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#00AD4F"/><circle cx="28" cy="28" r="14" fill="white"/><circle cx="28" cy="28" r="7" fill="#00AD4F"/></svg>', '#00AD4F', 1),
  ('Tokopedia', '<svg viewBox="0 0 56 56"><rect x="2" y="2" width="52" height="52" rx="14" fill="#42B549"/><text x="50%" y="40" text-anchor="middle" font-family="sans-serif" font-size="32" font-weight="900" fill="white">T</text></svg>', '#42B549', 2),
  ('Traveloka', '<svg viewBox="0 0 56 60"><path d="M28 4 L52 46 L4 46 Z" fill="#006BFF"/><rect x="18" y="42" width="20" height="14" fill="#006BFF"/></svg>', '#006BFF', 3),
  ('Nike', '<svg viewBox="0 0 90 36"><path d="M4 26 C22 6 70 0 88 12 C62 16 28 22 4 26Z" fill="white"/></svg>', '#ffffff', 4),
  ('Netflix', '<svg viewBox="0 0 44 52"><text x="0" y="48" font-family="sans-serif" font-size="52" font-weight="900" fill="#E50914">N</text></svg>', '#E50914', 5),
  ('Spotify', '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#1ED760"/><path d="M14 22 Q28 15 42 22" stroke="#111" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M15 30 Q28 23 41 30" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M17 38 Q28 32 39 38" stroke="#111" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>', '#1ED760', 6),
  ('TikTok', '<svg viewBox="0 0 56 56"><path d="M31 4 L31 34 A10 10 0 1 1 21 24 L21 14 A20 20 0 1 0 39 34 L39 20 A28 28 0 0 0 51 24 L51 14 A18 18 0 0 1 31 4Z" fill="white"/></svg>', '#FE2C55', 7),
  ('Samsung', '<svg viewBox="0 0 100 24"><text x="0" y="20" font-family="sans-serif" font-size="17" font-weight="300" fill="white" letter-spacing="1.5">SAMSUNG</text></svg>', '#1428A0', 8),
  ('Amazon', '<svg viewBox="0 0 90 44"><text x="0" y="26" font-family="sans-serif" font-size="22" font-weight="900" fill="white">amazon</text><path d="M2 34 Q36 44 68 36" stroke="#FF9900" stroke-width="3.5" fill="none" stroke-linecap="round"/><polygon points="65,30 74,35 65,40" fill="#FF9900"/></svg>', '#FF9900', 9),
  ('BMW', '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="none" stroke="#888" stroke-width="2"/><circle cx="28" cy="28" r="18" fill="none" stroke="#888" stroke-width="1.5"/><path d="M28 10 A18 18 0 0 0 10 28 L28 28 Z" fill="#0066B2"/><path d="M28 28 L46 28 A18 18 0 0 0 28 10 Z" fill="white"/><path d="M28 46 A18 18 0 0 0 46 28 L28 28 Z" fill="#0066B2"/><path d="M10 28 A18 18 0 0 0 28 46 L28 28 Z" fill="white"/></svg>', '#0066B2', 10),
  ('Apple', '<svg viewBox="0 0 46 56"><path d="M36 16 C34 9 28 7 24 7 C20 7 17 10 14 10 C11 10 7 7 3 10 C-1 15 -1 25 3 33 C6 39 10 46 16 46 C19 46 21 44 25 44 C29 44 31 46 35 46 C41 46 45 38 46 33 C41 31 38 24 36 16Z" fill="#999"/><path d="M24 2 C27 2 30 5 28 8" stroke="#999" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>', '#ffffff', 11),
  ('Adidas', '<svg viewBox="0 0 56 56"><polygon points="28,6 50,46 6,46" fill="none" stroke="white" stroke-width="4.5" stroke-linejoin="round"/><line x1="2" y1="46" x2="54" y2="46" stroke="white" stroke-width="4.5" stroke-linecap="round"/></svg>', '#ffffff', 12),
  ('Grab', '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#00B14A"/><text x="50%" y="36" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="900" fill="white">grab</text></svg>', '#00B14A', 13),
  ('Shopee', '<svg viewBox="0 0 56 56"><rect x="2" y="2" width="52" height="52" rx="12" fill="#EE4D2D"/><text x="50%" y="37" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="900" fill="white">shopee</text></svg>', '#EE4D2D', 14),
  ('Google', '<svg viewBox="0 0 56 56"><text x="4" y="38" font-family="sans-serif" font-size="28" font-weight="700" fill="#4285F4">G</text><text x="18" y="38" font-family="sans-serif" font-size="28" font-weight="700" fill="#EA4335">o</text><text x="32" y="38" font-family="sans-serif" font-size="28" font-weight="700" fill="#FBBC05">o</text><text x="44" y="38" font-family="sans-serif" font-size="28" font-weight="700" fill="#4285F4">g</text></svg>', '#4285F4', 15),
  ('Meta', '<svg viewBox="0 0 80 32"><path d="M4 20 C4 12 8 8 14 8 C18 8 21 11 24 16 C27 11 30 8 34 8 C40 8 44 12 44 20 C44 26 41 28 38 28 C35 28 32 26 29 22 C27 25 25 28 22 28 C19 28 17 26 14 22 C12 25 10 28 7 28 C4 28 4 24 4 20Z" fill="#0082FB"/><text x="50" y="24" font-family="sans-serif" font-size="18" font-weight="900" fill="white">meta</text></svg>', '#0082FB', 16),
  ('YouTube', '<svg viewBox="0 0 56 40"><rect x="2" y="2" width="52" height="36" rx="10" fill="#FF0000"/><polygon points="22,10 22,30 38,20" fill="white"/></svg>', '#FF0000', 17),
  ('Unilever', '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="24" fill="none" stroke="#005AA0" stroke-width="3"/><text x="50%" y="33" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="900" fill="white">U</text></svg>', '#005AA0', 18),
  ('Telkomsel', '<svg viewBox="0 0 80 40"><circle cx="20" cy="20" r="16" fill="#E60000"/><path d="M12 20 Q20 8 28 20 Q20 32 12 20Z" fill="white" opacity="0.9"/><text x="40" y="25" font-family="sans-serif" font-size="11" font-weight="700" fill="white">telkomsel</text></svg>', '#E60000', 19),
  ('BCA', '<svg viewBox="0 0 56 56"><rect x="4" y="4" width="48" height="48" rx="6" fill="#0057A0"/><text x="50%" y="37" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="900" fill="white">BCA</text></svg>', '#0057A0', 20),
  ('Microsoft', '<svg viewBox="0 0 44 44"><rect x="2" y="2" width="19" height="19" fill="#F25022"/><rect x="23" y="2" width="19" height="19" fill="#7FBA00"/><rect x="2" y="23" width="19" height="19" fill="#00A4EF"/><rect x="23" y="23" width="19" height="19" fill="#FFB900"/></svg>', '#00A4EF', 21),
  ('Airbnb', '<svg viewBox="0 0 44 56"><path d="M22 4 C16 12 8 20 8 28 C8 36 14 42 22 42 C30 42 36 36 36 28 C36 20 28 12 22 4Z" fill="none" stroke="#FF5A60" stroke-width="3"/><circle cx="22" cy="20" r="5" fill="#FF5A60"/></svg>', '#FF5A60', 22),
  ('DJI', '<svg viewBox="0 0 56 28"><text x="2" y="22" font-family="sans-serif" font-size="24" font-weight="900" fill="white" letter-spacing="2">DJI</text></svg>', '#ffffff', 23),
  ('GoPro', '<svg viewBox="0 0 56 56"><rect x="4" y="10" width="48" height="36" rx="10" fill="#00A8E1"/><text x="50%" y="34" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="900" fill="white">GoPro</text></svg>', '#00A8E1', 24),
  ('Canva', '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#00C3B4"/><text x="50%" y="35" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="900" fill="white">Ca</text></svg>', '#00C3B4', 25);

-- Portfolio Items (30+ items)
INSERT INTO bsi_portfolio (title, category, tag, media_url, aspect_ratio, sort_order) VALUES
  ('Cinematic Brand Film', 'video', 'Video Production', 'https://images.unsplash.com/photo-1536240478700-b869ad10e128?w=600&h=338&fit=crop&q=80', '16:9', 1),
  ('Overseas Campaign — Europe', 'intl', 'International Content', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=338&fit=crop&q=80', '16:9', 2),
  ('Short Film — Jakarta Stories', 'video', 'Video Production', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=338&fit=crop&q=80', '16:9', 3),
  ('Aerial Documentary', 'video', 'Cinematic', 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&h=338&fit=crop&q=80', '16:9', 4),
  ('Architecture Shoot — Amsterdam', 'intl', 'International', 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&h=338&fit=crop&q=80', '16:9', 5),
  ('Company Profile Film', 'video', 'Brand Video', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=338&fit=crop&q=80', '16:9', 6),
  ('Street Photography — Seoul', 'intl', 'International', 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&h=338&fit=crop&q=80', '16:9', 7),
  ('Cultural Stories Series', 'video', 'Documentary', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&h=338&fit=crop&q=80', '16:9', 8),
  ('Music Video Direction', 'video', 'Video Production', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=338&fit=crop&q=80', '16:9', 9),
  ('Instagram Reels Series', 'social', 'Social Media', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=750&fit=crop&q=80', '4:5', 10),
  ('Influencer Partnership APAC', 'social', 'KOL Campaign', 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&h=750&fit=crop&q=80', '4:5', 11),
  ('Strategy & Execution', 'social', 'TikTok Content', 'https://images.unsplash.com/photo-1551817958-d9d86fb29431?w=600&h=750&fit=crop&q=80', '4:5', 12),
  ('Fashion Shoot — Paris', 'intl', 'International', 'https://images.unsplash.com/photo-1520716083928-3c735c6d9c5c?w=600&h=750&fit=crop&q=80', '4:5', 13),
  ('Creator Collab Series', 'social', 'KOL Management', 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&h=750&fit=crop&q=80', '4:5', 14),
  ('Lifestyle Brand Campaign', 'social', 'Content Creation', 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&h=750&fit=crop&q=80', '4:5', 15),
  ('Travel Content — Bali', 'intl', 'International', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=750&fit=crop&q=80', '4:5', 16),
  ('Beauty Brand Activation', 'social', 'KOL Campaign', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=750&fit=crop&q=80', '4:5', 17),
  ('Luxury Brand — Dubai Shoot', 'intl', 'International Content', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=750&fit=crop&q=80', '4:5', 18),
  ('Full Account Takeover', 'social', 'Social Media Mgmt', 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&h=750&fit=crop&q=80', '4:5', 19),
  ('Visual Identity System', 'design', 'Brand Identity', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=600&fit=crop&q=80', '1:1', 20),
  ('Paid Media Campaign', 'design', 'Advertising', 'https://images.unsplash.com/photo-1493421419110-74f4e85ba126?w=600&h=600&fit=crop&q=80', '1:1', 21),
  ('Packaging & Visual Direction', 'design', 'Brand Design', 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600&h=600&fit=crop&q=80', '1:1', 22),
  ('Animation Package', 'design', 'Motion Graphics', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&q=80', '1:1', 23),
  ('Startup Visual Branding', 'design', 'Brand Identity', 'https://images.unsplash.com/photo-1634942537034-2531766767d1?w=600&h=600&fit=crop&q=80', '1:1', 24),
  ('Editorial Layout System', 'design', 'Graphic Design', 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=600&h=600&fit=crop&q=80', '1:1', 25),
  ('App UI / UX Direction', 'design', 'Visual Design', 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600&h=600&fit=crop&q=80', '1:1', 26),
  ('Fashion Brand System', 'design', 'Brand Identity', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&h=600&fit=crop&q=80', '1:1', 27),
  ('Food & Beverage Content', 'social', 'Social Media', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=600&fit=crop&q=80', '1:1', 28),
  ('Product Launch Film', 'video', 'Video Production', 'https://images.unsplash.com/photo-1574717024453-354056afd6fc?w=600&h=600&fit=crop&q=80', '1:1', 29),
  ('Behind The Scenes — Tokyo', 'intl', 'International Content', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=600&fit=crop&q=80', '1:1', 30);

-- About
INSERT INTO bsi_about (story_title, story_body, story_cta_url, vision_text, mission_text, edge_text, stats, "values") VALUES (
  'Born In Indonesia Made For The World',
  'Bentala Studio Indonesia is a creative agency with a clear mission — to produce cinematic content that goes beyond what local brands have come to expect. We don''t just make content. We make content with vision, direction, and global production value.

Our signature edge is simple: we shoot internationally. Where others are limited by local resources, we take cameras overseas — delivering visuals your audience has never seen from a local agency.',
  'https://wa.me/6281284731599?text=Hi%20Bentala%20Studio!',
  'To be Indonesia''s leading creative agency that consistently delivers world-class content — from anywhere on the globe.',
  'Empower Indonesian brands with cinematic storytelling, international aesthetics, and content strategies that convert audiences into loyal communities.',
  'We produce content internationally — giving your brand visuals that stand out in every feed, every story, every scroll.',
  '[{"num":"4","label":"Core Creatives"},{"num":"5+","label":"Countries"},{"num":"2","label":"Active Brands"},{"num":"∞","label":"Ideas"}]',
  '[{"name":"Think Global","desc":"We don''t limit ourselves to what''s available locally. Every project is approached with a global mindset and international production standards.","icon":"globe"},{"name":"Cinematic Quality","desc":"Everything we produce is crafted with cinematic intention. No shortcuts, no generic templates — only content that earns attention.","icon":"film"},{"name":"Brand First","desc":"Every decision starts with your brand. We obsess over how your story looks, feels, and lands — before we ever hit record.","icon":"star"},{"name":"Collaborate Deep","desc":"We don''t just execute briefs. We become partners — understanding your audience, your goals, and your voice at every stage.","icon":"users"},{"name":"Own It","desc":"We take full responsibility for our work — the strategy, the execution, the results. No excuses. Just accountability and growth.","icon":"check"},{"name":"Always Evolve","desc":"Trends change. Platforms shift. We stay ahead — constantly learning, experimenting, and refining our craft.","icon":"refresh"}]'
);

-- Team
INSERT INTO bsi_team (name, title, role_description, initials, avatar_color, tags, sort_order) VALUES
  ('Dandi Rivaldi', 'Creative Director', 'Leads creative vision & international production strategy', 'DR', '#1757c2', ARRAY['Creative Direction','Video Production','Strategy'], 1),
  ('Arif Rahman', 'Head of Production', 'Oversees all video & content production pipelines', 'AR', '#0f3a7a', ARRAY['Production','Cinematography','Post-Production'], 2),
  ('Nadia Putri', 'Social Media Lead', 'Manages brand social presence & KOL partnerships', 'NP', '#00d4ff', ARRAY['Social Media','KOL Management','Content Strategy'], 3),
  ('Rizky Aditya', 'Brand Designer', 'Creates visual identity systems & brand guidelines', 'RA', '#3b87f5', ARRAY['Brand Design','UI/UX','Motion Graphics'], 4);

-- News Feed — BPI Instagram
INSERT INTO bsi_news_feed (account, media_url, caption, permalink, like_count, comments_count, posted_at, sort_order) VALUES
  ('bpi_ig', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=600&fit=crop', 'Diaspora Indonesia kini semakin mendominasi panggung global. Dari Amsterdam hingga Tokyo, jejak mereka tak terbantahkan. #Indonesia #Diaspora #BPI', 'https://instagram.com/bentalaprojectindonesia', 842, 34, '2025-04-15 10:00:00+07', 1),
  ('bpi_ig', 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&h=600&fit=crop', 'Seoul dan Jakarta — dua kota yang kini saling mempengaruhi budaya pop dunia. Simak bagaimana koneksi K-Indonesia terjadi.', 'https://instagram.com/bentalaprojectindonesia', 1204, 67, '2025-04-13 08:30:00+07', 2),
  ('bpi_ig', 'https://images.unsplash.com/photo-1520716083928-3c735c6d9c5c?w=600&h=600&fit=crop', 'Fashion Indonesia goes international. Desainer lokal kini tampil di runway Paris dan Milan. #IndonesianFashion #GlobalStyle', 'https://instagram.com/bentalaprojectindonesia', 976, 45, '2025-04-11 14:00:00+07', 3),
  ('bpi_ig', 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&h=600&fit=crop', 'Amsterdam punya komunitas diaspora Indonesia yang luar biasa. Dari restoran rendang sampai festival budaya — mereka hadir!', 'https://instagram.com/bentalaprojectindonesia', 654, 28, '2025-04-09 11:00:00+07', 4),
  ('bpi_ig', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&h=600&fit=crop', 'ASEAN 2025: Indonesia semakin vokal dan berpengaruh di forum internasional. Ini yang perlu kamu tahu. #ASEAN #Diplomasi', 'https://instagram.com/bentalaprojectindonesia', 1532, 89, '2025-04-07 09:00:00+07', 5),
  ('bpi_ig', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=600&fit=crop', 'Bali bukan hanya destinasi wisata — ia adalah pusat kreativitas global yang sedang bangkit. #Bali #CreativeEconomy', 'https://instagram.com/bentalaprojectindonesia', 2103, 112, '2025-04-05 16:00:00+07', 6),
  ('bpi_ig', 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&h=600&fit=crop', 'Rendang, Soto, Nasi Goreng — kuliner Indonesia kini punya tempat di meja makan dunia. #IndonesianFood #GlobalCuisine', 'https://instagram.com/bentalaprojectindonesia', 887, 56, '2025-04-03 12:00:00+07', 7),
  ('bpi_ig', 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&h=600&fit=crop', 'Nikel Indonesia jadi rebutan dunia karena transisi energi hijau. Bagaimana Indonesia memainkan kartunya? #EnergiHijau', 'https://instagram.com/bentalaprojectindonesia', 743, 41, '2025-04-01 10:00:00+07', 8),
  ('bpi_ig', 'https://images.unsplash.com/photo-1496200186974-4293800e2c20?w=600&h=600&fit=crop', 'Creator Indonesia kini mendominasi TikTok global dengan jutaan pengikut. Siapa saja mereka? #TikTok #IndonesianCreator', 'https://instagram.com/bentalaprojectindonesia', 1876, 134, '2025-03-30 08:00:00+07', 9),
  ('bpi_ig', 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=600&fit=crop', 'Ibukota baru Indonesia — Nusantara — menarik perhatian dunia sebagai proyek kota masa depan. #Nusantara #IKN', 'https://instagram.com/bentalaprojectindonesia', 2341, 178, '2025-03-28 14:00:00+07', 10),
  ('bpi_ig', 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=600&h=600&fit=crop', 'Startup Indonesia unicorn terbaru siap melantai di bursa internasional. Ini ceritanya! #Startup #Indonesia', 'https://instagram.com/bentalaprojectindonesia', 1123, 67, '2025-03-26 10:00:00+07', 11),
  ('bpi_ig', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop', 'Gunung-gunung Indonesia jadi magnet pendaki dunia. Alam kita, warisan kita bersama. #Alam #Indonesia', 'https://instagram.com/bentalaprojectindonesia', 3201, 245, '2025-03-24 07:00:00+07', 12);

-- News Feed — BPI TikTok
INSERT INTO bsi_news_feed (account, media_url, caption, permalink, like_count, comments_count, posted_at, sort_order) VALUES
  ('bpi_tt', 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&h=750&fit=crop', 'Indonesia di mata dunia #BPI #Indonesia #Viral', 'https://tiktok.com/@bentalaprojectindonesia', 12400, 234, '2025-04-15 10:00:00+07', 1),
  ('bpi_tt', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=750&fit=crop', 'Bali goes international #Bali #Travel #Indonesia', 'https://tiktok.com/@bentalaprojectindonesia', 28900, 412, '2025-04-13 08:00:00+07', 2),
  ('bpi_tt', 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&h=750&fit=crop', 'Kuliner Indonesia go global! #Food #IndonesianFood', 'https://tiktok.com/@bentalaprojectindonesia', 45200, 678, '2025-04-11 14:00:00+07', 3),
  ('bpi_tt', 'https://images.unsplash.com/photo-1496200186974-4293800e2c20?w=600&h=750&fit=crop', 'Creator Indonesia mendominasi TikTok #Creator #TikTok', 'https://tiktok.com/@bentalaprojectindonesia', 67300, 891, '2025-04-09 10:00:00+07', 4),
  ('bpi_tt', 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=750&fit=crop', 'Nusantara — kota masa depan Indonesia #IKN #Indonesia', 'https://tiktok.com/@bentalaprojectindonesia', 34100, 567, '2025-04-07 09:00:00+07', 5),
  ('bpi_tt', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=750&fit=crop', 'Alam Indonesia yang luar biasa #Nature #Indonesia', 'https://tiktok.com/@bentalaprojectindonesia', 89200, 1240, '2025-04-05 16:00:00+07', 6);

-- SEO
INSERT INTO bsi_seo (page, meta_title, meta_description, og_image_url) VALUES
  ('home', 'Bentala Studio Indonesia — Create Stories Beyond Borders', 'Indonesia''s creative agency producing cinematic content from around the world. Video production, social media, KOL campaigns, and brand design.', NULL),
  ('about', 'About Us — Bentala Studio Indonesia', 'A creative agency born in Indonesia, built to take Indonesian brands to the world stage with cinematic content and international production.', NULL),
  ('news', 'News — Bentala Project Indonesia', 'Berita dan insight internasional yang berkaitan dengan Indonesia — dikurasi oleh tim BPI untuk audiens global.', NULL);
