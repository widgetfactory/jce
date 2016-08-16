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
    $.jce.Users = {
        select : function() {
            var u = [], v, o, h, s = window.parent.document.getElementById('users');

            $('input:checkbox:checked').each( function() {
                v = $(this).val();

                if (u = document.getElementById('username_' + v)) {
                    h = $.trim(u.innerHTML);

                    if ($.jce.Users.check(s, v)) {
                        return;
                    }

                    // create element
                    var li = document.createElement('li');
                    li.innerHTML = '<input type="hidden" name="users[]" value="' + v + '" /><label><span class="users-list-delete"></span>' + h + '</label>';

                    // add to list
                    s.appendChild(li);
                }
            });

            this.close();

        },

        check : function(s, v) {
            $.each(s.childNodes, function(i, n) {
                var input = n.firstChild;

                if (input.value === v) {
                    return true;
                }
            });

            return false;
        },

        close : function() {
            var win = window.parent;

            // try squeezebox
            if( typeof win.SqueezeBox !== 'undefined') {
                win.SqueezeBox.close();
            }
        }

    };

    $(document).ready(function(){
        $('#cancel').click(function(e) {
            $.jce.Users.close();

            e.preventDefault();
        });

        $('#select').click(function(e) {
            $.jce.Users.select();

            e.preventDefault();
        });
    });
})(jQuery);
