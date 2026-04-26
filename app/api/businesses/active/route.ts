import { NextResponse } from "next/server";
import { getBusinessStateById, listBusinesses } from "@/lib/server/business-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const businesses = await listBusinesses();
  const first = businesses[0];
  if (!first) {
    return NextResponse.json({ state: null });
  }

  const state = await getBusinessStateById(first.id);
  return NextResponse.json({ state });
}
