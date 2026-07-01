/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

import { showDialog } from './Dialogs.js';

ibis.PluginManager.add('colorpicker', function (ed) {
    if (!ed.settings.color_picker_callback) {
        ed.settings.color_picker_callback = function (callback, value) {
            showDialog(ed, callback, value);
        };
    }

    ed.addCommand('mceColorPicker', function (ui, value) {
        showDialog(ed, value.callback, value.color);
    });
});
