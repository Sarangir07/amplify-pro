import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // The monorepo root holds React 18 for Amplify's backend tools, and packages
    // installed at the root, like react-router, would load it. Two copies of React
    // crash hooks, so everything here must use this app's React.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    // The Lambda Function URL's CORS settings (amplify/backend.ts) allow only this
    // origin. strictPort stops Vite from silently moving to another port if it's
    // busy, which would make every API call fail with a CORS error.
    port: 5173,
    strictPort: true,
  },
});
