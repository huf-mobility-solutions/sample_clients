const {
    ApolloClient,
    InMemoryCache,
    gql,
    HttpLink,
    split,
} = require('@apollo/client/core')
const { getMainDefinition } = require('@apollo/client/utilities')

const fetch = require('cross-fetch')

const AbsintheSocket = require('@absinthe/socket')
const { createAbsintheSocketLink } = require('@absinthe/socket-apollo-link')
const { Socket } = require('phoenix-channels')

// Replace with your own bearer token
const token = 'YOUR TOKEN'

// Authenticated HTTP link for executing queries
const httpLink = new HttpLink({ 
    uri: 'https://telemetry.prod.liberkee.com/api/graphql',
    headers: {
        Authorization: `Bearer ${token}`,
    },
    fetch,
})

// This Phoenix socket is needed specifically for the liberkee realtime 
// telemetry API to handle subscriptions
const socket = new Socket(
    'wss://telemetry.prod.liberkee.com/socket',
    {
        params: { Authorization: `Bearer ${token}` }
    },
)

const absintheSocket = AbsintheSocket.create(socket)

// As liberkee uses Absinthe as a GraphQL server, we need a specific WebSocket
// link as there is a specialized protocol 
const absintheLink = createAbsintheSocketLink(absintheSocket)

// The split link combines both HTTP and WebSocket links dependening on the
// operation that will be executed
const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    absintheLink,
    httpLink,
)

// The resulting Apollo client will support both queries/mutations and 
// subscriptions
const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
})

// This is a sample that runs a query and takes the result to subscribe to 
// vehicle location data
const run = async () => {
    // Run a query to get all vehicleReferences in 'liberkee_demo_fleet'
    const { data } = await client.query({ query: gql`
        query {
            fleetVehicles(fleetName: "liberkee_demo_fleet") {
                vehicleReference
            }
        }
    `})

    // Use the first vehicleReference
    const vehicleReference = data.fleetVehicles[0].vehicleReference

    console.log('Vehicle Reference:', vehicleReference)

    // Run the GraphQL subscription to get the location data for the specified 
    // vehicle. This returns an Observable.
    const locations = client.subscribe({ 
        query: gql`
            subscription LocationReport($vehicleReference: String!) {
                locationReport(vehicleReferenceOrCustomer: $vehicleReference) {
                    latitude
                    longitude
                }
            },
        `, 
        variables: {
            vehicleReference,
        },
    })

    // You need to subscribe to the Observable to get the location report data
    locations.subscribe({ 
        next: ({ data }) => {
            const { latitude, longitude } = data.locationReport

            console.log(`Location Report: (${latitude}, ${longitude})`)
        },
        error: (error) => {
            console.error(error)
        },
    })
}

run()
    .catch(error => console.error(error))
