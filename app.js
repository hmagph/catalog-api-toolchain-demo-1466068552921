/*globals discoveryService:true cloudantService:true*/
/*eslint-env node, express*/
var express = require('express');
var bodyParser = require('body-parser');
var cfenv = require("cfenv");
var path = require('path');
var cors = require('cors');
var discovery = require('bluemix-service-discovery');

//Setup Cloudant Service.
var appEnv = cfenv.getAppEnv();
cloudantService = appEnv.getService("myMicroservicesCloudant");
var items = require('./routes/items');

console.log("VCAP: " + JSON.stringify(appEnv));

//Setup Service Discovery
var sdcreds = appEnv.getService("myMicroservicesDiscovery").credentials;
discoveryService = new discovery({
  name: 'ServiceDiscovery',
  auth_token: sdcreds.auth_token,
  url: sdcreds.url,
  version: 1
});
discoveryService.register({
  "service_name": "catalog_api",
  "ttl": 10,
  "endpoint": {
    "host": appEnv.url //,
    //"port": appEnv.port
  },
  "metadata": {}
}, function(error, response, service) {
  if (!error) {
    var intervalId = setInterval(function() {
      discoveryService.renew(service.id, function(error, response, service) {
        if (error || response.statusCode !== 200) {
          console.log('Could not send heartbeat');
          clearInterval(intervalId);
        }
      });
    }, 2000);
  }
});

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


