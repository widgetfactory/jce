/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    tinymce.PluginManager.add('browser', function (ed, url) {
        var self = this;

        ed.addCommand('mceFileBrowser', function (ui, args, win) {
            self.open(args, win);
        });

        this.open = function (args, win) {
            args = args || {};

            ed.windowManager.open({
                file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=browser' + (args.caller ? '.' + args.caller : '') + (args.filter ? '&filter=' + args.filter : ''),
                close_previous: "no",
                size: 'mce-modal-landscape-full'
            }, args);

            return false;
        };
    });
})();