'use strict';

require('angular/angular');

/* 
 * Map module
 */
angular
	.module('mapasColetivos.map', [
		'mapasColetivos.leaflet',
		'mapasColetivos.layer'
	])
	.config([
		'$stateProvider',
		function($stateProvider) {

			$stateProvider
				.state('dashboard.maps', {
					url: '/maps',
					templateUrl: '/views/dashboard/maps.html'
				})
				.state('maps', {
					url: '/maps',
					controller: 'MapCtrl',
					templateUrl: '/views/map/index.html'
				})
				.state('newMap', {
					url: '/maps/new',
					controller: 'MapCtrl',
					templateUrl: '/views/map/index.html'
				})
				.state('singleMap', {
					url: '/maps/:mapId',
					controller: 'MapCtrl',
					templateUrl: '/views/map/show.html'
				})
				.state('singleMap.content', {
					url: '/content/:contentId'
				})
				.state('singleMap.feature', {
					url: '/feature/:featureId'
				})
				.state('editMap', {
					url: '/maps/:mapId/edit',
					controller: 'MapCtrl',
					templateUrl: '/views/map/edit.html'
				});
		}
	])
	.factory('Map', require('./service').Map)
	.controller('MapCtrl', require('./controller').MapCtrl);