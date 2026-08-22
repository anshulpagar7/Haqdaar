import type { Lang } from "./engine/types";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "mr", label: "मराठी" },
  { code: "hi", label: "हिंदी" },
  { code: "en", label: "EN" },
];

type Dict = Record<Lang, string>;
const t = (en: string, hi: string, mr: string): Dict => ({ en, hi, mr });

export const T = {
  tagline: t(
    "Don't search for schemes. Let the schemes find you.",
    "योजनाएँ ढूँढ़िए मत — योजनाएँ आपको ढूँढ़ेंगी।",
    "योजना शोधू नका — योजना तुम्हाला शोधतील."
  ),
  start: t("Start", "शुरू करें", "सुरुवात करा"),
  step1: t("Show your documents", "अपने कागज़ात दिखाइए", "तुमची कागदपत्रे दाखवा"),
  holdCard: t("Hold the card inside the frame", "कार्ड को फ्रेम में रखें", "कार्ड चौकटीत धरा"),
  takePhoto: t("Take a photo", "फ़ोटो लें", "फोटो काढा"),
  addAnother: t("Add another document", "एक और कागज़", "आणखी एक कागद"),
  readFrom: t("Read from your documents", "आपके कागज़ों से पढ़ा गया", "तुमच्या कागदपत्रांतून वाचले"),
  continue: t("Continue", "आगे बढ़ें", "पुढे चला"),
  skip: t("Skip — just ask me questions", "छोड़ें — सवाल पूछिए", "वगळा — फक्त प्रश्न विचारा"),
  privacy: t(
    "Nothing is stored. ID numbers are masked before they leave the phone.",
    "कुछ भी सहेजा नहीं जाता। पहचान संख्या पहले ही छिपा दी जाती है।",
    "काहीही साठवले जात नाही. ओळख क्रमांक आधीच झाकले जातात."
  ),
  question: t("Question", "प्रश्न", "प्रश्न"),
  of: t("of", "में से", "पैकी"),
  possible: t("SCHEMES STILL POSSIBLE", "अब भी संभव योजनाएँ", "अजून शक्य असलेल्या योजना"),
  wasBefore: t("was {n} before this question", "इस सवाल से पहले {n} थीं", "या प्रश्नापूर्वी {n} होत्या"),
  speak: t("or just speak", "या बस बोलिए", "किंवा फक्त बोला"),
  yes: t("Yes", "हाँ", "होय"),
  no: t("No", "नहीं", "नाही"),
  dontKnow: t("I'm not sure", "पता नहीं", "माहीत नाही"),
  entitled: t("You are entitled to", "आप पात्र हैं", "तुम्ही पात्र आहात"),
  schemes: t("schemes", "योजनाएँ", "योजना"),
  perYear: t("WORTH, PER YEAR", "प्रति वर्ष मूल्य", "दरवर्षी मूल्य"),
  docsReady: t("DOCS READY", "कागज़ तैयार", "कागद तयार"),
  docsMissing: t("DOCS MISSING", "कागज़ बाकी", "कागद बाकी"),
  download: t("Download the filled application", "भरा हुआ आवेदन डाउनलोड करें", "भरलेला अर्ज डाउनलोड करा"),
  whyQualify: t("Why you qualify", "आप क्यों पात्र हैं", "तुम्ही का पात्र आहात"),
  officialClause: t("OFFICIAL CLAUSE", "सरकारी नियम", "अधिकृत नियम"),
  checked: t("CHECKED AGAINST YOUR PROFILE", "आपकी जानकारी से मिलान", "तुमच्या माहितीशी तपासले"),
  satisfied: t("conditions satisfied", "शर्तें पूरी", "अटी पूर्ण"),
  notModel: t(
    "Decided by the solver, not the model.",
    "यह निर्णय नियम-इंजन का है, मॉडल का नहीं।",
    "हा निर्णय नियम-इंजिनचा आहे, मॉडेलचा नाही."
  ),
  applyAt: t("Apply at", "आवेदन यहाँ", "अर्ज येथे"),
  needed: t("Documents you still need", "अब भी ज़रूरी कागज़", "अजून लागणारे कागद"),
  startOver: t("Start over", "फिर से शुरू करें", "पुन्हा सुरू करा"),
  noneFound: t("No scheme matched.", "कोई योजना नहीं मिली।", "कोणतीही योजना जुळली नाही."),
  reading: t("Reading your document…", "आपका कागज़ पढ़ा जा रहा है…", "तुमचा कागद वाचला जात आहे…"),
};

export const tr = (d: Dict, lang: Lang) => d[lang] ?? d.en;
