/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2019 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function($, Wf) {
    function check(s, v) {
        $.each(s.childNodes, function(i, n) {
            var input = n.firstChild;

            if (input.value === v) {
                return true;
            }
        });

        return false;
    }

    function close() {
        var win = window.parent;

        // try squeezebox
        if (typeof win.SqueezeBox !== 'undefined') {
            win.SqueezeBox.close();
        }
    }
    
    function select() {
        var u = [],
            v, o, h, s = window.parent.document.getElementById('users');

        $('input:checkbox:checked').each(function() {
            v = $(this).val();

            if (u = document.getElementById('username_' + v)) {
                h = $.trim(u.innerHTML);

                if (check(s, v)) {
                    return;
                }

                // create element
                var li = document.createElement('li');
                li.innerHTML = '<span>' + h + '</span><button class="btn btn-link users-list-delete"><i class="icon-trash"></i></button><input type="hidden" name="users[]" value="' + v + '" />';

                // add to list
                s.appendChild(li);
            }
        });

        close();
    }

    $(document).ready(function() {
        $('#cancel').click(function(e) {
            close();
            e.preventDefault();
        });

        $('#select').click(function(e) {
            select();
            e.preventDefault();
        });
    });
})(jQuery, Wf);