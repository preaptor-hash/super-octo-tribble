import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/error-boundary'

// Global error handler
window.addEventListener('error', (e) => {
  console.error('❌ Global error:', e.error);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
  console.error('❌ Unhandled promise rejection:', e.reason);
});

// Check environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Environment Configuration:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');

// Get root element
const rootElement = document.getElementById('root');

// Validate root element exists
if (!rootElement) {
  console.error('❌ Root element not found');
  document.body.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif; background: #fee2e2; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div style="max-width: 500px;">
        <h1 style="color: #dc2626; margin-bottom: 20px;">⚠️ Critical Error</h1>
        <p style="color: #991b1b; font-size: 16px;">Root element not found in HTML</p>
        <p style="color: #7f1d1d; font-size: 14px; margin-top: 20px;">Check that index.html contains: &lt;div id="root"&gt;&lt;/div&gt;</p>
      </div>
    </div>
  `;
  throw new Error('Root element not found');
}

// Validate Supabase credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing');
  rootElement.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif; background: #fee2e2; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div style="max-width: 500px;">
        <h1 style="color: #dc2626; margin-bottom: 20px;">⚠️ Configuration Error</h1>
        <p style="color: #991b1b; font-size: 16px; margin-bottom: 20px;">Supabase credentials are missing!</p>
        <p style="color: #7f1d1d; font-size: 14px; margin-bottom: 15px;">Please set these environment variables:</p>
        <ul style="color: #7f1d1d; font-size: 14px; margin-bottom: 20px; padding-left: 20px;">
          <li><strong>VITE_SUPABASE_URL</strong></li>
          <li><strong>VITE_SUPABASE_ANON_KEY</strong></li>
        </ul>
        <p style="color: #7f1d1d; font-size: 12px;">
          For Netlify: Site settings → Build & Deploy → Environment → Add variables
        </p>
        <p style="color: #7f1d1d; font-size: 12px; margin-top: 15px;">
          Check browser console (F12) for more details.
        </p>
      </div>
    </div>
  `;
  throw new Error('Supabase credentials missing');
}

// Render application
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
  
  rootElement.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif; background: #fee2e2; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div style="max-width: 600px;">
        <h1 style="color: #dc2626; margin-bottom: 20px;">❌ Application Error</h1>
        <p style="color: #991b1b; font-size: 16px; margin-bottom: 20px;">Failed to load application</p>
        <div style="background: white; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #7f1d1d; font-size: 14px; font-family: monospace; word-break: break-all; margin: 0;">
            ${error instanceof Error ? error.message : String(error)}
          </p>
        </div>
        <p style="color: #7f1d1d; font-size: 12px;">
          Check browser console (F12) for detailed error information.
        </p>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
