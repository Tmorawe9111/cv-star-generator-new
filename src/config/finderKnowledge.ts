import type { FinderAudience } from '@/config/finderRecommendations';

export interface FreeChatAnswer {
  text: string;
  tags: string[];
}

export function getFreeChatAnswer(inputRaw: string, audience: FinderAudience): FreeChatAnswer {
  const input = inputRaw.toLowerCase();

  const replies: string[] = [];
  const tags: string[] = [];

  if (input.includes('pflege') || input.includes('altenpflege') || input.includes('krankenhaus')) {
    replies.push(
      'Pflege passt zu dir, wenn du gern nah mit Menschen arbeitest und Verantwortung übernehmen möchtest. In der Pflege gibt es sowohl klassische Ausbildungen als auch Einstiegsjobs, bei denen du viel im Team lernst.',
    );
    tags.push('pflege', 'menschen');
  }

  if (input.includes('handwerk') || input.includes('bauen') || input.includes('werkstatt') || input.includes('kfz')) {
    replies.push(
      'Im Handwerk siehst du am Ende des Tages, was du geschafft hast – ob auf der Baustelle, in der Werkstatt oder in der Industrie. Viele Betriebe suchen motivierte Leute, auch als Quereinsteiger:innen.',
    );
    tags.push('handwerk', 'technik');
  }

  if (input.includes('büro') || input.includes('buero') || input.includes('office')) {
    replies.push(
      'Im Büro sorgst du dafür, dass Abläufe funktionieren: Telefon, E-Mails, Dokumente und Organisation. Wenn du Struktur magst und gern am Computer arbeitest, kann das gut zu dir passen.',
    );
    tags.push('buero', 'organisation');
  }

  if (input.includes('deutsch') || input.includes('sprache') || input.includes('sprachkurs')) {
    replies.push(
      'Wenn dein Deutsch noch nicht da ist, wo du es gern hättest, ist ein Sprachkurs (B1/B2) ein sehr guter Schritt. Viele Arbeitgeber unterstützen das – und du fühlst dich im Alltag sicherer. Parallel kannst du in einfachen Jobs starten.',
    );
    tags.push('sprachkurs');
  }

  if (input.includes('noten') || input.includes('schlecht in der schule') || input.includes('zeugnis')) {
    replies.push(
      'Schlechte Noten bedeuten nicht automatisch schlechte Chancen. Viele Betriebe schauen heute viel stärker auf Motivation, Verlässlichkeit und ob du zum Team passt. Über dein Profil bei BeVisiblle kannst du genau das zeigen.',
    );
  }

  if (input.includes('teilzeit') || input.includes('familie') || input.includes('kinder')) {
    replies.push(
      'Mit Familie oder anderen Verpflichtungen kann eine Ausbildung oder ein Job in Teilzeit spannend sein. In Pflege, Büro und einigen Handwerksberufen gibt es immer mehr Modelle mit flexiblen Zeiten.',
    );
  }

  if (!replies.length) {
    replies.push(
      audience === 'ausbildung'
        ? 'Erzähl mir kurz: Arbeitest du lieber mit Menschen, mit den Händen oder am Computer? Und wie wichtig sind dir planbare Zeiten? Daraus kann ich dir konkrete Ausbildungsrichtungen vorschlagen.'
        : 'Erzähl mir kurz, was dir wichtig ist: Menschen, Handwerk, Service, Logistik oder Büro – und ob du Schichtdienst okay findest. Dann kann ich dir konkrete Jobfelder mit nächsten Schritten zeigen.',
    );
  }

  return {
    text: replies.join(' '),
    tags,
  };
}

