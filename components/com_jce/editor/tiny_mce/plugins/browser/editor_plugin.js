/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function() {
  tinymce.create('tinymce.plugins.Browser', {
    init: function(ed, url) {
      var self = this;

      self.ed = ed;

      ed.addCommand('mceFileBrowser', function(ui, args, win) {
        self.open(args, win);
      });

    },
    open: function(args, win) {
      args = args || {};

      var ed = this.ed;

      ed.windowManager.open({
        file: ed.getParam('site_url') + 'index.php?option=com_jce&view=editor&layout=plugin&plugin=browser' + (args.caller ? '.' + args.caller : '') + (args.filter ? '&filter=' + args.filter : ''),
        inline: "yes",
        close_previous: "no",
        size: 'mce-modal-square-xlarge',
        width: 896,
        height: 707
      }, args);

      return false;
    },

    getInfo: function() {
      return {
        longname: 'Browser',
        author: 'Ryan Demmer',
        authorurl: 'http://www.joomlacontenteditor.net',
        infourl: 'http://www.joomlacontenteditor.net/index.php?option=com_content&amp;view=article&amp;task=findkey&amp;tmpl=component&amp;lang=en&amp;keyref=browser.about',
        version: '@@version@@'
      };
    }
  });

  // Register plugin
  tinymce.PluginManager.add('browser', tinymce.plugins.Browser);
})();
