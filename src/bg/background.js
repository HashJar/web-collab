var background = (function() {

    var lastClickPosition;
    
    function addMessageListener() {
        chrome.runtime.onMessage.addListener(
          function(request, sender, sendResponse) {
            if(request.event == 'mouseup' ) {
                lastClickPosition = request.point;
            }
            console.log(request);
            sendResponse({'message': 'Thanks!'});
          });
    }

    function menuClicked(event, tab) {
        chrome.tabs.sendMessage(tab.id, {'event': 'menu-clicked', 'position': lastClickPosition}, function(response) {
            console.log(response);
          });
        console.log(event, tab);
    }

    function addContextMenu() { 
        chrome.contextMenus.create({
              title: "Web Collab - Create",
              contexts: ["all"],
              onclick: menuClicked
        });
    }

    function init(){
        addMessageListener();
        addContextMenu();
    }

    return {
        'init' : init
    }
})();

background.init();