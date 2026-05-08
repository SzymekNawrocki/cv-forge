import { Document, Font, Page, Text, View, StyleSheet, type Styles } from "@react-pdf/renderer";

// Roboto supports full Latin Extended (Polish ą ć ę ł ń ó ś ź ż)
// Module is browser-only (dynamically imported with ssr:false)
const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
Font.register({
  family: "Roboto",
  fonts: [
    { src: `${origin}/fonts/Roboto-Regular.ttf`, fontWeight: 400 },
    { src: `${origin}/fonts/Roboto-Bold.ttf`, fontWeight: 700 },
    { src: `${origin}/fonts/Roboto-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
    { src: `${origin}/fonts/Roboto-BoldItalic.ttf`, fontWeight: 700, fontStyle: "italic" },
  ],
});

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
    fontFamily: "Roboto",
    fontWeight: 400,
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
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "column",
    flex: 1,
  },
  name: {
    fontFamily: "Roboto",
    fontWeight: 700,
    fontSize: 28,
    color: "#111111",
    marginBottom: 4,
    lineHeight: 1.1,
  },
  jobTitle: {
    fontFamily: "Roboto",
    fontWeight: 400,
    fontSize: 13,
    color: "#555555",
    lineHeight: 1.3,
  },
  contactBlock: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 3,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 3,
  },
  contactIcon: {
    width: 14,
    height: 14,
    backgroundColor: "#2d3748",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  contactIconText: {
    fontFamily: "Roboto",
    fontWeight: 700,
    fontSize: 7,
    color: "#ffffff",
  },
  contactLine: {
    fontFamily: "Roboto",
    fontWeight: 400,
    fontSize: 9,
    color: "#333333",
  },
  section: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontFamily: "Roboto",
    fontWeight: 700,
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
    fontFamily: "Roboto",
    fontWeight: 400,
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
    fontFamily: "Roboto",
    fontWeight: 400,
    fontSize: 10,
    color: "#1a1a1a",
  },
  bulletText: {
    flex: 1,
    fontFamily: "Roboto",
    fontWeight: 400,
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
    fontFamily: "Roboto",
    fontWeight: 700,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#111111",
  },
  entryDate: {
    fontFamily: "Roboto",
    fontWeight: 400,
    fontSize: 9,
    color: "#666666",
  },
  entryRole: {
    fontFamily: "Roboto",
    fontWeight: 400,
    fontStyle: "italic",
    fontSize: 10,
    color: "#333333",
    marginBottom: 3,
  },
});

const UNDERLINE_BOLD_SECTIONS = new Set(["PROJECTS", "CERTIFICATIONS"]);

function BoldText({ text, style, underlineBold = false }: { text: string; style: Styles[string]; underlineBold?: boolean }) {
  const cleaned = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <Text key={i} style={{ fontFamily: "Roboto", fontWeight: 700, ...(underlineBold ? { textDecoration: "underline" } : {}) }}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

function ContactIcon({ char }: { char: string }) {
  return (
    <View style={s.contactIcon}>
      <Text style={s.contactIconText}>{char}</Text>
    </View>
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
            <BoldText text={item} style={s.bulletText} underlineBold={UNDERLINE_BOLD_SECTIONS.has(section.heading)} />
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

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.name}>{data.name}</Text>
            {data.title ? <Text style={s.jobTitle}>{data.title}</Text> : null}
          </View>
          <View style={s.contactBlock}>
            {contact.email && (
              <View style={s.contactRow}>
                <Text style={s.contactLine}>{contact.email}</Text>
                <ContactIcon char="@" />
              </View>
            )}
            {contact.phone && (
              <View style={s.contactRow}>
                <Text style={s.contactLine}>{contact.phone}</Text>
                <ContactIcon char="#" />
              </View>
            )}
            {(contact.portfolio || contact.github) && (
              <View style={s.contactRow}>
                <Text style={s.contactLine}>
                  {contact.portfolio && contact.github
                    ? `${contact.portfolio} | ${contact.github}`
                    : contact.portfolio || contact.github}
                </Text>
                <ContactIcon char="+" />
              </View>
            )}
            {contact.location && (
              <View style={s.contactRow}>
                <Text style={s.contactLine}>{contact.location}</Text>
                <ContactIcon char="o" />
              </View>
            )}
          </View>
        </View>

        {/* Sections */}
        {data.sections.map((section, i) => (
          <SectionBlock key={i} section={section} />
        ))}
      </Page>
    </Document>
  );
}
