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
    $.jce.Preferences = {
        init : function() {
            var self = this;

            $('#tabs, #tabs-access-permissions').tabs().find('.nav-tabs > li:first-child, .tab-content > .tab-pane:first-child').addClass('active');

            $('.hasTip').removeClass('hasTip');

            $('input[name="task"]').val('apply');

            $('#apply, #save').click(function() {
                if ($(this).attr('id') == 'save') {
                    $('input[name="task"]').val('save');
                }

                $('form').submit();
            });

            $('#cancel').click(function(e) {
                var win = window.parent;

                // try squeezebox
                if( typeof win.SqueezeBox !== 'undefined') {
                    return win.SqueezeBox.close();
                } else {
                    this.close();
                }
                e.preventDefault();
            });
        },

        close : function() {
            this.init();

            window.setTimeout(function(){
                window.parent.document.location.href="index.php?option=com_jce&view=cpanel";
            }, 1000);
        }
    };
})(jQuery);
