//Initialisierung Variablen
var lat;
var long;
var latlong;
var timestamp;
var alt;
var acc;
var altacc;
var speed;
var cumulativeDistance = getSavedValue("cumulativeDistance");
document.getElementById("cumulativeDistance").innerHTML = cumulativeDistance;
var bearing = getSavedValue("bearing");
if (bearing) {
    document.getElementById("compass").style.transform = "rotate(+" + Math.round(bearing) + "deg)";
    document.getElementById("compass").style.webkitTransform = "rotate(+" + Math.round(bearing) + "deg)";
} else {
    document.getElementById("compass").style = "opacity:0.5";

}

var layerGroup;
var positions = getSavedValue("positions");
var watcher;
var mapInterval;
var mywakelock;
var counter = getSavedValue("counter");
document.getElementById("counter").innerHTML = counter;

//Initilaisierung Map
L.Icon.Default.imagePath = "/img/";
L.Icon.Default.prototype.options.iconUrl = "marker-icon.png";
L.Icon.Default.prototype.options.iconRetinaUrl = "marker-icon-2x.png";
L.Icon.Default.prototype.options.shadowUrl = "marker-shadow.png";
var map = L.map("map").setView([51.505, -0.09], 13);
layerGroup = L.layerGroup().addTo(map);
setMarkers();


//Fehlermeldung ignorieren
map.on("error", (e) => {
    if (e && e.error !== "Error: Not Found") console.error(e);
});

//OpenStreetMap-Kartendienst wird geladen
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 23,
    maxNativeZoom: 19
}).addTo(map);


//Wenn keine Positionsdaten vorhanden dann Downloadinhalte deaktivieren
if (counter == 0) {
    document.getElementById("i2").disabled = true;
    document.getElementById("json").disabled = true;
    document.getElementById("kml").disabled = true;
    document.getElementById("igc").disabled = true;

}

//Hauptfunktion die beim Track-Button aufgerufen wird
function getLocation() {
    document.getElementById("b1").onclick = stopIt;
    document.getElementById("b1").innerHTML = "Tracking stoppen";

    if (navigator.geolocation) {
        startWakeLock();
        setupWatch();

        var element = null;
        var oldlat = null;
        var oldlong = null;
        var oldalt = 0;
        var oldlatlong = null;
        var distance = 0;

        //Alle 5sek wird die letzte Position auf der Karte markiert
        mapInterval = setInterval(function () {
            setupWatch();

            if (positions.length !== 0) {
                element = positions[positions.length - 1];
                oldlat = element.Latitude;
                oldlong = element.Longitude;
                oldalt = element.Altitude;
                oldlatlong = L.latLng(oldlat, oldlong);
                distance = oldlatlong.distanceTo(latlong);
                distance = Math.round(distance * 100) / 100;
                bearing = Math.round(calculateBearing(oldlat, oldlong, lat, long) * 100) / 100;
            }

            //Nur Werte ermitteln bei denen Längen-,Breiten oder Höhengrad unterschiedlich ist
            if (oldlat !== lat || oldlong !== long || oldalt !== alt) {

                counter++;
                map.setView(latlong, 21);
                let marker = L.marker(latlong).addTo(layerGroup);
                marker.bindPopup(
                    "Nr. : " + counter + "<br>" +
                    "Time: " + new Date(timestamp).toLocaleTimeString('en-US', {hour12: false}) + "<br>" +
                    "Latitude: " + lat + "<br>" +
                    "Longitude: " + long + "<br>" +
                    "Altitude: " + alt + "m<br>" +
                    "Distance-to-Last: " + distance + "m<br>" +
                    "Altitude-to-Last: " + (oldalt !== 0 ? (Math.round((alt - oldalt) * 100) / 100) : 0) + "m<br>" +
                    "Bearing: " + bearing + " (" + getCompassDirection(bearing) + ")").openPopup();

                //Sofern mehr als 2 Positionen ermittelt wurden können die Distanzen ermittelt und auf der Karte
                //angezeigt werden
                if (positions.length !== 0) {

                    L.polyline([oldlatlong, latlong], {color: "blue"}).addTo(layerGroup);
                    cumulativeDistance += distance;
                    document.getElementById("cumulativeDistance").innerHTML = cumulativeDistance;
                    localStorage.setItem("cumulativeDistance", cumulativeDistance);

                    //Kompass wird aktualisiert
                    if (positions.length == 1) {
                        document.getElementById("compass").style = "opacity:1";
                    }
                    document.getElementById("main-arrow").style.transform = "rotate(+" + Math.round(bearing) + "deg)";
                    document.getElementById("main-arrow").style.webkitTransform = "rotate(+" + Math.round(bearing) + "deg)";
                    localStorage.setItem("bearing", bearing);

                }

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
                    Speed: speed,
                    Timestamp: timestamp,
                    DistanceToLast: distance,
                    AltToLast: (alt - oldalt),
                    Bearing: bearing
                };
                //Dieser JSON-Objekt wird dem Array überführt
                //Array wird anschließend dem lokalen Speicher zugeführt
                positions.push(posobj);
                localStorage.setItem("positions", JSON.stringify(positions));

            }
        }, 5000);


    } else {
        console.alert("Geolocation is not supported by this browser.");
    }
}

//Funktion die zur Bestimmung der aktuellen Position dient
//Ändert automatisch jeweiligen Positionswerte sobald sich die Position ändert
function setupWatch() {
    if (watcher) {
        navigator.geolocation.clearWatch(watcher);
    }
    watcher = navigator.geolocation.watchPosition(setParameters, showErrors, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });
}

//Funktion um die Positionsermittlung zu stoppen
function stopIt() {
    if (mywakelock) {
        mywakelock.release();
    }
    navigator.geolocation.clearWatch(watcher);
    clearInterval(mapInterval);

    document.getElementById("b1").onclick = getLocation;
    document.getElementById("b1").innerHTML = "Track mich";
    if (counter != 0) {
        document.getElementById("i2").disabled = false;
        document.getElementById("json").disabled = false;
        document.getElementById("kml").disabled = false;
        document.getElementById("igc").disabled = false;
    }
}

//Funktion zum Ändern der jeweiligen Positionswerte
function setParameters(position) {

    lat = position.coords.latitude;
    long = position.coords.longitude;
    latlong = L.latLng(lat, long);
    timestamp = position.timestamp;
    alt = Math.round(position.coords.altitude * 100) / 100;
    acc = position.coords.accuracy;
    altacc = position.coords.altitudeAccuracy;
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

//Funktion zum Download der Positionsdaten je nach Auswahl des Ausgabeformats als JSON-, KML- oder IGC-Datei
function download() {
    var filename = "webbtracker-data";
    var output = "";
    if (document.getElementById("json").checked) {
        filename = filename + ".json";
        output = JSON.stringify(positions);
    } else if (document.getElementById("kml").checked) {
        filename = filename + ".kml";

        var json = layerGroup.toGeoJSON();
        var kml = tokml(json);
        output = kml;
    } else if (document.getElementById("igc").checked) {
        filename = filename + ".igc";
        output = getIgcData();
    }

    var element = document.createElement("a");
    element.setAttribute("href", "data:application/octet-stream," + encodeURIComponent(output));
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();
    element.download;
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
        if (v == "bearing") {
            return null;
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
    layerGroup.clearLayers();
    if (localStorage.getItem("counter")) {
        localStorage.removeItem("counter");
    }
    if (localStorage.getItem("positions")) {
        localStorage.removeItem("positions");
    }
    if (localStorage.getItem("cumulativeDistance")) {
        localStorage.removeItem("cumulativeDistance");
    }
    if (localStorage.getItem("bearing")) {
        localStorage.removeItem("bearing");
    }
    positions = [];
    counter = 0;
    cumulativeDistance = 0;
    bearing = null;
    document.getElementById("counter").innerHTML = counter;
    document.getElementById("cumulativeDistance").innerHTML = cumulativeDistance;
    document.getElementById("compass").style = "opacity:0.5";
    document.getElementById("main-arrow").style.transform = "rotate(0deg)";
    document.getElementById("main-arrow").style.webkitTransform = "rotate(0deg)";
    document.getElementById("i2").disabled = true;
    document.getElementById("json").disabled = true;
    document.getElementById("kml").disabled = true;
    document.getElementById("igc").disabled = true;
}

//Funktion die alle Marker neu setzt (sobald Seite neu geladen wird)
//Greift auf die lokalen Positionsdaten zu
function setMarkers() {
    let oldll = null;
    let ll = null;
    positions.forEach((element) => {
        oldll = ll;
        ll = L.latLng(element.Latitude, element.Longitude);
        const marker = L.marker(ll).addTo(layerGroup);
        marker.bindPopup(
            "Nr. : " + element.Counter + "<br>" +
            "Time: " + new Date(element.Timestamp).toLocaleTimeString('en-US', {hour12: false}) + "<br>" +
            "Latitude: " + element.Latitude + "<br>" +
            "Longitude: " + element.Longitude + "<br>" +
            "Altitude: " + element.Altitude + "m<br>" +
            "Distance-to-Last: " + element.DistanceToLast + "m<br>" +
            "Altitude-to-Last:" + element.AltToLast + "m<br>" +
            "Bearing: " + element.Bearing).openPopup();

        if (oldll) {
            L.polyline([oldll, ll], {color: "blue"}).addTo(layerGroup);
        }
    });

    if (positions.length != 0) {
        map.setView(ll, 21);
    }
}

//Funktion die das Endgerätfenster aktiv hält
async function startWakeLock() {
    if ('wakeLock' in navigator) {

        mywakelock = await navigator.wakeLock.request("screen");

    } else {
        console("not there");
    }
}

//Funktion zur Bestimmung der Peilung zwischen 2 Standortpunkten
function calculateBearing(startLat, startLng, destLat, destLng) {
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

//Funktion zur Umwandlung von Grad in Bogenmaß
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

//Funktion zur Umwandlung von Bogenmaß in Grad
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

//Funktion zur Bestimmung der Himmelsrichtung für die Kompassfunktion
function getCompassDirection(bearing) {
    if (bearing == null) {
        return null;
    } else if (bearing >= 337.5 || bearing < 22.5) {
        return "North";
    } else if (bearing >= 22.5 && bearing < 67.5) {
        return "North East";
    } else if (bearing >= 67.5 && bearing < 112.5) {
        return "East";
    } else if (bearing >= 112.5 && bearing < 157.5) {
        return "South East";
    } else if (bearing >= 157.5 && bearing < 202.5) {
        return "South";
    } else if (bearing >= 202.5 && bearing < 247.5) {
        return "South West";
    } else if (bearing >= 247.5 && bearing < 292.5) {
        return "West";
    } else if (bearing >= 292.5 && bearing < 337.5) {
        return "North West";
    }

    return null;


}

//Funktion zum Aufbau des IGC-Formats
function getIgcData() {
    var element = positions[positions.length - 1];
    var time = element.Timestamp;
    var fullYear = new Date(time).getFullYear();
    var year = (fullYear + "").substr(-2);
    var day = new Date(time).getDate();
    var month = new Date(time).getMonth() + 1;
    if ((month + "").length != 2) {
        month = "0" + month;
    }
    var igcString = "AXXXXXXWebtracker\nHFDTE" + day + month + year + "\nHFPLTPILOT:Webtracker-User\nHFGTYGLIDERTYPE:Unknown\nI000000XXX\nF000000XXXXXX\n";

    positions.forEach((element) => {
        var hours = new Date(element.Timestamp).getHours();
        if ((hours + "").length != 2) {
            hours = "0" + hours;
        }
        var minutes = new Date(element.Timestamp).getMinutes();
        if ((minutes + "").length != 2) {
            minutes = "0" + minutes;
        }
        var seconds = new Date(element.Timestamp).getSeconds();
        if ((seconds + "").length != 2) {
            seconds = "0" + seconds;
        }
        var longitude = element.Longitude;
        var longD = Math.trunc(longitude);
        var longM = Math.trunc(((longitude - longD) * 60));
        var longDm = Math.trunc((longitude - longD - (longM / 60)) * 60000);
        var longDirection;
        if (longitude > 0) {
            longDirection = "E";
        } else {
            longDirection = "W";
        }
        if ((longD + "").length != 3) {
            if ((longD + "") != 2) {
                longD = "00" + longD;
            } else {
                longD = "0" + longD;
            }
        }
        if ((longM + "").length != 2) {
            longM = "00" + longM;
        }

        var longitudeDmm = "" + longD + longM + longDm + longDirection;
        var latitude = element.Latitude;
        var latD = Math.trunc(latitude);
        var latM = Math.trunc(((latitude - latD) * 60));
        var latDm = Math.trunc((latitude - latD - (latM / 60)) * 60000);
        var latDirection;
        if (latitude > 0) {
            latDirection = "N";
        } else {
            latDirection = "S";
        }

        if ((latD + "").length != 2) {
            latD = "0" + latD;
        }
        if ((latM + "").length != 2) {
            latM = "00" + latM;
        }
        var latitudeDmm = "" + latD + latM + latDm + latDirection;

        var altitude = Math.trunc(element.Altitude);
        var altString = altitude + "";
        while (altString.length != 5) {
            altString = "0" + altString;
        }
        igcString = igcString + "B" + hours + minutes + seconds + latitudeDmm + longitudeDmm + "A" + "00000" + altString + "\n";

    });
    igcString = igcString + "GSSSSSSSSSSSSSSSSSSSSSSSSSSSSS\n";

    return igcString;
}


