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
     * Determines if a callback param was specified by the
     * client.  Look for the param in the query string first 
     * as this is the most typical use case for jsonp, ie the
     * use of a script tag for integration.  Fall back to the 
     * req.body which would be set by the bodyDecoder filter
     * if it is included in the middleware pipeline.
     */
    function callback(req) {
        var query = url.parse(req.url, true).query;
        if (query && query['callback']) {
            req.callback = query['callback'];

        } else if (req.body && req.body['callback'])  {
            req.callback = req.body['callback'];
        }
    
        return req.callback;       
    };

    function previous(statusCode, headers, context, res) {
        res.writeHead = context.writeHead;
        res.writeHead(statusCode, headers);	
    };

    /**
     * Response decorator that pads the response with a jsonp callback.
     * 
     * Changes nothing if the 'callback' param is absent.
     */ 
    return function jsonp(req, res, next) {
        if (!callback(req)) next();

        var context = {
            writeHead: res.writeHead,
            write: res.write,
            end: res.end    
        };   
    
        res.writeHead = function(statusCode, headers) {
            if (statusCode === 200) { 
                headers['Content-Type'] = 'application/javascript';
                res.write = function(chunk, encoding) {
                    res.write = context.write;
                    res.write(req.callback + '(' + chunk);
                }    
           
                res.end = function(chunk, encoding) {
                    res.write(chunk ? chunk + ')' : ')');
                    res.end = context.end;
                    res.end();
                };
    
                previous(statusCode, headers, context, res);

            } else {
                previous(statusCode, headers, context, res);
            }   
        };

        next();
    };
};