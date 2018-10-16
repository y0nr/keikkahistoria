
$('#artistinfo').perfectScrollbar({
  swipePropagation: false,
  suppressScrollX: true,
});

$(window).on("orientationchange",function(){
  $('#artistinfo').perfectScrollbar('update');
  $('#info').perfectScrollbar('update');
});

$('#info').perfectScrollbar({
  swipePropagation: false,
  suppressScrollX: true,
});

function setWiki(artist) {
  $.getJSON('wikireference.json', function(data) {
    var artistU = artist.toUpperCase();
    var artistWiki = '';
    for (var i = 0; i < data.length; ++i) {
      var element = data[i];
      if (element.name == artistU) {
        artistWiki = element.id;
        break;
      } 
    }
    document.getElementById("info").style.display = "none";
    document.getElementById("artistinfo").style.display = "block";
    document.getElementById("googlehaku").innerHTML = "<p><a href=\"http://www.google.com/search?q=" + artist + "\" target=\"_blank\">[Google]</a></p>";
    document.getElementById("artist").innerHTML = "<h1>ESIINTYJÄ</h1><p>" + artist + "</p>";
    if (artistWiki.length > 0) {
      var urlWikiArtisti = 'https://fi.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&pageids='+artistWiki+'&utf8=&callback=?';
      $.getJSON(urlWikiArtisti, function(data) {
        var p = data.query.pages;
        var arr = $.map(p, function(el) { return el });
        var extract = arr[0].extract;
        extract = extract.replace(/\n/g, "</p><p>");
        //console.log(extract);
        document.getElementById("wiki").innerHTML = "<h1>WIKIPEDIA</h1><p>" + extract + "</p><p id=\"kokoartikkeli\"><a href=\"https://fi.wikipedia.org/?curid=" + artistWiki + "\" target=\"_blank\">[Koko artikkeli]</a></p>";
        $('#artistinfo').scrollTop(0);
        $('#artistinfo').perfectScrollbar('update');
      });
    } else {
      document.getElementById("wiki").innerHTML = "";
      $('#artistinfo').perfectScrollbar('update');
    }
  });

}

function setShowCount(shows) {
  document.getElementById("showcount").innerHTML = "<h1>KEIKKOJA</h1><p>" + shows + "</p>";
}