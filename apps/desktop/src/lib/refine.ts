// AI Refinement API client

const API_URL = "http://localhost:3002"; // Next.js dev server

interface RefineResponse {
  refinedText: string;
  applied: {
    tone: string;
    language: string;
    formatting: any;
  };
  wordCount?: number;
  cached?: boolean;
}

export async function refineText(
  rawText: string,
  profileId?: string
): Promise<string> {
  try {
    const clientSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const response = await fetch(`${API_URL}/api/refine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        clientSessionId,
        profileId: profileId || null,
        rawText,
        mode: "clean",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to refine text");
    }

    const data: RefineResponse = await response.json();
    return data.refinedText;
  } catch (error: any) {
    console.error("Refine error:", error);
    throw error;
  }
}
