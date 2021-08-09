import React from "react"
import { Button, Card, DatePicker, Divider, Tooltip, Typography } from "antd"
import moment, { Moment } from "moment"

import { displayErrorMessage, formatListingPrice } from "../../../../lib/utils"
import { Viewer } from "../../../../lib/types"
import { Listing } from "../../../../graphql/queries/Listing/__generated__/Listing"
import { BookingsIndex } from './types'

const { Paragraph, Text, Title } = Typography

interface Props {
  bookingsIndex: Listing['listing']['bookingsIndex']
  checkInDate: Moment | null
  checkOutDate: Moment | null
  host: Listing['listing']['host']
  price: number
  viewer: Viewer
  setModalVisible: (modalIsVisible: boolean) => void
  setCheckInDate: (checkInDate: Moment | null) => void
  setCheckOutDate: (checkOutDate: Moment | null) => void
}

export const ListingCreateBooking = ({
  bookingsIndex,
  checkInDate,
  checkOutDate,
  host,
  price,
  viewer,
  setModalVisible,
  setCheckInDate,
  setCheckOutDate
}: Props) => {
  const bookingsIndexJSON: BookingsIndex = JSON.parse(bookingsIndex)

  const dateIsBooked = (currentDate: Moment) => {
    const year = moment(currentDate).year()
    const month = moment(currentDate).month()
    const day = moment(currentDate).date()

    if (bookingsIndexJSON[year] && bookingsIndexJSON[year][month]) {
      return Boolean(bookingsIndexJSON[year][month][day])
    } else {
      return false
    }
  }

  const disabledDate =(currentDate: Moment) => {
    if (currentDate) {
      const dateIsBeforeEndOfDay = currentDate.isBefore(moment().endOf('day'))
      const dateIsInTheFarFuture = moment(currentDate).isAfter(
        moment().endOf('days').add(90, 'days')
      )

      return (
        dateIsBeforeEndOfDay ||
        dateIsInTheFarFuture ||
        dateIsBooked(currentDate)
      )
    } else return false
  }

  const verifyDate = (selectedCheckOutDate: Moment | null) => {
    if (checkInDate && selectedCheckOutDate) {
      if (moment(selectedCheckOutDate).isBefore(checkInDate, 'days')) {
        return displayErrorMessage('You cant select check out dates to be prior to check in dates')
      }
    }

    let dateCursor = checkInDate

    while(moment(dateCursor).isBefore(selectedCheckOutDate, "days")) {
      dateCursor = moment(dateCursor).add(1, 'days')

      const year = moment(dateCursor).year()
      const month = moment(dateCursor).month()
      const day = moment(dateCursor).date()

      if (bookingsIndexJSON[year] && bookingsIndexJSON[year][month] && bookingsIndexJSON[year][month][day]) {
        return displayErrorMessage('This is not possible, the dates are already booked')
      }
    }

    setCheckOutDate(selectedCheckOutDate)
  }

  const viewerIsHost = viewer.id === host.id
  const checkInInputDisabled = viewerIsHost || !viewer.id || !host.hasWallet
  const checkOutInputDisabled = checkInInputDisabled || !checkInDate
  const buttonDisabled = checkInInputDisabled || !checkInDate || !checkOutDate

  let buttonMessage = "you won't be charged yet"

  if(!viewer.id) {
    buttonMessage = "Sign in to book this"
  } else if (viewerIsHost) {
    buttonMessage = "You can't book your own listing, why would you?"
  } else if (!host.hasWallet) {
    buttonMessage = "This user is disconnected from stripe"
  }

  return (
    <div className="listing-booking">
      <Card className="listing-booking__card">
        <div>
          <Paragraph>
            <Title level={2} className="listing-booking__card-title">
              {formatListingPrice(price)}
              <span>/day</span>
            </Title>
          </Paragraph>
          <Divider />
          <div className="listing-booking__card-date-picker">
            <Paragraph strong>Check In:</Paragraph>
            <DatePicker
              value={checkInDate ? checkInDate : undefined}
              onChange={(val) => setCheckInDate(val)}
              onOpenChange={() => setCheckOutDate(null)}
              dateRender={current => {
                if (
                  moment(current).isSame(checkInDate ? checkInDate : undefined, "day")
                ) {
                  return (
                    <Tooltip title="Check in date">
                      <div className="ant-calendar-date ant-calendar-date__check-in">
                        {current.date()}
                      </div>
                    </Tooltip>
                  );
                } else {
                  return <div className="ant-calendar-date">{current.date()}</div>;
                }
              }}
              disabledDate={disabledDate}
              disabled={checkInInputDisabled}
              showToday={false}
              format={'YYYY/MM/DD'}
              renderExtraFooter={() => (
                <div>
                  <Text type="secondary" className="ant-calendar-footer-text">
                    You can only book a listing within 90 days from today
                  </Text>
                </div>
              )}
            />
          </div>
          <div className="listing-booking__card-date-picker">
            <Paragraph strong>Check Out:</Paragraph>
            <DatePicker
              value={checkOutDate ? checkOutDate : undefined}
              onChange={(val) => verifyDate(val)}
              disabledDate={disabledDate}
              disabled={checkOutInputDisabled}
              showToday={false}
              format={'DD/MM/YYYY'}
              renderExtraFooter={() => (
                <div>
                  <Text type="secondary" className="ant-calendar-footer-text">
                    Check-out can't be before check-in
                  </Text>
                </div>
              )}
            />
          </div>
        </div>
        <Divider />
        <Button size="large" type="primary" className="listing-booking__card-cta" disabled={buttonDisabled} onClick={() => setModalVisible(true)}>
          Request to book!
        </Button>
        <Text mark>{buttonMessage}</Text>
      </Card>
    </div>
  )
}