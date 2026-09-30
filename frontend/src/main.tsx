import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { QueryProvider } from './providers/QueryProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <QueryProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryProvider>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
)
