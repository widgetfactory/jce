export function parseUrl(url) {
    const data = {};

    if (!url) {
        return data;
    }

    url = url.substring(url.indexOf('?') + 1);

    url.replace(/\+/g, ' ').split('&').forEach(function (value) {
        const param = value.split('=');
        const key = decodeURIComponent(param[0]);

        if (param.length === 2) {
            const val = decodeURIComponent(param[1]);

            if (typeof val === 'string' && val.length) {
                data[key] = val;
            }
        }
    });

    return data;
}

export function mimeFromExt(url) {
    const ext = url.split('.').pop().toLowerCase();

    const map = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'apng': 'image/apng',
        'mp4': 'video/mp4',
        'm4v': 'video/x-m4v',
        'ogg': 'audio/ogg',
        'ogv': 'video/ogg',
        'webm': 'video/webm',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'pdf': 'application/pdf',
        'zip': 'application/zip',
        'tar': 'application/x-tar',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'dot': 'application/msword',
        'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pps': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'ppsx': 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
        'odt': 'application/vnd.oasis.opendocument.text',
        'odp': 'application/vnd.oasis.opendocument.presentation',
        'ods': 'application/vnd.oasis.opendocument.spreadsheet',
        'odg': 'application/vnd.oasis.opendocument.graphics'
    };

    return map[ext] || '';
}

export function isAdmin(value) {
    return value && value.indexOf('/administrator/') !== -1;
}

export function isActiveField(elm) {
    return elm.querySelector('.wf-media-input-active') !== null;
}

export function cleanInputValue(elm) {
    let val = elm.value || '';

    // clean value first
    if (val.indexOf('#joomlaImage') !== -1) {
        val = val.substring(0, val.indexOf('#'));
        elm.value = val;
        elm.setAttribute('value', val);
    }
}
