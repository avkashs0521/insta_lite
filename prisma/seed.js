const prisma = require("../src/db");
const { users, posts, likes } = require("./seed-data");

async function main() {
  // 1. Delete all rows - children first
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create all users and get rows back (with their ids)
  const createdUsers = await prisma.user.createManyAndReturn({
    data: users.map(({ username, email, fullname, bio, isPrivate, createdAt }) => ({
      username,
      email,
      fullname,
      bio,
      isPrivate,
      createdAt: new Date(createdAt),
    })),
  });

  // 3. Build username → id lookup
  const userIdByUsername = {};
  for (const u of createdUsers) {
    userIdByUsername[u.username] = u.id;
  }

  // 4. Create all posts in one query, replacing `author` with real authorId
  const createdPosts = await prisma.post.createManyAndReturn({
    data: posts.map(({ author, imageUrl, caption, location, createdAt }) => ({
      imageUrl,
      caption,
      location,
      authorId: userIdByUsername[author],
      createdAt: new Date(createdAt),
    })),
  });

  // 5. Build insta## → post id lookup
  const postIdByKey = {};
  for (const p of createdPosts) {
    // imageUrl: "https://picsum.photos/seed/insta01/600/600"
    // split("/") = ["https:", "", "picsum.photos", "seed", "insta01", "600", "600"]
    // index [4] is "insta01"
    const key = p.imageUrl.split("/")[4];
    postIdByKey[key] = p.id;
  }

  // 6. Create all likes in one query
  await prisma.like.createMany({
    data: likes.map(({ user, post }) => ({
      userId: userIdByUsername[user],
      postId: postIdByKey[post],
    })),
  });

  // 7. Print seeding results
  console.log(
    `🌱 Seeded ${createdUsers.length} users, ${createdPosts.length} posts and ${likes.length} likes`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
