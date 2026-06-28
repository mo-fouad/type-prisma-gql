import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice' },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob' },
  })

  await prisma.post.createMany({
    data: [
      { title: 'Hello GraphQL', content: 'My first post', published: true, authorId: alice.id },
      { title: 'Draft post', content: 'Work in progress', published: false, authorId: alice.id },
      { title: 'Prisma is great', content: 'Using Prisma 7', published: true, authorId: bob.id },
    ],
    skipDuplicates: true,
  })

  console.log('Seed complete. Users: Alice, Bob. Posts: 3.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
