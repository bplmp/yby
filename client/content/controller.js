'use strict';

require('angular/angular');

/*
 * Content controller
 */

exports.ContentCtrl = [
	'$scope',
	'$rootScope',
	'$stateParams',
	'SirTrevor',
	'Content',
	'Feature',
	'MapService',
	function($scope, $rootScope, $stateParams, SirTrevor, Content, Feature, MapService) {

		$scope.objType = 'content';

		$scope.$content = Content;

		var triggerOnce = true;
		$scope.$watch('$content.get()', function(contents) {
			$scope.contents = contents;
			if($scope.contents && $scope.contents.length) {
				triggerOnce = false;
				viewState();
			}
		});

		$scope.renderBlock = function(block) {
			return SirTrevor.renderBlock(block);
		}

		var viewState = function() {
			if($stateParams.contentId) {
				var content = $scope.contents.filter(function(c) { return c._id == $stateParams.contentId; })[0];
				$scope.view(content);
				return true;
			}
			return false;
		}

		var viewing = false;

		var contents,
			features;

		$scope.view = function(content) {

			if(!content)
				return false;

			contents = Content.get();
			features = Feature.get();

			viewing = true;

			var contentFeatures = Content.getFeatures(content, angular.copy(features));
			if(contentFeatures) {
				Feature.set(contentFeatures);
			}

			$scope.content = content;
			$scope.content.featureObjs = contentFeatures;

		}

		$scope.close = function() {

			Feature.set(features);
			$scope.content = false;
			MapService.fitMarkerLayer();

			viewing = false;

		}

		$scope.new = function() {

			Content.edit({});

		};

		$scope.edit = function(contentId) {

			Content.edit(angular.copy($scope.contents.filter(function(c) { return c._id == contentId; })[0]));

			setTimeout(function() {
				window.dispatchEvent(new Event('resize'));
				document.getElementById('content-edit-body').scrollTop = 0;
			}, 100);

		};

		$rootScope.$on('$stateChangeSuccess', function() {

			if(!viewState() && viewing) {
				$scope.close();
			}

		});

		$scope.$on('layerObjectChange', $scope.close);
		$scope.$on('$stateChangeStart', $scope.close);

	}
];