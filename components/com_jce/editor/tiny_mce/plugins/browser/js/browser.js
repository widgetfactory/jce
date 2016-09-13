/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function($) {
  var BrowserDialog = {
    init: function(ed) {
      var self = this,
        action = 'insert';

      $('#insert').click(function(e) {
        e.preventDefault();
        self.insert();
      });

      $('#cancel').click(function(e) {
        e.preventDefault();
        tinyMCEPopup.close();
      });

      var win = tinyMCEPopup.window;
      var src = tinyMCEPopup.getWindowArg('value');

      Wf.init();

      if (/(:\/\/|www|index.php(.*)\?option)/gi.test(src)) {
        src = '';
      }

      if (src) {
        src = tinyMCEPopup.editor.convertURL(src);
        $('.uk-button-text', '#insert').text(tinyMCEPopup.getLang('update', 'Update', true));
      }

      $('#src').val(src).filebrowser().on('filebrowser:onfileclick', function(e, file) {
          self.selectFile(file);
      });
    },

    insert: function() {
      var win = tinyMCEPopup.getWindowArg('window'), self = this;

      var src = $('#src').val(), selected = [];
      var callback = tinyMCEPopup.getWindowArg('callback');

      // get selected items
      $('#src').trigger('filebrowser:insert', function(selected, data) {

        if (typeof callback === "string") {
          if (src === '' && data.length) {
            self.selectFile(data[0]);
          }
          win.document.getElementById(callback).value = $('#src').val();
        }

        if (typeof callback === "function") {
          callback(selected, data);
        }

        // close popup window
        tinyMCEPopup.close();
      });
    },

    selectFile: function(file) {
      var self = this, name = file.title, src = file.url;

      if (src) {
        // remove leading slash
        src = src.replace(/^\//, '');
        $('#src').val(src);
      }
    }
  };

  $(document).ready(function() {
      BrowserDialog.init();
  });
})(jQuery);
