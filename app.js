/*globals cloudantService:true */
/*eslint-env node, express*/
var express = require('express');
var bodyParser = require('body-parser');
var cfenv = require("cfenv");
var path = require('path');
var cors = require('cors');
var http = require('http');

//Setup Cloudant Service.
var appEnv = cfenv.getAppEnv();
cloudantService = appEnv.getService("myMicroservicesCloudant");
var items = require('./routes/items');

console.log("VCAP: " + JSON.stringify(appEnv));

//Setup Service Discovery
var serviceDiscovery = appEnv.getService("myMicroserviceDiscovery");
var options = {
  "host": serviceDiscovery.credentials.url,
  "port": 443,
  "path": "/api/v1/instances",
  "postData": "{ 'tags' :[] , 'status' :'UP' , 'service_name' :'catalog-api' , 'ttl' :'300' , 'endpoint' : { 'value' :'xxx.xxx.xxx.xx' , 'type' :'http' } }",
  method: "POST"
};
http.request(options, function(res) {
  console.log("STATUS: " + res.statusCode);
  console.log("HEADERS: " + JSON.stringify(res.headers));
  res.setEncoding("utf8");
  res.on("data", function (chunk) {
    console.log("BODY: " + chunk);
  });
}).end();

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


