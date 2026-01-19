import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

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
    // Development mode: skip auth if ANTHROPIC_API_KEY is set
    const isDevelopment = process.env.NODE_ENV === 'development' && process.env.ANTHROPIC_API_KEY;

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

    const { clientSessionId, profileId, rawText, mode } = await req.json();

    if (!rawText || !clientSessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    let profile = null;

    // Skip database checks in development mode
    if (!isDevelopment) {
      const supabase = await createClient();

      // Check for existing session (idempotency)
      const { data: existingSession } = await supabase
        .from("dictation_sessions")
        .select("refined_text, status")
        .eq("user_id", user.id)
        .eq("client_session_id", clientSessionId)
        .eq("status", "refined")
        .single();

      if (existingSession?.refined_text) {
        // Return cached result
        return NextResponse.json({
          refinedText: existingSession.refined_text,
          cached: true,
        }, { headers: corsHeaders });
      }

      // Get profile settings
      if (profileId) {
        const { data } = await supabase
          .from("app_profiles")
          .select("*")
          .eq("id", profileId)
          .single();
        profile = data;
      } else {
        // Get default profile
        const { data } = await supabase
          .from("app_profiles")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .single();
        profile = data;
      }
    }

    // Build refinement prompt
    const tone = profile?.tone || "professional";
    const language = profile?.language || "nl-NL";
    const formatting = profile?.formatting || {};

    let systemPrompt = `You are a text refinement assistant. Your job is to take raw voice transcriptions and polish them into clean, well-formatted text.

Tone: ${tone}
Language: ${language}

IMPORTANT: The input text is in ${language === 'nl-NL' ? 'Dutch (Nederlands)' : language}. You MUST output the refined text in the SAME language as the input.
`;

    if (formatting.bullets) {
      systemPrompt += "\nFormat as bullet points when appropriate.";
    }
    if (formatting.max_length) {
      systemPrompt += `\nKeep output under ${formatting.max_length} characters.`;
    }
    if (formatting.capitalization) {
      systemPrompt += `\nCapitalization style: ${formatting.capitalization}`;
    }
    if (formatting.preserve_code) {
      systemPrompt += "\nPreserve code snippets, variable names, and technical terms exactly as spoken.";
    }

    systemPrompt += "\n\nRules:\n- Remove filler words (eh, uhm, nou, zeg maar for Dutch / um, uh, like for English)\n- Fix grammar and punctuation\n- Keep the meaning intact\n- Keep the SAME language as the input\n- Output ONLY the refined text, no explanations";

    // Call Claude API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: rawText,
        },
      ],
    });

    const refinedText =
      message.content[0].type === "text" ? message.content[0].text : rawText;

    // Count words for usage tracking
    const wordCount = refinedText.split(/\s+/).length;

    // Save session to database (skip in development mode)
    if (!isDevelopment) {
      const supabase = await createClient();

      await supabase.from("dictation_sessions").upsert({
        user_id: user.id,
        profile_id: profileId,
        client_session_id: clientSessionId,
        status: "refined",
        input_text: rawText,
        refined_text: refinedText,
      });

      // Log usage
      await supabase.from("usage_events").insert({
        user_id: user.id,
        event_type: "refine_words",
        quantity: wordCount,
        meta: {
          profile_id: profileId,
          session_id: clientSessionId,
        },
      });
    }

    return NextResponse.json({
      refinedText,
      applied: {
        tone,
        language,
        formatting,
      },
      wordCount,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Refine error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
