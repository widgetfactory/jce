function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
}

// Editor Width
const jformConfigEditorWidth = document.querySelector('#jform_config_editor_width');
const widthMarkerSpan = document.querySelector('.widthMarker span');
const tinymceElements = document.querySelectorAll('.widthMarker, .mce-wren');

jformConfigEditorWidth.addEventListener('change', () => {
    let v = jformConfigEditorWidth.value || '100%';
    let s = v + 'px';

    if (/%/.test(v)) {
        s = v;
        v = 100;
    } else {
        v = parseInt(v, 10);
        s = v + 'px';
    }

    widthMarkerSpan.innerHTML = s;
    tinymceElements.forEach((element) => {
        element.style.width = s;
    });
});

jformConfigEditorWidth.dispatchEvent(new Event('change'));

// Editor Width (Part 2)
jformConfigEditorWidth.addEventListener('change', () => {
    let v = jformConfigEditorWidth.value || 'auto';

    if (/%/.test(v)) {
        v = 'auto';
    } else {
        if (typeof v === 'number') {
            v = parseInt(v, 10);
        }
    }
});

// Toolbar Theme
const jformConfigEditorToolbarTheme = document.querySelector('#jform_config_editor_toolbar_theme');
const editorLayout = document.querySelectorAll('.editor-layout .mceEditor, .editor-button-pool .mceEditor');
const defaultSkinElements = document.querySelectorAll('.mceDefaultSkin');
const profilePluginsSkinElement = document.querySelector('.mceDefaultSkin');
const headElement = document.querySelector('head');

jformConfigEditorToolbarTheme.addEventListener('change', function () {
    let value = this.value;

    if (value.indexOf('.') !== -1) {
        value = value.replace(/([^\.]+)\.([\w]+)/, (match, skin, variant) => {
            skin = 'mce' + ucfirst(skin);
            return skin + 'Skin ' + skin + 'Skin' + ucfirst(variant);
        });
    } else {
        value = 'mce' + ucfirst(value) + 'Skin';
    }

    editorLayout.forEach((element) => {
        element.className = element.className.replace(/mce([a-z0-9]+)Skin([a-z0-9]*)/gi, '').trim() + ' mceDefaultSkin ' + value;
    });

    defaultSkinElements.forEach((element) => {
        element.className = element.className.replace(/mce([a-z0-9]+)Skin([a-z0-9]*)/gi, '').trim() + ' mceDefaultSkin ' + value;
    });

    if (document.querySelector('#mce-theme')) {
        document.querySelector('#mce-theme').remove();
    }

    if (this.value === 'default') {
        return;
    }

    const stylesheet = this.value.replace(/\.\w+/, '');
    const linkElement = document.createElement('link');
    //linkElement.href = `${base_url}components/com_jce/editor/tiny_mce/themes/advanced/skins/${stylesheet}/ui.admin.css`;
    linkElement.rel = 'stylesheet';
    linkElement.id = 'mce-theme';
    headElement.appendChild(linkElement);
});

jformConfigEditorToolbarTheme.dispatchEvent(new Event('change'));

// Editor Path
const editorPathInputs = document.querySelectorAll('#jform_config_editor_path input[name]:checked');
const editorPathStatusbar = document.querySelector('.mce-tinymce .mce-statusbar .mce-path');

if (editorPathStatusbar) {
    editorPathInputs.forEach((input) => {
        input.addEventListener('change', () => {
            editorPathStatusbar.style.display = input.value === '1' ? 'block' : 'none';
        });

        input.dispatchEvent(new Event('change'));
    });
}

// Resizing
const editorResizing = document.querySelector('#jform_config_editor_resizing');
const editorResizeHandle = document.querySelector('.mce-tinymce .mce-statusbar .mce-resizehandle');

if (editorResizing) {
    editorResizing.addEventListener('change', () => {
        const v = editorResizing.value;
        editorResizeHandle.style.display = v === '1' ? 'block' : 'none';
    });

    editorResizing.dispatchEvent(new Event('change'));
}


// Toggle on/off
const jformConfigEditorToggle = document.querySelector('#jform_config_editor_toggle');
const editorToggle = document.querySelector('#editor_toggle');

jformConfigEditorToggle.addEventListener('change', () => {
    const v = jformConfigEditorToggle.value;
    // Show statusbar by default
    editorToggle.style.display = v === '1' ? 'block' : 'none';
});
jformConfigEditorToggle.dispatchEvent(new Event('change'));

// Hide toggle display if required
const editorToggleHidden = document.querySelector('#editor_toggle').hidden;
const jformConfigEditorToggleLength = document.querySelector('#jform_config_editor_toggle').length;
editorToggle.hidden = jformConfigEditorToggleLength === 0;

// Editor toggle label
const jformConfigEditorToggleLabel = document.querySelector('#jform_config_editor_toggle_label');
jformConfigEditorToggleLabel.addEventListener('change', () => {
    if (jformConfigEditorToggleLabel.value) {
        // Show statusbar by default
        editorToggle.textContent = jformConfigEditorToggleLabel.value;
    }
});