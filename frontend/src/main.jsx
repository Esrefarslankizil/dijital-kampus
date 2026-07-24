import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './modern.css'

// GOOGLE CLIENT ID BURAYA GELECEK (Google Cloud Console'dan alacağınız id)
const GOOGLE_CLIENT_ID = "962400518298-5gbgqlvgm803eun9dg2l14bbvhq1irhf.apps.googleusercontent.com";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
