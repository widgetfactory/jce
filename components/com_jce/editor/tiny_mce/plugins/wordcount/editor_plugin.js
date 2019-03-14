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
    tinymce.create('tinymce.plugins.WordCount', {
        block: 0,
        id: null,
        countre: null,
        cleanre: null,

        init: function (ed, url) {
            var self = this,
                last = 0,
                VK = tinymce.VK;

            self.countre = ed.getParam('wordcount_countregex', /[\w\u2019\x27\-\u00C0-\u1FFF]+/g); // u2019 == &rsquo; u00c0-u00ff extended latin chars with diacritical marks. exclude uc397 multiplication & u00f7 division
            self.cleanre = ed.getParam('wordcount_cleanregex', /[0-9.(),;:!?%#$?\x27\x22_+=\\\/\-]*/g);
            self.update_rate = ed.getParam('wordcount_update_rate', 2000);
            self.update_on_delete = ed.getParam('wordcount_update_on_delete', false);
            self.id = ed.id + '_word_count';

            ed.onWordCount = new tinymce.util.Dispatcher(self);

            ed.onPostRender.add(function (ed, cm) {
                var row, id;

                // Add it to the specified id or the theme advanced path
                id = ed.getParam('wordcount_target_id');
                if (!id) {
                    row = tinymce.DOM.get(ed.id + '_path_row');

                    if (row)
                        tinymce.DOM.add(row.parentNode, 'div', {
                            'class': 'mceWordCount'
                        }, ed.getLang('wordcount.words', 'Words: ') + '<span id="' + self.id + '" class="mceText">0</span>');
                } else {
                    tinymce.DOM.add(id, 'span', {}, '<span id="' + self.id + '">0</span>');
                }
            });

            ed.onInit.add(function (ed) {
                ed.selection.onSetContent.add(function () {
                    self._count(ed);
                });

                self._count(ed);
            });

            ed.onSetContent.add(function (ed) {
                self._count(ed);
            });

            function checkKeys(key) {
                return key !== last && (key === VK.ENTER || last === VK.SPACEBAR || checkDelOrBksp(last));
            }

            function checkDelOrBksp(key) {
                return key === VK.DELETE || key === VK.BACKSPACE;
            }

            ed.onKeyUp.add(function (ed, e) {
                if (checkKeys(e.keyCode) || self.update_on_delete && checkDelOrBksp(e.keyCode)) {
                    self._count(ed);
                }

                last = e.keyCode;
            });
        },

        _getCount: function (ed) {
            var tc = 0;
            var tx = ed.getContent({
                format: 'raw'
            });

            if (tx) {
                tx = tx.replace(/\.\.\./g, ' '); // convert ellipses to spaces
                tx = tx.replace(/<.[^<>]*?>/g, ' ').replace(/&nbsp;|&#160;/gi, ' '); // remove html tags and space chars

                // deal with html entities
                tx = tx.replace(/(\w+)(&#?[a-z0-9]+;)+(\w+)/i, "$1$3").replace(/&.+?;/g, ' ');
                tx = tx.replace(this.cleanre, ''); // remove numbers and punctuation

                var wordArray = tx.match(this.countre);
                if (wordArray) {
                    tc = wordArray.length;
                }
            }

            return tc;
        },

        _count: function (ed) {
            var self = this,
                limit = parseInt(ed.getParam('wordcount_limit', 0)), showAlert = ed.getParam('wordcount_alert', 0);

            // Keep multiple calls from happening at the same time
            if (self.block)
                return;

            self.block = 1;

            setTimeout(function () {
                if (!ed.destroyed) {
                    var tc = self._getCount(ed);

                    // if a limit is set, set the count as words remaining
                    if (limit) {
                        tc = limit - tc;
                        
                        if (tc < 0) {
                            tinymce.DOM.addClass(self.id, 'mceWordCountLimit');

                            if (showAlert) {
                                ed.windowManager.alert(ed.getLang('wordcount.limit_alert', 'You have reached the word limit set for this content.'));
                            }

                        } else {
                            tinymce.DOM.removeClass(self.id, 'mceWordCountLimit');
                        }
                    }

                    tinymce.DOM.setHTML(self.id, tc.toString());

                    ed.onWordCount.dispatch(ed, tc);

                    setTimeout(function () {
                        self.block = 0;
                    }, self.update_rate);
                }
            }, 1);
        }
    });

    tinymce.PluginManager.add('wordcount', tinymce.plugins.WordCount);
})();