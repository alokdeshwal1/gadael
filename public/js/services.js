define(['angular',  'angularResource'], function (angular) {
	'use strict';
	
	/* Services */
	
	angular.module('inga.services', ['ngResource'])
	
	
		
	/**
	 * Populate a select box with collections
	 */  
	.factory('loadCollectionsOptions', ['$http', function($http) {
		
		return function(scope) {
			$http.get('/rest/admin/collections')
            .then(function(result) {
                scope.collections = result.data;
			});
		};
	}])
	
	/**
	 * Populate a select box with departments
	 */  
	.factory('loadDepartmentsOptions', ['$http', function($http) {
		
		return function(scope) {
			$http.get('/rest/admin/departments')
            .then(function(result) {
                scope.departments = result.data;
			});
		};
	}])
	
	
	/**
	 * Populate a select box with workschedule calendars
	 */  
	.factory('loadWorkschedulesOptions', ['$http', function($http) {
		
		return function(scope) {
			$http.get('/rest/admin/calendars?type=workschedule')
            .then(function(result) {
                scope.workschedules = result.data;
			});
		};
	}])
	
	
	/**
	 * Populate a select box with nonworkingday calendars
	 */  
	.factory('loadNonWorkingDaysOptions', ['$http', function($http) {
		
		return function(scope) {
			$http.get('/rest/admin/calendars?type=nonworkingday')
            .then(function(result) {
                scope.nonworkingdays = result.data;
			});
		};
	}])
	
    
    /**
	 * Populate a select box with right types
	 */  
	.factory('loadTypesOptions', ['$http', function($http) {
		
		return function(scope) {
			$http.get('/rest/admin/types')
            .then(function(result) {
                scope.types = result.data;
            });
		};
	}])
    
    
    
    /**
     * catch outcome messages from the rest service and 
     *  - forward messages to rootscope
     *  - highlight the missing fields
     */
    .factory('catchOutcome', ['$rootScope', '$q', function($rootScope, $q) {
        
        
        var addMessages = function(outcome) {
            for(var i=0; i<outcome.alert.length; i++) {
                $rootScope.pageAlerts.push(outcome.alert[i]);
            }
        };
        
        /**
         * 
         * @param promise
         * @return promise
         */
        return function(promise) {
            
            var deferred = $q.defer();
            
            promise.then(
                function(data) {
                    if (data.$outcome) {
                        addMessages(data.$outcome);
                    }
                    
                    // workflow return the saved document object
                    // value is fowarded to the next promise on success
                    deferred.resolve(data);
                    
                },
                function(badRequest) {
                    
                    var data = badRequest.data;
                    var outcome = data.$outcome;
                    
                    if (!outcome) {
                        return;
                    }
                    
                    addMessages(outcome);

                    // receive 400 bad request on missing parameters
                    // mark required fields
                    
                    for(var fname in outcome.errfor) {
                        if ('required' === outcome.errfor[fname]) {
                            var fieldOnError = angular.element(document.querySelector('[ng-model$='+fname+']')).parent();
                            fieldOnError.addClass('has-error');
                            
                            if (0 === fieldOnError.length) {
                                alert('missing field: '+fname);
                            }
                        }
                    }
                    
                    deferred.reject(data);
                }
            );
            
            
            return deferred.promise;
        };
        
    }])
    
    
    .factory('ResourceFactory', 
        ['$resource', function($resource) {
        
        /**
         * create a resource
         * @param   {string} collectionPath path to rest service
         * @param   {object} parameters Optional parameters default is { id:'@_id' }
         */
        var ResourceFactory = function(collectionPath, parameters) {
            
            if (undefined === parameters) {
                parameters = { id:'@_id' };   
            }
            
            return $resource(collectionPath, parameters, 
                { 
                    'save': { method:'PUT' },    // overwrite default save method (POST)
                    'create': { method:'POST' }
                }  
            );
        };
            
            
        return ResourceFactory;
        
    }])
    
    

	/**
	 * Create a resource to an object or to a collection
	 * the object resource is created only if the angular route contain a :id
	 */ 
	.factory('IngaResource', 
        ['ResourceFactory', '$routeParams', 'catchOutcome', 
        function(ResourceFactory, $routeParams, catchOutcome) {
            
        
        /**
         * Additional method on resource to save and redirect messages
         * to the rootscope message list
         *
         * @param   {function} nextaction optional function
         * @returns {Promise} promise will resolve to the received data, same as the $save method
         */
        var ingaSave = function(nextaction) {

            var p = catchOutcome(this.$save());

            if (nextaction) {
                p = p.then(nextaction, function() {
                    // error on save, do not redirect
                });
            }

            return p;
        };
        
        
        /**
         * Create the real loadable resource
         * @param   {string} collectionPath path to rest service
         * @returns {Resource} resource instance with a loadRouteId() method
         */
        var realLoadableResource = function(collectionPath) {
            var item = ResourceFactory(collectionPath+'/:id', $routeParams);


            /**
             * Get a resource instance
             * @returns {Resource} a resource instance, will be populated with results
             *                     after get is resolved
             */
            item.loadRouteId = function() {
                return this.get(function(data) {
                    data.ingaSave = ingaSave;
                });
            };

            return item;
        }
        
        
        /**
         * Create the fake loadable resource
         * @param   {string} collectionPath path to rest service
         * @returns {Resource} resource instance with a loadRouteId() method
         */
        var fakeLoadableResource = function(collectionPath) {
            var collection = ResourceFactory(collectionPath);
            
			/**
			 * Get a resource instance
			 * @returns {Resource} an empty resource instance, no get triggered
			 */
			collection.loadRouteId = function() {
				// scope will be loaded with an empty instance
				
				var inst = new collection();
				inst.ingaSave = ingaSave;

				return inst;
			};
            
            return collection;
        }
        
        

        
		/**
		 * Get the resource
		 * @param   {string} collectionPath [[Description]]
		 * @returns {Resource} the resource
		 */
		return function(collectionPath)
		{
			if ($routeParams.id)
			{
				return realLoadableResource(collectionPath);
			}
			
			return fakeLoadableResource(collectionPath);
		};

	}])
	
    
    
    
        
    /**
	 * Add periods form in the array of items
     * 
	 */  
	.factory('addPeriodRow', function() {
        
      
        /**
         * Add periods form in the array of items (deferred service call)
         *
         * @param {Array}    items         items binded to rows
         * @param {$resource} itemResource resource for one row
         */
        return function($scope, items, itemResource) {

            require(['services/addPeriodRow'], function(serviceFn) {
                serviceFn(items, itemResource);
                $scope.$apply();
            });
        };
	})
    
 
	.factory('saveAccountCollection', ['$q', 'catchOutcome', function($q, catchOutcome) {

        /**
         * Save account collections in scope
         *
         */
        return function($scope) {
            var deferred = $q.defer();
            require(['services/saveAccountCollection'], function(serviceFn) {
                serviceFn($scope, $q, catchOutcome).then(deferred.resolve);
            });
            
            return deferred.promise;
        };
	}])
    
    
    .factory('saveBeneficiaries', ['$q', 'catchOutcome', function($q, catchOutcome) {

        /**
         * Save account collections in scope
         * 
         * @param {Scope} $scope
         * @param {Integer} collectionId  The saved collection _id
         */
        return function($scope, collectionId) {
            var deferred = $q.defer();
            require(['services/saveBeneficiaries'], function(serviceFn) {
                serviceFn($scope, collectionId, $q, catchOutcome).then(deferred.resolve);
            });
            
            return deferred.promise;
        };
	}]);
	
	
});
