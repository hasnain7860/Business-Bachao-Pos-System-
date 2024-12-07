import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import App from './App.jsx'
import { AppContextProvider } from './Appfullcontext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <AppContextProvider>

    <App />
    </AppContextProvider>
  </StrictMode>,
)