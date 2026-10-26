const likesService = require("../services/likes.service");
const postsService = require("../services/posts.service");
const usersService = require("../services/users.service");

/**
 * POST /posts/:id/likes
 */
async function likePost(req, res) {
  const postId = parseInt(req.params.id, 10);
  const { userId } = req.body;

  // 400 - userId required
  if (userId === undefined || userId === null || userId === "") {
    return res.status(400).json({ error: "userId is required" });
  }

  const userIdInt = parseInt(userId, 10);

  // 404 - post must exist
  const post = await postsService.getPostById(postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  // 404 - user must exist
  const user = await usersService.getUserById(userIdInt);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // 409 - catch duplicate (P2002 = unique constraint)
  try {
    const like = await likesService.likePost(postId, userIdInt);
    return res.status(201).json(like);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Already liked" });
    }
    throw err;
  }
}

/**
 * DELETE /posts/:id/likes/:userId
 */
async function unlikePost(req, res) {
  const postId = parseInt(req.params.id, 10);
  const userId = parseInt(req.params.userId, 10);

  try {
    await likesService.unlikePost(postId, userId);
    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Like not found" });
    }
    throw err;
  }
}

module.exports = { likePost, unlikePost };
