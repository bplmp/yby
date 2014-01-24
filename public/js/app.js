/*
 * App modules
 */

angular.module('mapasColetivos.map', [
	'leaflet-directive'
]);

angular.module('mapasColetivos.user', []);

angular.module('mapasColetivos.session', []);

angular.module('mapasColetivos.content', []);

angular.module('mapasColetivos.feature', []);

angular.module('mapasColetivos.layer', [
	'ngResource',
	'mapasColetivos.map',
	'mapasColetivos.feature',
	'mapasColetivos.content'
]);

angular
	.module('mapasColetivos', [
		'ui.keypress',
		'monospaced.elastic',
		'ngRoute',
		'ngAnimate',
		'mapasColetivos.layer',
		'mapasColetivos.user'
	])
	.value('apiPrefix', '/api/v1');

/*
 * App routes and interceptors
 */

angular.module('mapasColetivos').config([
	'$routeProvider',
	'$locationProvider',
	'$httpProvider',
	function($routeProvider, $locationProvider, $httpProvider) {

		$httpProvider.defaults.withCredentials = true;

		$routeProvider
			.when('/', {
				controller: 'IndexCtrl',
				templateUrl: '/home'
			})
			.when('/explore', {
				controller: 'ExploreCtrl',
				templateUrl: '/views/explore.html'
			})
			.when('/dashboard', {
				controller: 'DashboardCtrl',
				templateUrl: '/views/dashboard.html'
			})
			.when('/user/:userName', {
				controller: 'UserCtrl',
				templateUrl: '/views/user/index.html'
			})
			.when('/user/:userName/layers', {
				controller: 'UserCtrl',
				templateUrl: '/views/user/layers.html'
			})
			.when('/layers', {
				controller: 'LayerCtrl',
				templateUrl: '/views/layers/index.html'
			})
			.when('/layers/new', {
				controller: 'LayerCtrl',
				templateUrl: '/views/layers/index.html'
			})
			.when('/layers/:layerId', {
				controller: 'LayerCtrl',
				templateUrl: '/views/layers/show.html'
			})
			.when('/layers/:layerId/:action', {
				controller: 'LayerCtrl',
				templateUrl: '/views/layers/edit.html'
			})
			.otherwise('/');

		$locationProvider.html5Mode(true);

		var interceptor = ['$rootScope', '$q', '$location', function(scope, $q, $location) {

			function success(response) {
				return response;
			}

			function error(response) {

				var status = response.status;

				if (status == 401) {
					window.location = '/login';
					return;
				}
				// otherwise
				return $q.reject(response);

			}

			return function (promise) {
				return promise.then(success, error);
			}

		}];

		$httpProvider.responseInterceptors.push(interceptor);

	}
]);

/*
 * Session service
 */
angular.module('mapasColetivos').factory('SessionService', [
	function() {
		var _this = this;
		_this._data = {
			authenticated: !! window.isAuthenticated,
			user: window.user
		};
		return _this._data;
	}
]);

/*
 * Feature service
 */
angular.module('mapasColetivos.feature').factory('Feature', [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		return $resource(apiPrefix + '/features/:featureId', {'_csrf': window.token}, {
			'save': {
				method: 'POST',
				url: apiPrefix + '/layers/:layerId/features'
			},
			'delete': {
				method: 'DELETE',
				url: apiPrefix + '/layers/:layerId/features/:featureId'
			},
			'update': {
				method: 'PUT'
			}
		});

	}
]);

/*
 * Content service
 */
angular.module('mapasColetivos.content').factory('Content', [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		return $resource(apiPrefix + '/contents/:contentId', {'_csrf': window.token}, {
			'save': {
				method: 'POST',
				url: apiPrefix + '/features/:featureId/contents/:contentId'
			},
			'delete': {
				method: 'DELETE',
				url: apiPrefix + '/features/:featureId/contents/:contentId'
			},
			'update': {
				method: 'PUT'
			}
		});

	}
]);

/*
 * Layer service
 */
angular.module('mapasColetivos.layer').factory('Layer', [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		return $resource(apiPrefix + '/layers/:layerId', {'_csrf': window.token}, {
			'query': {
				isArray: false,
				method: 'GET'
			},
			'update': {
				method: 'PUT'
			}
		});

	}
]);

/*
 * Layer features service
 */
angular.module('mapasColetivos.layer').factory('LayerSharedData', [
	'leafletData',
	function(leafletData) {
		var layer = {};
		var features = [];
		var contents = [];
		var editingFeature = false;
		var editingContent = false;
		return {
			layer: function(val) {

				if(typeof val !== 'undefined')
					layer = val;

				return layer;
			},
			map: function() {
				return leafletData.getMap();
			},
			features: function(val) {

				if(typeof val !== 'undefined')
					features = val;

				return features;

			},
			contents: function(val) {

				if(typeof val !== 'undefined')
					contents = val;

				return contents;

			},
			editingFeature: function(val) {

				if(typeof(val) !== 'undefined')
					editingFeature = val;

				return editingFeature;
			},
			editingContent: function(val) {

				if(typeof(val) !== 'undefined')
					editingContent = val;

				return editingContent;
			}
		}
	}
]);

/*
 * Directives
 */

angular.module('mapasColetivos').directive('mcDisableEnter', [
	function() {
		return {
			link: function(scope, element) {

				function triggerBlur() {
					//console.log(element);
					element.blur();
				}

				function keyCallback(event) {

					if(event.which == 13) {

						//scope.$apply(triggerBlur);
						triggerBlur();
						event.preventDefault();

					}

				}

				element.on('keydown keypress', keyCallback);
			}
		}
	}
]);

angular.module('mapasColetivos').controller('IndexCtrl', [
	'$scope',
	'SessionService',
	'$location',
	function($scope, SessionService, $location) {

		if(SessionService.authenticated) {
			$location.path('/dashboard');
		}

	}
]);

angular.module('mapasColetivos').controller('ExploreCtrl', [
	'$scope',
	function($scope) {

	}
]);

angular.module('mapasColetivos').controller('DashboardCtrl', [
	'$scope',
	'SessionService',
	'$location',
	function($scope, SessionService, $location) {
		if(!SessionService.authenticated) {
			window.location = '/login';
		}
		$scope.user = SessionService.user;
	}
]);

/*
 * Layer controller
 */
angular.module('mapasColetivos.layer').controller('LayerCtrl', [
	'$scope',
	'$location',
	'$routeParams',
	'$q',
	'Layer',
	'LayerSharedData',
	'MessageService',
	function($scope, $location, $routeParams, $q, Layer, LayerSharedData, Message) {

		// New layer
		if($location.path() == '/layers/new') {

			var draft = new Layer({
				title: 'Untitled'
			});
			draft.$save(function(draft) {
				$location.path('/layers/' + draft._id + '/edit/');
			}, function(err) {
				// TODO error handling
				console.log(err);
			});

		// Single layer
		} else if($routeParams.layerId) {

			var layerDefer = $q.defer();
			LayerSharedData.layer(layerDefer.promise);

			Layer.get({layerId: $routeParams.layerId}, function(layer) {

				// Set layer shared data using service (resolving promise)
				layerDefer.resolve(layer);

				$scope.layer = layer;

				if($routeParams.action == 'edit') {

					if($scope.layer.title == 'Untitled')
						$scope.layer.title = '';

					$scope.save = function($event) {

						Layer.update({layerId: layer._id}, $scope.layer, function(layer) {
							Message.message({
								status: 'ok',
								text: 'Camada atualizada'
							});
						}, function(err){
							Message.message({
								status: 'error',
								text: 'Ocorreu um erro.'
							});
						});

					}

					$scope.delete = function() {

						if(confirm('Você tem certeza que deseja remover esta camada?')) {
							Layer.delete({layerId: layer._id}, function(res) {
								$location.path('/layers');
								Message.message({
									status: 'ok',
									text: 'Camada removida.'
								});
							}, function(err) {
								Message.message({
									status: 'error',
									text: 'Ocorreu um erro.'
								});
							});
						}

					}

					$scope.cancel = function() {

						LayerSharedData.editingFeature(false);
						LayerSharedData.editingContent(false);

						if((!$scope.layer.title || $scope.layer.title == 'Untitled') && !$scope.layer.features.length) {
							Layer.delete({layerId: layer._id}, function(res) {
								$location.path('/layers');
							});
						} else {
							$location.path('/layers/' + layer._id);
						}

					}

				}

			});

		// All layers
		} else {

			Layer.query(function(res) {
				$scope.layers = res.layers;
			});

		}

		var activeObj = 'feature';

		$scope.layerObj = function(objType) {
			if(activeObj == objType)
				return 'active';

			return false;
		}

		$scope.setLayerObj = function(obj) {

			activeObj = obj;

		}

		/*
		 * Map
		 */

		$scope.map = {
			world: {
				lat: 0,
				lng: 0,
				zoom: 2
			},
			tiles: {
				url: 'http://{s}.tiles.mapbox.com/v3/tmcw.map-7s15q36b/{z}/{x}/{y}.png'
			},
			markers: [],
			events: {}
		};

	}
]);

/*
 * Message service
 */
angular.module('mapasColetivos').factory('MessageService', [
	'$timeout',
	function($timeout) {

		var message = {
			status: 'ok',
			text: false
		};

		return {
			message: function(val, timeout) {

				if(typeof val !== 'undefined') {
					message = val;

					if(timeout !== false) {
						timeout = timeout ? timeout : 3000;
						$timeout(function() {
							message = {
								status: 'ok',
								text: ''
							};
						}, timeout);
					}

				}

				return message;
			}
		}

	}
]);

/*
 * Message controller
 */
angular.module('mapasColetivos').controller('MessageCtrl', [
	'$scope',
	'MessageService',
	function($scope, MessageService) {

		$scope.service = MessageService;

		$scope.$watch('service.message()', function(message) {
			$scope.message = message;
		});

		$scope.close = function() {
			$scope.service.message(false);
		}

	}
]);

/*
 * Feature controller
 */

angular.module('mapasColetivos.feature').controller('FeatureCtrl', [
	'$scope',
	'LayerSharedData',
	function($scope, LayerSharedData) {

		$scope.objType = 'feature';
		
		$scope.sharedData = LayerSharedData;

		$scope.features = [];

		$scope.markers = L.featureGroup();

		var markers = [];

		$scope.sharedData.layer().then(function(layer) {

			$scope.sharedData.features(layer.features);

			$scope.sharedData.map().then(function(map) {

				$scope.$watch('sharedData.features()', function(features) {

					if(features.length) {

						$scope.features = features;

						if(markers.length) {
							angular.forEach(markers, function(marker) {
								$scope.markers.removeLayer(marker);
							});
							markers = [];
						}

						angular.forEach(features, function(f) {

							var marker = L.marker(f.geometry.coordinates);
							markers.push(marker);
							marker.addTo($scope.markers);

						});

						if(!map.hasLayer($scope.markers)) {
							map.addLayer($scope.markers);
						}

						setTimeout(function() {
							map.fitBounds($scope.markers.getBounds());
						}, 100);

					}

				});


				$scope.viewInMap = function(featureId) {

					if(map) {

						var feature = $scope.features.filter(function(f) { return f._id == featureId; })[0];
						map.setView(feature.geometry.coordinates, 14);

					}

				};

			});

			$scope.new = function() {

				$scope.sharedData.editingFeature({});

			};

			$scope.edit = function(featureId) {

				$scope.sharedData.editingFeature(angular.copy($scope.features.filter(function(f) { return f._id == featureId; })[0]));

				setTimeout(function() {
					window.dispatchEvent(new Event('resize'));
				}, 100);

			};

		});

	}
]);

/*
 * Feature edit controller
 */

angular.module('mapasColetivos.feature').controller('FeatureEditCtrl', [
	'$scope',
	'Feature',
	'LayerSharedData',
	'MessageService',
	function($scope, Feature, LayerSharedData, Message) {

		$scope.sharedData = LayerSharedData;

		$scope.sharedData.layer().then(function(layer) {

			$scope.$watch('sharedData.editingFeature()', function(editing) {
				$scope.editing = editing;
			});

			$scope.$watch('sharedData.features()', function(features) {
				$scope.features = features;
			});

			$scope.save = function() {

				if($scope.editing && $scope.editing._id) {

					Feature.update({featureId: $scope.editing._id, layerId: layer._id}, $scope.editing, function(feature) {

						// Replace feature in local features
						angular.forEach($scope.features, function(feature, i) {
							if(feature._id == $scope.editing._id)
								$scope.features[i] = $scope.editing;
						});
						$scope.sharedData.features($scope.features);

						Message.message({
							status: 'ok',
							text: 'Feature salva.'
						});

					}, function(err) {

						if(err.status == 500)
							Message.message({
								status: 'error',
								text: 'Ocorreu um erro interno. Tente novamente ou entre em contato com nossa equipe'
							}, false);

					});

				} else {

					if(!$scope.editing.geometry) {
						$scope.editing.geometry = {
							coordinates: [0,0]
						};
					}

					var feature = new Feature($scope.editing);

					feature.$save({layerId: layer._id}, function(feature) {

						// Locally push new feature
						$scope.features.push(feature);
						$scope.sharedData.features($scope.features);

						// Update editing feature to saved data
						$scope.sharedData.editingFeature(feature);

						Message.message({
							status: 'ok',
							text: 'Feature adicionada.'
						});

					}, function(err) {

						var message = {status: 'error'};

						if(err.status == 400 && err.data.message) {
							message.text = err.data.message;
						} else {
							message.text = 'Ocorreu um erro interno.';
						}

						Message.message(message, false);

					});

				}

			}

			$scope.delete = function() {

				if(confirm('Você tem certeza que deseja remover esta feature?')) {

					Feature.delete({featureId: $scope.editing._id, layerId: layer._id}, function() {

						$scope.sharedData.features($scope.features.filter(function(f) {
							return f._id !== $scope.editing._id;
						}));
						LayerSharedData.editingFeature(false);

						Message.message({
							status: 'ok',
							text: 'Feature removida.'
						});

					}, function(err) {

						var message = {status: 'error'};

						if(err.status == 400 && err.data.message) {
							message.text = err.data.message;
						} else {
							message.text = 'Ocorreu um erro interno.';
						}

						Message.message(message, false);
					});

				}

			}

			$scope.cancel = function() {

				LayerSharedData.editingFeature(false);

			}

		});

	}
]);



/*
 * Content controller
 */

angular.module('mapasColetivos.content').controller('ContentCtrl', [
	'$scope',
	'LayerSharedData',
	function($scope, LayerSharedData) {

		$scope.objType = 'content';
		
		$scope.sharedData = LayerSharedData;

		$scope.contents = [];

		$scope.sharedData.layer().then(function(layer) {

			$scope.$watch('sharedData.contents()', function(contents) {
				if(contents.length) {
					$scope.contents = contents;
				}
			});

			$scope.sharedData.contents(layer.contents);

			$scope.new = function() {

				$scope.sharedData.editingContent({});

			};

			$scope.edit = function(contentId) {

				$scope.sharedData.editingContent(angular.copy($scope.contents.filter(function(c) { return c._id == contentId; })[0]));

			};

		});

	}
]);



/*
 * Content edit controller
 */

angular.module('mapasColetivos.feature').controller('ContentEditCtrl', [
	'$scope',
	'Content',
	'LayerSharedData',
	'MessageService',
	function($scope, Content, LayerSharedData, Message) {

		$scope.sharedData = LayerSharedData;

		$scope.sharedData.layer().then(function(layer) {

			$scope.$watch('sharedData.editingContent()', function(editing) {
				$scope.editing = editing;
			});

			$scope.$watch('sharedData.contents()', function(contents) {
				$scope.contents = contents;
			});

			$scope.save = function() {

				if($scope.editing && $scope.editing._id) {

					Content.update({layerId: layer._id}, $scope.editing, function(content) {

						// Replace content in local features
						angular.forEach($scope.contents, function(content, i) {
							if(content._id == $scope.editing._id)
								$scope.contents[i] = $scope.editing;
						});
						$scope.sharedData.contents($scope.contents);

						Message.message({
							status: 'ok',
							text: 'Conteúdo salvo.'
						});

					}, function(err) {

						if(err.status == 500)
							Message.message({
								status: 'error',
								text: 'Ocorreu um erro interno. Tente novamente ou entre em contato com nossa equipe'
							}, false);

					});

				} else {

					if(!$scope.editing.geometry) {
						$scope.editing.geometry = {
							coordinates: [0,0]
						};
					}

					var content = new Content($scope.editing);

					content.$save({layerId: layer._id}, function(feature) {

						// Locally push new content
						$scope.contents.push(content);
						$scope.sharedData.contents($scope.contents);

						// Update editing content to saved data
						$scope.sharedData.editingContent(content);

						Message.message({
							status: 'ok',
							text: 'Conteúdo adicionado.'
						});

					}, function(err) {

						var message = {status: 'error'};

						if(err.status == 400 && err.data.message) {
							message.text = err.data.message;
						} else {
							message.text = 'Ocorreu um erro interno.';
						}

						Message.message(message, false);

					});

				}

			}

			$scope.delete = function() {

				if(confirm('Você tem certeza que deseja remover esta feature?')) {

					Cotnent.delete({layerId: layer._id}, function() {

						$scope.sharedData.contents($scope.contents.filter(function(c) {
							return c._id !== $scope.editing._id;
						}));
						LayerSharedData.editingContent(false);

						Message.message({
							status: 'ok',
							text: 'Conteúdo removido.'
						});

					}, function(err) {

						var message = {status: 'error'};

						if(err.status == 400 && err.data.message) {
							message.text = err.data.message;
						} else {
							message.text = 'Ocorreu um erro interno.';
						}

						Message.message(message, false);
					});

				}

			}

			$scope.cancel = function() {

				LayerSharedData.editingContent(false);

			}

		});

	}
]);