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
    const geminiKey = fileEnv.VITE_GEMINI_API_KEY || fileEnv.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
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
