import { defineConfig } from 'vite'  
import react from '@vitejs/plugin-react'  
  
// https://vitejs.dev/config/  
export default defineConfig({  
  plugins: [react()],  
  base: '/fairodds-pro/', // MUST match your GitHub repository name exactly  
  build: {  
    outDir: 'dist',  
    sourcemap: false  
  }  
})  
