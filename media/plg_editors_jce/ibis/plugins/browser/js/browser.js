/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* global Wf, ibisPopup, jQuery */

(function ($) {
    function init() {
        $('#insert').on('click', function (e) {
            e.preventDefault();
            insert();
        });

        $('#cancel').on('click', function (e) {
            e.preventDefault();
            ibisPopup.close();
        });

        var ed = ibisPopup.editor, src = ibisPopup.getWindowArg('value');

        Wf.init();

        // remove #joomlaImage options
        if (src && src.indexOf('#joomlaImage') != -1) {
            src = src.substring(0, src.indexOf('#'));
        }

        if (/(:\/\/|www|index.php(.*)\?option)/gi.test(src)) {
            src = '';
        }

        if (src) {
            src = ed.convertURL(src);
            $('.uk-button-text', '#insert').text(ibisPopup.getLang('update', 'Update', true));
        }

        $('[data-filebrowser]').val(src).filebrowser().on('filebrowser:onfileclick', function (e, file, data) {
            selectFile(data);
        }).on('filebrowser:onfileinsert', function (e, file, data) {
            insert();
        });
    }

    function insert() {
        var win = ibisPopup.getWindowArg('window');
        var callback = ibisPopup.getWindowArg('callback');

        // a callback function or id must exist
        if (!callback) {
            return ibisPopup.close();
        }

        // get selected items
        $('[data-filebrowser]').trigger('filebrowser:insert', function (selected, data) {                        
            // nothing selected, so create empty item
            if (!data.length) {
                data = [
                    {
                        "title": "",
                        "url": ""
                    }
                ];
            }

            if (typeof callback === "string") {
                selectFile(data[0]);
                win.document.getElementById(callback).value = $('[data-filebrowser]').val();
            }

            if (typeof callback === "function") {
                callback(selected, data);
            }

            // close popup window
            ibisPopup.close();
        });
    }

    function selectFile(file) {
        var src = file.url || '';

        // remove leading slash
        src = src.replace(/^\//, '');

        // update input element
        $('[data-filebrowser]').val(src);
    }

    $(document).ready(init);
})(jQuery);