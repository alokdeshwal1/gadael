'use strict';

const gt = require('./../../../../modules/gettext');



exports = module.exports = function(services, app) {

    var service = new services.get(app);




    /**
     * Call the beneficiaries get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {


        if (undefined === params || !params.id) {
            service.error('The id parameter is mandatory');
            return service.deferred.promise;
        }



        service.app.db.models.Beneficiary
        .findOne({ '_id' : params.id }, 'right ref document')
        .populate('right')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {

                    document.right.populate('type', function() {

                        var rightDocument = document.right;
                        var beneficiary = document.toObject();
                        beneficiary.disp_unit = rightDocument.getDispUnit();

                        service.deferred.resolve(beneficiary);
                    });

                } else {
                    service.notFound(gt.gettext('This beneficiary does not exists'));
                }
            }
        });


        return service.deferred.promise;
    };


    return service;
};
