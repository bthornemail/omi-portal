import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class OmiGateElement extends HTMLElement {
  connectedCallback() {
    this.setAttribute('role', 'note');
    this.style.display = 'inline-flex';
  }
}

if (!customElements.get('omi-gate')) customElements.define('omi-gate', OmiGateElement);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/omi-sw.js').catch((error) => console.warn('OMI service worker registration failed', error));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
