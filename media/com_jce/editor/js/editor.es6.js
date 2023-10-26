import { JoomlaEditor, JoomlaEditorDecorator } from 'editor-api';

/* global tinyMCE, WfEditor */

/**
 * Decorator for JoomlaEditor
 */
class JceDecorator extends JoomlaEditorDecorator {
    /**
     * @returns {string}
     */
    getValue() {
        return this.instance.getContent();
    }

    /**
     * @param {String} value
     * @returns {JceDecorator}
     */
    setValue(value) {
        this.instance.setContent(value);
        return this;
    }

    /**
     * @returns {string}
     */
    getSelection() {
        return this.instance.selection.getContent({
            format: 'text'
        });
    }

    replaceSelection(value) {
        this.instance.execCommand('mceInsertContent', false, value);
        return this;
    }

    disable(enable) {
        this.instance.setMode(!enable ? 'readonly' : 'design');
        return this;
    }

    /**
     * Toggles the editor visibility mode. Used by Toggle button.
     * Should be implemented by editor provider.
     *
     * @param {boolean} show Optional. True to show, false to hide.
     *
     * @returns {boolean} Return True when editor become visible, and false when become hidden.
     */
    toggle(show) {
        let visible = false;
        WfEditor.toggleEditor(this.instance.getElement());
        return visible;
    }
}

tinyMCE.onAddEditor.add(function (mgr, editor) {
    const elm = editor.getElement();

    if (editor.settings.theme !== "advanced") {
        return;
    }

    // Create a decorator
    const JceEditor = new JceDecorator(editor, 'jce', elm.id);
    JoomlaEditor.register(JceEditor);
});