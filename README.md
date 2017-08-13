# dataport





`dataport` is a simple javascript data routing module for creating intelligent interaction with incoming and outgoing data for any context.

#### - Version: 1.0.2

## Table of Contents

* [Installing](#installing)
* [Getting Started](#getting-started)
* [Usage and Examples](#usage-and-examples)
  + [Basic Routing](#basic-routing)
  + [Broadcasting with WebSockets](#broadcasting-with-websockets)
  + [Creating A.I. with 'Conditions'](#creating-ai-with-conditions)
  + [Conditions as functions](#conditions-as-functions)
  + [Lifecycle Events](#lifecycle-events)


## Installing

```
npm install dataport --save
```

## Getting Started

```js
const dataport = require('dataport');
const port = dataport.createPort();
```

### Usage and Examples

### Basic Routing

`dataport` handles data flow through the use of 'ports' and 'routes'. Ports extend Node.js'
built in `EventEmitter` and have various lifecycle events which are emitted every time data passes through the port. Routes are used for routing data through a port - we specify a name and destination function when we create a route, and use the port.route function to send input data to the route. If we wanted all data from an arbitrary SOURCE to be routed through the port with the console as our destination, it would look like this:

```js
const dataport = require('dataport');
const port = dataport.createPort();

//We specify console.log as our destination function for this route
port.createRoute("routeOne", console.log);

//When SOURCE emits an incomindData event, we pass that data to routeOne
SOURCE.on("incomingData", function(data){
  port.route("routeOne", data);
};
```

### Broadcasting with WebSockets

`dataport` excels when it comes to WebSockets. Here is a basic example of how we could handle broadcasting to WebSocket channels:

```js
const dataport = require('dataport');
const port = dataport.createPort();

const io = /* WebSocket Library */;

//Create an array to store new socket connections
port.webSocketChannel = [];

//It is good practice to name your route something that is descriptive of it's destination
port.createRoute("broadcast", function broadcast(data){
  port.webSocketChannel.forEach(function(socket){
    socket.send(data);
  });
});

//Push any new socket connections to our channel array
io.on("connection", function(socket){
  port.webSocketChannel.push(socket);

  //Set event listener for incoming message on that socket to be routed to broadcast function
  socket.on('message', function(data){
    port.route("broadcast", data);
  });
});
```

### Creating A.I. with 'Conditions'

Building on our WebSocket example, let's explore a key feature of dataport - Conditions.
Conditions act as Middleware for all data that is routed through a port. Conditions are objects containing a test and a handler function. Incoming data is checked against our test and if it passes, is run through the handler. When data is handled by the handler function for any condition, the return value of the handler function takes place of the data from that point on in the lifecycle of that message. This allows us to modify data in any way we want in response to our conditions. If no return value is specified, the data is unchanged. If we wanted all messages on a specified channel to be forced to Upper Case, we could do something like this:

```js

...
//Set a condition with port.set
port.set({channel: "UPPERCASE"}, function(data){

  data.body = data.body.toUpperCase();

  return data;
});

...

```


### Conditions as functions

Tests can be either Objects or Functions. If we wanted to block any messages containing words found in a blacklist, we could do so using a condition with a test function:

```js

const blacklist = ["block", "all", "of", "these", "words"];

/*
 * If data passes first function - meaning a blacklisted word is found - pass to     
 * handler which will set broadcast to false.
 */
port.set(function wordInBlacklist(data){
  let wordCheck = data.body.split(" "); //

  //Return any words found in blacklist
  wordCheck.filter(function(word){
    return ~blacklist.indexOf(word);
  });

  //If wordCheck.length > 0 the handler function will be triggered
  return wordCheck.length;

}, function(data){
  data.broadcast = false;

  return data;
});

```

Now we can check for data.broadcast in our broadcast function before broadcasting.


### Lifecycle Events

Each port has 3 lifecycle events. 'launch', 'landing', and 'arrived'.
The data cannot be modified by these events. However, by nature of lexical scope, the Port Object is exposed to each event and can therefor be modified. Hypothetically, if you wanted to modify data from within the 'launch' event, you could dynamically create a condition for that data from within the event, then delete that condition from a later event.
The 'launch' event emits as soon as data begins routing through the port. No modifications have been made to the data at this point. The 'landing' event occurs immediately after condition checks and is given the exact same data as will be delivered to the destination function. The 'arrived' event occurs immediately after the destination function is called, and is passed the return value of the destination function. This allows us to feed information about the destination to `dataport`.

Here's an example of how we could log broadcast information using events.

```js
...

port.webSocketChannel = [];

...

port.createRoute("broadcast", function(data){
  let errors = [];
  port.webSocketChannel.forEach(function(socket){
    try{
      socket.send(data);
    }
    catch(err){
      errors.push(err);
    }
  });

  return {
    body: data.body,
    errors
  };

})

port.on('launch', function(message){
  console.log("Message received:", message.body);
});
port.on("landing", function(message){
  console.log("Message will be broadcasted:", message.body);
});
port.on("arrived", function(broadcast){
  let errors = broadcast.errors;
  console.log(`Broadcast complete with ${errors.length} errors.`);
  if(errors.length){
    console.log(errors);
  }
});

```
