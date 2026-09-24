import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
// Pre-M.4 layout, independent of whichever release the dev server downloads.
const baseline = [
    [
        "must",
        [
            ["S.1", 3],
            ["T.1", 3],
            ["A.1", 2],
            ["P.1", 3],
            ["P.2", 1],
            ["P.3", 2],
            ["D.1", 3],
        ],
    ],
    [
        "should",
        [
            ["T.2", 1],
            ["A.2", 1],
            ["M.1", 1],
            ["E.1", 2],
            ["D.2", 3],
        ],
    ],
    ["may", [["M.2", 5]]],
].map(([level, entries]) => {
    let ordinal = 0;
    return {
        level,
        label: level.toUpperCase(),
        principles: entries.map(([code, count]) => ({
            code,
            name: code,
            desc: `${code} requirement.`,
            items: Array.from({ length: count }, (_, i) => `${code} question ${i + 1}`),
            itemIds: Array.from(
                { length: count },
                () => `stamped-checklist:${level}/${String(++ordinal).padStart(3, "0")}`
            ),
        })),
    };
});
const answer = { value: "no", reason: "Needs a fresh environment" };
const stableId = "stamped-checklist:should/004";

async function build(data, url = "/") {
    document.body.innerHTML = '<div id="app"></div><div id="levelStats"></div><div id="toast"></div>';
    window.history.replaceState({}, "", url);
    vi.resetModules();
    vi.doMock("../../src/checklist.js", () => ({ DATA: data, VERSION: "0.2.0" }));
    const script = await import("../../src/script.js");
    script.buildChecklist();
    return script;
}
function withM4() {
    const data = structuredClone(baseline);
    const entries = data[1].principles;
    entries.splice(3, 0, {
        code: "M.4",
        name: "Modularity",
        desc: "Access requirements.",
        items: ["Are components isolated?"],
        itemIds: ["stamped-checklist:should/009"],
    });
    return data;
}
function domIdFor(data, id) {
    for (const [si, section] of data.entries()) {
        for (const [pi, entry] of section.principles.entries()) {
            const ii = entry.itemIds.indexOf(id);
            if (ii !== -1) return `s${si}_p${pi}_i${ii}`;
        }
    }
}
function expectRestored(data, expected = answer) {
    const id = domIdFor(data, stableId);
    expect(document.getElementById(`reason_${id}`).value).toBe(expected.reason);
    expect(document.getElementById(`${expected.value}_${id}`).classList.contains("active")).toBe(true);
    expect(document.querySelectorAll(".response-btn.active").length).toBe(1);
}

beforeEach(() => localStorage.clear());
afterEach(() => {
    vi.doUnmock("../../src/checklist.js");
    vi.restoreAllMocks();
});

describe("answer identity after adding M.4", () => {
    for (const transport of ["browser", "url"]) {
        it(`${transport}: stable answers survive M.4 insertion`, async () => {
            const script = await build(baseline);
            script.handleResponse("s1_p3_i0", "no");
            script.handleReason("s1_p3_i0", answer.reason);
            const url = window.location.search;
            const saved = JSON.parse(localStorage.getItem("stamped_checklist"));
            expect(saved.format).toBe(2);
            expect(saved.responses[stableId]).toEqual(answer);
            if (transport === "url") localStorage.clear();
            const data = withM4();
            await build(data, transport === "url" ? url : "/");
            expectRestored(data);
        });
    }
    for (const transport of ["browser", "responses", "state"]) {
        it(`legacy ${transport}: migrates the pre-M.4 ordering`, async () => {
            let url = "/";
            const responses = { s1_p3_i0: answer };
            if (transport === "browser") localStorage.setItem("stamped_checklist", JSON.stringify({ responses }));
            if (transport === "responses") url = `/?responses=${encodeURIComponent(btoa(JSON.stringify(responses)))}`;
            if (transport === "state") url = `/?state=${btoa("0".repeat(20) + "1" + "0".repeat(9))}`;
            const data = withM4();
            await build(data, url);
            expectRestored(data, transport === "state" ? { value: "yes", reason: "" } : answer);
        });
    }
    it("an explicit empty URL assessment overrides browser answers", async () => {
        localStorage.setItem("stamped_checklist", JSON.stringify({ responses: { s1_p3_i0: answer } }));
        await build(baseline, `/?format=2&responses=${btoa("{}")}`);
        expect(document.querySelectorAll(".response-btn.active").length).toBe(0);
    });
    it("view-only URLs still restore browser answers", async () => {
        localStorage.setItem("stamped_checklist", JSON.stringify({ responses: { s1_p3_i0: answer } }));
        await build(baseline, "/?cols=1");
        expectRestored(baseline);
    });
    it("legacy responses override checkbox bits and browser answers", async () => {
        localStorage.setItem("stamped_checklist", JSON.stringify({ responses: { s0_p0_i0: answer } }));
        const params = new URLSearchParams({
            state: btoa("0".repeat(20) + "1" + "0".repeat(9)),
            responses: btoa(JSON.stringify({ s1_p3_i0: answer })),
        });
        const data = withM4();
        await build(data, `/?${params}`);
        expectRestored(data);
    });
    it("keeps an unsupported legacy save untouched until an explicit reset", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const original = JSON.stringify({ responses: { s9_p9_i9: answer } });
        localStorage.setItem("stamped_checklist", original);
        const script = await build(withM4());
        script.handleResponse("s0_p0_i0", "yes");
        expect(localStorage.getItem("stamped_checklist")).toBe(original);
        expect(document.getElementById("toast").textContent).toContain("could not be restored");
        vi.spyOn(window, "confirm").mockReturnValue(true);
        script.confirmReset();
        expect(JSON.parse(localStorage.getItem("stamped_checklist"))).toEqual({ format: 2, responses: {} });
    });
});
