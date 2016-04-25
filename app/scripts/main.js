"use strict";

// Setup global vars for JSONP
var callbackScript = null,
	callbackCounter = 0,
	processData;

// Wrap in
(function() {
	function domReady(fn, context) {

		function onReady(event) {
			document.removeEventListener("DOMContentLoaded", onReady);
			fn.call(context || window, event);
		}

		function onReadyIe(event) {
			if (document.readyState === "complete") {
				document.detachEvent("onreadystatechange", onReadyIe);
				fn.call(context || window, event);
			}
		}

		document.addEventListener && document.addEventListener("DOMContentLoaded", onReady) ||
			document.attachEvent && document.attachEvent("onreadystatechange", onReadyIe);
	}

	// Run init on dom ready
	domReady(init);

	function init() {

		// Global Vars
		var current_page = 1;
		// setup how many streams you want showing per page
		var streams_per_page = 5;

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

		// Event listeners
		searchBtn.addEventListener('touchend', clickOrTouch, false);
		searchBtn.addEventListener('click', clickOrTouch, false);
		searchForm.addEventListener("submit", clickOrTouch, false);

		// Event listener for search button
		function clickOrTouch(e) {
			e.preventDefault();
			var searchField = document.getElementById("searchField").value;
			errorText.innerHTML = '';
			// Make sure its not empty and not all white space
			if (searchField != null && /\S/.test(searchField)) {

				document.getElementById("searchField").blur();
				getStreams(searchField);

			} else {
				errorText.innerHTML = 'Input can not be blank or only white spaces.';
			}
		}

		// API call to Twitch
		function getStreams(url) {
			// Offset
			var offset = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1],
				// Data object
				data = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2],
				// Total Stream Count
				totalS = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3],
				// Base Twitch URL
				baseUrl = 'https://api.twitch.tv/kraken/search/streams?q=',
				// Set limit to 100 (max)
				limit = 100,
				// Build custom JSONP Url with callback function and unique ID to bypass possible cache.
				customUrl = baseUrl + url + '&limit=' + limit + '&offset=' + offset + '&callback=processData&uniqueRequestId=' + url + '_' + callbackCounter;

			if (callbackScript) {
				return;
			}
			// Create script tag to append response with data
			callbackScript = document.createElement("script");
			callbackScript.type = "text/javascript";
			callbackScript.id = "callbackScript";
			callbackScript.src = customUrl;
			callbackScript.async = true;
			document.body.appendChild(callbackScript);

			// JSONP callback function with callback data (cb_data)
			processData = function(cb_data) {

				// Remove JSONP script from DOM
				document.body.removeChild(callbackScript);
				callbackScript = null;

				// Show / Hide Elements for loading
				loadingBox.classList.add('shown');
				contentBox.classList.add('hideThis');
				pagination.classList.remove('shown');
				
				// No more streams to fetch
				if (cb_data.streams.length === 0) {
					totalS = 100;
					updatePercent(totalS);
					loadingBox.className = '';
					console.log('DONE!');

					var finalData = data.sort(function(str1, str2) {
						return str2.viewers - str1.viewers;
					});

					// Make sure there are no duplicates.
					var removeDuplicates = function(streamList) {
						for ( var i = 1; i < streamList.length; ) {
							if (streamList[i - 1]._id === streamList[i]._id) {
								streamList.splice(i, 1);
							} else {
								i++;
							}
						}
						return streamList;
					};

					finalData = removeDuplicates(finalData);
					// Return data object with all streams

					if (finalData.length > 0) {
						contentBox.classList.remove('hideThis');
						noResults.classList.remove('shown');
						addStreams(finalData);
					} else {
						noResults.classList.add('shown');
					}

					// Still more streams to fetch
				} else {
					console.log('total ', totalS);
					console.log(((totalS / cb_data._total) * 100).toFixed(2) + "%");
					var percDone = (totalS / cb_data._total).toFixed(2) * 100;
					updatePercent(percDone);
					// Add data to Object
					data = data.concat(cb_data.streams);
					callbackCounter++;
					// Get next set of streams with offest
					getStreams(url, offset + limit, data, totalS + cb_data.streams.length);
				}
			};

		}

		// Add streams to DOM
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
})();