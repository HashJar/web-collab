var background = (function() {

    function menuClicked(event, tab) {
        chrome.tabs.sendMessage(tab.id, {'event': 'menu-clicked'}, function(response) {
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
        addContextMenu();
    }

    return {
        'init' : init
    }
})();

background.init();