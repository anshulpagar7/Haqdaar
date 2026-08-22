import type { Lang } from "./engine/types";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "mr", label: "मराठी" },
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
  // — added for the cockpit rebuild —
  yourProfile: t("Your profile", "आपकी जानकारी", "तुमची माहिती"),
  liveResults: t("Live results", "तत्काल परिणाम", "थेट निकाल"),
  confirmed: t("confirmed", "पक्की", "निश्चित"),
  stillOpen: t("still open", "अभी संभव", "अजून शक्य"),
  moreStillOpen: t("more still in play", "और संभव हैं", "आणखी शक्य आहेत"),
  keepGoing: t("Answer a question or two more and the first confirmed schemes will appear here.",
               "एक-दो सवाल और, फिर पक्की योजनाएँ यहाँ दिखेंगी।",
               "आणखी एक-दोन प्रश्न, मग निश्चित योजना इथे दिसतील."),
  yourResult: t("Your result", "आपका परिणाम", "तुमचा निकाल"),
  listening: t("Listening…", "सुन रहे हैं…", "ऐकत आहोत…"),
  heard: t("heard:", "सुना:", "ऐकले:"),
  speakAria: t("Answer by speaking", "बोलकर उत्तर दें", "बोलून उत्तर द्या"),
  close: t("Close", "बंद करें", "बंद करा"),
  notVerified: t("not yet verified against the notification",
                 "अधिसूचना से अभी मिलान नहीं", "अधिसूचनेशी अद्याप पडताळणी नाही"),
  whyThis: t("Chosen because it should rule out {g} of the {c} schemes still in play — the best return for the effort of one question.",
             "यह सवाल {c} में से लगभग {g} योजनाएँ हटा देगा — एक सवाल में सबसे ज़्यादा फ़ायदा।",
             "हा प्रश्न {c} पैकी सुमारे {g} योजना वगळेल — एका प्रश्नात सर्वाधिक फायदा."),
  auditNote: t("Tap any scheme to see the exact clause it satisfied. Every result was decided by a deterministic rule engine — no part of it was written by a language model.",
               "किसी भी योजना पर टैप करें और वह नियम देखें जो पूरा हुआ। हर परिणाम नियम-इंजन ने तय किया है।",
               "कोणत्याही योजनेवर टॅप करा आणि पूर्ण झालेला नियम पाहा. प्रत्येक निकाल नियम-इंजिनने ठरवला आहे."),
  desktop: t("Desktop", "डेस्कटॉप", "डेस्कटॉप"),
  mobile: t("Mobile", "मोबाइल", "मोबाइल"),
  begin: t("Begin", "शुरू करें", "सुरुवात करा"),
  heroLead: t("Photograph the documents already in your pocket. Answer about five spoken questions. See every government scheme you are entitled to — with the official clause cited and the form filled in.",
              "जेब में पड़े कागज़ों की फ़ोटो लीजिए, पाँच सवालों के जवाब दीजिए, और हर वह योजना देखिए जिसके आप हक़दार हैं।",
              "खिशातील कागदपत्रांचा फोटो काढा, पाच प्रश्नांची उत्तरे द्या, आणि तुम्ही हक्कदार असलेली प्रत्येक योजना पाहा."),
  schemesLoaded: t("schemes loaded", "योजनाएँ लोड हुईं", "योजना लोड झाल्या"),
  attributes: t("attributes", "मानदंड", "निकष"),
  engineNote: t("Deterministic solver · every match cites its official clause",
                "नियम-इंजन · हर मिलान अपना सरकारी नियम बताता है",
                "नियम-इंजिन · प्रत्येक जुळणी तिचा अधिकृत नियम दाखवते"),

};

export const tr = (d: Dict, lang: Lang) => d[lang] ?? d.en;
