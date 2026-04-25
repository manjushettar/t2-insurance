import { NextRequest, NextResponse } from "next/server";
import { buildInitialStateFromOnboarding, OnboardingInput } from "@/lib/onboarding";
import { listBusinesses, upsertBusinessState } from "@/lib/server/business-store";

export async function GET() {
  const businesses = await listBusinesses();
  return NextResponse.json({ businesses });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as OnboardingInput;
  const initialState = buildInitialStateFromOnboarding(payload);
  const saved = await upsertBusinessState(initialState);
  return NextResponse.json({ id: saved.profile.id, state: saved }, { status: 201 });
}
