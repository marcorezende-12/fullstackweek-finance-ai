import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Interface estendida para acessar campos não tipados da fatura
interface ExtendedInvoice extends Stripe.Invoice {
  parent?: {
    subscription_details?: {
      subscription?: string;
      metadata?: {
        clerk_user_id?: string;
      };
    };
  };
}

export const POST = async (request: Request) => {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return NextResponse.error();

    const text = await request.text();

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.error();
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-10-28.acacia",
    });

    const event = stripe.webhooks.constructEvent(
      text,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as ExtendedInvoice;

        const subscriptionId =
          invoice.parent?.subscription_details?.subscription;
        const clerkUserId =
          invoice.parent?.subscription_details?.metadata?.clerk_user_id;
        const customerId = invoice.customer as string;

        if (!subscriptionId || !clerkUserId || !customerId) {
          return NextResponse.error();
        }

        await clerkClient.users.updateUser(clerkUserId, {
          privateMetadata: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          },
          publicMetadata: {
            subscriptionPlan: "premium",
          },
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkUserId = subscription.metadata?.clerk_user_id;

        if (!clerkUserId) {
          return NextResponse.error();
        }

        await clerkClient.users.updateUser(clerkUserId, {
          privateMetadata: {
            stripeCustomerId: null,
            stripeSubscriptionId: null,
          },
          publicMetadata: {
            subscriptionPlan: null,
          },
        });

        break;
      }

      default:
        // Evento ignorado
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.error();
  }
};
