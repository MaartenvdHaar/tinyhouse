import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client"
import { Affix, Layout, List, Typography } from "antd"
import { Link, useParams } from "react-router-dom"

import { ErrorBanner, ListingCard } from "../../lib/components"
import { LISTINGS } from "../../graphql/queries"
import {
  Listings as ListingsData,
  ListingsVariables
} from "../../graphql/queries/Listings/__generated__/Listings"
import { ListingsFilter } from "../../graphql/globalTypes"
import { ListingsFilters, ListingsPagination, ListingsSkeleton } from "./components"

const { Text, Title, Paragraph } = Typography

interface MatchParams {
  location: string
}

const { Content } = Layout
const PAGE_LIMIT = 8

export const Listings = () => {
  const { location } = useParams<MatchParams>()
  const locationRef = useRef(location)
  const [filter, setFilter] = useState(ListingsFilter.PRICE_LOW_TO_HIGH)
  const [page, setPage] = useState(1)

  const { loading, data, error } = useQuery<ListingsData, ListingsVariables>(LISTINGS, {
    skip: locationRef.current !== location && page !== 1,
    variables: {
      location,
      filter,
      limit: PAGE_LIMIT,
      page
    }
  })

  useEffect(() => {
    setPage(1)
    locationRef.current = location
  }, [location] )

  const listings = data ? data.listings : null
  const listingsRegion = listings ? listings.region : null

  const listingsSectionElement = listings && listings.result.length ? (
    <div>
      <Affix offsetTop={64}>
        <ListingsPagination
          total={listings.total}
          page={page}
          limit={PAGE_LIMIT}
          setPage={setPage}
        />
        <ListingsFilters filter={filter} setFilter={setFilter} />
      </Affix>
      <List
        grid={{
          column: 4,
          gutter: 8,
          xs: 1,
          sm: 2,
          lg: 4,
          xl: 6
        }}
        dataSource={listings.result}
        renderItem={listing => (
          <List.Item>
            <ListingCard listing={listing} />
          </List.Item>
        )}
      />
    </div>
  ) : (
    <div>
      <Paragraph><Text mark>No listing for {listingsRegion}</Text></Paragraph>
      <Paragraph>Create a <Link to="/host">Listing in this area</Link></Paragraph>
    </div>
  )


  const listingsRegionElement = listingsRegion ? (
    <Title level={3}>Results for "{listingsRegion}"</Title>
  ) : null

  if (loading || error) {
    return (
      <Content className="listings">
        {error && (<ErrorBanner
          description={`
              We either couldn't find anything matching your search or have encountered an error.
              If you're searching for a unique location, try searching again with more common keywords.
            `}
        />)}
        <ListingsSkeleton />
      </Content>
    )
  }

  return (
    <Content className="listings">
      {listingsRegionElement}
      {listingsSectionElement}
    </Content>
  )
}