/**
 * @package     JCE
 * @copyright   Copyright (c) 2009–2025  Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later (GPL v2+) – https://www.gnu.org/licenses/gpl-2.0.html
 *
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*global tinymce:true */

(function () {
  tinymce.PluginManager.add('colorpicker', function (ed, url) {
    // Register commands
    ed.addCommand('mceColorPicker', function (ui, v) {
      ed.windowManager.open({
        url: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=colorpicker',
        width: 365,
        height: 320,
        close_previous: false
      }, {
        input_color: v.color,
        func: v.func
      });
    });
  });
})();
