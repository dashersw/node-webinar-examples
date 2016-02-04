var restify = require('restify');

var validationClient = restify.createJsonClient({
    url: 'http://192.168.99.100',
    version: '~1.0'
});

var server = restify.createServer({
    name: 'PaymentService',
    version: '1.0.0'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/pay/:cardno', function(req, res, next) {
    var cardno = req.params.cardno;
    var response = res;
    console.log('paying with', cardno);

    validationClient.get('/validate/' + req.params.cardno, function(err, req, res) {
        console.log('validation answer received for card', cardno, err, res.body);

        if (err) response.send(cardno + ' validation failed: ' + err);
        else response.send(cardno + ' validated');
    });
    return next();
});

server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});
