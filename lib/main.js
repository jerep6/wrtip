var contextMenu =   require("sdk/context-menu");
var widget =        require("sdk/widget");
var tabs =          require("sdk/tabs");
var self =          require("sdk/self");
var data =          self.data;
var _ =             require("sdk/l10n").get;
var prefs =         require("sdk/simple-prefs");

 
// Global variables
var currentSelection = null;

var panel = require("sdk/panel").Panel({
  width: prefs.prefs["panel.width"],
  height: prefs.prefs["panel.height"],
  contentURL: data.url("html/loading.html"),
  onHide: function() {
    this.contentURL=data.url("html/loading.html");
  }
});

//menu context don't support port
//The context-menu package doesn't allow bi-directional communication with the content script. If you look at the documentation 
//you can only receive messages sent by the content script but not send messages to it. 
//Instead, the messages context and click are sent to the content script automatically in appropriate situations.
 var menuItem = contextMenu.Item({
  label: _("menu_prefix"),
  context: contextMenu.SelectionContext(),
  contentScriptFile: [data.url("a.js")],
  onMessage: function (msg) {

    switch(msg.event) {
        case "context":
            this.label = _("menu_prefix") +" "+ msg.payload;
            break;
            
        case "click":
            panel.contentURL=createTranslationUrl(msg.payload);
            panel.show();
            break;
    }
    
  }
});

var widgetTxt = widget.Widget({
    id: "wrtip-widget",
    label: _("addon_title"),
    width:  35,
    content:createTranslationLabel(),
    panel: panel,
    onClick: function() {
        panel.contentURL=createTranslationUrl(currentSelection);
    }
});

// The widget need to know selection
var selection = require("sdk/selection");
selection.on('select', function() {
    if (selection.isContiguous && selection.text) {
        currentSelection = selection.text;
    }
});

/**
 * Forge wordreference url
 * word : word to translate
 * format : type of result : html or json. Default empty for html
 */
function createTranslationUrl(word, format="") {
    var source = prefs.prefs["translate.source"];
    var dest = prefs.prefs["translate.destination"];
    
    return "http://api.wordreference.com/b583b/"+format+"/"+source+dest+"/"+word;
}

function createTranslationLabel() {
    return prefs.prefs["translate.source"]+"-"+prefs.prefs["translate.destination"];
}

 
//Preferences
prefs.on("panel.width", function() { 
    panel.width = prefs.prefs["panel.width"];
});
prefs.on("panel.height", function() { 
    panel.height = prefs.prefs["panel.height"];
});
prefs.on("translate.source", function() { 
    widgetTxt.content = createTranslationLabel();
});
prefs.on("translate.destination", function() { 
    widgetTxt.content = createTranslationLabel();
});
