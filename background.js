chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
    if (message.type == "key"){
    	console.log(message.keyCode);
        chrome.tabs.query({active: true}, function(tabs) {
            chrome.debugger.attach({ tabId: tabs[0].id }, "1.0");
            chrome.debugger.sendCommand({ tabId: tabs[0].id }, 'Input.dispatchKeyEvent', { type: 'keyDown', modifiers: message.shiftKey << 3, text: message.text, windowsVirtualKeyCode:message.keyCode, nativeVirtualKeyCode : message.keyCode, macCharCode: message.keyCode  });
            chrome.debugger.sendCommand({ tabId: tabs[0].id }, 'Input.dispatchKeyEvent', { type: 'keyUp', modifiers: message.shiftKey << 3, text: message.text, windowsVirtualKeyCode:message.keyCode, nativeVirtualKeyCode : message.keyCode, macCharCode: message.keyCode  });
            chrome.debugger.detach({ tabId: tabs[0].id });
        });
    }
});