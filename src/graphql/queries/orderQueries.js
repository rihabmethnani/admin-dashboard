// src/graphql/queries/orderQueries.js

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

// Mutation pour assigner un chauffeur à une commande
export const ASSIGN_DRIVER_TO_ORDER = gql`
  mutation AssignDriverToOrder($orderId: String!, $driverId: String!) {
    assignOrderToDriver(orderId: $orderId, driverId: $driverId) {
      _id
      status
      driverId
    }
  }
`;

// Mutation pour mettre à jour le statut d'une commande
export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: String!, $status: String!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      _id
      status
    }
  }
`;

// Requête pour récupérer l'historique d'une commande
export const GET_ORDER_HISTORY = gql`
  query GetOrderHistory($orderId: String!) {
    orderHistory(orderId: $orderId) {
      event
      details
      timestamp
    }
  }
`;