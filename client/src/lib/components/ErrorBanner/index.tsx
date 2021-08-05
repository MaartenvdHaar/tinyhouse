import React from 'react'
import { Alert } from 'antd'

interface Props {
  description?: string
  message?: string
}

export const ErrorBanner: React.FC<Props> = ({
  description = 'Try again later',
  message =  'Uh oh!'
}) => (
  <Alert banner closable message={message} description={description} type="error" className="error-banner" />
)