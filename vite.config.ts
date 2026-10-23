import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'lucide-react': path.resolve(__dirname, './src/lib/fontAwesomeIcons.tsx'),
      '@heroui/react': path.resolve(__dirname, './src/components/ui/DatePicker.tsx'),
    },
  },
  build: {
    sourcemap: true,
  },
  server: {
    watch: {
      ignored: ['**/*.crdownload', '**/.git/**'],
    },
  },
});

