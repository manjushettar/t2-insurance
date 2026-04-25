"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppState, BusinessProfile, BusinessType, EvidenceDocument, LocationRisk } from "@/lib/types";
import { saveAppState } from "@/lib/storage";

function baselineEvidence(id: string, type: BusinessType): EvidenceDocument[] {
  const docs: EvidenceDocument[] = [
    {
      id: `doc-license-${id}`,
      businessId: id,
      documentType: "business-license",
      name: "Business License",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Entity verification.",
      confidenceImpact: 4
    },
    {
      id: `doc-loss-${id}`,
      businessId: id,
      documentType: "loss-runs",
      name: "Loss Runs",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Loss history validation.",
      confidenceImpact: -8
    },
    {
      id: `doc-payroll-${id}`,
      businessId: id,
      documentType: "payroll-report",
      name: "Payroll Report",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Payroll and exposure review.",
      confidenceImpact: -6
    }
  ];

  if (type === "restaurant") {
    docs.push({
      id: `doc-fire-${id}`,
      businessId: id,
      documentType: "fire-suppression-inspection",
      name: "Fire Suppression Inspection",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Restaurant fire controls.",
      confidenceImpact: -10
    });
  }

  if (type === "contractor") {
    docs.push(
      {
        id: `doc-coi-${id}`,
        businessId: id,
        documentType: "subcontractor-coi",
        name: "Subcontractor COIs",
        uploadedAt: "",
        status: "missing",
        extractedFields: [],
        underwritingRelevance: "Transfer-of-risk proof.",
        confidenceImpact: -10
      },
      {
        id: `doc-driver-${id}`,
        businessId: id,
        documentType: "driver-list",
        name: "Driver List",
        uploadedAt: "",
        status: "missing",
        extractedFields: [],
        underwritingRelevance: "Commercial auto controls.",
        confidenceImpact: -8
      }
    );
  }

  return docs;
}

function locationFromZip(zipCode: string): LocationRisk {
  return {
    zipCode,
    naturalHazardLevel: "medium",
    floodRisk: "medium",
    wildfireRisk: "medium",
    severeWeatherRisk: "medium",
    crimeOrTheftRisk: "medium",
    explanation: "Placeholder ZIP risk profile for MVP demo."
  };
}

export default function OnboardingForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("restaurant");
  const [description, setDescription] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [payroll, setPayroll] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [customerFootTraffic, setCustomerFootTraffic] = useState(true);
  const [offsiteWork, setOffsiteWork] = useState(false);
  const [vehiclesUsed, setVehiclesUsed] = useState(false);
  const [subcontractorsUsed, setSubcontractorsUsed] = useState(false);
  const [priorClaims, setPriorClaims] = useState("");
  const [documents, setDocuments] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const id = `biz-${Date.now()}`;

    const profile: BusinessProfile = {
      id,
      businessName,
      businessType,
      legalEntityName: businessName,
      yearsInBusiness: Number(yearsInBusiness) || 0,
      description,
      address: "",
      zipCode,
      state: "CA",
      annualRevenue: Number(annualRevenue) || 0,
      payroll: Number(payroll) || 0,
      employeeCount: Number(employeeCount) || 0,
      customerFootTraffic,
      offsiteWork,
      vehiclesUsed,
      subcontractorsUsed,
      storesCustomerData: true,
      priorClaims: priorClaims ? [priorClaims] : [],
      lastUpdatedAt: new Date().toISOString()
    };

    const evidence = baselineEvidence(id, businessType);
    if (documents.trim()) {
      evidence.push({
        id: `doc-existing-${Date.now()}`,
        businessId: id,
        documentType: "owner-supplied-list",
        name: `Owner reports available docs: ${documents}`,
        uploadedAt: new Date().toISOString(),
        status: "uploaded",
        extractedFields: [],
        underwritingRelevance: "Initial evidence inventory from owner.",
        confidenceImpact: 4
      });
    }

    const newState: AppState = {
      profile,
      locationRisk: locationFromZip(zipCode),
      evidence,
      timeline: [
        {
          id: `ev-${Date.now()}`,
          businessId: id,
          date: new Date().toISOString().slice(0, 10),
          title: "Initial onboarding completed",
          description: "Created business readiness profile.",
          scoreImpact: 0,
          confidenceImpact: 0,
          category: "business-change"
        }
      ],
      scoreTrend: [{ date: new Date().toISOString().slice(0, 10), readiness: 50, confidence: 40 }],
      renewalDate: new Date(new Date().setMonth(new Date().getMonth() + 8)).toISOString().slice(0, 10)
    };

    saveAppState(newState);
    router.push("/dashboard");
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Business Onboarding</h2>
      <p className="text-sm text-slate-600">This is a readiness and evidence-preparation tool. It does not provide quotes or coverage decisions.</p>

      <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />

      <select value={businessType} onChange={(e) => setBusinessType(e.target.value as BusinessType)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="restaurant">Restaurant / Cafe</option>
        <option value="contractor">Contractor</option>
        <option value="retail">Retail</option>
        <option value="other">Other</option>
      </select>

      <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your business in plain English" className="h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />

      <div className="grid gap-3 md:grid-cols-2">
        <input required value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="ZIP code" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input required value={annualRevenue} onChange={(e) => setAnnualRevenue(e.target.value)} placeholder="Annual revenue" type="number" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input required value={payroll} onChange={(e) => setPayroll(e.target.value)} placeholder="Payroll" type="number" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input required value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} placeholder="Employee count" type="number" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input required value={yearsInBusiness} onChange={(e) => setYearsInBusiness(e.target.value)} placeholder="Years in business" type="number" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
        <label><input type="checkbox" checked={customerFootTraffic} onChange={(e) => setCustomerFootTraffic(e.target.checked)} className="mr-2" />Do customers visit the premises?</label>
        <label><input type="checkbox" checked={offsiteWork} onChange={(e) => setOffsiteWork(e.target.checked)} className="mr-2" />Do employees work off-site?</label>
        <label><input type="checkbox" checked={vehiclesUsed} onChange={(e) => setVehiclesUsed(e.target.checked)} className="mr-2" />Do you use vehicles?</label>
        <label><input type="checkbox" checked={subcontractorsUsed} onChange={(e) => setSubcontractorsUsed(e.target.checked)} className="mr-2" />Do you use subcontractors?</label>
      </div>

      <input value={priorClaims} onChange={(e) => setPriorClaims(e.target.value)} placeholder="Any prior claims?" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input value={documents} onChange={(e) => setDocuments(e.target.value)} placeholder="What documents do you already have?" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />

      <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Continue to Dashboard</button>
    </form>
  );
}
