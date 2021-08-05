import React from 'react'
import { KeyOutlined } from "@ant-design/icons"
import { useMutation } from '@apollo/client';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button, Divider, Modal, Typography } from 'antd'
import moment, { Moment } from 'moment'

import { CreateBooking as CreateBookingData, CreateBookingVariables } from '../../../../graphql/mutations/CreateBooking/__generated__/CreateBooking'
import { CREATE_BOOKING } from '../../../../graphql/mutations/CreateBooking'
import { displayErrorMessage, displaySuccessNotification, formatListingPrice } from '../../../../lib/utils'

interface Props {
  checkInDate: Moment
  checkOutDate: Moment
  id: string
  modalVisible: boolean
  price: number
  clearBookingData: () => void
  handleListingRefetch: () => Promise<void>
  setModalVisible: (modalVisible: boolean) => void
}

const { Paragraph, Text, Title } = Typography

export const ListingCreateBookingModal = ({
  checkInDate,
  checkOutDate,
  id,
  modalVisible,
  price,
  clearBookingData,
  handleListingRefetch,
  setModalVisible
}: Props) => {
  // Get a reference to Stripe or Elements using hooks.
  const stripe = useStripe()
  const elements = useElements()

  const daysBooked = checkOutDate.diff(checkInDate, 'days') + 1
  const listingPrice = price * daysBooked

  const [createBooking, { loading }] = useMutation<CreateBookingData, CreateBookingVariables>(CREATE_BOOKING, {
    onCompleted: () => {
      clearBookingData()
      displaySuccessNotification(
        'You succedfully booked a Listing with Stripe',
        'Booking history can always be found in your user page'
      )
      handleListingRefetch()
    },
    onError: (error) => {
      console.log(error)
      displayErrorMessage('We couldnt complete your booking with Stripe')
    }

  })

  const handleCreateBooking = async () => {
    // Use elements.getElement to get a reference to the mounted Element.
    const cardElement = elements?.getElement(CardElement);
    if (!stripe || !cardElement) return displayErrorMessage('Sorry, we couldnt connect with Stripe')

    let { token: stripeToken, error } = await stripe.createToken(cardElement)

    if (stripeToken) {
      createBooking({
        variables: {
          input: {
            id,
            source: stripeToken.id,
            checkIn: moment(checkInDate).format('YYYY-MM-DD'),
            checkOut: moment(checkOutDate).format('YYYY-MM-DD')
          }
        }
      })
    } else {
      displayErrorMessage(error?.message
        ? error.message
        : 'Sorry we werent able to book the listing. PLz try later'
      )
    }
  }

  return (
    <Modal
      visible={modalVisible}
      centered
      footer={null}
      onCancel={() => setModalVisible(false)}
    >
      <div className="listing-booking-modal">
        <div className="listing-booking-modal__intro">
          <Title className="listing-boooking-modal__intro-title">
            <KeyOutlined />
          </Title>
          <Title level={3} className="listing-boooking-modal__intro-title">
            Book your trip
          </Title>
          <Paragraph>
            Enter your payment information to book the listing from the dates between{" "}
            <Text mark strong>
              {moment(checkInDate).format("MMMM Do YYYY")}
            </Text>{" "}
            and{" "}
            <Text mark strong>
              {moment(checkOutDate).format("MMMM Do YYYY")}
            </Text>
            , inclusive.
          </Paragraph>
        </div>
        <Divider />

        <div className="listing-booking-modal__charge-summary">
          <Paragraph>
            {formatListingPrice(price, false)} * {daysBooked} days ={" "}
            <Text strong>{formatListingPrice(listingPrice, false)}</Text>
          </Paragraph>
          <Paragraph className="listing-booking-modal__charge-summary-total">
            Total = <Text mark>{formatListingPrice(listingPrice, false)}</Text>
          </Paragraph>
        </div>

        <Divider />

        <div className="listing-booking-modal__stripe-card-section">
          <CardElement className="listing-booking-modal__stripe-card" options={{ iconStyle: 'solid' }}/>
          <Button size="large" type="primary" disabled={loading} className="listing-booking-modal__cta" onClick={handleCreateBooking}>
            Book
          </Button>
        </div>
      </div>
    </Modal>
  )
}
