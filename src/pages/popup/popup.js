chrome.tabs.executeScript({
    file: 'assets/libs/jquery.min.js'
});
chrome.tabs.executeScript({
    file: 'assets/libs/date.min.js'
});
chrome.tabs.executeScript({
    file: 'assets/js/parser.js'
});




class Popup {

    constructor() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {command: "parse"}, (data) => {
            this.data = data;
            this.render();
          });
        });

        $(document).ready(() => {
            $('.citation').click(() => this.copy());
            $(`.tab[value=${localStorage.style}]`).addClass('active');
        });
    }

    render() {
        let style = localStorage.style, 
            a = this.data;

        if(style == 'MLA'){
            let authors = a.authors.map(n => n.join(' ')).join(', ');
            this.value = `${authors}. "${a.title}." <i>${a.source}</i>. ${a.date}. ${a.url}. Accessed ${a.access}.`;
        }

        else{
            let authors = a.authors.join(', ');
            this.value = `${authors}. (${a.date}). ${a.title}. <i>${a.source}</i>. Retrieved from ${a.url}`;
        }


        // title account for all forms of end punctuation
        this.value = this.value.replace(/\s+/g,' ').replace(/\s*\.+/g,'.');
        $('.citation-body').html(this.value);
    }

    copy() {
        let $val = this.value,
        $wrap = $('<div>');

        $wrap.append($val);
        $wrap.css({
            'font-family': 'Times New Roman',
            'font-size': '16px',
            'padding-left': '48px',
            'text-indent': '-48px'
        });

        let val = $wrap.get(0).outerHTML;

        var dt = new clipboard.DT();
        dt.setData("text/html", val);
        clipboard.write(dt);
    }
}


let popup = new Popup();


$(document).ready(() => {
    $('.tab').click(function() {
        $('.tab').removeClass('active');
        let $this = $(this);
        $this.addClass('active');
        localStorage.style = $this.attr('value');
        popup.render();
    });
});



