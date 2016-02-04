var restify = require('restify');
var cote = require('cote');

var server = restify.createServer({
    name: 'PaymentService',
    version: '1.0.0'
});

var paymentRequester = new cote.Requester({
    name: 'payment requester'
});


server.get('/pay/:cardno', function(req, res, next) {
    var cardno = req.params.cardno;
    var response = res;
    console.log('paying with', cardno);

    var validationRequest = {
        type: 'validate',
        cardno: cardno
    };

    paymentRequester.send(validationRequest, function(err, res) {
        console.log(err, cardno, 'validated');

        if (err) response.send(cardno + ' validation failed: ' + err);
        else response.send(cardno + ' validated');
    });
    return next();
});

server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});
