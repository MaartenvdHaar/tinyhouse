import React, { useState } from "react"
import { useQuery } from "@apollo/client"
import { Col, Layout, Row } from "antd"
import { RouteComponentProps } from "react-router-dom"

import { UserBookings, UserListings, UserProfile } from './components'
import { PageSkeleton, ErrorBanner } from "../../lib/components"

import { USER } from "../../graphql/queries"
import {
  User as UserData,
  UserVariables
} from "../../graphql/queries/User/__generated__/User"
import { Viewer } from "../../lib/types"

interface Props {
  viewer: Viewer
  setViewer: (viewer: Viewer) => void
}

interface MatchParams {
  id: string
}

const { Content } = Layout;

const PAGE_LIMIT = 4

export const User = ({ match, viewer, setViewer }: Props & RouteComponentProps<MatchParams>) => {
  const [listingsPage, setListingsPage] = useState(1)
  const [bookingsPage, setBookingsPage] = useState(1)

  const { data, loading, error, refetch } = useQuery<UserData, UserVariables>(
    USER, {
      variables: {
        id: match.params.id,
        bookingsPage,
        listingsPage,
        limit: PAGE_LIMIT
      },
      fetchPolicy: 'cache-and-network'
    })

  const handleUserRefetch = async () => {
    console.log('refetching...')
    await refetch()
  }

  const stripeError = new URL(window.location.href).searchParams.get('stripe_error')

    const stripeErrorBanner = stripeError ? (
      <ErrorBanner description="We had an issue connecting to strip, please try again" />
    ) : null

  if (loading) {
    return (
      <Content className="user">
        <PageSkeleton />
      </Content>
    );
  }

  if (error) {
    return (
      <Content className="user">
        <ErrorBanner description="This user may not exist or we've encountered an error. Please try again soon." />
        <PageSkeleton />
      </Content>
    );
  }

  const user = data ? data.user : null
  const viewerIsUser = viewer.id === match.params.id

  const userListings = user ? user.listings : null
  const userBookings = user ? user.bookings : null

  const userListingsElement = userListings ?
    <UserListings
      userListings={userListings}
      listingsPage={listingsPage}
      limit={PAGE_LIMIT}
      setListingsPage={setListingsPage}
    /> : null

  const userBookingsElement = userBookings ?
    <UserBookings
      userBookings={userBookings}
      bookingsPage={bookingsPage}
      limit={PAGE_LIMIT}
      setBookingsPage={setBookingsPage}
    /> : null
  const userProfileElement = user ? <UserProfile user={user} viewer={viewer} setViewer={setViewer} viewerIsUser={viewerIsUser} handleUserRefetch={handleUserRefetch} /> : null

  return (
    <Content className="user">
      {stripeErrorBanner}
      <Row gutter={12}>
        <Col xs={24}>{userProfileElement}</Col>
        <Col xs={24}>{userListingsElement}</Col>
        <Col xs={24}>{userBookingsElement}</Col>
      </Row>
    </Content>
  )
}