const prisma = require("../db");

/**
 * Create a new post.
 * @throws P2003 if authorId doesn't exist
 */
async function createPost(data) {
  const { imageUrl, caption, location, authorId } = data;
  return prisma.post.create({
    data: { imageUrl, caption, location, authorId },
    include: {
      author: { select: { id: true, username: true, fullname: true } },
      _count: { select: { likes: true } },
    },
  });
}

/**
 * List posts with pagination, sorting, and filtering.
 */
async function listPosts({ page, limit, sortBy, order, location, search, from, to }) {
  const where = {};

  if (location) {
    where.location = { startsWith: location, endsWith: location };
  }

  if (search) {
    where.caption = { contains: search };
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lt = to;
  }

  const skip = (page - 1) * limit;

  // Build orderBy - when sorting by likes, newest-post as tie-breaker always
  let orderBy;
  if (sortBy === "likes") {
    orderBy = [
      { likes: { _count: order } },
      { createdAt: "desc" },
    ];
  } else {
    orderBy = { [sortBy]: order };
  }

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        author: { select: { id: true, username: true, fullname: true } },
        _count: { select: { likes: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total };
}

/**
 * Get a single post by id, with author (user summary) and like count.
 */
async function getPostById(id) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, fullname: true } },
      _count: { select: { likes: true } },
    },
  });
}

/**
 * Update a post (only caption, location).
 * @throws P2025 if not found
 */
async function updatePost(id, data) {
  const { caption, location } = data;
  const update = {};
  if (caption !== undefined) update.caption = caption;
  if (location !== undefined) update.location = location;

  return prisma.post.update({
    where: { id },
    data: update,
  });
}

/**
 * Delete a post by id.
 * @throws P2025 if not found
 */
async function deletePost(id) {
  return prisma.post.delete({ where: { id } });
}

/**
 * Get all users who liked a post, sorted by username ascending.
 */
async function getPostLikes(postId) {
  const likeRows = await prisma.like.findMany({
    where: { postId },
    orderBy: { user: { username: "asc" } },
    select: {
      user: { select: { id: true, username: true, fullname: true } },
    },
  });
  return likeRows.map((l) => l.user);
}

module.exports = {
  createPost,
  listPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostLikes,
};
