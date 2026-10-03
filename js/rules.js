/* ScamShield MY - rules.js
   Single source of truth for deterministic rule-based scam detection.
   Each indicator: id, name, weight, severity, keywords[], patterns[], explanation, recommendedAction. */
var SCAM_INDICATORS = [
  {
    id: "urgency", name: "Urgency", weight: 1, severity: "low",
    keywords: ["urgent","immediately","act now","respond immediately","limited time","as soon as possible","right now","last chance","segera","dengan segera","sekarang","tindakan segera","hari ini","cepat","jangan lengah"],
    patterns: [],
    explanation: "Scammers create a false sense of time pressure so you act before you can verify the request.",
    recommendedAction: "Slow down. A genuine request can wait while you confirm it through an official channel."
  },
  {
    id: "threat_fear", name: "Threat / Fear Tactic", weight: 2, severity: "medium",
    keywords: ["legal action","police report","arrested","investigation","penalty","lawsuit","you will be charged","court","tindakan undang-undang","laporan polis","ditangkap","siasatan","penalti","saman","didakwa","mahkamah"],
    patterns: [],
    explanation: "Threats of arrest, fines, or legal action are used to frighten you into complying without thinking.",
    recommendedAction: "Do not act out of fear. Authorities do not demand action or payment through SMS or chat messages."
  },
  {
    id: "suspicious_link", name: "Suspicious Link", weight: 2, severity: "medium",
    keywords: ["click the link","click here","klik pautan","klik di sini","klik link","bit.ly","tinyurl"],
    patterns: ["https?://[^\s]+"],
    explanation: "Links in scam messages often lead to fake login pages designed to steal your credentials or money.",
    recommendedAction: "Do not click the link. Open the official website or app yourself by typing the known address."
  },
  {
    id: "payment_transfer", name: "Payment / Money Transfer", weight: 3, severity: "high",
    keywords: ["transfer money","make payment","bank transfer","pay immediately","processing fee","send the payment","deposit","pindahkan wang","transfer wang","buat bayaran","bayar sekarang","bayaran pemprosesan","masukkan duit","yuran pemprosesan"],
    patterns: [],
    explanation: "Requests to transfer money or pay a fee are a direct route to financial loss and are rarely legitimate when unsolicited.",
    recommendedAction: "Do not transfer money or pay a fee based only on this message. Verify the request independently first."
  },
  {
    id: "otp_sensitive", name: "OTP / PIN / Password / Sensitive Information", weight: 3, severity: "high",
    keywords: ["otp","one-time password","verification code","security code","password","pin","cvv","tac","nombor otp","kata laluan","kod pengesahan","kod keselamatan","nombor pin","maklumat sulit"],
    patterns: [],
    explanation: "No legitimate bank or organisation will ever ask you to share an OTP, PIN, password, or security code.",
    recommendedAction: "Never share your OTP, PIN, password, or security codes with anyone, for any reason."
  },

  {
    id: "prize_reward", name: "Prize / Reward", weight: 2, severity: "medium",
    keywords: ["congratulations","you have won","winner","claim your prize","free gift","reward","lucky draw","tahniah","anda telah menang","pemenang","tuntut hadiah","hadiah percuma","ganjaran","cabutan bertuah"],
    patterns: [],
    explanation: "Unexpected prizes or rewards are a classic lure used to collect your personal details or an advance fee.",
    recommendedAction: "Be sceptical of winnings for a contest you never entered. Do not pay a fee to claim a prize."
  },
  {
    id: "account_suspension", name: "Account Suspension / Verification", weight: 2, severity: "medium",
    keywords: ["account suspended","account will be suspended","verify your account","account blocked","account locked","reactivate your account","akaun disekat","akaun akan disekat","akaun anda akan disekat","akaun anda disekat","disekat","akaun digantung","sahkan akaun","akaun dikunci","aktifkan semula akaun"],
    patterns: [],
    explanation: "Fake alerts that your account is suspended or must be verified pressure you into visiting a phishing page.",
    recommendedAction: "Check your account by logging in through the official app or website directly, not via the message."
  },
  {
    id: "impersonation", name: "Impersonation", weight: 2, severity: "medium",
    keywords: ["from your bank","bank officer","police officer","government officer","customer service","this is your bank","from maybank","from cimb","lhdn","pos malaysia","jpj","pihak bank","pegawai bank","pegawai polis","pihak polis","pegawai kerajaan","khidmat pelanggan"],
    patterns: [],
    explanation: "Pretending to be your bank, the police, or a government agency builds false trust so you lower your guard.",
    recommendedAction: "Verify the sender by contacting the organisation through its official published phone number or app."
  }
];


/* Demo-ready sample messages (Phase 3). One-click load into the textarea. */
var SAMPLE_MESSAGES = [
  {
    id: "sample_low", label: "Low risk - everyday message", language: "mixed", expectedRiskLevel: "LOW",
    text: "Hi, meeting kita pukul 3 petang esok. Jumpa di pejabat."
  },
  {
    id: "sample_medium", label: "Medium risk - prize claim", language: "bm", expectedRiskLevel: "MEDIUM",
    text: "Tahniah! Anda telah menang hadiah percuma. Tuntut hadiah anda sekarang."
  },
  {
    id: "sample_high", label: "High risk - bank / OTP (mixed BM + English)", language: "mixed", expectedRiskLevel: "HIGH",
    text: "URGENT! Akaun bank anda akan disekat hari ini. Please verify immediately melalui link berikut: https://example-security-check.com Masukkan OTP anda untuk mengaktifkan semula akaun."
  }
];
if (typeof module !== "undefined" && module.exports) { module.exports.SAMPLE_MESSAGES = SAMPLE_MESSAGES; }

