import Init from "../Init";
import Content from "../Content";

function convertURL(url, elm, save, name) {
    var ed = tinymce.EditorManager.activeEditor,
        s = tinymce.settings,
        base = s.document_base_url;

    if (!url) {
        return url;
    }

    // Don't convert link href since thats the CSS files that gets loaded into the editor also skip local file URLs
    if (!s.convert_urls || (elm && elm.nodeName === 'LINK') || url.indexOf('file:') === 0) {
        return url;
    }

    if (url === base || url === base.substring(0, base.length - 1) || url.charAt(0) === '/') {
        return url;
    }

    // mixed urls allows absolute and relative urls based on user input
    if (!s.mixed_urls) {
        // Convert to relative
        if (s.relative_urls) {
            return ed.documentBaseURI.toRelative(url);
        }

        // Convert to absolute
        url = ed.documentBaseURI.toAbsolute(url, s.remove_script_host);
    }

    if (s.protocol_relative) {
        url = url.replace(/(http|https|ftp|ftps):\/\//, '//');
    }

    return url;
}

let WfEditor = {
    convertURL: convertURL,
    getContent: Content.get,
    setContent: Content.set,
    insertContent: Content.insert,
    getSelection: Content.getSelection,
    init: Init.init,
    create: Init.create
};

window.WfEditor = window.WFEditor = WfEditor;

export default {};