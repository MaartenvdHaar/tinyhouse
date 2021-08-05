import React, { useState } from "react"
import { Link, useHistory, useLocation } from "react-router-dom"
import { Input, Layout } from "antd"

import logo from "../../assets/tinyhouse-logo.png"
import { MenuItems } from "./components"
import { Viewer } from "../../lib/types"
import { displayErrorMessage } from "../../lib/utils"
import { useEffect } from "react"

const { Header } = Layout
const { Search } = Input

interface Props {
  viewer: Viewer
  setViewer: React.Dispatch<React.SetStateAction<Viewer>>
}

export const AppHeader = ({ viewer, setViewer }: Props) => {
  const [search, setSearch] = useState('')
  const history = useHistory()
  const location = useLocation()

  const onSearch = (value: string) => {
    const trimmedValue = value.trim()

    if (trimmedValue) {
      history.push(`/listings/${trimmedValue}`)
    } else {
      displayErrorMessage('Please enter a valid search')
    }
  }

  useEffect(() => {
    const { pathname } = location
    if (!pathname.includes("/listings")) {
      setSearch('')
      return
    }

    const urlSearch = pathname.split('/')[2]

    if (urlSearch) {
      return setSearch(urlSearch)
    }

  }, [location])

  return (
    <Header className="app-header">
      <div className="app-header__logo-search-section">
        <div className="app-header__logo">
          <Link to="/">
            <img src={logo} alt="App logo" />
          </Link>
        </div>
        <div className="app-header__search-input">
          <Search
            placeholder="search 'feanwalden'"
            enterButton
            value={search}
            onChange={e => setSearch(e.target.value)}
            onSearch={onSearch}
          />
        </div>
      </div>
      <div className="app-header__menu-section">
        <MenuItems viewer={viewer} setViewer={setViewer} />
      </div>
    </Header>
  )
}