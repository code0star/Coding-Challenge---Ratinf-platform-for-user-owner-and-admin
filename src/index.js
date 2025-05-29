import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // Tailwind CSS imported here
import App from './App';
import { BrowserRouter } from 'react-router-dom';  // Import BrowserRouter

const root = ReactDOM.createRoot(document.getElementById('root'));

// Wrap App in <BrowserRouter>
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
