/*!
 * Ext JS Connect
 * Copyright(c) 2010 Sencha Inc.
 * MIT Licensed
 */
var url = require('url');

/**
 * Stupid simple connect middleware providing JSONP support.
 *
 * @return {Function}
 * @api public
 */
module.exports = function jsonp() { 
	
	/**
	 * Determines if a callback param was specified by the
	 * client.  Look for the param in the querystring as 
	 * this is the most typical use case, ie a script tag.
	 * Fall back to the req.body which would be set by
	 * the bodyDecoder filter, if it is in the pipeline.
	 */
	function callback(req) {
	    var queryString = url.parse(req.url, true).query;
	    if (queryString && queryString['callback']) {
	        req.callback = queryString['callback'];

	    } else if (req.body && req.body['callback'])  {
		    req.callback = req.body['callback'];
	    }
	
	    return req.callback != undefined;		
	};
	
    /**
     * Response decorator that pads the response with the appropriate 
     * callback format to support jsonp. Uses the req.body from the 
     * body decoder to determine if the request contains a callback 
     * param.
     * 
     * Changes nothing if the 'callback' param is absent.
     */ 
    return function jsonp(req, res, next) {
	    // boogie out
	    if (!callback(req)) next();

        var previous = {
            writeHead: res.writeHead,
            write: res.write,
            end: res.end    
        };   
    
        res.writeHead = function(statusCode, headers) {
            if (statusCode === 200) { 
                headers['Content-Type'] = 'application/javascript';
                res.write = function(chunk, encoding) {
                    res.write = previous.write;
                    res.write(req.callback + '(' + chunk);
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