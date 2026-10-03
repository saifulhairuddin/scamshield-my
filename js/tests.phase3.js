/* ScamShield MY - tests.phase3.js
   Phase 3 helper tests (pure functions). Run: node js/tests.phase3.js */
var fs = require("fs");
var path = require("path");
eval(fs.readFileSync(path.join(__dirname, "rules.js"), "utf8"));
global.SCAM_INDICATORS = SCAM_INDICATORS;
var E = require("./app.js");
var passed = 0, failed = 0;
function check(name, cond) { if (cond) { passed++; console.log("  PASS  " + name); } else { failed++; console.log("  FAIL  " + name); } }

var demo = "URGENT! Akaun bank anda akan disekat hari ini. Please verify immediately melalui link berikut: https://example-security-check.com Masukkan OTP anda untuk mengaktifkan semula akaun.";
var d = E.analyzeMessage(demo);

console.log("\n== Score breakdown ==");
var bd = E.buildScoreBreakdown(d);
var bdTotal = bd.rows.reduce(function (a, r) { return a + r.points; }, 0);
check("breakdown rows = indicator count", bd.rows.length === d.indicatorCount);
check("breakdown rows sum to total", bdTotal === bd.total);
check("breakdown total = 8 for demo", bd.total === 8);

console.log("\n== Highlighting (safe + original preserved) ==");
var segs = E.buildHighlightSegments(d.originalMessage, d.indicators);
var rebuilt = segs.map(function (s) { return s.text; }).join("");
check("segments reconstruct original exactly", rebuilt === d.originalMessage);
check("at least one highlighted segment", segs.some(function (s) { return s.highlighted; }));
check("original message not mutated", d.originalMessage === demo);

console.log("\n== Malicious input is data, not markup ==");
var evil = '<script>alert("x")</script> please transfer money now';
var er = E.analyzeMessage(evil);
var esegs = E.buildHighlightSegments(er.originalMessage, er.indicators);
var erebuilt = esegs.map(function (s) { return s.text; }).join("");
check("script text preserved verbatim as data", erebuilt === evil);
check("segments carry no HTML element nodes (text only)", esegs.every(function (s) { return typeof s.text === "string"; }));

console.log("\n== Recommendations (dedup + always-verify) ==");
var recs = E.buildRecommendations(d);
var lc = recs.map(function (r) { return r.toLowerCase(); });
var uniq = lc.filter(function (v, i) { return lc.indexOf(v) === i; });
check("no duplicate recommendations", uniq.length === recs.length);
check("includes verify-through-official-channel", lc.some(function (r) { return r.indexOf("official") !== -1; }));
check("HIGH demo yields multiple recommendations", recs.length >= 3);

console.log("\n== Zero-indicator case ==");
var zero = E.analyzeMessage("Jumpa esok di pejabat ya.");
var zrecs = E.buildRecommendations(zero);
check("zero indicators", zero.indicatorCount === 0);
check("zero -> LOW", zero.riskLevel === "LOW");
check("zero case still gives guidance", zrecs.length >= 1);
check("zero highlighting = single plain segment", (function(){var s=E.buildHighlightSegments(zero.originalMessage,zero.indicators);return s.length===1 && s[0].highlighted===false;})());

console.log("\n== Level mapping for render tiers ==");
check("LOW sample -> LOW", E.analyzeMessage("Hi, meeting kita pukul 3 petang esok. Jumpa di pejabat.").riskLevel === "LOW");
var med = E.analyzeMessage("Tahniah! Anda telah menang hadiah percuma. Tuntut hadiah anda sekarang.");
check("MEDIUM sample -> MEDIUM", med.riskLevel === "MEDIUM");
check("HIGH sample -> HIGH", d.riskLevel === "HIGH");

console.log("\n============================================");
console.log("  PHASE 3 RESULTS: " + passed + " passed, " + failed + " failed");
console.log("============================================");
process.exit(failed === 0 ? 0 : 1);

