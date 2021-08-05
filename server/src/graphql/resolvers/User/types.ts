import { Booking, Listing } from "../../../lib/types";

export interface UserArgs {
  id: string
}

export interface UserBookingsArgs {
  limit: number
  page: number
}

export interface UserBookingsData {
  result: Booking[]
  total: number
}

export interface UserListingsArgs {
  limit: number
  page: number
}

export interface UserListingsData {
  result: Listing[]
  total: number
}