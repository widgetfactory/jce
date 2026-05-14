// core Joomla Tinymce, bail due to conflict
if (typeof tinymce !== 'undefined' && tinymce.Annotator) {
    const msg = "Another extension or plugin has initialized the Joomla Tinymce Editor on this page. JCE cannot be loaded on the same page as the core Joomla Tinymce Editor.";
    alert(msg);
    throw new Error(msg);
}

if (!window.ibis) {
    const msg = "The Ibis Editor is not available.";
    alert(msg);
    throw new Error(msg);
}