import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://wncskhubrkivfcgigemz.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3NraHVicmtpdmZjZ2lnZW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzg2NTAsImV4cCI6MjA3NjgxNDY1MH0.dR7nIy4VcNyiiSS6RPhZYKK6efY0sRA5EIscaalN-u4'),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3NraHVicmtpdmZjZ2lnZW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzg2NTAsImV4cCI6MjA3NjgxNDY1MH0.dR7nIy4VcNyiiSS6RPhZYKK6efY0sRA5EIscaalN-u4'),
    'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify('wncskhubrkivfcgigemz'),
  },
}));
