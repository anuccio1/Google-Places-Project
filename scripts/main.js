'use strict';

const myApp = angular.module('placesApp', [])
.controller('mainController', ['$scope', '$timeout', 'googlePlacesSvc', function ($scope, $timeout, googlePlacesSvc) {

	//these const variables will be passed to the googlePlacesSvc to initiate the map
	const mapID = 'map';
	const searchTextID = 'txtSearchPlaces';

	$scope.placesSearchText = '';
	$scope.savedLocations = [];
	$scope.locationIsSaved = false;

	$scope.saveLocation = function () {
		let currentLoc = googlePlacesSvc.getCurrentLocation(searchTextID);
		let duplicateLocs = _.filter($scope.savedLocations, function (loc) {	//check if this is already saved
			return loc.id === currentLoc.id;
		});
		if (duplicateLocs.length === 0) {	//only save if not a duplicate
			$scope.savedLocations.push(currentLoc);
			sessionStorage.setItem('savedLocations', JSON.stringify($scope.savedLocations));	//sessionStorage can only save strings
			
			$scope.locationIsSaved = true;
			//show message for 3 seconds only
			$timeout(() => {
				$scope.locationIsSaved = false;
			}, 3000);
			//reload dropdown
			$scope.getSavedLocations();
		}
		$scope.placesSearchText = '';
	}

	$scope.getSavedLocations = function () {
		let currentStorage = sessionStorage.getItem('savedLocations');
		$scope.savedLocations = JSON.parse(currentStorage) || $scope.savedLocations;	//if nothing saved, set to default
	}

	$scope.loadSavedResult = function (index) {
		let currentLoc = $scope.savedLocations[index];
		googlePlacesSvc.setNewLocation(currentLoc);
	}

	//on page load initialize google maps
	$scope.init = function () {
		googlePlacesSvc.initializeMap(mapID, searchTextID);
		$scope.getSavedLocations();
	};

	$scope.init();
}])
.service('googlePlacesSvc', ['$http', function ($http) {

	let currentMap;
	let currentLocation;
	let autocomplete;
	let infowindow;
	let marker;

	//sets up the autocomplete and searching functionality
	//code borrowed from https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete
	this.initializeMap = function (idOfMap, idOfSearchText) {
		currentMap = new google.maps.Map(document.getElementById(idOfMap), {
			center: {lat: 37.7833, lng: -122.4167},
			zoom: 13
		});

		let input = document.getElementById(idOfSearchText);	//passed form controller
		autocomplete = new google.maps.places.Autocomplete(input);
		autocomplete.bindTo('bounds', currentMap);

		infowindow = new google.maps.InfoWindow();
		marker = new google.maps.Marker({
			map: currentMap,
			anchorPoint: new google.maps.Point(0, -29)
		});

		autocomplete.addListener('place_changed', setLocation());
	}

	this.getCurrentLocation = function (idOfSearchText) {
		return currentLocation;
	}

	this.setNewLocation = function (loc) {
		currentLocation = loc;
		setLocation(true)();	//execute immediately
	}

	//newLoc is the new location if user selects from saved places
	function setLocation (newLoc) {
		return function() {
			infowindow.close();
			marker.setVisible(false);
			currentLocation = (newLoc) ? currentLocation : autocomplete.getPlace();
			if (!currentLocation.geometry) {
			  return;
			}

			// If the place has a geometry, then present it on a map.
			if (currentLocation.geometry.viewport) {
			  currentMap.fitBounds(currentLocation.geometry.viewport);
			} else {
			  currentMap.setCenter(currentLocation.geometry.location);
			  currentMap.setZoom(17);
			}
			marker.setIcon(/** @type {google.maps.Icon} */({
			  url: currentLocation.icon,
			  size: new google.maps.Size(71, 71),
			  origin: new google.maps.Point(0, 0),
			  anchor: new google.maps.Point(17, 34),
			  scaledSize: new google.maps.Size(35, 35)
			}));
			marker.setPosition(currentLocation.geometry.location);
			marker.setVisible(true);

			let address = '';
			if (currentLocation.address_components) {
			  address = [
			    (currentLocation.address_components[0] && currentLocation.address_components[0].short_name || ''),
			    (currentLocation.address_components[1] && currentLocation.address_components[1].short_name || ''),
			    (currentLocation.address_components[2] && currentLocation.address_components[2].short_name || '')
			  ].join(' ');
			}

			infowindow.setContent('<div><strong>' + currentLocation.name + '</strong><br>' + address);
			infowindow.open(currentMap, marker);
		}
	}
}]);
