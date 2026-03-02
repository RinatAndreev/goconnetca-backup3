// supabase/functions/stripe-webhook/index.ts
// Deploy: supabase functions deploy stripe-webhook
//
// In Stripe Dashboard → Webhooks → Add endpoint:
//   URL: https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
//   Events to listen for:
//     - payment_intent.succeeded
//     - payment_intent.payment_failed

import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Missing stripe-signature or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("Stripe webhook received:", event.type, event.id);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const project_id = pi.metadata?.project_id;

        if (!project_id) {
          console.warn("No project_id in PaymentIntent metadata:", pi.id);
          break;
        }

        // Update project: status → active, payment_status → paid
        const { error } = await supabaseAdmin
          .from("projects")
          .update({
            status: "active",
            payment_status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", project_id)
          .eq("status", "waiting_for_payment"); // Safety: only advance if still waiting

        if (error) {
          console.error("Failed to update project after payment:", error);
          // Return 200 anyway — Stripe doesn't need to retry for DB errors
        } else {
          console.log(`Project ${project_id} → active (payment ${pi.id} succeeded)`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const project_id = pi.metadata?.project_id;

        if (project_id) {
          // Just clear the PI id so the brand can retry with a fresh PaymentIntent
          await supabaseAdmin
            .from("projects")
            .update({
              stripe_payment_intent_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", project_id);

          console.log(`PaymentIntent failed for project ${project_id}, cleared PI id for retry`);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }
  } catch (err: any) {
    console.error("Error processing webhook:", err);
    // Still return 200 — tell Stripe we received it, even if we had an internal error
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});