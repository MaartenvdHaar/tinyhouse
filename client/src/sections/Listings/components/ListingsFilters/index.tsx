import React from 'react'
import { Select } from 'antd'
import { ListingsFilter } from '../../../../graphql/globalTypes'

interface Props {
  filter: ListingsFilter
  setFilter: (filter: ListingsFilter) => void
}

const { Option } = Select

export const ListingsFilters = ({ filter, setFilter }: Props) => (
  <div className="listings-filters">
    <span>Filter By</span>
    <Select value={filter} onChange={(filter: ListingsFilter) => setFilter(filter)}>
      <Option value={ListingsFilter.PRICE_LOW_TO_HIGH}>Price: low to high</Option>
      <Option value={ListingsFilter.PRICE_HIGH_TO_LOW}>Price: high to low</Option>
    </Select>
  </div>
)
