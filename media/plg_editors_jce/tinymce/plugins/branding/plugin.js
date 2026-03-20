/*global tinymce:true */
/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
  var DOM = tinymce.DOM;

  tinymce.PluginManager.add('branding', function (ed, url) {

    // turn off branding
    if (ed.settings.branding === false) {
      return;
    }

    ed.onPostRender.add(function () {
      var container = ed.getContentAreaContainer();
      DOM.insertAfter(DOM.create('div', { 'class': 'mceBranding' }, 'Powered by JCE Core. <span id="mceBrandingMessage"></span><a href="https://www.joomlacontenteditor.net/buy" target="_blank" title="Get JCE Pro">JCE Pro</a>'), container);
    });

    ed.onNodeChange.add(function (ed, cm, n, co) {
      var container = ed.getContentAreaContainer(), msg = 'Get more features with ';

      if (n.nodeName === "IMG") {
        msg = 'Image resizing, thumbnails and editing in ';
      }

      if (ed.dom.is(n, '.mce-item-media')) {
        msg = 'Upload and manage audio and video with ';
      }

      DOM.setHTML(DOM.get('mceBrandingMessage', container), msg);
    });
  });
})();