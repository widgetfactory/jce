(function () {
    var i, base, src, p, li, query = '', it, scripts = [];
    
    base = '../../../tinymce-muon-legacy/jscripts/tiny_mce';

    function include(u) {
        scripts.push(base + '/classes/' + u);
    }

    function load() {
        var i, html = '';

        for (i = 0; i < scripts.length; i++)
            html += '<script type="text/javascript" src="' + scripts[i] + '"></script>\n';

        document.write(html);
    }

    // tinymce.*
    include('Popup.js');

    load();
}());
