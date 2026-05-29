import { Document, Page, Text, View, StyleSheet, type Styles } from "@react-pdf/renderer";
import { splitMarkers } from "@/lib/aiMarker";
import type { CVData, CVSection } from "@/components/CVDocument";

// Single-column, Helvetica-only — maximum ATS compatibility (no custom fonts needed)
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 56,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
    lineHeight: 1.45,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginBottom: 3,
  },
  jobTitle: {
    fontSize: 12,
    color: "#444444",
    marginBottom: 5,
  },
  contactLine: {
    fontSize: 9,
    color: "#555555",
    marginBottom: 14,
  },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    marginBottom: 10,
  },
  sectionHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#111111",
    marginBottom: 5,
    marginTop: 10,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.55,
    color: "#1a1a1a",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDot: {
    width: 12,
    fontSize: 10,
    color: "#1a1a1a",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.45,
    color: "#1a1a1a",
  },
  entryOrg: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#111111",
  },
  entryRole: {
    fontSize: 10,
    color: "#333333",
    marginBottom: 2,
  },
  entryDate: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 2,
  },
  entryWrap: { marginBottom: 6 },
  link: {
    fontSize: 9,
    color: "#1a56db",
    textDecoration: "underline",
  },
});

function PlainText({ text, style }: { text: string; style: Styles[string] }) {
  const cleaned = text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[AI:\]/g, "").replace(/\[:AI\]/g, "");
  const parts = splitMarkers(cleaned);
  return (
    <Text style={style}>
      {parts.map(({ text: t, ai }, i) =>
        ai ? (
          <Text key={i} style={{ color: "#B45309", fontFamily: "Helvetica-Bold" }}>{t}</Text>
        ) : (
          <Text key={i}>{t}</Text>
        )
      )}
    </Text>
  );
}

function SectionBlock({ section }: { section: CVSection }) {
  return (
    <View>
      <Text style={s.sectionHeading}>{section.heading}</Text>
      <View style={s.rule} />

      {section.type === "paragraph" && section.content && (
        <PlainText text={section.content} style={s.paragraph} />
      )}

      {section.type === "bullets" &&
        section.items?.map((item, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.bulletDot}>- </Text>
            <PlainText text={item} style={s.bulletText} />
          </View>
        ))}

      {section.type === "entries" &&
        section.entries?.map((entry, i) => (
          <View key={i} style={s.entryWrap}>
            <Text style={s.entryOrg}>{entry.org}</Text>
            {entry.role ? <Text style={s.entryRole}>{entry.role}</Text> : null}
            {entry.date ? <Text style={s.entryDate}>{entry.date}</Text> : null}
            {entry.bullets.map((b, j) => (
              <View key={j} style={s.bulletRow}>
                <Text style={s.bulletDot}>- </Text>
                <PlainText text={b} style={s.bulletText} />
              </View>
            ))}
          </View>
        ))}
    </View>
  );
}

export function ATSDocument({ data }: { data: CVData }) {
  const { contact } = data;
  const contactParts = [
    contact.email,
    contact.phone,
    contact.location,
    contact.portfolio,
    contact.github,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{data.name}</Text>
        {data.title ? <Text style={s.jobTitle}>{data.title}</Text> : null}
        <Text style={s.contactLine}>{contactParts.join("  |  ")}</Text>

        {data.sections.map((section, i) => (
          <SectionBlock key={i} section={section} />
        ))}
      </Page>
    </Document>
  );
}
