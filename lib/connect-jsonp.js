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
     * Write out an error.
     */
    function writeError(res, callback) {
        var body = JSON.stringify({
            error: 'method not allowed', 
            description: 'with callback only GET allowed'       
        });
        body = callback + '(' + body + ')';
        res.writeHead(400, {
            'Content-Type': 'application/javascript',
            'Content-Length': body.length
        });
        res.end(body);      
    };    

    /**
     * Unwind
     */
    function previous(statusCode, headers, res, context, body, encoding) {
        res.writeHead = context.writeHead;
        res.writeHead(statusCode, headers); 
        if (body) {
            res.write = context.write;
            res.end = context.end;
            res.end(body, encoding);
        }
    };

    /**
     * Response decorator that pads the response with a callback.
     * Changes nothing if the 'callback' query string param is absent.
     */ 
    return function jsonp(req, res, next) {
        var url = require('url').parse(req.url, true);
        url.query = url.query || {};
        if (!url.query.callback) {
            next();
    
        } else if (req.method != 'GET') {
            writeError(res, url.query.callback);
            return;
        }

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
                    body = url.query.callback + '(' + body + ')';
                    headers['Content-Type'] = 'application/javascript';
                    headers['Content-Length'] = body.length;
                    previous(statusCode, headers, res, context, body, encoding);
                };
    
            } else {
                previous(statusCode, headers, res, context);
            }   
        };

        next();
    };
};