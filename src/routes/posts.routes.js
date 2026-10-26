const { Router } = require("express");
const postsController = require("../controllers/posts.controller");
const likesController = require("../controllers/likes.controller");

const router = Router();

router.post("/", postsController.create);
router.get("/", postsController.list);
router.get("/:id", postsController.getOne);
router.patch("/:id", postsController.update);
router.delete("/:id", postsController.remove);
router.get("/:id/likes", postsController.getPostLikes);
router.post("/:id/likes", likesController.likePost);
router.delete("/:id/likes/:userId", likesController.unlikePost);

module.exports = router;
