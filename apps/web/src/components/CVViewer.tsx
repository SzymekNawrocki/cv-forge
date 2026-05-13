"use client";

import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { CVDocument, type CVData } from "./CVDocument";

interface Props {
  data: CVData;
  cvId: number;
}

export default function CVViewer({ data, cvId }: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ gap: '10px' }}>
      <div className="flex justify-end items-center" style={{ paddingBottom: '4px', borderBottom: '1px solid #1E1E20' }}>
        <PDFDownloadLink
          document={<CVDocument data={data} />}
          fileName={`tailored-cv-${cvId}.pdf`}
          className="no-underline"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px',
            background: '#1A1A1C', border: '1px solid #2A2A2C',
            borderRadius: '6px', fontSize: '12px', fontWeight: 600,
            letterSpacing: '0.06em', color: '#B0BEC5',
            transition: 'all 0.15s ease',
          }}
        >
          {({ loading }: { loading: boolean }) =>
            loading ? "Preparing…" : "⬇ Download PDF"
          }
        </PDFDownloadLink>
      </div>
      <PDFViewer
        style={{ flex: 1, width: "100%", border: "none", borderRadius: "0.375rem", minHeight: 0 }}
      >
        <CVDocument data={data} />
      </PDFViewer>
    </div>
  );
}
