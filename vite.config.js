import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: isSsrBuild
        ? {}
        : {
            manualChunks: {
              vendor: ['react', 'react-dom', 'react-router-dom'],
              icons: ['@phosphor-icons/react'],
              supabase: ['@supabase/supabase-js'],
            },
          },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  ssr: {
    // Force Vite to bundle CJS packages for SSR compatibility
    noExternal: ['react-helmet-async'],
  },
}))
