"use strict";

var inject = (function() {
    
    var lastMarkerId, urlHash, markerIdPrefix;

    lastMarkerId = 0;
    markerIdPrefix = 'web-collab-marker-';

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
        lastMarkerId += 1;

        return markerIdPrefix + lastMarkerId.toString();
    }

    function addNotebox(markerId, askForNote, noteText) {
        var marker, notebox, note, buttonBar, saveButton, cancelButton, 
            shareButton, deleteButton, messageBox;

        if(typeof noteText == 'undefined') {
            noteText = '';
        }

        marker = document.getElementById(markerId);
        
        note = document.createElement('div');
        note.classList.add("web-collab-marker-note");
        notebox = document.createElement('textarea');
        notebox.value = noteText;
        notebox.onchange = noteUpdated;

        // Add action buttons

        buttonBar = document.createElement('div');
        buttonBar.classList.add('web-collab-button-bar');

        saveButton = document.createElement('button')
        saveButton.classList.add('web-collab-button', 'web-collab-save-button');
        saveButton.innerText = 'Save';
        saveButton.addEventListener('click', saveNote, false);
        buttonBar.appendChild(saveButton);

        cancelButton = document.createElement('button')
        cancelButton.classList.add('web-collab-button', 'web-collab-cancel-button');
        cancelButton.innerText = 'Cancel';
        cancelButton.addEventListener('click', cancelNote, false);
        buttonBar.appendChild(cancelButton);

        shareButton = document.createElement('button')
        shareButton.classList.add('web-collab-button', 'web-collab-share-button');
        shareButton.innerText = 'Share';
        shareButton.addEventListener('click', shareMarker, false);
        buttonBar.appendChild(shareButton);

        deleteButton = document.createElement('button')
        deleteButton.classList.add('web-collab-button', 'web-collab-delete-button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', deleteMarker, false);
        buttonBar.appendChild(deleteButton);

        messageBox =  document.createElement('div');
        messageBox.classList.add('web-collab-message-box');


        note.appendChild(notebox);
        note.appendChild(buttonBar);
        marker.appendChild(note);

        if(askForNote == true) {
            setTimeout(function() { 
                marker.classList.add("web-collab-active");
                notebox.focus();
            }, 500);
        }

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

    function loadMarkers() {
        chrome.storage.local.get([urlHash + '-marker-list'], function(index) {
            if(typeof index[urlHash + '-marker-list'] == 'undefined') {
                console.log('No markers found!')
                return; 
            }

            // Get all markers from storage
            chrome.storage.local.get(index[urlHash + '-marker-list'], function(markerList) {
                Object.keys(markerList).forEach(function(markerkey) {
                    console.log(markerkey, markerList[markerkey]);
                    var markerId;

                    markerId = markerIdPrefix + markerList[markerkey]['id'];
                    if (parseInt(markerList[markerkey]['id']) > lastMarkerId){ 
                        lastMarkerId = parseInt(markerList[markerkey]['id']);
                    }
                    addMarker(markerList[markerkey]['position'], markerId);
                    addNotebox(markerId, false, markerList[markerkey]['noteText']);
                });
            }); 

        });
    }
    
    /*
        Event listeners
    */

    function handleContextMenuClick(position) {
        var markerId;
        markerId = newMarkerId();
        addMarker(position, markerId);
        addNotebox(markerId, true);
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

    function toggleMarkerActive() {
        this.parentNode.classList.toggle('web-collab-active');
    }

    function noteUpdated(e) {
        this.parentNode.parentNode.classList.add('web-collab-note-updated');
    }

    function saveNote() {
        var noteTextarea, noteText, markerElement, marker, markerKey;
        
        noteTextarea = this.parentNode.parentNode.getElementsByTagName('textarea');
        noteTextarea = noteTextarea.length > 0 ? noteTextarea[0] : null;
        if (noteTextarea == null) {
            console.log('Note textarea element missing');
            return;
        }
        
        noteText = noteTextarea.value.trim();
        markerElement = this.parentNode.parentNode.parentNode; // Get the web-collab-marker element
        marker = {id: markerElement.getAttribute('id').replace(markerIdPrefix, ''), 
            x: markerElement.getAttribute('data-left'), y: markerElement.getAttribute('data-top')};
        markerKey = urlHash + '-' + marker.id;

        chrome.storage.local.get([markerKey], function(result) {
            console.log(result);
            var store = {};
            store[markerKey] = {};
            if(typeof result[markerKey] != 'undefined' && typeof result[markerKey]['noteText'] != 'undefined' 
                && result[markerKey]['noteText'] == noteText ) {
                console.log('Not updated')
                return;
            }

            if(typeof result[markerKey] == 'object') {
                store[markerKey] = result[markerKey];
            }
            store[markerKey]['id'] = marker.id;
            store[markerKey]['position'] = {x: marker.x, y: marker.y};
            store[markerKey]['noteText'] = noteText;
            if(typeof store[markerKey]['createdOn'] == 'undefined') {
                store[markerKey]['createdAt'] = new Date();;
            }
            store[markerKey]['undatedAt'] = new Date();;

            chrome.storage.local.set(store, function() {
                console.log('Value is set to ' + store);
            });
        });

        // Async-ly add marker Id to list of markers for the page. 
        chrome.storage.local.get([urlHash + '-marker-list'], function(result) {
            console.log(result);
            if(typeof result[urlHash + '-marker-list'] == 'undefined') {
                result[urlHash + '-marker-list'] = [];
            }
            if(result[urlHash + '-marker-list'].indexOf(markerKey) == -1) {
                result[urlHash + '-marker-list'].push(markerKey);
            }
            chrome.storage.local.set(result, function() {
                console.log('Value is set to ' + result);
            });
        });

        this.parentNode.parentNode.parentNode.classList.remove('web-collab-active', 'web-collab-note-updated');
        
    }

    function cancelNote() {
        // Get the marker element
        // web-collab-button < web-collab-button-bar < web-collab-marker-note < web-collab-marker

        this.parentNode.parentNode.parentNode.classList.toggle('web-collab-active');
    }

    function shareMarker() {}
    
    function deleteMarker() {}


    function init() {
        urlHash = createHash(window.location.href);
        addClickListener();
        addMessageListener();

        loadMarkers();
    }

    return {
        'init' : init
    }

})();

inject.init();