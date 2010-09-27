/*!
 * Ext JS Connect
 * Copyright(c) 2010 Sencha Inc.
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

/**
 * A connect middleware providing JSONP support.
 *
 * @return {Function}
 * @api public
 */
module.exports = function jsonp() { 
    /**
     * Response decorator that pads the response with the appropriate callback 
     * format to support jsonp. Uses the req.body from the bodydecode middleware 
     * if it exists else it will try to parse the form/json request internally 
     * to determine if the callback param was passed.
     * 
     * Changes nothing if the 'callback' param is absent.
     */ 
    return function jsonp(req, res, next) {
        if (!(req.body && req.body['callback'])) next();

        var previous = {
            writeHead: res.writeHead,
            write: res.write,
            end: res.end    
        }   
    
        res.writeHead = function(statusCode, headers) {
            if (statusCode === 200) { 
                headers['Content-Type'] = 'application/javascript';
                res.write = function(chunk, encoding) {
                    res.write = previous.write;
                    res.write(req.body['callback'] + '(' + chunk);
                }    
           
                res.end = function(chunk, encoding) {
                    res.write(chunk ? chunk + ')' : ')');
                    res.end = previous.end;
                    res.end();
                };
    
                res.writeHead = previous.writeHead;
                res.writeHead(statusCode, headers);

            } else {
                res.writeHead = previous.writeHead;
                res.writeHead(statusCode, headers);
            }   
        };

        next();
    };
};