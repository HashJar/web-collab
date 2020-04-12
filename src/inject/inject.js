var inject = (function() {
    
    var lastMarkerId;

    function addMarker(position, markerId) {
        var marker, markerIcon;

        // Create outer wrapper for the marker
        marker = document.createElement('div');
        marker.setAttribute('style', 'top:' + position.y + 'px;left:' + position.x + 'px');
        marker.setAttribute('class', 'web-collab-marker');
        marker.setAttribute('id', markerId);
        

        // Create marker icon
        markerIcon = document.createElement('div');
        markerIcon.setAttribute('class', 'web-collab-marker-icon');
        markerIcon.addEventListener('click', toggleMarkerActive, false);
        
        marker.appendChild(markerIcon);
        document.body.appendChild(marker);
    }

    function newMarkerId() {
        if ('undefined' == typeof lastMarkerId) {
            lastMarkerId = 0;
        }
        lastMarkerId += 1;

        return 'web-collab-marker-' + lastMarkerId.toString();
    }

    function askForNote(markerId) {
        var marker, notebox, note;
        marker = document.getElementById(markerId);
        marker.classList.add("web-collab-active");
        note = document.createElement('div');
        note.classList.add("web-collab-marker-note");
        notebox = document.createElement('textarea');
        note.appendChild(notebox);
        marker.appendChild(note);
    }

    function handleContextMenuClick(position) {
        var markerId, note;
        markerId = newMarkerId();
        addMarker(position, markerId);
        setTimeout(function() { askForNote(markerId) }, 500);
    }

    function addMessageListener() {
        chrome.runtime.onMessage.addListener(
          function(request, sender, sendResponse) {
            console.log(request);
            handleContextMenuClick(request.position);

            sendResponse({'message': 'Thanks!'});
          });
    }

    function addClickListener() {
        document.addEventListener('mousedown', function (mousePosition) {
            if (mousePosition.button != 2) {
                return;
            }

            var point = {'x': mousePosition.clientX + window.scrollX , 'y': mousePosition.clientY + window.scrollY};
            var message = {'event': 'mouseup', 'point': point};
            chrome.runtime.sendMessage(message, function(response) {});
        });
    }


    /*
        Event listeners
    */
    function toggleMarkerActive() {
        this.parentNode.classList.toggle('web-collab-active')
    }

    function init() {
        addClickListener();
        addMessageListener();
    }

    return {
        'init' : init
    }

})();

inject.init();