import React from 'react'
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from '@apollo/client'
import { setContext } from "@apollo/client/link/context"
import { render } from 'react-dom'
import { BrowserRouter as Router } from 'react-router-dom'
import LogRocket from 'logrocket'

import { App } from './app'
import reportWebVitals from './reportWebVitals'
import "./styles/index.css"

LogRocket.init('mshhij/tinyhoused')

const uri = process.env.NODE_ENV !== 'development' ? '/api' : 'http://localhost:8080/api'
const httpLink = new HttpLink({ uri, credentials: 'include' })

const authLink = setContext((_, { headers }) => {
  const token = sessionStorage.getItem("token")

  return {
    headers: {
      ...headers,
      "X-CSRF-TOKEN": token || "",
    },
  }
})

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: authLink.concat(httpLink),
})

render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <Router>
        <App />
      </Router>
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
