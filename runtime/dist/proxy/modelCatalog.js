"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.legacyModelSlug = legacyModelSlug;
exports.localModelSlug = localModelSlug;
exports.catalogModelSlug = catalogModelSlug;
exports.matchesModelSlug = matchesModelSlug;
exports.catalogDisplayNames = catalogDisplayNames;
exports.mergeCloudCodeCatalog = mergeCloudCodeCatalog;
const node_crypto_1 = require("node:crypto");
const EFFORT_LABEL_RE = /^(.*?)\s*\((low|medium|high|xhigh|max)(?:\s+thinking)?\)\s*$/i;
const EFFORT_ORDER = ['low', 'medium', 'high', 'xhigh', 'max'];
const EFFORT_DISPLAY = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    xhigh: 'XHigh',
    max: 'Max',
};
const slugPart = (value) => value
    .replace(/^models\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
function parseEffortLabel(label) {
    if (typeof label !== 'string')
        return undefined;
    const match = EFFORT_LABEL_RE.exec(label);
    if (!match)
        return undefined;
    const base = match[1].trim();
    if (!base)
        return undefined;
    const effort = match[2].toLowerCase();
    return {
        base,
        effort,
        effortDisplayName: EFFORT_DISPLAY[effort] || effort,
    };
}
function effortGroupKey(base) {
    return `custom-${slugPart(base)}-${(0, node_crypto_1.createHash)('sha256').update(base).digest('hex').slice(0, 12)}`;
}
function legacyModelSlug(model) {
    return 'custom-' + slugPart(model.externalModelName || model.name);
}
/** An always-available routing alias tied to the saved model, including its effort settings. */
function localModelSlug(model) {
    return `custom-${slugPart(model.name)}-${(0, node_crypto_1.createHash)('sha256').update(model.name).digest('hex').slice(0, 12)}`;
}
function catalogModelSlug(model, models) {
    const parsed = parseEffortLabel(model.displayName || model.name);
    if (parsed && Array.isArray(models)) {
        const siblings = models
            .map((item) => ({ item, info: parseEffortLabel(item.displayName || item.name) }))
            .filter((entry) => entry.info && entry.info.base === parsed.base);
        const efforts = new Set(siblings.map((entry) => entry.info.effort));
        const sameEffortCount = siblings.filter((entry) => entry.info.effort === parsed.effort).length;
        if (efforts.size >= 2 && sameEffortCount === 1) {
            return `${effortGroupKey(parsed.base)}-${parsed.effort}`;
        }
    }
    const legacy = legacyModelSlug(model);
    return models.filter((item) => legacyModelSlug(item) === legacy).length === 1 &&
        !models.some((item) => item.name !== model.name && localModelSlug(item) === legacy)
        ? legacy
        : localModelSlug(model);
}
function matchesModelSlug(model, value, models) {
    const id = value.replace(/^models\//, '');
    return id === localModelSlug(model) || id === catalogModelSlug(model, models);
}
/** The native IDE resolves sorted options by label, so display labels must also be unique. */
function catalogDisplayNames(models, upstream = {}) {
    const used = new Set();
    if (upstream && typeof upstream === 'object') {
        for (const key of ['models', 'availableModels', 'available_models']) {
            const collection = upstream[key];
            if (!collection || typeof collection !== 'object')
                continue;
            for (const entry of Object.values(collection)) {
                if (typeof entry?.displayName === 'string')
                    used.add(entry.displayName);
            }
        }
    }
    const counts = new Map();
    for (const model of models) {
        const label = model.displayName || model.name;
        counts.set(label, (counts.get(label) || 0) + 1);
    }
    const labels = new Map();
    for (const model of [...models].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
        const base = model.displayName || model.name;
        let label = base;
        if (counts.get(base) > 1 || used.has(label))
            label = `${base} (${model.name.replace(/^models\//, '')})`;
        let suffix = 2;
        while (used.has(label))
            label = `${base} (${model.name.replace(/^models\//, '')} #${suffix++})`;
        used.add(label);
        labels.set(model.name, label);
    }
    return labels;
}
/** Preserve native metadata while advertising only configured custom models in every response shape. */
function mergeCloudCodeCatalog(upstream, entries) {
    const result = upstream && typeof upstream === 'object' && !Array.isArray(upstream)
        ? { ...upstream }
        : {};
    let merged = false;
    for (const key of ['models', 'availableModels', 'available_models']) {
        const value = result[key];
        if (Array.isArray(value)) {
            const customNames = new Set(entries.map((entry) => entry.listEntry.name));
            result[key] = [
                ...entries.map((entry) => ({ ...entry.listEntry })),
                ...value.filter((item) => !customNames.has(item?.name)),
            ];
            merged = true;
        }
        else if (value && typeof value === 'object') {
            result[key] = {
                ...value,
                ...Object.fromEntries(entries.map((entry) => [entry.slug, { ...entry.mapEntry }])),
            };
            merged = true;
        }
    }
    if (!merged)
        result.models = Object.fromEntries(entries.map((entry) => [entry.slug, { ...entry.mapEntry }]));
    if (!entries.length)
        return result;
    const ids = [...new Set(entries.map((entry) => entry.slug))];
    const sorts = Array.isArray(result.agentModelSorts) ? result.agentModelSorts : [];
    let attached = false;
    result.agentModelSorts = sorts.map((sort) => {
        if (!sort || typeof sort !== 'object' || !Array.isArray(sort.groups))
            return sort;
        return {
            ...sort,
            groups: sort.groups.map((group) => {
                if (!group || typeof group !== 'object')
                    return group;
                const original = group;
                if (!Array.isArray(original.modelIds))
                    return group;
                attached = true;
                return { ...original, modelIds: [...new Set([...original.modelIds, ...ids])] };
            }),
        };
    });
    if (!attached)
        result.agentModelSorts.push({ displayName: 'Custom models', groups: [{ modelIds: ids }] });
    // Antigravity 2.34.0+: populate groupedModels so multi-effort custom models
    // collapse into the native Thinking effort submenu just like official models.
    const customGroups = new Map();
    for (const entry of entries) {
        const displayName = entry?.mapEntry?.displayName || entry?.listEntry?.displayName;
        const parsed = parseEffortLabel(displayName);
        if (!parsed || typeof entry?.slug !== 'string')
            continue;
        const suffix = `-${parsed.effort}`;
        if (!entry.slug.endsWith(suffix))
            continue;
        const groupKey = entry.slug.slice(0, -suffix.length);
        if (!groupKey)
            continue;
        let group = customGroups.get(groupKey);
        if (!group) {
            group = { displayName: parsed.base, efforts: new Map() };
            customGroups.set(groupKey, group);
        }
        if (!group.efforts.has(parsed.effort)) {
            group.efforts.set(parsed.effort, parsed.effortDisplayName);
        }
    }
    if (customGroups.size > 0) {
        const existingGrouped = result.groupedModels && typeof result.groupedModels === 'object' && !Array.isArray(result.groupedModels)
            ? { ...result.groupedModels }
            : {};
        let addedGroup = false;
        for (const [groupKey, group] of customGroups) {
            if (group.efforts.size < 2)
                continue;
            const orderedEfforts = EFFORT_ORDER.filter((effort) => group.efforts.has(effort));
            existingGrouped[groupKey] = {
                displayName: group.displayName,
                supportedThinkingLevels: orderedEfforts.map((effort) => ({
                    thinkingSuffix: effort,
                    thinkingDisplayName: group.efforts.get(effort) || effort,
                })),
            };
            addedGroup = true;
        }
        if (addedGroup) {
            result.groupedModels = existingGrouped;
        }
    }
    return result;
}
//# sourceMappingURL=modelCatalog.js.map