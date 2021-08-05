import express, { Application } from 'express'
import { connectDatabase } from './database/index';
import cookieParser from 'cookie-parser'
import { ApolloServer } from 'apollo-server-express'
import { typeDefs, resolvers } from './graphql';
import compression from 'compression';

const corsOptions = {
  origin: 'http://localhost:5000',
  credentials: true
}

const mount = async (app: Application) => {
  app.use(express.json({ "limit": "2mb"}))
  app.use(cookieParser(process.env.SECRET))
  app.use(compression())

  app.use(express.static(`${__dirname}/client/`))
  app.get('/*', (_req, res) => res.sendFile(`${__dirname}client/index.html`))



  const db = await connectDatabase()
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => ({ db, req, res })
  });

  server.applyMiddleware({ app, path: '/api', cors: corsOptions })

  app.listen(process.env.PORT)

  console.log(`[app] : http://localhost:${process.env.PORT}`);
}

mount(express())
