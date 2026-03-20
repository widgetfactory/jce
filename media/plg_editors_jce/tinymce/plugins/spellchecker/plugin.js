/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @copyright   Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function () {
    var each = tinymce.each,
        DOM = tinymce.DOM;

    var counter = 0;

    /**
     Generates an unique ID.
     @method uid
     @return {String} Virtually unique id.
     */
    function uid() {
        var guid = new Date().getTime().toString(32),
            i;

        for (i = 0; i < 5; i++) {
            guid += Math.floor(Math.random() * 65535).toString(32);
        }

        return 'wf_' + guid + (counter++).toString(32);
    }

    tinymce.PluginManager.add('spellchecker', function (ed, url) {
        var self = this;

        self.menu = null;

        self.native_spellchecker = ed.getParam("spellchecker_engine", "browser") == 'browser';

        if (self.native_spellchecker) {
            // Disable the context menu when spellchecking is active
            if (ed.getParam("spellchecker_suggestions", true)) {

                ed.onContextMenu.addToTop(function (ed, e) {
                    if (self.active) {
                        return false;
                    }
                });
            }
        }

        // Register commands
        ed.addCommand('mceSpellCheck', function () {
            if (self.native_spellchecker) {
                var body = ed.getBody();

                body.spellcheck = self.active = !self.active;

                ed.focus();

                return;
            }

            if (!self.active) {
                ed.setProgressState(1);
                sendRPC('checkWords', [self.selectedLang, getWords()], function (r) {
                    if (r.length > 0) {
                        self.active = 1;
                        markWords(r);
                        ed.setProgressState(0);
                        ed.nodeChanged();
                    } else {
                        ed.setProgressState(0);

                        if (ed.getParam('spellchecker_report_no_misspellings', true)) {
                            ed.windowManager.alert('spellchecker.no_mpell');
                        }
                    }
                });
            } else {
                done();
            }
        });

        ed.onNodeChange.add(function (ed, cm) {
            cm.setActive('spellchecker', !!self.active);
        });

        // only required for PHP spellchecker
        if (!self.native_spellchecker) {
            // show menus if enabled
            if (ed.getParam("spellchecker_suggestions", true)) {
                ed.onClick.add(showMenu, self);
                ed.onContextMenu.add(showMenu, self);
            }

            ed.onBeforeGetContent.add(function () {
                if (self.active) {
                    removeWords();
                }
            });

            ed.onNodeChange.add(function (ed, cm) {
                cm.setActive('spellchecker', !!self.active);
            });

            ed.onSetContent.add(function () {
                done();
            });

            ed.onBeforeGetContent.add(function () {
                done();
            });

            ed.onBeforeExecCommand.add(function (ed, cmd) {
                if (cmd == 'mceFullScreen') {
                    done();
                }
            });
        }

        // Find selected language
        var languages = {};

        each(ed.getParam('spellchecker_languages', '+English=en,Danish=da,Dutch=nl,Finnish=fi,French=fr,German=de,Italian=it,Polish=pl,Portuguese=pt,Spanish=es,Swedish=sv', 'hash'), function (v, k) {
            if (k.indexOf('+') === 0) {
                k = k.substring(1);
                self.selectedLang = v;
            }

            languages[k] = v;
        });

        // Turn spellchecker on if required
        ed.onInit.add(function () {
            if (self.native_spellchecker && ed.getParam('spellchecker_browser_state', 0)) {
                var body = ed.getBody();
                body.spellcheck = self.active = !self.active;
            }
        });

        this.createControl = function (n, cm) {
            var self = this, c;

            if (n == 'spellchecker') {
                // Use basic button if we use the native spellchecker
                if (self.native_spellchecker) {
                    // Create simple toggle button for native spellchecker
                    c = cm.createButton(n, {
                        title: 'spellchecker.desc',
                        cmd: 'mceSpellCheck',
                        scope: self
                    });

                    return c;
                }

                c = cm.createSplitButton(n, {
                    title: 'spellchecker.desc',
                    cmd: 'mceSpellCheck',
                    scope: self
                });

                c.onRenderMenu.add(function (c, m) {
                    m.add({
                        title: 'spellchecker.langs',
                        'class': 'mceMenuItemTitle'
                    }).setDisabled(1);

                    self.menuItems = {};

                    each(languages, function (v, k) {
                        var o = {}, mi;

                        o.onclick = function () {
                            if (v == self.selectedLang) {
                                return;
                            }
                            updateMenu(mi);
                            self.selectedLang = v;
                        };

                        o.title = k;
                        mi = m.add(o);
                        mi.setSelected(v == self.selectedLang);
                        self.menuItems[v] = mi;
                        if (v == self.selectedLang) {
                            self.selectedItem = mi;
                        }
                    });
                });

                return c;
            }
        };

        this.setLanguage = function (lang) {
            var self = this;

            if (lang == self.selectedLang) {
                // allowed
                return;
            }

            if (tinymce.grep(self.languages, function (v) {
                return v === lang;
            }).length === 0) {
                throw "Unknown language: " + lang;
            }

            self.selectedLang = lang;

            // if the menu has been shown, update it as well
            if (self.menuItems) {
                updateMenu(self.menuItems[lang]);
            }

            if (self.active) {
                // clear error in the old language.
                done();

                // Don't immediately block the UI to check spelling in the new language, this is an API not a user action.
            }
        };

        // Internal functions
        function updateMenu(mi) {
            mi.setSelected(1);
            this.selectedItem.setSelected(0);
            this.selectedItem = mi;
        }

        function walk(n, f) {
            var d = ed.getDoc(),
                w;

            if (d.createTreeWalker) {
                w = d.createTreeWalker(n, NodeFilter.SHOW_TEXT, null, false);

                while ((n = w.nextNode()) != null) {
                    f.call(this, n);
                }
            } else {
                tinymce.walk(n, f, 'childNodes');
            }
        }

        function getSeparators() {
            var re = '',
                i, str = ed.getParam('spellchecker_word_separator_chars', '\\s!"#$%&()*+,-./:;<=>?@[\]^_{|}ß©´Æ±∂∑∏ªºΩæø◊˜§\u201d\u201c');

            // Build word separator regexp
            for (i = 0; i < str.length; i++) {
                re += '\\' + str.charAt(i);
            }

            return re;
        }

        function getWords() {
            var wl = [],
                tx = '',
                lo = {},
                rawWords = [];

            // Get area text
            walk(ed.getBody(), function (n) {
                if (n.nodeType == 3) {
                    tx += n.nodeValue + ' ';
                }
            });

            // split the text up into individual words
            if (ed.getParam('spellchecker_word_pattern')) {
                // look for words that match the pattern
                rawWords = tx.match('(' + ed.getParam('spellchecker_word_pattern') + ')', 'gi');
            } else {
                // Split words by separator
                tx = tx.replace(new RegExp('([0-9]|[' + getSeparators() + '])', 'g'), ' ');
                tx = tinymce.trim(tx.replace(/(\s+)/g, ' '));
                rawWords = tx.split(' ');
            }

            // Build word array and remove duplicates
            each(rawWords, function (v) {
                if (!lo[v]) {
                    wl.push(v);
                    lo[v] = 1;
                }
            });

            return wl;
        }

        function removeWords(w) {
            var dom = ed.dom,
                se = ed.selection,
                r = se.getRng(true);

            each(dom.select('span').reverse(), function (n) {
                if (n && (dom.hasClass(n, 'mce-item-hiddenspellword') || dom.hasClass(n, 'mce-item-hidden'))) {
                    if (!w || dom.decode(n.innerHTML) == w) {
                        dom.remove(n, 1);
                    }
                }
            });

            se.setRng(r);
        }

        function markWords(wl) {
            var dom = ed.dom,
                doc = ed.getDoc(),
                se = ed.selection,
                r = se.getRng(true),
                nl = [],
                w = wl.join('|'),
                re = getSeparators(),
                rx = new RegExp('(^|[' + re + '])(' + w + ')(?=[' + re + ']|$)', 'g');

            // Collect all text nodes
            walk(ed.getBody(), function (n) {
                if (n.nodeType == 3) {
                    nl.push(n);
                }
            });

            // Wrap incorrect words in spans
            each(nl, function (n) {
                var node, elem, txt, pos, v = n.nodeValue;
                rx.lastIndex = 0;
                if (rx.test(v)) {
                    // Encode the content
                    v = dom.encode(v);
                    // Create container element
                    elem = dom.create('span', {
                        'class': 'mce-item-hidden'
                    });

                    // Following code fixes IE issues by creating text nodes
                    // using DOM methods instead of innerHTML.
                    // Bug #3124: <PRE> elements content is broken after spellchecking.
                    // Bug #1408: Preceding whitespace characters are removed
                    // @TODO: I'm not sure that both are still issues on IE9.
                    if (tinymce.isIE) {
                        // Enclose mispelled words with temporal tag
                        v = v.replace(rx, '$1<mcespell>$2</mcespell>');
                        // Loop over the content finding mispelled words
                        while ((pos = v.indexOf('<mcespell>')) != -1) {
                            // Add text node for the content before the word
                            txt = v.substring(0, pos);
                            if (txt.length) {
                                node = doc.createTextNode(dom.decode(txt));
                                elem.appendChild(node);
                            }
                            v = v.substring(pos + 10);
                            pos = v.indexOf('</mcespell>');
                            txt = v.substring(0, pos);
                            v = v.substring(pos + 11);
                            // Add span element for the word
                            elem.appendChild(dom.create('span', {
                                'class': 'mce-item-hiddenspellword'
                            }, txt));
                        }
                        // Add text node for the rest of the content
                        if (v.length) {
                            node = doc.createTextNode(dom.decode(v));
                            elem.appendChild(node);
                        }
                    } else {
                        // Other browsers preserve whitespace characters on innerHTML usage
                        elem.innerHTML = v.replace(rx, '$1<span class="mce-item-hiddenspellword">$2</span>');
                    }

                    // Finally, replace the node with the container
                    dom.replace(elem, n);
                }
            });

            se.setRng(r);
        }

        function showMenu(ed, e) {
            var m = self.menu,
                p1, dom = ed.dom,
                vp = dom.getViewPort(ed.getWin()),
                wordSpan = e.target;

            e = 0; // Fixes IE memory leak

            if (!m) {
                m = ed.controlManager.createDropMenu('spellcheckermenu', { keyboard_focus: true });
                self.menu = m;
            }

            if (dom.hasClass(wordSpan, 'mce-item-hiddenspellword')) {
                m.removeAll();

                m.add({
                    title: 'spellchecker.wait',
                    'class': 'mceMenuItemTitle'
                }).setDisabled(1);

                sendRPC('getSuggestions', [self.selectedLang, dom.decode(wordSpan.innerHTML)], function (r) {
                    var ignoreRpc;

                    m.removeAll();

                    if (r.length > 0) {
                        m.add({
                            title: 'spellchecker.sug',
                            'class': 'mceMenuItemTitle'
                        }).setDisabled(1);

                        each(r, function (v) {
                            m.add({
                                title: v,
                                onclick: function () {
                                    dom.replace(ed.getDoc().createTextNode(v), wordSpan);
                                    checkDone();
                                }
                            });
                        });

                    } else {
                        m.add({
                            title: 'spellchecker.no_sug',
                            'class': 'mceMenuItemTitle'
                        }).setDisabled(1);
                    }

                    if (ed.getParam('show_ignore_words', true)) {
                        m.addSeparator();

                        ignoreRpc = ed.getParam("spellchecker_enable_ignore_rpc", '');
                        m.add({
                            title: 'spellchecker.ignore_word',
                            onclick: function () {
                                var word = wordSpan.innerHTML;

                                dom.remove(wordSpan, 1);
                                checkDone();

                                // tell the server if we need to
                                if (ignoreRpc) {
                                    ed.setProgressState(1);
                                    sendRPC('ignoreWord', [self.selectedLang, word], function (r) {
                                        ed.setProgressState(0);
                                    });
                                }
                            }
                        });

                        m.add({
                            title: 'spellchecker.ignore_words',
                            onclick: function () {
                                var word = wordSpan.innerHTML;

                                removeWords(dom.decode(word));
                                checkDone();

                                // tell the server if we need to
                                if (ignoreRpc) {
                                    ed.setProgressState(1);
                                    sendRPC('ignoreWords', [self.selectedLang, word], function (r) {
                                        ed.setProgressState(0);
                                    });
                                }
                            }
                        });
                    }

                    if (ed.getParam("spellchecker_enable_learn_rpc")) {
                        m.add({
                            title: 'spellchecker.learn_word',
                            onclick: function () {
                                var word = wordSpan.innerHTML;

                                dom.remove(wordSpan, 1);
                                checkDone();

                                ed.setProgressState(1);
                                sendRPC('learnWord', [self.selectedLang, word], function (r) {
                                    ed.setProgressState(0);
                                });
                            }
                        });
                    }

                    m.update();
                });

                p1 = DOM.getPos(ed.getContentAreaContainer());
                m.settings.offset_x = p1.x;
                m.settings.offset_y = p1.y;

                ed.selection.select(wordSpan);
                p1 = dom.getPos(wordSpan);
                m.showMenu(p1.x, p1.y + wordSpan.offsetHeight - vp.y);

                return tinymce.dom.Event.cancel(e);
            } else {
                m.hideMenu();
            }
        }

        function checkDone() {
            var dom = ed.dom,
                o;

            each(dom.select('span'), function (n) {
                if (n && dom.hasClass(n, 'mce-item-hiddenspellword')) {
                    o = true;
                    return false;
                }
            });

            if (!o) {
                done();
            }
        }

        function done() {
            var self = this,
                la = self.active;

            if (self.active) {
                removeWords();

                if (self.menu) {
                    self.menu.hideMenu();
                }

                if (la) {
                    ed.nodeChanged();
                }

                self.active = false;
            }
        }

        function sendRPC(m, p, cb) {
            var args = {
                id: uid(),
                method: m,
                params: p
            };

            tinymce.util.XHR.send({
                url: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.rpc&plugin=spellchecker&' + ed.settings.query,
                data: 'json=' + JSON.stringify(args),
                content_type: 'application/x-www-form-urlencoded',
                success: function (o) {
                    var c;

                    try {
                        c = JSON.parse(o);
                    } catch (e) {
                        c = {
                            error: 'JSON Parse error'
                        };
                    }

                    if (!c || c.error) {
                        ed.setProgressState(0);
                        var e = c.error || 'JSON Parse error';
                        ed.windowManager.alert(e.errstr || ('Error response: ' + e));
                    } else {
                        cb.call(self, c.result || '');
                    }
                },
                error: function (x) {
                    ed.setProgressState(0);
                    ed.windowManager.alert('Error response: ' + x);
                }
            });
        }
    });
})();