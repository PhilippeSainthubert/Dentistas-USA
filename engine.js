// Pricing engine for the Delaware clinic prototype: the clinic's own fee table
// (what the dentist earns per procedure and plan), their exam + x-ray combos,
// and a parser for the shorthand dentists already type in their daily Excel.
var PD = (function () {
  "use strict";

  var COLS = ["medicaid", "delta", "guardian", "private", "va", "nin"];
  var COL_NAMES = { medicaid: "Medicaid", delta: "Delta", guardian: "Guardian", private: "Private promo", va: "VA", nin: "Not in network" };

  // Plans as the front desk records them, and the fee column each one is paid from
  var PLANS = {
    mc_adult: { es: "Medicaid adulto (Adult MC)", en: "Adult Medicaid (Adult MC)", col: "medicaid" },
    mc_child: { es: "Medicaid niño (Child MC)", en: "Child Medicaid (Child MC)", col: "medicaid" },
    delta: { es: "Delta Dental", en: "Delta Dental", col: "delta" },
    guardian: { es: "Guardian", en: "Guardian", col: "guardian" },
    va: { es: "VA", en: "VA", col: "va" },
    noins: { es: "Privado / deal (sin seguro)", en: "Private / deal (no insurance)", col: "private" },
    unum: { es: "UNUM", en: "UNUM", col: "nin" },
    amerihealth: { es: "Amerihealth (sin Medicaid)", en: "Amerihealth (non-Medicaid)", col: "nin" },
    other: { es: "Otro seguro", en: "Other insurance", col: "nin" }
  };
  var PLAN_ORDER = ["mc_adult", "mc_child", "delta", "guardian", "va", "noins", "unum", "amerihealth", "other"];

  var GROUPS = [
    ["exam", "Exámenes", "Exams"],
    ["combo", "Exámenes + radiografías (combos)", "Exams + x-rays (combos)"],
    ["xray", "Radiografías", "X-rays"],
    ["ant", "Empastes anteriores (6-11, 22-27)", "Anterior fillings (6-11, 22-27)"],
    ["post", "Empastes posteriores (1-5, 12-21, 28-32)", "Posterior fillings (1-5, 12-21, 28-32)"],
    ["crown", "Coronas", "Crowns"],
    ["implant", "Coronas sobre implante", "Implant crowns"],
    ["ext", "Extracciones", "Extractions"],
    ["endo", "Endodoncia", "Endodontics"],
    ["misc", "Varios", "Miscellaneous"],
    ["nopay", "No se pagan al dentista", "Not paid to the dentist"],
    ["notable", "Fuera de la tabla", "Not in the fee table"]
  ];

  // Fees in COLS order. null = blank cell in the clinic's table. [a, b] = two prices.
  var T2 = [508.4, 406.4];
  var ITEMS = [
    ["comp", "exam", "Examen completo", "Comp exam", [35.38, 27.2, 28, 56, 39.2, 56]],
    ["periodic", "exam", "Examen periódico", "Periodic exam", [20.25, 15.2, 19.2, 28, 22, 28]],
    ["limited", "exam", "Examen limitado", "Limited exam", [29.52, 20.8, 27.2, 54, 31.7, 54]],
    ["compperio", "exam", "Examen periodontal completo", "Comp periodontal exam", [null, null, null, null, null, null]],
    ["under3", "exam", "Examen niño menor de 3 años", "Oral eval, child under 3", [25.62, 15.2, 26, 28, null, 28]],

    ["comp_pan_4btw", "combo", "Comp + pan + 4 BW", "Comp + pan + 4 BW", [103.21, 85.2, 94.8, 100, 115.6, 144]],
    ["comp_pan_4btw_3pa", "combo", "Comp + pan + 4 BW + 3 PA", "Comp + pan + 4 BW + 3 PA", [134.2, 72.8, 94.8, 100, 146.52, 184]],
    ["comp_pan_2btw", "combo", "Comp + pan + 2 BW", "Comp + pan + 2 BW", [96.13, 78, 84.4, 100, 101.07, 136]],
    ["comp_fms", "combo", "Comp + FMX", "Comp + FMX", [84.91, 72.8, 77.6, 100, 94.28, 156]],
    ["comp_4btw", "combo", "Comp + 4 BW", "Comp + 4 BW", [59.78, 48.01, 51.6, 100, 67.2, 84]],
    ["comp_pan", "combo", "Comp + pan", "Comp + pan", [78.81, 64.4, 71.2, 100, 87.6, 116]],
    ["periodic_4btw", "combo", "Periodic + 4 BW", "Periodic + 4 BW", [44.65, 36, 42.8, 40, 50, 56]],
    ["periodic_4btw_3pa", "combo", "Periodic + 4 BW + 3 PA", "Periodic + 4 BW + 3 PA", [75.64, 58.4, 61.6, 40, 80.92, 96]],
    ["periodic_4btw_pan", "combo", "Periodic + 4 BW + pano", "Periodic + 4 BW + pano", [69.05, 73.2, 86, 100, 98.4, 116]],
    ["periodic_2btw", "combo", "Periodic + 2 BW", "Periodic + 2 BW", [37.57, 28.8, 32.4, 40, 35.47, 48]],
    ["limited_pa", "combo", "Limited + PA", "Limited + PA", [40.99, 30.4, 35.6, 54, 44.1, 70]],
    ["limited_pa_rec", "combo", "Limited + PA + recementar corona", "Limited + PA + recement crown", [103.25, 62.4, 68.8, 134, 82.83, 150]],

    ["btw1", "xray", "Aleta de mordida (BW), 1", "Bitewing (BW), 1", [11.22, 8.8, 8.8, 16, 9.41, 16]],
    ["btw2", "xray", "Aletas de mordida (BW), 2", "Bitewings (BW), 2", [17.32, 13.6, 13.2, 20, 13.47, 20]],
    ["btw3", "xray", "Aletas de mordida (BW), 3", "Bitewings (BW), 3", [20.5, 17.6, 15.2, 24, 17.26, 24]],
    ["btw4", "xray", "Aletas de mordida (BW), 4", "Bitewings (BW), 4", [24.4, 20.81, 23.6, 28, 28, 28]],
    ["pa", "xray", "Periapical (PA)", "Periapical (PA)", [11.47, 9.6, 8.4, 16, 12.4, 16]],
    ["paadd", "xray", "PA adicional", "Additional PA", [9.76, 6.4, 5.2, 12, 9.26, 12]],
    ["pan", "xray", "Panorámica", "Panoramic", [37.2, 37.2, 43.2, 60, 48.4, 60]],
    ["fms", "xray", "Serie completa (FMX)", "Full mouth series (FMX)", [49.53, 45.6, 49.6, 100, 55.08, 100]],
    ["cbct", "xray", "CBCT (0367)", "CBCT (0367)", [160, 108.4, 144, 160, 166.68, 160]],

    ["ant1", "ant", "Anterior, 1 superficie", "Anterior, 1 surface", [89.67, 41.2, 66, 100, 65.2, 100]],
    ["ant2", "ant", "Anterior, 2 superficies", "Anterior, 2 surfaces", [108.29, 53.6, 86, 120, 84.8, 120]],
    ["ant3", "ant", "Anterior, 3 superficies", "Anterior, 3 surfaces", [132.32, 66, 96, 140, 110, 140]],
    ["ant4", "ant", "Anterior, 4 superficies", "Anterior, 4 surfaces", [163.78, 74.4, 110, 152, 142.4, 152]],
    ["post1", "post", "Posterior, 1 superficie", "Posterior, 1 surface", [96.78, 56, 74, 100, 75.2, 100]],
    ["post2", "post", "Posterior, 2 superficies", "Posterior, 2 surfaces", [123.18, 62, 94, 140, 99.6, 140]],
    ["post3", "post", "Posterior, 3 superficies", "Posterior, 3 surfaces", [149.57, 76.4, 110, 152, 129.2, 152]],
    ["post4", "post", "Posterior, 4 superficies", "Posterior, 4 surfaces", [178, 78, 114, 180, 129.24, 180]],

    ["crownprep", "crown", "Preparación / impresión de corona", "Crown prep / impression", [210.54, 197.4, 242.4, 262.4, 233.6, 262.4]],
    ["core", "crown", "Core build-up", "Core build-up", [141.45, 88.8, 88, 160, 113.2, 160]],
    ["coreprep", "crown", "Core build-up + preparación de corona", "Core build-up + crown prep", [332.02, 286.2, 330.4, 422.4, 346.8, 422.4]],
    ["crowndel", "crown", "Entrega de corona", "Crown delivery", [210.54, 197.4, 242.4, 262.4, 233.6, 262.4]],
    ["rec", "crown", "Recementar corona", "Recement crown", [62.26, 32, 33.2, 80, null, 80]],
    ["nightguard", "crown", "Férula de descarga (night guard)", "Night guard", [null, 128.4, null, null, null, null]],

    ["implimp", "implant", "Corona sobre implante: impresión", "Implant crown impression", [T2, 309.8, 508.4, T2, 378.05, T2]],
    ["impldel", "implant", "Corona sobre implante: entrega", "Implant crown delivery", [T2, 309.8, 508.4, T2, 378.05, T2]],

    ["extsurg", "ext", "Extracción quirúrgica", "Surgical extraction", [126.87, 76, 92.8, 140, 94.04, 140]],
    ["extsimple", "ext", "Extracción simple", "Simple extraction", [88.06, 41.2, 49.6, 104, 53.38, 104]],
    ["extbaby", "ext", "Extracción diente de leche (A-T)", "Baby tooth extraction (A-T)", [62.47, 37.2, 34.4, 88, 45.13, 88]],

    ["endoant", "endo", "Endodoncia anterior", "Root canal, anterior", [332.17, 234, 300, 400, 302.62, 400]],
    ["endopre", "endo", "Endodoncia premolar", "Root canal, premolar", [377.85, 288, 354, 500, 329.72, 500]],
    ["endomolar", "endo", "Endodoncia molar", "Root canal, molar", [457.11, 352, 460.4, 600, 480.12, 600]],

    ["sdf", "misc", "Detención de caries (SDF)", "Caries arresting (SDF)", [27.32, null, null, 40, 18.06, 40]],
    ["occadj", "misc", "Ajuste oclusal", "Occlusal adjustment", [null, 34.8, null, null, 59.09, null]],
    ["occguard", "misc", "Protector oclusal", "Occlusal mouthguard", [null, 111.6, null, null, 161.01, null]],

    ["prophy", "nopay", "Profilaxis", "Prophylaxis", [0, 0, 0, 0, 0, 0]],
    ["fluoride", "nopay", "Flúor", "Fluoride", [0, 0, 0, 0, 0, 0]],
    ["followup", "nopay", "Revisión de seguimiento", "Follow-up visit", [0, 0, 0, 0, 0, 0]],

    ["srp", "notable", "Raspado radicular (SRP) / anestesia local", "Scaling and root planing / local", [null, null, null, null, null, null]],
    ["other", "notable", "Otro procedimiento", "Other procedure", [null, null, null, null, null, null]]
  ].map(function (r) { return { id: r[0], g: r[1], es: r[2], en: r[3], f: r[4] }; });
  var ITEM = {};
  ITEMS.forEach(function (it) { ITEM[it.id] = it; });

  function defaultFees() {
    var fees = {};
    ITEMS.forEach(function (it) {
      fees[it.id] = {};
      COLS.forEach(function (c, i) { fees[it.id][c] = Array.isArray(it.f[i]) ? it.f[i].slice() : it.f[i]; });
    });
    return fees;
  }

  // Exam + x-ray combos from the clinic's table. The most complete one that fits is applied; the rest is billed loose.
  var BUNDLES = [
    { id: "comp_pan_4btw_3pa", exam: "comp", pan: 1, btw: 4, pa: 3 },
    { id: "comp_pan_4btw", exam: "comp", pan: 1, btw: 4 },
    { id: "comp_pan_2btw", exam: "comp", pan: 1, btw: 2 },
    { id: "comp_fms", exam: "comp", fms: 1 },
    { id: "comp_4btw", exam: "comp", btw: 4 },
    { id: "comp_pan", exam: "comp", pan: 1 },
    { id: "periodic_4btw_3pa", exam: "periodic", btw: 4, pa: 3 },
    { id: "periodic_4btw_pan", exam: "periodic", btw: 4, pan: 1 },
    { id: "periodic_4btw", exam: "periodic", btw: 4 },
    { id: "periodic_2btw", exam: "periodic", btw: 2 },
    { id: "limited_pa_rec", exam: "limited", pa: 1, rec: 1 },
    { id: "limited_pa", exam: "limited", pa: 1 }
  ];
  var EXAMS = ["comp", "periodic", "limited", "under3", "compperio"];

  // Teeth: "1".."32" permanent (Universal numbering), "A".."T" primary
  function isPrimary(t) { return /^[A-T]$/.test(t); }
  function isAnterior(t) {
    if (isPrimary(t)) return "CDEFGHMNOPQR".indexOf(t) >= 0;
    var n = +t; return (n >= 6 && n <= 11) || (n >= 22 && n <= 27);
  }
  function isPremolar(t) { return !isPrimary(t) && [4, 5, 12, 13, 20, 21, 28, 29].indexOf(+t) >= 0; }
  // Keeps the order the dentist typed ("DO" stays "DO"); "Occ" means occlusal; a trailing 5 (class V) is not a surface
  function normSurf(s) {
    var up = s.toUpperCase();
    if (up === "OCC") return "O";
    var out = "";
    for (var i = 0; i < up.length; i++) if ("MODBLIF".indexOf(up[i]) >= 0 && out.indexOf(up[i]) < 0) out += up[i];
    return out;
  }
  function fillId(tooth, surf) { return (isAnterior(tooth) ? "ant" : "post") + Math.max(1, Math.min(4, surf.length)); }
  function endoId(tooth) { return isAnterior(tooth) ? "endoant" : isPremolar(tooth) ? "endopre" : "endomolar"; }

  /* ---------- shorthand parser ---------- */
  var SKIP = { skip: true };
  function teethIn(s) {
    var out = [], m, re = /#\s*(\d{1,2}|[a-t])\b/g;
    while ((m = re.exec(s))) out.push(/\d/.test(m[1]) ? String(+m[1]) : m[1].toUpperCase());
    var re2 = /(^|[^#\d])\b(\d{1,2})\b(?!\s*(?:bwx?|btw|bitewings?|pa'?s?)\b)/g;
    while ((m = re2.exec(s))) { var n = +m[2]; if (n >= 1 && n <= 32 && out.indexOf(String(n)) < 0) out.push(String(n)); }
    return out.filter(function (t) { return isPrimary(t) || (+t >= 1 && +t <= 32); });
  }
  function parseSeg(s) {
    if (/^no\b/.test(s)) return SKIP;
    if (/^(ul|ur|ll|lr)(\s*(ul|ur|ll|lr))*$/.test(s)) return SKIP;
    var r = [], m;
    var crowny = /crown|core|implant|ext|rct|root canal|endo|deliver|prep/.test(s);
    // Fillings: "#2 MO #3 MOD", "#18 Occ", "15 O", "18 B5"
    if (!crowny) {
      var re = /#\s*(\d{1,2}|[a-t])\s+(occ|[modblif5]{1,6})(?![a-z])/g;
      while ((m = re.exec(s))) { var sf = normSurf(m[2]); if (sf) r.push({ k: "fill", tooth: /\d/.test(m[1]) ? String(+m[1]) : m[1].toUpperCase(), surf: sf }); }
      if (!r.length && (m = s.match(/^(\d{1,2})\s*(occ|[modblif5]{1,6})$/)) && +m[1] >= 1 && +m[1] <= 32) {
        var sf2 = normSurf(m[2]); if (sf2) r.push({ k: "fill", tooth: String(+m[1]), surf: sf2 });
      }
      if (r.length) return r;
    }
    if ((m = s.match(/(\d)\s*(?:bwx?|btw|bitewings?)s?\b/))) r.push({ k: "btw", n: Math.max(1, Math.min(4, +m[1])) });
    else if (/\b(bwx?|btw|bitewings?)\b/.test(s)) r.push({ k: "btw", n: 4 });
    if ((m = s.match(/(\d+)\s*pa(?:'?s)?\b/))) r.push({ k: "pa", n: Math.max(1, +m[1]) });
    else if (/\bpa(?:'?s)?\b/.test(s)) r.push({ k: "pa", n: 1 });
    if (/\bpan(o|oramic)?\b/.test(s)) r.push({ k: "pan" });
    if (/\bfm[xs]\b|full\s*mouth/.test(s)) r.push({ k: "fms" });
    if (/cbct/.test(s)) r.push({ k: "cbct" });
    if (/comp(rehensive)?\.?\s*perio/.test(s)) r.push({ k: "compperio" });
    else if (/\bcomp(rehensive)?\.?\s*(oral\s*)?(exam|eval)/.test(s)) r.push({ k: "comp" });
    if (/periodic/.test(s)) r.push({ k: "periodic" });
    if (/limited/.test(s)) r.push({ k: "limited" });
    if (/\bun(d)?er\s*(3|three)\b/.test(s)) r.push({ k: "under3" });
    if (/proph/.test(s)) r.push({ k: "prophy" });
    if (/fluor|fluro/.test(s)) r.push({ k: "fluoride" });
    if (/follow\s*-?\s*up/.test(s)) r.push({ k: "followup" });
    if (/scaling|root\s*planing|\bsrp\b|\blocal\b/.test(s)) r.push({ k: "srp" });
    if (/\bsdf\b|caries\s*arrest/.test(s)) r.push({ k: "sdf" });
    if (/mouth\s*-?\s*gu?u?ard|occlusal\s*(mouth)?\s*guard/.test(s)) r.push({ k: "occguard" });
    else if (/adjust/.test(s) && /\bng\b|night\s*guard|occlusal/.test(s)) r.push({ k: "occadj" });
    else if (/\bng\b|night\s*guard/.test(s)) r.push({ k: "nightguard" });

    var teeth = teethIn(s);
    function perTooth(k) {
      if (teeth.length) teeth.forEach(function (t) { r.push({ k: k, tooth: t }); });
      else r.push({ k: k, needTooth: true });
    }
    if (/implant/.test(s)) perTooth(/deliver|seat/.test(s) ? "impldel" : "implimp");
    else {
      if (/recement/.test(s)) r.push({ k: "rec" });
      if (/core\s*-?\s*bu|build\s*-?\s*up|buil?d?up/.test(s)) perTooth("core");
      if (/crown\s*preps?|prep(ped)?\s*crowns?|crown\s*impression|scan\s*for\s*crown|crown\s*scan/.test(s)) perTooth("crownprep");
      if (/deliver(ed|y)?\s*(of\s*)?crowns?|crowns?\s*deliver|seat(ed)?\s*crowns?|crowns?\s*seat/.test(s)) perTooth("crowndel");
    }
    if (/surg(ical)?\.?\s*ext/.test(s)) perTooth("extsurg");
    else if (/\bext(raction)?s?\b|\bxt\b/.test(s)) {
      if (teeth.length) teeth.forEach(function (t) { r.push({ k: isPrimary(t) ? "extbaby" : "extsimple", tooth: t }); });
      else r.push({ k: "extsimple", needTooth: true });
    }
    if (/\brct\b|root\s*canal|\bendo/.test(s)) {
      if (teeth.length) teeth.forEach(function (t) { r.push({ k: endoId(t), tooth: t }); });
      else r.push({ k: "endomolar", needTooth: true });
    }
    if (!r.length && /resin|composite/.test(s)) r.push({ k: "fill", needTooth: true });
    return r;
  }
  function parseText(text) {
    var out = [];
    String(text || "").split(/[,;\n]+|\.(?=\s|$)/).map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (raw) {
      var s = raw.toLowerCase().replace(/\s+/g, " ");
      var res = parseSeg(s);
      if (res === SKIP) out.push({ skip: true, raw: raw });
      else if (!res.length) out.push({ unknown: true, raw: raw });
      else res.forEach(function (x) { x.raw = raw; out.push(x); });
    });
    return out;
  }
  function usable(parsed) { return parsed.filter(function (x) { return x.k && !x.needTooth; }); }

  /* ---------- pricing ---------- */
  // items: [{k, n?, tooth?, surf?}], plan: key of PLANS or null. opts: {fees, implantIdx}
  function priceVisit(items, plan, opts) {
    opts = opts || {};
    var fees = opts.fees || defaultFees();
    var col = plan && PLANS[plan] ? PLANS[plan].col : null;
    var parts = [], alerts = [];
    if (!col) alerts.push("noIns");

    var exams = [], pan = 0, btw = 0, pa = 0, fms = 0, rec = 0, rest = [];
    items.forEach(function (it) {
      if (EXAMS.indexOf(it.k) >= 0) exams.push(it.k);
      else if (it.k === "pan") pan++;
      else if (it.k === "btw") btw = Math.min(4, btw + (it.n || 4));
      else if (it.k === "pa") pa += it.n || 1;
      else if (it.k === "fms") fms++;
      else if (it.k === "rec") rec++;
      else rest.push(it);
    });
    var exam = exams[0] || null, b = null, score = -1;
    BUNDLES.forEach(function (x) {
      if (x.exam !== exam) return;
      if (x.pan && !pan) return;
      if (x.btw && btw !== x.btw) return;
      if (x.pa && pa < x.pa) return;
      if (x.fms && !fms) return;
      if (x.rec && !rec) return;
      var sc = 1 + (x.pan ? 1 : 0) + (x.btw ? 1 : 0) + (x.pa ? 1 : 0) + (x.fms ? 1 : 0) + (x.rec ? 1 : 0);
      if (sc > score) { score = sc; b = x; }
    });
    var paCovered = 0;
    if (b) {
      parts.push({ id: b.id, qty: 1 });
      paCovered = b.pa || 0;
      if (b.pan) pan--;
      if (b.btw) btw = 0;
      if (b.fms) fms--;
      if (b.rec) rec--;
      exams.shift();
    }
    exams.forEach(function (e) { parts.push({ id: e, qty: 1 }); });
    for (; pan > 0; pan--) parts.push({ id: "pan", qty: 1 });
    if (btw) parts.push({ id: "btw" + btw, qty: 1 });
    for (; fms > 0; fms--) parts.push({ id: "fms", qty: 1 });
    var paLeft = pa - paCovered;
    if (paLeft > 0) {
      if (paCovered) parts.push({ id: "paadd", qty: paLeft });
      else { parts.push({ id: "pa", qty: 1 }); if (paLeft > 1) parts.push({ id: "paadd", qty: paLeft - 1 }); }
    }
    for (; rec > 0; rec--) parts.push({ id: "rec", qty: 1 });

    // core build-up + crown prep on the same tooth has its own combined price (no tooth given on either = same tooth)
    var preps = {};
    rest.forEach(function (it) { if (it.k === "crownprep") preps[it.tooth || "_"] = it; });
    var merged = {};
    rest.forEach(function (it) {
      var key = it.tooth || "_";
      if (it.k === "core" && preps[key] && !merged[key]) { merged[key] = true; parts.push({ id: "coreprep", qty: 1, tooth: it.tooth }); }
    });
    rest.forEach(function (it) {
      if ((it.k === "core" || it.k === "crownprep") && merged[it.tooth || "_"]) return;
      if (it.k === "fill") parts.push({ id: fillId(it.tooth, it.surf), qty: 1, tooth: it.tooth, surf: it.surf });
      else parts.push({ id: it.k, qty: it.n && it.k !== "btw" ? it.n : 1, tooth: it.tooth });
    });

    var total = 0, complete = !!col;
    parts.forEach(function (p) {
      var item = ITEM[p.id];
      p.nopay = item && item.g === "nopay";
      if (!col) { p.amount = null; return; }
      var f = fees[p.id] ? fees[p.id][col] : null;
      if (Array.isArray(f)) { f = f[opts.implantIdx || 0]; if (alerts.indexOf("twoPrices") < 0) alerts.push("twoPrices"); }
      if (f == null || f === "") {
        p.amount = null; complete = false;
        var a = item && item.g === "notable" ? "notInTable" : "noPrice";
        if (alerts.indexOf(a) < 0) alerts.push(a);
      } else { p.amount = Math.round(+f * p.qty * 100) / 100; total += p.amount; }
    });
    return { col: col, parts: parts, total: col ? Math.round(total * 100) / 100 : null, complete: complete, alerts: alerts };
  }

  // Maps a row of the clinic's Excel (columns C "MC" and D "Ins") to a plan
  function planFromSheet(mc, ins) {
    if (/adult/i.test(mc)) return "mc_adult";
    if (/child/i.test(mc)) return "mc_child";
    var i = (ins || "").toLowerCase();
    if (/delta/.test(i)) return "delta";
    if (/guardian/.test(i)) return "guardian";
    if (/^va$/.test(i)) return "va";
    if (/no\s*ins/.test(i)) return "noins";
    if (/unum/.test(i)) return "unum";
    if (/amerihealth/.test(i)) return "amerihealth";
    return "other";
  }

  return {
    COLS: COLS, COL_NAMES: COL_NAMES, PLANS: PLANS, PLAN_ORDER: PLAN_ORDER, GROUPS: GROUPS, ITEMS: ITEMS, ITEM: ITEM, BUNDLES: BUNDLES,
    defaultFees: defaultFees, parseText: parseText, usable: usable, priceVisit: priceVisit, planFromSheet: planFromSheet,
    isPrimary: isPrimary, isAnterior: isAnterior, fillId: fillId, endoId: endoId, normSurf: normSurf
  };
})();
if (typeof module !== "undefined") module.exports = PD;
