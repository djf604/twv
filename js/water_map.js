var poly;
var map, marker, endMarker;

var totalAfricanWalkingDistance = 20160000; // In kilometers





$(function(){
    $('#way').click(function(e) {
        console.log(e);
    });
});


function initMap() {
    var LACoords = new google.maps.LatLng(34.0522342, -118.2436849);

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: {lat: 39.011, lng: -98.48},  // Center the map on Kansas
        draggableCursor: '',
        gestureHandling: 'cooperative'
    });

    endMarker = new google.maps.Marker({
        position: LACoords,
        map: map,
        icon: 'http://maps.google.com/mapfiles/ms/icons/green.png'
    });
    endMarker.addListener('dblclick', showResult);

    marker = new google.maps.Marker({
        position: LACoords,
        map: map,
        icon: 'http://maps.google.com/mapfiles/ms/icons/red.png'
    });



    poly = new google.maps.Polyline({
        strokeColor: '#000000',
        strokeOpacity: 1.0,
        strokeWeight: 3
    });
    poly.setMap(map);
    poly.getPath().push(LACoords);

    // Add a listener for the click event
    map.addListener('click', addLatLng);
}

// Handles click events on a map, and adds a new point to the Polyline.
function addLatLng(event) {
    var path = poly.getPath();

    // Because path is an MVCArray, we can simply append a new coordinate
    // and it will automatically appear.
    path.push(event.latLng);
    google.maps.geometry.spherical.computeLength(poly.getPath().getArray());

    // Set send mark to last clicked position
    endMarker.setPosition(event.latLng);
}

function showResult() {
    // Get user distance in kilometers
    var totalUserDistance = Math.round(google.maps.geometry.spherical.computeLength(poly.getPath().getArray()) / 1000);
    var userDistancePercent = totalUserDistance / totalAfricanWalkingDistance * 100;
    document.getElementById('water-user-distance').innerText = totalUserDistance;
    document.getElementById('water-user-distance-percent').innerText = userDistancePercent.toFixed(3);

    $('#water-result').slideDown();
    $('#water-progress-bar-bar').attr('data-content', userDistancePercent.toFixed(3) + '%');

    document.getElementById('water-progress-bar-bar').style.width =  Math.max(Math.round(userDistancePercent), 1) + '%';
}