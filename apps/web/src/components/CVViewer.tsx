"use client";

import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { CVDocument, type CVData } from "./CVDocument";

interface Props {
  data: CVData;
  cvId: number;
  cleanData?: CVData;
}

export default function CVViewer({ data, cvId, cleanData }: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2.5">
      <div className="flex justify-end items-center gap-2 pb-1 border-b border-forge-elevated">
        {cleanData && (
          <PDFDownloadLink
            document={<CVDocument data={cleanData} />}
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
          document={<CVDocument data={data} />}
          fileName={`tailored-cv-${cvId}-draft.pdf`}
          className="inline-flex items-center gap-1.5 py-[7px] px-4 bg-[#1A1A1C] border border-[#2A2A2C] rounded-md text-xs font-semibold tracking-[0.06em] text-forge-steel no-underline"
        >
          {({ loading }: { loading: boolean }) =>
            loading ? "Preparing…" : "⬇ Draft PDF"
          }
        </PDFDownloadLink>
      </div>
      <PDFViewer className="flex-1 w-full border-none rounded min-h-0">
        <CVDocument data={data} />
      </PDFViewer>
    </div>
  );
}
