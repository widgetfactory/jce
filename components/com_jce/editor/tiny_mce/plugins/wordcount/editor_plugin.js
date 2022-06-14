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
    var DOM = tinymce.DOM, Delay = tinymce.util.Delay;

    tinymce.PluginManager.add('wordcount', function (ed, url) {
        var self = this;

        var countre = ed.getParam('wordcount_countregex', /[\w\u2019\x27\-\u00C0-\u1FFF]+/g); // u2019 == &rsquo; u00c0-u00ff extended latin chars with diacritical marks. exclude uc397 multiplication & u00f7 division
        var cleanre = ed.getParam('wordcount_cleanregex', /[0-9.(),;:!?%#$?\x27\x22_+=\\\/\-]*/g);
        var update_rate = ed.getParam('wordcount_update_rate', 200);
        var target_id = ed.id + '_word_count';

        ed.onWordCount = new tinymce.util.Dispatcher(self);

        function processText(tx) {
            var tc = 0;

            if (!tx) {
                return tc;
            }

            tx = tx.replace(/\.\.\./g, ' '); // convert ellipses to spaces
            tx = tx.replace(/<.[^<>]*?>/g, ' ').replace(/&nbsp;|&#160;/gi, ' '); // remove html tags and space chars

            // deal with html entities
            tx = tx.replace(/(\w+)(&#?[a-z0-9]+;)+(\w+)/i, "$1$3").replace(/&.+?;/g, ' ');
            tx = tx.replace(cleanre, ''); // remove numbers and punctuation

            var wordArray = tx.match(countre);

            if (wordArray) {
                tc = wordArray.length;
            }

            return tc;
        }

        function getCount() {
            var tx = ed.getContent({
                format: 'raw',
                no_events: true // ??
            });

            return processText(tx);
        }

        function countChars(tc) {

            if (ed.destroyed) {
                return;
            }

            if (tc) {
                DOM.setAttrib(target_id, 'title', ed.getLang('wordcount.selection', 'Selected Words:'));
                return DOM.setHTML(target_id, tc.toString());
            }

            var limit = parseInt(ed.getParam('wordcount_limit', 0), 10), showAlert = ed.getParam('wordcount_alert', 0);

            tc = getCount();

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

            DOM.setAttrib(target_id, 'title', ed.getLang('wordcount.words', 'Words:'));
            DOM.setHTML(target_id, tc.toString());

            ed.onWordCount.dispatch(ed, tc);
        }

        ed.onPostRender.add(function (ed, cm) {
            // Add it to the specified id or the theme advanced path
            target_id = ed.getParam('wordcount_target_id', target_id);

            if (!DOM.get(target_id)) {
                var row = DOM.get(ed.id + '_path_row');

                if (row) {
                    var label = ed.getLang('wordcount.words', 'Words:');

                    DOM.add(row.parentNode, 'div', {
                        'class': 'mceWordCount'
                    }, '<span title="' + label + '" id="' + target_id + '" class="mceText">0</span>');
                }
            }
        });

        var countAll = Delay.debounce(function () {
            countChars();
        }, update_rate);

        var countSelection = Delay.debounce(function () {
            var rng = ed.selection.getRng(), sel = ed.selection.getSel();

            if (!rng.collapsed) {
                var text = rng.text || (sel.toString ? sel.toString() : '');
                var count = processText(text);
                countChars(count);
            } else {
                countChars();
            }
        }, update_rate);

        // update on selection or content change
        ed.onSelectionChange.add(countSelection);

        // set total count when editor loads
        ed.onInit.add(countAll);
    });
})();