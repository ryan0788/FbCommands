window.addEventListener("load", function() {
    var nubGroup = document.getElementsByClassName("fbNubGroup")[1];
    FbCommands.processChatNubs(nubGroup);

    var observer = new MutationObserver(function(mutations) {
        setTimeout(function() { // Wait for it to be built
            FbCommands.processChatNubs(nubGroup);
        }, 250);
    });
     
    // Watch the chat nub group for changes in the child list,
    // e.g. chat windows being added/removed
    observer.observe(nubGroup, { childList: true });
});


var FbCommands = {
    managedChats: {},
    commands: {},
    observers: [],

    // Checks children of the passed nubgroup to see if there are any new chat nubs.
    // Invoked on startup and when a chat nub is added or removed.
    processChatNubs: function(nubGroup) {
        var chatNubs = nubGroup.getElementsByClassName("fbNub");
        for (var i = 0; i < chatNubs.length; i++) {
            var nub = chatNubs[i];
            if (document.defaultView.getComputedStyle(nub, null).getPropertyValue('display') == 'none' ||
                ~nub.className.indexOf('fbCommandsManaged')){
                continue;
            }

            nub.setAttribute('class', nub.className + ' fbCommandsManaged');

            var id = this.getAvailableChatId();
            this.managedChats[id] = new ChatManager(id, nub);
        }
    },

    // Gets an unused id to give to a ChatManager instance
    getAvailableChatId: function() {
        var id = 0;
        while (this.managedChats.hasOwnProperty(id)) {
            id++;
        }

        return id;
    },

    // Called by ChatCommand classes to register themselves with the command pool
    registerCommand: function(commandClass) {
        if (commandClass.prototype instanceof ChatCommand) {
            this.commands[commandClass.command] = commandClass;
        }
    },

    // Called by ChatObserver instances to register themselves as an observer
    addChatObserver: function(observer) {
        if (observer instanceof ChatObserver) {
            this.observers[observers.length] = observer;
        }
    },

    // Removes an observer from the observer list
    removeChatObserver: function(observer) {
        var i = this.observers.indexOf(observer);
        if (i > -1) {
            this.observers.splice(i, 1);
        }
    },

    // Calls 'eventName' in all observers, passes in 'data'
    notifyObservers: function(eventName, data) {
        for (var i = 0; i < this.observers.length; i++) {
            if (typeof this.observers[i][eventName] == "function") {
                this.observers[i][eventName](data);
            } else {
                console.log("Observer is missing event '" + eventName + "'.");
            }
        }
    }
}