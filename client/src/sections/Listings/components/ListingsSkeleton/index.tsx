import React from "react"
import { Card, List, Skeleton } from "antd"

import listingLoadingCardCover from "../../assets/listing-loading-card-cover.jpeg"

export const ListingsSkeleton = () => {
  const emptyData = [{}, {}, {}, {}, {}, {}, {}, {}]

  return (
    <div className="listings-skeleton">
      <Skeleton paragraph={{ rows: 1 }} />
      <List
        grid={{
          column: 4,
          gutter: 8,
          xs: 1,
          sm: 2,
          lg: 4,
          xl: 6
        }}
        dataSource={emptyData}
        renderItem={() => (
          <List.Item>
            <Card
              cover={
                <div
                  style={{ backgroundImage: `url(${listingLoadingCardCover})` }}
                  className="listings-skeleton__card"
                ></div>
              }
              loading
            />
          </List.Item>
        )}
      />
    </div>
  )
}