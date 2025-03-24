/** =========================================================
 * Material Dashboard 2 React - v2.2.0
 =========================================================
 * Product Page: https://www.creative-tim.com/product/material-dashboard-react
 * Copyright 2023 Creative Tim (https://www.creative-tim.com)
 Coded by www.creative-tim.com
 =========================================================
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from 'App';

// Material Dashboard 2 React Context Provider
import { MaterialUIControllerProvider } from 'context';

// Apollo Client
import { ApolloClient, InMemoryCache, ApolloProvider,HttpLink } from '@apollo/client';
import { AuthProvider } from 'context/AuthContext';

const container = document.getElementById('app');
const root = createRoot(container);

import { setContext } from '@apollo/client/link/context';

const httpLink = new HttpLink({
  uri: '/graphql', // Ou http://localhost:4000/graphql
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
root.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <MaterialUIControllerProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MaterialUIControllerProvider>
    </ApolloProvider>
  </BrowserRouter>
);
