var inject = (function() {
    
    function addMessageListener() {
        chrome.runtime.onMessage.addListener(
          function(request, sender, sendResponse) {
            console.log(request);
            sendResponse({'message': 'Thanks!'});
          });
    }

    function init(){
        addMessageListener();
    }

    return {
        'init' : init
    }

})();

inject.init();