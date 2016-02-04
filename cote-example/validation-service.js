var cote = require('cote');

var validationService = new cote.Responder({
    name: 'validation service'
});

validationService.on('validate', function(req, cb) {
    console.log('validating', req.cardno);

    cb(null, true);
});
