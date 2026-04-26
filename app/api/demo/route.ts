import { NextRequest, NextResponse } from "next/server";
import { seedDemoState } from "@/lib/server/business-store";
import { getAIContext } from "@/lib/ai-context";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { preset?: "oakland" | "contractor" };
  const preset = body.preset === "contractor" ? "contractor" : "oakland";

  const state = await seedDemoState(preset);
  const aiContext = getAIContext(state);

  return NextResponse.json({
    id: state.profile.id,
    state,
    aiContext
  });
}
