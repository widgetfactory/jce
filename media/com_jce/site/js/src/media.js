/* global Joomla */

import { isActiveField } from './media/utils.js';
import { updateMediaUrl } from './media/url.js';
import { initMediaField, disableCustomElementButtons } from './media/field.js';
import { initRepeatable } from './media/repeatable.js';

document.addEventListener('DOMContentLoaded', function () {
    const options = Joomla.getOptions('plg_system_jce', {});

    // process media input wrapper
    document.querySelectorAll('.wf-media-input').forEach(function (inp) {
        const wrapper = inp.closest('.field-media-wrapper, .fc-field-value-properties-box');

        if (wrapper) {
            wrapper.classList.add('wf-media-wrapper');
        }
    });

    // remove readonly attribute on active media inputs
    document.querySelectorAll('.wf-media-input-active').forEach(function (el) {
        el.removeAttribute('readonly');
    });

    // remove modal heading
    document.querySelectorAll('.wf-media-wrapper .modal-header h3').forEach(function (el) {
        el.innerHTML = '&nbsp;';
    });

    document.querySelectorAll('.wf-media-wrapper button.button-select').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
        });
    });

    // disable media input and prevent button click
    document.querySelectorAll('.wf-media-input').forEach(function (inp) {
        if (inp.classList.contains('wf-media-input-active')) {
            return;
        }

        inp.disabled = true;

        const parent = inp.parentElement;

        if (parent) {
            parent.querySelectorAll('button, a.btn').forEach(function (btn) {
                btn.disabled = true;
                btn.removeAttribute('onclick');
                btn.style.display = 'none';
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                });
            });
        }
    });

    // update existing repeatable
    document.querySelectorAll('.wf-media-input').forEach(function (inp) {
        const row = inp.closest('.subform-repeatable-group');

        if (!row) {
            return;
        }

        if (!isActiveField(row)) {
            const subform = row.closest('joomla-field-subform');

            if (subform) {
                subform.querySelectorAll('button').forEach(function (btn) {
                    btn.style.display = 'none';
                    btn.disabled = true;
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                    });
                });
            }
        }
    });

    // repeatable when created
    initRepeatable(options);

    // disable button actions (Joomla 4 and Joomla 5)
    document.querySelectorAll('joomla-field-media.wf-media-wrapper').forEach(function (el) {
        disableCustomElementButtons(el);
    });

    // joomla custom attribute and media field override
    document.querySelectorAll('joomla-field-media.wf-media-wrapper').forEach(function (field) {
        initMediaField(field);
        field.dispatchEvent(new CustomEvent('joomla-field-media:update'));
        updateMediaUrl(field, options);
    });

    // nasty fix for Joomla 5.1 media dialog
    document.addEventListener('joomla-dialog:open', function (e) {
        const target = e.target;

        if (target.classList.contains('joomla-dialog-media-field')) {
            const ifr = target.querySelector('iframe');

            if (ifr && ifr.src.indexOf('index.php?option=com_jce') !== -1) {
                target.classList.add('wf-media-dialog');
            }
        }
    });
});