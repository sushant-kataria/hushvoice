export type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  /** Sentence the user must read to clone their voice */
  prompt: string;
  /** BCP-47 tag for browser SpeechSynthesis / Web Speech */
  speechLocale: string;
};

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
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    flag: "TA",
    speechLocale: "ta-IN",
    prompt:
      "வணக்கம். காலை வெயிலில் ஆற்றங்கரையில் தெளிவாகவும் அமைதியாகவும் பேசுகிறேன். நம்பிக்கையுடன் பேசும் குரல் தொலைவுக்குச் செல்லும்.",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    flag: "BN",
    speechLocale: "bn-IN",
    prompt:
      "নমস্কার। সূর্যোদয়ের সময় নদীর ধারে আমি স্পষ্ট ও শান্ত স্বরে কথা বলি। আত্মবিশ্বাসে বলা কণ্ঠ আরও দূরে পৌঁছায়।",
  },
];

export function getLanguage(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
