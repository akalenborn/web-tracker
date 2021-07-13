<html lang="de">
<head>
    <link rel="manifest" href="/manifest.json"/>
    <link rel="stylesheet" href="mycss.css"/>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
          integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
          crossorigin=""/>
    <script src="tokml.js"></script>
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"
            integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA=="
            crossorigin=""></script>
    <script src="jquery-3.6.0.min.js"></script>

    <link rel="stylesheet" href="bootstrap.min.css">
    <script src="bootstrap.bundle.min.js"></script>


    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <title>Webbasiertes Geotracking</title>
    <script>
        if (navigator.serviceWorker.controller) {
            console.log("Active service worker found");
        } else {
            navigator.serviceWorker
                .register("serviceWorker.js", {
                    scope: "./",
                })
                .then(function (reg) {
                    console.log("Service worker  registered");
                });
        }
    </script>
    <script src="checkOnline.js"></script>
</head>
<body>


<nav class="navbar bg-dark navbar-dark">

    <!-- Brand -->
    <a class="navbar-brand" href="/">Webbasiertes Geotracking
        <div class="isonline" id="isonline"></div>
    </a>

    <!-- Toggler/collapsibe Button -->
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#collapsibleNavbar">
        <span class="navbar-toggler-icon"></span>
    </button>

    <!-- Navbar links -->
    <div class="collapse navbar-collapse" id="collapsibleNavbar">
        <div class="navitems">
            <button id="b1" onclick="getLocation()">Track mich</button>
            <button id="b1" onclick="removeAll()">Reset</button>
            <form onsubmit="download()">
                <input id="i2" type="submit" value="Download"/>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="inlineRadioOptions" id="json" value="option1"
                           required>
                    <label class="form-check-label" for="inlineRadio1">JSON</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="inlineRadioOptions" id="kml" value="option2">
                    <label class="form-check-label" for="inlineRadio2">KML</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="inlineRadioOptions" id="igc" value="option3">
                    <label class="form-check-label" for="inlineRadio3">IGC</label>
                </div>
            </form>
            <p>Anzahl getrackter Positionen: <span id="counter"></span></p>
            <p>Zurückgelegte Distanz: <span id="cumulativeDistance"></span> m</p>

        </div>
    </div>
</nav>


<div id="map">

    <div id="compass" class="compass">
        <div class="compass-inner">
            <div class="north">N</div>
            <div class="east">E</div>
            <div class="west">W</div>
            <div class="south">S</div>
            <div id="main-arrow" class="main-arrow">
                <div id="arrow-up" class="arrow-up"></div>
                <div id="arrow-down" class="arrow-down"></div>
            </div>
        </div>
    </div>
</div>
</body>
<script src="myscripts.js"></script>

</html>
