import { gql } from '@apollo/client';

export const AUTH_URL_STRIPE = gql`
  query AuthUrlStripe {
    authUrlStripe
  }
`;
