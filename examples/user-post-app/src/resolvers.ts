import { Resolver, Query, Mutation, Arg, Ctx } from 'type-prisma-gql'
import { PrismaClient } from '@prisma/client'
import { User, Post, CreateUserInput, CreatePostInput } from './types'

interface Context {
  prisma: PrismaClient
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  async users(@Ctx() { prisma }: Context) {
    return prisma.user.findMany()
  }

  @Query(() => User, { nullable: true })
  async user(@Arg('id', () => Number) id: number, @Ctx() { prisma }: Context) {
    return prisma.user.findUnique({ where: { id } })
  }

  @Mutation(() => User)
  async createUser(
    @Arg('data', () => CreateUserInput) data: CreateUserInput,
    @Ctx() { prisma }: Context
  ) {
    return prisma.user.create({ data })
  }
}

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts(@Ctx() { prisma }: Context) {
    return prisma.post.findMany({ include: { author: true } })
  }

  @Query(() => [Post])
  async publishedPosts(@Ctx() { prisma }: Context) {
    return prisma.post.findMany({
      where: { published: true },
      include: { author: true },
    })
  }

  @Mutation(() => Post)
  async createPost(
    @Arg('data', () => CreatePostInput) data: CreatePostInput,
    @Ctx() { prisma }: Context
  ) {
    return prisma.post.create({
      data,
      include: { author: true },
    })
  }

  @Mutation(() => Post)
  async publishPost(
    @Arg('id', () => Number) id: number,
    @Ctx() { prisma }: Context
  ) {
    return prisma.post.update({
      where: { id },
      data: { published: true },
      include: { author: true },
    })
  }
}
