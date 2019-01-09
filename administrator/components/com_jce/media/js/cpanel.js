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
    Wf.cpanel = {
        options: {
            labels: {
                feed: 'Feed',
                updates: 'Updates',
                updates_available: 'Updates Available'
            },
            feed: true,
            updates: true
        },

        init: function(options) {

            $.extend(this.options, options || {});

            var o = this.options;

            if (o.feed) {
                $('ul.newsfeed').addClass('loading').html('<li>' + o.labels.feed + '</li>');

                // Get feed
                $.getJSON("index.php?option=com_jce&view=cpanel&task=feed", {}, function(r) {
                    $('ul.newsfeed').removeClass('loading').empty();

                    $.each(r.feeds, function(k, n) {
                        $('ul.newsfeed').append('<li><a href="' + n.link + '" target="_blank" title="' + n.title + '">' + n.title + '</a></li>');
                    });

                });

            }

            if (o.updates) {
                // Check updates
                $.getJSON("index.php?option=com_jce&view=updates&task=update&step=check", {}, function(r) {
                    if (r) {
                        if ($.type(r) == 'string') {
                            r = $.parseJSON(r);
                        }

                        if (r.error) {
                            var $list = $('.ui-jce dl').append('<dt>' + o.labels.updates + '</dt><dd><span class="label label-important"><i class="icon-exclamation-sign icon-warning icon-white"></i>&nbsp;' + r.error + '</span></dd>');
                            return false;
                        }

                        if (r.length) {
                            var $list = $('.ui-jce dl').append('<dt>' + o.labels.updates + '</dt><dd><a title="' + o.labels.updates + '" class="btn btn-small btn-info updates" href="#"><i class="icon-info-sign icon-info icon-white"></i>&nbsp;' + o.labels.updates_available + '</a></dd>');

                            $('a.updates', $list).click(function(e) {
                                e.preventDefault();

                                // trigger Joomla! 3.0 button
                                $('#toolbar-updates button').click();

                                // trigger toolbar button
                                $('#toolbar-updates a.updates').each(function() {
                                    Wf.core.createDialog(this, {
                                        src: $(this).attr('href'),
                                        options: {
                                            'width': 780,
                                            'height': 560
                                        }
                                    });
                                });
                            });
                        }
                    }
                });

            }
            // Open config/preferences dialog
            $('#newsfeed_enable').click(function(e) {
                // trigger Joomla! 3.0 button
                $('#toolbar-options button').click();

                // trigger toolbar button
                $('#toolbar-popup-options a.modal, #toolbar-config a.preferences').each(function() {
                    Wf.core.createDialog(this, {
                        src: $(this).attr('href'),
                        options: {
                            'width': 780,
                            'height': 560
                        }
                    });
                });

                e.preventDefault();
            });
        }
    };

    // run init when the doc is ready
    $(document).ready(function() {
        Wf.cpanel.init();
    });
})(jQuery, Wf);