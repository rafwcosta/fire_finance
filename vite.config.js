import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Troque 'gestor-financeiro' pelo nome EXATO do seu repositório no GitHub
export default defineConfig({
    plugins: [react()],
    base: '/gestor-financeiro/',
})