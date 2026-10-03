/* ScamShield MY - tests.js
   Lightweight Phase 2 test harness (no framework).
   Run with: node js/tests.js
   Loads rules.js (global SCAM_INDICATORS) then the engine from app.js. */
var fs = require("fs");
var path = require("path");

// Load rules.js into this scope so app.js can see SCAM_INDICATORS.
eval(fs.readFileSync(path.join(__dirname, "rules.js"), "utf8"));
global.SCAM_INDICATORS = SCAM_INDICATORS;
var E = require("./app.js");

var passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log("  PASS  " + name); }
  else { failed++; console.log("  FAIL  " + name); }
}
function ids(result) { return result.indicators.map(function (i) { return i.id; }); }
function has(result, id) { return ids(result).indexOf(id) !== -1; }


console.log("\n== Catalogue ==");
check("8 indicator categories", SCAM_INDICATORS.length === 8);

console.log("\n== Per-category detection (English) ==");
check("urgency", has(E.analyzeMessage("Please act now, this is urgent."), "urgency"));
check("threat_fear", has(E.analyzeMessage("We will take legal action and file a police report."), "threat_fear"));
check("suspicious_link", has(E.analyzeMessage("Visit https://example-security-check.com now"), "suspicious_link"));
check("payment_transfer", has(E.analyzeMessage("Please transfer money and pay the processing fee."), "payment_transfer"));
check("otp_sensitive", has(E.analyzeMessage("Share your OTP and password to continue."), "otp_sensitive"));
check("prize_reward", has(E.analyzeMessage("Congratulations, you have won. Claim your prize."), "prize_reward"));
check("account_suspension", has(E.analyzeMessage("Your account is suspended, verify your account."), "account_suspension"));
check("impersonation", has(E.analyzeMessage("This is your bank, a bank officer speaking."), "impersonation"));

console.log("\n== Bahasa Melayu detection ==");
check("BM urgency (segera)", has(E.analyzeMessage("Sila bertindak segera sekarang."), "urgency"));
check("BM otp (kata laluan)", has(E.analyzeMessage("Masukkan nombor OTP dan kata laluan anda."), "otp_sensitive"));
check("BM account (akaun disekat)", has(E.analyzeMessage("Akaun anda akan disekat, sila sahkan akaun."), "account_suspension"));
check("BM prize (tahniah)", has(E.analyzeMessage("Tahniah! Anda telah menang. Tuntut hadiah anda."), "prize_reward"));

console.log("\n== Mixed-language detection ==");
var mix = E.analyzeMessage("URGENT! Akaun anda akan disekat. Please verify immediately.");
check("mixed urgency", has(mix, "urgency"));
check("mixed account_suspension", has(mix, "account_suspension"));

console.log("\n== Duplicate-category weighting ==");
var dup = E.analyzeMessage("URGENT urgent immediately act now sekarang segera");
var urg = dup.indicators.filter(function (i) { return i.id === "urgency"; });
check("urgency reported once", urg.length === 1);
check("urgency contributes +1 only", dup.score === 1);
check("urgency keeps multiple matched phrases", urg[0].matchedPhrases.length >= 2);

console.log("\n== Thresholds ==");
check("score 0 -> LOW", E.scoreToLevel(0) === "LOW");
check("score 2 -> LOW", E.scoreToLevel(2) === "LOW");
check("score 3 -> MEDIUM", E.scoreToLevel(3) === "MEDIUM");
check("score 5 -> MEDIUM", E.scoreToLevel(5) === "MEDIUM");
check("score 6 -> HIGH", E.scoreToLevel(6) === "HIGH");
check("score 8 -> HIGH", E.scoreToLevel(8) === "HIGH");

console.log("\n== Original message preserved ==");
var original = "URGENT!  Akaun ANDA   disekat. ";
var r = E.analyzeMessage(original);
check("originalMessage unchanged", r.originalMessage === original);
check("normalized differs from original", r.normalizedMessage !== original);

console.log("\n== Validation ==");
check("empty fails", E.validateMessage("").ok === false);
check("whitespace-only fails", E.validateMessage("    ").ok === false);
check("over 5000 fails", E.validateMessage(new Array(5002).join("a")).ok === false);
check("normal passes", E.validateMessage("hello").ok === true);

console.log("\n== Determinism ==");
var a = E.analyzeMessage(mix.originalMessage);
var b = E.analyzeMessage(mix.originalMessage);
check("repeat score identical", a.score === b.score);
check("repeat ids identical", ids(a).join(",") === ids(b).join(","));


console.log("\n== Critical demo message ==");
var demo = "URGENT! Akaun bank anda akan disekat hari ini. Please verify immediately melalui link berikut: https://example-security-check.com Masukkan OTP anda untuk mengaktifkan semula akaun.";
var d = E.analyzeMessage(demo);
console.log("  detected categories: " + ids(d).join(", "));
console.log("  risk score: " + d.score + "  risk level: " + d.riskLevel);
check("demo detects urgency", has(d, "urgency"));
check("demo detects account_suspension", has(d, "account_suspension"));
check("demo detects suspicious_link", has(d, "suspicious_link"));
check("demo detects otp_sensitive", has(d, "otp_sensitive"));
check("demo score >= 8", d.score >= 8);
check("demo level HIGH", d.riskLevel === "HIGH");

console.log("\n== Extra scenarios ==");
var low = E.analyzeMessage("Hi, meeting kita pukul 3 petang hari ini.");
console.log("  LOW msg -> level " + low.riskLevel + " score " + low.score + " cats [" + ids(low).join(",") + "]");
check("A. benign-ish message is not HIGH", low.riskLevel !== "HIGH");
var prize = E.analyzeMessage("Tahniah! Anda telah menang hadiah percuma. Tuntut hadiah anda sekarang.");
check("B. prize detected", has(prize, "prize_reward"));
var pay = E.analyzeMessage("Please transfer money immediately and send the payment confirmation.");
check("C. payment detected", has(pay, "payment_transfer"));
check("C. urgency detected", has(pay, "urgency"));

console.log("\n============================================");
console.log("  RESULTS: " + passed + " passed, " + failed + " failed");
console.log("============================================");
process.exit(failed === 0 ? 0 : 1);

