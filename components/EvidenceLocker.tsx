import { EvidenceDocument } from "@/lib/types";
import { Card, Pill } from "@/components/ui";

function statusTone(status: EvidenceDocument["status"]): "default" | "warn" | "danger" | "good" {
  if (status === "current" || status === "uploaded") return "good";
  if (status === "stale") return "warn";
  if (status === "expired" || status === "missing") return "danger";
  return "default";
}

export default function EvidenceLocker({ evidence }: { evidence: EvidenceDocument[] }) {
  return (
    <Card title="Evidence Locker">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-3">Document</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">Underwriting Relevance</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((doc) => (
              <tr key={doc.id} className="border-b border-slate-100 align-top">
                <td className="py-2 pr-3 font-medium text-slate-800">{doc.name}</td>
                <td className="py-2 pr-3 text-slate-600">{doc.documentType}</td>
                <td className="py-2 pr-3">
                  <Pill text={doc.status} tone={statusTone(doc.status)} />
                </td>
                <td className="py-2 text-slate-600">{doc.underwritingRelevance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
