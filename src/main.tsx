import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Capacitor} from '@capacitor/core';
import {StatusBar, Style} from '@capacitor/status-bar';
import App from './App.tsx';
import './index.css';

if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({overlay: false}).catch(() => {});
  StatusBar.setStyle({style: Style.Dark}).catch(() => {});
  StatusBar.setBackgroundColor({color: '#12101C'}).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
