'use strict';

require('angular/angular');

/*
 * layer controller
 */

exports.LayerActionsCtrl = [
	'$rootScope',
	'$scope',
	'$q',
	'$location',
	'MessageService',
	'SessionService',
	'Layer',
	'LayerShare',
	function($rootScope, $scope, $q, $location, Message, Session, Layer, LayerShare) {

		$scope.getUrl = function(layer) {

			var url = window.location.protocol + '//' + window.location.host + '/layers/' + layer._id;

			return url;

		};

		/*
		 * Permission control
		 */
		$scope.canEdit = function(layer) {

			if(!layer || !Session.user)
				return false;

			if(typeof layer.creator == 'string' && layer.creator == Session.user._id) {
				return true;
			} else if(typeof layer.creator == 'object' && layer.creator._id == Session.user._id) {
				return true;
			}

			return false;

		};

		$scope.edit = function(layer) {

			$location.path('/layers/' + layer._id + '/edit');

		};

		$scope.save = function(layer) {

			layer.isDraft = false;

			var deferred = $q.defer();

			Layer.resource.update({layerId: layer._id}, layer, function(layer) {
				Message.message({
					status: 'ok',
					text: 'Camada atualizada'
				});
				$rootScope.$broadcast('layer.save.success', layer);
				deferred.resolve(layer);
			}, function(err){
				Message.message({
					status: 'error',
					text: 'Ocorreu um erro.'
				});
				$rootScope.$broadcast('layer.save.error', err);
				deferred.resolve(err);
			});

			return deferred.promise;

		};

		$scope.delete = function(layer, callback) {

			if(confirm('Você tem certeza que deseja remover esta camada?')) {
				Layer.resource.delete({layerId: layer._id}, function(res) {
					Message.message({
						status: 'ok',
						text: 'Camada removida.'
					});
					$rootScope.$broadcast('layer.delete.success', layer);
				}, function(err) {
					Message.message({
						status: 'error',
						text: 'Ocorreu um erro.'
					});
					$rootScope.$broadcast('layer.delete.error', err);
				});
			}

		};

		$scope.share = function(layer) {
			LayerShare.activate({
				layer: layer,
				social: {
					facebook: 'http://facebook.com/share.php?u=' + $scope.getUrl(layer),
					twitter: 'http://twitter.com/share?url=' + $scope.getUrl(layer)
				},
				socialWindow: function(url, type) {
					window.open(url, type, "width=550,height=300,resizable=1");
				},
				close: function() {
					LayerShare.deactivate();
				}
			});

			$scope.$on('$destroy', function() {
				LayerShare.deactivate();
			});
		};

		$scope.templates = {
			list: '/views/layer/list-item.html'
		};

	}
];