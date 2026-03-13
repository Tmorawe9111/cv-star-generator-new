-- =====================================================
-- SEED: 10 BEISPIEL-BLOG-ARTIKEL
-- Für Pflege, Handwerk und Industrie
-- =====================================================

-- Stelle sicher, dass wir einen Admin-User haben (für author_id)
-- Falls nicht vorhanden, verwenden wir NULL (wird später gesetzt)

-- 1. PFLEGE - Gehalt in der Pflege: Was du 2025 wirklich verdienst
INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  industry_sector,
  target_audience,
  seo_title,
  seo_description,
  seo_keywords,
  featured_image,
  category,
  tags,
  status,
  published_at
) VALUES (
  'Gehalt in der Pflege: Was du 2025 wirklich verdienst',
  'gehalt-pflege-2025',
  'Die generalistische Pflegeausbildung hat die Karten neu gemischt. Hier erfährst du, was das für deinen Geldbeutel bedeutet und wie sich die TVöD-Entgelttabelle auf dein Einkommen auswirkt.',
  '<h2>Der TVöD ändert alles</h2><p>Lange Zeit war die Bezahlung in der Pflege unübersichtlich. Mit den neuen Tarifverträgen kommt Licht ins Dunkel. Als Pflegefachkraft startest du in Entgeltgruppe P7 mit einem Bruttogehalt von 3.448 Euro im Monat.</p><h2>Nach 2 Jahren steigt das Gehalt</h2><p>Mit zunehmender Berufserfahrung steigt dein Gehalt automatisch. Nach zwei Jahren in der Pflege verdienst du bereits 3.680 Euro brutto. Eine Spezialisierung in der Intensivpflege (P8) bringt dir sogar 3.890 Euro ein.</p><h2>Zuschläge machen den Unterschied</h2><p>Nicht vergessen: Schichtzulagen, Wochenend- und Feiertagszuschläge kommen noch oben drauf. In der Intensivpflege können das schnell 500-800 Euro zusätzlich sein.</p>',
  'pflege',
  'profi',
  'Gehalt in der Pflege 2025: TVöD Entgelttabelle & Zuschläge',
  'Erfahre, wie viel du als Pflegefachkraft 2025 wirklich verdienst. TVöD-Entgelttabelle, Zuschläge und Karriereperspektiven im Detail.',
  ARRAY['Pflege Gehalt', 'TVöD', 'Pflegefachkraft', 'Gehalt 2025', 'Intensivpflege'],
  'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1200&h=630&fit=crop',
  'Gehalt',
  ARRAY['Gehalt', 'TVöD', 'Pflege', 'Karriere'],
  'published',
  NOW() - INTERVAL '5 days'
);

-- 2. PFLEGE - Generalistik erklärt: Die neue Pflegeausbildung im Detail
INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  industry_sector,
  target_audience,
  seo_title,
  seo_description,
  seo_keywords,
  featured_image,
  category,
  tags,
  status,
  published_at
) VALUES (
  'Generalistik erklärt: Die neue Pflegeausbildung im Detail',
  'generalistik-pflegeausbildung',
  'Seit 2020 gibt es die generalistische Pflegeausbildung. Was bedeutet das für dich? Wir erklären die Unterschiede zur alten Ausbildung und zeigen dir, welche Möglichkeiten sich dir eröffnen.',
  '<h2>Was ist die Generalistik?</h2><p>Die generalistische Pflegeausbildung vereint die drei bisherigen Ausbildungen (Altenpflege, Gesundheits- und Krankenpflege, Gesundheits- und Kinderkrankenpflege) in einer einzigen, umfassenden Ausbildung.</p><h2>Dauer und Abschluss</h2><p>Die Ausbildung dauert drei Jahre und endet mit dem Abschluss "Pflegefachfrau" oder "Pflegefachmann". Du kannst danach in allen Bereichen der Pflege arbeiten – im Krankenhaus, im Altenheim oder in der ambulanten Pflege.</p><h2>Deine Vorteile</h2><p>Mit der Generalistik hast du mehr Flexibilität. Du bist nicht mehr auf einen Bereich festgelegt und kannst später problemlos wechseln. Das macht dich zu einem gefragten Fachkräften auf dem Arbeitsmarkt.</p>',
  'pflege',
  'schueler',
  'Generalistik Pflegeausbildung: Alles was du wissen musst 2025',
  'Die generalistische Pflegeausbildung im Detail: Dauer, Voraussetzungen, Inhalte und deine Karrieremöglichkeiten nach dem Abschluss.',
  ARRAY['Generalistik', 'Pflegeausbildung', 'Ausbildung Pflege', 'Pflegefachkraft'],
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=630&fit=crop',
  'Ausbildung',
  ARRAY['Ausbildung', 'Generalistik', 'Pflege', 'Karriere'],
  'published',
  NOW() - INTERVAL '4 days'
);

-- 3. PFLEGE - Schichtdienst in der Ausbildung: Deine Rechte als Azubi
INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  industry_sector,
  target_audience,
  seo_title,
  seo_description,
  seo_keywords,
  featured_image,
  category,
  tags,
  status,
  published_at
) VALUES (
  'Schichtdienst in der Ausbildung: Deine Rechte als Azubi',
  'schichtdienst-azubi-rechte',
  'Als Azubi in der Pflege arbeitest du auch im Schichtdienst. Aber welche Rechte hast du? Wir klären auf: Ruhezeiten, Überstunden und was dein Ausbildungsbetrieb beachten muss.',
  '<h2>Ruhezeiten sind gesetzlich geregelt</h2><p>Nach einer Schicht musst du mindestens 11 Stunden Ruhezeit haben. Das ist gesetzlich festgelegt und kann nicht einfach umgangen werden. Auch als Azubi hast du Anspruch auf diese Ruhezeiten.</p><h2>Überstunden in der Ausbildung</h2><p>Überstunden sind in der Ausbildung grundsätzlich nicht erlaubt. Ausnahmen gibt es nur in absoluten Notfällen. Lass dich nicht ausnutzen – deine Ausbildung steht im Vordergrund.</p><h2>Was tun bei Problemen?</h2><p>Wenn dein Ausbildungsbetrieb deine Rechte verletzt, wende dich an deine Praxisanleitung, die Berufsschule oder die zuständige Kammer. Du bist nicht allein!</p>',
  'pflege',
  'azubi',
  'Schichtdienst als Azubi: Deine Rechte in der Pflegeausbildung',
  'Schichtdienst in der Pflegeausbildung: Welche Rechte hast du als Azubi? Ruhezeiten, Überstunden und was du bei Problemen tun kannst.',
  ARRAY['Azubi Rechte', 'Schichtdienst', 'Pflegeausbildung', 'Arbeitsrecht'],
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&h=630&fit=crop',
  'Rechte',
  ARRAY['Rechte', 'Azubi', 'Schichtdienst', 'Arbeitsrecht'],
  'published',
  NOW() - INTERVAL '3 days'
);

-- 4. PFLEGE - TVöD Entgelttabelle 2025: So viel verdienst du wirklich
INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  industry_sector,
  target_audience,
  seo_title,
  seo_description,
  seo_keywords,
  featured_image,
  category,
  tags,
  status,
  published_at
) VALUES (
  'TVöD Entgelttabelle 2025: So viel verdienst du wirklich',
  'tvoed-entgelttabelle-2025',
  'Die TVöD-Entgelttabelle für Pflegekräfte ist komplex. Wir haben sie für dich aufgeschlüsselt: Einstiegsgehalt, Erfahrungsstufen und wie du mehr verdienen kannst.',
  '<h2>Entgeltgruppe P7: Der Einstieg</h2><p>Als Pflegefachkraft startest du in Entgeltgruppe P7, Stufe 1. Das bedeutet: 3.448 Euro brutto im Monat. Nach einem Jahr steigst du automatisch in Stufe 2 auf 3.680 Euro.</p><h2>P8: Die Spezialisierung</h2><p>Mit einer Weiterbildung in der Intensivpflege oder anderen Spezialgebieten kannst du in P8 wechseln. Hier startest du mit 3.890 Euro und steigst bis auf 4.280 Euro.</p><h2>Zuschläge nicht vergessen</h2><p>Schichtzulagen, Wochenend- und Feiertagszuschläge kommen noch oben drauf. In der Intensivpflege mit Nachtschichten können das schnell 500-800 Euro zusätzlich sein.</p>',
  'pflege',
  'profi',
  'TVöD Entgelttabelle Pflege 2025: Gehaltstabelle & Zuschläge',
  'TVöD-Entgelttabelle für Pflegekräfte 2025: Alle Gehaltsstufen, Zuschläge und wie du mehr verdienen kannst. Komplett aufgeschlüsselt.',
  ARRAY['TVöD', 'Entgelttabelle', 'Pflege Gehalt', 'Gehalt 2025'],
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=630&fit=crop',
  'Gehalt',
  ARRAY['TVöD', 'Gehalt', 'Entgelttabelle', 'Pflege'],
  'published',
  NOW() - INTERVAL '2 days'
);

-- 5. HANDWERK - Handwerk vs. Studium: Warum sich das Handwerk wieder lohnt
INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  industry_sector,
  target_audience,
  seo_title,
  seo_description,
  seo_keywords,
  featured_image,
  category,
  tags,
  status,
  published_at
) VALUES (
  'Handwerk vs. Studium: Warum sich das Handwerk wieder lohnt',
  'handwerk-vs-studium',
  'Studium oder Handwerk? Die Entscheidung fällt vielen schwer. Wir zeigen dir, warum eine Handwerksausbildung heute wieder eine echte Alternative ist – mit guten Gehältern und sicheren Jobs.',
  '<h2>Das Handwerk zahlt wieder</h2><p>Fachkräftemangel bedeutet: Handwerker sind gefragt wie nie. Ein Elektriker-Meister verdient heute durchschnittlich 4.500-6.000 Euro brutto. Das ist mehr als viele Akademiker verdienen.</p><h2>Praxis statt Theorie</h2><p>Im Handwerk lernst du von Anfang an praktisch. Du siehst sofort, was du geschafft hast. Das gibt dir ein Gefühl der Erfüllung, das viele im Büro vermissen.</p><h2>Selbstständigkeit ist möglich</h2><p>Mit dem Meistertitel kannst du dich selbstständig machen. Viele Handwerksbetriebe suchen Nachfolger. Die Chance, dein eigener Chef zu werden, ist im Handwerk größer als in vielen anderen Branchen.</p>',
  'handwerk',
  'schueler',
  'Handwerk vs. Studium: Warum sich die Ausbildung lohnt 2025',
  'Handwerk oder Studium? Wir zeigen dir, warum eine Handwerksausbildung heute wieder eine echte Alternative ist. Gehälter, Karriere und Selbstständigkeit.',
  ARRAY['Handwerk', 'Studium', 'Ausbildung', 'Karriere'],
  'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&h=630&fit=crop',
  'Karriere',
  ARRAY['Handwerk', 'Studium', 'Karriere', 'Ausbildung'],
  'published',
  NOW() - INTERVAL '6 days'
);

-- 6. HANDWERK - Berichtsheft-Vorlagen: So führst du es richtig
INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  industry_sector,
  target_audience,
  seo_title,
  seo_description,
  seo_keywords,
  featured_image,
  category,
  tags,
  status,
  published_at
) VALUES (
  'Berichtsheft-Vorlagen: So führst du es richtig',
  'berichtsheft-vorlagen',
  'Das Berichtsheft ist dein täglicher Begleiter in der Ausbildung. Wir zeigen dir, wie du es richtig führst, welche Fehler du vermeiden solltest und geben dir kostenlose Vorlagen.',
  '<h2>Warum ist das Berichtsheft wichtig?</h2><p>Das Berichtsheft dokumentiert deine Ausbildung. Bei der Abschlussprüfung wird es geprüft. Ein ordentliches Berichtsheft zeigt, dass du deine Ausbildung ernst nimmst.</p><h2>Was gehört rein?</h2><p>Jeden Tag solltest du kurz notieren: Was hast du gemacht? Welche Werkzeuge hast du verwendet? Was hast du gelernt? 3-5 Sätze pro Tag reichen völlig aus.</p><h2>Häufige Fehler vermeiden</h2><p>Viele Azubis schreiben zu wenig oder zu viel. Wichtig: Schreibe regelmäßig, nicht alles am Ende. Dein Ausbilder muss es regelmäßig unterschreiben.</p>',
  'handwerk',
  'azubi',
  'Berichtsheft führen: Vorlagen & Tipps für Handwerks-Azubis',
  'Berichtsheft richtig führen: Vorlagen, Tipps und häufige Fehler. So dokumentierst du deine Handwerksausbildung professionell.',
  ARRAY['Berichtsheft', 'Azubi', 'Handwerk', 'Ausbildung'],
  'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1200&h=630&fit=crop',
  'Ausbildung',
  ARRAY['Berichtsheft', 'Azubi', 'Handwerk', 'Tipps'],
  'published',
  NOW() - INTERVAL '7 days'
);

-- 7. HANDWERK - Der Weg zum Meister: Kosten, Dauer und Förderungen
INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  industry_sector,
  target_audience,
  seo_title,
  seo_description,
  seo_keywords,
  featured_image,
  category,
  tags,
  status,
  published_at
) VALUES (
  'Der Weg zum Meister: Kosten, Dauer und Förderungen',
  'weg-zum-meister',
  'Der Meistertitel öffnet dir viele Türen: Selbstständigkeit, höheres Gehalt, mehr Verantwortung. Wir zeigen dir, wie du Meister wirst, was es kostet und welche Förderungen es gibt.',
  '<h2>Voraussetzungen für den Meister</h2><p>Um den Meister zu machen, brauchst du einen Gesellenbrief und mindestens ein Jahr Berufserfahrung. In manchen Gewerken sind es auch zwei Jahre.</p><h2>Dauer und Kosten</h2><p>Die Meisterprüfung dauert je nach Gewerk 6-24 Monate. Die Kosten liegen zwischen 5.000 und 15.000 Euro. Klingt viel? Es gibt gute Förderungen!</p><h2>Förderungen nutzen</h2><p>Das Aufstiegs-BAföG übernimmt bis zu 100% der Kosten. Du bekommst sogar einen Zuschuss zum Lebensunterhalt. Viele Handwerkskammern bieten zusätzliche Stipendien an.</p>',
  'handwerk',
  'profi',
  'Meister werden: Kosten, Dauer, Förderungen & Voraussetzungen',
  'Meister werden im Handwerk: Alles über Voraussetzungen, Kosten, Dauer und Förderungen. So schaffst du den nächsten Karriereschritt.',
  ARRAY['Meister', 'Handwerk', 'Weiterbildung', 'Karriere'],
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&h=630&fit=crop',
  'Weiterbildung',
  ARRAY['Meister', 'Weiterbildung', 'Handwerk', 'Karriere'],
  'published',
  NOW() - INTERVAL '8 days'
);

-- 8. INDUSTRIE - Duales Studium vs. Ausbildung: Was passt zu dir?
INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  industry_sector,
  target_audience,
  seo_title,
  seo_description,
  seo_keywords,
  featured_image,
  category,
  tags,
  status,
  published_at
) VALUES (
  'Duales Studium vs. Ausbildung: Was passt zu dir?',
  'duales-studium-vs-ausbildung',
  'Duales Studium oder klassische Ausbildung? Beide Wege führen in die Industrie, aber sie sind sehr unterschiedlich. Wir helfen dir bei der Entscheidung.',
  '<h2>Duales Studium: Theorie und Praxis</h2><p>Im dualen Studium verbindest du ein Bachelor-Studium mit praktischen Phasen im Unternehmen. Du verdienst von Anfang an Geld (800-1.200 Euro) und hast nach 3-4 Jahren einen Hochschulabschluss.</p><h2>Klassische Ausbildung: Praxis first</h2><p>Die Ausbildung ist praxisorientierter. Du lernst direkt im Betrieb und verdienst von Anfang an. Nach 3-3,5 Jahren hast du einen IHK-Abschluss und kannst direkt durchstarten.</p><h2>Was passt zu dir?</h2><p>Wenn du gerne lernst und Theorie magst, ist das duale Studium ideal. Wenn du lieber praktisch arbeitest und schnell Geld verdienen willst, ist die Ausbildung besser.</p>',
  'industrie',
  'schueler',
  'Duales Studium vs. Ausbildung: Vergleich für die Industrie',
  'Duales Studium oder Ausbildung in der Industrie? Wir vergleichen beide Wege: Dauer, Gehalt, Voraussetzungen und Karrierechancen.',
  ARRAY['Duales Studium', 'Ausbildung', 'Industrie', 'Karriere'],
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop',
  'Ausbildung',
  ARRAY['Duales Studium', 'Ausbildung', 'Industrie', 'Karriere'],
  'published',
  NOW() - INTERVAL '9 days'
);

-- 9. INDUSTRIE - IG Metall Tarifrunde 2025: Das ändert sich für dich
INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  industry_sector,
  target_audience,
  seo_title,
  seo_description,
  seo_keywords,
  featured_image,
  category,
  tags,
  status,
  published_at
) VALUES (
  'IG Metall Tarifrunde 2025: Das ändert sich für dich',
  'ig-metall-tarifrunde-2025',
  'Die IG Metall hat die Tarifrunde 2025 abgeschlossen. Was bedeutet das für dein Gehalt? Wir erklären die neuen Tarife, Zuschläge und was sich für dich ändert.',
  '<h2>Mehr Geld für alle</h2><p>Die IG Metall hat eine Lohnerhöhung von 5,2% durchgesetzt. Das bedeutet: Bei einem Einstiegsgehalt von 3.500 Euro sind das 182 Euro mehr im Monat.</p><h2>Zuschläge steigen</h2><p>Schichtzulagen, Wochenend- und Feiertagszuschläge wurden ebenfalls erhöht. In der Produktion mit Schichtarbeit können das schnell 300-500 Euro zusätzlich sein.</p><h2>Was bedeutet das für dich?</h2><p>Wenn du in einem IG Metall-Betrieb arbeitest, profitierst du automatisch. Die neuen Tarife gelten rückwirkend ab Januar 2025. Prüfe deine nächste Abrechnung!</p>',
  'industrie',
  'profi',
  'IG Metall Tarifrunde 2025: Neue Gehälter & Zuschläge',
  'IG Metall Tarifrunde 2025: Alle neuen Gehälter, Zuschläge und was sich für dich ändert. Komplett aufgeschlüsselt.',
  ARRAY['IG Metall', 'Tarifrunde', 'Gehalt', 'Industrie'],
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&h=630&fit=crop',
  'Gehalt',
  ARRAY['IG Metall', 'Tarifrunde', 'Gehalt', 'Industrie'],
  'published',
  NOW() - INTERVAL '10 days'
);

-- 10. INDUSTRIE - Industriemeister Gehalt: So viel verdienst du wirklich
INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  industry_sector,
  target_audience,
  seo_title,
  seo_description,
  seo_keywords,
  featured_image,
  category,
  tags,
  status,
  published_at
) VALUES (
  'Industriemeister Gehalt: So viel verdienst du wirklich',
  'industriemeister-gehalt',
  'Der Industriemeister ist einer der bestbezahlten Abschlüsse in der Industrie. Wir zeigen dir, wie viel du wirklich verdienst und welche Faktoren dein Gehalt beeinflussen.',
  '<h2>Einstiegsgehalt als Industriemeister</h2><p>Als frischgebackener Industriemeister startest du mit 4.200-4.800 Euro brutto. Mit ein paar Jahren Erfahrung steigst du schnell auf 5.000-6.000 Euro.</p><h2>Faktoren, die dein Gehalt beeinflussen</h2><p>Branche, Region und Betriebsgröße spielen eine große Rolle. In der Automobilindustrie verdienst du mehr als in der Textilindustrie. In Bayern mehr als in Ostdeutschland.</p><h2>Weiterbildung lohnt sich</h2><p>Mit zusätzlichen Qualifikationen (z.B. Technischer Betriebswirt) kannst du noch mehr verdienen. Viele Industriemeister steigen später in Führungspositionen auf.</p>',
  'industrie',
  'profi',
  'Industriemeister Gehalt 2025: So viel verdienst du wirklich',
  'Industriemeister Gehalt 2025: Einstiegsgehalt, Erfahrungsstufen und wie du mehr verdienen kannst. Komplett aufgeschlüsselt.',
  ARRAY['Industriemeister', 'Gehalt', 'Industrie', 'Karriere'],
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&h=630&fit=crop',
  'Gehalt',
  ARRAY['Industriemeister', 'Gehalt', 'Industrie', 'Karriere'],
  'published',
  NOW() - INTERVAL '11 days'
);

-- Kommentar
COMMENT ON TABLE public.blog_posts IS '10 Beispiel-Artikel wurden eingefügt für Pflege, Handwerk und Industrie';

