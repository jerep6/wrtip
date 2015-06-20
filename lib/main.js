var {Cc, Ci} = 	require("chrome");
var contextMenu =	require("sdk/context-menu");
var tabs =		require("sdk/tabs");
var self =		require("sdk/self");
var data =		self.data;
var _ =			require("sdk/l10n").get;
var prefs =		require("sdk/simple-prefs");
var Request =	require("sdk/request").Request;
var  Hotkey  =	require("sdk/hotkeys").Hotkey;
var {Cc, Ci} =	require("chrome");
var tabs = 		require("sdk/tabs");
var ui = require("sdk/ui");

// Globals variables
var currentSelection = null;
var internalSource = prefs.prefs["internal.source"];


// The ActionButton need to know selection
var selection = require("sdk/selection");
selection.on('select', function() {
    if (selection.isContiguous && selection.text) {
        currentSelection = selection.text;
    }
    else {
		currentSelection = null;
	}
    
});

// Panel to show translation
var panel = require("sdk/panel").Panel({
    width: prefs.prefs["panel.width"],
    height: prefs.prefs["panel.height"],
    contentURL: data.url("html/loading.html"),
    contentScriptFile: [data.url("js/jquery.min.js"), data.url("js/content-panel.js")],
    onHide: function() {
      this.port.emit("hide", prefs.prefs["panel.width"]);
    }
});



//menu context don't support port
//The context-menu package doesn't allow bi-directional communication with the content script. If you look at the documentation 
//you can only receive messages sent by the content script but not send messages to it. 
//Instead, the messages context and click are sent to the content script automatically in appropriate situations.
 var menuItem = contextMenu.Item({
	label: _("menu_prefix"),
	image: data.url("img/menuItem.png"),
	// display context menu only if selection is not null
	context: contextMenu.SelectionContext(),
	contentScriptFile: [data.url("js/content-context_menu.js")],
	onMessage: function (msg) {
		switch(msg.event) {
			case "context":
				var txt = msg.payload;
				// Truncate text before display
				if(msg.payload.length > 30) {
					txt = msg.payload.substring(0, 30) +"...";
				}
				this.label = _("menu_prefix", txt);
				break;
				
			case "click":
				//show panel before request else focus don't work
				panel.show();
				fulfillPanel(msg.payload);
				break;
		}
    
  }
});



var button = ui.ActionButton({
  id: "wrtip-button",
  label: _("addon_abbr"),
  badge: createTranslationLabel(),
  badgeColor: "#0A21E3",
  icon: {
    "16": "./img/menuItem.png"
  },
  onClick: function(state) {
    fulfillPanel(currentSelection);
    panel.show({
      position: this
    });
  }
});



var showHotKey = null;
// Activate hotkey only if user checked option
if(prefs.prefs["hotkey.active"]) {
  showHotKey = initHotKey(getHotkeyCombination());
}


/**
 * Forge wordreference url
 * word : word to translate
 * format : type of result : html or json. Default empty for html
 */
function createTranslationUrl(word, format="", sourceDest = undefined) {
    var language = sourceDest || prefs.prefs["translate.source"]+prefs.prefs["translate.destination"];
    return "http://api.wordreference.com/b583b/"+format+"/"+language+"/"+word;
}

function createTranslationUrlMobile(word, sourceDest = undefined) {
    var language = sourceDest || prefs.prefs["translate.source"]+prefs.prefs["translate.destination"];
    return "http://mini.wordreference.com/mini/index.aspx?w="+word+"&dict="+language;
}

function createTranslationUrlSite(word, sourceDest = undefined) {
    var language = sourceDest || prefs.prefs["translate.source"]+prefs.prefs["translate.destination"];
    return "http://www.wordreference.com/"+language+"/"+word;
}

function createTranslationLabel() {
    return prefs.prefs["translate.source"]+""+prefs.prefs["translate.destination"];
}


/**
 * Get html content from WordReference and fulfill panel with result.
 * Asynchrone request
 * 
 * Run request if word to translate is defined
 * 
 * @param word : word to translate
 * @param sourceDest symbolizes the source and destination languages Optional
 */ 
function fulfillPanel(word, sourceDest) {
	determineInternalSource(function() {
		var wrRequest;

		if(internalSource == "API") {
			wrRequest = Request({
				url: createTranslationUrl(word, "", sourceDest),
				onComplete: function (response) {
				//Transmit information to panel
				panel.port.emit("newTranslationAPI", {
					"search": word, 
					"html": sanitize(response.text), 
					"msg" : { 
						"openTab" :_("panel.openTab")
						}
					});
				}
			});
		}
		else {
			// Compute mobile url
			wrRequest = Request({
				url: createTranslationUrlMobile(word, sourceDest),
				onComplete: function (response) {
				//Transmit information to panel
				panel.port.emit("newTranslationMOBILE", {
					"search": word, 
					"html": sanitize(response.text), 
					"msg" : { 
						"openTab" :_("panel.openTab")
						}
					});
				}
			});
		}
		

		// Run request
		wrRequest.get();
	});
}


function initHotKey(key) {
  return Hotkey({
    combo: key,
    onPress: function() {
      panel.show();
      fulfillPanel(currentSelection);
    }
  });
}

/**
 * Returns combination for hotkey. If user doesn't provide comination use default
 */
function getHotkeyCombination() {
  return prefs.prefs["hotkey.combination"] || "alt-shift-f";
}


/**
 * Sanitize string keeping style
 */
function sanitize(html) {
    var parser = Cc["@mozilla.org/parserutils;1"].getService(Ci.nsIParserUtils);
    return parser.sanitize(html, parser.SanitizerAllowStyle | parser.SanitizerInternalEmbedsOnly);
}


// ##### Events #####
// search for panel : form submit
panel.port.on("newSearch", function (obj) {
  fulfillPanel(obj.search, obj.language);
});
// Click on open in new tab
panel.port.on("openTab", function (obj) {
	tabs.open(createTranslationUrlSite(obj.search, obj.language));
	panel.hide();
});

 
// ##### Preferences #####
prefs.on("panel.width", function() { 
    panel.width = prefs.prefs["panel.width"];
});
prefs.on("panel.height", function() { 
    panel.height = prefs.prefs["panel.height"];
});
prefs.on("translate.source", function() { 
    button.badge = createTranslationLabel();
});
prefs.on("translate.destination", function() { 
    button.badge = createTranslationLabel();
});
prefs.on("hotkey.active", function() {
  //deativate hotkey if uncheked
  if(!prefs.prefs["hotkey.active"]) {
    showHotKey.destroy();
  }
  else { // User re-checked box so re-activation
    showHotKey = initHotKey(getHotkeyCombination());
  }
});
prefs.on("hotkey.combination", function() {
  showHotKey = initHotKey(getHotkeyCombination());
});
prefs.on("internal.source", function() { 
    internalSource = prefs.prefs["internal.source"];
});


// ##### Other #####
/**
 * Query a website to determine which provider use to get translation.
 * MOBILE 	=> use html of mobile version and customise it
 * API 		=> use html of api.
 */
function determineInternalSource(callback) {
	// If user doesn't force a provider => get config over http (once)
	if(internalSource == "DEFAULT") {
		var r = Request({
				url: "http://jerep6.fr/divers/wrtip/wrtip.json",
				onComplete: function (response) {
					if(response.status == 200) {
						internalSource=response.json.internalSource;
					}
					
					//execute callback even if error. User wants translation. He don't care tha config doesn't respond
					callback();
				}
			});
		r.get();
	}
	else {
		callback();
	}
}
