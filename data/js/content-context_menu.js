/** Get selection en transmit it to add-on.
 * When a "context" listener returns a string, it becomes the item's new label. At this time 2013-03-06 content script doesn't handle
 * localisation. So I use postMessage
 */
self.on("context", function(node) {
    self.postMessage({"event" : "context", "payload" : window.getSelection().toString()});
    return true; // true to dispay context menu. False otherwise
});

self.on("click", function(node, data) {
    self.postMessage({"event" : "click", "payload" : window.getSelection().toString()});
});
