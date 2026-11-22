/**
 * Centralized API configuration for Mediloon Frontend.
 * Supports:
 * 1. Explicit backend URL via VITE_API_URL (e.g. https://mediloon.onrender.com/api or https://mediloon.onrender.com)
 * 2. Relative '/api' path (for Vite local proxy or Vercel rewrites)
 */
const rawUrl = import.meta.env.VITE_API_URL || '/api';

// Normalize: ensure no trailing slash, and if full URL given without /api, append /api if appropriate
export const API_BASE = rawUrl.replace(/\/+$/, '');

export default API_BASE;
