'use strict';

/*
 * Loading module
 */
angular.module('mapasColetivos.loadingStatus', [])

.config([
	'$httpProvider',
	function($httpProvider) {
		$httpProvider.interceptors.push('loadingStatusInterceptor');
	}
])

.directive('loadingStatusMessage', function() {
	return {
		link: function($scope, $element, attrs) {
			var show = function(event, message) {
				$element.addClass('active').find('.loading-message').html(message);
			};
			var hide = function() {
				$element.removeClass('active');
			};
			$scope.$on('loadingStatusActive', show);
			$scope.$on('loadingStatusInactive', hide);
			hide();
		}
	};
})

.factory('loadingStatusInterceptor', [
	'$q',
	'$rootScope',
	'$timeout',
	function($q, $rootScope, $timeout) {
		var loadingMessage = 'Carregando...';
		var activeRequests = 0;
		var started = function() {
			if(activeRequests==0) {
				$rootScope.$broadcast('loadingStatusActive', loadingMessage);
			}    
			activeRequests++;
		};
		var ended = function() {
			activeRequests--;
			if(activeRequests==0) {
				$rootScope.$broadcast('loadingStatusInactive', loadingMessage);
			}
		};
		return {
			request: function(config) {

				if(config.loadingMessage)
					loadingMessage = config.loadingMessage;
				else
					loadingMessage = 'Carregando...';

				started();
				return config || $q.when(config);
			},
			response: function(response) {
				ended();
				return response || $q.when(response);
			},
			responseError: function(rejection) {
				ended();
				return $q.reject(rejection);
			}
		};
	}
]);