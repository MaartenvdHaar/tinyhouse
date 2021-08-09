import React, { useEffect, useRef } from 'react'
import { useMutation } from '@apollo/client'
import { Layout, Spin } from 'antd'
import { Redirect, useHistory } from 'react-router-dom'

import { CONNECT_STRIPE } from '../../graphql/mutations'
import {
  ConnectStripe as ConnectStripeData,
  ConnectStripeVariables } from '../../graphql/mutations/ConnectStripe/__generated__/ConnectStripe'
import { Viewer } from '../../lib/types'
import { displaySuccessNotification } from '../../lib/utils'

interface Props {
  viewer: Viewer
  setViewer: (viewer: Viewer) => void
}

const { Content } = Layout

export const Stripe = ({ viewer, setViewer }: Props) => {
  const [connectStripe, { data, loading, error }] = useMutation<
    ConnectStripeData,
    ConnectStripeVariables
  >(CONNECT_STRIPE, {
    onCompleted: data => {
      if (data && data.connectStripe) {
        setViewer({ ...viewer, hasWallet: data.connectStripe.hasWallet })
        displaySuccessNotification('Succesfully connected to Stripe', 'You now can begin te create listings!')
      }
    }
  })

  const history = useHistory()
  const connectStripeRef = useRef(connectStripe)

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code')

    if (viewer && code) {
      connectStripeRef.current({
        variables: {
          input: { code }
        }
      })
    } else {
      history.replace('/login')
    }
  }, [viewer, history])

  if (data && data.connectStripe) {
    return <Redirect to={`/user/${viewer.id}`} />
  }

  if (loading) {
    return (
      <Content className="stripe">
        <Spin size="large" tip="Connecting to stripe..." />
      </Content>
    )
  }

  if (error) {
    return <Redirect to={`/user/${viewer.id}?stripe_error=true`} />
  }

  return null
}