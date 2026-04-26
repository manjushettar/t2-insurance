import { NextResponse } from "next/server";
import { getBusinessStateById } from "@/lib/server/business-store";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const state = await getBusinessStateById(params.id);
  if (!state) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  return NextResponse.json({ state });
}
