var inject = (function() {
    
    function addMarker(position) {
        var marker;
        marker = document.createElement('div');
        marker.setAttribute('style', 'top:' + position.y + 'px;left:' + position.x + 'px');
        marker.setAttribute('class', 'web-collab-marker');
        document.body.appendChild(marker);
    }

    function addMessageListener() {
        chrome.runtime.onMessage.addListener(
          function(request, sender, sendResponse) {
            console.log(request);
            addMarker(request.position);
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

    function init() {
        addClickListener();
        addMessageListener();
    }

    return {
        'init' : init
    }

})();

inject.init();