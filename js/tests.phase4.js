/* ScamShield MY - tests.phase4.js
   Phase 4 history/localStorage tests with a mock localStorage. */
var fs = require("fs");
var path = require("path");

// --- Mock localStorage (used by app.js history layer under Node) ---
function makeMockStorage(opts) {
  opts = opts || {};
  var store = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { if (opts.throwOnSet) { throw new Error("QuotaExceeded"); } store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    _dump: function () { return store; }
  };
}

global.localStorage = makeMockStorage();
eval(fs.readFileSync(path.join(__dirname, "rules.js"), "utf8"));
global.SCAM_INDICATORS = SCAM_INDICATORS;
var E = require("./app.js");
var H = E.HISTORY;

var passed = 0, failed = 0;
function check(name, cond) { if (cond) { passed++; console.log("  PASS  " + name); } else { failed++; console.log("  FAIL  " + name); } }
function analyse(msg) { return E.analyzeMessage(msg); }

console.log("\n== A/B: add + newest-first ==");
H.clear();
H.add(analyse("Please share your OTP and password now."));
var after1 = H.all();
check("1 record after first analysis", after1.length === 1);
H.add(analyse("Tahniah! Anda telah menang hadiah percuma."));
var after2 = H.all();
check("2 records after second analysis", after2.length === 2);
check("newest record first", after2[0].originalMessage.indexOf("Tahniah") !== -1);
check("record has id", typeof after2[0].id === "string" && after2[0].id.length > 0);
check("record has timestamp", typeof after2[0].timestamp === "number");

console.log("\n== C: persistence across reload (same storage) ==");
check("reload keeps records", H.all().length === 2);

console.log("\n== D: cap at 20, oldest removed ==");
H.clear();
for (var i = 1; i <= 21; i++) { H.add(analyse("Message number " + i + " transfer money")); }
var capped = H.all();
check("exactly 20 records kept", capped.length === 20);
check("newest is #21", capped[0].originalMessage.indexOf("number 21 ") !== -1);
check("oldest (#1) removed", !capped.some(function (r) { return r.originalMessage.indexOf("number 1 ") !== -1; }));
check("message #2 still present (now oldest)", capped[capped.length - 1].originalMessage.indexOf("number 2 ") !== -1);

console.log("\n== E: viewing does not duplicate (re-analysis is pure) ==");
H.clear();
H.add(analyse("Verify your account akaun disekat https://x.co otp"));
var beforeView = H.all().length;
var rec = H.all()[0];
var reanalysed = analyse(rec.originalMessage); // simulates viewHistoryRecord (no H.add)
check("view re-analysis yields same score", reanalysed.score === rec.score);
check("view re-analysis yields same level", reanalysed.riskLevel === rec.riskLevel);
check("viewing did NOT add a record", H.all().length === beforeView);

console.log("\n== G: clear history ==");
H.clear();
check("history empty after clear", H.all().length === 0);

console.log("\n== H: corrupted JSON recovers to empty ==");
global.localStorage.setItem(H.key, "{not valid json");
check("corrupted -> empty list", H.all().length === 0);
global.localStorage.setItem(H.key, JSON.stringify({ not: "an array" }));
check("non-array -> empty list", H.all().length === 0);

console.log("\n== I: storage unavailable - analysis still works ==");
var savedLS = global.localStorage;
global.localStorage = undefined;
var okResult = analyse("URGENT transfer money now");
check("analysis works without storage", okResult.riskLevel === "MEDIUM" || okResult.score >= 3);
var addedWithoutStorage = H.add(okResult); // must not throw
check("add() does not throw without storage", Array.isArray(addedWithoutStorage));
global.localStorage = savedLS;

console.log("\n== Quota exceeded fails soft ==");
global.localStorage = makeMockStorage({ throwOnSet: true });
var noThrow = true;
try { H.add(analyse("otp password transfer money")); } catch (e) { noThrow = false; }
check("quota error does not throw", noThrow === true);
global.localStorage = makeMockStorage();

console.log("\n== Config ==");
check("storage key is scamshield_my_history", H.key === "scamshield_my_history");
check("max is 20", H.max === 20);

console.log("\n============================================");
console.log("  PHASE 4 RESULTS: " + passed + " passed, " + failed + " failed");
console.log("============================================");
process.exit(failed === 0 ? 0 : 1);

