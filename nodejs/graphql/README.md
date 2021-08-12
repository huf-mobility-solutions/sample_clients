# GraphQL Node Sample Client

This repository contains a sample client that shows how to interact with the
liberkee Realtime Telemetry API using GraphQL.

## Setup

Follow these steps to get up and running

1. Install the dependencies:

   ```shell
   $ npm install
   ```

2. Replace `'YOUR_TOKEN'` with a valid JWT bearer token in the following line:

   ```js
   // Replace with your own bearer token
   const token = 'YOUR TOKEN'
   ```

## Try it out

To start the application you simply need to run `npm start`. The application 
should then load all vehicle references of the demo fleet and print out the 
first one. After that it subscribes to the location reports of the first 
vehicle. It will print out latitude and longitude every time the location 
changes.
