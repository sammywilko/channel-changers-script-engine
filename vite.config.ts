import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    
    server: {
      port: 3000,
      host: true,
    },
    
    preview: {
      port: 3000,
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    
    define: {
      // Only expose API key in development
      // In production, use the serverless function
      'import.meta.env.GEMINI_API_KEY': mode === 'development' 
        ? JSON.stringify(env.GEMINI_API_KEY) 
        : JSON.stringify(''),
    },
    
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['lucide-react'],
            'ai-vendor': ['@google/genai'],
          },
        },
      },
    },
  };
});
