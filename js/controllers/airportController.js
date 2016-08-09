
var myApp = angular.module("airportApp", ['ui.bootstrap']);

/*
 * Main controller for project, holds functions that will be used and variables
 * that are bound to HTML. Arrays airports hold all U.S airports and airportsLoc
 * hold locations of all U.S airports that are stored in airports.JSON
 */

myApp.controller('airportController', function($scope, $http) {
    $scope.destination = null;
    $scope.departure = null;
    $scope.nauticalMiles = null;
    $scope.airports =  [];
    $scope.airportsLoc = [];
    $scope.paths = [];
    $scope.markers = [];
    $scope.answer = {
        destination:null,
        departure:null
    };

    $http.get("airports.json").then(function (response) {
        for(var i = 0; i < response.data.data.length; i++) {
            if(response.data.data[i][11] == "United States") {
                $scope.airports.push(response.data.data[i][12] + ' - ' + response.data.data[i][9] + ' - ' + response.data.data[i][10]);
                $scope.airportsLoc[response.data.data[i][12]] = new google.maps.LatLng(parseFloat(response.data.data[i][14]),parseFloat(response.data.data[i][15]));
            }
        }
    });

    /*
     * Here initialize the map, we put in Latitude and Longitude
     * Which focuses on the Continental United States,
     * We also remove map controls that can usually be seen
     */

    var mapOptions = {
        center:new google.maps.LatLng(38.8282,-95.5795),
        minZoom: 2,
        zoom:4,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: false,
        panControl: false
    };

    $scope.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);;



    /*
     * Will be called when "Get Distance" button is clicked.
     * The departure and destination will be parsed so the Iata can
     * be used to retrieve it's respective coordinates from Array airportsLoc.
     * Google Maps API computeDistanceBetween will return the distance in meters
     * which will then be converted to nauticalMiles
     */

    $scope.getDistance = function() {
        var destCode = $scope.destination.split(" - ");
        var departCode = $scope.departure.split(" - ");

        $scope.answer.destination = destCode[1];
        $scope.answer.departure = departCode[1];

        var meters = google.maps.geometry.spherical.computeDistanceBetween($scope.airportsLoc[destCode[0]],$scope.airportsLoc[departCode[0]]);
        var nauticalMiles = Math.round(meters * .000539957); // convert to nautical miles
        $scope.nauticalMiles = nauticalMiles;
        $scope.clearRoutes();
        $scope.clearMarkers();
        $scope.plotRoute();
    };

    /*
     * Again we parse the destination and departure and create
     * an array with both their longitude and latitude to be used
     * to build a visible path between two chosen points on the map.
     */

    $scope.plotRoute = function() {
        var destCode = $scope.destination.split(" - ");
        var departCode = $scope.departure.split(" - ");
        var locations = [$scope.airportsLoc[destCode[0]],$scope.airportsLoc[departCode[0]]];
        var middleMarker = {lat:(locations[0].lat() + locations[1].lat())/2, lng:(locations[0].lng() + locations[1].lng())/2};

        var test = google.maps.geometry.spherical.interpolate($scope.airportsLoc[destCode[0]],$scope.airportsLoc[departCode[0]],.5);
        console.log(test);

        var path = new google.maps.Polyline({
            path: locations,
            strokeColor: '#79CDCD',
            strokeOpacity: 1.0,
            strokeWeight: 6,
            geodesic: true
        });
        path.setMap($scope.map);
        $scope.paths.push(path);
        $scope.zoomToFit(locations);
        $scope.addMarker(test);
    };

    $scope.addMarker = function(location) {
        var marker = new google.maps.Marker({
            position: location,
            map: $scope.map,
            animation: google.maps.Animation.DROP
        });

        var infowindow = new google.maps.InfoWindow({
            content: "Distance between " + $scope.answer.departure + " and " + $scope.answer.destination
            + " is " + $scope.nauticalMiles + " nautical miles!"
        });

        infowindow.open($scope.map, marker);
        $scope.markers.push(marker);

    };

    /*
     * Now that the path is created we want to scale the map to make it most visible
     * bounds is found by using google map api and placing it in our map with .fitBounds()
     * We check the array we passed for coordinates that are not undefined
     * to extend the bounds to its proper place.
     *
     */

    $scope.zoomToFit = function(locations) {
        var bounds = new google.maps.LatLngBounds();
        for (i in locations) {
            if(typeof locations[i].position !== 'undefined'){
                bounds.extend(locations[i].position);
            }else{
                bounds.extend(locations[i]);
            }
        }
        this.map.fitBounds(bounds);
    };

    /*
    * Deletes path that is currently on map
    * Then resets the path to empty array
    */
    $scope.clearRoutes = function() {
        for(i in $scope.paths){
            $scope.paths[i].setMap(null);
        }
        $scope.paths = [];
    };

    /*
     * Delete markers that are currently on the map
     * Resets Marker array to be empty
     */

    $scope.clearMarkers = function() {
        for(i in $scope.markers){
            $scope.markers[i].setMap(null);
        }
        $scope.markers = [];
    }
});

/*
 * Directive myMaps is created so we can keep the HTML clean and let all its script
 * run in the JavaScript side.
 * Here we create the div for the map, which will be initialized in the Controller
 */

myApp.directive("myMaps", function() {
   return {
       restrict: "E",
       template: '<div></div>',
       replace: true
   }
});

