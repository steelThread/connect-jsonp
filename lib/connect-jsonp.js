/*!
 * Copyright(c) 2010 Sean McDaniel <sean.mcdaniel@me.com>
 * MIT Licensed
 */
var url = require('url');

/**
 * Ridiculously simple connect middleware providing JSONP support.
 *
 * @return {Function}
 * @api public
 */
module.exports = function jsonp() { 
    
    /**
     * Response decorator that pads the response with a callback.
     * 
     * Changes nothing if the 'callback' query string param is absent.
     */ 
    return function jsonp(req, res, next) {
        var url = require('url').parse(req.url, true).query || {};
        if (!url.callback) next();

        var context = {
            writeHead: res.writeHead,
            write: res.write,
            end: res.end
        };   
    
        res.writeHead = function(statusCode, headers) {
            if (statusCode === 200) {
                var body = '';
                res.write = function(chunk, encoding) {
                    body += chunk
                }    
                 
                res.end = function(chunk, encoding) {
                    if (chunk) body += chunk;
                    body = url.callback + '(' + body + ')';
                    headers['Content-Type'] = 'application/javascript';
                    headers['Content-Length'] = body.length;
                    res.writeHead = context.writeHead;
                    res.writeHead(statusCode, headers); 

                    res.write = context.write;
                    res.end = context.end;
                    res.end(body);
                };
    
            } else {
                res.writeHead = context.writeHead;
                res.writeHead(statusCode, headers); 
            }   
        };

        next();
    };
};