import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { createClient } from "graphql-ws"
import { getMainDefinition } from "@apollo/client/utilities"

// HTTP Link pour les requêtes et mutations
const httpLinkMicroservice3 = new HttpLink({
  uri: "http://localhost:3003/graphql",
})

// WebSocket Link pour les subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:3003/graphql",
    connectionParams: () => ({
      authToken: localStorage.getItem("access_token"),
    }),
  }),
)

// Auth Link
const authLinkMicroservice3 = setContext((_, { headers }) => {
  const token = localStorage.getItem("access_token")
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  }
})

// Split link pour router entre HTTP et WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return definition.kind === "OperationDefinition" && definition.operation === "subscription"
  },
  wsLink,
  authLinkMicroservice3.concat(httpLinkMicroservice3),
)

export const clientMicroservice3 = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})
