import express, { Application } from 'express'
import { connectDatabase } from './database/index'
import cookieParser from 'cookie-parser'
import { ApolloServer } from 'apollo-server-express'
import { typeDefs, resolvers } from './graphql'
import compression from 'compression'
import { Database } from './lib/types'

const corsOptions = {
  origin: 'http://localhost:5000',
  credentials: true
}

export const createApp = async (db: Database): Promise<Application> => {
  const app = express()
  const server = new ApolloServer({ typeDefs, resolvers, context: ({ req, res }) => ({ db, req, res }) })
  await server.start()

  app.use(express.json({ "limit": "2mb" }))
  app.use(cookieParser(process.env.SECRET))
  app.use(compression())


  server.applyMiddleware({ app, path: '/api', cors: corsOptions })

  app.use(express.static(`${__dirname}/client`))
  app.get('/*', (_req, res) => res.sendFile(`${__dirname}/client/index.html`))

  return app
}

const start = async () => {
  const db = await connectDatabase()
  const app = await createApp(db)

  app.listen(process.env.PORT)

  console.log(`[app] : http://localhost:${process.env.PORT}`)
}

start().catch(console.error)
