var managedChats = [];
var commands = {};

window.addEventListener("load", function() {
    var nubGroup = document.getElementsByClassName("fbNubGroup")[1];
    addManagerToChatNubs(nubGroup);

    var observer = new MutationObserver(function(mutations) {
        setTimeout(function() { // Wait for it to be built
            addManagerToChatNubs(nubGroup);
        }, 250);
    });
     
    observer.observe(nubGroup, { childList: true });
});

// Checks children of the passed nubgroup to see if there are any new chat nubs.
// Invoked on startup and when a chat nub is added or removed.
var addManagerToChatNubs = function(nubGroup) {
    var chatNubs = nubGroup.getElementsByClassName("fbNub");
    for (var i = 0; i < chatNubs.length; i++) {
        var nub = chatNubs[i];
        if (document.defaultView.getComputedStyle(nub, null).getPropertyValue('display') == 'none' ||
            ~nub.className.indexOf('fbCommandsManaged')){
            continue;
        }

        nub.setAttribute('class', nub.className + ' fbCommandsManaged');
        managedChats.push(new ChatManager(nub));
    }
}

var registerCommand = function(commandClass) {
    if (commandClass.prototype instanceof ChatCommand) {
        commands[commandClass.command] = commandClass;
    }
}

class ChatManager {
    constructor(nub) {
        this.nub = nub;
        this.nubBody = nub.getElementsByClassName("fbNubFlyoutBody")[0];
        this.nubFooter = nub.getElementsByClassName('fbNubFlyoutFooter')[0]
        this.lastMessage = undefined;
        this.hasFocus = false;

        this.inputField = this.nubFooter.querySelectorAll('[data-reactroot]')[0];
        this.conversationContainerTable = this.nubBody.getElementsByClassName('conversationContainer')[0];

        var row = this.localMessageRow = this.conversationContainerTable.insertRow(-1);
        row.style.width = "100%";
        row.style.border = "1px solid #bcc7d6";
        row.style.background = "#CCCCCC";

        var span = this.localMessageArea = document.createElement('span');
        var cell = row.insertCell(-1);
        cell.style.padding = "5px";
        
        cell.appendChild(span);

        var scope = this;
        this.inputField.onkeydown = function(evt) {
            var input_text = scope.getInputText();
            
            if (evt.keyCode == 13 && evt.code == "Enter" && // evt.code is only set to 'Enter' on actual key presses
                !(evt.ctrlKey || evt.shiftKey || evt.altKey || evt.metaKey)) {

                evt.stopPropagation(); // We want to choose what/when to send

                if (input_text[0] == '/') { // A command was called
                    scope.clearInputField();
                    scope.onCommand(input_text.slice(1));
                } else {
                    scope.onSentMessage(input_text);
                }

                return false;
            }
        };

        this.inputField.addEventListener("focus", function() {
            scope.hasFocus = true;
        }, true);

        this.inputField.addEventListener("blur", function() {
            scope.hasFocus = false;
        }, true);

        // Add listener for new messages
        this.conversationRoot = this.conversationContainerTable.getElementsByClassName('conversation')[0].querySelectorAll('[data-reactroot]')[0];
        var observer = new MutationObserver(function(mutations) {
            var messages = scope.conversationRoot.getElementsByClassName('_5yl5'); // Message class name
            var lastMessage = messages[messages.length - 1];

            // Okay this is very much a hack, but it works okay?
            var bgColor = document.defaultView.getComputedStyle(lastMessage.parentNode.parentNode.parentNode, null).getPropertyValue("background-color");
            if (bgColor == "rgb(254, 254, 254)") {
                var message = lastMessage.childNodes[0].innerHTML;
                scope.onRecievedMessage(message);
            }
        });
         
        observer.observe(this.conversationRoot, { childList: true, subtree: true });

        // Show the loaded message, hide it after 3 seconds.
        this.sendLocalMessage("Facebook Commands active.", 3000);
    }

    scrollToBottom() {
        this.nubBody.scrollTop = this.nubBody.scrollHeight;
    }

    // Hides system messages (help text, loaded message, etc)
    // by scrolling the chat window up until it is not visible.
    hideLocalMessage() {
        var scope = this;
        var localMessageHeight = this.localMessageRow.getBoundingClientRect().height;
        var nubBodyHeight = this.nubBody.getBoundingClientRect().height;
        var conversationContainerHeight = this.conversationContainerTable.getBoundingClientRect().height;

        var interval = setInterval(function() {
            if (conversationContainerHeight - (scope.nubBody.scrollTop + nubBodyHeight) > localMessageHeight - 10) {
                // Done scrolling.
                clearInterval(interval);
                scope.localMessageArea.innerHTML = '';
            } else {
                scope.nubBody.scrollTop--;
            }
        }, 3);
    }

    sendTrustedKeyPress(keyCode, shiftKey, text) {
        // Sends the key press data to background.js which sends trusted key events back to the window
        chrome.runtime.sendMessage({ type: "key", keyCode: keyCode, shiftKey: shiftKey, text: text });
    }

    // Returns the current contents of the input field.
    getInputText() {
        var raw = this.inputField.querySelectorAll('[data-text]')[0].innerHTML;

        // Un-escape html chars
        return raw.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }

    // Sends the backspace character (keyCode 8) for each character in the input field
    clearInputField() {
        for (var char in this.getInputText()) {
            this.sendTrustedKeyPress(8);
        }
    }

    onSentMessage(message) {
        this.sendMessage(message);
    }

    onRecievedMessage(message) {
    }

    onCommand(message) {
        var args = message.split(' ');
        var command = args[0].toUpperCase();
        if (commands.hasOwnProperty(command)) {
            commands[command].invoke(this, args);
        } else if (command == "HELP") {
            var helpText;

            if (args.length == 1) {
                helpText = ["<b>Facebook Commands Help</b>", "Use <i>/HELP COMMAND</i> for more info.", ""];
                for (var c in commands) {
                    helpText.push(commands[c].helpText);
                }

            } else if (commands.hasOwnProperty(args[1].toUpperCase())) {
                helpText = commands[args[1].toUpperCase()].helpInfo;
            } else {
                helpText = "No command matching <i>'" + args[1].toUpperCase() + "'</i> found.";
            }

            this.sendLocalMessage(helpText);
        } else {
            this.sendLocalMessage("Unknown command <i>'" + command + "'</i>.");
        }
    }

    sendMessage(message) {
        var sentMessage = message;
        if (this.getInputText() != message) {
            this.clearInputField();
            sentMessage = '';
            // Type the message into the input field.
            for (var i = 0, len = message.length; i < len; i++) {
                var char = message[i];
                if (CHAR_TO_KEYCODE.hasOwnProperty(char)) {
                    sentMessage += char;
                    this.sendTrustedKeyPress(CHAR_TO_KEYCODE[char].keyCode, CHAR_TO_KEYCODE[char].shiftKey, char);
                }
            }
        }

        this.lastMessage = sentMessage;
        this.sendTrustedKeyPress(13); // Shoot!
    }

    sendLocalMessage(message, hideDelay=0) {
        // If the local message had a timeout set to hide it, clear the timeout.
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = undefined;
        }

        // Multi-line messages come in an array, join them with </br>
        if (typeof message == "object") {
            message = message.join("</br>");
        }

        this.localMessageArea.innerHTML = message;
        this.scrollToBottom();

        // If a delay to hide the message was passed, set up a timeout.
        if (hideDelay > 0) {
            var scope = this;
            this.hideTimeout = setTimeout(function() {
                scope.hideLocalMessage();
                scope.hideTimeout = undefined;
            }, hideDelay);
        }
    }
}