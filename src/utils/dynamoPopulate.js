/**
 * DynamoDB Population Helper
 * Replaces Mongoose's .populate() for DynamoDB models.
 * Fetches related documents and attaches them to the parent documents.
 */

/**
 * Populate a single field on an array of documents.
 * @param {Array|Object} docs - Document(s) to populate
 * @param {string} field - Field name containing the ID reference
 * @param {Object} Model - Dynamoose model to fetch from
 * @param {string} [selectFields] - Space-separated field names to include (e.g., 'name email')
 * @returns {Array|Object} Documents with populated field
 */
async function populate(docs, field, Model, selectFields) {
    const isArray = Array.isArray(docs);
    const items = isArray ? docs : [docs];

    if (items.length === 0) return docs;

    // Collect unique IDs
    const ids = [...new Set(
        items.map(d => d[field]).filter(id => id != null).map(String)
    )];

    if (ids.length === 0) return docs;

    // Batch get from DynamoDB
    let related;
    try {
        related = await Model.batchGet(ids);
    } catch {
        // Fallback: fetch one by one if batchGet fails
        related = [];
        for (const id of ids) {
            try {
                const doc = await Model.get(id);
                if (doc) related.push(doc);
            } catch { /* skip missing */ }
        }
    }

    // Build lookup map
    const map = {};
    for (const r of related) {
        const obj = typeof r.toJSON === 'function' ? r.toJSON() : { ...r };
        if (selectFields) {
            const fields = selectFields.split(' ');
            const filtered = { id: obj.id };
            for (const f of fields) {
                if (obj[f] !== undefined) filtered[f] = obj[f];
            }
            map[obj.id] = filtered;
        } else {
            map[obj.id] = obj;
        }
    }

    // Attach populated data
    for (const item of items) {
        const refId = item[field];
        if (refId && map[String(refId)]) {
            item[field] = map[String(refId)];
        }
    }

    return isArray ? items : items[0];
}

/**
 * Populate multiple fields on documents.
 * @param {Array|Object} docs - Document(s) to populate
 * @param {Array<{field: string, Model: Object, select?: string}>} populateConfig
 * @returns {Array|Object}
 */
async function populateMultiple(docs, populateConfig) {
    let result = docs;
    for (const config of populateConfig) {
        result = await populate(result, config.field, config.Model, config.select);
    }
    return result;
}

module.exports = { populate, populateMultiple };
