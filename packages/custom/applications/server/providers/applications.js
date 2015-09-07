

exports.checkApp = function(req, res, next) {
    var mongoose = require('mongoose'),
        Application = mongoose.model('Application');

    Application.findOne({name: req.body.appName}, function(err, app) {
       if (err) {
           return res.status(500).json({
               error: 'Unrecognized application'
           });

       }
        if (app.token && app.token !== req.body.token){
            return res.status(500).json({
                error: 'Token is not match to application name'
            });
        }

        req.params.app = app;
        req.body.app = app;
        req.query.app = app;
        req.user = req.body.user;
        next();

    });
};
