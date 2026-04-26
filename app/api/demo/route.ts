import { NextRequest, NextResponse } from "next/server";
import { seedDemoState } from "@/lib/server/business-store";
import { getAIContext } from "@/lib/ai-context";
import { parseClaimsData, parsePayrollData } from "@/lib/file-parser";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { preset?: "oakland" | "contractor" };
  const preset = body.preset === "contractor" ? "contractor" : "oakland";

  const state = await seedDemoState(preset);

  const claimsData = parseClaimsData();

state.claimsFinancial.totalClaimsCount = claimsData.totalClaimsCount;
state.claimsFinancial.claimsOpenCount = claimsData.openClaimsCount;
state.claimsFinancial.averageClaimSeverity =
  claimsData.totalClaimsPaid / claimsData.totalClaimsCount;

const payrollData = parsePayrollData();

state.profile.employeeCount = payrollData.employeeCount;
state.profile.payroll = payrollData.payroll;

const aiContext = getAIContext(state);

  return NextResponse.json({
    id: state.profile.id,
    state,
    aiContext
  });
}