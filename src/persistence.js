// Frozen ordering from stamped-checklist-schema v0.1.0 (30 items).
// Never regenerate this mapping from current checklist data.
// Unversioned saves are assumed to use this one pre-M.4 layout.
export const LEGACY_ITEMS = [
    ["s0_p0_i0", "stamped-checklist:must/001"],
    ["s0_p0_i1", "stamped-checklist:must/002"],
    ["s0_p0_i2", "stamped-checklist:must/003"],
    ["s0_p1_i0", "stamped-checklist:must/004"],
    ["s0_p1_i1", "stamped-checklist:must/005"],
    ["s0_p1_i2", "stamped-checklist:must/006"],
    ["s0_p2_i0", "stamped-checklist:must/007"],
    ["s0_p2_i1", "stamped-checklist:must/008"],
    ["s0_p3_i0", "stamped-checklist:must/009"],
    ["s0_p3_i1", "stamped-checklist:must/010"],
    ["s0_p3_i2", "stamped-checklist:must/011"],
    ["s0_p4_i0", "stamped-checklist:must/012"],
    ["s0_p5_i0", "stamped-checklist:must/013"],
    ["s0_p5_i1", "stamped-checklist:must/014"],
    ["s0_p6_i0", "stamped-checklist:must/015"],
    ["s0_p6_i1", "stamped-checklist:must/016"],
    ["s0_p6_i2", "stamped-checklist:must/017"],
    ["s1_p0_i0", "stamped-checklist:should/001"],
    ["s1_p1_i0", "stamped-checklist:should/002"],
    ["s1_p2_i0", "stamped-checklist:should/003"],
    ["s1_p3_i0", "stamped-checklist:should/004"],
    ["s1_p3_i1", "stamped-checklist:should/005"],
    ["s1_p4_i0", "stamped-checklist:should/006"],
    ["s1_p4_i1", "stamped-checklist:should/007"],
    ["s1_p4_i2", "stamped-checklist:should/008"],
    ["s2_p0_i0", "stamped-checklist:may/001"],
    ["s2_p0_i1", "stamped-checklist:may/002"],
    ["s2_p0_i2", "stamped-checklist:may/003"],
    ["s2_p0_i3", "stamped-checklist:may/004"],
    ["s2_p0_i4", "stamped-checklist:may/005"],
];

export const PERSISTENCE_FORMAT = 2;
const legacyIds = new Map(LEGACY_ITEMS);

// Convert only at the persistence boundary; DOM IDs can remain positional.
export function readResponses(responses, format) {
    if (format !== undefined && format !== PERSISTENCE_FORMAT) {
        throw new Error("Unsupported saved-answer format");
    }
    if (!responses || typeof responses !== "object" || Array.isArray(responses)) {
        throw new Error("Invalid saved responses");
    }
    const result = {};
    for (const [key, response] of Object.entries(responses)) {
        const id = format === PERSISTENCE_FORMAT ? key : legacyIds.get(key);
        if (!id) throw new Error("Unknown legacy answer position");
        if (!response || ![null, "yes", "no"].includes(response.value) || typeof response.reason !== "string") {
            throw new Error("Invalid saved answer");
        }
        result[id] = { value: response.value, reason: response.reason.slice(0, 250) };
    }
    return result;
}

export function readLegacyState(bits) {
    if (!/^[01]{30}$/.test(bits)) throw new Error("Unknown legacy checklist ordering");
    return Object.fromEntries(
        LEGACY_ITEMS.map(([, id], index) => [id, { value: bits[index] === "1" ? "yes" : null, reason: "" }])
    );
}
