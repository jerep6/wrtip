self.port.on("newTranslation", function(obj) {
  // Create a dom element with the result page from WordReference
  var parser = new DOMParser();
  var wrPage = parser.parseFromString(obj.html, "text/html");
  
  // Inject it into html balise of the panel
  document.getElementsByTagName('html')[0].innerHTML=wrPage.getElementsByTagName('html')[0].innerHTML;
  
  
  // Get search form
  var form = document.getElementsByName("sbox")[0];
  console.log("Form="+form);
  
  if(form != null && form != undefined) {
    // Write into input field the search word and select it with focus. Thanks to that, scrollbar returns to the top
    var inputSearch =  form.elements["si"];
    inputSearch.value=obj.search;
    inputSearch.focus();
    inputSearch.select();
    
    // Overwride the submit method. I don't want to reload page because it erase content script
    //form.action ="javascript:;";
    form.onsubmit = function() {
      console.log("Submit");
      // Get search params
      var wordToTranslate = inputSearch.value;
      var language = form.elements["dictselect"];
      console.log(language);
      self.port.emit("newSearch", {"search": wordToTranslate, "language": language});
      return false;
    };
  }
  
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