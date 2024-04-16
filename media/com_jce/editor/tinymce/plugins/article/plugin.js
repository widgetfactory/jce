/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var DOM = tinymce.DOM,
        each = tinymce.each,
        VK = tinymce.VK,
        BACKSPACE = VK.BACKSPACE,
        DELETE = VK.DELETE;

    tinymce.create('tinymce.plugins.ArticlePlugin', {
        init: function (ed, url) {
            var self = this;

            self.editor = ed;
            self.url = url;

            function isReadMore(n) {
                return ed.dom.is(n, 'hr.mce-item-readmore');
            }

            function isPageBreak(n) {
                return ed.dom.is(n, 'hr.mce-item-pagebreak');
            }

            // Register commands
            ed.addCommand('mceReadMore', function () {
                if (ed.dom.get('system-readmore')) {
                    alert(ed.getLang('article.readmore_alert', 'There is already a Read More break inserted in this article. Only one such break is permitted. Use a Pagebreak to split the page up further.'));
                    return false;
                }
                self._insertBreak('readmore', {
                    id: 'system-readmore'
                });
            });
            ed.addCommand('mcePageBreak', function (ui, v) {
                var n = ed.selection.getNode();

                if (isPageBreak(n)) {
                    self._updatePageBreak(n, v);
                } else {
                    self._insertBreak('pagebreak', v);
                }
            });

            // Register buttons
            if (ed.getParam('article_show_readmore', true)) {
                ed.addButton('readmore', {
                    title: 'article.readmore',
                    cmd: 'mceReadMore'
                });
            }

            /*ed.onBeforeRenderUI.add(function() {
                var DOM = tinymce.DOM;

               if (ed.getParam('article_hide_xtd_btns', true)) {
                    tinymce.each(DOM.select('div.readmore, div.pagebreak', 'editor-xtd-buttons'), function(n) {
                        DOM.hide(n.parentNode);
                    });
                }
            });*/

            ed.onInit.add(function () {
                // Display "a#name" instead of "img" in element path
                if (ed.theme && ed.theme.onResolveName) {
                    ed.theme.onResolveName.add(function (theme, o) {
                        var n = o.node,
                            v;

                        if (n && n.nodeName === 'HR' && /mce-item-pagebreak/.test(n.className)) {
                            v = 'pagebreak';
                        }

                        if (n && n.nodeName === 'HR' && /mce-item-readmore/.test(n.className)) {
                            v = 'readmore';
                        }

                        if (v) {
                            o.name = v;
                        }
                    });
                }

            });

            ed.onNodeChange.add(function (ed, cm, n) {
                cm.setActive('readmore', isReadMore(n));
                cm.setActive('pagebreak', isPageBreak(n));

                ed.dom.removeClass(ed.dom.select('hr.mce-item-pagebreak.mce-item-selected, hr.mce-item-readmore.mce-item-selected'), 'mce-item-selected');

                if (isPageBreak(n) || isReadMore(n)) {
                    ed.dom.addClass(n, 'mce-item-selected');
                }
            });

            function _cancelResize() {
                each(ed.dom.select('hr.mce-item-pagebreak, hr.mce-item-readmore'), function (n) {
                    n.onresizestart = function () {
                        return false;
                    };

                    n.onbeforeeditfocus = function () {
                        return false;
                    };
                });
            }

            ed.onBeforeSetContent.add(function (ed, o) {
                o.content = o.content.replace(/<hr(.*?) alt="([^"]+)"([^>]*?)>/gi, '<hr$1 data-alt="$2"$3>');
            });

            ed.onPostProcess.add(function (ed, o) {
                if (o.get) {
                    o.content = o.content.replace(/<hr(.*?)data-alt="([^"]+)"([^>]*?)>/gi, '<hr$1alt="$2"$3>');
                }
            });

            ed.onSetContent.add(function () {
                if (tinymce.isIE) {
                    _cancelResize();
                }
            });

            ed.onGetContent.add(function () {
                if (tinymce.isIE) {
                    _cancelResize();
                }
            });

            ed.onKeyDown.add(function (ed, e) {
                if (e.keyCode == BACKSPACE || e.keyCode == DELETE) {
                    var s = ed.selection,
                        n = s.getNode();

                    if (ed.dom.is(n, 'hr.mce-item-pagebreak, hr.mce-item-readmore')) {
                        ed.dom.remove(n);

                        e.preventDefault();
                    }
                }
            });

            ed.onPreInit.add(function () {
                ed.selection.onBeforeSetContent.addToTop(function (ed, o) {
                    o.content = o.content.replace(/<hr(.*?) alt="([^"]+)"([^>]*?)>/gi, '<hr$1 data-alt="$2"$3>');
                });

                ed.parser.addNodeFilter('hr', function (nodes) {
                    for (var i = 0; i < nodes.length; i++) {
                        var node = nodes[i],
                            id = node.attr('id') || '',
                            cls = node.attr('class') || '';

                        if (id == 'system-readmore' || /(mce-item|system)-pagebreak/.test(cls)) {
                            var cls = /(mce-item|system)-pagebreak/.test(cls) ? 'mce-item-pagebreak' : 'mce-item-readmore';

                            node.attr('class', cls);

                            if (node.attr('alt')) {
                                node.attr('data-alt', node.attr('alt'));
                                node.attr('alt', null);
                            }
                        }
                    }
                });

                ed.serializer.addNodeFilter('hr', function (nodes, name, args) {
                    for (var i = 0; i < nodes.length; i++) {
                        var node = nodes[i], cls = node.attr('class') || '';

                        if (/mce-item-(pagebreak|readmore)/.test(cls)) {
                            if (/mce-item-pagebreak/.test(node.attr('class'))) {
                                node.attr('class', 'system-pagebreak');
                            } else {
                                node.attr('class', null);
                                node.attr('id', 'system-readmore');
                            }

                            if (node.attr('data-alt')) {
                                node.attr('alt', node.attr('data-alt'));
                                node.attr('data-alt', null);
                            }
                        }
                    }
                });

            });

            if (ed.getParam('article_show_pagebreak', true)) {

                ed.addButton('pagebreak', {
                    title: 'article.pagebreak',
                    onclick: function () {

                        var html = '' +
                            '<div class="mceFormRow">' +
                            '   <label for="' + ed.id + 'article_title">' + ed.getLang('article.title', 'Title') + '</label>' +
                            '   <div class="mceFormControl">' +
                            '       <input type="text" id="' + ed.id + '_article_title" autofocus />' +
                            '   </div>' +
                            '</div>' +
                            '<div class="mceFormRow">' +
                            '   <label for="' + ed.id + '_article_alt">' + ed.getLang('article.alias', 'Alias') + '</label>' +
                            '   <div class="mceFormControl">' +
                            '       <input type="text" id="' + ed.id + '_article_alt" />' +
                            '   </div>' +
                            '</div>';

                        ed.windowManager.open({
                            title: ed.getLang('article.pagebreak', 'PageBreak'),
                            content: html,
                            size: 'mce-modal-landscape-small',
                            open: function () {
                                var label = ed.getLang('insert', 'Insert');

                                var title = DOM.get(ed.id + '_article_title');
                                var alt = DOM.get(ed.id + '_article_alt');

                                var o = self._getPageBreak();

                                if (o) {
                                    label = ed.getLang('update', 'Update');

                                    title.value = o.title || '';
                                    alt.value = o.alt || '';
                                }

                                // update label
                                DOM.setHTML(this.id + '_insert', label);

                                window.setTimeout(function () {
                                    title.focus();
                                }, 10);
                            },
                            buttons: [
                                {
                                    title: ed.getLang('cancel', 'Cancel'),
                                    id: 'cancel'
                                },
                                {
                                    title: ed.getLang('insert', 'Insert'),
                                    id: 'insert',
                                    onsubmit: function (e) {
                                        var title = DOM.getValue(ed.id + '_article_title');
                                        var alt = DOM.getValue(ed.id + '_article_alt');

                                        ed.execCommand('mcePageBreak', false, {
                                            title: title,
                                            alt: alt
                                        });
                                    },
                                    classes: 'primary'
                                }
                            ]
                        });
                    }
                });
            }
        },

        _getPageBreak: function () {
            var ed = this.editor,
                n = ed.selection.getNode(),
                o;

            if (ed.dom.is(n, 'hr.mce-item-pagebreak')) {
                o = {
                    title: ed.dom.getAttrib(n, 'title', ''),
                    alt: ed.dom.getAttrib(n, 'data-alt', '')
                };
            }

            return o;
        },

        _updatePageBreak: function (n, v) {
            var ed = this.editor;

            tinymce.extend(v, {
                'data-alt': v.alt || ''
            });

            v.alt = null;

            ed.dom.setAttribs(n, v);
        },

        _insertBreak: function (s, args) {
            var ed = this.editor,
                dom = ed.dom,
                n = ed.selection.getNode(),
                ns, h,
                hr, p;

            var blocks = 'H1,H2,H3,H4,H5,H6,P,DIV,ADDRESS,PRE,FORM,TABLE,OL,UL,CAPTION,BLOCKQUOTE,CENTER,DL,DIR,FIELDSET,NOSCRIPT,NOFRAMES,MENU,ISINDEX,SAMP,SECTION,ARTICLE,HGROUP,ASIDE,FIGURE';

            n = dom.getParent(n, blocks, 'BODY') || n;

            tinymce.extend(args, {
                'class': s == 'pagebreak' ? 'mce-item-pagebreak' : 'mce-item-readmore',
                'data-alt': args.alt || null
            });

            // remove alt
            args.alt = null;

            // set id for readmore
            if (s == 'readmore') {
                args.id = 'system-readmore';
            }

            ed.execCommand('mceInsertContent', false, '<span id="mce_hr_marker" data-mce-type="bookmark">\uFEFF</span>', {
                skip_undo: 1
            });

            var marker = dom.get('mce_hr_marker');
            var hr = dom.create('hr', args);

            if (dom.isBlock(n)) {
                // get the img parent
                p = dom.getParent(marker, blocks, 'BODY');

                // split paragraphs / divs
                if (p.nodeName == 'P' || p.nodeName == 'DIV') {

                    // if a column...
                    if (p.className.indexOf('wf-column') !== -1) {
                        var col = dom.getParent(n, '.wf-columns');
                        dom.insertAfter(marker, col);
                    } else {
                        // split
                        dom.split(p, marker);

                        ns = marker.nextSibling;

                        if (ns && ns.nodeName == p.nodeName) {
                            if (/^(\s|&nbsp;|\u00a00)*?$/.test(h) || h == '<br>') {
                                dom.remove(ns);
                            }
                        }
                    }
                } else {
                    // If in block
                    if (p) {
                        if (p.parentNode.nodeName == 'BODY') {
                            dom.insertAfter(marker, p);
                        } else {
                            p.parentNode.insertBefore(marker, p);
                        }
                    } else {
                        if (n.parentNode.nodeName == 'BODY') {
                            dom.insertAfter(marker, n);
                        } else {
                            n.parentNode.insertBefore(marker, n);
                        }
                    }
                    p = marker.parentNode;

                    while (/^(H[1-6]|ADDRESS|PRE|FORM|TABLE|OL|UL|CAPTION|BLOCKQUOTE|CENTER|DL|DIR|FIELDSET|NOSCRIPT|NOFRAMES|MENU|ISINDEX|SAMP)$/.test(p.nodeName)) {
                        p.parentNode.insertBefore(marker, p);
                        p = marker.parentNode;
                    }
                }

                ns = marker.nextSibling;

                if (!ns) {
                    var el = ed.getParam('forced_root_block') || 'br';
                    ns = ed.dom.create(el);

                    if (el != 'br') {
                        ns.innerHTML = '\u00a0';
                    }
                    ed.dom.insertAfter(ns, marker);
                    s = ed.selection.select(ns);
                    ed.selection.collapse(1);
                }
            }

            ed.dom.replace(hr, marker);
            ed.undoManager.add();
        }

        /*createControl: function (n, cm) {
            var self = this,
                ed = this.editor;

            if (n !== 'pagebreak') {
                return null;
            }

            if (ed.getParam('article_show_pagebreak', true)) {

                var title, alt;

                var html = '' +
                    '<h4>' + ed.getLang('article.pagebreak', 'Insert / Edit Pagebreak') + '</h4>' +
                    '<div class="mcePanelRow">' +
                    '   <label for="' + ed.id + 'article_title">' + ed.getLang('article.title', 'Title') + '</label>' +
                    '   <input type="text" id="' + ed.id + '_article_title" />' +
                    '</div>' +
                    '<div class="mcePanelRow">' +
                    '   <label for="' + ed.id + '_article_alt">' + ed.getLang('article.alias', 'Alias') + '</label>' +
                    '   <input type="text" id="' + ed.id + '_article_alt" />' +
                    '</div>';

                var ctrl = cm.createPanelButton('pagebreak', {
                    title: 'article.pagebreak',
                    html: html,
                    width: 250,
                    buttons: [{
                        title: ed.getLang('common.insert', 'Insert'),
                        id: 'insert',
                        onclick: function (e) {
                            ed.execCommand('mcePageBreak', false, {
                                title: title.value,
                                alt: alt.value
                            });

                            return true;
                        },
                        classes: 'mceButtonPrimary',
                        scope: self
                    }]
                });

                ctrl.onShowPanel.add(function () {
                    title = DOM.get(ed.id + '_article_title'),
                        alt = DOM.get(ed.id + '_article_alt');

                    title.value = alt.value = '';
                    var label = ed.getLang('common.insert', 'Insert');

                    var o = self._getPageBreak(),
                        active = false;

                    if (o) {
                        title.value = o.title || '';
                        alt.value = o.alt || '';
                        label = ed.getLang('common.update', 'Update');

                        active = true;
                    }

                    ctrl.setActive(active);

                    // update label
                    ctrl.panel.setButtonLabel('insert', label);

                    window.setTimeout(function () {
                        title.focus();
                    }, 10);
                });

                ctrl.onHidePanel.add(function () {
                    if (title && alt) {
                        title.value = alt.value = '';
                    }
                });

                // Remove the menu element when the editor is removed
                ed.onRemove.add(function () {
                    ctrl.destroy();
                });

                return ctrl;
            }
        }*/
    });
    // Register plugin
    tinymce.PluginManager.add('article', tinymce.plugins.ArticlePlugin);
})();