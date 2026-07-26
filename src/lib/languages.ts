export type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  /** Sentence the user must read to clone their voice */
  prompt: string;
  /** BCP-47 tag (UI / accessibility) */
  speechLocale: string;
};

/**
 * Languages aligned with Chatterbox Multilingual (23 langs).
 * Tamil/Bengali fall back to Hindi on the engine.
 */
export const LANGUAGES: Language[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "EN",
    speechLocale: "en-US",
    prompt:
      "The quick brown fox jumps over the lazy dog near the riverbank at sunrise. Clear voices carry farther when spoken with calm confidence.",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "HI",
    speechLocale: "hi-IN",
    prompt:
      "नमस्ते, मेरा नाम आज की सुबह स्पष्ट और शांत स्वर में बोलना है। नदी के किनारे हवा धीरे बह रही है और पक्षी गा रहे हैं।",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "ES",
    speechLocale: "es-ES",
    prompt:
      "Buenos días. Hablo con claridad junto al río al amanecer. Las voces tranquilas viajan más lejos cuando se pronuncian con confianza.",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "FR",
    speechLocale: "fr-FR",
    prompt:
      "Bonjour. Je parle clairement près de la rivière au lever du soleil. Une voix calme porte plus loin lorsqu'elle est dite avec confiance.",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "DE",
    speechLocale: "de-DE",
    prompt:
      "Guten Morgen. Ich spreche klar am Flussufer bei Sonnenaufgang. Ruhige Stimmen tragen weiter, wenn man sie mit Zuversicht spricht.",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "JA",
    speechLocale: "ja-JP",
    prompt:
      "おはようございます。朝日の川辺で、落ち着いた声ではっきりと話します。自信を持って話すと、声はより遠くまで届きます。",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "KO",
    speechLocale: "ko-KR",
    prompt:
      "안녕하세요. 아침 햇살 아래 강가에서 차분하고 또렷하게 말합니다. 자신감 있는 목소리는 더 멀리 전해집니다.",
  },
  {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    flag: "ZH",
    speechLocale: "zh-CN",
    prompt:
      "早上好。我在日出时分的河边清晰而平静地说话。带着自信说出的声音，会传得更远。",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "PT",
    speechLocale: "pt-BR",
    prompt:
      "Bom dia. Falo com clareza à beira do rio ao nascer do sol. Vozes calmas vão mais longe quando ditas com confiança.",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "AR",
    speechLocale: "ar-SA",
    prompt:
      "صباح الخير. أتكلم بوضوح بجانب النهر عند شروق الشمس. الأصوات الهادئة تصل أبعد عندما تُقال بثقة.",
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "IT",
    speechLocale: "it-IT",
    prompt:
      "Buongiorno. Parlo con chiarezza vicino al fiume all'alba. Le voci calme arrivano più lontano quando dette con fiducia.",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "RU",
    speechLocale: "ru-RU",
    prompt:
      "Доброе утро. Я говорю ясно у реки на рассвете. Спокойные голоса звучат дальше, когда их произносят с уверенностью.",
  },
  {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    flag: "NL",
    speechLocale: "nl-NL",
    prompt:
      "Goedemorgen. Ik spreek duidelijk bij de rivier bij zonsopgang. Kalme stemmen dragen verder wanneer ze met vertrouwen worden uitgesproken.",
  },
  {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    flag: "TR",
    speechLocale: "tr-TR",
    prompt:
      "Günaydın. Gün doğumunda nehir kenarında net ve sakin konuşuyorum. Güvenle söylenen sesler daha uzağa gider.",
  },
  {
    code: "pl",
    name: "Polish",
    nativeName: "Polski",
    flag: "PL",
    speechLocale: "pl-PL",
    prompt:
      "Dzień dobry. Mówię wyraźnie nad rzeką o wschodzie słońca. Spokojne głosy niosą się dalej, gdy wypowiada się je z pewnością.",
  },
  {
    code: "sv",
    name: "Swedish",
    nativeName: "Svenska",
    flag: "SV",
    speechLocale: "sv-SE",
    prompt:
      "God morgon. Jag talar tydligt vid floden i soluppgången. Lugna röster bär längre när de sägs med självförtroende.",
  },
  {
    code: "da",
    name: "Danish",
    nativeName: "Dansk",
    flag: "DA",
    speechLocale: "da-DK",
    prompt:
      "God morgen. Jeg taler klart ved floden ved solopgang. Rolige stemmer bærer længere, når de siges med selvtillid.",
  },
  {
    code: "fi",
    name: "Finnish",
    nativeName: "Suomi",
    flag: "FI",
    speechLocale: "fi-FI",
    prompt:
      "Hyvää huomenta. Puhun selkeästi joen rannalla auringonnousussa. Rauhalliset äänet kantavat pidemmälle, kun ne sanotaan itsevarmasti.",
  },
  {
    code: "el",
    name: "Greek",
    nativeName: "Ελληνικά",
    flag: "EL",
    speechLocale: "el-GR",
    prompt:
      "Καλημέρα. Μιλάω καθαρά δίπλα στο ποτάμι στην ανατολή. Οι ήρεμες φωνές φτάνουν πιο μακριά όταν λέγονται με αυτοπεποίθηση.",
  },
  {
    code: "he",
    name: "Hebrew",
    nativeName: "עברית",
    flag: "HE",
    speechLocale: "he-IL",
    prompt:
      "בוקר טוב. אני מדבר בבהירות ליד הנהר בזריחה. קולות רגועים מגיעים רחוק יותר כשאומרים אותם בביטחון.",
  },
  {
    code: "ms",
    name: "Malay",
    nativeName: "Bahasa Melayu",
    flag: "MS",
    speechLocale: "ms-MY",
    prompt:
      "Selamat pagi. Saya bercakap dengan jelas di tepi sungai semasa matahari terbit. Suara yang tenang sampai lebih jauh apabila diucapkan dengan yakin.",
  },
  {
    code: "no",
    name: "Norwegian",
    nativeName: "Norsk",
    flag: "NO",
    speechLocale: "nb-NO",
    prompt:
      "God morgen. Jeg snakker tydelig ved elven ved soloppgang. Rolige stemmer bærer lenger når de sies med selvtillit.",
  },
  {
    code: "sw",
    name: "Swahili",
    nativeName: "Kiswahili",
    flag: "SW",
    speechLocale: "sw-KE",
    prompt:
      "Habari za asubuhi. Ninazungumza kwa uwazi kando ya mto wakati wa jua kuchomoza. Sauti tulivu husafiri mbali zaidi zinapozungumzwa kwa ujasiri.",
  },
];

export function getLanguage(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
