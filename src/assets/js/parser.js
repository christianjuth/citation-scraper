let parse = () => {


	// Extract Author
	let author = $('[rel="author"]').first().text();
	author = author || $("p, div").filter(function() {
		let text = $(this).text();
		text = text.replace(/(^\s+|\n|\s+$)/g,'').replace(/\s+/g,' ');
		return /^\s*By [A-Z].+/.test(text);
	}).sort((a,b) => {
		let out = 0;
		if($(a).has(b)) out++;
		else if($(b).has(a)) out--;
		return out;
	}).first().text();

	if(!author){
		author = $('.byline').text();
	}

	author = author.replace(/(^\s+|\n|\s+$)/g,'').replace(/(^By\s+|\s*(\s\W\s).+$)/g, '').replace(/\s+/g,' ').split(/\s+/);



	let title = document.title;
	title = title.split(/(\||-)/);
	let source;
	if(title.length > 1){
		source = title.pop();
	} else{
		source = $('[alt]').filter(function() {
			let $this = $(this),
				klass = $this.attr('class') || '';
			return klass.indexOf('logo') !== -1;
		}).first().attr('alt');
	}

	if(!source && $('.logo, #logo').length > 0){
		source = $('.logo, #logo').text();
	}

	if(!source){
		source = location.host.replace(/\.[^\.]+$/,'').split('.').pop();
	}
	title = $('h1').first().text();// title[0];



	// Extract Date
	let date = $('time').first().text();
	date = date || $("body *").map(function() {
		return $(this).text().match(/[A-Z][a-z]+(\.|) [0-9]{1,2}, [0-9]{2,4}/);
	})[0];


	let parseDate = (str) => {
		parsed = Date.parse(str);
		if(!parsed){
			let split = str.split(' ');
			split.pop();
			if(split.length > 0)
				parsed = parseDate(split.join(' '));
		}
		if(!parsed){
			let split = str.split(' ');
			split.shift();
			if(split.length > 0)
				parsed = parseDate(split.join(' '));
		}
		return parsed;
	}

	date = parseDate(date).toString('d MMM. yyyy');



	return {
		lastName: author.pop(),
		firstName: author.join(' '),
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