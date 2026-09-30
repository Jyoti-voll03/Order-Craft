/**
 * Helper utility to generate formatted sequential IDs for OrderCraft entities.
 */
async function generateNextId(Model, idField, prefix, baseNumber = 1000) {
  try {
    const records = await Model.find({}, { [idField]: 1 }).lean();
    const nums = records
      .map((r) => {
        const val = String(r[idField] || '');
        const match = val.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : baseNumber;
      })
      .filter((n) => !isNaN(n));

    const maxNum = nums.length > 0 ? Math.max(...nums) : baseNumber;
    return `${prefix}${maxNum + 1}`;
  } catch (err) {
    const fallback = baseNumber + Math.floor(Math.random() * 900 + 100);
    return `${prefix}${fallback}`;
  }
}

module.exports = { generateNextId };
