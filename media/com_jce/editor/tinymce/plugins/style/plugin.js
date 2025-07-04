/**
 * @package     JCE
 * @copyright   Copyright (c) 2009       Moxiecode Systems AB. All rights reserved.
 * @copyright   Copyright (c) 1999–2017  Ephox Corp. All rights reserved.
 * @copyright   Copyright (c) 2009–2025  Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later (GPL v2+) – https://www.gnu.org/licenses/gpl-2.0.html
 * @note        Forked or includes code from TinyMCE 3.x/4.x/5.x (originally LGPL 2.1) and relicensed under GPL 2+ per LGPL 2.1 §3.
 *
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function () {
    tinymce.PluginManager.add('style', function (ed, url) {

        var isMobile = window.matchMedia("(max-width: 600px)").matches;

        // not currently supported on mobile
        if (isMobile) {
            return;
        }

        function isRootNode(node) {
            return node == ed.dom.getRoot();
        }

        // Register commands
        ed.addCommand('mceStyleProps', function () {
            var applyStyleToBlocks = false;
            var blocks = ed.selection.getSelectedBlocks();
            var styles = [];

            if (blocks.length === 1) {
                styles.push(ed.selection.getNode().style.cssText);
            } else {
                tinymce.each(blocks, function (block) {
                    styles.push(ed.dom.getAttrib(block, 'style'));
                });
                applyStyleToBlocks = true;
            }

            ed.windowManager.open({
                file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=style',
                size: 'mce-modal-landscape-xxlarge'
            }, {
                applyStyleToBlocks: applyStyleToBlocks,
                plugin_url: url,
                styles: styles
            });
        });

        ed.addCommand('mceSetElementStyle', function (ui, v) {
            var node = ed.selection.getNode();

            if (node) {
                ed.dom.setAttrib(node, 'style', v);
                ed.execCommand('mceRepaint');
            }
        });

        ed.onNodeChange.add(function (ed, cm, n) {
            cm.setDisabled('style', isRootNode(n) || n.hasAttribute('data-mce-bogus'));
        });

        // Register buttons
        ed.addButton('style', {
            title: 'style.desc',
            cmd: 'mceStyleProps'
        });
    });
})();
