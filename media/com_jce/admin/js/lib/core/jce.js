/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* global jQuery, Joomla */

(function ($) {

    function init() {
        // remove loader
        $(document).ready(function () {
            $('.ui-jce').removeClass('loading');
        });
    }

    // remove any Bootstrap popover bound to the element so it doesn't show alongside the tip
    function removePopover(element) {
        var $element = $(element), data = $element.data('popover') || $element.data('bs.popover');

        // Bootstrap 2 and 3 jQuery plugin
        if (data) {
            if (data.destroy) {
                data.destroy();
            } else if (data.dispose) {
                data.dispose();
            }

            $element.removeData('popover').removeData('bs.popover');
        }

        // Bootstrap 4 and 5
        if (window.bootstrap && window.bootstrap.Popover && window.bootstrap.Popover.getInstance) {
            var instance = window.bootstrap.Popover.getInstance(element);

            if (instance) {
                instance.dispose();
            }
        }

        // the plugin moves the title, so restore it for the tip
        if ($element.attr('data-original-title')) {
            $element.attr('title', $element.attr('data-original-title')).removeAttr('data-original-title');
        }

        // remove the markers so it cannot be initialised again
        $element.removeClass('hasPopover').removeAttr('data-toggle').removeAttr('data-bs-toggle').removeAttr('rel');
    }

    // run init when the doc is ready
    $(document).ready(function () {
        // add popover tips if help is not inline
        var $labels = $('.form-horizontal', '.ui-jce').not('.form-help-inline').find('.hasPopover');

        $labels.each(function () {
            removePopover(this);
        });

        $labels.tips();

        init();

        if (Joomla.Showon) {
            Joomla.Showon.initialise(document);
        }

    });
})(jQuery);