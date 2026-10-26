const prisma = require("../db");

/**
 * Like a post.
 * @throws P2025 if post or user doesn't exist (via foreign key)
 * @throws P2002 if already liked (composite PK violation)
 */
async function likePost(postId, userId) {
  return prisma.like.create({
    data: { postId, userId },
  });
}

/**
 * Unlike a post.
 * @throws P2025 if the like record doesn't exist
 */
async function unlikePost(postId, userId) {
  return prisma.like.delete({
    where: { userId_postId: { userId, postId } },
  });
}

module.exports = { likePost, unlikePost };
