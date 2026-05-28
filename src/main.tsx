import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/error-boundary'

// Add error logging
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  document.body.innerHTML += `<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:red;color:white;padding:20px;z-index:9999;overflow:auto;"><h1>Error</h1><pre>${e.error}</pre></div>`;
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  document.body.innerHTML += `<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:red;color:white;padding:20px;z-index:9999;overflow:auto;"><h1>Error</h1><pre>${e.reason}</pre></div>`;
});

// Check environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment Check:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set' : '✗ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials are missing!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  document.body.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif; background: #fee2e2; min-height: 100vh;">
      <h1 style="color: #dc2626;">⚠️ Configuration Error</h1>
      <p style="color: #991b1b; font-size: 16px; margin: 20px 0;">
        Supabase credentials are missing!
      </p>
      <p style="color: #7f1d1d; font-size: 14px;">
        Please set these environment variables in your deployment platform:
      </p>
      <ul style="color: #7f1d1d; font-size: 14px; margin: 20px 0;">
        <li><strong>VITE_SUPABASE_URL</strong></li>
        <li><strong>VITE_SUPABASE_ANON_KEY</strong></li>
      </ul>
      <p style="color: #7f1d1d; font-size: 12px; margin-top: 30px;">
        Check browser console (F12) for more details.
      </p>
    </div>
  `;
  throw new Error('Supabase credentials missing');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Error: Root element not found</h1></div>';
  throw new Error('Root element not found');
}

try {
  console.log('🚀 Starting application...');
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
  console.log('✅ Application rendered successfully');
} catch (error) {
  console.error('❌ Failed to render app:', error);
  document.body.innerHTML = `<div style="padding: 20px; font-family: sans-serif; background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; margin: 20px;"><h1 style="color: #dc2626;">Error loading app</h1><pre style="background: white; padding: 15px; border-radius: 4px; overflow: auto; color: #dc2626;">${error}</pre></div>`;
}
