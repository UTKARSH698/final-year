import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Read .env file directly so shell env vars don't override it
function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8').split('\n')
      .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
      .map(l => l.split('=').map((s, i) => i === 0 ? s.trim() : l.slice(l.indexOf('=') + 1).trim()))
      .filter(([k]) => k)
  );
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const fileEnv = readEnvFile(path.resolve(__dirname, '.env'));
    // process.env fallback picks up Render / CI environment variables at build time
    const p = process.env;
    const geminiKey  = fileEnv.VITE_GEMINI_API_KEY  || fileEnv.GEMINI_API_KEY  || env.VITE_GEMINI_API_KEY  || env.GEMINI_API_KEY  || p.VITE_GEMINI_API_KEY  || p.GEMINI_API_KEY  || '';
    const geminiKey2 = fileEnv.VITE_GEMINI_API_KEY_2 || env.VITE_GEMINI_API_KEY_2 || p.VITE_GEMINI_API_KEY_2 || p.GEMINI_API_KEY_2 || '';
    const geminiKey3 = fileEnv.VITE_GEMINI_API_KEY_3 || env.VITE_GEMINI_API_KEY_3 || p.VITE_GEMINI_API_KEY_3 || p.GEMINI_API_KEY_3 || '';
    const groqKey    = fileEnv.VITE_GROQ_API_KEY     || env.VITE_GROQ_API_KEY     || p.VITE_GROQ_API_KEY     || p.GROQ_API_KEY     || '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // process.env.* — used by some legacy reads
        'process.env.API_KEY':        JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY_2': JSON.stringify(geminiKey2),
        'process.env.GEMINI_API_KEY_3': JSON.stringify(geminiKey3),
        'process.env.GROQ_API_KEY':   JSON.stringify(groqKey),
        // import.meta.env.VITE_* — used by geminiService.ts
        'import.meta.env.VITE_GEMINI_API_KEY':   JSON.stringify(geminiKey),
        'import.meta.env.VITE_GEMINI_API_KEY_2': JSON.stringify(geminiKey2),
        'import.meta.env.VITE_GEMINI_API_KEY_3': JSON.stringify(geminiKey3),
        'import.meta.env.VITE_GROQ_API_KEY':     JSON.stringify(groqKey),
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-dom/client'],
        exclude: ['groq-sdk'],
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        dedupe: ['react', 'react-dom'],
      },
      build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor:   ['react', 'react-dom'],
              framer:   ['framer-motion'],
              markdown: ['react-markdown'],
              icons:    ['lucide-react'],
              gemini:   ['@google/genai'],
            },
          },
        },
      },
    };
});
