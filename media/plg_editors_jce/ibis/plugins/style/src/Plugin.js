/**
 * @package     JCE
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

import { showStyleDialog } from './Dialogs.js';

ibis.PluginManager.add('style', function (ed, url) {
    var isMobile = window.matchMedia('(max-width: 600px)').matches;

    if (isMobile) {
        return;
    }

    function isRootNode(node) {
        return node === ed.dom.getRoot();
    }

    ed.addCommand('mceStyleProps', function () {
        showStyleDialog(ed);
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

    ed.addButton('style', {
        title: 'style.desc',
        cmd: 'mceStyleProps'
    });
});
