const STORAGE_KEY = "travel_form_bootstrap_current_v5";
const DRAFTS_STORAGE_KEY = "travel_form_project_drafts_v1";
const THEME_KEY = "travel_form_bootstrap_theme_v2";
const LEGACY_STORAGE_KEYS = [
    "travel_form_bootstrap_v2",
    "travel_form_bootstrap_v3",
    "travel_form_bootstrap_v4"
];

const REALISASI_INFO_FIELDS = [
    { baseKey: "companyName", realisasiKey: "realisasiCompanyName" },
    { baseKey: "department", realisasiKey: "realisasiDepartment" },
    { baseKey: "destination", realisasiKey: "realisasiDestination" },
    { baseKey: "purpose", realisasiKey: "realisasiPurpose" },
    { baseKey: "poNumber", realisasiKey: "realisasiPoNumber" },
    { baseKey: "projectDurationCount", realisasiKey: "realisasiProjectDurationCount" },
    { baseKey: "projectDurationUnit", realisasiKey: "realisasiProjectDurationUnit" },
    { baseKey: "submissionStartDate", realisasiKey: "realisasiSubmissionStartDate" },
    { baseKey: "submissionEndDate", realisasiKey: "realisasiSubmissionEndDate" },
    { baseKey: "installerName", realisasiKey: "realisasiInstallerName" },
    { baseKey: "salesName", realisasiKey: "realisasiSalesName" }
];

const defaultCostRows = [];

const defaultState = {
    companyName: "PT. Perkom Indah Murni",
    realisasiCompanyName: "PT. Perkom Indah Murni",
    docDate: "",
    realisasiDocDate: "",
    department: "",
    realisasiDepartment: "",
    destination: "",
    realisasiDestination: "",
    purpose: "",
    realisasiPurpose: "",
    poNumber: "",
    realisasiPoNumber: "",
    projectDurationCount: "",
    projectDurationUnit: "hari",
    realisasiProjectDurationCount: "",
    realisasiProjectDurationUnit: "hari",
    projectDuration: "",
    realisasiProjectDuration: "",
    submissionStartDate: "",
    submissionEndDate: "",
    realisasiSubmissionStartDate: "",
    realisasiSubmissionEndDate: "",
    submissionPeriod: "",
    realisasiSubmissionPeriod: "",
    installerName: "",
    realisasiInstallerName: "",
    salesName: "",
    realisasiSalesName: "",

    noteText:
        `- SEMUA BUKTI PENGELUARAN HARUS DILAMPIRKAN PADA FORMULIR INI
- FORMULIR INI HARUS DISERAHKAN KE BAGIAN ACCOUNTING PALING LAMBAT 7 (TUJUH) HARI
  SETELAH SELESAI PERJALANAN.`,

    preparedBy: "",
    checkedBy: "",
    approvedBy: "Christian Hadi Susanto",

    preparedSign: "",
    checkedSign: "",
    approvedSign: "",

    realisasiDocDateManualEdit: false,
    realisasiInfoManualEdit: {},
    realisasiManualEdit: false,
    realisasiBaseCosts: clone(defaultCostRows),
    advanceCosts: clone(defaultCostRows),
    realisasiCosts: clone(defaultCostRows)
};

let state = structuredClone(defaultState);
const costEditorCollapsed = {
    ump: true,
    realisasi: true
};
let costRowIdCounter = 0;
const COST_ROW_MOVE_FEEDBACK_MS = 900;
const COST_ROW_MOVE_ANIMATION_MS = 320;
let recentCostRowMove = null;
const activeCostEdit = {
    docType: null,
    index: null,
    isNew: false
};
const PDF_TABLE_LINE_WIDTH = 0.2;
const PDF_TABLE_LINE_COLOR = 28;
const PDF_SIGNATURE_IMAGE_MAX_WIDTH = 900;
const PDF_SIGNATURE_IMAGE_MAX_HEIGHT = 324;
const PREVIEW_TABLE_BORDER_WIDTH = 0.2;
const PREVIEW_TABLE_VISIBLE_BORDER_WIDTH = 0.3;
const PREVIEW_TABLE_MAX_BORDER_WIDTH = 0.8;
const PREVIEW_TABLE_MOBILE_VISIBLE_BORDER_WIDTH = 0.5;
const PREVIEW_TABLE_MOBILE_MAX_BORDER_WIDTH = 2.6;
const DISPLAY_CASE = {
    raw: "raw",
    proper: "proper",
    upper: "upper"
};

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function createCostRowId() {
    costRowIdCounter += 1;
    return `cost-row-${Date.now().toString(36)}-${costRowIdCounter.toString(36)}`;
}

function hasOwnValue(source, key) {
    return Object.prototype.hasOwnProperty.call(source, key);
}

function getRealisasiInfoPairByBase(key) {
    return REALISASI_INFO_FIELDS.find(field => field.baseKey === key);
}

function getRealisasiInfoPairByKey(key) {
    return REALISASI_INFO_FIELDS.find(field => field.realisasiKey === key);
}

function getRealisasiManualMap() {
    if (!state.realisasiInfoManualEdit || typeof state.realisasiInfoManualEdit !== "object") {
        state.realisasiInfoManualEdit = {};
    }
    return state.realisasiInfoManualEdit;
}

function updateSyncFieldValue(key, value) {
    document.querySelectorAll(`.sync-field[data-key="${key}"]`).forEach(el => {
        el.value = value ?? "";
    });
}

function formatDurationValue(count, unit) {
    const safeCount = String(count ?? "").trim();
    const safeUnit = unit === "bulan" || unit === "tahun" ? unit : "hari";
    if (!safeCount) return "";
    return `${safeCount} ${safeUnit}`;
}

function syncProjectDurationDisplay() {
    state.projectDuration = formatDurationValue(state.projectDurationCount, state.projectDurationUnit);
    state.realisasiProjectDuration = formatDurationValue(
        state.realisasiProjectDurationCount,
        state.realisasiProjectDurationUnit
    );
}

function countInclusiveDays(startDate, endDate) {
    if (!startDate || !endDate) return "";
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
    if (diff < 0) return "";
    return `${diff + 1}`;
}

function formatSubmissionPeriod(startDate, endDate) {
    const start = startDate ? formatDateIndo(startDate) : "";
    const end = endDate ? formatDateIndo(endDate) : "";
    const dayCount = countInclusiveDays(startDate, endDate);
    if (start && end) {
        return dayCount ? `${dayCount} hari (${start} s/d ${end})` : `${start} s/d ${end}`;
    }
    return start || end || "";
}

function syncSubmissionPeriodDisplay() {
    state.submissionPeriod = formatSubmissionPeriod(state.submissionStartDate, state.submissionEndDate);
    state.realisasiSubmissionPeriod = formatSubmissionPeriod(
        state.realisasiSubmissionStartDate,
        state.realisasiSubmissionEndDate
    );
}

function getComparableCostRow(row = {}) {
    return {
        type: row?.type === "sub" ? "sub" : "item",
        description: typeof row?.description === "string" ? row.description : "",
        rp: parseMaybeNumber(row?.rp),
        usd: parseMaybeNumber(row?.usd)
    };
}

function normalizeCostRows(rows, fallbackRows = [], referenceRows = []) {
    const sourceRows = Array.isArray(rows) ? rows : fallbackRows;
    return sourceRows.map((row, index) => ({
        id: typeof row?.id === "string" && row.id
            ? row.id
            : (getCostRowId(referenceRows[index]) || createCostRowId()),
        ...getComparableCostRow(row)
    }));
}

function areCostRowsEqual(leftRows = [], rightRows = []) {
    const normalizeForCompare = rows => (Array.isArray(rows) ? rows : []).map(getComparableCostRow);
    return JSON.stringify(normalizeForCompare(leftRows)) === JSON.stringify(normalizeForCompare(rightRows));
}

function areCostRowsEqualByIndex(leftRow, rightRow) {
    return areCostRowsEqual(
        leftRow === undefined ? [] : [leftRow],
        rightRow === undefined ? [] : [rightRow]
    );
}

function getCostRowId(row) {
    return typeof row?.id === "string" && row.id ? row.id : "";
}

function createCostRowMap(rows = []) {
    const rowMap = new Map();
    rows.forEach(row => {
        const id = getCostRowId(row);
        if (id) {
            rowMap.set(id, row);
        }
    });
    return rowMap;
}

function isCostRowOrderAligned(currentRows = [], baseRows = []) {
    const baseIds = baseRows.map(getCostRowId).filter(Boolean);
    const baseIdSet = new Set(baseIds);
    const currentIds = currentRows
        .map(getCostRowId)
        .filter(id => baseIdSet.has(id));
    const currentIdSet = new Set(currentIds);
    const filteredBaseIds = baseIds.filter(id => currentIdSet.has(id));
    return JSON.stringify(currentIds) === JSON.stringify(filteredBaseIds);
}

function syncRealisasiCostsFromAdvance(options = {}) {
    const { force = false } = options;
    const nextBaseCosts = clone(getCosts("ump"));

    if (force || !state.realisasiManualEdit) {
        state.realisasiBaseCosts = clone(nextBaseCosts);
        state.realisasiCosts = clone(nextBaseCosts);
        state.realisasiManualEdit = false;
        return true;
    }

    const previousBaseCosts = Array.isArray(state.realisasiBaseCosts)
        ? clone(state.realisasiBaseCosts)
        : [];
    const currentRealisasiCosts = clone(getCosts("realisasi"));
    const previousBaseRowMap = createCostRowMap(previousBaseCosts);
    const currentRealisasiRowMap = createCostRowMap(currentRealisasiCosts);
    const nextBaseRowMap = createCostRowMap(nextBaseCosts);
    const nextBaseIdSet = new Set(nextBaseCosts.map(getCostRowId).filter(Boolean));
    const preserveCurrentOrder = !isCostRowOrderAligned(currentRealisasiCosts, previousBaseCosts);
    let mergedRealisasiCosts = [];

    if (preserveCurrentOrder) {
        const includedIds = new Set();

        currentRealisasiCosts.forEach(currentRow => {
            const rowId = getCostRowId(currentRow);
            const previousBaseRow = previousBaseRowMap.get(rowId);
            const nextBaseRow = nextBaseRowMap.get(rowId);

            if (nextBaseRow) {
                mergedRealisasiCosts.push(
                    !currentRow || areCostRowsEqualByIndex(currentRow, previousBaseRow)
                        ? clone(nextBaseRow)
                        : clone(currentRow)
                );
                includedIds.add(rowId);
                return;
            }

            if (!areCostRowsEqualByIndex(currentRow, previousBaseRow)) {
                mergedRealisasiCosts.push(clone(currentRow));
                if (rowId) {
                    includedIds.add(rowId);
                }
            }
        });

        nextBaseCosts.forEach(baseRow => {
            const rowId = getCostRowId(baseRow);
            if (!rowId || includedIds.has(rowId)) return;
            mergedRealisasiCosts.push(clone(baseRow));
        });
    } else {
        mergedRealisasiCosts = nextBaseCosts.map(baseRow => {
            const rowId = getCostRowId(baseRow);
            const currentRow = currentRealisasiRowMap.get(rowId);
            const previousBaseRow = previousBaseRowMap.get(rowId);

            if (!currentRow || areCostRowsEqualByIndex(currentRow, previousBaseRow)) {
                return clone(baseRow);
            }

            return clone(currentRow);
        });

        currentRealisasiCosts.forEach(currentRow => {
            const rowId = getCostRowId(currentRow);
            if (rowId && nextBaseIdSet.has(rowId)) return;
            const previousBaseRow = previousBaseRowMap.get(rowId);
            if (!areCostRowsEqualByIndex(currentRow, previousBaseRow)) {
                mergedRealisasiCosts.push(clone(currentRow));
            }
        });
    }

    state.realisasiBaseCosts = clone(nextBaseCosts);
    state.realisasiCosts = normalizeCostRows(mergedRealisasiCosts, nextBaseCosts);
    if (
        areCostRowsEqual(state.realisasiCosts, state.realisasiBaseCosts)
        && isCostRowOrderAligned(state.realisasiCosts, state.realisasiBaseCosts)
    ) {
        state.realisasiManualEdit = false;
    }
    return true;
}

function createResetState() {
    return {
        ...clone(defaultState),
        docDate: "",
        realisasiDocDate: "",
        department: "",
        realisasiDepartment: "",
        destination: "",
        realisasiDestination: "",
        purpose: "",
        realisasiPurpose: "",
        poNumber: "",
        realisasiPoNumber: "",
        projectDurationCount: "",
        projectDurationUnit: "hari",
        realisasiProjectDurationCount: "",
        realisasiProjectDurationUnit: "hari",
        projectDuration: "",
        realisasiProjectDuration: "",
        submissionStartDate: "",
        submissionEndDate: "",
        realisasiSubmissionStartDate: "",
        realisasiSubmissionEndDate: "",
        submissionPeriod: "",
        realisasiSubmissionPeriod: "",
        installerName: "",
        realisasiInstallerName: "",
        salesName: "",
        realisasiSalesName: "",
        preparedBy: "",
        checkedBy: "",
        preparedSign: "",
        checkedSign: "",
        approvedSign: "",
        realisasiDocDateManualEdit: false,
        realisasiInfoManualEdit: {},
        realisasiManualEdit: false,
        realisasiBaseCosts: [],
        advanceCosts: [],
        realisasiCosts: []
    };
}

function formatDateIndo(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString + "T00:00:00");
    if (Number.isNaN(d.getTime())) return dateString;
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatNumber(value) {
    if (value === "" || value === null || value === undefined) return "";
    const num = toNumber(value);
    if (num === null || Number.isNaN(num)) return "";
    return new Intl.NumberFormat("id-ID").format(num);
}

function formatUsd(value) {
    const formatted = formatNumber(value);
    return formatted ? `$ ${formatted}` : "";
}

function formatDisplayText(value, mode = DISPLAY_CASE.raw) {
    const text = String(value ?? "");
    if (!text) return "";

    if (mode === DISPLAY_CASE.upper) {
        return text.toLocaleUpperCase("id-ID");
    }

    if (mode !== DISPLAY_CASE.proper) {
        return text;
    }

    return text.replace(/\S+/gu, token => formatProperCaseToken(token));
}

function formatSubmissionPeriodDisplayText(value) {
    return formatDisplayText(value, DISPLAY_CASE.proper)
        .replace(/\bS\/D\b/gu, "s/d");
}

function formatProperCaseToken(token) {
    if (!/\p{L}/u.test(token)) return token;

    return token.replace(/\p{L}[\p{L}\p{M}'’]*/gu, word => formatProperCaseWord(word));
}

function formatProperCaseWord(word) {
    if (isUppercaseWord(word)) {
        return word;
    }

    return word
        .toLocaleLowerCase("id-ID")
        .replace(/(^|['’])\p{L}/gu, match => match.toLocaleUpperCase("id-ID"));
}

function isUppercaseWord(word) {
    return /\p{Lu}/u.test(word) && !/\p{Ll}/u.test(word);
}

function formatInputThousands(value) {
    const normalized = String(value ?? "").replace(/[^\d]/g, "");
    if (!normalized) return "";
    return new Intl.NumberFormat("id-ID").format(Number(normalized));
}

function setFormattedAmountValue(input) {
    if (!input) return;
    const rawDigits = String(input.value ?? "").replace(/[^\d]/g, "");
    input.value = rawDigits ? formatInputThousands(rawDigits) : "";
}

function hasCurrencyValue(costs = [], field = "usd") {
    return costs.some(row => row?.[field] !== "" && row?.[field] !== null && row?.[field] !== undefined);
}

function parseMaybeNumber(value) {
    const num = toNumber(value);
    return num === null ? "" : num;
}

function toNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value === "number") {
        return Number.isNaN(value) ? null : value;
    }

    const normalized = String(value).trim().replace(/\s+/g, "");
    if (!normalized) return null;

    const hasComma = normalized.includes(",");
    const hasDot = normalized.includes(".");

    let sanitized = normalized;
    if (hasComma && hasDot) {
        const lastComma = normalized.lastIndexOf(",");
        const lastDot = normalized.lastIndexOf(".");
        const decimalSeparator = lastComma > lastDot ? "," : ".";
        const thousandsSeparator = decimalSeparator === "," ? "." : ",";

        sanitized = normalized.split(thousandsSeparator).join("");
        if (decimalSeparator === ",") {
            sanitized = sanitized.replace(",", ".");
        }
    } else if (hasComma) {
        sanitized = /,\d{3}$/.test(normalized)
            ? normalized.replace(/,/g, "")
            : normalized.replace(",", ".");
    } else if (hasDot) {
        sanitized = /\.\d{3}$/.test(normalized)
            ? normalized.replace(/\./g, "")
            : normalized;
    }

    const num = Number(sanitized);
    return Number.isNaN(num) ? null : num;
}

function getCostKey(docType = getActiveDocType()) {
    return docType === "realisasi" ? "realisasiCosts" : "advanceCosts";
}

function getCosts(docType = getActiveDocType()) {
    const key = getCostKey(docType);
    if (!Array.isArray(state[key])) {
        state[key] = [];
    }
    return state[key];
}

function calcCostTotals(costs = []) {
    return costs.reduce((totals, row) => {
        totals.rp += toNumber(row?.rp) ?? 0;
        totals.usd += toNumber(row?.usd) ?? 0;
        return totals;
    }, { rp: 0, usd: 0 });
}

function getAdvanceTotals() {
    return calcCostTotals(getCosts("ump"));
}

function getRealisasiTotals() {
    return calcCostTotals(getCosts("realisasi"));
}

function calcGrandTotal(docType = getActiveDocType()) {
    return calcCostTotals(getCosts(docType)).rp;
}

function calcGrandTotalUsd(docType = getActiveDocType()) {
    return calcCostTotals(getCosts(docType)).usd;
}

function getDifferenceTotals() {
    const receiptTotals = getAdvanceTotals();
    const expenseTotals = getRealisasiTotals();
    return {
        rp: receiptTotals.rp - expenseTotals.rp,
        usd: receiptTotals.usd - expenseTotals.usd
    };
}

function calcDifferenceRp() {
    return getDifferenceTotals().rp;
}

function calcDifferenceUsd() {
    return getDifferenceTotals().usd;
}

function normalizeRealisasiInfoState(parsed = {}) {
    const parsedManualMap = parsed.realisasiInfoManualEdit && typeof parsed.realisasiInfoManualEdit === "object"
        ? parsed.realisasiInfoManualEdit
        : {};
    const nextManualMap = {};

    REALISASI_INFO_FIELDS.forEach(({ baseKey, realisasiKey }) => {
        const baseValue = state[baseKey] ?? "";
        const hasRealisasiValue = hasOwnValue(parsed, realisasiKey);
        const storedManual = parsedManualMap[baseKey];

        if (!hasRealisasiValue) {
            state[realisasiKey] = baseValue;
            nextManualMap[baseKey] = false;
            return;
        }

        const isManual = typeof storedManual === "boolean"
            ? storedManual
            : (state[realisasiKey] ?? "") !== baseValue;

        nextManualMap[baseKey] = isManual;
        if (!isManual) {
            state[realisasiKey] = baseValue;
        }
    });

    state.realisasiInfoManualEdit = nextManualMap;
}

function applyStoredState(parsed = {}) {
    state = { ...clone(defaultState), ...parsed };
    normalizeRealisasiInfoState(parsed);
    const legacyCosts = Array.isArray(parsed.costs) ? normalizeCostRows(parsed.costs, defaultCostRows) : null;
    const hasRealisasiBaseCosts = Array.isArray(parsed.realisasiBaseCosts);
    state.advanceCosts = normalizeCostRows(parsed.advanceCosts ?? legacyCosts, defaultCostRows);
    state.realisasiBaseCosts = normalizeCostRows(
        parsed.realisasiBaseCosts ?? state.advanceCosts,
        state.advanceCosts,
        state.advanceCosts
    );
    state.realisasiCosts = normalizeCostRows(
        parsed.realisasiCosts ?? legacyCosts,
        state.advanceCosts,
        state.realisasiBaseCosts
    );
    if (!hasRealisasiBaseCosts) {
        state.realisasiManualEdit = false;
    } else if (typeof parsed.realisasiManualEdit === "boolean") {
        state.realisasiManualEdit = parsed.realisasiManualEdit;
    } else {
        state.realisasiManualEdit = !areCostRowsEqual(state.realisasiCosts, state.realisasiBaseCosts);
    }
    if (typeof parsed.realisasiDocDateManualEdit === "boolean") {
        state.realisasiDocDateManualEdit = parsed.realisasiDocDateManualEdit;
    } else {
        state.realisasiDocDateManualEdit = Boolean(state.realisasiDocDate && state.realisasiDocDate !== state.docDate);
    }
    if (!state.realisasiDocDateManualEdit && state.docDate) {
        state.realisasiDocDate = state.docDate;
    }
    syncRealisasiCostsFromAdvance({ force: !state.realisasiManualEdit });
    delete state.costs;
    delete state.receiptRp;
    delete state.receiptUsd;
    delete state.totalExpenseRp;
    delete state.totalExpenseUsd;
    delete state.showRealisasiSummary;
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return { ok: true };
    } catch (error) {
        console.error("Gagal menyimpan draft.", error);
        return {
            ok: false,
            message: "Draft tidak bisa disimpan. Ukuran data terlalu besar atau penyimpanan browser sedang penuh."
        };
    }
}

function loadState(options = {}) {
    const { fallbackToDefault = true } = options;
    let raw = null;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        console.error("Gagal membaca draft.", error);
        if (fallbackToDefault) {
            state = clone(defaultState);
        }
        return {
            ok: false,
            loaded: false,
            message: "Draft tidak bisa dibaca dari browser."
        };
    }

    if (!raw) {
        if (fallbackToDefault) {
            state = clone(defaultState);
        }
        return {
            ok: false,
            loaded: false,
            message: "Belum ada draft tersimpan di browser."
        };
    }

    try {
        const parsed = JSON.parse(raw);
        applyStoredState(parsed);
        return { ok: true, loaded: true };
    } catch (error) {
        console.error("Draft tersimpan tidak bisa dibaca.", error);
        if (fallbackToDefault) {
            state = clone(defaultState);
        }
        return {
            ok: false,
            loaded: false,
            message: "Draft tersimpan rusak atau tidak sesuai format."
        };
    }
}

function renderCurrentState() {
    fillStaticFields();
    renderAllCostEditors();
    renderPreview();
}

function createDraftId() {
    return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function cleanDraftLabel(value, fallback) {
    const label = String(value ?? "").trim();
    return label || fallback;
}

function formatPoLabel(value) {
    const poNumber = String(value ?? "").trim();
    if (!poNumber) return "";
    return /^po\b/i.test(poNumber) ? poNumber : `PO ${poNumber}`;
}

function formatDraftPoLabel(value) {
    return formatDisplayText(formatPoLabel(value), DISPLAY_CASE.proper);
}

function getDraftTitleParts(draftState = state) {
    return [
        draftState.docDate ? formatDateIndo(draftState.docDate) : "",
        formatDisplayText(draftState.destination, DISPLAY_CASE.proper),
        formatDisplayText(draftState.purpose, DISPLAY_CASE.proper),
        formatDraftPoLabel(draftState.poNumber)
    ].map(value => String(value ?? "").trim()).filter(Boolean);
}

function createAutoDraftTitle(savedAt = new Date()) {
    const parts = getDraftTitleParts();

    if (parts.length) {
        return parts.join(" | ");
    }

    return `Draft ${formatDraftUpdatedAt(savedAt.toISOString())}`;
}

function createAutoProjectName() {
    return cleanDraftLabel(
        formatDisplayText(state.destination, DISPLAY_CASE.proper)
        || formatDisplayText(state.purpose, DISPLAY_CASE.proper)
        || formatDraftPoLabel(state.poNumber),
        "Draft lokal"
    );
}

function normalizeDraftEntry(entry) {
    const now = new Date().toISOString();
    return {
        id: cleanDraftLabel(entry?.id, createDraftId()),
        projectName: cleanDraftLabel(entry?.projectName, "Draft lokal"),
        documentName: cleanDraftLabel(entry?.documentName, ""),
        createdAt: cleanDraftLabel(entry?.createdAt, entry?.updatedAt || now),
        updatedAt: cleanDraftLabel(entry?.updatedAt, entry?.createdAt || now),
        state: entry?.state && typeof entry.state === "object" ? entry.state : clone(defaultState)
    };
}

function readDraftEntries() {
    try {
        const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
        if (!raw) {
            return { ok: true, drafts: [] };
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return {
                ok: false,
                drafts: [],
                message: "Daftar draft tersimpan rusak atau tidak sesuai format."
            };
        }

        return {
            ok: true,
            drafts: parsed.map(normalizeDraftEntry)
        };
    } catch (error) {
        console.error("Gagal membaca daftar draft.", error);
        return {
            ok: false,
            drafts: [],
            message: "Daftar draft tidak bisa dibaca dari browser."
        };
    }
}

function writeDraftEntries(drafts) {
    try {
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
        return { ok: true };
    } catch (error) {
        console.error("Gagal menyimpan daftar draft.", error);
        return {
            ok: false,
            message: "Draft tidak bisa disimpan. Ukuran data terlalu besar atau penyimpanan browser sedang penuh."
        };
    }
}

function saveDraftToCollection() {
    const result = readDraftEntries();
    if (!result.ok) return result;

    const drafts = result.drafts;
    const savedAt = new Date();
    const now = savedAt.toISOString();
    const autoTitle = createAutoDraftTitle(savedAt);
    const nextDraft = {
        id: createDraftId(),
        projectName: createAutoProjectName(),
        documentName: autoTitle,
        createdAt: now,
        updatedAt: now,
        state: clone(state)
    };

    const nextDrafts = [nextDraft, ...drafts];
    const writeResult = writeDraftEntries(nextDrafts);
    if (!writeResult.ok) return writeResult;

    saveState();
    return {
        ok: true,
        draft: nextDraft,
        message: "Dokumen berhasil tersimpan."
    };
}

function loadDraftFromCollection(id) {
    const result = readDraftEntries();
    if (!result.ok) return result;

    const draft = result.drafts.find(item => item.id === id);
    if (!draft) {
        return {
            ok: false,
            loaded: false,
            message: "Draft tidak ditemukan."
        };
    }

    applyStoredState(draft.state);
    saveState();
    return { ok: true, loaded: true, draft };
}

function deleteDraftFromCollection(id) {
    const result = readDraftEntries();
    if (!result.ok) return result;

    const nextDrafts = result.drafts.filter(draft => draft.id !== id);
    if (nextDrafts.length === result.drafts.length) {
        return {
            ok: false,
            message: "Draft tidak ditemukan."
        };
    }

    return writeDraftEntries(nextDrafts);
}

function formatDraftUpdatedAt(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function getDraftDetailLine(draft) {
    const details = getDraftTitleParts(draft.state || {});

    return details.length ? details.join(" | ") : "Belum ada detail dokumen";
}

function getDraftTotalsLine(draft) {
    const draftState = draft.state || {};
    const advanceRows = normalizeCostRows(draftState.advanceCosts ?? draftState.costs, []);
    const realisasiRows = normalizeCostRows(draftState.realisasiCosts, []);
    const advanceTotals = calcCostTotals(advanceRows);
    const realisasiTotals = calcCostTotals(realisasiRows);

    return [
        `UMP Rp ${formatNumber(advanceTotals.rp) || "0"}`,
        `Realisasi Rp ${formatNumber(realisasiTotals.rp) || "0"}`
    ].join(" - ");
}

function getDraftTitle(draft) {
    if (draft.documentName) {
        return draft.documentName;
    }

    const detailLine = getDraftDetailLine(draft);
    if (detailLine !== "Belum ada detail dokumen") {
        return detailLine;
    }

    const updatedAt = formatDraftUpdatedAt(draft.updatedAt);
    return updatedAt ? `Disimpan ${updatedAt}` : "Draft tersimpan";
}

function renderDraftList() {
    const listEl = document.getElementById("draftListBody");
    if (!listEl) return;

    const result = readDraftEntries();
    if (!result.ok) {
        listEl.innerHTML = `<div class="empty-draft-state">${escapeHtml(result.message)}</div>`;
        return;
    }

    const drafts = [...result.drafts].sort((left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );

    if (!drafts.length) {
        listEl.innerHTML = `<div class="empty-draft-state">Belum ada dokumen tersimpan.</div>`;
        return;
    }

    listEl.innerHTML = drafts.map(draft => `
        <div class="draft-item">
            <div class="draft-item-main">
                <div class="draft-item-title">${escapeHtml(getDraftTitle(draft))}</div>
                <div class="draft-item-meta">Disimpan ${escapeHtml(formatDraftUpdatedAt(draft.updatedAt))}</div>
                <div class="draft-item-meta">${escapeHtml(getDraftTotalsLine(draft))}</div>
            </div>
            <div class="draft-item-actions">
                <button class="mini-btn" type="button" data-load-draft-id="${escapeAttr(draft.id)}">Muat</button>
                <button class="mini-btn danger-btn" type="button" data-delete-draft-id="${escapeAttr(draft.id)}">Hapus</button>
            </div>
        </div>
    `).join("");
}

function openDraftModal() {
    const modal = document.getElementById("draftModal");
    if (!modal) return;
    renderDraftList();
    modal.hidden = false;
    document.body.classList.add("draft-modal-open");
    document.getElementById("draftModalCloseBtn")?.focus();
}

function closeDraftModal() {
    const modal = document.getElementById("draftModal");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("draft-modal-open");
}

function openAboutModal() {
    const modal = document.getElementById("aboutModal");
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("about-modal-open");
    document.getElementById("aboutModalCloseBtn")?.focus();
}

function closeAboutModal() {
    const modal = document.getElementById("aboutModal");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("about-modal-open");
}

function getToastIcon(type) {
    if (type === "success") return "bi-check-circle-fill";
    if (type === "error" || type === "danger") return "bi-exclamation-circle-fill";
    if (type === "warning") return "bi-exclamation-triangle-fill";
    return "bi-info-circle-fill";
}

function showToast(message, options = {}) {
    const region = document.getElementById("toastRegion");
    if (!region) return;

    const { type = "info", duration = 3200 } = options;
    const toast = document.createElement("div");
    toast.className = `app-toast app-toast-${type}`;
    toast.setAttribute("role", type === "error" || type === "danger" ? "alert" : "status");

    const icon = document.createElement("i");
    icon.className = `bi ${getToastIcon(type)}`;

    const text = document.createElement("div");
    text.className = "app-toast-message";
    text.textContent = message;

    toast.append(icon, text);
    region.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    window.setTimeout(() => {
        toast.classList.remove("show");
        window.setTimeout(() => toast.remove(), 220);
    }, duration);
}

const confirmDialogState = {
    resolve: null,
    lastFocused: null
};

function closeConfirmDialog(confirmed) {
    const dialog = document.getElementById("confirmDialog");
    if (!dialog || dialog.hidden) return;

    dialog.hidden = true;
    document.body.classList.remove("confirm-dialog-open");

    const resolve = confirmDialogState.resolve;
    const lastFocused = confirmDialogState.lastFocused;
    confirmDialogState.resolve = null;
    confirmDialogState.lastFocused = null;

    if (lastFocused instanceof HTMLElement) {
        lastFocused.focus();
    }

    resolve?.(confirmed);
}

function showConfirmDialog(options = {}) {
    const dialog = document.getElementById("confirmDialog");
    const panel = dialog?.querySelector(".confirm-dialog-panel");
    const title = document.getElementById("confirmDialogTitle");
    const message = document.getElementById("confirmDialogMessage");
    const icon = document.getElementById("confirmDialogIcon");
    const cancelButton = document.getElementById("confirmCancelBtn");
    const acceptButton = document.getElementById("confirmAcceptBtn");

    if (!dialog || !panel || !title || !message || !icon || !cancelButton || !acceptButton) {
        return Promise.resolve(false);
    }

    if (confirmDialogState.resolve) {
        closeConfirmDialog(false);
    }

    const {
        title: nextTitle = "Konfirmasi",
        message: nextMessage = "Lanjutkan tindakan ini?",
        confirmLabel = "Lanjutkan",
        cancelLabel = "Batal",
        tone = "warning",
        icon: iconName = tone === "danger" ? "bi-exclamation-triangle-fill" : "bi-question-circle-fill"
    } = options;

    title.textContent = nextTitle;
    message.textContent = nextMessage;
    cancelButton.textContent = cancelLabel;
    acceptButton.textContent = confirmLabel;
    icon.className = `bi ${iconName}`;
    panel.classList.toggle("danger", tone === "danger");
    acceptButton.classList.toggle("danger-btn", tone === "danger");

    confirmDialogState.lastFocused = document.activeElement;
    dialog.hidden = false;
    document.body.classList.add("confirm-dialog-open");

    return new Promise(resolve => {
        confirmDialogState.resolve = resolve;
        requestAnimationFrame(() => cancelButton.focus());
    });
}

function bindDraftModalEvents() {
    const modal = document.getElementById("draftModal");
    const listEl = document.getElementById("draftListBody");
    if (!modal || !listEl || modal.dataset.bound === "true") return;
    modal.dataset.bound = "true";

    document.getElementById("draftModalCloseBtn")?.addEventListener("click", closeDraftModal);
    document.getElementById("draftModalBackdrop")?.addEventListener("click", closeDraftModal);

    listEl.addEventListener("click", async event => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const loadButton = target.closest("[data-load-draft-id]");
        const deleteButton = target.closest("[data-delete-draft-id]");

        if (loadButton) {
            const result = loadDraftFromCollection(loadButton.dataset.loadDraftId);
            if (result.loaded) {
                renderCurrentState();
                closeDraftModal();
            }
            showToast(
                result.loaded ? "Draft berhasil dimuat dari browser." : result.message,
                { type: result.loaded ? "success" : "error" }
            );
            return;
        }

        if (deleteButton) {
            const ok = await showConfirmDialog({
                title: "Hapus Draft?",
                message: "Draft ini akan dihapus dari browser ini dan tidak bisa dikembalikan.",
                confirmLabel: "Hapus",
                tone: "danger"
            });
            if (!ok) return;
            const result = deleteDraftFromCollection(deleteButton.dataset.deleteDraftId);
            if (!result.ok) {
                showToast(result.message, { type: "error" });
                return;
            }
            renderDraftList();
            showToast("Draft berhasil dihapus.", { type: "success" });
        }
    });

    document.addEventListener("keydown", event => {
        const confirmDialog = document.getElementById("confirmDialog");
        const confirmOpen = confirmDialog && !confirmDialog.hidden;
        if (event.key === "Escape" && !modal.hidden && !confirmOpen) {
            closeDraftModal();
        }
    });
}

function bindAboutModalEvents() {
    const modal = document.getElementById("aboutModal");
    if (!modal || modal.dataset.bound === "true") return;
    modal.dataset.bound = "true";

    document.getElementById("aboutBtn")?.addEventListener("click", openAboutModal);
    document.getElementById("aboutModalCloseBtn")?.addEventListener("click", closeAboutModal);
    document.getElementById("aboutModalBackdrop")?.addEventListener("click", closeAboutModal);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) {
            closeAboutModal();
        }
    });
}

function bindConfirmDialogEvents() {
    const dialog = document.getElementById("confirmDialog");
    if (!dialog || dialog.dataset.bound === "true") return;
    dialog.dataset.bound = "true";

    document.getElementById("confirmCancelBtn")?.addEventListener("click", () => closeConfirmDialog(false));
    document.getElementById("confirmDialogBackdrop")?.addEventListener("click", () => closeConfirmDialog(false));
    document.getElementById("confirmAcceptBtn")?.addEventListener("click", () => closeConfirmDialog(true));

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !dialog.hidden) {
            closeConfirmDialog(false);
        }
    });
}

function clearLegacyState() {
    try {
        LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    } catch {
    }
}

function applyTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
        localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
    }
    updateThemeToggleButton();
}

function updateThemeToggleButton() {
    const btn = document.getElementById("themeToggleBtn");
    if (!btn) return;

    const nextTheme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const mobile = isMobileActionMenuLayout();
    const icon = nextTheme === "dark" ? "bi-moon-stars-fill" : "bi-sun-fill";
    const label = mobile
        ? (nextTheme === "dark" ? "Dark Mode" : "Light Mode")
        : (nextTheme === "dark" ? "Dark" : "Light");

    btn.innerHTML = `<i class="bi ${icon}"></i><span>${label}</span>`;
}

function initTheme() {
    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem(THEME_KEY);
    } catch {
        savedTheme = null;
    }
    applyTheme(savedTheme === "light" ? "light" : "dark");
}

function fillStaticFields() {
    document.querySelectorAll(".sync-field").forEach(el => {
        const key = el.dataset.key;
        if (!key) return;
        el.value = state[key] ?? "";
    });

    syncProjectDurationDisplay();
    syncSubmissionPeriodDisplay();
    document.querySelectorAll(".sync-checkbox").forEach(el => {
        const key = el.dataset.key;
        if (!key) return;
        el.checked = Boolean(state[key]);
    });

    syncRealisasiSummaryValues();
    updateMiniSignaturePreview("preparedSign", state.preparedSign);
    updateMiniSignaturePreview("checkedSign", state.checkedSign);
    updateMiniSignaturePreview("approvedSign", state.approvedSign);
}

function syncMatchingFields(sourceEl) {
    const key = sourceEl.dataset.key;
    if (!key) return;

    document.querySelectorAll(".sync-field").forEach(el => {
        if (el !== sourceEl && el.dataset.key === key) {
            el.value = state[key] ?? "";
        }
    });

    document.querySelectorAll(".sync-checkbox").forEach(el => {
        if (el !== sourceEl && el.dataset.key === key) {
            el.checked = Boolean(state[key]);
        }
    });
}

function syncRealisasiDateDefault(changedKey) {
    if (changedKey === "realisasiDocDate") {
        state.realisasiDocDateManualEdit = true;
        return;
    }

    if (changedKey !== "docDate" || state.realisasiDocDateManualEdit) {
        return;
    }

    state.realisasiDocDate = state.docDate;
    document.querySelectorAll('.sync-field[data-key="realisasiDocDate"]').forEach(el => {
        el.value = state.realisasiDocDate ?? "";
    });
}

function syncRealisasiInfoDefault(changedKey) {
    const realisasiPair = getRealisasiInfoPairByKey(changedKey);
    const manualMap = getRealisasiManualMap();

    if (realisasiPair) {
        manualMap[realisasiPair.baseKey] = true;
        return;
    }

    const basePair = getRealisasiInfoPairByBase(changedKey);
    if (!basePair || manualMap[basePair.baseKey]) return;

    state[basePair.realisasiKey] = state[basePair.baseKey] ?? "";
    updateSyncFieldValue(basePair.realisasiKey, state[basePair.realisasiKey]);
}

function bindStaticFields() {
    document.querySelectorAll(".sync-field").forEach(el => {
        const handleSync = () => {
            const key = el.dataset.key;
            state[key] = el.value;
            syncRealisasiDateDefault(key);
            syncRealisasiInfoDefault(key);
            syncProjectDurationDisplay();
            syncSubmissionPeriodDisplay();
            syncMatchingFields(el);
            renderPreview();
        };

        el.addEventListener("input", handleSync);
        el.addEventListener("change", handleSync);
    });

    document.querySelectorAll(".sync-checkbox").forEach(el => {
        el.addEventListener("change", () => {
            state[el.dataset.key] = el.checked;
            syncMatchingFields(el);
            renderPreview();
        });
    });
}

function setSummaryValue(id, value, options = {}) {
    const el = document.getElementById(id);
    if (!el) return;

    const hasValue = value !== "" && value !== null && value !== undefined;
    const numericValue = hasValue ? toNumber(value) : null;
    const formatted = hasValue ? formatNumber(value) : "-";
    el.textContent = formatted;

    if (options.tone) {
        el.classList.toggle("is-negative", numericValue !== null && numericValue < 0);
        el.classList.toggle("is-positive", numericValue !== null && numericValue > 0);
    }
}

function getSummaryValueFontSize(text) {
    const length = String(text || "").replace(/\s+/g, "").length;
    if (!length) return "0.9rem";
    if (length <= 6) return "0.95rem";
    if (length <= 8) return "0.88rem";
    if (length <= 10) return "0.8rem";
    if (length <= 12) return "0.73rem";
    if (length <= 14) return "0.68rem";
    return "0.64rem";
}

function syncSummaryValueFontSizes() {
    const ids = [
        "receiptRpValue",
        "totalExpenseRpValue",
        "differenceRpValue",
        "receiptUsdValue",
        "totalExpenseUsdValue",
        "differenceUsdValue"
    ];
    const values = ids
        .map(id => document.getElementById(id)?.textContent || "")
        .filter(value => value && value !== "-");
    const longest = values.reduce((current, value) => (
        String(value).replace(/\s+/g, "").length > String(current).replace(/\s+/g, "").length ? value : current
    ), values[0] || "-");
    const fontSize = getSummaryValueFontSize(longest);

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.setProperty("--summary-font-size", fontSize);
        }
    });
}

function syncRealisasiSummaryValues() {
    const advanceCosts = getCosts("ump");
    const realisasiCosts = getCosts("realisasi");
    const receiptTotals = getAdvanceTotals();
    const expenseTotals = getRealisasiTotals();
    const differenceTotals = getDifferenceTotals();
    const receiptHasUsd = hasCurrencyValue(advanceCosts, "usd");
    const expenseHasUsd = hasCurrencyValue(realisasiCosts, "usd");
    const differenceHasUsd = receiptHasUsd || expenseHasUsd;
    const hasUsdSummary = differenceHasUsd;

    const values = {
        receiptRpValue: { value: receiptTotals.rp },
        receiptUsdValue: { value: receiptHasUsd ? receiptTotals.usd : "" },
        totalExpenseRpValue: { value: expenseTotals.rp },
        totalExpenseUsdValue: { value: expenseHasUsd ? expenseTotals.usd : "" },
        differenceRpValue: { value: differenceTotals.rp, tone: true },
        differenceUsdValue: { value: differenceHasUsd ? differenceTotals.usd : "", tone: true }
    };

    Object.entries(values).forEach(([id, options]) => {
        setSummaryValue(id, options.value, { tone: options.tone });
    });

    syncSummaryValueFontSizes();

    const summaryCard = document.getElementById("summaryRealisasiCard");
    summaryCard?.classList.toggle("has-usd", hasUsdSummary);
}

function syncCostSectionTotal(docType) {
    const prefix = docType === "realisasi" ? "realisasi" : "ump";
    const costs = getCosts(docType);
    const totals = calcCostTotals(costs);
    const hasUsd = hasCurrencyValue(costs, "usd");
    const rpEl = document.getElementById(`${prefix}TotalBiayaRp`);
    const usdEl = document.getElementById(`${prefix}TotalBiayaUsd`);

    if (rpEl) {
        rpEl.textContent = `Rp ${formatNumber(totals.rp) || "0"}`;
    }

    if (usdEl) {
        usdEl.textContent = formatUsd(totals.usd) || "$ 0";
        usdEl.hidden = !hasUsd;
    }
}

function syncCostSectionTotals() {
    syncCostSectionTotal("ump");
    syncCostSectionTotal("realisasi");
}

function getCostEditorBodyId(docType) {
    return docType === "realisasi" ? "realisasiCostEditorBody" : "costEditorBody";
}

function getCostCollapseButtonId(docType) {
    return docType === "realisasi" ? "toggleRealisasiCostRowsBtn" : "toggleCostRowsBtn";
}

function updateCostCollapseState(docType) {
    const tbody = document.getElementById(getCostEditorBodyId(docType));
    const button = document.getElementById(getCostCollapseButtonId(docType));
    const wrap = tbody?.closest(".cost-editor-wrap");
    const costs = getCosts(docType);
    const section = wrap?.closest(".cost-section");

    if (!button || !wrap) return;

    button.hidden = false;
    const collapsed = costEditorCollapsed[docType];
    section?.classList.toggle("cost-collapsed", collapsed);
    wrap.classList.toggle("cost-collapsed", collapsed);
    button.setAttribute("aria-expanded", String(!collapsed));
    button.innerHTML = collapsed
        ? `<i class="bi bi-chevron-down"></i><span>Lihat rincian (${costs.length})</span>`
        : `<i class="bi bi-chevron-up"></i><span>Sembunyikan</span>`;
}

function toggleCostEditorCollapse(docType) {
    costEditorCollapsed[docType] = !costEditorCollapsed[docType];
    updateCostCollapseState(docType);
}

function getCostRowTitle(row, index) {
    const description = String(row.description || "").trim();
    return description || `Biaya ${index + 1}`;
}

function getCostRowRpLabel(row) {
    return row.rp === "" ? "Rp -" : `Rp ${formatNumber(row.rp)}`;
}

function getCostRowUsdLabel(row) {
    return row.usd === "" ? "" : formatUsd(row.usd);
}

function isDesktopViewport() {
    return window.matchMedia("(min-width: 1024px)").matches;
}

function markRecentCostRowMove(docType, rowId) {
    recentCostRowMove = {
        docType,
        rowId,
        at: Date.now()
    };
}

function getRecentCostRowMoveClass(docType, rowId) {
    if (!isDesktopViewport() || !recentCostRowMove) return "";
    if (recentCostRowMove.docType !== docType || recentCostRowMove.rowId !== rowId) return "";
    if ((Date.now() - recentCostRowMove.at) > COST_ROW_MOVE_FEEDBACK_MS) return "";
    return "cost-row-moved";
}

function captureCostRowPositions(docType) {
    if (!isDesktopViewport()) return null;
    const tbody = document.getElementById(getCostEditorBodyId(docType));
    if (!tbody) return null;
    const positions = new Map();
    tbody.querySelectorAll("tr[data-cost-row-id]").forEach(rowEl => {
        positions.set(rowEl.dataset.costRowId, rowEl.getBoundingClientRect().top);
    });
    return positions;
}

function animateCostRowReorder(docType, previousPositions) {
    if (!isDesktopViewport() || !previousPositions?.size) return;
    const tbody = document.getElementById(getCostEditorBodyId(docType));
    if (!tbody) return;

    requestAnimationFrame(() => {
        tbody.querySelectorAll("tr[data-cost-row-id]").forEach(rowEl => {
            const previousTop = previousPositions.get(rowEl.dataset.costRowId);
            if (previousTop === undefined) return;

            const deltaY = previousTop - rowEl.getBoundingClientRect().top;
            if (Math.abs(deltaY) < 1) return;

            Array.from(rowEl.cells)
                .filter(cell => !cell.classList.contains("mobile-cost-card-cell"))
                .forEach(cell => {
                    cell.animate(
                        [
                            {
                                transform: `translateY(${deltaY}px)`
                            },
                            {
                                transform: "translateY(0)"
                            }
                        ],
                        {
                            duration: COST_ROW_MOVE_ANIMATION_MS,
                            easing: "cubic-bezier(0.22, 1, 0.36, 1)"
                        }
                    );
                });
        });
    });
}

function renderCostEditor(docType) {
    const tbody = document.getElementById(getCostEditorBodyId(docType));
    const costs = getCosts(docType);
    if (!tbody) return;
    tbody.innerHTML = "";

    costs.forEach((row, index) => {
        const isFirstRow = index === 0;
        const isLastRow = index === costs.length - 1;
        const rowId = getCostRowId(row);
        const tr = document.createElement("tr");
        const moveFeedbackClass = getRecentCostRowMoveClass(docType, rowId);
        tr.dataset.costRowId = rowId;
        if (moveFeedbackClass) {
            tr.className = moveFeedbackClass;
        }
        tr.innerHTML = `
          <td class="mobile-cost-card-cell" colspan="5">
            <div class="mobile-cost-card">
              <button class="mobile-cost-edit-btn" type="button" data-cost-doc="${docType}" data-row-index="${index}">
                <span class="mobile-cost-type">${row.type === "sub" ? "Sub" : "Item"}</span>
                <span class="mobile-cost-main">
                  <span class="mobile-cost-title">${escapeHtml(getCostRowTitle(row, index))}</span>
                  <span class="mobile-cost-amounts">
                    <span>${escapeHtml(getCostRowRpLabel(row))}</span>
                    ${getCostRowUsdLabel(row) ? `<span>${escapeHtml(getCostRowUsdLabel(row))}</span>` : ""}
                  </span>
                </span>
                <i class="bi bi-chevron-right"></i>
              </button>
              <button class="mini-btn delete-row-btn mobile-cost-delete-btn" type="button" data-cost-doc="${docType}" data-row-index="${index}" aria-label="Hapus biaya ${index + 1}">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </td>
          <td class="cost-type-cell" data-label="Tipe">
            <select class="form-select row-type-badge" data-cost-doc="${docType}" data-row-index="${index}" data-row-field="type">
              <option value="item" ${row.type === "item" ? "selected" : ""}>Item</option>
              <option value="sub" ${row.type === "sub" ? "selected" : ""}>Sub-item</option>
            </select>
          </td>
          <td class="cost-description-cell" data-label="Deskripsi">
            <input type="text" class="form-control" data-cost-doc="${docType}" data-row-index="${index}" data-row-field="description" value="${escapeAttr(row.description)}" placeholder="Deskripsi biaya">
          </td>
          <td class="cost-rp-cell" data-label="Rp">
            <input type="text" inputmode="numeric" class="form-control" data-cost-doc="${docType}" data-row-index="${index}" data-row-field="rp" value="${row.rp === "" ? "" : formatInputThousands(row.rp)}" placeholder="0">
          </td>
          <td class="cost-usd-cell" data-label="USD">
            <input type="text" inputmode="numeric" class="form-control" data-cost-doc="${docType}" data-row-index="${index}" data-row-field="usd" value="${row.usd === "" ? "" : formatInputThousands(row.usd)}" placeholder="">
          </td>
          <td class="text-center cost-row-actions-cell" data-label="Aksi">
            <div class="cost-row-actions">
              <button class="mini-btn cost-row-action-btn move-row-btn" type="button" data-cost-doc="${docType}" data-row-index="${index}" data-row-move="up" aria-label="Pindahkan biaya ${index + 1} ke atas" ${isFirstRow ? "disabled" : ""}>
                <i class="bi bi-arrow-up-short"></i>
              </button>
              <button class="mini-btn cost-row-action-btn move-row-btn" type="button" data-cost-doc="${docType}" data-row-index="${index}" data-row-move="down" aria-label="Pindahkan biaya ${index + 1} ke bawah" ${isLastRow ? "disabled" : ""}>
                <i class="bi bi-arrow-down-short"></i>
              </button>
              <button class="mini-btn cost-row-action-btn delete-row-btn danger-btn" type="button" data-cost-doc="${docType}" data-row-index="${index}" aria-label="Hapus biaya ${index + 1}">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
    });

    updateCostCollapseState(docType);
}

function renderAllCostEditors() {
    renderCostEditor("ump");
    renderCostEditor("realisasi");
    bindCostEditorEvents();
}

function updateCostRowField(fieldEl) {
    const docType = fieldEl.dataset.costDoc;
    const idx = Number(fieldEl.dataset.rowIndex);
    const field = fieldEl.dataset.rowField;
    const costs = getCosts(docType);
    if (!costs[idx]) return;

    if (docType === "realisasi") {
        state.realisasiManualEdit = true;
    }

    if (field === "rp" || field === "usd") {
        costs[idx][field] = parseMaybeNumber(fieldEl.value);
    } else {
        costs[idx][field] = fieldEl.value;
    }

    if (docType === "ump" && syncRealisasiCostsFromAdvance()) {
        renderCostEditor("realisasi");
    }

    renderPreview();
}

function deleteCostRowByIndex(docType, idx) {
    if (docType === "realisasi") {
        state.realisasiManualEdit = true;
    }

    getCosts(docType).splice(idx, 1);

    if (docType === "ump") {
        syncRealisasiCostsFromAdvance();
    }

    renderAllCostEditors();
    renderPreview();
}

function moveCostRow(docType, idx, direction) {
    const costs = getCosts(docType);
    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    if (!costs[idx] || !costs[nextIdx]) return;
    const previousPositions = captureCostRowPositions(docType);

    if (docType === "realisasi") {
        state.realisasiManualEdit = true;
    }

    const [movedRow] = costs.splice(idx, 1);
    costs.splice(nextIdx, 0, movedRow);

    if (docType === "ump") {
        syncRealisasiCostsFromAdvance();
    }

    markRecentCostRowMove(docType, getCostRowId(movedRow));
    renderAllCostEditors();
    animateCostRowReorder(docType, previousPositions);
    renderPreview();
}

async function deleteCostRow(docType, idx) {
    const ok = await showConfirmDialog({
        title: "Hapus Biaya?",
        message: "Item biaya ini akan dihapus dari daftar.",
        confirmLabel: "Hapus",
        tone: "danger"
    });
    if (!ok) return;

    deleteCostRowByIndex(docType, idx);
    showToast("Biaya berhasil dihapus.", { type: "success" });
}

function getCostEditElements() {
    return {
        sheet: document.getElementById("costEditSheet"),
        kicker: document.getElementById("costEditSheetKicker"),
        title: document.getElementById("costEditSheetTitle"),
        type: document.getElementById("costEditType"),
        description: document.getElementById("costEditDescription"),
        rp: document.getElementById("costEditRp"),
        usd: document.getElementById("costEditUsd")
    };
}

function getCostDocLabel(docType) {
    return docType === "realisasi" ? "Biaya Realisasi" : "Biaya Perjalanan";
}

function createBlankCostRow(type) {
    return {
        id: createCostRowId(),
        type: type === "sub" ? "sub" : "item",
        description: type === "sub" ? "- " : "",
        rp: "",
        usd: ""
    };
}

function openCostEditSheet(docType, index, options = {}) {
    const costs = getCosts(docType);
    const elements = getCostEditElements();
    const isNew = Boolean(options.create);
    const row = isNew ? createBlankCostRow(options.type) : costs[index];
    if (!elements.sheet || (!row && !isNew)) return;

    activeCostEdit.docType = docType;
    activeCostEdit.index = isNew ? null : index;
    activeCostEdit.isNew = isNew;

    elements.kicker.textContent = getCostDocLabel(docType);
    elements.title.textContent = isNew
        ? `Tambah ${row.type === "sub" ? "Sub-item" : "Item"}`
        : `Edit ${row.type === "sub" ? "Sub-item" : "Item"} ${index + 1}`;
    elements.type.value = row.type;
    elements.description.value = row.description || "";
    elements.rp.value = row.rp === "" ? "" : formatInputThousands(row.rp);
    elements.usd.value = row.usd === "" ? "" : formatInputThousands(row.usd);
    const deleteButton = document.getElementById("costEditDeleteBtn");
    if (deleteButton) {
        deleteButton.hidden = false;
        if (isNew) {
            deleteButton.classList.remove("danger-btn");
            deleteButton.innerHTML = `
                <i class="bi bi-x-lg"></i>
                <span>Cancel</span>
            `;
        } else {
            deleteButton.classList.add("danger-btn");
            deleteButton.innerHTML = `
                <i class="bi bi-trash3"></i>
                <span>Hapus</span>
            `;
        }
    }

    elements.sheet.hidden = false;
    document.body.classList.add("cost-edit-open");
    requestAnimationFrame(() => elements.description.focus());
}

function closeCostEditSheet() {
    const sheet = document.getElementById("costEditSheet");
    if (!sheet) return;
    sheet.hidden = true;
    document.body.classList.remove("cost-edit-open");
    const deleteButton = document.getElementById("costEditDeleteBtn");
    if (deleteButton) {
        deleteButton.classList.add("danger-btn");
        deleteButton.innerHTML = `
            <i class="bi bi-trash3"></i>
            <span>Hapus</span>
        `;
    }
    activeCostEdit.docType = null;
    activeCostEdit.index = null;
    activeCostEdit.isNew = false;
}

function saveCostEditSheet() {
    const { docType, index, isNew } = activeCostEdit;
    const elements = getCostEditElements();
    if (!docType) return;

    const costs = getCosts(docType);
    const row = isNew ? null : costs[index];
    if (!isNew && !row) {
        closeCostEditSheet();
        return;
    }

    if (docType === "realisasi") {
        state.realisasiManualEdit = true;
    }

    const nextRow = {
        id: isNew ? createCostRowId() : row.id,
        type: elements.type.value === "sub" ? "sub" : "item",
        description: elements.description.value,
        rp: parseMaybeNumber(elements.rp.value),
        usd: parseMaybeNumber(elements.usd.value)
    };

    if (isNew) {
        costs.push(nextRow);
    } else {
        row.type = nextRow.type;
        row.description = nextRow.description;
        row.rp = nextRow.rp;
        row.usd = nextRow.usd;
    }

    if (docType === "ump") {
        syncRealisasiCostsFromAdvance();
    }

    if (isNew) {
        costEditorCollapsed[docType] = false;
    }

    closeCostEditSheet();
    renderAllCostEditors();
    renderPreview();
    showToast(isNew ? "Biaya berhasil ditambahkan." : "Biaya berhasil diperbarui.", { type: "success" });
}

async function deleteActiveCostEditRow() {
    const { docType, index, isNew } = activeCostEdit;
    if (!docType) return;
    if (isNew) {
        closeCostEditSheet();
        return;
    }
    closeCostEditSheet();
    await deleteCostRow(docType, index);
}

function bindCostEditorEvents() {
    [
        document.getElementById("costEditorBody"),
        document.getElementById("realisasiCostEditorBody")
    ].forEach(tbody => {
        if (!tbody || tbody.dataset.bound === "true") return;
        tbody.dataset.bound = "true";

        tbody.addEventListener("input", event => {
            const fieldEl = event.target.closest("[data-cost-doc][data-row-field]");
            if (!fieldEl) return;

            if (fieldEl.dataset.rowField === "rp" || fieldEl.dataset.rowField === "usd") {
                setFormattedAmountValue(fieldEl);
            }

            updateCostRowField(fieldEl);
        });

        tbody.addEventListener("change", event => {
            const fieldEl = event.target.closest("[data-cost-doc][data-row-field]");
            if (!fieldEl) return;

            if (fieldEl.tagName === "SELECT") {
                updateCostRowField(fieldEl);
            }
        });

        tbody.addEventListener("click", event => {
            const editButton = event.target.closest(".mobile-cost-edit-btn");
            if (editButton) {
                openCostEditSheet(editButton.dataset.costDoc, Number(editButton.dataset.rowIndex));
                return;
            }

            const moveButton = event.target.closest(".move-row-btn");
            if (moveButton) {
                moveCostRow(
                    moveButton.dataset.costDoc,
                    Number(moveButton.dataset.rowIndex),
                    moveButton.dataset.rowMove
                );
                return;
            }

            const buttonEl = event.target.closest(".delete-row-btn");
            if (!buttonEl) return;
            deleteCostRow(buttonEl.dataset.costDoc, Number(buttonEl.dataset.rowIndex));
        });
    });
}

function bindCostEditSheetEvents() {
    const sheet = document.getElementById("costEditSheet");
    if (!sheet || sheet.dataset.bound === "true") return;
    sheet.dataset.bound = "true";

    document.getElementById("costEditCloseBtn")?.addEventListener("click", closeCostEditSheet);
    document.getElementById("costEditBackdrop")?.addEventListener("click", closeCostEditSheet);
    document.getElementById("costEditSaveBtn")?.addEventListener("click", saveCostEditSheet);
    document.getElementById("costEditDeleteBtn")?.addEventListener("click", deleteActiveCostEditRow);

    ["costEditRp", "costEditUsd"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", event => {
            setFormattedAmountValue(event.target);
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !sheet.hidden) {
            closeCostEditSheet();
        }
    });
}

function addRow(docType, type) {
    if (isMobileFormLayout()) {
        openCostEditSheet(docType, -1, { create: true, type });
        return;
    }

    if (docType === "realisasi") {
        state.realisasiManualEdit = true;
    }

    getCosts(docType).push(createBlankCostRow(type));

    if (docType === "ump") {
        syncRealisasiCostsFromAdvance();
    }

    costEditorCollapsed[docType] = false;
    renderAllCostEditors();
    renderPreview();
}

function updateMiniSignaturePreview(key, value) {
    const map = {
        preparedSign: "preparedSignMini",
        checkedSign: "checkedSignMini",
        approvedSign: "approvedSignMini"
    };
    const img = document.getElementById(map[key]);
    if (!img) return;
    if (value) {
        img.src = value;
        img.style.display = "block";
    } else {
        img.removeAttribute("src");
        img.style.display = "none";
    }
}

function bindSignatureInputs() {
    document.querySelectorAll(".signature-input").forEach(input => {
        input.addEventListener("change", async (e) => {
            const file = e.target.files?.[0];
            const key = e.target.dataset.signKey;
            if (!file || !key) return;

            const reader = new FileReader();
            reader.onload = () => {
                state[key] = reader.result;
                updateMiniSignaturePreview(key, state[key]);
                renderPreview();
            };
            reader.readAsDataURL(file);
        });
    });

    document.querySelectorAll(".clear-sign-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.signKey;
            state[key] = "";
            updateMiniSignaturePreview(key, "");
            const input = document.querySelector(`.signature-input[data-sign-key="${key}"]`);
            if (input) input.value = "";
            renderPreview();
        });
    });
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "";
}

function setSignImage(id, value) {
    const img = document.getElementById(id);
    if (!img) return;
    if (value) {
        img.src = value;
        img.classList.add("has-image");
    } else {
        img.removeAttribute("src");
        img.classList.remove("has-image");
    }
}

function getActiveDocType() {
    const realisasiPane = document.getElementById("pane-realisasi");
    return realisasiPane?.classList.contains("active") ? "realisasi" : "ump";
}

function getPreviewDocDate(docType = getActiveDocType()) {
    return docType === "realisasi" ? state.realisasiDocDate : state.docDate;
}

function getPreviewInfoValue(docType, baseKey) {
    if (baseKey === "projectDuration") {
        return docType === "realisasi"
            ? state.realisasiProjectDuration ?? ""
            : state.projectDuration ?? "";
    }

    if (baseKey === "submissionPeriod") {
        return docType === "realisasi"
            ? state.realisasiSubmissionPeriod ?? ""
            : state.submissionPeriod ?? "";
    }

    if (docType !== "realisasi") {
        return state[baseKey] ?? "";
    }

    const pair = getRealisasiInfoPairByBase(baseKey);
    return pair ? state[pair.realisasiKey] ?? "" : state[baseKey] ?? "";
}

function getPreviewInfoDisplayValue(docType, baseKey) {
    if (baseKey === "submissionPeriod") {
        return formatSubmissionPeriodDisplayText(getPreviewInfoValue(docType, baseKey));
    }

    const mode = baseKey === "companyName" ? DISPLAY_CASE.upper : DISPLAY_CASE.proper;
    return formatDisplayText(getPreviewInfoValue(docType, baseKey), mode);
}

function renderPreviewCosts(docType = getActiveDocType()) {
    const tbody = document.getElementById("previewCostBody");
    const costs = getCosts(docType);
    tbody.innerHTML = "";
    let itemNo = 0;

    costs.forEach(row => {
        const tr = document.createElement("tr");
        const isItem = row.type === "item";
        if (isItem) itemNo += 1;

        tr.innerHTML = `
          <td class="no-col">${isItem ? itemNo : ""}</td>
          <td class="desc-col">${escapeHtml(formatDisplayText(row.description, DISPLAY_CASE.proper))}</td>
          <td class="rp-col">${row.rp === "" ? "" : formatNumber(row.rp)}</td>
          <td class="usd-col">${formatUsd(row.usd)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updatePreviewScale() {
    const panel = document.querySelector(".preview-panel");
    const scroll = document.querySelector(".preview-scroll");
    const stage = document.getElementById("previewStage");
    const doc = document.getElementById("previewDocument");
    if (!panel || !scroll || !stage || !doc) return;

    const previewUnavailable = document.body.classList.contains("preview-hidden")
        || (isMobileActionMenuLayout() && !document.body.classList.contains("mobile-preview-mode"));

    if (previewUnavailable) {
        stage.style.removeProperty("--preview-scale");
        stage.style.removeProperty("--preview-table-border-width");
        stage.style.width = "";
        stage.style.height = "";
        return;
    }

    const baseWidth = doc.offsetWidth || 794;
    const baseHeight = doc.offsetHeight || 1123;
    const availableWidth = Math.max(scroll.clientWidth - 8, 0);
    const scale = availableWidth > 0 ? Math.min(1, availableWidth / baseWidth) : 1;
    const mobilePreview = isMobileActionMenuLayout();
    const visibleBorderWidth = mobilePreview
        ? PREVIEW_TABLE_MOBILE_VISIBLE_BORDER_WIDTH
        : PREVIEW_TABLE_VISIBLE_BORDER_WIDTH;
    const maxBorderWidth = mobilePreview
        ? PREVIEW_TABLE_MOBILE_MAX_BORDER_WIDTH
        : PREVIEW_TABLE_MAX_BORDER_WIDTH;

    stage.style.setProperty("--preview-scale", scale);
    const tableBorderWidth = scale < 1
        ? Math.min(maxBorderWidth, visibleBorderWidth / scale)
        : PREVIEW_TABLE_BORDER_WIDTH;
    stage.style.setProperty("--preview-table-border-width", `${tableBorderWidth}px`);
    stage.style.width = `${baseWidth * scale}px`;
    stage.style.height = `${baseHeight * scale}px`;
}

function renderPreview() {
    const docType = getActiveDocType();
    const activeCosts = getCosts(docType);
    const advanceCosts = getCosts("ump");
    const realisasiCosts = getCosts("realisasi");
    const activeTotals = calcCostTotals(getCosts(docType));
    const receiptTotals = getAdvanceTotals();
    const expenseTotals = getRealisasiTotals();
    const differenceTotals = getDifferenceTotals();
    const activeHasUsd = hasCurrencyValue(activeCosts, "usd");
    const receiptHasUsd = hasCurrencyValue(advanceCosts, "usd");
    const expenseHasUsd = hasCurrencyValue(realisasiCosts, "usd");
    const differenceHasUsd = receiptHasUsd || expenseHasUsd;

    setText("formPanelTitle", docType === "realisasi" ? "Realisasi Biaya Perjalanan" : "Uang Muka Perjalanan");
    setText(
        "formPanelDesc",
        docType === "realisasi"
            ? "Masukkan biaya aktual, lalu periksa receipt dari Uang Muka, total expense, dan selisihnya."
            : "Lengkapi data perjalanan, biaya pengajuan, dan tanda tangan. Total pada tab ini digunakan sebagai receipt pada Realisasi."
    );

    setText("pvCompanyName", getPreviewInfoDisplayValue(docType, "companyName"));
    const previewDocDate = getPreviewDocDate(docType);
    setText("pvDate", previewDocDate ? "Tanggal " + formatDateIndo(previewDocDate) : "Tanggal");
    setText("pvTitle", docType === "realisasi" ? "BIAYA PERJALANAN" : "UANG MUKA PERJALANAN");

    setText("pvDepartment", getPreviewInfoDisplayValue(docType, "department"));
    setText("pvDestination", getPreviewInfoDisplayValue(docType, "destination"));
    setText("pvPurpose", getPreviewInfoDisplayValue(docType, "purpose"));
    setText("pvPoNumber", getPreviewInfoDisplayValue(docType, "poNumber"));
    setText("pvProjectDuration", getPreviewInfoDisplayValue(docType, "projectDuration"));
    setText("pvSubmissionPeriod", getPreviewInfoDisplayValue(docType, "submissionPeriod"));
    setText("pvInstallerName", getPreviewInfoDisplayValue(docType, "installerName"));
    setText("pvSalesName", getPreviewInfoDisplayValue(docType, "salesName"));

    renderPreviewCosts(docType);
    setText("pvGrandTotal", formatNumber(activeTotals.rp));
    setText("pvGrandTotalUsd", activeHasUsd ? formatUsd(activeTotals.usd) : "");
    setText("pvNote", state.noteText);

    setText("pvPreparedBy", formatDisplayText(state.preparedBy, DISPLAY_CASE.proper));
    setText("pvCheckedBy", formatDisplayText(state.checkedBy, DISPLAY_CASE.proper));
    setText("pvApprovedBy", formatDisplayText(state.approvedBy, DISPLAY_CASE.proper));

    setSignImage("pvPreparedSign", state.preparedSign);
    setSignImage("pvCheckedSign", state.checkedSign);
    setSignImage("pvApprovedSign", state.approvedSign);

    syncCostSectionTotals();

    setText("pvReceiptRp", formatNumber(receiptTotals.rp));
    setText("pvReceiptUsd", receiptHasUsd ? formatUsd(receiptTotals.usd) : "");
    setText("pvTotalExpenseRp", formatNumber(expenseTotals.rp));
    setText("pvTotalExpenseUsd", expenseHasUsd ? formatUsd(expenseTotals.usd) : "");
    setText("pvDifferenceRp", formatNumber(differenceTotals.rp));
    setText("pvDifferenceUsd", differenceHasUsd ? formatUsd(differenceTotals.usd) : "");

    const summary = document.getElementById("pvSummaryBlock");
    summary.classList.toggle("active", docType === "realisasi");

    syncRealisasiSummaryValues();

    syncStepState();
    requestAnimationFrame(updatePreviewScale);
}

function syncStepState() {
    const active = getActiveDocType() === "realisasi" ? "tab-realisasi" : "tab-ump";
    document.querySelectorAll(".step-btn[role='tab']").forEach(btn => {
        const isActive = btn.id === active;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", String(isActive));
        btn.tabIndex = isActive ? 0 : -1;
    });
}

function activateDocTab(tabId) {
    const nextTab = document.getElementById(tabId);
    const targetSelector = nextTab?.dataset.paneTarget;
    const nextPane = targetSelector ? document.querySelector(targetSelector) : null;
    if (!nextTab || !nextPane) return;

    document.querySelectorAll(".step-btn[role='tab']").forEach(btn => {
        const isActive = btn === nextTab;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", String(isActive));
        btn.tabIndex = isActive ? 0 : -1;
    });

    document.querySelectorAll(".tab-pane").forEach(pane => {
        const isActive = pane === nextPane;
        pane.classList.toggle("active", isActive);
        pane.classList.toggle("show", isActive);
    });

    renderPreview();

    if (isMobileActionMenuLayout()) {
        window.scrollTo(0, 0);
    }
}

function bindTabsAndSteps() {
    document.querySelectorAll(".step-btn[role='tab']").forEach(tab => {
        tab.addEventListener("click", () => {
            activateDocTab(tab.id);
        });

        tab.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                activateDocTab(tab.id);
            }
        });
    });
}

function bindTopActions() {
    document.getElementById("addItemRowBtn").addEventListener("click", () => addRow("ump", "item"));
    document.getElementById("addSubRowBtn").addEventListener("click", () => addRow("ump", "sub"));
    document.getElementById("addRealisasiItemRowBtn").addEventListener("click", () => addRow("realisasi", "item"));
    document.getElementById("addRealisasiSubRowBtn").addEventListener("click", () => addRow("realisasi", "sub"));
    document.getElementById("toggleCostRowsBtn").addEventListener("click", () => toggleCostEditorCollapse("ump"));
    document.getElementById("toggleRealisasiCostRowsBtn").addEventListener("click", () => toggleCostEditorCollapse("realisasi"));

    document.getElementById("saveDraftBtn").addEventListener("click", () => {
        const result = saveDraftToCollection();
        showToast(result.message, { type: result.ok ? "success" : "error" });
    });

    document.getElementById("loadDraftBtn").addEventListener("click", () => {
        openDraftModal();
    });

    document.getElementById("resetBtn").addEventListener("click", async () => {
        const ok = await showConfirmDialog({
            title: "Kosongkan Form?",
            message: "Semua data yang sedang diisi akan dikembalikan ke nilai awal.",
            confirmLabel: "Reset",
            tone: "danger"
        });
        if (!ok) return;
        state = createResetState();
        saveState();
        renderCurrentState();
        showToast("Form berhasil dikosongkan.", { type: "success" });
    });

    document.getElementById("themeToggleBtn").addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        applyTheme(current === "dark" ? "light" : "dark");
    });

    document.getElementById("togglePreviewBtn").addEventListener("click", togglePreviewVisibility);

    document.getElementById("printPdfBtn").addEventListener("click", () => printPdf());
    document.getElementById("downloadPdfBtn").addEventListener("click", () => downloadPdf());
}

function setMobilePreviewMode(open) {
    const shouldOpen = open && isMobileActionMenuLayout();
    document.body.classList.toggle("mobile-preview-mode", shouldOpen);

    if (shouldOpen) {
        document.body.classList.remove("preview-hidden");
    }

    window.scrollTo(0, 0);
    updatePreviewToggleButton();
    requestAnimationFrame(updatePreviewScale);
}

function togglePreviewVisibility() {
    if (isMobileActionMenuLayout()) {
        setMobilePreviewMode(!document.body.classList.contains("mobile-preview-mode"));
        return;
    }

    document.body.classList.toggle("preview-hidden");
    document.body.classList.remove("mobile-preview-mode");
    updatePreviewToggleButton();
    requestAnimationFrame(updatePreviewScale);
}

function updatePreviewToggleButton() {
    const button = document.getElementById("togglePreviewBtn");
    if (!button) return;

    const hidden = isMobileActionMenuLayout()
        ? !document.body.classList.contains("mobile-preview-mode")
        : document.body.classList.contains("preview-hidden");
    const label = hidden ? "Show Preview" : "Hide Preview";
    const icon = hidden ? "bi-layout-sidebar" : "bi-layout-sidebar-inset-reverse";

    button.innerHTML = `<i class="bi ${icon}"></i><span>${label}</span>`;
    button.setAttribute("aria-label", hidden ? "Show Preview" : "Hide Preview");
    updateMobileActionbarState();
}

function isMobileActionMenuLayout() {
    return window.matchMedia("(max-width: 1023.98px)").matches;
}

function setMobileActionMenuOpen(open) {
    const shouldOpen = open && isMobileActionMenuLayout();
    const button = document.getElementById("mobileMenuBtn");
    const menu = document.getElementById("topbarActions");

    document.body.classList.toggle("mobile-menu-open", shouldOpen);

    if (menu) {
        const mobileLayout = isMobileActionMenuLayout();
        menu.inert = mobileLayout && !shouldOpen;
        menu.setAttribute("aria-hidden", mobileLayout && !shouldOpen ? "true" : "false");
    }

    if (!button) return;
    button.setAttribute("aria-expanded", String(shouldOpen));
    button.setAttribute("aria-label", shouldOpen ? "Tutup menu" : "Buka menu");
    button.innerHTML = `<i class="bi ${shouldOpen ? "bi-x-lg" : "bi-list"}"></i>`;
}

function bindMobileActionMenu() {
    const button = document.getElementById("mobileMenuBtn");
    const menu = document.getElementById("topbarActions");
    if (!button || !menu) return;

    button.addEventListener("click", event => {
        event.stopPropagation();
        setMobileActionMenuOpen(!document.body.classList.contains("mobile-menu-open"));
    });

    menu.addEventListener("click", event => {
        const actionButton = event.target instanceof Element
            ? event.target.closest("button")
            : null;
        if (actionButton && isMobileActionMenuLayout()) {
            setMobileActionMenuOpen(false);
        }
    });

    document.addEventListener("click", event => {
        if (!document.body.classList.contains("mobile-menu-open")) return;
        const target = event.target instanceof Element ? event.target : null;
        if (target && (menu.contains(target) || button.contains(target))) return;
        setMobileActionMenuOpen(false);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            setMobileActionMenuOpen(false);
        }
    });
}

function updateMobileActionbarState() {
    const button = document.getElementById("mobilePreviewToggleBtn");
    if (!button) return;

    const previewOpen = document.body.classList.contains("mobile-preview-mode");
    const icon = button.querySelector("i");
    const label = button.querySelector("span");

    button.classList.toggle("active", previewOpen);
    button.setAttribute("aria-label", previewOpen ? "Kembali ke form" : "Buka preview");

    if (icon) {
        icon.className = `bi ${previewOpen ? "bi-pencil-square" : "bi-layout-sidebar"}`;
    }

    if (label) {
        label.textContent = previewOpen ? "Form" : "Preview";
    }
}

function bindMobileAppActions() {
    const previewButton = document.getElementById("mobilePreviewToggleBtn");
    const previewBackButton = document.getElementById("previewBackBtn");
    const saveButton = document.getElementById("mobileSaveDraftBtn");
    const loadButton = document.getElementById("mobileLoadDraftBtn");
    const resetButton = document.getElementById("mobileResetBtn");
    const printButton = document.getElementById("mobilePrintPdfBtn");
    const downloadButton = document.getElementById("mobileDownloadPdfBtn");

    previewButton?.addEventListener("click", () => {
        setMobilePreviewMode(!document.body.classList.contains("mobile-preview-mode"));
    });

    previewBackButton?.addEventListener("click", () => setMobilePreviewMode(false));

    saveButton?.addEventListener("click", () => {
        const result = saveDraftToCollection();
        showToast(result.message, { type: result.ok ? "success" : "error" });
    });

    loadButton?.addEventListener("click", openDraftModal);

    resetButton?.addEventListener("click", async () => {
        const ok = await showConfirmDialog({
            title: "Kosongkan Form?",
            message: "Semua data yang sedang diisi akan dikembalikan ke nilai awal.",
            confirmLabel: "Reset",
            tone: "danger"
        });
        if (!ok) return;
        state = createResetState();
        saveState();
        renderCurrentState();
        showToast("Form berhasil dikosongkan.", { type: "success" });
    });

    printButton?.addEventListener("click", () => printPdf(printButton));
    downloadButton?.addEventListener("click", () => downloadPdf(downloadButton));
}

function isMobileFormLayout() {
    return window.matchMedia("(max-width: 767.98px)").matches;
}

function shouldStartSectionCollapsed(card) {
    const title = card.querySelector(":scope > .section-card-title")?.textContent?.trim() || "";
    return title === "Catatan" || title === "Tanda Tangan";
}

function updateMobileSections() {
    const mobile = isMobileFormLayout();

    document.querySelectorAll(".tab-pane .section-card").forEach(card => {
        const title = card.querySelector(":scope > .section-card-title");
        if (!title) return;

        card.classList.toggle("mobile-collapsible", mobile);

        if (!mobile) {
            card.classList.remove("mobile-section-collapsed");
            delete card.dataset.mobileSectionReady;
            title.removeAttribute("role");
            title.removeAttribute("tabindex");
            title.removeAttribute("aria-expanded");
            return;
        }

        if (!card.dataset.mobileSectionReady) {
            card.classList.toggle("mobile-section-collapsed", shouldStartSectionCollapsed(card));
            card.dataset.mobileSectionReady = "true";
        }

        title.setAttribute("role", "button");
        title.setAttribute("tabindex", "0");
        title.setAttribute("aria-expanded", String(!card.classList.contains("mobile-section-collapsed")));
    });
}

function toggleMobileSection(card) {
    if (!isMobileFormLayout()) return;

    const title = card.querySelector(":scope > .section-card-title");
    card.classList.toggle("mobile-section-collapsed");
    title?.setAttribute("aria-expanded", String(!card.classList.contains("mobile-section-collapsed")));
}

function bindMobileSections() {
    document.querySelectorAll(".tab-pane .section-card").forEach(card => {
        const title = card.querySelector(":scope > .section-card-title");
        if (!title || title.dataset.mobileSectionBound) return;

        title.dataset.mobileSectionBound = "true";
        title.addEventListener("click", () => toggleMobileSection(card));
        title.addEventListener("keydown", event => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            toggleMobileSection(card);
        });
    });

    updateMobileSections();
}

function getPdfFileName() {
    return getActiveDocType() === "realisasi"
        ? "realisasi-biaya-perjalanan.pdf"
        : "uang-muka-perjalanan.pdf";
}

const VECTOR_PDF = {
    pageWidth: 210,
    pageHeight: 297,
    marginX: 9,
    marginTop: 7,
    marginBottom: 8,
    footerBottomOffset: 12,
    docWidth: 192,
    pxToMm: 210 / 794,
    lineWidth: PDF_TABLE_LINE_WIDTH,
    tableLineColor: PDF_TABLE_LINE_COLOR,
    textColor: 17
};

function pxToPdfMm(px) {
    return px * VECTOR_PDF.pxToMm;
}

function pdfFontHeight(fontSize, lineHeight = 1.25) {
    return fontSize * 0.352778 * lineHeight;
}

function setPdfFont(pdf, size, style = "normal", color = VECTOR_PDF.textColor) {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(color, color, color);
}

function splitPdfText(pdf, value, width) {
    const text = String(value ?? "");
    return pdf.splitTextToSize(text || " ", Math.max(width, 1));
}

function drawPdfTextLines(pdf, lines, x, y, options = {}) {
    const {
        lineHeight = pdfFontHeight(pdf.getFontSize()),
        align = "left",
        maxWidth
    } = options;

    lines.forEach((line, index) => {
        pdf.text(line, x, y + index * lineHeight, {
            align,
            baseline: "top",
            maxWidth
        });
    });

    return y + lines.length * lineHeight;
}

function drawPdfCenteredLines(pdf, lines, x, y, width, height, options = {}) {
    const lineHeight = options.lineHeight ?? pdfFontHeight(pdf.getFontSize(), 1.18);
    const totalTextHeight = lines.length * lineHeight;
    const startY = y + Math.max((height - totalTextHeight) / 2, 0);

    drawPdfTextLines(pdf, lines, x + width / 2, startY, {
        lineHeight,
        align: "center"
    });
}

function drawPdfRightText(pdf, text, x, y, options = {}) {
    pdf.text(String(text ?? ""), x, y, {
        align: "right",
        baseline: "top",
        maxWidth: options.maxWidth
    });
}

function addVectorPdfPage(pdf, cursor) {
    pdf.addPage();
    cursor.y = VECTOR_PDF.marginTop;
}

function ensureVectorPdfSpace(pdf, cursor, neededHeight) {
    if (cursor.y + neededHeight <= VECTOR_PDF.pageHeight - VECTOR_PDF.marginBottom) {
        return false;
    }

    addVectorPdfPage(pdf, cursor);
    return true;
}

function getVectorPdfData(docType = getActiveDocType()) {
    const activeCosts = getCosts(docType);
    const advanceCosts = getCosts("ump");
    const realisasiCosts = getCosts("realisasi");
    const activeTotals = calcCostTotals(activeCosts);
    const receiptTotals = getAdvanceTotals();
    const expenseTotals = getRealisasiTotals();
    const differenceTotals = getDifferenceTotals();
    const activeHasUsd = hasCurrencyValue(activeCosts, "usd");
    const receiptHasUsd = hasCurrencyValue(advanceCosts, "usd");
    const expenseHasUsd = hasCurrencyValue(realisasiCosts, "usd");
    const differenceHasUsd = receiptHasUsd || expenseHasUsd;
    const previewDocDate = getPreviewDocDate(docType);

    return {
        docType,
        companyName: getPreviewInfoDisplayValue(docType, "companyName"),
        dateText: previewDocDate ? `Tanggal ${formatDateIndo(previewDocDate)}` : "Tanggal",
        title: docType === "realisasi" ? "BIAYA PERJALANAN" : "UANG MUKA PERJALANAN",
        infoRows: [
            ["DEPARTEMEN", getPreviewInfoDisplayValue(docType, "department")],
            ["TUJUAN", getPreviewInfoDisplayValue(docType, "destination")],
            ["KEPERLUAN", getPreviewInfoDisplayValue(docType, "purpose")],
            ["NO. PO", getPreviewInfoDisplayValue(docType, "poNumber")],
            ["LAMA PROJECT", getPreviewInfoDisplayValue(docType, "projectDuration")],
            ["PENGAJUAN", getPreviewInfoDisplayValue(docType, "submissionPeriod")],
            ["NAMA INSTALLER/ENGINEER", getPreviewInfoDisplayValue(docType, "installerName")],
            ["NAMA SALES", getPreviewInfoDisplayValue(docType, "salesName")]
        ],
        costs: activeCosts.map(row => ({
            ...row,
            description: formatDisplayText(row.description, DISPLAY_CASE.proper)
        })),
        activeTotals,
        activeHasUsd,
        noteText: state.noteText,
        signatures: [
            {
                role: "PREPARED BY :",
                name: formatDisplayText(state.preparedBy, DISPLAY_CASE.proper),
                image: state.preparedSign
            },
            {
                role: "CHECKED BY :",
                name: formatDisplayText(state.checkedBy, DISPLAY_CASE.proper),
                image: state.checkedSign
            },
            {
                role: "APPROVED BY :",
                name: formatDisplayText(state.approvedBy, DISPLAY_CASE.proper),
                image: state.approvedSign
            }
        ],
        summary: {
            receiptRp: formatNumber(receiptTotals.rp),
            receiptUsd: receiptHasUsd ? formatUsd(receiptTotals.usd) : "",
            totalExpenseRp: formatNumber(expenseTotals.rp),
            totalExpenseUsd: expenseHasUsd ? formatUsd(expenseTotals.usd) : "",
            differenceRp: formatNumber(differenceTotals.rp),
            differenceUsd: differenceHasUsd ? formatUsd(differenceTotals.usd) : ""
        }
    };
}

function drawVectorPdfHeader(pdf, data, cursor) {
    const x = VECTOR_PDF.marginX;
    const y = VECTOR_PDF.marginTop;

    setPdfFont(pdf, 15, "bold");
    pdf.text(String(data.companyName || "").toUpperCase(), x, y, { baseline: "top" });

    setPdfFont(pdf, 10.5);
    drawPdfRightText(pdf, data.dateText, VECTOR_PDF.pageWidth - VECTOR_PDF.marginX, y + pxToPdfMm(18));

    cursor.y = y + pxToPdfMm(74);

    setPdfFont(pdf, 13.5, "bold");
    pdf.text(data.title, VECTOR_PDF.pageWidth / 2, cursor.y, {
        align: "center",
        baseline: "top"
    });
    cursor.y += pdfFontHeight(13.5, 1.15) + pxToPdfMm(18);
}

function drawVectorPdfInfoRows(pdf, data, cursor) {
    const x = VECTOR_PDF.marginX;
    const labelWidth = pxToPdfMm(195);
    const colonWidth = pxToPdfMm(16);
    const valueX = x + labelWidth + colonWidth;
    const valueWidth = VECTOR_PDF.docWidth - labelWidth - colonWidth;
    const rowMinHeight = pxToPdfMm(18);
    const lineHeight = pdfFontHeight(9.75, 1.18);

    data.infoRows.forEach(([label, value]) => {
        setPdfFont(pdf, 9.75);
        const valueLines = splitPdfText(pdf, value, valueWidth);
        const rowHeight = Math.max(rowMinHeight, valueLines.length * lineHeight);
        ensureVectorPdfSpace(pdf, cursor, rowHeight);

        setPdfFont(pdf, 9.75, "bold");
        pdf.text(label, x, cursor.y, { baseline: "top" });
        pdf.text(":", x + labelWidth + colonWidth / 2, cursor.y, {
            align: "center",
            baseline: "top"
        });

        setPdfFont(pdf, 9.75);
        drawPdfTextLines(pdf, valueLines, valueX, cursor.y, { lineHeight, maxWidth: valueWidth });
        cursor.y += rowHeight;
    });

    cursor.y += pxToPdfMm(10);
}

function setVectorPdfTableLineStyle(pdf) {
    pdf.setDrawColor(
        VECTOR_PDF.tableLineColor,
        VECTOR_PDF.tableLineColor,
        VECTOR_PDF.tableLineColor
    );
    pdf.setLineWidth(VECTOR_PDF.lineWidth);
    if (typeof pdf.setLineCap === "function") {
        pdf.setLineCap("butt");
    }
}

function drawVectorPdfTableFrame(pdf, y, height, boundaries, drawTop = false) {
    setVectorPdfTableLineStyle(pdf);

    if (drawTop) {
        pdf.line(boundaries[0], y, boundaries[boundaries.length - 1], y);
    }
    pdf.line(boundaries[0], y + height, boundaries[boundaries.length - 1], y + height);

    boundaries.forEach(x => {
        pdf.line(x, y, x, y + height);
    });
}

function drawVectorPdfCostHeader(pdf, cursor, columns, drawTop = true) {
    const headerHeight = 13;
    ensureVectorPdfSpace(pdf, cursor, headerHeight);

    drawVectorPdfTableFrame(pdf, cursor.y, headerHeight, columns.boundaries, drawTop);

    setPdfFont(pdf, 9.75, "bold");
    drawPdfCenteredLines(pdf, ["NO."], columns.x, cursor.y, columns.no, headerHeight);
    drawPdfCenteredLines(pdf, ["DESCRIPTION"], columns.x + columns.no, cursor.y, columns.desc, headerHeight);
    drawPdfCenteredLines(pdf, ["AMOUNT", "Rp."], columns.rpX, cursor.y, columns.rp, headerHeight);
    drawPdfCenteredLines(pdf, ["AMOUNT", "USD"], columns.usdX, cursor.y, columns.usd, headerHeight);

    cursor.y += headerHeight;
}

function getVectorPdfCostColumns() {
    const x = VECTOR_PDF.marginX;
    const no = pxToPdfMm(34);
    const rp = pxToPdfMm(132);
    const usd = pxToPdfMm(132);
    const desc = VECTOR_PDF.docWidth - no - rp - usd;
    const rpX = x + no + desc;
    const usdX = rpX + rp;

    return {
        x,
        no,
        desc,
        rp,
        usd,
        rpX,
        usdX,
        boundaries: [x, x + no, x + no + desc, usdX, x + VECTOR_PDF.docWidth],
        footerBoundaries: [x, rpX, usdX, x + VECTOR_PDF.docWidth]
    };
}

function drawVectorPdfCostTable(pdf, data, cursor) {
    const columns = getVectorPdfCostColumns();
    const bodyLineHeight = pdfFontHeight(9.75, 1.18);
    const minRowHeight = 6.2;
    const bodyPadX = 1.4;
    let itemNo = 0;

    cursor.y += pxToPdfMm(8);
    drawVectorPdfCostHeader(pdf, cursor, columns, true);

    data.costs.forEach(row => {
        const isItem = row.type === "item";
        if (isItem) itemNo += 1;

        setPdfFont(pdf, 9.75);
        const descLines = splitPdfText(pdf, row.description || "", columns.desc - bodyPadX * 2);
        const rowHeight = Math.max(minRowHeight, descLines.length * bodyLineHeight + 2.4);

        if (cursor.y + rowHeight > VECTOR_PDF.pageHeight - VECTOR_PDF.marginBottom) {
            addVectorPdfPage(pdf, cursor);
            drawVectorPdfCostHeader(pdf, cursor, columns, true);
        }

        drawVectorPdfTableFrame(pdf, cursor.y, rowHeight, columns.boundaries, false);

        setPdfFont(pdf, 9.75);
        if (isItem) {
            drawPdfCenteredLines(pdf, [String(itemNo)], columns.x, cursor.y, columns.no, rowHeight, {
                lineHeight: bodyLineHeight
            });
        }
        drawPdfTextLines(pdf, descLines, columns.x + columns.no + bodyPadX, cursor.y + 1.2, {
            lineHeight: bodyLineHeight,
            maxWidth: columns.desc - bodyPadX * 2
        });
        drawPdfRightText(
            pdf,
            row.rp === "" ? "" : formatNumber(row.rp),
            columns.usdX - bodyPadX,
            cursor.y + Math.max((rowHeight - bodyLineHeight) / 2, 0),
            { maxWidth: columns.rp - bodyPadX * 2 }
        );
        drawPdfRightText(
            pdf,
            formatUsd(row.usd),
            columns.x + VECTOR_PDF.docWidth - bodyPadX,
            cursor.y + Math.max((rowHeight - bodyLineHeight) / 2, 0),
            { maxWidth: columns.usd - bodyPadX * 2 }
        );

        cursor.y += rowHeight;
    });

    const footerHeight = 6.6;
    if (cursor.y + footerHeight > VECTOR_PDF.pageHeight - VECTOR_PDF.marginBottom) {
        addVectorPdfPage(pdf, cursor);
        drawVectorPdfCostHeader(pdf, cursor, columns, true);
    }

    drawVectorPdfTableFrame(pdf, cursor.y, footerHeight, columns.footerBoundaries, false);
    setPdfFont(pdf, 9.75, "bold");
    drawPdfCenteredLines(pdf, ["TOTAL"], columns.x, cursor.y, columns.no + columns.desc, footerHeight);
    drawPdfRightText(
        pdf,
        formatNumber(data.activeTotals.rp),
        columns.usdX - bodyPadX,
        cursor.y + Math.max((footerHeight - bodyLineHeight) / 2, 0),
        { maxWidth: columns.rp - bodyPadX * 2 }
    );
    drawPdfRightText(
        pdf,
        data.activeHasUsd ? formatUsd(data.activeTotals.usd) : "",
        columns.x + VECTOR_PDF.docWidth - bodyPadX,
        cursor.y + Math.max((footerHeight - bodyLineHeight) / 2, 0),
        { maxWidth: columns.usd - bodyPadX * 2 }
    );
    cursor.y += footerHeight + pxToPdfMm(14);
}

function getVectorPdfNoteLines(pdf, noteText, width) {
    const rawLines = String(noteText ?? "").split(/\r?\n/);
    return rawLines.flatMap(line => splitPdfText(pdf, line, width));
}

function drawVectorPdfNote(pdf, data, cursor) {
    setPdfFont(pdf, 9.75);
    const noteLines = getVectorPdfNoteLines(pdf, data.noteText, VECTOR_PDF.docWidth);
    const noteLineHeight = pdfFontHeight(9.75, 1.22);
    const neededHeight = pdfFontHeight(9.75, 1.18) + pxToPdfMm(4) + noteLines.length * noteLineHeight;

    ensureVectorPdfSpace(pdf, cursor, neededHeight);

    setPdfFont(pdf, 9.75, "bold");
    pdf.text("NOTE :", VECTOR_PDF.marginX, cursor.y, { baseline: "top" });
    cursor.y += pdfFontHeight(9.75, 1.18) + pxToPdfMm(4);

    setPdfFont(pdf, 9.75);
    cursor.y = drawPdfTextLines(pdf, noteLines, VECTOR_PDF.marginX, cursor.y, {
        lineHeight: noteLineHeight,
        maxWidth: VECTOR_PDF.docWidth
    });
    cursor.y += pxToPdfMm(18);
}

function drawVectorPdfSummaryRow(pdf, label, value, x, y, colWidth) {
    const valueWidth = 30;
    const lineHeight = pdfFontHeight(9.75, 1.18);

    setPdfFont(pdf, 9.75);
    pdf.text(label, x, y, { baseline: "top" });
    setPdfFont(pdf, 9.75, "bold");
    drawPdfRightText(pdf, value, x + colWidth, y, { maxWidth: valueWidth });

    setVectorPdfTableLineStyle(pdf);
    pdf.setDrawColor(17, 17, 17);
    pdf.line(x + colWidth - valueWidth, y + lineHeight, x + colWidth, y + lineHeight);
}

function drawVectorPdfSummary(pdf, data, cursor) {
    if (data.docType !== "realisasi") return;

    const gap = pxToPdfMm(28);
    const colWidth = (VECTOR_PDF.docWidth - gap) / 2;
    const rowHeight = 5.5;
    const neededHeight = rowHeight * 3 + pxToPdfMm(18);

    ensureVectorPdfSpace(pdf, cursor, neededHeight);

    const leftX = VECTOR_PDF.marginX;
    const rightX = VECTOR_PDF.marginX + colWidth + gap;
    const rightLabelX = rightX + pxToPdfMm(28);
    const rows = [
        ["RECEIPT", data.summary.receiptRp, "USD", data.summary.receiptUsd],
        ["TOTAL EXPENSE", data.summary.totalExpenseRp, "USD", data.summary.totalExpenseUsd],
        ["(-)", data.summary.differenceRp, "USD", data.summary.differenceUsd]
    ];

    rows.forEach(([leftLabel, leftValue, rightLabel, rightValue], index) => {
        const y = cursor.y + index * rowHeight;
        drawVectorPdfSummaryRow(pdf, leftLabel, leftValue, leftX, y, colWidth);
        drawVectorPdfSummaryRow(pdf, rightLabel, rightValue, rightLabelX, y, colWidth - pxToPdfMm(28));
    });

    cursor.y += neededHeight;
}

function getPdfImageInfo(source) {
    if (!source) return Promise.resolve(null);

    return new Promise(resolve => {
        const image = new Image();
        image.onload = () => {
            const sourceWidth = image.naturalWidth || image.width;
            const sourceHeight = image.naturalHeight || image.height;
            if (!sourceWidth || !sourceHeight) {
                resolve(null);
                return;
            }

            const imageScale = Math.min(
                1,
                PDF_SIGNATURE_IMAGE_MAX_WIDTH / sourceWidth,
                PDF_SIGNATURE_IMAGE_MAX_HEIGHT / sourceHeight
            );
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(sourceWidth * imageScale));
            canvas.height = Math.max(1, Math.round(sourceHeight * imageScale));

            const context = canvas.getContext("2d");
            if (!context || !canvas.width || !canvas.height) {
                resolve(null);
                return;
            }

            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve({
                data: canvas.toDataURL("image/png"),
                format: "PNG",
                width: canvas.width,
                height: canvas.height
            });
        };
        image.onerror = () => resolve(null);
        image.src = source;
    });
}

async function getVectorPdfSignatureImages(data) {
    return await Promise.all(data.signatures.map(signature => getPdfImageInfo(signature.image)));
}

function drawVectorPdfSignatures(pdf, data, signatureImages, cursor) {
    const gap = pxToPdfMm(36);
    const colWidth = (VECTOR_PDF.docWidth - gap * 2) / 3;
    const sectionHeight = 35;
    const roleHeight = pdfFontHeight(9, 1.18);
    const imageWrapHeight = pxToPdfMm(62);
    const imageMaxWidth = pxToPdfMm(150);
    const imageMaxHeight = pxToPdfMm(54);
    const nameWidth = pxToPdfMm(160);
    const sectionMarginTop = pxToPdfMm(34);

    ensureVectorPdfSpace(pdf, cursor, sectionHeight + sectionMarginTop);
    cursor.y += sectionMarginTop;

    data.signatures.forEach((signature, index) => {
        const colX = VECTOR_PDF.marginX + index * (colWidth + gap);
        const centerX = colX + colWidth / 2;

        setPdfFont(pdf, 9, "bold");
        pdf.text(signature.role, centerX, cursor.y, {
            align: "center",
            baseline: "top"
        });

        const imageWrapY = cursor.y + roleHeight + pxToPdfMm(24);
        const imageInfo = signatureImages[index];
        if (imageInfo) {
            const fitScale = Math.min(imageMaxWidth / imageInfo.width, imageMaxHeight / imageInfo.height);
            const imageWidth = imageInfo.width * fitScale;
            const imageHeight = imageInfo.height * fitScale;
            pdf.addImage(
                imageInfo.data,
                imageInfo.format,
                centerX - imageWidth / 2,
                imageWrapY + imageWrapHeight - imageHeight,
                imageWidth,
                imageHeight
            );
        }

        const lineY = imageWrapY + imageWrapHeight + pxToPdfMm(8);
        pdf.setDrawColor(17, 17, 17);
        pdf.setLineWidth(0.25);
        pdf.line(centerX - nameWidth / 2, lineY, centerX + nameWidth / 2, lineY);

        setPdfFont(pdf, 9.75);
        pdf.text(signature.name, centerX, lineY + pxToPdfMm(6), {
            align: "center",
            baseline: "top",
            maxWidth: colWidth
        });
    });

    cursor.y += sectionHeight;
}

function drawVectorPdfFooter(pdf, cursor) {
    const footerY = VECTOR_PDF.pageHeight - VECTOR_PDF.footerBottomOffset;
    const footerHeight = pdfFontHeight(7.5);
    if (cursor.y + footerHeight > footerY) {
        addVectorPdfPage(pdf, cursor);
    }

    setPdfFont(pdf, 7.5, "normal", 119);
    pdf.text("Travel Expense by Wahyu", VECTOR_PDF.pageWidth / 2, footerY, {
        align: "center",
        baseline: "top"
    });
}

async function buildVectorPdfDocument(options = {}) {
    const { autoPrint = false } = options;

    if (!window.jspdf?.jsPDF) {
        throw new Error("Library PDF belum siap. Pastikan koneksi internet aktif lalu refresh halaman.");
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const data = getVectorPdfData();
    const signatureImages = await getVectorPdfSignatureImages(data);
    const cursor = { y: VECTOR_PDF.marginTop };

    drawVectorPdfHeader(pdf, data, cursor);
    drawVectorPdfInfoRows(pdf, data, cursor);
    drawVectorPdfCostTable(pdf, data, cursor);
    drawVectorPdfNote(pdf, data, cursor);
    drawVectorPdfSummary(pdf, data, cursor);
    drawVectorPdfSignatures(pdf, data, signatureImages, cursor);
    drawVectorPdfFooter(pdf, cursor);

    if (autoPrint) {
        pdf.autoPrint();
    }

    return pdf;
}

function setButtonLoading(button, label) {
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<i class="bi bi-hourglass-split"></i><span>${label}</span>`;
    return () => {
        button.disabled = false;
        button.innerHTML = originalContent;
    };
}

async function buildPdfDocument(options = {}) {
    return await buildVectorPdfDocument(options);
}

async function downloadPdf(button = document.getElementById("downloadPdfBtn")) {
    const restoreButton = setButtonLoading(button, "Membuat PDF...");

    try {
        const pdf = await buildPdfDocument();
        pdf.save(getPdfFileName());
    } catch (error) {
        console.error("Gagal membuat PDF.", error);
        showToast(error.message || "PDF gagal dibuat. Coba lagi setelah data dan gambar selesai dimuat.", {
            type: "error",
            duration: 4600
        });
    } finally {
        restoreButton();
    }
}

async function printPdf(button = document.getElementById("printPdfBtn")) {
    const restoreButton = setButtonLoading(button, "Menyiapkan Print...");
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        restoreButton();
        showToast("Popup diblokir browser. Izinkan popup untuk mencetak PDF.", {
            type: "warning",
            duration: 4600
        });
        return;
    }

    try {
        const pdf = await buildPdfDocument({ autoPrint: true });
        const blobUrl = pdf.output("bloburl");
        printWindow.location.href = blobUrl;
    } catch (error) {
        console.error("Gagal menyiapkan print PDF.", error);
        if (!printWindow.closed) {
            printWindow.close();
        }
        showToast(error.message || "Print PDF gagal disiapkan. Coba lagi setelah data dan gambar selesai dimuat.", {
            type: "error",
            duration: 4600
        });
    } finally {
        restoreButton();
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttr(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;");
}

function init() {
    initTheme();
    clearLegacyState();
    loadState();
    bindStaticFields();
    renderCurrentState();
    bindSignatureInputs();
    bindTabsAndSteps();
    bindTopActions();
    bindMobileActionMenu();
    bindMobileAppActions();
    bindMobileSections();
    bindConfirmDialogEvents();
    bindCostEditSheetEvents();
    bindDraftModalEvents();
    bindAboutModalEvents();
    setMobileActionMenuOpen(false);
    updatePreviewToggleButton();
    window.addEventListener("resize", () => {
        if (!isMobileActionMenuLayout()) {
            setMobileActionMenuOpen(false);
            document.body.classList.remove("mobile-preview-mode");
        } else {
            setMobileActionMenuOpen(document.body.classList.contains("mobile-menu-open"));
        }
        updateMobileSections();
        updateThemeToggleButton();
        updatePreviewToggleButton();
        updatePreviewScale();
    });
}

document.addEventListener("DOMContentLoaded", init);
