/**
 * editor_plugin_src.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function () {
    var VK = tinymce.VK, DOM = tinymce.DOM;

    tinymce.PluginManager.add('wordcount', function (ed, url) {
        var self = this,
            last = 0, block = 0;

        var countre = ed.getParam('wordcount_countregex', /[\w\u2019\x27\-\u00C0-\u1FFF]+/g); // u2019 == &rsquo; u00c0-u00ff extended latin chars with diacritical marks. exclude uc397 multiplication & u00f7 division
        var cleanre = ed.getParam('wordcount_cleanregex', /[0-9.(),;:!?%#$?\x27\x22_+=\\\/\-]*/g);
        var update_rate = ed.getParam('wordcount_update_rate', 2000);
        var update_on_delete = ed.getParam('wordcount_update_on_delete', false);
        var target_id = ed.id + '_word_count';

        ed.onWordCount = new tinymce.util.Dispatcher(self);

        function getCount() {
            var tc = 0;
            var tx = ed.getContent({
                format: 'raw'
            });

            if (tx) {
                tx = tx.replace(/\.\.\./g, ' '); // convert ellipses to spaces
                tx = tx.replace(/<.[^<>]*?>/g, ' ').replace(/&nbsp;|&#160;/gi, ' '); // remove html tags and space chars

                // deal with html entities
                tx = tx.replace(/(\w+)(&#?[a-z0-9]+;)+(\w+)/i, "$1$3").replace(/&.+?;/g, ' ');
                tx = tx.replace(cleanre, ''); // remove numbers and punctuation

                var wordArray = tx.match(countre);
                if (wordArray) {
                    tc = wordArray.length;
                }
            }

            return tc;
        }

        function countChars(ed) {
            var limit = parseInt(ed.getParam('wordcount_limit', 0), 10), showAlert = ed.getParam('wordcount_alert', 0);

            // Keep multiple calls from happening at the same time
            if (block) {
                return;
            }

            block = 1;

            setTimeout(function () {
                if (!ed.destroyed) {
                    var tc = getCount(ed);

                    // if a limit is set, set the count as words remaining
                    if (limit) {
                        tc = limit - tc;

                        if (tc < 0) {
                            DOM.addClass(target_id, 'mceWordCountLimit');

                            if (showAlert) {
                                ed.windowManager.alert(ed.getLang('wordcount.limit_alert', 'You have reached the word limit set for this content.'));
                            }

                        } else {
                            DOM.removeClass(target_id, 'mceWordCountLimit');
                        }
                    }

                    DOM.setHTML(target_id, tc.toString());

                    ed.onWordCount.dispatch(ed, tc);

                    setTimeout(function () {
                        block = 0;
                    }, update_rate);
                }
            }, 1);
        }

        ed.onPostRender.add(function (ed, cm) {
            // Add it to the specified id or the theme advanced path
            target_id = ed.getParam('wordcount_target_id', target_id);

            if (!DOM.get(target_id)) {
                var row = DOM.get(ed.id + '_path_row');

                if (row) {
                    DOM.add(row.parentNode, 'div', {
                        'class': 'mceWordCount'
                    }, ed.getLang('wordcount.words', 'Words: ') + '<span id="' + target_id + '" class="mceText">0</span>');
                }
            }
        });

        ed.onInit.add(function (ed) {
            ed.selection.onSetContent.add(function () {
                countChars(ed);
            });

            countChars(ed);
        });

        ed.onSetContent.add(function (ed) {
            countChars(ed);
        });

        function checkKeys(key) {
            return key !== last && (key === VK.ENTER || last === VK.SPACEBAR || checkDelOrBksp(last));
        }

        function checkDelOrBksp(key) {
            return key === VK.DELETE || key === VK.BACKSPACE;
        }

        ed.onKeyUp.add(function (ed, e) {
            if (checkKeys(e.keyCode) || update_on_delete && checkDelOrBksp(e.keyCode)) {
                countChars(ed);
            }

            last = e.keyCode;
        });
    });
})();