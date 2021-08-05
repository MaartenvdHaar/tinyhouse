import { MongoClient } from 'mongodb'
import { Booking, Database, Listing, User } from './../lib/types';

const user = process.env.DB_USER
const password = process.env.DB_PASSWORD
const cluster = process.env.DB_CLUSTER

const url = `mongodb+srv://${user}:${password}@${cluster}.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`

export const connectDatabase = async (): Promise<Database> => {
  const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })

  const db = client.db('main')

  return {
    bookings: db.collection<Booking>('bookings'),
    listings: db.collection<Listing>('listings'),
    users: db.collection<User>('users')
  }
}

