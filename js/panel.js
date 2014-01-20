(function () {
	"use strict";
	var logContainer = $('#log');
	var data = {};

	/**
	 * record api
	 */
	function isApiRequest(har) {	
		var mimeList = [
			/^text\/json/i,
			/^application\/json/i,
			/^text\/xml/i,
			/^application\/xml/i
		];
		var valid = false;
		for (var i = 0, len = mimeList.length; i < len; i++) {
			if (mimeList[i].test(har.response.content.mimeType)) {
				valid = true;
				break;
			}
		}
		return valid;

	}

	chrome.devtools.network.onRequestFinished.addListener(function(har) {
		har.response.content = har.response.content || {};
		if (!isApiRequest(har)) {
			return;
		}
		var  html = '';
		html += '<li><h3><span class="method">';
		html += har.request.method;
		html += '</span><span class="url">';
		html += har.request.url;
		html += '</span></h3><pre></pre></li>';
		var item = $(html);
		logContainer.append(item);
		har.getContent(function(content){
			har.response.content.text = content;
			try {
				item.find('pre').html(har2apiblueprint(har));
			} catch(ex) {
				item.find('pre').html('发生错误：' + ex);
			}
		});
	});

	logContainer.delegate('h3', 'click', function(e){
		$(this).parent('li').toggleClass('open');
	});

	$('#toolbar .clear').click(function(e){
		e.preventDefault();
		logContainer.html('');
	});
})();