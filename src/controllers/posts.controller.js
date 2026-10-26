const postsService = require("../services/posts.service");
const usersService = require("../services/users.service");
const { parsePagination } = require("../utils/pagination");

const ALLOWED_SORT_BY = ["createdAt", "updatedAt", "likes"];

/**
 * POST /posts
 */
async function create(req, res) {
  const { imageUrl, authorId, caption, location } = req.body;

  if (!imageUrl || !authorId) {
    return res.status(400).json({ error: "imageUrl and authorId are required" });
  }

  // Check author exists
  const author = await usersService.getUserById(parseInt(authorId, 10));
  if (!author) {
    return res.status(404).json({ error: "User not found" });
  }

  const post = await postsService.createPost({
    imageUrl,
    caption,
    location,
    authorId: parseInt(authorId, 10),
  });

  return res.status(201).json(post);
}

/**
 * GET /posts
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
    return res.status(400).json({ error: "sortBy must be one of: createdAt, updatedAt, likes" });
  }
  if (!["asc", "desc"].includes(order)) {
    return res.status(400).json({ error: "order must be asc or desc" });
  }

  // Filters
  const location = req.query.location;
  const search = req.query.search;

  let from, to;
  if (req.query.from !== undefined) {
    from = new Date(req.query.from);
    if (isNaN(from.getTime())) {
      return res.status(400).json({ error: "from and to must be valid dates" });
    }
  }
  if (req.query.to !== undefined) {
    to = new Date(req.query.to);
    if (isNaN(to.getTime())) {
      return res.status(400).json({ error: "from and to must be valid dates" });
    }
  }

  const { posts, total } = await postsService.listPosts({
    page,
    limit,
    sortBy,
    order,
    location,
    search,
    from,
    to,
  });

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
 * GET /posts/:id
 */
async function getOne(req, res) {
  const id = parseInt(req.params.id, 10);
  const post = await postsService.getPostById(id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  return res.json(post);
}

/**
 * PATCH /posts/:id
 */
async function update(req, res) {
  const id = parseInt(req.params.id, 10);

  try {
    const post = await postsService.updatePost(id, req.body);
    return res.json(post);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    throw err;
  }
}

/**
 * DELETE /posts/:id
 */
async function remove(req, res) {
  const id = parseInt(req.params.id, 10);

  try {
    await postsService.deletePost(id);
    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    throw err;
  }
}

/**
 * GET /posts/:id/likes
 */
async function getPostLikes(req, res) {
  const id = parseInt(req.params.id, 10);

  // Verify post exists
  const post = await postsService.getPostById(id);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const likers = await postsService.getPostLikes(id);
  return res.json(likers);
}

module.exports = { create, list, getOne, update, remove, getPostLikes };
