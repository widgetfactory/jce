import Header from './Header';

//var $ = tinymce.dom.DomQuery;
var DOM = tinymce.DOM;
var svgToggleIcon = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 448 448"><title></title><g id="wf-toggle-icon" stroke="none" stroke-width="1"></g><path d="M280 64.132v59.482c15.84 6.914 30.406 16.803 42.995 29.391 26.443 26.442 41.005 61.6 41.005 98.995s-14.563 72.552-41.005 98.995c-26.442 26.442-61.599 41.005-98.995 41.005s-72.552-14.563-98.995-41.005c-26.442-26.442-41.005-61.6-41.005-98.995s14.563-72.552 41.005-98.995c12.589-12.589 27.155-22.478 42.995-29.392v-59.481c-80.959 24.097-140 99.082-140 187.868 0 108.248 87.753 196 196 196s196-87.752 196-196c0-88.786-59.041-163.77-140-187.868zM196 0h56v224h-56z"></path></svg>';

function toggle(element) {
    var editor = tinymce.get(element.id);

    // turn it on
    if (!editor) {
        // add loader
        DOM.addClass(element.parentNode, 'mce-loading');

        DOM.removeClass(element, 'wf-no-editor');
        DOM.removeClass(element.parentNode, 'wf-editor-toggle-off');

        // store state
        localStorage.setItem('wf-editor-state', 1);

        // switch editor on
        tinymce.execCommand('mceToggleEditor', false, element.id);

        // remove loader
        setTimeout(function () {
            DOM.removeClass(element.parentNode, 'mce-loading');
        }, 1000);
    } else {
        if (editor.isHidden()) {
            DOM.addClass(element, 'wf-editor');

            DOM.setStyle(DOM.select('.wf-editor-tabs', element.parentNode), 'display', '');
            DOM.removeClass(element.parentNode, 'wf-editor-toggle-off');

            // store state
            localStorage.setItem('wf-editor-state', 1);

            var activeTab = sessionStorage.getItem('wf-editor-tabs') || 'wf-editor-wysiwyg';

            // hide textarea
            DOM.hide(editor.getElement());

            switch (activeTab) {
                case 'wf-editor-wysiwyg':
                    editor.show();
                    break;
                case 'wf-editor-source':
                    editor.plugins.source.toggle(editor);
                    break;
                case 'wf-editor-preview':
                    editor.plugins.preview.toggle();
                    break;
            }
        } else {
            DOM.addClass(element, 'wf-no-editor');

            DOM.hide(DOM.select('.wf-editor-tabs', element.parentNode));
            DOM.addClass(element.parentNode, 'wf-editor-toggle-off');

            // set textarea height
            DOM.setStyle(element, 'height', editor.getContainer().offsetHeight);

            // store state
            localStorage.setItem('wf-editor-state', 0);

            // hide source
            if (editor.plugins.source) {
                editor.plugins.source.hide();
            }

            // hide preview
            if (editor.plugins.preview) {
                editor.plugins.preview.hide();
            }

            editor.hide();
        }
    }
}

function create(element, settings) {
    var canToggle = tinymce.is(settings.toggle) ? settings.toggle : 1;

    if (!canToggle) {
        return;
    }

    // create it if it doesn't exist (K2, WidgetKit etc.)
    var header = Header.create(element);

    if (DOM.select('.wf-editor-toggle', header).length == 0) {
        // create toggle button
        var btn = DOM.add(header, 'button', {
            'class': 'wf-editor-toggle btn btn-link',
            'tabindex': '-1'
        }, '' + svgToggleIcon + (settings.toggle_label || ""));
        
        DOM.bind(btn, 'click', function (e) {
            e.preventDefault();
            toggle(element);
        });
    }
}

export default {
    create,
    toggle
};