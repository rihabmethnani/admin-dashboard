// src/apolloClients/microservice1.js

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLinkMicroservice1 = new HttpLink({
  uri: 'http://localhost:4000/graphql'
});

const authLinkMicroservice1 = setContext((_, { headers }) => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const clientMicroservice1 = new ApolloClient({
  link: authLinkMicroservice1.concat(httpLinkMicroservice1),
  cache: new InMemoryCache(),
});