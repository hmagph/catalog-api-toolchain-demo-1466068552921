/*globals discovery:true cloudantService:true*/
/*eslint-env node, express*/
var express = require('express');
var bodyParser = require('body-parser');
var cfenv = require("cfenv");
var path = require('path');
var cors = require('cors');
var request = require('request');

//Setup Cloudant Service.
var appEnv = cfenv.getAppEnv();
cloudantService = appEnv.getService("myMicroservicesCloudant");
var items = require('./routes/items');

console.log("###VCAP: " + JSON.stringify(appEnv));

//Setup Middleware.
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'www')));

//REST HTTP Methods
app.get('/db/:option', items.dbOptions);
app.get('/items', items.list);
app.get('/fib', items.fib);
app.get('/loadTest', items.loadTest);
app.get('/items/:id', items.find);
app.post('/items', items.create);
app.put('/items/:id', items.update);
app.delete('/items/:id', items.remove);

app.listen(appEnv.port, appEnv.bind);
console.log('App started on ' + appEnv.bind + ':' + appEnv.port);


//Register in service discovery with heatbeat
var disco = appEnv.getService("myMicroservicesDiscovery").credentials;
request({
    url: disco.url + '/api/v1/instances',
    method: 'POST',
    headers: {
  	  'Authorization': 'Bearer ' + disco.auth_token //,
  	  //'Content-Type': 'application/json'
    },
    json: true,
    body: {
      'service_name': appEnv.name,
      //'tags': [],
      //'status': 'UP',
      'ttl' : 300,
      'endpoint': {
      	'type': 'http',
      	'value': appEnv.url
      }    	
    }
  }, function(error, response, body){
    if(error) {
      console.log(error);
    } else {
      console.log("REGISTER: "+ response.statusCode, body);
    }
});


//discovery = new ServiceDiscovery({
//  name: 'ServiceDiscovery',
//  auth_token: sdcreds.auth_token,
//  url: sdcreds.url,
//  version: 1
//});
//discovery.register(
//  {
//    service_name: appEnv.name,
//    ttl: 60, // 60s
//    endpoint: {
//      type: 'http',
//      value: appEnv.url
//    },
//    metadata: {}
//  },
//  function(err, response, body) {
//  if (!err && response.statusCode === 201) {
//    var id = body.id;
//    console.log('Registered', body);
//    setInterval(function() {
//      discovery.renew(id, function(err, response) {
//        if (!err && response.statusCode === 200) {
//          console.log('HEARTBEAT OK');
//        } else {
//          console.log('HEARTBEAT ERROR');
//        }
//      });
//    }, 3000); // 3s
//  } else {
//  	if (err) {
//  		console.error(err);
//  	} else {
//  		console.log("FAIL: " + response.statusCode + response.statusMessage);
//  		console.log(response.headers)
//  	}
//  }
//});