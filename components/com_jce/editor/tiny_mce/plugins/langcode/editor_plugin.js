/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2022 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var languageValues = [
        {
            'text': 'Abkhazian',
            'value': 'ab'
        },
        {
            'text': 'Afar',
            'value': 'aa'
        },
        {
            'text': 'Afrikaans',
            'value': 'af'
        },
        {
            'text': 'Albanian',
            'value': 'sq'
        },
        {
            'text': 'Amharic',
            'value': 'am'
        },
        {
            'text': 'Arabic',
            'value': 'ar'
        },
        {
            'text': 'Armenian',
            'value': 'hy'
        },
        {
            'text': 'Assamese',
            'value': 'as'
        },
        {
            'text': 'Aymara',
            'value': 'ay'
        },
        {
            'text': 'Azerbaijani',
            'value': 'az'
        },
        {
            'text': 'Bashkir',
            'value': 'ba'
        },
        {
            'text': 'Basque',
            'value': 'eu'
        },
        {
            'text': 'Bengali, Bangla',
            'value': 'bn'
        },
        {
            'text': 'Bhutani',
            'value': 'dz'
        },
        {
            'text': 'Bihari',
            'value': 'bh'
        },
        {
            'text': 'Bislama',
            'value': 'bi'
        },
        {
            'text': 'Breton',
            'value': 'br'
        },
        {
            'text': 'Bulgarian',
            'value': 'bg'
        },
        {
            'text': 'Burmese',
            'value': 'my'
        },
        {
            'text': 'Byelorussian',
            'value': 'be'
        },
        {
            'text': 'Cambodian',
            'value': 'km'
        },
        {
            'text': 'Catalan',
            'value': 'ca'
        },
        {
            'text': 'Chinese',
            'value': 'zh'
        },
        {
            'text': 'Corsican',
            'value': 'co'
        },
        {
            'text': 'Croatian',
            'value': 'hr'
        },
        {
            'text': 'Czech',
            'value': 'cs'
        },
        {
            'text': 'Danish',
            'value': 'da'
        },
        {
            'text': 'Dutch',
            'value': 'nl'
        },
        {
            'text': 'English ',
            'value': 'en'
        },
        {
            'text': 'Esperanto',
            'value': 'eo'
        },
        {
            'text': 'Estonian',
            'value': 'et'
        },
        {
            'text': 'Faeroese',
            'value': 'fo'
        },
        {
            'text': 'Fiji',
            'value': 'fj'
        },
        {
            'text': 'Finnish',
            'value': 'fi'
        },
        {
            'text': 'French',
            'value': 'fr'
        },
        {
            'text': 'Frisian',
            'value': 'fy'
        },
        {
            'text': 'Gaelic (Scots Gaelic)',
            'value': 'gd'
        },
        {
            'text': 'Galician',
            'value': 'gl'
        },
        {
            'text': 'Georgian',
            'value': 'ka'
        },
        {
            'text': 'German',
            'value': 'de'
        },
        {
            'text': 'Greek',
            'value': 'el'
        },
        {
            'text': 'Greenlandic',
            'value': 'kl'
        },
        {
            'text': 'Guarani',
            'value': 'gn'
        },
        {
            'text': 'Gujarati',
            'value': 'gu'
        },
        {
            'text': 'Hausa',
            'value': 'ha'
        },
        {
            'text': 'Hebrew',
            'value': 'iw'
        },
        {
            'text': 'Hindi',
            'value': 'hi'
        },
        {
            'text': 'Hungarian',
            'value': 'hu'
        },
        {
            'text': 'Icelandic',
            'value': 'is'
        },
        {
            'text': 'Indonesian',
            'value': 'in'
        },
        {
            'text': 'Interlingua',
            'value': 'ia'
        },
        {
            'text': 'Interlingue',
            'value': 'ie'
        },
        {
            'text': 'Inupiak',
            'value': 'ik'
        },
        {
            'text': 'Irish',
            'value': 'ga'
        },
        {
            'text': 'Italian',
            'value': 'it'
        },
        {
            'text': 'Japanese',
            'value': 'ja'
        },
        {
            'text': 'Javanese',
            'value': 'jw'
        },
        {
            'text': 'Kannada',
            'value': 'kn'
        },
        {
            'text': 'Kashmiri',
            'value': 'ks'
        },
        {
            'text': 'Kazakh',
            'value': 'kk'
        },
        {
            'text': 'Kinyarwanda',
            'value': 'rw'
        },
        {
            'text': 'Kirghiz',
            'value': 'ky'
        },
        {
            'text': 'Kirundi',
            'value': 'rn'
        },
        {
            'text': 'Korean',
            'value': 'ko'
        },
        {
            'text': 'Kurdish',
            'value': 'ku'
        },
        {
            'text': 'Laothian',
            'value': 'lo'
        },
        {
            'text': 'Latin',
            'value': 'la'
        },
        {
            'text': 'Latvian, Lettish',
            'value': 'lv'
        },
        {
            'text': 'Lingala',
            'value': 'ln'
        },
        {
            'text': 'Lithuanian',
            'value': 'lt'
        },
        {
            'text': 'Macedonian',
            'value': 'mk'
        },
        {
            'text': 'Malagasy',
            'value': 'mg'
        },
        {
            'text': 'Malay',
            'value': 'ms'
        },
        {
            'text': 'Malayalam',
            'value': 'ml'
        },
        {
            'text': 'Maltese',
            'value': 'mt'
        },
        {
            'text': 'Maori',
            'value': 'mi'
        },
        {
            'text': 'Marathi',
            'value': 'mr'
        },
        {
            'text': 'Moldavian',
            'value': 'mo'
        },
        {
            'text': 'Mongolian',
            'value': 'mn'
        },
        {
            'text': 'Nauru',
            'value': 'na'
        },
        {
            'text': 'Nepali',
            'value': 'ne'
        },
        {
            'text': 'Norwegian',
            'value': 'no'
        },
        {
            'text': 'Occitan',
            'value': 'oc'
        },
        {
            'text': 'Oriya',
            'value': 'or'
        },
        {
            'text': 'Oromo, Afan',
            'value': 'om'
        },
        {
            'text': 'Pashto, Pushto',
            'value': 'ps'
        },
        {
            'text': 'Persian',
            'value': 'fa'
        },
        {
            'text': 'Polish',
            'value': 'pl'
        },
        {
            'text': 'Portuguese',
            'value': 'pt'
        },
        {
            'text': 'Punjabi',
            'value': 'pa'
        },
        {
            'text': 'Quechua',
            'value': 'qu'
        },
        {
            'text': 'Rhaeto-Romance',
            'value': 'rm'
        },
        {
            'text': 'Romanian',
            'value': 'ro'
        },
        {
            'text': 'Russian',
            'value': 'ru'
        },
        {
            'text': 'Samoan',
            'value': 'sm'
        },
        {
            'text': 'Sangro',
            'value': 'sg'
        },
        {
            'text': 'Sanskrit',
            'value': 'sa'
        },
        {
            'text': 'Serbian',
            'value': 'sr'
        },
        {
            'text': 'Serbo-Croatian',
            'value': 'sh'
        },
        {
            'text': 'Sesotho',
            'value': 'st'
        },
        {
            'text': 'Setswana',
            'value': 'tn'
        },
        {
            'text': 'Shona',
            'value': 'sn'
        },
        {
            'text': 'Sindhi',
            'value': 'sd'
        },
        {
            'text': 'Singhalese',
            'value': 'si'
        },
        {
            'text': 'Siswati',
            'value': 'ss'
        },
        {
            'text': 'Slovak',
            'value': 'sk'
        },
        {
            'text': 'Slovenian',
            'value': 'sl'
        },
        {
            'text': 'Somali',
            'value': 'so'
        },
        {
            'text': 'Spanish',
            'value': 'es'
        },
        {
            'text': 'Sudanese',
            'value': 'su'
        },
        {
            'text': 'Swahili',
            'value': 'sw'
        },
        {
            'text': 'Swedish',
            'value': 'sv'
        },
        {
            'text': 'Tagalog',
            'value': 'tl'
        },
        {
            'text': 'Tajik',
            'value': 'tg'
        },
        {
            'text': 'Tamil',
            'value': 'ta'
        },
        {
            'text': 'Tatar',
            'value': 'tt'
        },
        {
            'text': 'Tegulu',
            'value': 'te'
        },
        {
            'text': 'Thai',
            'value': 'th'
        },
        {
            'text': 'Tibetan',
            'value': 'bo'
        },
        {
            'text': 'Tigrinya',
            'value': 'ti'
        },
        {
            'text': 'Tonga',
            'value': 'to'
        },
        {
            'text': 'Tsonga',
            'value': 'ts'
        },
        {
            'text': 'Turkish',
            'value': 'tr'
        },
        {
            'text': 'Turkmen',
            'value': 'tk'
        },
        {
            'text': 'Twi',
            'value': 'tw'
        },
        {
            'text': 'Ukrainian',
            'value': 'uk'
        },
        {
            'text': 'Urdu',
            'value': 'ur'
        },
        {
            'text': 'Uzbek',
            'value': 'uz'
        },
        {
            'text': 'Vietnamese',
            'value': 'vi'
        },
        {
            'text': 'Volapuk',
            'value': 'vo'
        },
        {
            'text': 'Welsh',
            'value': 'cy'
        },
        {
            'text': 'Wolof',
            'value': 'wo'
        },
        {
            'text': 'Xhosa',
            'value': 'xh'
        },
        {
            'text': 'Yiddish',
            'value': 'ji'
        },
        {
            'text': 'Yoruba',
            'value': 'yo'
        },
        {
            'text': 'Zulu',
            'value': 'zu'
        }
    ];

    tinymce.create('tinymce.plugins.LanguageCodePlugin', {
        init: function (ed, url) {
            this.editor = ed;
            this.url = url;

            ed.onPreInit.add(function () {
                ed.formatter.register({
                    langcode: {
                        inline: 'span',
                        remove: 'all',
                        attributes: {
                            'lang': '%value'
                        }
                    }
                });
            });

            function isRootNode(ed, node) {
                return node == ed.getBody() || tinymce.util.isFakeRoot(node);
            }

            ed.addButton('langcode', {
                title: 'langcode.desc',
                onclick: function () {
                    var cm = ed.controlManager;

                    var form = cm.createForm('language_form');

                    var langList = cm.createListBox('language_lang', {
                        label: ed.getLang('langcode.label', 'Language'),
                        onselect: function (v) { },
                        name: 'language',
                        filter: true
                    });

                    langList.add('--', '');

                    tinymce.each(languageValues, function (item) {
                        langList.add(item.text, item.value);
                    });

                    form.add(langList);

                    ed.windowManager.open({
                        title: ed.getLang('langcode.title', 'Language Code'),
                        items: [form],
                        size: 'mce-modal-landscape-small',
                        open: function () {
                            var node = ed.selection.getNode(), value = ed.settings.language;

                            if (node.hasAttribute('lang')) {
                                value = node.getAttribute('lang');
                            }

                            langList.value(value);
                        },
                        buttons: [{
                            title: ed.getLang('common.cancel', 'Cancel'),
                            id: 'cancel'
                        },
                        {
                            title: ed.getLang('common.insert', 'Insert'),
                            id: 'insert',
                            onsubmit: function (e) {
                                var node = ed.selection.getNode(), selection = ed.selection;
                                var data = form.submit();

                                var isTextSelection = !selection.isCollapsed() && selection.getContent() == selection.getContent({ format: 'text' });

                                // is a body or text selection
                                if (isRootNode(ed, node) || isTextSelection) {
                                    
                                    if (!data.language) {
                                        ed.formatter.remove('langcode');
                                    } else {
                                        ed.formatter.apply('langcode', { value: data.language });
                                    }
  
                                // element selection
                                } else {
                                    ed.dom.setAttrib(node, 'lang', data.language);
                                }

                                tinymce.dom.Event.cancel(e);
                            },
                            classes: 'primary',
                            autofocus: true
                        }
                        ]
                    });
                }
            });
        }
    });

    // Register plugin
    tinymce.PluginManager.add('langcode', tinymce.plugins.LanguageCodePlugin);
})();