var restify = require('restify');

var server = restify.createServer({
    name: 'ValidationService',
    version: '1.0.0'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/validate/:cardno', function(req, res, next) {
    console.log('validating', req.params.cardno);
    res.send(200);
    return next();
});

server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});
