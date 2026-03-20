import { isActiveField } from './utils.js';
import { updateMediaUrl } from './url.js';
import { disableCustomElementButtons } from './field.js';

export function initRepeatable(options) {
    document.addEventListener('subform-row-add', function (evt) {
        const row = evt.detail && evt.detail.row;

        if (!row) {
            return;
        }

        if (!row.querySelector('.wf-media-input')) {
            return;
        }

        if (isActiveField(row)) {
            row.querySelectorAll('.wf-media-input').forEach(function (inp) {
                const mediaField = inp.closest('joomla-field-media');

                if (mediaField) {
                    mediaField.classList.add('wf-media-wrapper');
                }

                if (inp.classList.contains('wf-media-input-active')) {
                    inp.removeAttribute('readonly');
                }
            });

            // update joomla-field-media elements
            row.querySelectorAll('joomla-field-media.wf-media-wrapper').forEach(function (el) {
                el.dispatchEvent(new CustomEvent('joomla-field-media:update'));
            });

            updateMediaUrl(row, options);
        } else {
            row.querySelectorAll('.wf-media-input').forEach(function (inp) {
                inp.disabled = true;

                const mediaField = inp.closest('joomla-field-media');

                if (mediaField) {
                    mediaField.classList.add('wf-media-wrapper');
                }
            });

            row.querySelectorAll('joomla-field-media').forEach(function (el) {
                el.querySelectorAll('button').forEach(function (btn) {
                    btn.style.display = 'none';
                    btn.disabled = true;
                });

                disableCustomElementButtons(el);
            });

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
}
