self.port.on("newTranslation", function(obj) {
  // Create a dom element with the result page from WordReference
  var parser = new DOMParser();
  var wrPage = parser.parseFromString(obj.html, "text/html");
  
  // Inject it into html balise of the panel
  $("html").html(wrPage.getElementsByTagName('html')[0].innerHTML);
  
  
  // Get search form
  var form = $("form[name='sbox']");
  if(form != null && form != undefined) {
    // Write into input field the search word and select it with focus. Thanks to that, scrollbar returns to the top
    var inputSearch =  form.find("input[name='w']");
    inputSearch.val(obj.search).focus().select();
    
    
    // Overwride the submit method. I don't want to reload page because it erase content script
    form.submit(function() {
      // Get search params
      var wordToTranslate = inputSearch.val();
      var language = form.find("select[name='dict']").val();
      
      self.port.emit("newSearch", {"search": wordToTranslate, "language": language});
      return false;
    });
  }
  
});

self.port.on("hide", function(obj) {
  var anchor = $("body div").children("div:eq(2)");
  var img = $('<img />').attr("src", "../img/loading.gif");
  img.css({"float":"left"});
  
  anchor.prepend(img);
});

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