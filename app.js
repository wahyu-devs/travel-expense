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
    { baseKey: "projectDuration", realisasiKey: "realisasiProjectDuration" },
    { baseKey: "submissionPeriod", realisasiKey: "realisasiSubmissionPeriod" },
    { baseKey: "installerName", realisasiKey: "realisasiInstallerName" },
    { baseKey: "salesName", realisasiKey: "realisasiSalesName" }
];

const defaultCostRows = [];

const defaultState = {
    companyName: "PT. PERKOM INDAH MURNI",
    realisasiCompanyName: "PT. PERKOM INDAH MURNI",
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
    projectDuration: "",
    realisasiProjectDuration: "",
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

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
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

function normalizeCostRows(rows, fallbackRows = []) {
    const sourceRows = Array.isArray(rows) ? rows : fallbackRows;
    return sourceRows.map(row => ({
        type: row?.type === "sub" ? "sub" : "item",
        description: typeof row?.description === "string" ? row.description : "",
        rp: parseMaybeNumber(row?.rp),
        usd: parseMaybeNumber(row?.usd)
    }));
}

function areCostRowsEqual(leftRows = [], rightRows = []) {
    return JSON.stringify(normalizeCostRows(leftRows)) === JSON.stringify(normalizeCostRows(rightRows));
}

function areCostRowsEqualByIndex(leftRow, rightRow) {
    return areCostRowsEqual(
        leftRow === undefined ? [] : [leftRow],
        rightRow === undefined ? [] : [rightRow]
    );
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
    const mergedRealisasiCosts = nextBaseCosts.map((baseRow, index) => {
        const currentRow = currentRealisasiCosts[index];
        const previousBaseRow = previousBaseCosts[index];

        if (!currentRow || areCostRowsEqualByIndex(currentRow, previousBaseRow)) {
            return clone(baseRow);
        }

        return clone(currentRow);
    });

    currentRealisasiCosts.slice(nextBaseCosts.length).forEach((currentRow, offset) => {
        const previousBaseRow = previousBaseCosts[nextBaseCosts.length + offset];
        if (!areCostRowsEqualByIndex(currentRow, previousBaseRow)) {
            mergedRealisasiCosts.push(clone(currentRow));
        }
    });

    state.realisasiBaseCosts = clone(nextBaseCosts);
    state.realisasiCosts = mergedRealisasiCosts;
    if (areCostRowsEqual(state.realisasiCosts, state.realisasiBaseCosts)) {
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
        projectDuration: "",
        realisasiProjectDuration: "",
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

// Helper: Format a number string with thousand separators for input fields
function formatInputThousands(value) {
    const normalized = String(value ?? "").replace(/[^\d]/g, "");
    if (!normalized) return "";
    return new Intl.NumberFormat("id-ID").format(Number(normalized));
}

// Helper: Set the formatted value with thousand separators for an input element
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
    state.realisasiCosts = normalizeCostRows(parsed.realisasiCosts ?? legacyCosts, state.advanceCosts);
    state.realisasiBaseCosts = normalizeCostRows(parsed.realisasiBaseCosts ?? state.advanceCosts, state.advanceCosts);
    if (!hasRealisasiBaseCosts) {
        // Draft lama belum punya snapshot dasar realisasi, jadi gunakan
        // Uang Muka sebagai sumber awal agar perilaku sinkron konsisten.
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

function createAutoDraftTitle(savedAt = new Date()) {
    const parts = [
        state.docDate ? formatDateIndo(state.docDate) : "",
        state.destination,
        state.purpose,
        formatPoLabel(state.poNumber)
    ].map(value => String(value ?? "").trim()).filter(Boolean);

    if (parts.length) {
        return parts.join(" | ");
    }

    return `Draft ${formatDraftUpdatedAt(savedAt.toISOString())}`;
}

function createAutoProjectName() {
    return cleanDraftLabel(
        state.destination || state.purpose || formatPoLabel(state.poNumber),
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
    const draftState = draft.state || {};
    const details = [
        draftState.docDate ? formatDateIndo(draftState.docDate) : "",
        draftState.destination,
        draftState.purpose,
        formatPoLabel(draftState.poNumber)
    ].filter(Boolean);

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

function bindDraftModalEvents() {
    const modal = document.getElementById("draftModal");
    const listEl = document.getElementById("draftListBody");
    if (!modal || !listEl || modal.dataset.bound === "true") return;
    modal.dataset.bound = "true";

    document.getElementById("draftModalCloseBtn")?.addEventListener("click", closeDraftModal);
    document.getElementById("draftModalBackdrop")?.addEventListener("click", closeDraftModal);

    listEl.addEventListener("click", event => {
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
            alert(result.loaded
                ? "Draft berhasil dimuat dari browser."
                : result.message);
            return;
        }

        if (deleteButton) {
            const ok = confirm("Hapus draft ini dari browser?");
            if (!ok) return;
            const result = deleteDraftFromCollection(deleteButton.dataset.deleteDraftId);
            if (!result.ok) {
                alert(result.message);
                return;
            }
            renderDraftList();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) {
            closeDraftModal();
        }
    });
}

function clearLegacyState() {
    try {
        LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    } catch {
        // Abaikan jika browser menolak akses storage.
    }
}

function applyTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
        localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
        // Abaikan jika browser menolak akses storage.
    }
    const btn = document.getElementById("themeToggleBtn");
    if (!btn) return;
    btn.innerHTML = nextTheme === "dark"
        ? `<i class="bi bi-moon-stars-fill"></i><span>Dark</span>`
        : `<i class="bi bi-sun-fill"></i><span>Light</span>`;
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

    document.querySelectorAll(".sync-checkbox").forEach(el => {
        const key = el.dataset.key;
        if (!key) return;
        el.checked = Boolean(state[key]);
    });

    syncRealisasiSummaryInputs();
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
        el.addEventListener("input", () => {
            const key = el.dataset.key;
            state[key] = el.value;
            syncRealisasiDateDefault(key);
            syncRealisasiInfoDefault(key);
            syncMatchingFields(el);
            renderPreview();
        });
    });

    document.querySelectorAll(".sync-checkbox").forEach(el => {
        el.addEventListener("change", () => {
            state[el.dataset.key] = el.checked;
            syncMatchingFields(el);
            renderPreview();
        });
    });
}

function syncRealisasiSummaryInputs() {
    const advanceCosts = getCosts("ump");
    const realisasiCosts = getCosts("realisasi");
    const receiptTotals = getAdvanceTotals();
    const expenseTotals = getRealisasiTotals();
    const differenceTotals = getDifferenceTotals();
    const receiptHasUsd = hasCurrencyValue(advanceCosts, "usd");
    const expenseHasUsd = hasCurrencyValue(realisasiCosts, "usd");
    const differenceHasUsd = receiptHasUsd || expenseHasUsd;

    const values = {
        receiptRpInput: receiptTotals.rp,
        receiptUsdInput: receiptHasUsd ? receiptTotals.usd : "",
        totalExpenseRpInput: expenseTotals.rp,
        totalExpenseUsdInput: expenseHasUsd ? expenseTotals.usd : "",
        differenceRpInput: differenceTotals.rp,
        differenceUsdInput: differenceHasUsd ? differenceTotals.usd : ""
    };

    Object.entries(values).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.value = value === "" ? "" : formatNumber(value ?? 0);
    });
}

function getCostEditorBodyId(docType) {
    return docType === "realisasi" ? "realisasiCostEditorBody" : "costEditorBody";
}

function renderCostEditor(docType) {
    const tbody = document.getElementById(getCostEditorBodyId(docType));
    const costs = getCosts(docType);
    if (!tbody) return;
    tbody.innerHTML = "";

    costs.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>
            <select class="form-select row-type-badge" data-cost-doc="${docType}" data-row-index="${index}" data-row-field="type">
              <option value="item" ${row.type === "item" ? "selected" : ""}>Item</option>
              <option value="sub" ${row.type === "sub" ? "selected" : ""}>Sub-item</option>
            </select>
          </td>
          <td>
            <input type="text" class="form-control" data-cost-doc="${docType}" data-row-index="${index}" data-row-field="description" value="${escapeAttr(row.description)}" placeholder="Deskripsi biaya">
          </td>
          <td>
            <input type="text" inputmode="numeric" class="form-control" data-cost-doc="${docType}" data-row-index="${index}" data-row-field="rp" value="${row.rp === "" ? "" : formatInputThousands(row.rp)}" placeholder="0">
          </td>
          <td>
            <input type="text" inputmode="numeric" class="form-control" data-cost-doc="${docType}" data-row-index="${index}" data-row-field="usd" value="${row.usd === "" ? "" : formatInputThousands(row.usd)}" placeholder="">
          </td>
          <td class="text-center">
            <button class="mini-btn delete-row-btn" type="button" data-cost-doc="${docType}" data-row-index="${index}">
              <i class="bi bi-trash3"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
    });
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

function deleteCostRow(buttonEl) {
    const docType = buttonEl.dataset.costDoc;
    const idx = Number(buttonEl.dataset.rowIndex);

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
            const buttonEl = event.target.closest(".delete-row-btn");
            if (!buttonEl) return;
            deleteCostRow(buttonEl);
        });
    });
}

function addRow(docType, type) {
    if (docType === "realisasi") {
        state.realisasiManualEdit = true;
    }

    getCosts(docType).push({
        type,
        description: type === "sub" ? "- " : "",
        rp: "",
        usd: ""
    });

    if (docType === "ump") {
        syncRealisasiCostsFromAdvance();
    }

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
    if (docType !== "realisasi") {
        return state[baseKey] ?? "";
    }

    const pair = getRealisasiInfoPairByBase(baseKey);
    return pair ? state[pair.realisasiKey] ?? "" : state[baseKey] ?? "";
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
          <td class="desc-col">${escapeHtml(row.description || "")}</td>
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

    const isCompactLayout = window.matchMedia("(max-width: 1023.98px)").matches;

    if (document.body.classList.contains("preview-hidden") || isCompactLayout) {
        stage.style.removeProperty("--preview-scale");
        stage.style.width = "";
        stage.style.height = "";
        return;
    }

    const baseWidth = doc.offsetWidth || 794;
    const baseHeight = doc.offsetHeight || 1123;
    const availableWidth = Math.max(scroll.clientWidth - 8, 0);
    const scale = availableWidth > 0 ? Math.min(1, availableWidth / baseWidth) : 1;

    stage.style.setProperty("--preview-scale", scale);
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

    setText("pvCompanyName", getPreviewInfoValue(docType, "companyName"));
    const previewDocDate = getPreviewDocDate(docType);
    setText("pvDate", previewDocDate ? "Tanggal " + formatDateIndo(previewDocDate) : "Tanggal");
    setText("pvTitle", docType === "realisasi" ? "BIAYA PERJALANAN" : "UANG MUKA PERJALANAN");

    setText("pvDepartment", getPreviewInfoValue(docType, "department"));
    setText("pvDestination", getPreviewInfoValue(docType, "destination"));
    setText("pvPurpose", getPreviewInfoValue(docType, "purpose"));
    setText("pvPoNumber", getPreviewInfoValue(docType, "poNumber"));
    setText("pvProjectDuration", getPreviewInfoValue(docType, "projectDuration"));
    setText("pvSubmissionPeriod", getPreviewInfoValue(docType, "submissionPeriod"));
    setText("pvInstallerName", getPreviewInfoValue(docType, "installerName"));
    setText("pvSalesName", getPreviewInfoValue(docType, "salesName"));

    renderPreviewCosts(docType);
    setText("pvGrandTotal", formatNumber(activeTotals.rp));
    setText("pvGrandTotalUsd", activeHasUsd ? formatUsd(activeTotals.usd) : "");
    setText("pvNote", state.noteText);

    setText("pvPreparedBy", `( ${state.preparedBy || ""} )`);
    setText("pvCheckedBy", `( ${state.checkedBy || ""} )`);
    setText("pvApprovedBy", `( ${state.approvedBy || ""} )`);

    setSignImage("pvPreparedSign", state.preparedSign);
    setSignImage("pvCheckedSign", state.checkedSign);
    setSignImage("pvApprovedSign", state.approvedSign);

    setText("pvReceiptRp", formatNumber(receiptTotals.rp));
    setText("pvReceiptUsd", receiptHasUsd ? formatUsd(receiptTotals.usd) : "");
    setText("pvTotalExpenseRp", formatNumber(expenseTotals.rp));
    setText("pvTotalExpenseUsd", expenseHasUsd ? formatUsd(expenseTotals.usd) : "");
    setText("pvDifferenceRp", formatNumber(differenceTotals.rp));
    setText("pvDifferenceUsd", differenceHasUsd ? formatUsd(differenceTotals.usd) : "");

    const summary = document.getElementById("pvSummaryBlock");
    summary.classList.toggle("active", docType === "realisasi");

    syncRealisasiSummaryInputs();

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

    document.getElementById("saveDraftBtn").addEventListener("click", () => {
        const result = saveDraftToCollection();
        alert(result.message);
    });

    document.getElementById("loadDraftBtn").addEventListener("click", () => {
        openDraftModal();
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
        const ok = confirm("Kosongkan form?");
        if (!ok) return;
        state = createResetState();
        saveState();
        renderCurrentState();
    });

    document.getElementById("themeToggleBtn").addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        applyTheme(current === "dark" ? "light" : "dark");
    });

    document.getElementById("togglePreviewBtn").addEventListener("click", () => {
        document.body.classList.toggle("preview-hidden");
        const hidden = document.body.classList.contains("preview-hidden");
        document.getElementById("togglePreviewBtn").innerHTML = hidden
            ? `<i class="bi bi-layout-sidebar"></i><span>Show Preview</span>`
            : `<i class="bi bi-layout-sidebar-inset-reverse"></i><span>Hide Preview</span>`;
        requestAnimationFrame(updatePreviewScale);
    });

    document.getElementById("printPdfBtn").addEventListener("click", printPdf);
    document.getElementById("downloadPdfBtn").addEventListener("click", downloadPdf);
}

async function waitForImages(container) {
    const images = Array.from(container.querySelectorAll("img"))
        .filter(img => img.getAttribute("src"));

    await Promise.all(images.map(img => {
        if (img.complete) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const done = () => {
                img.removeEventListener("load", done);
                img.removeEventListener("error", done);
                resolve();
            };

            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
        });
    }));
}

async function createPdfCanvas() {
    const source = document.getElementById("previewDocument");
    const clone = source.cloneNode(true);
    clone.style.boxShadow = "none";
    clone.style.margin = "0";

    const holder = document.createElement("div");
    holder.style.position = "fixed";
    holder.style.left = "-99999px";
    holder.style.top = "0";
    holder.style.width = "794px";
    holder.style.background = "#fff";
    holder.style.zIndex = "-1";
    holder.appendChild(clone);
    document.body.appendChild(holder);

    try {
        await waitForImages(clone);

        return await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff"
        });
    } finally {
        document.body.removeChild(holder);
    }
}

function trimCanvasBottomWhitespace(canvas) {
    const context = canvas.getContext("2d");
    if (!context) return canvas;

    const { width, height } = canvas;
    const { data } = context.getImageData(0, 0, width, height);
    let lastContentRow = height - 1;

    for (; lastContentRow >= 0; lastContentRow -= 1) {
        const rowOffset = lastContentRow * width * 4;
        let hasContent = false;

        for (let x = 0; x < width; x += 1) {
            const pixelOffset = rowOffset + x * 4;
            const r = data[pixelOffset];
            const g = data[pixelOffset + 1];
            const b = data[pixelOffset + 2];
            const a = data[pixelOffset + 3];

            if (a > 0 && (r < 250 || g < 250 || b < 250)) {
                hasContent = true;
                break;
            }
        }

        if (hasContent) break;
    }

    if (lastContentRow >= height - 1) return canvas;

    const trimmedHeight = Math.max(lastContentRow + 1, 1);
    const trimmedCanvas = document.createElement("canvas");
    trimmedCanvas.width = width;
    trimmedCanvas.height = trimmedHeight;

    const trimmedContext = trimmedCanvas.getContext("2d");
    if (!trimmedContext) return canvas;

    trimmedContext.drawImage(
        canvas,
        0,
        0,
        width,
        trimmedHeight,
        0,
        0,
        width,
        trimmedHeight
    );

    return trimmedCanvas;
}

function getPdfFileName() {
    return getActiveDocType() === "realisasi"
        ? "realisasi-biaya-perjalanan.pdf"
        : "uang-muka-perjalanan.pdf";
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
    const { autoPrint = false } = options;

    if (typeof html2canvas !== "function" || !window.jspdf?.jsPDF) {
        throw new Error("Library PDF belum siap. Pastikan koneksi internet aktif lalu refresh halaman.");
    }

    const { jsPDF } = window.jspdf;
    const rawCanvas = await createPdfCanvas();
    const canvas = trimCanvasBottomWhitespace(rawCanvas);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;

    const imgWidth = pageWidth;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    const totalPages = Math.max(1, Math.ceil((imgHeight - 0.5) / pageHeight));

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
        if (pageIndex > 0) {
            pdf.addPage();
        }

        const position = -pageIndex * pageHeight;
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    }

    if (autoPrint) {
        pdf.autoPrint();
    }

    return pdf;
}

async function downloadPdf() {
    const button = document.getElementById("downloadPdfBtn");
    const restoreButton = setButtonLoading(button, "Membuat PDF...");

    try {
        const pdf = await buildPdfDocument();
        pdf.save(getPdfFileName());
    } catch (error) {
        console.error("Gagal membuat PDF.", error);
        alert(error.message || "PDF gagal dibuat. Coba lagi setelah data dan gambar selesai dimuat.");
    } finally {
        restoreButton();
    }
}

async function printPdf() {
    const button = document.getElementById("printPdfBtn");
    const restoreButton = setButtonLoading(button, "Menyiapkan Print...");
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        restoreButton();
        alert("Popup diblokir browser. Izinkan popup untuk mencetak PDF.");
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
        alert(error.message || "Print PDF gagal disiapkan. Coba lagi setelah data dan gambar selesai dimuat.");
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
    bindDraftModalEvents();
    window.addEventListener("resize", updatePreviewScale);
}

document.addEventListener("DOMContentLoaded", init);
