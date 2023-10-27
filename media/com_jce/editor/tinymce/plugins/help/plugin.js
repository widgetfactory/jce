/**
 * @package    JCE
 * @copyright    Copyright (c) 2009-2023 Ryan Demmer. All rights reserved.
 * @license    GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*global tinymce:true */

(function () {

  tinymce.create('tinymce.plugins.HelpPlugin', {
    init: function (ed, url) {
      this.editor = ed;

      ed.addCommand('mceHelp', function () {
        ed.windowManager.open({
          title: ed.getLang('dlg.help', 'Help'),
          url: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=help&lang=' + ed.getParam('language') + '&section=editor&category=editor&article=about',
          size: 'mce-modal-landscape-full'
        });
      });

      // Register buttons
      ed.addButton('help', {
        title: 'dlg.help',
        cmd: 'mceHelp'
      });
    }
  });

  // Register plugin
  tinymce.PluginManager.add('help', tinymce.plugins.HelpPlugin);
})();