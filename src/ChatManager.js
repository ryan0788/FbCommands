// Represents chat windows
class ChatManager {
    constructor(id, nub) {
        this.id = id;
        this.nub = nub;
        this.nubBody = nub.getElementsByClassName("fbNubFlyoutBody")[0];
        this.nubFooter = nub.getElementsByClassName('fbNubFlyoutFooter')[0]
        this.lastMessage = undefined; // Last message sent
        this.hasFocus = false; // Is the input field focused on?

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
                    scope.onCommand(input_text.slice(1)); // Remove the leading slash before calling the command
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
            if (bgColor == "rgb(254, 254, 254)") { // Color of incoming messages
                var message = lastMessage.childNodes[0].innerHTML;
                scope.onRecievedMessage(message);
            }
        });
        
        // Watch all of the children in the conversation root for elements being added
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
        var inputText = this.inputField.querySelectorAll('[data-text]')[0];
        if (inputText != undefined) {
            var raw = inputText.innerHTML;

            // Un-escape html chars
            return raw.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        }

        return false;
    }

    // Sends the backspace character (keyCode 8) for each character in the input field
    clearInputField() {
        var text = this.getInputText();
        if (text !== false) {
            for (var char in text) {
                this.sendTrustedKeyPress(8);
            }
        }
    }

    onSentMessage(message) {
        this.sendMessage(message);

        FbCommands.notifyObservers('onSentMessage', {
            id: this.id,
            message: message
        });
    }

    onRecievedMessage(message) {
        FbCommands.notifyObservers('onRecievedMessage', {
            id: this.id,
            message: message
        });
    }

    onCommand(message) {
        var args = message.split(' ');
        var command = args[0].toUpperCase();
        if (FbCommands.commands.hasOwnProperty(command)) {
            FbCommands.commands[command].invoke(this, args);
        } else if (command == "HELP") {
            var helpText;

            if (args.length == 1) {
                helpText = ["<b>Facebook Commands Help</b>", "Use <i>/HELP COMMAND</i> for more info.", ""];
                for (var c in FbCommands.commands) {
                    helpText.push(FbCommands.commands[c].helpText);
                }

            } else if (FbCommands.commands.hasOwnProperty(args[1].toUpperCase())) {
                helpText = FbCommands.commands[args[1].toUpperCase()].helpInfo;
            } else {
                helpText = "No command matching <i>'" + args[1].toUpperCase() + "'</i> found.";
            }

            this.sendLocalMessage(helpText);
        } else {
            this.sendLocalMessage("Unknown command <i>'" + command + "'</i>.");
        }
    }

    sendMessage(message) {
         // Make sure that we can type into the input field
        if (this.hasFocus) {

            // Multi-line messages can come in an array, convert to string
            if (typeof message == "object") {
                message = message.join('\n');
            }

            var sentMessage = message;
            if (this.getInputText() != message) {
                this.clearInputField();
                sentMessage = '';
                // Type the message into the input field.
                for (var i = 0, len = message.length; i < len; i++) {
                    var char = message[i];

                    // If we have the keycode translation of the character, send it
                    if (CHAR_TO_KEYCODE.hasOwnProperty(char)) {
                        sentMessage += char;
                        this.sendTrustedKeyPress(CHAR_TO_KEYCODE[char].keyCode, CHAR_TO_KEYCODE[char].shiftKey, char);
                    }
                }
            }

            this.lastMessage = sentMessage;
            this.sendTrustedKeyPress(13); // Shoot!
        }
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
        message = message.replace(/  /g, '&nbsp;&nbsp;');

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