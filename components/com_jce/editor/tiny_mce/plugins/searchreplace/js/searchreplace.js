/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
//tinyMCEPopup.requireLangPack();

var SearchReplaceDialog = {
    settings: {},
    init: function () {
        var ed = tinyMCEPopup.editor;

        Wf.init();

        ed.updateSearchButtonStates.add(function(o) {
            $.each(o, function(k, v) {
                $('#' + k).prop('disabled', !!v);    
            });
        });

        $('#find').button({
            icons: {
                primary: 'uk-icon-search'
            },
            classes: 'uk-button-primary'
        }).click(function (e) {
            e.preventDefault();

            ed.execCommand('mceSearch', false, {
                "case"      : $('#matchcase').is(':checked'),
                "text"      : $('#search_string').val(),
                "wholeword" : $('#wholewords').is(':checked')
            });
        });

        $('#next').button({
            icons: {
                primary: 'uk-icon-arrow-right'
            },
            classes: 'uk-button-primary'
        }).click(function (e) {
            e.preventDefault();

            ed.execCommand('mceSearchNext', false);
        });

        $('#prev').button({
            icons: {
                primary: 'uk-icon-arrow-left'
            },
            classes: 'uk-button-primary'
        }).click(function (e) {
            e.preventDefault();

            ed.execCommand('mceSearchPrev', false);
        });

        $('#replace').button({
            icons: {
                primary: 'uk-icon-reply'
            },
            classes: 'uk-button-danger'
        }).click(function (e) {
            e.preventDefault();

            var value = $('#replace_string').val();
            ed.execCommand('mceReplace', false, value);
        });

        $('#replaceAll').button({
            icons: {
                primary: 'uk-icon-refresh'
            },
            classes: 'uk-button-danger'
        }).click(function (e) {
            e.preventDefault();

            var value = $('#replace_string').val();
            ed.execCommand('mceReplaceAll', false, value);
        });

        $('#cancel').click(function(e) {
            e.preventDefault();
            tinyMCEPopup.close();
        });

        ed.windowManager.onClose.add(function() {
            ed.execCommand('mceSearchDone', false);
        });

        $('#search_string').val(tinyMCEPopup.getWindowArg("search_string"));

        // Focus input field
        $('#search_string').focus();
    }
};
tinyMCEPopup.onInit.add(SearchReplaceDialog.init, SearchReplaceDialog);