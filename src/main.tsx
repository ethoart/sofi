import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker & capture PWA install prompt for Android WebAPK
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).deferredPwaPrompt = e;
    console.log('[PWA Engine] Captured beforeinstallprompt event for Android WebAPK installer.');
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered successfully with scope:', reg.scope))
        .catch(err => console.error('Service Worker registration failed:', err));
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

