const port = require('./port');
/**
  * Class representing DataPort - a node module for routing and processing data.
  */
class dataport{

  constructor(){
    const dataport = this;
    dataport.ports = {};
    dataport.createPort = dataport.createPort.bind(dataport);
  }


  createPort(name){
    const dataport = this;
    dataport.ports[name] = new port;
    return dataport.ports[name];
  }

}

module.exports = new dataport;
