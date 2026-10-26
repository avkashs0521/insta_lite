const prisma = require("../db");

/**
 * Create a new user.
 * @throws P2002 on duplicate username/email
 */
async function createUser(data) {
  const { username, email, fullname, bio } = data;
  return prisma.user.create({
    data: { username, email, fullname, bio },
  });
}

/**
 * List users with pagination, sorting, and filtering.
 */
async function listUsers({ page, limit, sortBy, order, isPrivate, search, hasPosts }) {
  const where = {};

  if (isPrivate !== undefined) {
    where.isPrivate = isPrivate;
  }

  if (search) {
    where.OR = [
      { username: { contains: search } },
      { fullname: { contains: search } },
    ];
  }

  if (hasPosts !== undefined) {
    if (hasPosts === true) {
      where.posts = { some: {} };
    } else {
      where.posts = { none: {} };
    }
  }

  const skip = (page - 1) * limit;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip,
      take: limit,
      include: {
        _count: { select: { posts: true, likes: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

/**
 * Get a single user by id, including post and like counts.
 */
async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { posts: true, likes: true } },
    },
  });
}

/**
 * Update a user (only fullname, bio, isPrivate).
 * @throws P2025 if not found
 */
async function updateUser(id, data) {
  const { fullname, bio, isPrivate } = data;
  const update = {};
  if (fullname !== undefined) update.fullname = fullname;
  if (bio !== undefined) update.bio = bio;
  if (isPrivate !== undefined) update.isPrivate = isPrivate;

  return prisma.user.update({
    where: { id },
    data: update,
  });
}

/**
 * Delete a user by id.
 * @throws P2025 if not found
 */
async function deleteUser(id) {
  return prisma.user.delete({ where: { id } });
}

/**
 * Get posts by a specific user, paginated.
 */
async function getUserPosts(userId, { page, limit }) {
  const skip = (page - 1) * limit;

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { likes: true } },
      },
    }),
    prisma.post.count({ where: { authorId: userId } }),
  ]);

  return { posts, total };
}

/**
 * Get posts liked by a specific user, paginated.
 */
async function getUserLikedPosts(userId, { page, limit }) {
  const skip = (page - 1) * limit;

  const where = {
    likes: { some: { userId } },
  };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        author: {
          select: { id: true, username: true, fullname: true },
        },
        _count: { select: { likes: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total };
}

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserPosts,
  getUserLikedPosts,
};
