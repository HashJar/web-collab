var inject = (function() {
    
    var lastMarkerId, urlHash;

    function addMarker(position, markerId) {
        var marker, markerIcon;

        // Create outer wrapper for the marker
        marker = document.createElement('div');
        marker.setAttribute('style', 'top:' + position.y + 'px;left:' + position.x + 'px');
        marker.setAttribute('data-top', position.y);
        marker.setAttribute('data-left', position.x);
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
        notebox.addEventListener('blur', noteboxLostFocus, false);

        note.appendChild(notebox);
        marker.appendChild(note);
        notebox.focus();
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


    function createHash(inputString) {
        var hash = 0, i, chr;
        for (i = 0; i < inputString.length; i++) {
          chr   = inputString.charCodeAt(i);
          hash  = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
        }
        console.log(hash);
        return hash.toString();
    }
    
    /*
        Event listeners
    */

    function toggleMarkerActive() {
        this.parentNode.classList.toggle('web-collab-active');
    }

    function noteboxLostFocus() {
        var noteText, marker, markerPosition;
        
        noteText = this.value.trim();
        marker = this.parentNode.parentNode;
        markerPosition = {x: marker.getAttribute('data-left'), y: marker.getAttribute('data-top')};
        
        chrome.storage.local.get([urlHash], function(result) {
            console.log(result);
            var store = {};
            store[urlHash] = {};
            if(typeof result[urlHash]['noteText'] != 'undefined' && result[urlHash]['noteText'] == noteText ) {
                // return
                console.log('Not updated')
                return;
            }

            if(typeof result[urlHash] == 'object') {
                store[urlHash] = result[urlHash];
            }
            store[urlHash]['position'] = markerPosition;
            store[urlHash]['noteText'] = noteText;
            if(typeof store[urlHash]['createdOn'] == 'undefined') {
                store[urlHash]['createdAt'] = 'now';
            }
            store[urlHash]['undatedAt'] = 'now';

            chrome.storage.local.set(store, function() {
                console.log('Value is set to ' + store);
            });
        });
        this.parentNode.parentNode.classList.toggle('web-collab-active');
    }

    function init() {
        urlHash = createHash(window.location.href);
        addClickListener();
        addMessageListener();
    }

    return {
        'init' : init
    }

})();

inject.init();