const ALLOWED_PUBLIC_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

export function readPublicConfig(env = import.meta.env) {
  const unexpected = Object.keys(env).filter(
    (key) => key.startsWith('VITE_') && !ALLOWED_PUBLIC_KEYS.includes(key),
  );
  if (unexpected.length > 0) {
    throw new Error(`Unexpected public env variables: ${unexpected.join(', ')}`);
  }
  return {
    supabaseUrl: env.VITE_SUPABASE_URL,
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
  };
}
