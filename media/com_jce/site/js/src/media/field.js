import { mimeFromExt, cleanInputValue } from './utils.js';
import { createPreview } from './preview.js';

export function disableCustomElementButtons(elm) {
    if (elm.button && elm.button.hasAttribute('disabled')) {
        elm.button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }, true);
    }

    if (elm.buttonClearEl && elm.buttonClearEl.hasAttribute('disabled')) {
        elm.buttonClearEl.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }, true);
    }
}

export function initMediaField(field) {
    field.addEventListener('joomla-field-media:update', function () {
        if (!field.inputElement) {
            return;
        }

        // clean value before processing
        cleanInputValue(field.inputElement);

        // copy markValid function or noop
        const markValidFunction = field.markValid || function () {};

        // override markValid and treat as a callback to clean the input value
        field.markValid = function () {
            cleanInputValue(this.inputElement);

            // markValid (check for label)
            if (field.querySelector('label[for="' + this.inputElement.id + '"]')) {
                markValidFunction.apply(this);
            }
        };

        let url = field.basePath + field.inputElement.value;

        // prevent validation and update of field value
        field.inputElement.addEventListener('change', function (e) {
            // ignore programmatically dispatched events to avoid recursion
            if (!e.isTrusted) {
                return;
            }

            e.stopImmediatePropagation();

            cleanInputValue(this);

            // markValid (check for label)
            if (field.querySelector('label[for="' + this.id + '"]')) {
                markValidFunction.apply(this);
            }

            // update the url with the updated value
            url = field.basePath + this.value;

            fetch(url, { method: 'HEAD' })
                .then(function (res) {
                    if (!res.ok) {
                        return;
                    }

                    // Content-Type is CORS-safelisted, usually accessible without expose-headers
                    const contentType = (res.headers.get('Content-Type') || '').split(';')[0].trim();

                    if (contentType) {
                        field.mimeType = contentType;
                    } else {
                        field.mimeType = mimeFromExt(url);
                    }
                })
                // eslint-disable-next-line dot-notation
                .catch(function () {
                    field.mimeType = mimeFromExt(url);
                })
                // eslint-disable-next-line dot-notation
                .finally(function () {
                    createPreview(field, url, field.mimeType);
                });

            // trigger update for t4 builder
            document.dispatchEvent(new CustomEvent('t4:media-selected', { detail: { selectedUrl: field.basePath + this.value } }));

            // external change event
            this.dispatchEvent(new Event('change'));
        }, true);

        if (field.inputElement.value) {
            // build the previewElement
            createPreview(field, url, field.mimeType);
        }
    });
}
