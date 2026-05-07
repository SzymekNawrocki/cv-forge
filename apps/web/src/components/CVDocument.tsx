import { Document, Page, Text, View, StyleSheet, type Styles } from "@react-pdf/renderer";

export interface CVEntry {
  org: string;
  role: string;
  date: string;
  bullets: string[];
}

export interface CVSection {
  heading: string;
  type: "paragraph" | "bullets" | "entries";
  content?: string;
  items?: string[];
  entries?: CVEntry[];
}

export interface CVData {
  name: string;
  title: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    portfolio?: string;
    github?: string;
  };
  sections: CVSection[];
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 44,
    paddingBottom: 44,
    paddingHorizontal: 52,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  name: {
    fontFamily: "Helvetica-Bold",
    fontSize: 28,
    color: "#111111",
    marginBottom: 3,
  },
  jobTitle: {
    fontSize: 13,
    color: "#555555",
  },
  contactBlock: {
    alignItems: "flex-end",
  },
  contactLine: {
    fontSize: 9,
    color: "#333333",
    marginBottom: 2,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#111111",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingBottom: 3,
    borderBottomWidth: 1.5,
    borderBottomColor: "#111111",
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.55,
    color: "#1a1a1a",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    color: "#1a1a1a",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: "#1a1a1a",
  },
  entryWrap: {
    marginBottom: 7,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  entryOrg: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#111111",
  },
  entryDate: {
    fontSize: 9,
    color: "#666666",
  },
  entryRole: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 10,
    color: "#333333",
    marginBottom: 3,
  },
});

function BoldText({ text, style }: { text: string; style: Styles[string] }) {
  const cleaned = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <Text key={i} style={{ fontFamily: "Helvetica-Bold" }}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

function SectionBlock({ section }: { section: CVSection }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionHeading}>{section.heading}</Text>

      {section.type === "paragraph" && section.content && (
        <Text style={s.paragraph}>{section.content}</Text>
      )}

      {section.type === "bullets" &&
        section.items?.map((item, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.bulletDot}>{"•"}</Text>
            <BoldText text={item} style={s.bulletText} />
          </View>
        ))}

      {section.type === "entries" &&
        section.entries?.map((entry, i) => (
          <View key={i} style={s.entryWrap}>
            <View style={s.entryHeader}>
              <Text style={s.entryOrg}>{entry.org}</Text>
              <Text style={s.entryDate}>{entry.date}</Text>
            </View>
            {entry.role ? <Text style={s.entryRole}>{entry.role}</Text> : null}
            {entry.bullets.map((b, j) => (
              <View key={j} style={s.bulletRow}>
                <Text style={s.bulletDot}>{"•"}</Text>
                <Text style={s.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        ))}
    </View>
  );
}

export function CVDocument({ data }: { data: CVData }) {
  const { contact } = data;
  const contactLines: string[] = [
    contact.email,
    contact.phone,
    contact.portfolio && contact.github
      ? `${contact.portfolio} | ${contact.github}`
      : contact.portfolio || contact.github,
    contact.location,
  ].filter(Boolean) as string[];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.name}>{data.name}</Text>
            {data.title ? <Text style={s.jobTitle}>{data.title}</Text> : null}
          </View>
          <View style={s.contactBlock}>
            {contactLines.map((line, i) => (
              <Text key={i} style={s.contactLine}>{line}</Text>
            ))}
          </View>
        </View>
        {data.sections.map((section, i) => (
          <SectionBlock key={i} section={section} />
        ))}
      </Page>
    </Document>
  );
}
