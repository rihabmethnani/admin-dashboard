import { gql } from '@apollo/client';

export const VALIDATE_PARTNER = gql`
  mutation ValidatePartner($partnerId: String!) {
    validatePartner(partnerId: $partnerId) {
      _id
      name
      email
      isValid
    }
  }
`;

export const UPDATE_DRIVER = gql`
  mutation UpdateDriver($id: String!, $updateUserDto: UpdateUserDto!) {
    updateDriver(id: $id, updateUserDto: $updateUserDto) {
      _id
      name
      email
      phone
      address
      image
    }
  }
`;