"use client";

import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { CVDocument, type CVData } from "./CVDocument";

interface Props {
  data: CVData;
  cvId: number;
}

export default function CVViewer({ data, cvId }: Props) {
  return (
    <div className="flex flex-col flex-1 gap-2 min-h-0">
      <div className="flex justify-end">
        <PDFDownloadLink
          document={<CVDocument data={data} />}
          fileName={`tailored-cv-${cvId}.pdf`}
          className="px-3 py-1.5 bg-slate-800 text-white text-sm font-medium rounded hover:bg-slate-700 transition-colors no-underline"
        >
          {({ loading }: { loading: boolean }) =>
            loading ? "Preparing…" : "Download PDF"
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
