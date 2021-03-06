var extend = require('obj-extend');
var fs= require('fs');
var Lynx = require('lynx');

var DEBUG_ESR = require('debug')('Test:esr');

module.exports = function expressStatsdInit (options) {
  options = extend({
    requestKey: 'statsdKey',
    host: '127.0.0.1',
    port: 8125
  }, options);

  var client = options.client || new Lynx(options.host, options.port, options);

  return function expressStatsd (req, res, next) {
    var dateNow = new Date();
    var startTime = dateNow.getTime();

    // Function called on response finish that sends stats to statsd
    function sendStats() {
      var keyPrefix = options.keyPrefix || 'esr.';
      var key = '';
      if(typeof options.keyGeneFunc === 'function'){
          key  = options.keyGeneFunc(req, res);
      }

      if(key){
        DEBUG_ESR('Send Timing with keyPrefix: %s key: %s', keyPrefix, key);
        // Response Time
        var duration = new Date().getTime() - startTime;
        client.timing(keyPrefix + key , duration);
        client.timing(keyPrefix + 'recv.comm', duration);
        // 添加超时日志记录
        if(options.recordTimeout && duration > options.recordTimeout){
            var str = `${dateNow.toISOString()} ${duration}ms ${req.method} ${res.statusCode} ${req.protocol}://${req.host}${req.url} ${JSON.stringify(req.headers)} ${JSON.stringify(req.body)}\n`;
            fs.appendFile(options.recordLog, str);
        }

        cleanup();
      }else{
        cleanup();
      }
    }

    // Function to clean up the listeners we've added
    function cleanup() {
      res.removeListener('finish', sendStats);
      res.removeListener('error', cleanup);
      res.removeListener('close', cleanup);
    }

    // Add response listeners
    res.once('finish', sendStats);
    res.once('error', cleanup);
    res.once('close', cleanup);

    if (next) {
      next();
    }
  };
};
