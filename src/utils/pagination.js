/**
 * Parses and validates pagination query parameters.
 * @param {object} query - req.query
 * @returns {{ page: number, limit: number }} parsed pagination values
 * @throws {{ status: 400, error: string }} if invalid
 */
function parsePagination(query) {
  const rawPage = query.page ?? "1";
  const rawLimit = query.limit ?? "10";

  const page = Number(rawPage);
  const limit = Number(rawLimit);

  if (
    !Number.isInteger(page) || page < 1 ||
    !Number.isInteger(limit) || limit < 1
  ) {
    const err = new Error("page and limit must be positive integers");
    err.status = 400;
    throw err;
  }

  // Cap limit at 50
  const cappedLimit = Math.min(limit, 50);

  return { page, limit: cappedLimit };
}

module.exports = { parsePagination };
