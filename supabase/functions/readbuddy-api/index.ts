// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"; // ✅ moved here

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Example route
    if (path.endsWith("/login") && method === "POST") {
      const { email, password } = await req.json();

      const { data: teacher, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !teacher) {
        return new Response(
          JSON.stringify({ success: false, message: "Email not found" }),
          { status: 400 }
        );
      }

      const valid = await compare(password, teacher.password);
      if (!valid) {
        return new Response(
          JSON.stringify({ success: false, message: "Incorrect password" }),
          { status: 400 }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          teacher: {
            id: teacher.id,
            fullname: teacher.fullname,
            email: teacher.email,
          },
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response("ReadBuddy API running 🧠", { status: 200 });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/readbuddy-api' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
