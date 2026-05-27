// ── Demo Mode Flag ────────────────────────────────────────────────────────────
// VITE_DEMO_MODE=true  → full mock/seed dataset loads (sales demos, walkthroughs)
// VITE_DEMO_MODE=false → app starts empty (production / real pilot customers)
//
// Set in .env.local for local dev, and in the Vercel dashboard for production.
// The value is baked in at build time by Vite — no runtime config needed.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
