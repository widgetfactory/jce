/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 */

export function openDialog(editor, DOM) {
    var html = '' +
        '<div class="mceForm">' +
        '<div class="mceModalRow">' +
        '   <label for="' + editor.id + '_search_string">' + editor.getLang('searchreplace.findwhat', 'Search') + '</label>' +
        '   <div class="mceModalControl">' +
        '       <input type="text" id="' + editor.id + '_search_string" />' +
        '   </div>' +
        '   <div class="mceModalControl mceModalFlexNone">' +
        '       <button class="mceButton" id="' + editor.id + '_search_prev" title="' + editor.getLang('searchreplace.prev', 'Previous') + '" disabled><i class="mceIcon mce_arrow-up"></i></button>' +
        '       <button class="mceButton" id="' + editor.id + '_search_next" title="' + editor.getLang('searchreplace.next', 'Next') + '" disabled><i class="mceIcon mce_arrow-down"></i></button>' +
        '       <span id="' + editor.id + '_search_count" class="mceSearchCount mceText"></span>' +
        '   </div>' +
        '</div>' +
        '<div class="mceModalRow">' +
        '   <label for="' + editor.id + '_replace_string">' + editor.getLang('searchreplace.replacewith', 'Replace') + '</label>' +
        '   <div class="mceModalControl">' +
        '       <input type="text" id="' + editor.id + '_replace_string" />' +
        '   </div>' +
        '</div>' +
        '<div class="mceModalRow">' +
        '   <div class="mceModalControl">' +
        '       <input id="' + editor.id + '_matchcase" type="checkbox" />' +
        '       <label for="' + editor.id + '_matchcase">' + editor.getLang('searchreplace.mcase', 'Match Case') + '</label>' +
        '   </div>' +
        '   <div class="mceModalControl">' +
        '       <input id="' + editor.id + '_wholewords" type="checkbox" />' +
        '       <label for="' + editor.id + '_wholewords">' + editor.getLang('searchreplace.wholewords', 'Whole Words') + '</label>' +
        '   </div>' +
        '</div>' +
        '<div class="mceModalRow">' +
        '   <div class="mceModalControl">' +
        '       <input id="' + editor.id + '_startattop" type="radio" name="' + editor.id + '_startpos" value="top" checked />' +
        '       <label for="' + editor.id + '_startattop">' + editor.getLang('searchreplace.startattop', 'Start at Top') + '</label>' +
        '   </div>' +
        '   <div class="mceModalControl">' +
        '       <input id="' + editor.id + '_startatcursor" type="radio" name="' + editor.id + '_startpos" value="cursor" />' +
        '       <label for="' + editor.id + '_startatcursor">' + editor.getLang('searchreplace.startatcursor', 'Start at Cursor') + '</label>' +
        '   </div>' +
        '</div>' +
        '</div>';

    editor.windowManager.open({
        title: editor.getLang('searchreplace.search_desc', 'Search and Replace'),
        content: html,
        size: 'mce-modal-landscape-medium',
        overlay: false,
        open: function () {
            var id = this.id;

            var search = DOM.get(editor.id + '_search_string');

            search.value = editor.selection.getContent({
                format: 'text'
            });

            DOM.bind(editor.id + '_search_next', 'click', function (e) {
                e.preventDefault();
                editor.execCommand('mceSearchNext', false);
            });

            DOM.bind(editor.id + '_search_prev', 'click', function (e) {
                e.preventDefault();
                editor.execCommand('mceSearchPrev', false);
            });

            window.setTimeout(function () {
                search.focus();
            }, 10);

            editor.updateSearchButtonStates.add(function (obj) {
                ibis.each(obj, function (val, key) {
                    var elm = DOM.get(editor.id + '_search_' + key) || DOM.get(id + '_search_' + key);

                    if (!elm) {
                        return;
                    }

                    if (key === 'count') {
                        elm.textContent = val;
                    } else {
                        elm.disabled = !!val;
                    }
                });
            });
        },
        close: function () {
            DOM.unbind(editor.id + '_search_next', 'click');
            DOM.unbind(editor.id + '_search_prev', 'click');

            editor.execCommand('mceSearchDone', false);
        },
        buttons: [
            {
                title: editor.getLang('searchreplace.find', 'Find'),
                id: 'find',
                onclick: function (e) {
                    e.preventDefault();

                    var matchcase = DOM.get(editor.id + '_matchcase');
                    var wholeword = DOM.get(editor.id + '_wholewords');
                    var startatcursor = DOM.get(editor.id + '_startatcursor');
                    var text = DOM.getValue(editor.id + '_search_string');

                    editor.execCommand('mceSearch', false, {
                        "textcase": !!matchcase.checked,
                        "text": text,
                        "wholeword": !!wholeword.checked,
                        "startatcursor": !!startatcursor.checked
                    });
                },
                classes: 'primary'
            }, {
                title: editor.getLang('searchreplace.replace', 'Replace'),
                id: 'search_replace',
                onclick: function (e) {
                    e.preventDefault();

                    var value = DOM.getValue(editor.id + '_replace_string');
                    editor.execCommand('mceReplace', false, value);
                }
            }, {
                title: editor.getLang('searchreplace.replaceall', 'Replace All'),
                id: 'search_replaceall',
                onclick: function (e) {
                    e.preventDefault();

                    var value = DOM.getValue(editor.id + '_replace_string');
                    editor.execCommand('mceReplaceAll', false, value);
                }
            }
        ]
    });
}
