'use strict';
var express = require('express');
var expressStatsdRoute = require('../');
var app = express();


const DEBUG = require('debug')('Test:statsd');
const PORT = 8080;


app.use(expressStatsdRoute({
    keyPrefix: 'ESRTEST.',
    keyGeneFunc: function(req){
        return req.route && req.route.path.split('/').join('.').substr(1);
    }
}));

app.get('/hello_world/:name', function(req, res){
    res.send('hello world, ' +  req.params['name']);
});

app.get('/your_name', function(req,res){
    res.send('my name is ESR');
});



app.listen(PORT, function(){
    DEBUG('server listen on %d', PORT);
});
