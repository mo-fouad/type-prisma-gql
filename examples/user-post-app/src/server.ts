import express from 'express'
import cors from 'cors'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express5'
import { PrismaClient } from '@prisma/client'
import { buildSchema } from 'type-prisma-gql'
import { UserResolver, PostResolver } from './resolvers'

const prisma = new PrismaClient()

async function main() {
  const schema = await buildSchema({
    resolvers: [UserResolver, PostResolver],
  })

  const server = new ApolloServer({ schema })
  await server.start()

  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async () => ({ prisma }),
    })
  )

  app.listen(4000, () => {
    console.log('Server ready at http://localhost:4000/graphql')
  })
}

main().catch(console.error)
