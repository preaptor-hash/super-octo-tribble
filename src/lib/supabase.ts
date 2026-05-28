import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration:');
console.log('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ MISSING');
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Supabase credentials are missing!');
  console.error('Please ensure these environment variables are set:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,       // Store session in localStorage (survives refresh)
    autoRefreshToken: true,     // Silently renew token before expiry
    detectSessionInUrl: false,  // We don't use magic-link / OAuth redirects
  },
});

// Test connection on load
export const uploadToSupabaseStorage = async (bucket: string, file: File, pathPrefix: string): Promise<string | null> => {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${pathPrefix}_${Date.now()}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) {
    console.error('Upload to storage error:', error.message);
    return null;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return data.publicUrl;
};
supabase.auth.getSession()
  .then(({ error }) => {
    if (error) {
      console.error('❌ Supabase connection error:', error.message);
    } else {
      console.log('✅ Supabase connected successfully');
    }
  })
  .catch((err) => {
    console.error('❌ Failed to connect to Supabase:', err);
  });

