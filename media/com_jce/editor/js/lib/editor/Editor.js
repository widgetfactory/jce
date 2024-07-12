function state(element, settings) {
    // get stored state
    var state = 0;

    if (settings.use_state_cookies !== false) {
        state = localStorage.getItem('wf_editor_state_' + element.id);
    }

    // not defined
    if (state === null || typeof state === "undefined") {
        state = tinymce.is(settings.toggle_state) ? settings.toggle_state : 1;
    }

    // cast to integer
    state = parseInt(state, 10);

    return state;
}

function get(element) {
    var editor, win = window;

    // tinymce is in the parent window
    if (window.parent.tinymce) {
        win = window.parent;
    }

    if (element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }

        // use element passed in
        if (element && element.id) {
            editor = win.tinymce.get(element.id);
        }
    }

    // get active editor
    if (!editor) {
        editor = win.tinymce.activeEditor;
    }

    // return tinymce
    if (editor && !editor.isHidden()) {
        return editor;
    }

    if (editor) {
        // get source code editor
        var source = editor.plugins.source;

        if (source && !source.isHidden()) {
            return source;
        }
    }

    return false;
}

export default {
    get,
    state
};