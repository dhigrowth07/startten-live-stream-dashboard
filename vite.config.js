import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { config } from 'dotenv';
config();

export default defineConfig(({ mode }) => {
  console.log(`Current mode: ${mode}`);

  return {
    server: {
      port: parseInt(process.env.VITE_PORT) || 5173,
      historyApiFallback: true,
    },
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };
});
