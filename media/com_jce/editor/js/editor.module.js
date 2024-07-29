import { JoomlaEditor, JoomlaEditorDecorator, JoomlaEditorButton } from 'editor-api';

/* global tinyMCE, WfEditor */

/**
 * Decorator for JoomlaEditor
 */
class JceDecorator extends JoomlaEditorDecorator {
    /**
     * @returns {string}
     */
    getValue() {
        return WfEditor.getContent(this.instance.id);
    }

    /**
     * @param {String} value
     * @returns {JceDecorator}
     */
    setValue(value) {
        WfEditor.setContent(this.instance.id, value);
        return this;
    }

    /**
     * @returns {string}
     */
    getSelection() {
        return WfEditor.getSelection(this.instance.id, { format: 'text' });
    }

    replaceSelection(value) {
        WfEditor.insert(this.instance.id, value);
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

    editorButton(button) {
        JoomlaEditorButton.runAction(button.action, button.options || {});
    }
}

tinyMCE.onAddEditor.add(function (mgr, editor) {
    const elm = editor.getElement(), container = elm.parentNode;

    if (editor.settings.theme !== "advanced") {
        return;
    }

    // Create a decorator
    const JceEditor = new JceDecorator(editor, 'jce', elm.id);
    JoomlaEditor.register(JceEditor);

    // set first editor as active
    if (mgr.editors[0] === editor) {
        JoomlaEditor.setActive(JceEditor);
    }

    const editorButtons = container.parentNode.querySelector('.editor-xtd-buttons');

    if (editorButtons) {
        // set editor as active when editor-xtd button is clicked
        editorButtons.addEventListener('click', function (e) {
            if (e.target.matches('button') && e.target.parentNode === editorButtons) {
                mgr.setActive(editor);
                JoomlaEditor.setActive(JceEditor);
            }
        });

        // move bootstrap modals to body
        editorButtons.querySelectorAll('.modal').forEach(function (modal) {
            document.body.appendChild(modal);
        });
    }

    editor.editorXtdButtons = function (button) {
        JceEditor.editorButton(button);
    };
});

// expose for detection
window.JceDecorator = JceDecorator;
// expose for use
window.JoomlaEditor = JoomlaEditor;