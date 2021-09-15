/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* global Wf, tinyMCEPopup, jQuery */

(function ($) {
    function init() {
        $('#insert').on('click', function (e) {
            e.preventDefault();
            insert();
        }).show();

        $('#cancel').on('click', function (e) {
            e.preventDefault();
            tinyMCEPopup.close();
        }).show();

        var ed = tinyMCEPopup.editor, src = tinyMCEPopup.getWindowArg('value');

        Wf.init();

        if (/(:\/\/|www|index.php(.*)\?option)/gi.test(src)) {
            src = '';
        }

        if (src) {
            src = ed.convertURL(src);
            $('.uk-button-text', '#insert').text(tinyMCEPopup.getLang('update', 'Update', true));
        }

        $('[data-filebrowser]').val(src).filebrowser().on('filebrowser:onfileclick', function (e, file, data) {
            selectFile(data);
        });
    }

    function insert() {
        var win = tinyMCEPopup.getWindowArg('window');
        var callback = tinyMCEPopup.getWindowArg('callback');

        // a callback function of id must exist
        if (!callback) {
            return tinyMCEPopup.close();
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
            tinyMCEPopup.close();
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