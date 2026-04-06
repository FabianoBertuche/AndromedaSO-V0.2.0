import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { WsProvider } from './contexts/WsContext.tsx'
import { I18nProvider } from './contexts/I18nContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <WsProvider>
        <App />
      </WsProvider>
    </I18nProvider>
  </React.StrictMode>,
)
