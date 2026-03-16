import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ivyldrjptlvbeebvspdd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2eWxkcmpwdGx2YmVlYnZzcGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MDA0MDMsImV4cCI6MjA1Njk3NjQwM30.or3ymaI42fl4pNNmhXpCMnIJnaxsjJnOVHAbU3ONfCs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
