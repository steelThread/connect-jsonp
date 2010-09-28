var connect = require('connect'),
    jsonp = require('connect-jsonp'),
    helpers = require('./helpers'),
    assert = require('assert');

connect.jsonp = jsonp;

var expectRes = "{'data': 'data'}";
var expectPaddedRes = "cb({'data': 'data'})";


function server(headers, code) {
    headers = headers || {};
    code = code || 200;
    return helpers.run(
        connect.gzip(),
        connect.jsonp(),
        connect.createServer(
            function(req, res) {
                res.writeHead(code, headers);
                res.write(expectRes)
                res.end();
            }
        )
    );
}

function assertPadded(res, padded) {
    if (padded) {
        assert.eql(expectPaddedRes, res.body);
        assert.eql('application/javascript', res.headers['content-type']);
        assert.eql(expectPaddedRes.length, res.headers['content-length']);
    
    } else {
        assert.eql(expectRes, res.body);     
    }
}

module.exports = {
    'test not a padding request': function() {
        var req = server().request('GET', '/', { });
        req.buffer = true;
        req.addListener('response', function(res) {
            res.addListener('end', function() {
                assertPadded(res, false);
            });
        });
        req.end();
    },

    'test not a GET request': function() {
		helpers.run(connect.jsonp()).assertResponse(
		    'POST', 
		    '/?callback=cb', 
		    400, 
		    'cb({"error":"method not allowed","description":"with callback only GET allowed"})'
		);
    },

    'test query string': function() {
        var req = server().request('GET', '/test?callback=cb', { });
        req.buffer = true;
        req.addListener('response', function(res) {
            res.addListener('end', function() {
                assertPadded(res, true);
            });
        });
        req.end();  
    },


   'test plays nice with others': function() {
        var req = server().request('GET', '/test?callback=cb', {
            'Accept-Encoding': 'deflate, gzip'
        });
        req.buffer = true;
        req.addListener('response', function(res) {
            res.addListener('end', function() {
                assert.eql('gzip', res.headers['content-encoding']);
                assert.eql('application/javascript', res.headers['content-type']);
                // test compression
                //assert.eql("cb({data: 'data'})", res.body);
            });
        });
        req.write('callback=cb');
        req.end();
    }
}