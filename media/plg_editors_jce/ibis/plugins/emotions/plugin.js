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
    var DOM = ibis.DOM,
        each = ibis.each;

    // https://en.wikipedia.org/wiki/Emoticons_(Unicode_block)    
    var emoji = [
        { "😀": "grinning_face" },
        { "😁": "grinning_face_with_smiling_eyes" },
        { "😂": "face_with_tears_of_joy" },
        { "😃": "smiling_face_with_open_mouth" },
        { "😄": "smiling_face_with_open_mouth_and_smiling_eyes" },
        { "😅": "smiling_face_with_open_mouth_and_cold_sweat" },
        { "😆": "smiling_face_with_open_mouth_and_tightly_closed_eyes" },
        { "😇": "smiling_face_with_halo" },
        { "😈": "smiling_face_with_horns" },
        { "😉": "winking_face" },
        { "😊": "smiling_face_with_smiling_eyes" },
        { "😋": "face_savouring_delicious_food" },
        { "😌": "relieved_face" },
        { "😍": "smiling_face_with_heart_shaped_eyes" },
        { "😎": "smiling_face_with_sunglasses" },
        { "😏": "smirking_face" },
        { "😐": "neutral_face" },
        { "😑": "expressionless_face" },
        { "😒": "unamused_face" },
        { "😓": "face_with_cold_sweat" },
        { "😔": "pensive_face" },
        { "😕": "confused_face" },
        { "😖": "confounded_face" },
        { "😗": "kissing_face" },
        { "😘": "face_throwing_a_kiss" },
        { "😙": "kissing_face_with_smiling_eyes" },
        { "😚": "kissing_face_with_closed_eyes" },
        { "😛": "face_with_stuck_out_tongue" },
        { "😜": "face_with_stuck_out_tongue_and_winking_eye" },
        { "😝": "face_with_stuck_out_tongue_and_tightly_closed_eyes" },
        { "😞": "disappointed_face" },
        { "😟": "worried_face" },
        { "😠": "angry_face" },
        { "😡": "pouting_face" },
        { "😢": "crying_face" },
        { "😣": "persevering_face" },
        { "😤": "face_with_look_of_triumph" },
        { "😥": "disappointed_but_relieved_face" },
        { "😦": "frowning_face_with_open_mouth" },
        { "😧": "anguished_face" },
        { "😨": "fearful_face" },
        { "😩": "weary_face" },
        { "😪": "sleepy_face" },
        { "😫": "tired_face" },
        { "😬": "grimacing_face" },
        { "😭": "loudly_crying_face" },
        { "😮": "face_with_open_mouth" },
        { "😯": "hushed_face" },
        { "😰": "face_with_open_mouth_and_cold_sweat" },
        { "😱": "face_screaming_in_fear" },
        { "😲": "astonished_face" },
        { "😳": "flushed_face" },
        { "😴": "sleeping_face" },
        { "😵": "dizzy_face" },
        { "😶": "face_without_mouth" },
        { "😷": "face_with_medical_mask" },
        { "😸": "grinning_cat_face_with_smiling_eyes" },
        { "😹": "cat_face_with_tears_of_joy" },
        { "😺": "smiling_cat_face_with_open_mouth" },
        { "😻": "smiling_cat_face_with_heart_shaped_eyes" },
        { "😼": "cat_face_with_wry_smile" },
        { "😽": "kissing_cat_face_with_closed_eyes" },
        { "😾": "pouting_cat_face" },
        { "😿": "crying_cat_face" },
        { "🙀": "weary_cat_face" },
        { "🙁": "slightly_frowning_face" },
        { "🙂": "slightly_smiling_face" },
        { "🙃": "upside_down_face" },
        { "🙄": "face_with_rolling_eyes" },
        { "🙅": "face_with_no_good_gesture" },
        { "🙆": "face_with_ok_gesture" },
        { "🙇": "person_bowing_deeply" },
        { "🙈": "see_no_evil_monkey" },
        { "🙉": "hear_no_evil_monkey" },
        { "🙊": "speak_no_evil_monkey" },
        { "🙋": "happy_person_raising_one_hand" },
        { "🙌": "person_raising_both_hands_in_celebration" },
        { "🙍": "person_frowning" },
        { "🙎": "person_with_pouting_face" },
        { "🙏": "person_with_folded_hands" }
    ];

    ibis.PluginManager.add("emotions", function (ed, url) {
        var self = this;

        ed.addButton("emotions", {
            title: "emotions.desc",
            cmd: "mceEmotion"
        });

        self.content = "";

        function createEmojiContent(icons, path) {
            var content = document.createElement('div');

            // make absolute if required
            if (path && path.indexOf('://') === -1) {
                path = ed.documentBaseURI.toAbsolute(path, true);
            }

            each(icons, function (data) {
                if (typeof data === "string") {
                    var label = "",
                        src = data,
                        item = {};

                    if (path) {
                        src = path + '/' + src;
                    }

                    // remove extension
                    if (/\.(png|jpg|jpeg|gif)$/i.test(data)) {
                        label = data.replace(/\.[^.]+$/i, '');
                        data = '<img src="' + src + '" alt="' + ed.getLang('emotions.' + label, label) + '" />';
                    }

                    item[data] = label;
                    data = item;
                }

                each(data, function (label, key) {
                    // is it an image?
                    if (/\.(png|jpg|jpeg|gif)$/i.test(key)) {
                        var src = key;

                        if (path) {
                            src = path + '/' + src;
                        }

                        src = ed.documentBaseURI.toAbsolute(src, true);

                        key = '<img src="' + src + '" alt="' + ed.getLang('emotions.' + label, label) + '" />';
                    }

                    DOM.add(content, 'button', {
                        "class": "mce_emotions_icon",
                        "title": ed.getLang('emotions.' + label, label)
                    }, key);
                });
            });

            return content.innerHTML;
        }

        var path = ed.getParam('emotions_url', url + '/img');
        var icons = ed.getParam('emotions_smilies', emoji, 'hash');

        // create conten using default set
        this.content = createEmojiContent(icons, path);

        // set loaded flag to prevent duplicate xhr request
        this.loaded = false;

        // get emoji from json or text file
        if (path && /\.(json|txt)$/.test(path) && !this.loaded) {

            // resolve to local url if relative
            if (path.indexOf('://') === -1) {
                path = ed.documentBaseURI.toAbsolute(path, true);
            }

            this.loaded = true;

            ibis.util.XHR.send({
                url: path,
                success: function (text) {
                    try {
                        icons = JSON.parse(text);
                    } catch (e) {
                        // json error
                    }

                    // create path
                    path = path.substring(0, path.lastIndexOf('/'));

                    self.content = createEmojiContent(icons, path);
                }
            });
        }

        this.createControl = function (n, cm) {
            var self = this;

            if (n !== 'emotions') {
                return null;
            }

            function insertEmoticon(n) {
                var p = DOM.getParent(n, '.mce_emotions_icon');

                if (p) {
                    var html = p.innerText;

                    // convert img src to relative and get as innerHTML
                    if (n.nodeName === "IMG") {
                        n.setAttribute('src', ed.documentBaseURI.toRelative(n.src));
                        html = p.innerHTML;
                    }

                    ed.execCommand('mceInsertContent', false, html);
                }
            }

            var ctrl = cm.createSplitButton('emotions', {
                title: 'emotions.desc',
                onselect: function (elm) {
                    insertEmoticon(elm);
                }
            });

            ctrl.onRenderMenu.add(function (c, m) {
                var item = m.add({
                    onclick: function (e) {
                        e.preventDefault();

                        // remove selected state
                        item.setSelected(false);

                        insertEmoticon(e.target);
                        m.hideMenu();
                    },
                    html: '<div id="' + ed.id + '_emotions_panel" class="mceEmoticonsMenu"></div>'
                });

                m.onShowMenu.add(function () {
                    DOM.setHTML(ed.id + '_emotions_panel', self.content);
                });
            });

            // Remove the menu element when the editor is removed
            ed.onRemove.add(function () {
                ctrl.destroy();
            });

            return ctrl;
        };
    });
})();