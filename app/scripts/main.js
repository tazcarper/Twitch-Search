"use strict";

// DOM Ready helper
(function(exports, d) {
	function domReady(fn, context) {

		function onReady(event) {
			d.removeEventListener("DOMContentLoaded", onReady);
			fn.call(context || exports, event);
		}

		function onReadyIe(event) {
			if (d.readyState === "complete") {
				d.detachEvent("onreadystatechange", onReadyIe);
				fn.call(context || exports, event);
			}
		}

		d.addEventListener && d.addEventListener("DOMContentLoaded", onReady) ||
			d.attachEvent && d.attachEvent("onreadystatechange", onReadyIe);
	}

	exports.domReady = domReady;
})(window, document);

// Run init on dom ready
domReady(init);

function init() {

	// Vars
	var current_page = 1,
		streams_per_page = 5;

	// elements
	var searchBtn = document.getElementById('searchTwitch'),
		searchForm = document.querySelector("#searchForm"),
		backColor = document.getElementById('backColor'),
		loadingBox = document.getElementById("loading"),
		pagination = document.getElementById('pagination'),
		contentBox = document.getElementById("content"),
		totalCount = document.getElementById('total'),
		errorText = document.getElementById("error"),
		noResults = document.getElementById("nothingFound");

	// API call to Twitch
	var getStreams = function getStreams(url) {
		// Offset
		var offset = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

		// Data object
		var data = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
		var totalS = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];
		var baseUrl = 'https://api.twitch.tv/kraken/search/streams?q=',
			limit = 100,

			customUrl = baseUrl + url + '&limit=' + limit + '&offset=' + offset;

		return new Promise(function(resolve, reject) {
			var xhrReq = new XMLHttpRequest();
			xhrReq.open('get', customUrl, true);
			xhrReq.responseType = 'json';
			xhrReq.onload = function() {
				var status = xhrReq.status;
				if (status === 200) {
					console.log('Collecting data...');
					loadingBox.classList.add('shown');
					contentBox.classList.add('hideThis');
					pagination.classList.remove('shown');
					if (xhrReq.response.streams.length === 0) {
						totalS = 100;
						updatePercent(totalS);

						// Return data object with all streams
						resolve(data);

					} else {
						console.log('total ', totalS);
						console.log((totalS / xhrReq.response._total).toFixed(2));
						var percDone = (totalS / xhrReq.response._total).toFixed(2) * 100;
						updatePercent(percDone);
						// Add data to Object
						data = data.concat(xhrReq.response.streams);
						// Get next set of streams with offest
						resolve(getStreams(url, offset + limit, data, totalS + xhrReq.response.streams.length));
					}

				} else {
					// Something went wrong. /cry
					reject(status);
				}
			};
			xhrReq.send();
		});
	};

	// Event listeners
	searchBtn.addEventListener('touchend', clickOrTouch, false);
	searchBtn.addEventListener('click', clickOrTouch, false);
	searchForm.addEventListener("submit", clickOrTouch, false);

	function clickOrTouch(e) {
		e.preventDefault();
		var searchField = document.getElementById("searchField").value;
		errorText.innerHTML = '';
		// Make sure its not empty and not all white space
		if (searchField != null && /\S/.test(searchField)) {

			document.getElementById("searchField").blur();

			getStreams(searchField, 0, []).then(function(data) {
				loadingBox.className = '';

				// Sort by most viewers
				var finalData = data.sort(function(str1, str2) {
					return str2.viewers - str1.viewers;
				});

				if (finalData.length > 0) {
					contentBox.classList.remove('hideThis');
					noResults.classList.remove('shown');
					addStreams(finalData);
				} else {
					noResults.classList.add('shown');
				}

			}, function(status) {
				console('Something went wrong. Status code:' + status);
			});
		} else {
			errorText.innerHTML = 'Input can not be blank or only white spaces.';

		}
	}

	function addStreams(streamData) {

		pagination.classList.add('shown');

		var total = 'Total: ' + streamData.length;
		totalCount.innerHTML = total;

		function changePage(page, data) {

			var itemsLeft = 0,
				buildList = '',
				btn_next = document.getElementById("btn_next"),
				btn_prev = document.getElementById("btn_prev"),
				listing_table = document.getElementById("streamList"),
				page_span = document.getElementById("pageNumber");

			btn_next.onclick = function(e) {
				e.preventDefault();
				if (current_page < numPages(data)) {
					current_page++;
					changePage(current_page, data);

				}
			};
			btn_prev.onclick = function(e) {
				e.preventDefault();
				if (current_page > 1) {
					current_page--;
					changePage(current_page, data);
				}
			};

			// Validate page
			if (page < 1) {
				page = 1;
			}
			if (page > numPages(data)) {
				page = numPages(data);
			}

			listing_table.innerHTML = "";

			if ((page * streams_per_page) < data.length) {
				itemsLeft = (page * streams_per_page);

			} else {

				itemsLeft = data.length;

			}

			for (var i = (page - 1) * streams_per_page; i < itemsLeft; i++) {
				var strChannel = data[i].channel,
					// Stream Name
					strDisplayName = strChannel.display_name,
					//Stream Link
					strLink = strChannel.url,
					// Stream Game
					strGame = strChannel.game,
					// Stream Description. Not really a "description" key in the API.
					strDesc = strChannel.status,
					// Stream View Count
					strViewers = data[i].viewers,
					// Stream Preview Image (large,medium,small avail)
					strImage = data[i].preview.large,

					// Build list

					stream_name = '<a href="' + strLink + '" target="_blank"><h3 class="streamName">' + strDisplayName + '</h3></a>',
					stream_image = '<a href="' + strLink + '" target="_blank"><img src="' + strImage + '" alt="" /></a>',
					stream_viewCount = '<span class="viewCount">' + strViewers + ' Viewers</span>',
					stream_gameNameAndCount = '<h5 class="gameName">' + strGame + ' - ' + stream_viewCount + '</h5>',
					stream_description = '<p class="description">' + strDesc + '</p>';

				buildList += '<li class="stream"><div class="row"><div class="col-sm-4 col-lg-5">' +
					stream_image + '</div>' +
					'<div class="col-sm-8 col-lg-7">' + stream_name + stream_gameNameAndCount + stream_description + '</div></div></li>';
			}

			listing_table.innerHTML = buildList;
			// display pages
			page_span.innerHTML = page + ' / ' + numPages(data);

			if (page === 1) {
				btn_prev.style.visibility = "hidden";
			} else {
				btn_prev.style.visibility = "visible";
			}

			if (page === numPages(data)) {
				btn_next.style.visibility = "hidden";
			} else {
				btn_next.style.visibility = "visible";
			}
		}
		// start on first page
		changePage(1, streamData);

	}

	function numPages(theData) {
		return Math.ceil(theData.length / streams_per_page);
	}

	function updatePercent(percent) {
		backColor.style.width = percent + '%';
	}
}