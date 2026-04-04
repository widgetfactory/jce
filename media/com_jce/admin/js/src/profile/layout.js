import Sortable from './sortable';

const ucfirst = (str) => str.charAt(0).toUpperCase() + str.substring(1);

function createLayout() {
    Sortable('.sortable-list', {
        direction: 'vertical',
        connect: '.sortable-list',
        placeholder: 'sortable-row-highlight',
        stop: () => {
            setRows();
            setPlugins();
        }
    });

    Sortable('.sortable-list-item', {
        connect: '.sortable-list-item',
        placeholder: 'sortable-btn-highlight',
        stop: () => {
            setRows();
            setPlugins();
        }
    });

    if (!document.querySelector('[name$="[config][editor][toggle]"]')) {
        document.getElementById('editor_toggle').hidden = true;
    }
}

function setRows() {
    const rows = Array.from(document.querySelectorAll('.editor-layout .mce-toolbar'))
        .filter((toolbar) => toolbar.querySelector('.mce-btn'))
        .map((toolbar) => Array.from(toolbar.querySelectorAll('.mce-btn'))
            .map((button) => button.dataset.name)
            .join(',')
        );

    const rowsInput = document.querySelector('input[name="jform[rows]"]');
    rowsInput.value = rows.join(';');
    rowsInput.dispatchEvent(new Event('change'));
}

/**
 * show / hide parameters for each plugin
 */
function setPlugins() {
    const plugins = [];

    document.querySelectorAll('.editor-layout .sortable-list .mce-toolbar-item').forEach((btn) => {
        plugins.push(btn.dataset.name);
    });

    document.querySelectorAll('.editor-features input[type="checkbox"]:checked').forEach((checkbox) => {
        plugins.push(checkbox.value);
    });

    const pluginsInput = document.querySelector('input[name="jform[plugins]"]');
    pluginsInput.value = plugins.join(',');
    pluginsInput.dispatchEvent(new Event('change'));

    setParams(plugins);
}

function setParams(plugins) {
    const tabs = document.querySelectorAll('#profile-plugins-tabs > .nav-item');

    tabs.forEach((tab) => {
        const name = tab.querySelector('[href]').getAttribute('href').replace('#profile-plugins-', '');
        const isActive = plugins.includes(name);

        const panel = document.querySelector(`#profile-plugins-${name}`);
        panel.classList.remove('show', 'active');

        panel.querySelectorAll('input[name], select[name], textarea[name]').forEach((input) => {
            input.disabled = !isActive;
        });

        tab.hidden = !isActive;
    });

    const firstVisibleTab = Array.from(tabs).find((tab) => !tab.hidden);

    if (firstVisibleTab) {
        firstVisibleTab.classList.add('active');
        firstVisibleTab.dispatchEvent(new Event('click'));
    }
}

function updateTheme(value) {
    document.getElementById('mce-theme')?.remove();

    value = value || 'modern';

    // replace o2k7 with office
    value = value.replace('o2k7', 'office');

    // Update CSS skin class on editor preview elements
    const cls = value.indexOf('.') !== -1
        ? value.replace(/([^.]+)\.([\w]+)/, (match, skin, variant) => {
            const skinClass = 'mce' + ucfirst(skin);
            return skinClass + 'Skin ' + skinClass + 'Skin' + ucfirst(variant);
        })
        : 'mce' + ucfirst(value || 'default') + 'Skin';

    document.querySelectorAll('.editor-layout .mceEditor, .editor-button-pool .mceEditor, .mceDefaultSkin').forEach((el) => {
        el.className = el.className.replace(/mce([a-z0-9]+)Skin([a-z0-9]*)/gi, '').trim() + ' mceDefaultSkin ' + cls;
    });

    const stylesheet = value.replace(/\.\w+/, '');

    if (stylesheet === 'default' || stylesheet === 'modern' || stylesheet === 'retina') {
        return;
    }

    document.head.insertAdjacentHTML(
        'beforeend',
        `<link href="/media/plg_editors_jce/tinymce/themes/core/skins/${stylesheet}/ui.admin.css" rel="stylesheet" id="mce-theme" />`
    );
}

function init(form) {
    // Editor width
    const widthInput = form.querySelector('[name$="[editor][width]"]');

    if (widthInput) {
        const value = widthInput.value || '100%';
        const str = /%/.test(value) ? value : parseInt(value, 10) + 'px';

        const widthMarker = document.querySelector('.widthMarker span');
        if (widthMarker) {
            widthMarker.textContent = str;
        }

        document.querySelectorAll('.widthMarker, .mce-tinymce').forEach((el) => {
            el.style.width = str;
        });
    }

    // Toolbar theme
    const themeInput = form.querySelector('[name$="[editor][toolbar_theme]"]');
    if (themeInput) {
        updateTheme(themeInput.value);
    }

    // Editor path
    const pathInput = form.querySelector('[name*="[editor][path]"][type="checkbox"]:checked');
    if (pathInput) {
        const value = parseInt(pathInput.value, 10);
        form.querySelectorAll('.editor-layout .mce-tinymce .mce-statusbar .mce-path').forEach((item) => {
            item.hidden = !value;
        });
    }

    // Resizing
    const resizingInput = form.querySelector('[name$="[editor][resizing]"]');
    if (resizingInput) {
        const handle = form.querySelector('.editor-layout .mce-tinymce .mce-statusbar .mce-resizehandle');
        if (handle) {
            handle.hidden = !parseInt(resizingInput.value, 10);
        }
    }

    // Toggle
    const toggleInput = form.querySelector('[name$="[editor][toggle]"]');
    const editorToggle = document.getElementById('editor_toggle');

    if (toggleInput && editorToggle) {
        editorToggle.hidden = !parseInt(toggleInput.value, 10);

        const toggleLabelInput = form.querySelector('[name$="[editor][toggle_label]"]');
        if (toggleLabelInput?.value) {
            editorToggle.textContent = toggleLabelInput.value;
        }
    }
}

function triggerChange(e) {
    const elm = e.target, form = elm.closest('form');

    if (elm.matches('[name$="[editor][width]"]')) {
        const value = elm.value || '100%';
        const str = /%/.test(value) ? value : parseInt(value, 10) + 'px';

        document.querySelector('.widthMarker span').textContent = str;
        document.querySelectorAll('.widthMarker, .mce-tinymce').forEach((el) => {
            el.style.width = str;
        });
    }

    if (elm.matches('[name$="[editor][toolbar_theme]"]')) {
        updateTheme(elm.value);
    }

    if (elm.matches('input[name*="[editor][path]"][type="checkbox"]:checked')) {
        const value = parseInt(elm.value, 10);

        form.querySelectorAll('.editor-layout .mce-tinymce .mce-statusbar .mce-path').forEach((item) => {
            item.hidden = !value;
        });
    }

    if (elm.matches('[name$="[editor][resizing]"]')) {
        const value = parseInt(elm.value, 10);
        form.querySelector('.editor-layout .mce-tinymce .mce-statusbar .mce-resizehandle').hidden = !value;
    }

    if (elm.matches('[name$="[editor][toggle]"]')) {
        const value = parseInt(elm.value, 10);
        document.getElementById('editor_toggle').hidden = !value;
    }

    if (elm.matches('[name$="[editor][toggle_label]"]')) {
        if (elm.value) {
            document.getElementById('editor_toggle').textContent = elm.value;
        }
    }
}

export default {
    init,
    createLayout,
    setPlugins,
    updateTheme,
    triggerChange
};
