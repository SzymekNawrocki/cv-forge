"use client";

import { useState } from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { CVDocument, type CVData } from "./CVDocument";
import { ATSDocument } from "./cv-templates/ATSTemplate";

interface Props {
  data: CVData;
  cvId: number;
  masterCvId?: number;
  cleanData?: CVData;
}

export default function CVViewer({ data, cvId, masterCvId, cleanData }: Props) {
  const [template, setTemplate] = useState<"designer" | "ats">("designer");

  const Document = template === "ats" ? ATSDocument : CVDocument;
  const cleanDocument = cleanData
    ? (template === "ats" ? <ATSDocument data={cleanData} /> : <CVDocument data={cleanData} />)
    : null;
  const draftDocument = template === "ats" ? <ATSDocument data={data} /> : <CVDocument data={data} />;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2.5">
      <div className="flex justify-between items-center pb-1 border-b border-forge-elevated gap-2">
        {/* Template toggle */}
        <div className="flex gap-0.5">
          {(["designer", "ats"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={`py-[5px] px-3 font-display text-[9px] font-bold tracking-[0.12em] uppercase cursor-pointer rounded-[4px] border transition-colors ${
                template === t
                  ? "bg-forge-elevated border-forge-line text-forge-text"
                  : "bg-transparent border-transparent text-forge-muted"
              }`}
            >
              {t === "designer" ? "Designer" : "ATS Safe"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {cleanData && cleanDocument && (
            <PDFDownloadLink
              document={cleanDocument}
              fileName={`tailored-cv-${cvId}.pdf`}
              className="inline-flex items-center gap-1.5 py-[7px] px-4 rounded-md text-xs font-bold tracking-[0.08em] uppercase text-white no-underline shadow-[0_0_10px_rgba(255,87,34,0.22),0_2px_8px_rgba(0,0,0,0.30)]"
              style={{ background: 'linear-gradient(135deg, #FF5722, #FF8C42)', border: '1px solid transparent' }}
            >
              {({ loading }: { loading: boolean }) =>
                loading ? "Preparing…" : "✓ Clean & Download"
              }
            </PDFDownloadLink>
          )}
          <PDFDownloadLink
            document={draftDocument}
            fileName={`tailored-cv-${cvId}-draft.pdf`}
            className="inline-flex items-center gap-1.5 py-[7px] px-4 bg-forge-input border border-forge-line rounded-md text-xs font-semibold tracking-[0.06em] text-forge-steel no-underline"
          >
            {({ loading }: { loading: boolean }) =>
              loading ? "Preparing…" : "⬇ Draft PDF"
            }
          </PDFDownloadLink>
        </div>
      </div>
      <PDFViewer className="flex-1 w-full border-none rounded min-h-0">
        <Document data={data} />
      </PDFViewer>
    </div>
  );
}
