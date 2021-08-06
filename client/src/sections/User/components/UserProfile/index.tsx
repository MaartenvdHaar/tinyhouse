import React from "react"
import { useApolloClient, useMutation } from "@apollo/client"
import { Avatar, Button, Card, Divider, Tag, Typography } from "antd"

import { User as UserData } from "../../../../graphql/queries/User/__generated__/User"
import { displayErrorMessage, displaySuccessNotification, formatListingPrice } from "../../../../lib/utils"
import { DISCONNECT_STRIPE } from "../../../../graphql/mutations"
import { DisconnectStripe as DisconnectStripeData } from "../../../../graphql/mutations/DisconnectStripe/__generated__/DisconnectStripe"
import { Viewer } from "../../../../lib/types"
import { AUTH_URL_STRIPE } from '../../../../graphql/queries'
import { AuthUrlStripe as AuthUrlStripeData } from '../../../../graphql/queries/AuthUrlStripe/__generated__/AuthUrlStripe'


const { Paragraph, Text, Title } = Typography


interface Props {
  user: UserData["user"]
  viewer: Viewer
  viewerIsUser: boolean
  handleUserRefetch: () => Promise<void>
  setViewer: (viewer: Viewer) => void
}

export const UserProfile = ({ user, viewer, viewerIsUser, handleUserRefetch, setViewer }: Props) => {
  const client = useApolloClient()

  const [disconnectStripe, { loading }] = useMutation<DisconnectStripeData>(DISCONNECT_STRIPE, {
    onCompleted: data => {
      if (data && data.disconnectStripe) {
        setViewer({ ...viewer, hasWallet: null })
        displaySuccessNotification("You've succesfully disconnected from Stripe", "You'll have to reconnect with Stripe to continue to create listings")
        handleUserRefetch()
      }
    },
    onError: () => {
      displayErrorMessage("We weren't able to disconconnect from Stripe, please try again later")
    }
  })

  const redirectToStripe = async () => {
    const { data } = await client.query<AuthUrlStripeData>({
      query: AUTH_URL_STRIPE,
    });

    window.location.href = data.authUrlStripe;
  };

  const additionalDetails = user.hasWallet ? (
    <>
      <Paragraph>
        <Tag color="green">Stripe Registered</Tag>
      </Paragraph>
      <Paragraph>
        Income earned  {formatListingPrice(user.income || 0)}
      </Paragraph>
      <Button type="primary" className="user-profile__details-cta" loading={loading} onClick={() => disconnectStripe()}>
        DisConnect from Stripe!
      </Button>
    </>
    ) : (
    <>
      <Paragraph>
        Interested in becoming a TinyHouse host? Register with your Stripe account!
      </Paragraph>
      <Button type="primary" className="user-profile__details-cta" onClick={redirectToStripe}>
        Connect with Stripe!
      </Button>
      <Paragraph type="secondary">
        TinyHouse uses{" "}
        <a
          href="https://stripe.com/en-US/connect"
          target="_blank"
          rel="noopener noreferrer"
        >
          Stripe
        </a>{" "}
        to help transfer your earnings in a secure and trusted manner.
      </Paragraph>
    </>
  )

  const additionalDetailsSection = viewerIsUser ? (
    <>
      <Divider />
      <div className="user-profile__details">
        <Title level={4}>Additional Details</Title>
        {additionalDetails}
      </div>
    </>
  ) : null

  return (
    <div className="user-profile">
      <Card className="user-profile__card">
        <div className="user-profile__avatar">
          <Avatar size={100} src={user.avatar} />
        </div>
        <Divider />
        <div className="user-profile__details">
          <Title level={4}>Details</Title>
          <Paragraph>
            Name: <Text strong>{user.name}</Text>
          </Paragraph>
          <Paragraph>
            Contact: <Text strong>{user.contact}</Text>
          </Paragraph>
        </div>
        {additionalDetailsSection}
      </Card>
    </div>
  )
}