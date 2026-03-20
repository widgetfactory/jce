/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    tinymce.PluginManager.add("print", function (ed) {
        ed.addCommand("mcePrint", function () {
            ed.getWin().print();
        });
        ed.addButton("print", {
            title: "print.desc",
            cmd: "mcePrint"
        });
    });
})();