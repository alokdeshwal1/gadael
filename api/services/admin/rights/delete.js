'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the vacation right delete service
     * 
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        var Gettext = require('node-gettext');
        var gt = new Gettext();

        
        service.app.db.models.Right.findById(params.id, function (err, document) {
            if (service.handleMongoError(err)) {
                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(gt.gettext('The calendar has been deleted'));
                        
                        var right = document.toObject();
                        right.$outcome = service.outcome;
                        
                        service.deferred.resolve(right);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};

