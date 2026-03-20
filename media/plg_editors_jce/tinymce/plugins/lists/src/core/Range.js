/**
 * Range.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */
import NodeType from './NodeType.js';

var RangeUtils = tinymce.dom.RangeUtils;

var getNormalizedEndPoint = function (container, offset) {
  var node = RangeUtils.getNode(container, offset);

  if (NodeType.isListItemNode(container) && NodeType.isTextNode(node)) {
    var textNodeOffset = offset >= container.childNodes.length ? node.data.length : 0;
    return { container: node, offset: textNodeOffset };
  }

  return { container: container, offset: offset };
};

var normalizeRange = function (rng) {
  var outRng = rng.cloneRange();

  var rangeStart = getNormalizedEndPoint(rng.startContainer, rng.startOffset);
  outRng.setStart(rangeStart.container, rangeStart.offset);

  var rangeEnd = getNormalizedEndPoint(rng.endContainer, rng.endOffset);
  outRng.setEnd(rangeEnd.container, rangeEnd.offset);

  return outRng;
};

export default {
  getNormalizedEndPoint: getNormalizedEndPoint,
  normalizeRange: normalizeRange
};
