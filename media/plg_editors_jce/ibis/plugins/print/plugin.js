/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    ibis.PluginManager.add("print", function (ed) {
        ed.addCommand("mcePrint", function () {
            ed.getWin().print();
        });
        ed.addButton("print", {
            title: "print.desc",
            cmd: "mcePrint"
        });
    });
})();