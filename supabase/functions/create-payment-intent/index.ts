import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Логируем метод запроса
  console.log(`--- New Request: ${req.method} ---`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("Auth Header present:", !!authHeader);

    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;

    // Используем Service Role Key, чтобы функция имела права проверять токены
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Извлекаем токен
    const token = authHeader.replace("Bearer ", "");
    
    // ПРОВЕРКА ПОЛЬЗОВАТЕЛЯ
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("Supabase Auth Error:", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid token", details: authError?.message }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated User ID:", user.id);

    const { project_id } = await req.json();
    console.log("Project ID from request:", project_id);

    // Загружаем проект
    const { data: project, error: pError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (pError || !project) {
      console.error("Database Error:", pError?.message);
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Проверка прав (только бренд может платить)
    if (project.brand_user_id !== user.id) {
       return new Response(JSON.stringify({ error: "Forbidden: Not your project" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stripe
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });
    const amountCents = Math.round(Number(project.offered_amount) * 100);

    console.log(`Creating PaymentIntent for ${amountCents} cents...`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      metadata: { project_id: project.id, user_id: user.id },
    });

    console.log("Stripe PI Created:", paymentIntent.id);

    // Обновляем проект
    await supabaseAdmin
      .from("projects")
      .update({ 
        stripe_payment_intent_id: paymentIntent.id, 
        stripe_amount_cents: amountCents,
        updated_at: new Date().toISOString()
      })
      .eq("id", project_id);

    return new Response(
      JSON.stringify({ 
        client_secret: paymentIntent.client_secret, 
        amount_cents: amountCents 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("FUNCTION CRASHED:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});