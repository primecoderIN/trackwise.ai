"""The splits module's texts for people, in Hindi (splits module, i18n/).

Translation of en.py; checked at startup by define_catalog in __init__.py so no key or placeholder can drift.
"""

from app.core.i18n import TextValue
from app.modules.splits.i18n.en import SplitText

HI: dict[SplitText, TextValue] = {
    SplitText.CONTACT_NOT_FOUND: "संपर्क नहीं मिला।",
    SplitText.CONTACT_DUPLICATE: "'{name}' नाम का संपर्क पहले से मौजूद है।",
    SplitText.CONTACT_IN_USE: ("यह संपर्क समूहों, बँटवारों या निपटानों में उपयोग हो रहा है। इसे हटाने के बजाय संग्रहित करें।"),
    SplitText.CONTACT_ARCHIVED: "संग्रहित संपर्कों को नए बँटवारों या समूहों में नहीं जोड़ा जा सकता।",
    SplitText.GROUP_NOT_FOUND: "समूह नहीं मिला।",
    SplitText.GROUP_DUPLICATE: "'{name}' नाम का समूह पहले से मौजूद है।",
    SplitText.GROUP_IN_USE: "इस समूह में बँटवारे या निपटान दर्ज हैं। इसे हटाने के बजाय संग्रहित करें।",
    SplitText.GROUP_ARCHIVED: ("यह समूह संग्रहित और केवल पढ़ने योग्य है। बदलाव करने के लिए पहले इसे पुनः सक्रिय करें।"),
    SplitText.GROUP_NOT_SHARED: "आमंत्रण लिंक और बहु-उपयोगकर्ता सदस्यता केवल साझा समूहों में उपलब्ध है।",
    SplitText.GROUP_ALREADY_SHARED: "यह समूह पहले से ही साझा समूह है।",
    SplitText.GROUP_OWNER_REQUIRED: "यह कार्रवाई केवल समूह का स्वामी ही कर सकता है।",
    SplitText.MEMBER_NOT_FOUND: "समूह का सदस्य नहीं मिला।",
    SplitText.MEMBER_HAS_BALANCE: "इस सदस्य का समूह में बकाया शेष अभी बाकी है।",
    SplitText.OWNER_CANNOT_LEAVE: "समूह छोड़ने से पहले स्वामित्व किसी अन्य सदस्य को सौंपें, या समूह को संग्रहित करें।",
    SplitText.TRANSFER_TARGET_INVALID: "स्वामित्व केवल किसी अन्य सक्रिय पंजीकृत सदस्य को ही सौंपा जा सकता है।",
    SplitText.INVITE_INVALID: "यह आमंत्रण लिंक अमान्य, समाप्त, रद्द या पहले ही उपयोग किया जा चुका है।",
    SplitText.INVITE_NOT_FOUND: "आमंत्रण नहीं मिला।",
    SplitText.INVITE_LIMIT_REACHED: "प्रति समूह अधिकतम {limit} सक्रिय आमंत्रण लिंक हो सकते हैं।",
    SplitText.SEAT_ALREADY_CLAIMED: "यह अतिथि स्थान अब दावा करने के लिए उपलब्ध नहीं है।",
    SplitText.REJOIN_CANNOT_CLAIM_SEAT: (
        "आप पहले इस समूह के सदस्य थे; किसी अन्य स्थान का दावा करने के बजाय अपनी पुरानी सदस्यता बहाल करने के लिए फिर से जुड़ें।"
    ),
    SplitText.SPLIT_NOT_FOUND: "बँटवारा खर्च नहीं मिला।",
    SplitText.SPLIT_EDIT_FORBIDDEN: "इस बँटवारे को केवल इसे बनाने वाला या समूह का स्वामी ही बदल या हटा सकता है।",
    SplitText.SPLIT_LOCKED_BY_SETTLEMENT: (
        "इस शेष के लिए निपटान पहले ही दर्ज हो चुका है। पहले निपटान को रद्द करें या नया समायोजन बँटवारा जोड़ें।"
    ),
    SplitText.SETTLEMENT_NOT_FOUND: "निपटान नहीं मिला।",
    SplitText.SETTLEMENT_VOID_FORBIDDEN: "इस निपटान को केवल इसे दर्ज करने वाला या समूह का स्वामी ही रद्द कर सकता है।",
    SplitText.SETTLEMENT_ALREADY_VOIDED: "यह निपटान पहले ही रद्द किया जा चुका है।",
    SplitText.SETTLEMENT_SAME_PARTY: "निपटान में भुगतान करने वाला और प्राप्त करने वाला अलग-अलग व्यक्ति होने चाहिए।",
    SplitText.AMOUNT_NOT_POSITIVE: "राशि शून्य से अधिक होनी चाहिए।",
    SplitText.AMOUNT_PRECISION: "{currency} के लिए राशि में अधिकतम {decimals} दशमलव अंक हो सकते हैं।",
    SplitText.INVALID_UPI_ID: "कृपया मान्य UPI आईडी दर्ज करें, जैसे name@bank।",
    SplitText.PARTICIPANTS_REQUIRED: "बँटवारे के लिए कम से कम एक प्रतिभागी चुनें।",
    SplitText.DUPLICATE_PARTICIPANT: "एक बँटवारे में प्रत्येक प्रतिभागी केवल एक बार आ सकता है।",
    SplitText.DIRECT_SPLIT_NEEDS_SELF: "सीधे बँटवारे में आपका भुगतानकर्ता या प्रतिभागी के रूप में शामिल होना आवश्यक है।",
    SplitText.DIRECT_SPLIT_NEEDS_CONTACT: "सीधे बँटवारे में कम से कम एक संपर्क शामिल होना आवश्यक है।",
    SplitText.EXACT_SHARES_REQUIRED: "प्रत्येक प्रतिभागी के लिए सटीक हिस्सा राशि दर्ज करें।",
    SplitText.SHARES_MUST_MATCH_TOTAL: "सभी हिस्सों का योग कुल राशि के बराबर होना चाहिए।",
    SplitText.NEGATIVE_SHARE: "प्रत्येक प्रतिभागी का हिस्सा शून्य या अधिक होना चाहिए।",
    SplitText.LINK_AND_RECORD_EXCLUSIVE: (
        "या तो मौजूदा खर्च को जोड़ें या अपना हिस्सा नए खर्च के रूप में दर्ज करें, दोनों एक साथ नहीं।"
    ),
    SplitText.LINKED_EXPENSE_NOT_FOUND: "जुड़ा हुआ खर्च नहीं मिला।",
    SplitText.NO_SELF_SHARE: "व्यक्तिगत खर्च के रूप में दर्ज करने के लिए इस बँटवारे में आपका हिस्सा शून्य से अधिक नहीं है।",
    SplitText.CATEGORY_NOT_FOUND: "श्रेणी {category_id} मौजूद नहीं है।",
    SplitText.RECORDING_IN_PROGRESS: ("आपका हिस्सा पहले से दर्ज किया जा रहा है। बाधित होने पर पेज रीफ़्रेश करें या मौजूदा खर्च जोड़ें।"),
    SplitText.EXPENSE_LINK_NOT_FOUND: "इस बँटवारे से जुड़ा कोई व्यक्तिगत खर्च नहीं मिला।",
}
