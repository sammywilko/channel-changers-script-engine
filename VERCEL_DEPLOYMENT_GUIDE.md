# Channel Changers Script Engine — Vercel Deployment Guide

## Project Overview

A premium AI scriptwriting tool built with:
- **React 19** + **TypeScript**
- **Vite** build system
- **Google Gemini API** (for AI chat, image generation, TTS)
- **Tailwind CSS** (via CDN in dev, bundled for prod)

---

## ⚠️ Critical Issues to Fix Before Deployment

### 1. API Key Security (HIGH PRIORITY)

The current setup injects `GEMINI_API_KEY` directly into the client bundle via Vite's `define` config. **This exposes your API key to anyone viewing the source.**

**Solution**: Create a Vercel serverless function to proxy API requests.

### 2. Import Map Removal

The `index.html` contains import maps pointing to `aistudiocdn.com`. These conflict with Vite's bundling and must be removed.

### 3. Missing Type Definitions

Add React type definitions for TypeScript.

---

## Step-by-Step Deployment Instructions

### Step 1: Open Project in VS Code

```bash
# Clone or copy the project to your local machine
cd /path/to/channel-changers-script-engine

# Open in VS Code
code .
```

### Step 2: Install Dependencies

```bash
npm install

# Add missing type definitions
npm install --save-dev @types/react @types/react-dom
```

### Step 3: Fix index.html

Remove the import map section. Replace the entire `index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Channel Changers Script Engine</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

### Step 4: Add Tailwind CSS Properly

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Create `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Courier Prime', 'Courier New', 'monospace'],
      },
      colors: {
        cinematic: {
          900: '#0a0a0a',
          800: '#121212',
          700: '#1e1e1e',
          600: '#2d2d2d',
          500: '#404040',
          accent: '#E50914',
          gold: '#D4AF37',
        }
      }
    }
  },
  plugins: [],
}
```

Create `index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #050505;
  color: #e5e5e5;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #121212;
}
::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.prose p {
  margin-bottom: 0.75rem;
}
.prose h1, .prose h2, .prose h3 {
  color: #fff;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}
.prose ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.typing-cursor::after {
  content: '▋';
  animation: blink 1s step-start infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.screenplay-editor {
  line-height: 1.2;
  width: 100%;
  max-width: 8.5in;
  margin: 0 auto;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
}
```

Import in `index.tsx`:

```typescript
import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
```

### Step 5: Create Vercel Serverless API (Security Fix)

Create folder structure:

```
api/
  gemini.ts
```

Create `api/gemini.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { action, payload } = req.body;

    // Forward to Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
```

### Step 6: Update vite.config.ts

```typescript
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});
```

### Step 7: Update geminiService.ts for Production

The service needs to call your serverless function in production instead of directly hitting the Gemini API. This is a significant refactor — for now, you can use environment-based switching:

```typescript
const isProduction = import.meta.env.PROD;

// In production, route through /api/gemini
// In development, use direct API calls with the dev key
```

### Step 8: Create vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

### Step 9: Deploy to Vercel

#### Option A: Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

#### Option B: Via GitHub

1. Push to GitHub
2. Go to vercel.com
3. Import your repository
4. Add environment variable: `GEMINI_API_KEY`
5. Deploy

---

## Environment Variables for Vercel

In your Vercel project settings, add:

| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | Your Google AI Studio API key |

---

## Testing Locally

```bash
# Development with Vite
npm run dev

# Preview production build
npm run build
npm run preview
```

---

## Recommended VS Code Extensions

- **ESLint** — Code linting
- **Prettier** — Code formatting
- **Tailwind CSS IntelliSense** — Tailwind autocomplete
- **TypeScript** — Built-in
- **Vercel** — Deploy from VS Code

---

## Troubleshooting

### "process is not defined"
Remove `process.env` references from client code. Use `import.meta.env` for Vite.

### Import errors for React
Ensure `@types/react` and `@types/react-dom` are installed.

### Tailwind classes not working
Ensure `tailwind.config.js` content paths include all component files.

### API key exposed in build
Implement the serverless function pattern described above.

---

## Production Checklist

- [ ] Remove import maps from index.html
- [ ] Install Tailwind properly
- [ ] Add React type definitions
- [ ] Create serverless API proxy
- [ ] Set environment variables in Vercel
- [ ] Test build locally: `npm run build`
- [ ] Deploy

---

*Channel Changers — Premium Craft at AI Velocity*
