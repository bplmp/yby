'use strict';

/*
 * Map service
 */

exports.Map = [
	'$resource',
	'$rootScope',
	'apiPrefix',
	function($resource, $rootScope, apiPrefix) {

		var params = {};

		return {
			resource: $resource(apiPrefix + '/maps/:mapId', null, {
				'query': {
					isArray: false,
					method: 'GET',
					params: {
						perPage: 10,
						page: 1
					},
					interceptor: {
						response: function(data) {
							params = data.config.params;
							return data.data;
						}
					}
				},
				get: {
					method: 'GET',
					interceptor: {
						response: function(data) {
							var map = data.data;

							if(map.southWest && map.northEast) {
								map.bounds = [map.southWest, map.northEast];
							}

							return map;
						}
					}
				},
				'update': {
					method: 'PUT'
				}
			}),
			busy: false,
			nextPage: function() {
				var self = this;
				if(!self.busy) {
					self.busy = true;
					this.resource.query(_.extend(params, {
						page: params.page + 1
					}), function(res) {
						if(res.maps.length) {
							self.busy = false;
							$rootScope.$broadcast('map.page.next', res);
						}
					});
				}
			},
			isDraft: function(map) {
				return map.isDraft;
			},
			deleteDraft: function(map, callback) {
				if(this.isDraft(map)) {
					this.resource.delete({mapId: map._id}, callback);
				}
			}
		}

	}
];