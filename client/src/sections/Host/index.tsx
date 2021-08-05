import React, { useState } from "react"
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons"
import { useMutation } from "@apollo/client"
import { Form, Input, InputNumber, Radio, Layout, Typography, Upload, Button } from 'antd'
import { UploadChangeParam } from "antd/lib/upload"
import { Link, Redirect } from "react-router-dom"

import { Store } from "rc-field-form/lib/interface"
import { Viewer } from "../../lib/types"
import { ListingType } from "../../graphql/globalTypes"
import { displayErrorMessage, displaySuccessNotification } from "../../lib/utils"
import {
  HostListing as HostListingData,
  HostListingVariables,
} from "../../graphql/mutations/HostListing/__generated__/HostListing"
import { HOST_LISTING } from "../../graphql/mutations"

interface Props {
  viewer: Viewer
}

const { Content } = Layout
const { Text, Title } = Typography
const { Item } = Form

export const Host = ({ viewer }: Props) => {
  const [imageLoading, setImageLoading] = useState(false)
  const [imageBase64Value, setImageBase64Value] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [hostListing, { loading, data }] = useMutation<
    HostListingData,
    HostListingVariables
  >(HOST_LISTING, {
    onCompleted: () => {
      displaySuccessNotification("You've successfully created your listing!")
    },
    onError: () => {
      displayErrorMessage(
        "Sorry! We weren't able to create your listing. Please try again later."
      )
    },
  })

  const handleHostListing = (values: Store) => {
    const fullAddress = `${values.address}, ${values.city}, ${values.state}, ${values.postalCode}`

    if (imageBase64Value === null) {
      return displayErrorMessage("you'll need an image attached to your form")
    }

    const input = {
      title: values.title,
      description: values.description,
      image: imageBase64Value,
      address: fullAddress,
      type: values.type,
      price: Math.round(values.price * 100),
      numOfGuests: values.numOfGuests,
    }

    hostListing({
      variables: {
        input,
      },
    })
  }


  const onFinishFailed = ({ errorFields }: any) => {
    form.scrollToField(errorFields[0].name)
  }

  const handleImageUpload = (info: UploadChangeParam) => {
    const { file } = info

    if (file.status === "uploading") {
      setImageLoading(true)
      return
    }

    if (file.status === "done" && file.originFileObj) {
      getBase64Value(file.originFileObj, imageBase64Value => {
        setImageBase64Value(imageBase64Value)
        setImageLoading(false)
      })
    }
  }

  if (loading) {
    return (
      <Content className="host-content">
        <div className="host__form-header">
          <Title level={3} className="host__form-title">
            Please wai!
          </Title>
          <Text type="secondary">
            We're creating your listing now
          </Text>
        </div>
      </Content>
    )
  }

  console.log(data)

  if (data && data.hostListing) {
    return <Redirect to={`/listing/${data.hostListing.id}`} />
  }

  if (!viewer.id || !viewer.hasWallet) {
    return (
      <Content className="host-content">
        <div className="host__form-header">
          <Title level={4} className="host__form-title">
            You'll have to be signed in and connected with Stripe to host a listing!
          </Title>
          <Text type="secondary">
            We only allow users who've signed in to our application and have connected
            with Stripe to host new listings. You can sign in at the{" "}
            <Link to="/login">/login</Link> page and connect with Stripe shortly after.
          </Text>
        </div>
      </Content>
    )
  }

  return (
    <Content className="host-content">
      <Form layout="vertical" form={form} name="Register" onFinish={handleHostListing} onFinishFailed={onFinishFailed}>
        <div className="host__form-header">
          <Title level={3} className="host__form-title">
            Hi! Let's get started listing your place.
          </Title>
          <Text type="secondary">
            In this form, we'll collect some basic and additional information about your
            listing.
          </Text>
        </div>

        <Item label="Home Type" name="type" rules={[{
          required: true,
          message: "Please select a home type!"
        }]}>
          <Radio.Group>
            <Radio.Button value={ListingType.APARTMENT}>
              <span>Apartment</span>
            </Radio.Button>
            <Radio.Button value={ListingType.HOUSE}>
              <span>House</span>
            </Radio.Button>
          </Radio.Group>
        </Item>

        <Item label="Max # of Guests" name="numOfGuests" rules={[
          {
            required: true,
            message: "Please enter the max number of guests!"
          }
        ]}>
          <InputNumber min={1} placeholder="4" />
        </Item>

        <Item label="Title" extra="Max character count of 45" name="title" rules={[
          {
            required: true,
            message: "Please enter a title for your listing!"
          }
        ]}>
          <Input maxLength={45} placeholder="The iconic and luxurious Bel-Air mansion" />
        </Item>

        <Item label="Description of listing" extra="Max character count of 400" name="description" rules={[
          {
            required: true,
            message: "Please enter a description for your listing!"
          }
        ]}>
          <Input.TextArea
            rows={3}
            maxLength={400}
            placeholder={`
              Modern, clean, and iconic home of the Fresh Prince.
              Situated in the heart of Bel-Air, Los Angeles.
            `}
          />
        </Item>

        <Item label="Address" name="address" rules={[
          {
            required: true,
            message: "Please enter an address for your listing!"
          }
        ]}>
          <Input placeholder="251 North Bristol Avenue" />
        </Item>

        <Item label="City/Town" name="city" rules={[
          {
            required: true,
            message: "Please enter a city (or region) for your listing!"
          }
        ]}>
          <Input placeholder="Los Angeles" />
        </Item>

        <Item label="State/Province" name="state" rules={[
          {
            required: true,
            message: "Please enter a state for your listing!"
          }
        ]}>
          <Input placeholder="California" />
        </Item>

        <Item label="Zip/Postal Code" name="postalCode" rules={[
          {
            required: true,
            message: "Please enter a zip code for your listing!"
          }
        ]}>
          <Input placeholder="Please enter a zip code for your listing!" />
        </Item>

        <Item
          label="Upload"
          extra="only upload jpg/png under 1mb"
          name="upload"
          rules={[
          {
            required: true,
            message: "Please enter provide an image for your listing!"
          }
        ]}>
          <Upload
            name="image"
            listType="picture-card"
            showUploadList={false}
            customRequest={dummyRequest}
            beforeUpload={beforeImageUpload}
            onChange={handleImageUpload}
          >
            {imageBase64Value ? (
              <img src={imageBase64Value} alt="Listing" />
            ): (
              <div>
                {imageLoading ? <LoadingOutlined /> : <PlusOutlined />}
                <div className="ant-upload-text">Upload</div>
              </div>
            )}
          </Upload>
        </Item>
        <Item label="Price" extra="All prices in $USD/day" name="price" rules={[
          {
            required: true,
            message: "Please enter a price for your listing!"
          }
        ]}>
          <InputNumber min={0} placeholder="120" />
        </Item>

        <Item>
          <Button type="primary" htmlType="submit">Submit</Button>
        </Item>
      </Form>
    </Content>
  )
}

interface dummyProps {
  onSuccess?: any
}

const dummyRequest = ({ onSuccess }: dummyProps) => {
  setTimeout(() => {
    onSuccess("ok", )
  }, 0)
}

const beforeImageUpload = (image: File) => {
  const validImageType = image.type === "image/jpeg" || image.type === "image/png"
  const validImageSize = image.size / 1024 / 1024 < 1

  if (!validImageSize) {
    displayErrorMessage('This is not a correct image size, its too big')
    return false
  }

  if (!validImageType) {
   displayErrorMessage('This is not a correct image type')
   return false
  }

  return validImageType && validImageSize
}

const getBase64Value = (
  img: File | Blob,
  callback: (imageBase64Value: string) => void
) => {
  const reader = new FileReader()
  reader.readAsDataURL(img)
  reader.onload = () => {
    callback(reader.result as string)
  }
}
