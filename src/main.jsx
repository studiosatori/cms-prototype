import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { I18nProvider } from './lib/i18n.jsx'
import { runMigrations } from './lib/migrate.js'

runMigrations()

// A data router (rather than <BrowserRouter>) so pages can block navigation
// while they hold unsaved changes. One splat route keeps <App>'s own <Routes>.
const router = createBrowserRouter([
  { path: '*', element: <I18nProvider><App /></I18nProvider> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
