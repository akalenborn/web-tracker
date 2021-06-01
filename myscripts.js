//Initialisierung Variablen
var lat;
var long;
var latlong;
var timestamp;
var alt;
var acc;
var altacc;
var heading;
var speed;
var cumulativeDistance = getSavedValue("cumulativeDistance");
document.getElementById("cumulativeDistance").innerHTML = cumulativeDistance;
var layerGroup;
var positions = getSavedValue("positions");
var watcher;
var mapInterval;
var mywakelock;
var counter = getSavedValue("counter");
document.getElementById("counter").innerHTML = counter;
var string = getSavedValue("string");

//Initilaisierung Map
L.Icon.Default.imagePath="/";
L.Icon.Default.prototype.options.iconUrl = "marker-icon.png";
L.Icon.Default.prototype.options.iconRetinaUrl ="marker-icon-2x.png";
L.Icon.Default.prototype.options.shadowUrl ="marker-shadow.png";
var map = L.map("map").setView([51.505, -0.09], 13);
layerGroup = L.layerGroup().addTo(map);
setMarkers();


//Fehlermeldung ignorieren
map.on("error", (e) => {
    if (e && e.error !== "Error: Not Found") console.error(e);
});

//Kartendienst wird geladen
L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 23,
    id: "mapbox/streets-v11",
    tileSize: 512,
    zoomOffset: -1,
    accessToken: "pk.eyJ1IjoibGV4ZW50IiwiYSI6ImNrbnFoYnA4YjBjcnUyd3Bma3NiM3hxMnkifQ.U8mRqy94iQ8pZv-gmTAeGA",
}).addTo(map);

//Wenn keine Positionsdaten vorhanden dann Download deaktivieren
if (counter == 0) {
    document.getElementById("i1").disabled = true;
    document.getElementById("i2").disabled = true;
}

//Hauptfunktion die beim Track-Button aufgerufen wird
function getLocation() {
    document.getElementById("b1").onclick = stopIt;
    document.getElementById("b1").innerHTML = "Tracking stoppen";
    document.getElementById("i1").disabled = true;
    document.getElementById("i2").disabled = true;

    if (navigator.geolocation) {
        startWakeLock();
        setupWatch();

        var element=null;
        var oldlat=null;
        var oldlong=null;
        var oldlatlong=null;
        var distance=null;
        var bearing=null;

        //Alle 5sek wird die letzte Position auf der Karte markiert
        mapInterval = setInterval(function () {
            setupWatch();

            if (positions.length !== 0) {
                element = positions[positions.length - 1];
                oldlat = element.Latitude;
                oldlong = element.Longitude;
                oldlatlong = L.latLng(oldlat,oldlong);
                distance = oldlatlong.distanceTo(latlong);
                bearing = calculateBearing(oldlat,oldlong,lat,long);
            }

            if (oldlat !== lat && oldlong !== long ) {



                counter++;
                map.setView(latlong, 21);
                let marker = L.marker(latlong).addTo(layerGroup);
                marker.bindPopup(
                    "Nr. : " + counter + "<br>" +
                    "Time: "+ new Date (timestamp).toLocaleTimeString('en-US', { hour12: false }) + "<br>"+
                    "Latitude: " + lat + "<br>" +
                    "Longitude: " + long + "<br>" +
                    "Altitude: " + alt+"<br>" +
                    "Distance-to-Last: "+distance+"<br>" +
                    "Bearing: "+bearing+" ("+getCompassDirection(bearing)+")").openPopup();

                document.getElementById("main-arrow").style.transform = "rotate(+"+Math.round(bearing)+"deg)";
                document.getElementById("main-arrow").style.webkitTransform = "rotate(+"+Math.round(bearing)+"deg)";



                if(positions.length !== 0){
                    L.polyline([oldlatlong,latlong],{color:"blue"}).addTo(layerGroup);
                    cumulativeDistance += distance;
                    document.getElementById("cumulativeDistance").innerHTML = cumulativeDistance;
                    localStorage.setItem("cumulativeDistance",cumulativeDistance);
                }

                //Diese Position wird anschließend dem String überführt der alle Positionsdaten ausgibt
                string = string + "\n" + new Date(timestamp) + " " + lat + " " + long;
                localStorage.setItem("string", string);
                document.getElementById("counter").innerHTML = counter;
                localStorage.setItem("counter", counter);

                //JSON Objekt mit allen Geolocation Daten
                posobj = {
                    Counter: counter,
                    Latitude: lat,
                    Longitude: long,
                    Altitude: alt,
                    Accuracy: acc,
                    AltAccuracy: altacc,
                    Heading: heading,
                    Speed: speed,
                    Timestamp: timestamp,
                    Distance: distance,
                    Bearing: bearing
                };
                //Dieser JSON-Objekt wird dem Array überführt
                //Array wird anschließend dem lokalen Speicher zugeführt
                positions.push(posobj);
                localStorage.setItem("positions", JSON.stringify(positions));

            }
        }, 5000);


    } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
}

//Funktion die zur Bestimmung der aktuellen Position dient
//Ändert automatisch jeweiligen Positionswerte sobald sich die Position ändert
function setupWatch() {
    if(watcher){
        navigator.geolocation.clearWatch(watcher);
    }
    watcher = navigator.geolocation.watchPosition(setParameters, showErrors, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge:0
    });
}

//Funktion um die Positionsermittlung zu stoppen
function stopIt() {
    navigator.geolocation.clearWatch(watcher);
    clearInterval(mapInterval);

    document.getElementById("b1").onclick = getLocation;
    document.getElementById("b1").innerHTML = "Track mich";
    document.getElementById("i1").disabled = false;
    document.getElementById("i2").disabled = false;
}

//Funktion zum Ändern der jeweiligen Positionswerte
function setParameters(position) {

    lat = position.coords.latitude;
    long = position.coords.longitude;
    latlong = L.latLng(lat,long);
    timestamp = position.timestamp;
    alt = position.coords.altitude;
    acc = position.coords.accuracy;
    altacc = position.coords.altitudeAccuracy;
    heading = position.coords.heading;
    speed = position.coords.speed;

}

//Funktion die ausgeführt wird, sobald kein Standort ermittelt werden kann
function showErrors(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            console.error("User denied the request for Geolocation.");
            break;

        case error.POSITION_UNAVAILABLE:
            console.error("Location information is unavailable.");
            break;

        case error.TIMEOUT:
            console.error("The request to get user location timed out.");
            break;

        case error.UNKNOWN_ERROR:
            console.error("An unknown error occurred.");
            break;
    }
}

//Funktion zum Download des bisher erzeigten Strings als Text-Datei
function download(filename, text) {
    var element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(string));
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

//Funktion der auf eine bestimmte lokale Variable zugreift
function getSavedValue(v) {
    if (!localStorage.getItem(v)) {
        if (v == "counter" || v == "cumulativeDistance") {
            return 0;
        }
        if (v == "positions") {
            return [];
        }
        return "";
    }
    if (v == "positions") {
        return JSON.parse(localStorage.getItem(v));
    }
    return localStorage.getItem(v);
}

//Funktion zum Zurücksetzen aller lokalen Inhalte wie auch Marker
function removeAll() {
    if(mywakelock) {
        mywakelock.release();
    }
    layerGroup.clearLayers();
    if (localStorage.getItem("counter")) {
        localStorage.removeItem("counter");
    }
    if (localStorage.getItem("string")) {
        localStorage.removeItem("string");
    }

    if (localStorage.getItem("positions")) {
        localStorage.removeItem("positions");
    }
    if (localStorage.getItem("cumulativeDistance")) {
        localStorage.removeItem("cumulativeDistance");
    }
    positions = [];
    string = "";
    counter = 0;
    cumulativeDistance =0;
    document.getElementById("counter").innerHTML = counter;
    document.getElementById("cumulativeDistance").innerHTML = cumulativeDistance;
    document.getElementById("i1").disabled = true;
    document.getElementById("i2").disabled = true;
}

//Funktion die alle Marker neu setzt (sobald Seite neu geladen wird)
//Greift auf die lokalen Positionsdaten zu
function setMarkers() {
    let oldll=null;
    let ll=null;
    positions.forEach((element) => {
        oldll = ll;
        ll = L.latLng(element.Latitude, element.Longitude);
        const marker = L.marker(ll).addTo(layerGroup);
        marker.bindPopup(
            "Nr. : " + element.Counter+ "<br>" +
            "Time: "+ new Date (element.Timestamp).toLocaleTimeString('en-US', { hour12: false }) + "<br>"+
            "Latitude: " + element.Latitude + "<br>" +
            "Longitude: " + element.Longitude + "<br>" +
            "Altitude: " + element.Altitude+"<br>" +
            "Distance-to-Last: "+element.Distance+"<br>" +
            "Bearing: "+element.Bearing).openPopup();

        if(oldll){
            L.polyline([oldll,ll],{color:"blue"}).addTo(layerGroup);
        }
    });

    if (positions.length != 0) {
        map.setView(ll, 21);
    }
}

async function startWakeLock() {
    if ('wakeLock' in navigator) {

        mywakelock = await navigator.wakeLock.request("screen");

    } else {
        console("not there");
    }
}

function calculateBearing(startLat,startLng,destLat,destLng){
    startLat = toRadians(startLat);
    startLng = toRadians(startLng);
    destLat = toRadians(destLat);
    destLng = toRadians(destLng);

    y = Math.sin(destLng - startLng) * Math.cos(destLat);
    x = Math.cos(startLat) * Math.sin(destLat) -
        Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    brng = Math.atan2(y, x);
    brng = toDegrees(brng);
    return (brng + 360) % 360; 
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

function getCompassDirection(bearing){
    if(bearing>= 337.5 && bearing < 22.5){
        return "North";
    }
    else if(bearing>= 22.5 && bearing < 67.5){
        return "North East";
    }
    else if(bearing>= 67.5 && bearing < 112.5){
        return "East";
    }
    else if(bearing>= 112.5 && bearing < 157.5){
        return "South East";
    }
    else if(bearing>= 157.5 && bearing < 202.5){
        return "South";
    }
    else if(bearing>= 202.5 && bearing < 247.5){
        return "South West";
    }
    else if(bearing>= 247.5 && bearing < 292.5){
        return "West";
    }
    else if(bearing>= 292.5 && bearing < 337.5){
        return "North West";
    }

    return null;



}