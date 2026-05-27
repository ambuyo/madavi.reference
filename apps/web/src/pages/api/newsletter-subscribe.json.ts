import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";
import { verifyTurnstile } from "@/lib/turnstile";

interface Subscriber {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  interest: string;
  subscribedAt: string;
}

const subscriptionsFile = path.join(process.cwd(), ".cache", "newsletter-subscribers.json");

function readSubscribers(): Subscriber[] {
  try {
    if (fs.existsSync(subscriptionsFile)) {
      const data = fs.readFileSync(subscriptionsFile, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading subscribers:", error);
  }
  return [];
}

function writeSubscribers(subscribers: Subscriber[]): void {
  const cacheDir = path.join(process.cwd(), ".cache");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  fs.writeFileSync(subscriptionsFile, JSON.stringify(subscribers, null, 2));
}

export const POST: APIRoute = async ({ request }) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, interest, privacy, turnstileToken } = body;

    // Turnstile verification
    const ip = request.headers.get("CF-Connecting-IP") ?? undefined;
    const turnstileOk = await verifyTurnstile(turnstileToken ?? "", ip);
    if (!turnstileOk) {
      return new Response(
        JSON.stringify({ error: "Bot verification failed", message: "Please complete the security check and try again." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validation
    if (!firstName || !lastName || !email || !privacy) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          fields: { firstName, lastName, email, privacy },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if already subscribed
    const subscribers = readSubscribers();
    if (subscribers.some((s) => s.email === email)) {
      return new Response(
        JSON.stringify({
          error: "Email already subscribed",
          message: "This email is already on our newsletter list.",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add new subscriber
    const newSubscriber: Subscriber = {
      id: Math.random().toString(36).substring(2, 11),
      firstName,
      lastName,
      email,
      interest: interest || "all",
      subscribedAt: new Date().toISOString(),
    };

    subscribers.push(newSubscriber);
    writeSubscribers(subscribers);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully subscribed to newsletter",
        subscriber: {
          email: newSubscriber.email,
          name: `${newSubscriber.firstName} ${newSubscriber.lastName}`,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to process subscription",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
