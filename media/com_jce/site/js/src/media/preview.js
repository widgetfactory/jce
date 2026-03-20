import { mimeFromExt } from './utils.js';

export function createPreview(field, url, mimeType) {
    if (!field || !field.previewElement) {
        return;
    }

    // remove existing preview
    field.previewElement.innerHTML = '';

    // get the type of the file, checking "text" types again against the file extension
    if (!mimeType || mimeType.indexOf('text/') === 0) {
        mimeType = mimeFromExt(url);
    }

    // create new element
    let el;

    if (mimeType && mimeType.indexOf('image/') === 0) {
        el = document.createElement('img');
        el.src = url;
        el.alt = 'Preview';
    } else if (mimeType && mimeType.indexOf('video/') === 0) {
        el = document.createElement('video');
        el.preload = 'metadata';
        el.controls = true;
        el.src = url;
        el.type = mimeType;
    } else if (mimeType && mimeType.indexOf('audio/') === 0) {
        el = document.createElement('audio');
        el.preload = 'none';
        el.controls = true;
        el.src = url;
        el.type = mimeType;
    } else {
        el = document.createElement('object');
        el.data = url;
        el.type = mimeType || 'application/octet-stream';
    }

    field.previewElement.appendChild(el);
}
