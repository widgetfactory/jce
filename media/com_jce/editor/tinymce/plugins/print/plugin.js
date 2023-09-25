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