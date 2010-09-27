var connect = require('connect'),
    jsonp = require('connect-jsonp'),
    helpers = require('./helpers'),
    assert = require('assert');

connect.jsonp = jsonp;

function server(headers, code) {
    headers = headers || {};
    code = code || 200;
    return helpers.run(
        connect.bodyDecoder(),
        connect.gzip(),
        connect.jsonp(),
        connect.createServer(
            function(req, res) {
                res.writeHead(code, headers);
                res.write("{data: 'data'}")
                res.end();
            }
        )
    );
}

function assertPadded(res, padded) {
    if (padded) {
        assert.eql("cb({data: 'data'})", res.body);
        assert.eql('application/javascript', res.headers['content-type']);
    
    } else {
        assert.eql("{data: 'data'}", res.body);     
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

    'test form request': function() {
        var req = server().request('POST', '/', {'Content-Type': 'application/x-www-form-urlencoded'});
        req.buffer = true;
        req.addListener('response', function(res) {
            res.addListener('end', function() {
                assertPadded(res, true);
            });
        });
        req.write('callback=cb');
        req.end();
    },

    'test json request': function() { 
        var req = server().request('POST', '/', {'Content-Type': 'application/json; charset=utf8'});
        req.buffer = true;
        req.addListener('response', function(res) {
            res.addListener('end', function(){
                assertPadded(res, true);
            });
        });
        req.write('{"callback": "cb"}');
        req.end();
    },

    'test error status code': function() { 
        var req = server({}, 404).request('POST', '/', {'Content-Type': 'application/json; charset=utf8'});
        req.buffer = true;
        req.addListener('response', function(res) {
            res.addListener('end', function() {
                assertPadded(res, false);
            });
        });
        req.write('{"callback": "cb"}');
        req.end();
    },

    'test plays nice with others': function() {
        var req = server().request('POST', '/', {
            'Content-Type': 'application/x-www-form-urlencoded',
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