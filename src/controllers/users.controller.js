const usersService = require("../services/users.service");
const { parsePagination } = require("../utils/pagination");

const ALLOWED_SORT_BY = ["createdAt", "username", "fullname"];

/**
 * POST /users
 */
async function create(req, res) {
  const { username, email, fullname, bio } = req.body;

  if (!username || !email || !fullname) {
    return res.status(400).json({ error: "username, email and fullname are required" });
  }

  try {
    const user = await usersService.createUser({ username, email, fullname, bio });
    return res.status(201).json(user);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "username or email already taken" });
    }
    throw err;
  }
}

/**
 * GET /users
 */
async function list(req, res) {
  // Pagination
  let page, limit;
  try {
    ({ page, limit } = parsePagination(req.query));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // Sorting
  const sortBy = req.query.sortBy ?? "createdAt";
  const order = req.query.order ?? "desc";

  if (!ALLOWED_SORT_BY.includes(sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, username, fullname" });
  }
  if (!["asc", "desc"].includes(order)) {
    return res.status(400).json({ error: "order must be asc or desc" });
  }

  // isPrivate filter
  let isPrivate;
  if (req.query.isPrivate !== undefined) {
    if (req.query.isPrivate === "true") isPrivate = true;
    else if (req.query.isPrivate === "false") isPrivate = false;
    else return res.status(400).json({ error: "isPrivate must be true or false" });
  }

  // hasPosts filter
  let hasPosts;
  if (req.query.hasPosts !== undefined) {
    if (req.query.hasPosts === "true") hasPosts = true;
    else if (req.query.hasPosts === "false") hasPosts = false;
    else return res.status(400).json({ error: "hasPosts must be true or false" });
  }

  const search = req.query.search;

  const { users, total } = await usersService.listUsers({
    page,
    limit,
    sortBy,
    order,
    isPrivate,
    search,
    hasPosts,
  });

  return res.json({
    data: users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * GET /users/:id
 */
async function getOne(req, res) {
  const id = parseInt(req.params.id, 10);
  const user = await usersService.getUserById(id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json(user);
}

/**
 * PATCH /users/:id
 */
async function update(req, res) {
  const id = parseInt(req.params.id, 10);

  try {
    const user = await usersService.updateUser(id, req.body);
    return res.json(user);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    throw err;
  }
}

/**
 * DELETE /users/:id
 */
async function remove(req, res) {
  const id = parseInt(req.params.id, 10);

  try {
    await usersService.deleteUser(id);
    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    throw err;
  }
}

/**
 * GET /users/:id/posts
 */
async function getUserPosts(req, res) {
  const userId = parseInt(req.params.id, 10);

  // Check user exists
  const user = await usersService.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let page, limit;
  try {
    ({ page, limit } = parsePagination(req.query));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const { posts, total } = await usersService.getUserPosts(userId, { page, limit });

  return res.json({
    data: posts,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * GET /users/:id/liked-posts
 */
async function getUserLikedPosts(req, res) {
  const userId = parseInt(req.params.id, 10);

  // Check user exists
  const user = await usersService.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let page, limit;
  try {
    ({ page, limit } = parsePagination(req.query));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const { posts, total } = await usersService.getUserLikedPosts(userId, { page, limit });

  return res.json({
    data: posts,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

module.exports = { create, list, getOne, update, remove, getUserPosts, getUserLikedPosts };
