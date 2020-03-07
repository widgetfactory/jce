/**
 * tiny_mce_dev.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 *
 * This file should only be used while developing TinyMCE 
 * tiny_mce.js or tiny_mce_src.js should be used in a production environment.
 * This file loads the js files from classes instead of a merged copy.
 */

(function () {
    var i, base, src, p, query = '',
        it, scripts = [];

    base = '../../../tinymce-muon-retina/jscripts/tiny_mce/classes';

    function include(u, path) {
        path = path || base;

        scripts.push(path + '/' + u);
    };

    function load() {
        var i, html = '';

        for (i = 0; i < scripts.length; i++)
            html += '<script type="text/javascript" src="' + scripts[i] + '"></script>\n';

        document.write(html);
    };

    // Core ns
    include('tinymce.js');

    // tinymce.util.*
    include('util/Dispatcher.js');
    include('util/URI.js');
    include('util/Cookie.js');
    include('util/JSON.js');
    include('util/JSONP.js');
    include('util/XHR.js');
    include('util/JSONRequest.js');
    include('util/VK.js');
    include('util/Quirks.js');
    include('util/Preview.js');

    // tinymce.html.*
    include('html/Entities.js');
    include('html/Styles.js');
    include('html/Schema.js');
    include('html/SaxParser.js');
    include('html/Node.js');
    include('html/DomParser.js');
    include('html/Serializer.js');
    include('html/Writer.js');

    // tinymce.dom.*
    include('dom/EventUtils.js');
    include('dom/TreeWalker.js');
    include('dom/DOMUtils.js');
    //include('dom/Range.js');
    //include('dom/TridentSelection.js');
    include('dom/Sizzle.js');
    include('dom/Selection.js');
    include('dom/Serializer.js');
    include('dom/ScriptLoader.js');
    include('dom/StyleSheetLoader.js');
    include('dom/RangeUtils.js');
    include('dom/ControlSelection.js');

    // tinymce.ui.*
    include('ui/KeyboardNavigation.js');
    include('ui/Control.js');
    include('ui/Container.js');
    include('ui/Form.js');
    include('ui/Separator.js');
    include('ui/MenuItem.js');
    include('ui/Menu.js');
    include('ui/DropMenu.js');
    include('ui/Button.js');
    include('ui/ListBox.js');
    include('ui/NativeListBox.js');
    include('ui/TextBox.js');
    include('ui/MenuButton.js');
    include('ui/SplitButton.js');
    include('ui/ColorSplitButton.js');
    include('ui/ToolbarGroup.js');
    include('ui/Toolbar.js');
    include('ui/Layout.js');
    include('ui/Panel.js');
    include('ui/ContextPanel.js');
    include('ui/PanelButton.js');
    include('ui/PanelSplitButton.js');
    include('ui/ButtonDialog.js');

    // tinymce.*
    include('AddOnManager.js');
    include('EditorManager.js');
    include('Editor.js');
    include('Editor.Events.js');
    include('EditorCommands.js');
    include('UndoManager.js');
    include('ForceBlocks.js');
    include('ControlManager.js');
    include('WindowManager.js');
    include('Formatter.js');
    include('LegacyInput.js');
    include('EnterKey.js');

    /* Core plugins */
    include('core/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');
    include('help/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');
    include('autolink/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');
    include('cleanup/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');
    include('code/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');
    include('format/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');
    include('importcss/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');
    include('colorpicker/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');
    include('upload/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');
    include('figure/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');
    include('ui/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');
    include('noneditable/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');
    include('branding/editor_plugin.js', '../components/com_jce/editor/tiny_mce/plugins');

    load();
}());