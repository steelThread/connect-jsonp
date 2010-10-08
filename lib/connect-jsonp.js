/*!
 * Copyright(c) 2010 Sean McDaniel <sean.mcdaniel@me.com>
 * MIT Licensed
 */

/**
 * Simple connect middleware providing JSONP support.
 *
 * @return {Function}
 * @api public
 */
module.exports = function jsonp() { 
    // @@
    var APP_JS_CONTENT_TYPE = require('connect/utils').mime.type('.js');
    var BAD_REQUEST_BODY = '(' + 
        JSON.stringify({
            error: 'method not allowed', 
            description: 'with callback only GET allowed'       
        }) + 
    ')';

   /**
    * Write out a 400 error, passing it to the callback.
    */
   function badRequest(res, callback) {
       var body = callback + BAD_REQUEST_BODY;      
       res.writeHead(400, {
           'Content-Type': APP_JS_CONTENT_TYPE,
           'Content-Length': body.length
       });
       res.end(body);      
   };    

   /**
    * Unwind.
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
     * Response decorator that pads a (json) response with a callback
     * if requested do to so.  
     */ 
    return function(req, res, next) {
        var url = require('url').parse(req.url, true);
        if (!(url.query && url.query.callback)) {
            next();
            return;
    
        } else if (req.method != 'GET') {
            badRequest(res, url.query.callback); 
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
                res.write = function(chunk, encoding) { body += chunk }    
                res.end = function(chunk, encoding) {
                    if (chunk) body += chunk;
                    body = url.query.callback + '(' + body + ')';
                    headers['Content-Type'] = APP_JS_CONTENT_TYPE;
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