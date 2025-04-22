// src/apolloClients/microservice2.js

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLinkMicroservice2 = new HttpLink({
  uri: 'http://localhost:3001/graphql', // Endpoint du second microservice
});

const authLinkMicroservice2 = setContext((_, { headers }) => {
  const token = localStorage.getItem('access_token'); // Utilisez le même token ou un autre si nécessaire
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const clientMicroservice2 = new ApolloClient({
  link: authLinkMicroservice2.concat(httpLinkMicroservice2),
  cache: new InMemoryCache(),
});