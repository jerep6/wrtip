// create loading image
var imgLoading = $('<img />').attr("src", "../img/loading.gif");
imgLoading.css({"position":"absolute", "top":"100px", "left": "0px", "width":"180px", "opacity":"0.1"});


self.port.on("newTranslationAPI", function(obj) {
  // Create a dom element with the result page from WordReference
  var parser = new DOMParser();
  var wrPage = parser.parseFromString(obj.html, "text/html");
  
  
  // Inject it into html balise of the panel
  $("html").html(wrPage.getElementsByTagName('html')[0].innerHTML);
  customizeForm(self, obj);
});


self.port.on("newTranslationMOBILE", function(obj) {
  // Create a dom element with the result page from WordReference
  var parser = new DOMParser();
  var wrPage = parser.parseFromString(obj.html, "text/html");
  var html = wrPage.getElementsByTagName('html')[0].innerHTML;
  html = html.replace("width = 450", "width = 300");
  html = html.replace(/&nbsp;/g, "&nbsp; ");
  
  // Inject it into html balise of the panel
  document.getElementsByTagName('html')[0].innerHTML = html;
  //$("html").html(wrPage.getElementsByTagName('html')[0].innerHTML);
  
  // Override some properties
  $("head").append('<link rel="stylesheet" href="http://mini.wordreference.com/2012/scripts/styleext.css" type="text/css" media="screen" />');
  $(".WRreporterror").remove();
  $("#threadsHeader").remove();
  $("#lista_link").remove();
  $("#extra_links").remove();
  $(".layout > tbody > tr:last").remove();

  $("#Otbl").css({"width": "100%", "min-height":"300px"});
  $("td.content").css("width", "100%");
  $("table.WRD").css("width", "100%");
  $("#logo a").css("font-size", "17px");
  $("#header").css({"height": "20px", "line-height": "20px"});
  $("#logo").css("line-height", "20px");
  $("td.namecell").css("height", "20px");
  
  $("td").css("padding", "0");
  
  $("form[name='sbox']").css("margin", 0);
  
  customizeForm(self, obj);

});

self.port.on("hide", function(panelWidth) {
  // Compute left according to panel size
  var left = (panelWidth - 180) / 2;
  
  // Override left 
  imgLoading.css("left", left+"px");
  
  // Append to DOM
  $("html").prepend(imgLoading);
});

/**
 * Add custom behavior to panel
 * Handle form submit
 * Provide open in new tab link
 */
function customizeForm(self, obj) {
// Get search form
  var form = $("form[name='sbox']");
  if(form != null && form != undefined) {
    // Write into input field the search word and select it with focus. Thanks to that, scrollbar returns to the top
    var inputSearch =  form.find("input[name='w']");
    inputSearch.val(obj.search).focus().select();
    
    // Due to a bug in Firefox 23, select have to be a size > 1
    // $("#dictselect").attr("size", 2).css("width", "145px");
    // var isubmit = form.find("input[type='submit']");
    // isubmit.css({
    //  "margin" : 0,
    //  "padding": "5px",
    //  "vertical-align" : "top"
    // });
    
    // Override the submit method. I don't want to reload page because it erase content script
    form.submit(function() {
      // Get search params
      var wordToTranslate = inputSearch.val();
      var language = form.find("select[name='dict']").val();
      
      self.port.emit("newSearch", {"search": wordToTranslate, "language": language});
      return false;
    });
	
	form.after("<a style='color: white' id='openInTab' href='javascript:;'>"+obj.msg.openTab+"</a>");
	$("#openInTab").click(function() {
		// Get search params
		var wordToTranslate = inputSearch.val();
		var language = form.find("select[name='dict']").val();
		
		self.port.emit("openTab", {"search": wordToTranslate, "language": language});  
		return false;
	});
  }	
}


// I can't use iframe due to same origin policy 
// self.port.on("newTranslationIframe", function(obj) {
//     // get iframe to change is location
//     var iframe = document.getElementsByTagName('iframe')[0];
//     iframe.src=obj.url;
//     iframe.onload = function () {
// 	console.log("Cool");
// 	console.log(iframe.contentDocument);
//       };
// });