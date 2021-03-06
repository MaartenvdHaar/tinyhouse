import React, { useState } from "react"
import { useQuery } from "@apollo/client"
import { Col, Layout, Row } from "antd"
import { Moment } from "moment"
import { useParams } from "react-router-dom"

import {
  ListingBookings,
  ListingCreateBooking,
  ListingCreateBookingModal,
  ListingDetails
} from "./components"
import { ErrorBanner, PageSkeleton } from "../../lib/components"

import { LISTING } from "../../graphql/queries"
import {
  Listing as ListingData,
  ListingVariables
} from "../../graphql/queries/Listing/__generated__/Listing"
import { Viewer } from "../../lib/types"

interface MatchParams {
  id: string;
}

interface Props {
  viewer: Viewer
}

const { Content } = Layout
const PAGE_LIMIT = 3

export const Listing = ({ viewer }: Props) => {
  const { id } = useParams<MatchParams>()
  const [bookingsPage, setBookingsPage] = useState(1)
  const [checkInDate, setCheckInDate] = useState<Moment | null>(null)
  const [checkOutDate, setCheckOutDate] = useState<Moment | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const clearBookingData = () => {
    setModalVisible(false)
    setCheckInDate(null)
    setCheckOutDate(null)
  }

  const { loading, data, error, refetch } = useQuery<ListingData, ListingVariables>(LISTING, {
    variables: {
      id,
      bookingsPage,
      limit: PAGE_LIMIT
    }
  })

  const handleListingRefetch = async () => {
    refetch()
  }

  if (loading) {
    return (
      <Content className="listings">
        <PageSkeleton />
      </Content>
    )
  }

  if (error) {
    return (
      <Content className="listings">
        <ErrorBanner description="This listing may not exist or we've encountered an error. Please try again soon!" />
        <PageSkeleton />
      </Content>
    )
  }

  const listing = data ? data.listing : null
  const listingBookings = listing ? listing.bookings : null

  const listingCreateBookingElement = listing ?
    <ListingCreateBooking
      bookingsIndex={listing.bookingsIndex}
      checkInDate={checkInDate}
      checkOutDate={checkOutDate}
      host={listing.host}
      price={listing.price}
      viewer={viewer}
      setModalVisible={setModalVisible}
      setCheckInDate={setCheckInDate}
      setCheckOutDate={setCheckOutDate}
    /> : null

  const listingDetailsElement = listing ? <ListingDetails listing={listing} /> : null
  const listingBookingsElement = listingBookings ? (
    <ListingBookings
      listingBookings={listingBookings}
      bookingsPage={bookingsPage}
      limit={PAGE_LIMIT}
      setBookingsPage={setBookingsPage}
    />
  ) : null

  const listingCreateBookingModalElement = checkInDate && checkOutDate && listing?.price && (
    <ListingCreateBookingModal
      checkInDate={checkInDate}
      checkOutDate={checkOutDate}
      id={listing.id}
      modalVisible={modalVisible}
      price={listing.price}
      clearBookingData={clearBookingData}
      handleListingRefetch={handleListingRefetch}
      setModalVisible={setModalVisible}
    />)

  return (
    <Content className="listings">
      <Row gutter={24}>
        <Col xs={24} lg={14}>
          {listingDetailsElement}
          {listingBookingsElement}
        </Col>
        <Col xs={24} lg={10}>
          {listingCreateBookingElement}
        </Col>
      </Row>
      {listingCreateBookingModalElement}
    </Content>
  )
}