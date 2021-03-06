var map = L.map( 'map', {
	center: [65.36, 27.05],
	minZoom: 4,
	maxBounds: [[40, -15],[78, 70]],
	zoomControl: false
});        

map.fitBounds([
	[59.5, 19.3],
	[70.2, 30.4]
]);

L.tileLayer('https://api.mapbox.com/v4/mapbox.pencil/{z}/{x}/{y}@2x.png?access_token=pk.eyJ1IjoieTBuciIsImEiOiJjaW82OW5xMDAwMDYzdW1rbjBxOHhrejZ1In0.JpMzlkmzy4h3tMxfRsd7aw', {
	maxZoom: 18,
	minZoom: 4,
	attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' + ', © <a href="https://www.mapbox.com/map-feedback/">Mapbox</a>' + ' | <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
}).addTo(map);

map.addControl(L.control.zoom({position: 'topright'}));	

$.ajaxSetup({
  timeout: 7000
});

var markerShowIDs = new Map();

var activeMarkers = L.markerClusterGroup({
	animateAddingMarkers: true,
	showCoverageOnHover: false,
	removeOutsideVisibleBounds: false,
	maxClusterRadius: 20,
	iconCreateFunction: function(cluster) {
		return L.divIcon({className: 'markercluster', iconSize: L.point(30, 30), html: cluster.getChildCount()});
	}
});

var searchInProgress = false;
document.getElementById("loader").style.display = "none";
document.getElementById("artistinfo").style.display = "none";

var options = {
	url: function(phrase) {
		var year = $("#changeyear select").val();
		console.log("http://api.teosto.fi/"+year+"/performer?name=" + phrase)
		return "http://api.teosto.fi/"+year+"/performer?name=" + phrase;
	},
	requestDelay: 500,
	listLocation: "performers",
	getValue: "name",
	ajaxSettings: {
		dataType: "json"
	},
	list: {
		maxNumberOfElements: 80,
		match: {
			enabled: true
		},
		onChooseEvent: function() {
			var artistInput = $("#provider-json").getSelectedItemData().name;
			var idInput = $("#provider-json").getSelectedItemData().id;
			searchedParse = artistInput;
			selectArtist(artistInput, idInput);
		}
	},
	highlightPhrase: false,
	adjustWidth: false,
};

$("#provider-json").easyAutocomplete(options);

$(".easy-autocomplete-container ul").perfectScrollbar({
	swipePropagation: false,
	suppressScrollX: true,
});
 
$('#provider-json').each(function() {
	var elem = $(this);
	elem.bind("propertychange change click keyup input paste", function(e){
		console.log("kirjoitusta");
		$(".easy-autocomplete-container ul").perfectScrollbar('update');
		setTimeout(function(){
			$(".easy-autocomplete-container ul").perfectScrollbar('update');
		}, 80);
		setTimeout(function(){
			$(".easy-autocomplete-container ul").perfectScrollbar('update');
		}, 200);
		setTimeout(function(){
			$(".easy-autocomplete-container ul").perfectScrollbar('update');
		}, 500);
		setTimeout(function(){
			$(".easy-autocomplete-container ul").perfectScrollbar('update');
		}, 1000);
	});
});

var showTotal = 0;
var showCounts = 0;
var artist = '';
var artistId = '';

function selectArtist(artistInput, idInput) {
	if (!searchInProgress) {
		searchInProgress = true;
		document.getElementById("loader").style.display = "block";
		document.querySelector('.hakualue').style.backgroundImage = "none";
		console.log(searchInProgress);
		removeMarkers();
		setShowCount(0);
		artist = artistInput;
		artistId = idInput;
		setWiki(artist);
		map.addLayer(activeMarkers);
		document.getElementById("provider-json").disabled = true;
		document.getElementById("provider-json").value = "HAETAAN TIETOJA...";
		createMarkers(idInput);
	}
}

function removeMarkers() {
	map.removeLayer(activeMarkers);
	activeMarkers.clearLayers();
}

function createMarkers(id) {
	var markerCount = 0;
	var year = $("#changeyear select").val()
	$.getJSON('http://api.teosto.fi/'+year+'/performer?id='+id+"&method=shows", function(data2) {
		showCount(data2.shows.length);
		for (var j=0; j < data2.shows.length; ++j) {
			var show = data2.shows[j].url;
			(function(n) {
				setTimeout(function(){
					$.getJSON(n, function(data3) {
						var venue = data3.show.event.venue.url;
						var showSetList = data3.show.id;
						var showDate = formatDate(data3.show.event.startDate);
						(function(n) {
							setTimeout(function(){
								$.getJSON(venue, function(data4) {
									var text = "<div class=\"ylaosa1\">" + data4.venue.name + "</div>" + "<div class=\"ylaosa2\">" + data4.venue.place.municipality.name + ", " + showDate + "</div>";
									var tooltipText = "<b>" + data4.venue.place.municipality.name + "</b>, " + data4.venue.name;
									var lat = data4.venue.place.geoCoordinates.latitude;
									var lon = data4.venue.place.geoCoordinates.longitude;
									if (!isNaN(lat) && !isNaN(lon)) {
										var marker = L.marker([lat, lon], {riseOnHover: true, icon: L.divIcon({className: 'marker', iconSize: L.point(30, 30), popupAnchor: [0, -18]})}).bindPopup(text);
										marker.on('mouseover', function() {
											$(marker._icon).addClass('markerhover');
										});
										marker.on('mouseout', function() {
											$(marker._icon).removeClass('marker');
											$(marker._icon).addClass('markerfinal');
											$(marker._icon).removeClass('markerhover');
										});  
										marker.bindTooltip(tooltipText, { direction: 'top', offset: [0, -8], opacity: 1 }).openTooltip();
										activeMarkers.addLayer(marker);
										markerShowIDs.set(marker, showSetList);
									}
									addToMarkerCount();
								}).fail(function(jqXHR, textStatus, errorThrown) { console.log('++markerCount, getJSON venuetms failed: ' + textStatus); addToMarkerCount(); });
							}, 60*j);
						}(venue));
					}).fail(function(jqXHR, textStatus, errorThrown) { console.log('++markerCount, getJSON showtms failed: ' + textStatus); addToMarkerCount(); });
				}, 125*j);
			}(show));                  
		}
		function addToMarkerCount() {
			++markerCount;
			if (markerCount === data2.shows.length) {
				finishId();
			}
		}
	}).fail(function () {
		searchInProgress = false;
		document.getElementById("provider-json").disabled = false;
		document.getElementById("provider-json").value = artist;
		document.getElementById("loader").style.display = "none";
	});
}

function formatDate(original) {
	var temp = original.split("-");
	var formatted = temp[2] + "." + temp[1] + "." + temp[0];
	return formatted;
}

function showCount(shows) {
	++showCounts;
	showTotal = showTotal + shows;
	setShowCount(showTotal);
	showCounts = 0;
	showTotal = 0;
}

function finishId() {
	searchInProgress = false;
	document.getElementById("provider-json").disabled = false;
	document.getElementById("provider-json").value = artist;
	document.getElementById("loader").style.display = "none";
	document.getElementById("resetsearch").style.display = "block";
	console.log(searchInProgress);
}

var tooltip;
var initializedPopups = [];
map.on('popupopen', function(e) {
	var marker = e.popup._source;
	if ($.inArray(e.popup, initializedPopups) === -1) { //only get json the first time a popup is opened
		var year = $("#changeyear select").val()
        console.log("http://api.teosto.fi/"+year+"/show?id="+markerShowIDs.get(marker)+"&method=works");
		$.getJSON("http://api.teosto.fi/"+year+"/show?id="+markerShowIDs.get(marker)+"&method=works", function(data) {
            console.log(JSON.stringify(data));
			var content = e.popup.getContent();
			content = content + "<img src='/Images/kaiutinmini.png' class='kuva' /> <div id=\"alaosa\"><div class=\"settilista\">";
			for (var i=0; i < data.works.length; ++i) {
				content = content + data.works[i].title + "<br>";
			}
			content = content + "</div></div>";
			e.popup.setContent(content);
			$('#alaosa').perfectScrollbar({
				swipePropagation: false,
				suppressScrollX: true,
			});
		});
		initializedPopups[initializedPopups.length]=e.popup;
	} else {
		$('#alaosa').perfectScrollbar({
			swipePropagation: false,
			suppressScrollX: true,
		});
	}
	setTimeout(function(){
		console.log("popupopenTimeout");
		$('#alaosa').perfectScrollbar({
			swipePropagation: false,
			suppressScrollX: true,
		});
	}, 280);
	tooltip = marker.getTooltip();
	marker.unbindTooltip();
	$(".leaflet-control-zoom").css("visibility", "hidden");
});

map.on('popupclose', function(e) {
	var marker = e.popup._source;
	marker.bindTooltip(tooltip);
	$(".leaflet-control-zoom").css("visibility", "visible");
});

$('.openinfo, .closeinfo').on('click', function() {
	$('.openinfo, .closeinfo, .mobilebackground, .side-panel-top, .side-panel-bottom').toggleClass('mobile-map mobile-infowiki');
	$('#artistinfo').perfectScrollbar('update');
	$('#info').perfectScrollbar('update');
});

$(document).on("click", "#resetsearchbtn", function(){
	artist = '';
	removeMarkers();
	document.getElementById("provider-json").value = "";
	document.getElementById("resetsearch").style.display = "none";
	document.getElementById("artistinfo").style.display = "none";
	document.getElementById("info").style.display = "block";
	document.querySelector('.hakualue').style.backgroundImage = "url(/Images/searchicon.png)";
	$('#info').scrollTop(0);
	$('#info').perfectScrollbar('update');
});        

new ResizeSensor(jQuery('#artistinfo'), function() {
    console.log('artistinfo has been resized');
    $('#artistinfo').perfectScrollbar('update');
});
new ResizeSensor(jQuery('#info'), function() {
    console.log('info has been resized');
    $('#info').perfectScrollbar('update');
});

$(function() {
  $('select').selectric({
    disableOnMobile: false,
    nativeOnMobile: false
  }).on('change', function() {
    var phrase = $("#provider-json").val()
    if (phrase !== '') {
      $("#provider-json").loadData(phrase);
      setTimeout( function () {$("#provider-json").focus();}, 200);
    }
  });
  $('select').on('selectric-change selectric-select', function(event, element, selectric) {
    var phrase = $("#provider-json").val()
    if (phrase !== '') {
      $("#provider-json").loadData(phrase);
      setTimeout( function () {$("#provider-json").focus();}, 200);
    }
 });
});
