var page = require('webpage').create();
var data = require(phantom.libraryPath+'/data.json');


var tests = Object.keys(data);

page.onError = function(msg, trace) {
    // uncomment to log into the console 
    // console.error(msgStack.join('\n'));
};


// extract domain name from a URL
function sitename( url ) {
    var result = /^https?:\/\/([^\/]+)/.exec( url );
    if ( result ) {
        return( result[1] );
    } else {
        return( null );
    }
}
 
// add a callback to every request performed on a webpage
function adblock( page ) {
    page.onResourceRequested = function ( requestData, networkRequest ) {
        // pull out site name from URL
        var site = sitename( requestData.url );
        if ( ! site )
            return;
 
        // abort requests for particular domains
        if (
            ( /\.doubleclick\./.test( site ) ) ||
            ( /\.pubmatic\.com$/.test( site ) )
        ) {
            networkRequest.abort();
            return;
        }
    };
}
adblock(page);


// strip down version of npm colors
var styles = {};
var codes = {
  reset: [0, 0],

  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],

  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  grey: [90, 39],

  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgWhite: [47, 49]

};

Object.keys(codes).forEach(function(key) {
  var val = codes[key];
  var style = styles[key] = [];
  style.open = '\u001b[' + val[0] + 'm';
  style.close = '\u001b[' + val[1] + 'm';
});

Object.keys(styles).forEach(function(style) {
    String.prototype.__defineGetter__(style, function() {
        return styles[style].open + this + styles[style].close;
    });
});




var compare = function(result, expect) {
	var match = true;
	Object.keys(expect).forEach(function(key) {
		var strCompare = JSON.stringify(expect[key]) == JSON.stringify(result[key]);
		match = match && strCompare;
		if(!strCompare){
      console.log(JSON.stringify(result[key]));
      console.log(key.red);
    }
	});
	return match;
}

var errs = 0;
var test = function(i) {

	var url = tests[i];

	page.open(url, function(status) {

		setTimeout(function() {


			[
				'assets/libs/jquery.min.js',
				'assets/js/parser.js',
				'assets/libs/date.min.js'
			].forEach(function(dep) {
				page.injectJs(phantom.libraryPath+'/../dist/'+dep);
			});

		    var info = page.evaluate(function() {
				return window.parse();
			});

			if(compare(info, data[url]))
				console.log('- '.gray+url.green);
			else{
        errs++;
				console.log('- '.gray+url.red);
      }

			if(tests[i+1]) test(i+1);
			else {
        var accuracy = ((i+1-errs)/(i+1)*100).toFixed(2);
				console.log('\nAccuracy: '+accuracy+'%');
				phantom.exit();
			}

		}, 3000);

			
	});
}

console.log("\nTesting Articles:".bold.underline);
test(0);

