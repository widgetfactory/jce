import Sortable from './sortable';

function fixLayout() {
    // remove all empty groups and add new empty group
    document.querySelectorAll('.editor-layout .mce-btn-group').forEach((group) => {
        if (group.children.length === 0) {
            group.remove();
        }
    });

    const lastBtnGroup = document.querySelector('.editor-layout .mce-btn-group:last-child');
    const emptyGroup = document.createElement('div');
    emptyGroup.classList.add('mce-container', 'mce-flow-layout-item', 'mce-btn-group');
    lastBtnGroup.parentNode.insertBefore(emptyGroup, lastBtnGroup.nextSibling);

    // get options
    const options = Array.from(document.querySelectorAll('.mce-btn-group')).map((group) => {
        return {
            copy: false,
            moves: (el, container, handle) => {
                return !handle.classList.contains('mce-resizehandle');
            },
            accepts: (el, target) => {
                return target.classList.contains('sortableList') || target.classList.contains('sortableListItem');
            }
        };
    });
}

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

    if (!document.querySelector('[name$="[config][editor][toggle]')) {
        document.getElementById('editor_toggle').setAttribute('hidden', true);
    }
}

function setRows() {
    const rows = Array.from(document.querySelectorAll('.editor-layout .mce-toolbar'))
        .filter(function (toolbar) {
            return toolbar.querySelector('.mce-btn');
        })
        .map(function (toolbar) {
            return Array.from(toolbar.querySelectorAll('.mce-btn')).map(function (button) {
                return button.dataset.name;
            }).join(',');
        });

    const value = rows.join(';');

    // set rows and trigger change
    const rowsInput = document.querySelector('input[name="jform[rows]"]');
    rowsInput.value = value;
    rowsInput.dispatchEvent(new Event('change'));
}

/**
 * show / hide parameters for each plugin
 */
function setPlugins() {
    const plugins = [];

    document.querySelectorAll('.editor-layout .sortable-list .mce-toolbar-item').forEach(function (btn) {
        plugins.push(btn.dataset.name);
    });

    document.querySelectorAll('.editor-features input[type="checkbox"]:checked').forEach(function (checkbox) {
        plugins.push(checkbox.value);
    });

    // set plugins and trigger change
    const pluginsInput = document.querySelector('input[name="jform[plugins]"]');
    pluginsInput.value = plugins.join(',');
    pluginsInput.dispatchEvent(new Event('change'));

    setParams(plugins);
}

function setParams(plugins) {
    const tabs = document.querySelectorAll('#profile-plugins-tabs > .nav-item');

    // hide and deactivate all tabs and panels
    tabs.forEach(function (tab) {
        const name = tab.querySelector('[href]').getAttribute('href').replace('#profile-plugins-', '');
        const isActive = plugins.includes(name);

        // hide panel and disable forms
        const panel = document.querySelector(`#profile-plugins-${name}`);
        panel.classList.remove('show', 'active');

        panel.querySelectorAll('input[name], select[name], textarea[name]').forEach((input) => {
            input.disabled = !isActive;
        });

        tab.hidden = !isActive;
    });

    // show first tab pane
    const firstVisibleTab = Array.from(tabs).find(function (tab) {
        return !tab.hidden;
    });

    if (firstVisibleTab) {
        firstVisibleTab.classList.add('active');
        firstVisibleTab.dispatchEvent(new Event('click'));
    }
}

function updateTheme(value) {
    // remove theme
    if (document.getElementById('mce-theme')) {
        document.getElementById('mce-theme').remove();
    }

    // skip the default theme as this is always loaded
    if (value === "default") {
        return;
    }

    var stylesheet = value.replace(/\.\w+/, '');

    document.head.insertAdjacentHTML(
        'beforeend',
        `<link href="/media/plg_editors_jce/tinymce/themes/core/skins/${stylesheet}/ui.admin.css" rel="stylesheet" id="mce-theme" />`
    );
}

function triggerChange(e) {
    const elm = e.target, form = elm.closest('form');

    if (elm.matches('[name$="[editor][width]"]')) {
        let value = elm.value || '100%';
        let str = value;

        if (/%/.test(value)) {
            str = value;
        } else {
            value = parseInt(value, 10), str = value + 'px';
        }

        document.querySelector('.widthMarker span').innerHTML = str;
        document.querySelector('.widthMarker, .mce-tinymce').style.width = str;
    }

    // Toolbar Theme
    if (elm.matches('[name$="[editor][toolbar_theme]"]')) {
        updateTheme(elm.value);
    }

    // Editor Path
    if (elm.matches('input[name*="[editor][path]"][type="checkbox"]:checked')) {
        let value = parseInt(elm.value, 10);

        form.querySelectorAll('.editor-layout .mce-tinymce .mce-statusbar .mce-path').forEach((item) => {
            item.hidden = !!value;
        });
    }

    // resizing
    if (elm.matches('[name$="[editor][resizing]"]')) {
        let value = parseInt(elm.value, 10);

        // show statusbar by default
        const statusbar = form.querySelector('.editor-layout .mce-tinymce .mce-statusbar .mce-resizehandle');

        statusbar.hidden = !!value;
    }

    // toggle on/off
    if (elm.matches('[name$="[editor][toggle]')) {
        const value = parseInt(elm.value, 10);
        document.getElementById('editor_toggle').hidden = !!value;
    }

    // editor toggle label
    if (elm.matches('[name$="[editor][toggle_label]')) {
        if (elm.value) {
            // show statusbar by default
            document.getElementById('editor_toggle').innerText = elm.value;
        }
    }
}

export default {
    createLayout,
    setPlugins,
    updateTheme,
    triggerChange
};