import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#12122a', color: '#fff', border: '1px solid #1e1e3f' },
          success: { iconTheme: { primary: '#f9cd05', secondary: '#000' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
