/* global Joomla */

import { parseUrl, isAdmin } from './utils.js';

export function getBasePath(elm) {
    // Joomla 3.5.x / 4.x Media Field
    const wrapper = elm.closest('.field-media-wrapper');
    let path = '';

    if (wrapper) {
        // Joomla 3
        if (wrapper.options) {
            path = wrapper.options.basepath || '';
        // Joomla 4+
        } else {
            path = wrapper.basePath || '';
        }
    }

    // get from input for some layout overrides
    path = path || elm.dataset.basepath || '';

    // resolve path for admin
    if (path && !isAdmin(path) && isAdmin(document.location.href)) {
        path += 'administrator/';
    }

    return path;
}

export function updateMediaUrl(row, options) {
    const elements = Array.from(row.querySelectorAll('.field-media-wrapper'));

    if (!elements.length) {
        elements.push(row);
    }

    elements.forEach(function (el) {
        const inp = el.querySelector('.field-media-input');

        if (!inp) {
            return;
        }

        if (inp.disabled) {
            return;
        }

        let id = inp.getAttribute('id');

        if (!id) {
            return;
        }

        // update field id with index
        if (id.indexOf('rowX') !== -1) {
            const rowIndex = row.parentNode ? Array.from(row.parentNode.children).indexOf(row) : 0;
            id = id.replace('rowX', 'row' + rowIndex);
            inp.setAttribute('id', id);
        }

        el.classList.add('wf-media-wrapper');

        // get url from data attribute or custom element attribute
        let dataUrl = el.dataset.url || el.getAttribute('url') || '';

        // legacy modal link btn
        const linkBtn = el.querySelector('a[href*="index.php?option=com_media"].modal.btn');

        if (linkBtn && !dataUrl) {
            dataUrl = linkBtn.getAttribute('href') || '';
        }

        // parse url parameters
        const params = parseUrl(dataUrl);

        // set mediatype default to "images"
        let mediatype = 'images';

        // set plugin (may contain caller), defaults to browser
        const plugin = params.plugin ? params.plugin : 'browser';

        // process a parameter
        if (params.mediatype) {
            mediatype = params.mediatype;
        // or layout override of url set to files
        } else if (params.view === 'files') {
            mediatype = 'files';
        }

        // get supported extensions from converted mediafield
        if (inp.classList.contains('wf-media-input-converted')) {
            let supportedExtensions = false;

            try {
                supportedExtensions = JSON.parse(el.getAttribute('supported-extensions') || '{}');
            } catch (e) {
                supportedExtensions = false;
            }

            if (supportedExtensions) {
                const extensions = [];

                Object.entries(supportedExtensions).forEach(function ([, values]) {
                    if (Array.isArray(values) && values.length) {
                        extensions.push(...values);
                    }
                });

                if (extensions.length) {
                    mediatype = extensions.join(',');
                }
            }
        }

        // create url
        let url = getBasePath(inp) + 'index.php?option=com_jce&task=plugin.display&plugin=' + plugin + '&fieldid=' + id + '&mediatype=' + mediatype;

        if (options.context) {
            params.context = options.context;
        }

        const invalidParams = ['option', 'task', 'plugin', 'fieldid', 'mediatype', 'element', 'view', 'tmpl'];

        invalidParams.forEach(function (key) {
            delete params[key];
        });

        const paramStr = new URLSearchParams(params).toString();

        if (paramStr) {
            url += '&' + paramStr;
        }

        // update data url attribute
        if (el.dataset.url) {
            el.dataset.url = url;
        }

        // update custom element
        if (el.matches('joomla-field-media, .wf-media-wrapper-custom')) {
            el.setAttribute('url', url);

            // create new iframe
            const ifrHtml = Joomla.sanitizeHtml('<iframe src="' + url + '" class="iframe" title="" width="100%" height="100%"></iframe>', { iframe: ['src', 'class', 'title', 'width', 'height'] });

            // update attributes
            const modal = el.querySelector('.joomla-modal');

            if (modal) {
                modal.setAttribute('data-url', url);
                modal.setAttribute('data-iframe', ifrHtml);
            }

            // remove width and height attributes (Helix Ultimate layout override)
            el.removeAttribute('modal-width');
            el.removeAttribute('modal-height');
        }

        // update link button
        if (linkBtn) {
            linkBtn.setAttribute('href', url);
        }
    });
}
