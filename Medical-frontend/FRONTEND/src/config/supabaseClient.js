import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase Configuration:");
console.log("URL:", supabaseUrl);
console.log("Key exists:", !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
  console.log("Initial Supabase connection test:", { data, error });
});
