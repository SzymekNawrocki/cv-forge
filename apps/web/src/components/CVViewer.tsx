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
    <div className="flex flex-col flex-1 min-h-0" style={{ gap: '10px' }}>
      <div className="flex justify-end items-center" style={{ gap: '8px', paddingBottom: '4px', borderBottom: '1px solid #1E1E20' }}>
        {cleanData && (
          <PDFDownloadLink
            document={<CVDocument data={cleanData} />}
            fileName={`tailored-cv-${cvId}.pdf`}
            className="no-underline"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px',
              background: 'linear-gradient(135deg, #FF5722, #FF8C42)',
              border: '1px solid transparent',
              borderRadius: '6px', fontSize: '12px', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              color: '#fff',
              boxShadow: '0 0 10px rgba(255,87,34,0.22), 0 2px 8px rgba(0,0,0,0.30)',
            }}
          >
            {({ loading }: { loading: boolean }) =>
              loading ? "Preparing…" : "✓ Clean & Download"
            }
          </PDFDownloadLink>
        )}
        <PDFDownloadLink
          document={<CVDocument data={data} />}
          fileName={`tailored-cv-${cvId}-draft.pdf`}
          className="no-underline"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px',
            background: '#1A1A1C', border: '1px solid #2A2A2C',
            borderRadius: '6px', fontSize: '12px', fontWeight: 600,
            letterSpacing: '0.06em', color: '#B0BEC5',
          }}
        >
          {({ loading }: { loading: boolean }) =>
            loading ? "Preparing…" : "⬇ Draft PDF"
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
