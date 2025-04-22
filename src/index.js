// src/index.js

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from 'App';

// Material Dashboard 2 React Context Provider
import { MaterialUIControllerProvider } from 'context';

// Apollo Clients
import { ApolloProvider } from '@apollo/client';

// Auth Context
import { AuthProvider } from 'context/AuthContext';
import { clientMicroservice1 } from 'apolloClients/microservice1';
import { clientMicroservice2 } from 'apolloClients/microservice2';

const container = document.getElementById('app');
const root = createRoot(container);

root.render(
  <BrowserRouter>
    {/* Premier microservice */}
    <ApolloProvider client={clientMicroservice1}>
      {/* Second microservice */}
      <ApolloProvider client={clientMicroservice2}>
        <MaterialUIControllerProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MaterialUIControllerProvider>
      </ApolloProvider>
    </ApolloProvider>
  </BrowserRouter>
);