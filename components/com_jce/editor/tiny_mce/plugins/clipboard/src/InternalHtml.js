var internalMimeType = 'x-tinymce/html';
var internalMark = '<!-- ' + internalMimeType + ' -->';

var mark = function (html) {
  return internalMark + html;
};

var unmark = function (html) {
  return html.replace(internalMark, '');
};

var isMarked = function (html) {
  return html.indexOf(internalMark) !== -1;
};

var internalHtmlMime = function () {
  return internalMimeType;
};

export {
  mark,
  unmark,
  isMarked,
  internalHtmlMime
};