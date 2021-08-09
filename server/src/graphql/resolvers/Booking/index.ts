import { Request } from 'express'
import { ObjectId } from "mongodb"
import { Stripe } from "../../../lib/api"

import { Booking, BookingsIndex, Database, Listing } from "../../../lib/types"
import { authorize } from "../../../lib/utils"
import { CreateBookingArgs } from "./types"

const msPerDay = 86400000

const resolveBookingIndex = (
  bookingsIndex: BookingsIndex,
  checkInDate: string,
  checkOutDate: string
): BookingsIndex => {
  let dateCursor = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)
  const newBookingsIndex: BookingsIndex = { ...bookingsIndex }

  while (dateCursor <= checkOut) {
    const y = dateCursor.getUTCFullYear()
    const m = dateCursor.getUTCMonth()
    const d = dateCursor.getDate()

    if (!newBookingsIndex[y]) {
      newBookingsIndex[y] = {}
    }

    if (!newBookingsIndex[y][m]) {
      newBookingsIndex[y][m] = {}
    }

    if (!newBookingsIndex[y][m][d]) {
      newBookingsIndex[y][m][d] = true
    } else {
      throw new Error('selected dates are already booked')
    }

    dateCursor = new Date(dateCursor.getTime() + 86400000)
  }

  return newBookingsIndex
}

export const bookingResolvers = {
  Mutation: {
    createBooking: async ( _root: undefined, { input }: CreateBookingArgs, { db, req }: { db: Database, req: Request }): Promise<Booking> => {
      try {
        const { id, source, checkIn, checkOut} = input

        // verify a logged in user is making request
        const viewer = await authorize(db, req)
        if (!viewer) {
          throw new Error('viewer cant be found')
        }

        // find listing document that is being booked
        const listing = await db.listings.findOne({
          _id: new ObjectId(id)
        })

        if (!listing) {
          throw new Error('Listing cant be found')
        }

        // check that viewer is NOT booking its own listing
        if (listing.host === viewer._id) {
          throw new Error('Viewer cant book own listing')
        }

        // check if checkout is not before checkin
        const today = new Date()
        const checkInDate = new Date(checkIn)
        const checkOutDate = new Date(checkOut)

        if (checkInDate.getTime() > today.getTime() + 90 * msPerDay) {
          throw new Error('CheckInDate cant be more than 90 days from today')
        }

        if (checkOutDate.getTime() > today.getTime() + 90 * msPerDay) {
          throw new Error('CheckOutDate cant be more than 90 days from today')
        }

        if (checkOutDate < checkInDate) {
          throw new Error('checkout cant be before checkin')
        }

        // create a new bookingsIndex for listing being booked
        const bookingsIndex = resolveBookingIndex(
          listing.bookingsIndex,
          checkIn,
          checkOut
        )

        // get total price to charge
        const totalPrice = listing.price * ((checkOutDate.getTime() - checkInDate.getTime()) / msPerDay * 1)

        // get user doucment of host/listing
        const host = await db.users.findOne({
          _id: listing.host
        })

        if (!host || !host.walletId) {
          throw new Error('the host cant be found or isnt connected to Stripe')
        }

        // create Stripe charge on behalf of host
        await Stripe.charge(totalPrice, source, host.walletId)

        // insert a new booking document to bookings collection
        const insertRes = await db.bookings.insertOne({
          _id: new ObjectId(),
          listing: listing._id,
          tenant: viewer._id,
          checkIn,
          checkOut
        })

        const insertedBooking = insertRes.ops[0]

        // update user document of host to increment income
        await db.users.updateOne(
          {
            _id: host._id
          }, {
            $inc: { income: totalPrice }
          }
        )

        // update bookingsfield of tennant
        await db.users.updateOne(
          {
            _id: viewer._id
          },
          {
            $push: { bookings: insertedBooking._id }
          }
        )

        // update bookings field of listing document
        await db.listings.updateOne({
            _id: listing._id
          }, {
            $set: { bookingsIndex },
            $push: { bookings: insertedBooking._id }
          }
        )

        // return newly inserted booking
        return insertedBooking

      } catch(error) {
        throw new Error('Unable to create a booking with Stripe')
      }
    }
  },
  Booking: {
    id: (booking: Booking): string => {
      return booking._id.toHexString()
    },
    listing: (
      booking: Booking,
      _args: Record<string, unknown>,
      { db }: { db: Database }
    ): Promise<Listing | undefined | null> => {
      return db.listings.findOne({ _id: booking.listing })
    },
    tenant: (booking: Booking, _args: Record<string, unknown>, { db }: { db: Database }) => {
      return db.users.findOne({ _id: booking.tenant });
    }
  }
}