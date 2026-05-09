import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ProjectProvider, LanguageProvider } from '@/store'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ProjectProvider>
  </StrictMode>,
)
