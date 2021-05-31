    window.addEventListener('load', function(e) {
                                var status = document.getElementById("isonline");

  if (navigator.onLine) {
                        status.style.backgroundColor = 'green';
  } else {
                      status.style.backgroundColor = 'red';
  }
}, false);

window.addEventListener('online', function(e) {
                    var status = document.getElementById("isonline");

if (navigator.onLine) {
                        status.style.backgroundColor = 'green';
  } else {
                      status.style.backgroundColor = 'red';
  }}, false);

window.addEventListener('offline', function(e) {
                    var status = document.getElementById("isonline");

if (navigator.onLine) {
                        status.style.backgroundColor = 'green';
  } else {
                      status.style.backgroundColor = 'red';
  }}, false);
 