
import { gql } from '@apollo/client';

// Requête pour récupérer toutes les commandes
export const GET_ORDERS = gql`
  query GetOrders {
    orders {
      _id
      status
      partnerId
      driverId
    }
  }
`;
export const GET_USERS_BY_ROLE = gql`
  query GetUsersByRole($role: String!) {
    getUsersByRole(role: $role) {
      _id
      name
      email
      role
    }
  }
`;
// Mutation pour assigner un chauffeur à une commande
export const ASSIGN_ORDERS_TO_DRIVER = gql`
  mutation AssignOrdersToDriver($orderIds: [String!]!, $driverId: String!) {
  assignOrdersToDriver(orderIds: $orderIds, driverId: $driverId) {
    _id
    driverId
  }
}
`;

// Mutation pour mettre à jour le statut d'une commande
export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: String!, $status: OrderStatus!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      _id
      status
    }
  }
`;


export const GET_ORDER_HISTORY = gql`
  query orderHistory($orderId: String!) {
    orderHistory(orderId: $orderId) {
      driverId
      adminId
      assisatnAdminId
      partnerId
      event
      etatPrecedent
      timestamp
    }
  }
`

