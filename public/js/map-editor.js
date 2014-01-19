var mapEditor = angular.module('mapEditor', ['ngRoute']);
var apiPrefix = '/api/v1';
var map;
var featureLayer;

map = L.map('map', {
	center: [0, 0],
	zoom: 2
});
map.addLayer(L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png'));

mapEditor.config(function($routeProvider, $locationProvider) {

	$routeProvider
		.when('/features', {
			controller: 'FeatureCtrl',
			templateUrl: '/partials/map-editor/features'
		})
		.when('/media', {
			controller: 'MediaCtrl',
			templateUrl: '/partials/map-editor/media'
		})
		.otherwise({
			redirectTo: '/features'
		});

});

mapEditor.controller('FeatureCtrl', function($scope, $http) {

	$http.get('/js/infoamazonia.json').success(function(features) {

		$scope.features = features;

		if(typeof featureLayer !== 'undefined' && map.hasLayer(featureLayer)) {

			map.removeLayer(featureLayer);

		}

		featureLayer = L.geoJson({
			type: "FeatureCollection",
			features: features
		});

		map.addLayer(featureLayer);

		//map.fitBounds(featureLayer.getBounds());

	});

});

mapEditor.controller('MediaCtrl', function($scope, $http) {

	$scope.media = [
		{
			title: 'Media 01'
		},
		{
			title: 'Media 02'
		}
	];

});