let parse = () => {


	// Selectors are tried in order.
	// The earlier a selector is in the
	// array the higher the preference.
	let selectors = [
		'#owner-name a', // youtube
		'[rel="author"]',
		'a[class*="byline"]:first',
		'[class*="byline"]:first',
		'[id*="author"] .name a',
		'[id*="author"] .name',
		'[id*="author"]',
		'[class*="author"] .name a',
		'[class*="author"] .name',
		'[class*="author"]',
		'[ng-bind-html*="author"]', // angularjs
		'[ng-if*="author"]' // angularjs
	];

	let author = '';

	let selection;
	selectors.forEach(selector => {
		let $selector = $(selector+':visible');
		if(!selection && $selector.length > 0)
			selection = $selector;
	});

	if(selection.children().length <= 1){
		selection.each(function() {
			let text = $(this).text();

			// slip over by
			if(!/^\s*by\s*$/i.test(text))
				author += text+'_';
		});
	}

	else{
		selection.find('*:not(time, :has(*)):visible').each(function() {
			let text = $(this).text();
			// slip over by
			if(!/^\s*(by)\s*$/i.test(text))
				author += text+'_';
		});
	}

	let byline = author;

	// sqush to single line
	author = author.replace(/(^\s+|\n|\s+$)/g,' ');

	//cleanup
	author = author.replace(/(^_|^\s*by(:|)\s+|^\s*|_+$|phd)/ig, '');
	// fix format "author | date"
	if(author.indexOf('|') !== 0) author = author.split('|')[0];

	let authors = author.split(/\s*and\s*|,\s*|\s*_\s*/);

	authors = authors.filter((item, i) => {
    	return authors.indexOf(item) == i;
	})
	// items containing these words
	// are usually bios about authors
	.filter((item, i) => {
    	return !/((^|\s+)(for|a|on|at|am|pm|twitter|updated)(\s+|$)|@|[0-9])/gi.test(item);
	})
	// remove empty names
	.filter(n => n !== '');


	// move last name to front
	authors = authors.map(name => {
		let split = name.split(/\s+/).filter(n => n !== '');

		// if not organization
		if(!/(^|\s+)(the)(\s+|$)/gi.test(name))
			split.unshift(split.pop());
			
		return split;
	})

	



	let source = $('[id*=logo] img, [class*=logo] img').first().attr('alt');
	if(!source && $('.logo, #logo').length > 0){
		source = $('.logo, #logo').text();
	}

	if(!source){
		source = location.host.replace(/\.[^\.]+$/,'').split('.').pop();
	}






	let titleSelectors = [
		'h1[id*="title"]',
		'h1[class*="title"]',
		'h1'
	]

	let title = '';
	titleSelectors.forEach(selector => {
		if(title == '') title = $(selector).first().text();
	});





	// Extract Date
	let date = $('time, [class*=date]').first().text() + byline + $('body').text();
	date = date.match(/([A-Z][A-Za-z]+|[0-9]{1,2})(-|\/|\.\s*|\s+)[0-9]{1,2}(,|)(-|\/|\.|\s+)[0-9]{2,4}/)[0];

	date = Date.parse(date).toString('d MMM. yyyy');







	return {
		authors: authors,
		date: date,
		title: title,
		source: source,
		access: date = Date.today().toString('d MMM. yyyy'),
		url: location.href
	};

}

chrome.runtime.onMessage.addListener(
	function(req, sender, sendResponse) {
		// sender.tab
		if (req.command == "parse")
			sendResponse(parse());
	});