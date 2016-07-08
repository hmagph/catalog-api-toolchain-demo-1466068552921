/*globals discovery:true cloudantService:true*/
/*eslint-env node, express*/
var express = require('express');
var bodyParser = require('body-parser');
var cfenv = require("cfenv");
var path = require('path');
var cors = require('cors');
var ServiceDiscovery = require('bluemix-service-discovery');

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


//Setup Service Discovery
var sdcreds = appEnv.getService("myMicroservicesDiscovery").credentials;
discovery = new ServiceDiscovery({
  name: 'ServiceDiscovery',
  auth_token: sdcreds.auth_token,
  url: sdcreds.url,
  version: 1
});

var service_instance = {
  service_name: 'catalog-api',
  ttl: 30, // 30s
  endpoint: {
    type: 'http',
    value: appEnv.url
  },
  metadata: {
//    foo: 'bar'
  }
};

// Register and then send a heartbeat (renew)
discovery.register(service_instance, function(err, response, body) {
  if (!err && response.statusCode === 201) {
    var id = body.id;
    console.log('Registered', body);
    setInterval(function() {
      discovery.renew(id, function(err, response) {
        if (!err && response.statusCode === 200) {
          console.log('HEARTBEAT OK');
        } else {
          console.log('HEARTBEAT ERROR');
        }
      });
    }, 3000);
  }
});