import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

// CORS headers for local development
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:1420",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    // Development mode: skip auth if DEEPGRAM_API_KEY is set
    const isDevelopment = process.env.NODE_ENV === 'development' && process.env.DEEPGRAM_API_KEY;

    let user: any = null;

    if (!isDevelopment) {
      const supabase = await createClient();

      // Check authentication
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
      }

      user = authUser;
    } else {
      // Mock user for development
      user = { id: 'dev-user' };
    }

    const { provider, profileId } = await req.json();

    let usage = 0;
    let isPro = true;
    let weeklyLimit = 999999;

    // Skip usage checks in development mode
    if (!isDevelopment) {
      const supabase = await createClient();

      // For MVP: check weekly usage
      const { data: usageData } = await supabase.rpc("get_weekly_usage", {
        p_user: user.id,
        p_event_type: "refine_words",
      });
      usage = usageData || 0;

      // Check subscription status
      const { data: subscription } = await supabase
        .from("stripe_subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .single();

      isPro = !!subscription;
      weeklyLimit = isPro ? 999999 : 2000; // Free: 2000 words/week, Pro: unlimited

      if (usage && usage >= weeklyLimit) {
        return NextResponse.json(
          {
            error: "Weekly limit reached",
            limit: weeklyLimit,
            used: usage,
          },
          { status: 402, headers: corsHeaders }
        );
      }
    }

    // Generate ephemeral token based on provider
    let token: string;
    let expiresAt: string;

    if (provider === "deepgram") {
      // Deepgram ephemeral token
      const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
      if (!deepgramApiKey) {
        return NextResponse.json(
          { error: "STT provider not configured" },
          { status: 500, headers: corsHeaders }
        );
      }

      // For browser WebSocket, use raw API key via Sec-WebSocket-Protocol
      // This is the recommended method per Deepgram docs
      token = deepgramApiKey;
      expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    } else {
      return NextResponse.json(
        { error: "Unsupported provider" },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      token,
      expiresAt,
      limits: {
        weeklyRefineWordsRemaining: weeklyLimit - (usage || 0),
        isPro,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("STT token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
