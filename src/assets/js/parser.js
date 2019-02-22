let parse = () => {


	// Selectors are tried in order.
	// The earlier a selector is in the
	// array the higher the preference.
	let selectors = [
		// '#owner-name a', // youtube
		'[rel="author"]',
		'[class*="byline"] a',
		'a[class*="byline"]:first',
		'[class*="byline"]:first',
		'[id*="author"] .name a',
		'[id*="author"] .name',
		'[id*="author"]',
		'[class*="author"] .name a',
		'[class*="author"] .name',
		'[class*="author"]',
		'[itemprop*="author"]',
		'[ng-bind-html*="author"]', // angularjs
		'[ng-if*="author"]', // angularjs
		'[class*="Contributor"], [class*="contributor"]',
		'[href*="author"]',
		'[href*="editor"]'
	];

	let bans = [
		'[class*="title"]', // job title
		'[class*="channel"]', // job title
		'[class*="raction"]',
		'body'
	];

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
			// sqush to single line
			let text = $(this).text().replace(/(^\s+|\n|\s+$)/g,' ');
			// slip over by
			if(text.length < 50)
				out += text+'_';
		});

		//cleanup
		out = out.replace(/(^_|^\s*by(:|)(\s+|_)|^\s*|_+$|phd)/ig, '');
		return out;
	}

	let selection;
	selectors.forEach(selector => {
		let $selector = $(selector+':visible').not(bans.join(','));
		if(!selection && $selector.length)
			selection = $selector;
	});

	// if selection fails look for
	// anything starting with by
	if(!selection){
		selection = $('*').filter(function() {
			return /^by\s+.+$/i.test($(this).text());
		});
	}
	
	let byline = '';

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
		let split = name.split(/\s+/).map(n => {
			if(/^([A-Z]|\s)+$/.test(n))
				return n[0] + n.substr(1).toLowerCase();
			else
				return n;
		}).filter(n => n !== '');

		// if not organization
		if(!/(^|\s+)(the)(\s+|$)/gi.test(name))
			split.unshift(split.pop());
			
		return split;
	});





	let source = '';
	let sourceSelectors = [
		'[class*=logo] img',
		'[class*=logo] a[title]',
		'[class*=logo]',
	];

	sourceSelectors.forEach((sel) => {
		let text = $(sel).attr('alt') || $(sel).attr('title');
		if(!source && !/logo|homepage/i.test(text)){
			source = text;
		} 
	});

	if(!source){
		source = location.host.replace(/\.[^\.]+$/,'').split('.').pop();
		let regex = source.split('').join('(\\s|)');
		let sourceMatches = $('body').text().match(new RegExp(regex, 'ig'));
		sourceMatches = sourceMatches.filter(match => {
			return !/^[A-Z]+$/.test(match);
		}).sort();
		source = sourceMatches[0];
	}

	source = source.replace(/\.(com|org|net)$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');

	source = source.split(/\s+/).map(n => {
		if(n.length > 2 && /^([A-Z]|\s)+$/.test(n))
			return n[0] + n.substr(1).toLowerCase();
		else
			return n;
	}).join(' ');

	






	let titleSelectors = [
		'h1[id*="title"]',
		'h1[class*="title"]',
		'article h1',
		'h1',
		'[class*="headline"]'
	]

	let title = '';
	titleSelectors.forEach(selector => {
		if(title == '') title = $(selector).first().text();
	});
	title = title.replace(/(^\s+|\s+$)/g,'');





	// Extract Date
	let date = $('time, [class*="article"] [class*="date"]').text() + $(selectors.join(',')).text() + $('body').text();
	date = date.match(/(today\s+[0-9]{1,2}:[0-9]{1,2}(|am|pm)|[0-9]{1,2}\s+hours\s+ago|(([0-9]{1,2}(nd|th|)|((Jan|Feb|Mar|Apr|May|Jun|July|Aug|Sep|Oct|Nov|Dec)[a-z]*))(-|\/|(\.|,|)[ \t]+)){2}[0-9]{2,4})/ig)[0];
	date = date.replace(/today/i, 'today at');
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
