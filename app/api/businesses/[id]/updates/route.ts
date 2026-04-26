import { NextRequest, NextResponse } from "next/server";
import { applyBusinessUpdate } from "@/lib/server/business-store";
import { BusinessUpdateInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = (await request.json()) as BusinessUpdateInput;
    const state = await applyBusinessUpdate(params.id, payload);
    return NextResponse.json({ state });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
