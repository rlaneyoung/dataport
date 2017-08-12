const { EventEmitter } = require('events');
/**
  * Class representing a newly created Port.
  * @param {String} name The name of the Port
  *
  * @extends EventEmitter
  */
module.exports = class Port extends EventEmitter {
  constructor(name){
    super();
    const Port = this;
    Port.name = name;
    Port.conditions  = [];
    Port.routes = [];

    /* Bind Class methods to Class */
    Port.set = Port.set.bind(Port);
    Port.route = Port.route.bind(Port);
  }

/**
  * Function to set a new condition test. If routed data passes this test, it
  * triggers the function.
  *
  * @param {Object|Function} condition The object or function to test received data with.
  * @param {Function} handler The function to call if condition test passes.
  */
  set(condition, handler){
    const Port = this;
    Port.conditions.push({
      condition,
      handler
    });
  }

/**
  * Function to create a new data route. Data comes from route function, runs through condition
  * tests, then goes to destination function.
  *
  * @param {String} route Name for newly created route.
  * @param {Function} destination Final function to be called after all condition tests.
  */
  createRoute(route, destination){
    const Port = this;
    Port.routes[route] = { destination };
  }


/**
  * Routing function for this dataport. Used as the 'input' function.
  *
  * @param {String} route The name of the target route.
  * @param {JSON} data Data to be parsed and then routed through target route.
  */
  route(route, data){
    const Port = this;
    Port.emit("launch", data);

  /**
    * Condition Tests - In case of Object, data must contain
    * equivalent key value pairs to pass. In case of Function, function must return true.
    * If data passes a test, it is then processed by the handler function attached to that condition object.
    */
    const conditions = Port.conditions;

    // First we filter out any condition tests that our data did not pass.
    conditions.filter(function(condition){
      let conditional = condition.condition;

      // If condition test is a function, return output of function; true or false.
      if(typeof conditional === "function"){
        return conditional(data);
      } // Else If condition test is an object, return true if all key value pairs in data match
      else if(typeof conditional === "object"){

        let keys = Object.keys(conditional);
        let matches = keys.filter(function(c){
          return conditional[c] == data[c];
        });
        if(matches.length == keys.length){
          return true;
        }
        return false;
      }

    // Run the handler functions for each passed condition in sequence.
    }).forEach(function(condition){
      let fnReturn = condition.handler(data);
      data = Boolean(fnReturn) ? fnReturn : data;
    });

    Port.emit("landing", data);

    let output = Port.routes[route].destination.call(Port, data);

    Port.emit("arrived", output);
  }
}
