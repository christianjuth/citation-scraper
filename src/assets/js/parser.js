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
		'[ng-if*="author"]', // angularjs
		'[class*="Contributor"], [class*="contributor"]',
		'[href*="author"]',
		'[href*="editor"]',
	];

	let bans = [
		'[class*=title]' // job title
	]

	let selection;
	selectors.forEach(selector => {
		let $selector = $(selector+':visible').not(bans.join(','));
		if(!selection && $selector.length > 0)
			selection = $selector;
	});

	// if selection fails look for
	// anything starting with by
	if(!selection){
		selection = $('*').filter(function() {
			return /^by\s+.+$/i.test($(this).text());
		});
	}

	let extractAuthor = (sel) => {
		let out = '',
			distances = [];
		sel
		.each(function() {
			distances.push($(this)[0].getBoundingClientRect().top + $(window)['scrollTop']());
		})
		.filter(function () {
			return $(this)[0].getBoundingClientRect().top + $(window)['scrollTop']() < Math.min(...distances) + 500;
		})
		.each(function() {
			let text = $(this).text();
			// slip over by
			out += text+'_';
		});
		// sqush to single line
		out = out.replace(/(^\s+|\n|\s+$)/g,' ');
		//cleanup
		out = out.replace(/(^_|^\s*by(:|)(\s+|_)|^\s*|_+$|phd)/ig, '');
		return out;
	}
	
	let byline;

	// try and extract visible children
	byline = extractAuthor(selection.find('*:not(time, :has(*)):visible'));
	// else fall back on entire selection
	if(byline.replace(/_+/g, '') === '') byline = extractAuthor(selection);





	let authors = byline.split(/\s+and\s+|,\s*|\s*_\s*/);
	authors = authors.filter((item, i) => {
    	return authors.indexOf(item) == i;
	})
	// items containing these words
	// are usually bios about authors
	.filter((item, i) => {
    	return !/((^|\s+)(for|a|on|at|am|pm|of|twitter|updated|comments|published|\|)(\s+|$)|@|[0-9])/gi.test(item);
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

	
	let source = '';
	let sourceSelectors = [
		'[id*=logo] img',
		'[class*=logo] img',
		'[class*=brand]',
		'[class*=logo] a[title]',
		'[class*=logo]'
	];

	sourceSelectors.forEach((sel) => {
		if(!source) source = $(sel).attr('alt') || $(sel).attr('title');
	});

	if(!source && $('.logo, #logo').length > 0){
		source = $('.logo, #logo').text();
	}

	if(!source){
		source = location.host.replace(/\.[^\.]+$/,'').split('.').pop();
	}

	source = source.replace(/\.(com)$/, '');






	let titleSelectors = [
		'h1[id*="title"]',
		'h1[class*="title"]',
		'h1'
	]

	let title = '';
	titleSelectors.forEach(selector => {
		if(title == '') title = $(selector).first().text();
	});
	title = title.replace(/(^\s+|\s+$)/g,'');





	// Extract Date
	let date = $(selectors.join(',')).text() + $('time, [class*="date"]').text() + $('body').text();
	date = date.match(/(([A-Z]([A-Z]+|[a-z]+)|[0-9]{1,2})(-|\/|\.\s*|\s+)([0-9]{1,2})|([0-9]{1,2})(-|\/|\.\s*|\s+)([A-Z]([A-Z]+|[a-z]+)|[0-9]{1,2}))(,|)(-|\/|\.|\s+)[0-9]{2,4}/)[0];
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


if(typeof chrome !== 'undefined'){
	chrome.runtime.onMessage.addListener(
		function(req, sender, sendResponse) {
			// sender.tab
			if (req.command == "parse"){
				let data = parse();
				console.log(JSON.stringify(data));
				sendResponse(data);
			}
		});
}
