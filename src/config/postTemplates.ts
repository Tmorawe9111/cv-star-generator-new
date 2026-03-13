import type { PostTemplate, PostMeta, PostType } from "@/types/community";

export const POST_TEMPLATES: PostTemplate[] = [
  {
    type: "projekt",
    icon: "🔨",
    label: "Projekt zeigen",
    placeholder:
      "Heute fertig geworden: neue Heizungsanlage in Einfamilienhaus eingebaut. 3 Tage Arbeit, läuft perfekt! 🔥",
    fields: [
      {
        key: "foto",
        label: "Foto deines Projekts",
        type: "image",
        required: false,
      },
      {
        key: "was_gemacht",
        label: "Was hast du gemacht?",
        type: "textarea",
        required: true,
        placeholder:
          "Heute fertig geworden: neue Heizungsanlage in Einfamilienhaus eingebaut. 3 Tage Arbeit, läuft perfekt! 🔥",
      },
      {
        key: "beruf",
        label: "Dein Beruf / Gewerk",
        type: "text",
        required: false,
        placeholder: "z.B. Anlagenmechaniker",
      },
    ],
  },
  {
    type: "suche",
    icon: "🎯",
    label: "Stelle suchen",
    placeholder: "Ich suche eine Stelle als [beruf] in [region].",
    fields: [
      {
        key: "beruf",
        label: "Welchen Beruf / welche Stelle?",
        type: "text",
        required: true,
        placeholder: "z.B. Elektroniker",
      },
      {
        key: "region",
        label: "In welcher Region?",
        type: "text",
        required: true,
        placeholder: "z.B. München",
      },
      {
        key: "verfuegbar_ab",
        label: "Verfügbar ab?",
        type: "text",
        required: false,
        placeholder: "z.B. sofort, März 2025",
      },
      {
        key: "besonderheiten",
        label: "Was ist dir wichtig?",
        type: "textarea",
        required: false,
        placeholder: "z.B. Teilzeit, familienfreundlich",
      },
    ],
  },
  {
    type: "frage",
    icon: "💬",
    label: "Frage stellen",
    placeholder:
      "Hat jemand Erfahrung mit dem Wechsel von Vollzeit auf Teilzeit in der Pflege?",
    fields: [
      {
        key: "frage",
        label: "Deine Frage an die Community",
        type: "textarea",
        required: true,
        placeholder:
          "Hat jemand Erfahrung mit dem Wechsel von Vollzeit auf Teilzeit in der Pflege?",
      },
      {
        key: "bereich",
        label: "Bereich",
        type: "select",
        required: false,
        options: [
          "Handwerk",
          "Pflege",
          "Logistik",
          "Gastronomie",
          "Büro",
          "IT",
          "Sonstiges",
        ],
      },
    ],
  },
  {
    type: "erfolg",
    icon: "⭐",
    label: "Erfolg teilen",
    placeholder:
      "Heute habe ich meine Gesellenprüfung bestanden! Nach 3 Jahren Ausbildung endlich geschafft 🎉",
    fields: [
      {
        key: "was_erreicht",
        label: "Was hast du erreicht?",
        type: "textarea",
        required: true,
        placeholder:
          "Heute habe ich meine Gesellenprüfung bestanden! Nach 3 Jahren Ausbildung endlich geschafft 🎉",
      },
      {
        key: "foto",
        label: "Foto dazu (optional)",
        type: "image",
        required: false,
      },
    ],
  },
  {
    type: "empfehlung",
    icon: "👍",
    label: "Empfehlung aussprechen",
    placeholder:
      "Ich empfehle Elektriker Meisterbetrieb Müller in München — fairer Lohn, gutes Team, modernes Equipment.",
    fields: [
      {
        key: "empfehlung_typ",
        label: "Was empfiehlst du?",
        type: "select",
        required: true,
        options: ["Betrieb", "Person", "Kurs"],
      },
      {
        key: "name",
        label: "Name des Betriebs / der Person",
        type: "text",
        required: true,
        placeholder: "z.B. Elektriker Meisterbetrieb Müller",
      },
      {
        key: "warum",
        label: "Warum empfiehlst du?",
        type: "textarea",
        required: true,
        placeholder:
          "Fairer Lohn, gutes Team, modernes Equipment. Top Ausbildungsbetrieb!",
      },
    ],
  },
];

/** Build display content from template meta. Used for preview and final post content. */
export function buildContent(type: PostType, meta: PostMeta): string {
  switch (type) {
    case "projekt": {
      const was = meta.was_gemacht as string | undefined;
      const beruf = meta.beruf as string | undefined;
      if (!was?.trim()) return "";
      return beruf?.trim()
        ? `${was.trim()}\n\n— ${beruf.trim()}`
        : was.trim();
    }
    case "suche": {
      const beruf = (meta.beruf as string)?.trim() || "";
      const region = (meta.region as string)?.trim() || "";
      const verfuegbar = (meta.verfuegbar_ab as string)?.trim();
      const besonderheiten = (meta.besonderheiten as string)?.trim();
      if (!beruf || !region) return "";
      let text = `Ich suche eine Stelle als ${beruf} in ${region}.`;
      if (verfuegbar) text += ` Verfügbar ab ${verfuegbar}.`;
      if (besonderheiten) text += `\n\n${besonderheiten}`;
      return text;
    }
    case "frage": {
      const frage = (meta.frage as string)?.trim() || "";
      const bereich = (meta.bereich as string)?.trim();
      if (!frage) return "";
      return bereich ? `${frage}\n\n— Bereich: ${bereich}` : frage;
    }
    case "erfolg": {
      return (meta.was_erreicht as string)?.trim() || "";
    }
    case "empfehlung": {
      const typ = (meta.empfehlung_typ as string)?.trim() || "";
      const name = (meta.name as string)?.trim() || "";
      const warum = (meta.warum as string)?.trim() || "";
      if (!typ || !name || !warum) return "";
      return `Ich empfehle ${typ} ${name} — ${warum}`;
    }
    default:
      return "";
  }
}

export function getTemplateByType(type: PostType): PostTemplate | undefined {
  return POST_TEMPLATES.find((t) => t.type === type);
}
