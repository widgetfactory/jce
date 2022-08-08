/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* global jQuery */

(function ($) {

    function init() {
        // remove loader
        $(document).ready(function () {
            $('.ui-jce').removeClass('loading');
        });
    }

    $.fn.popover = function () {
        return this;
    };

    // run init when the doc is ready
    $(document).ready(function () {
        // add popover tips if help is not inline

        $('.form-horizontal', '.ui-jce').not('.form-help-inline').find('.hasPopover').tips();

        init();
    });
})(jQuery);