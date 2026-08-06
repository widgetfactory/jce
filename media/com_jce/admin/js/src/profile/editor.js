const ucfirst = (str) => str.charAt(0).toUpperCase() + str.substring(1);

// Editor Width
const EditorWidth = document.querySelector('#jform_config_editor_width');
const widthMarkerSpan = document.querySelector('.widthMarker span');
const ibisElements = document.querySelectorAll('.widthMarker, .mce-ibis');

EditorWidth.addEventListener('change', () => {
    let v = EditorWidth.value || '100%';
    let s = v + 'px';

    if (/%/.test(v)) {
        s = v;
        v = 100;
    } else {
        v = parseInt(v, 10);
        s = v + 'px';
    }

    widthMarkerSpan.textContent = s;

    ibisElements.forEach((element) => {
        element.style.width = s;
    });
});

EditorWidth.dispatchEvent(new Event('change'));

// Toolbar Theme
const ToolbarTheme = document.querySelector('#jform_config_editor_toolbar_theme');

ToolbarTheme.addEventListener('change', () => {
    const value = ToolbarTheme.value || 'modern';
    let cls;

    if (value.indexOf('.') !== -1) {
        cls = value.replace(/([^.]+)\.([\w]+)/, (match, skin, variant) => {
            const skinClass = 'mce' + ucfirst(skin);
            return skinClass + 'Skin ' + skinClass + 'Skin' + ucfirst(variant);
        });
    } else {
        cls = 'mce' + ucfirst(value) + 'Skin';
    }

    document.querySelectorAll('.editor-layout .mceEditor, .editor-button-pool .mceEditor, .mceDefaultSkin').forEach((element) => {
        element.className = element.className.replace(/mce([a-z0-9]+)Skin([a-z0-9]*)/gi, '').trim() + ' mceDefaultSkin ' + cls;
    });
});

ToolbarTheme.dispatchEvent(new Event('change'));

// Editor Path
const editorPathStatusbar = document.querySelector('.mce-ibis .mce-statusbar .mce-path');

if (editorPathStatusbar) {
    document.querySelectorAll('#jform_config_editor_path input[name]:checked').forEach((input) => {
        input.addEventListener('change', () => {
            editorPathStatusbar.style.display = input.value === '1' ? 'block' : 'none';
        });

        input.dispatchEvent(new Event('change'));
    });
}

// Resizing
const editorResizing = document.querySelector('#jform_config_editor_resizing');
const editorResizeHandle = document.querySelector('.mce-ibis .mce-statusbar .mce-resizehandle');

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

// only available in Pro
if (jformConfigEditorToggle && editorToggle) {
    jformConfigEditorToggle.addEventListener('change', () => {
        const v = jformConfigEditorToggle.value;
        // Show statusbar by default
        editorToggle.style.display = v === '1' ? 'block' : 'none';
    });

    jformConfigEditorToggle.dispatchEvent(new Event('change'));

    // Hide toggle display if required
    editorToggle.hidden = jformConfigEditorToggle.length === 0;

    // Editor toggle label
    const jformConfigEditorToggleLabel = document.querySelector('#jform_config_editor_toggle_label');

    jformConfigEditorToggleLabel.addEventListener('change', () => {
        if (jformConfigEditorToggleLabel.value) {
            editorToggle.textContent = jformConfigEditorToggleLabel.value;
        }
    });
}
