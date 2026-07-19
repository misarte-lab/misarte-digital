(() => {
  const SUPABASE_URL = "https://sflpvafkopvngciojaqe.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3fRcC4NF1Ni4fBm2JGmxwA_MAC-AR1B";

  if (!window.supabase) {
    throw new Error("A biblioteca do Supabase não foi carregada.");
  }

  window.misarteSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();
