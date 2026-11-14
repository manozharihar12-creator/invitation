// Use local proxy to avoid CORS blocking - CDN doesn't send ACAO headers
// Original CDN: https://cdn.riwaaz.in/wedding-websites/themes/rameswaram/
export const FRAMES_BASE = '/api/cdn/frames'; // proxied to CDN for exact images
export const FRAMES_MANIFEST = `${FRAMES_BASE}/manifest.json`;
export const FRAMES_BASE_DIRECT = 'https://cdn.riwaaz.in/wedding-websites/themes/rameswaram/frames';

export const POSTER_CDN = 'https://cdn.riwaaz.in/wedding-websites/themes/rameswaram/poster.jpg';
export const POSTER_PROXIED = '/api/cdn/poster.jpg';
export const POSTER = '/assets/poster.jpg'; // local exact 48752 bytes

export const SKYLINE_CDN = 'https://cdn.riwaaz.in/wedding-websites/themes/rameswaram/hero-skyline.json';
export const SKYLINE_PROXIED = '/api/cdn/hero-skyline.json';
export const SKYLINE = SKYLINE_PROXIED;
export const SKYLINE_LOCAL = '/assets/hero-skyline.json';