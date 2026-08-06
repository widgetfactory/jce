const noop = function () { };

const dragHelper = function (element, options) {
  let downButton, overlay, start, stop, drag, startX, startY;

  options = {
    start: noop,
    drag: noop,
    stop: noop,
    ...options
  };

  start = (e) => {
    const dw = document.documentElement.clientWidth;
    const dh = document.documentElement.clientHeight;

    e.preventDefault();
    downButton = e.button;
    startX = e.screenX;
    startY = e.screenY;

    // transparent overlay to keep the pointer events away from the document while dragging
    overlay = document.createElement('div');
    overlay.setAttribute('style', `position: absolute; top: 0; left: 0; width: ${dw}px; height: ${dh}px; z-index: 2147483647; opacity: 0.0001;`);

    document.body.appendChild(overlay);

    // Bind mouse events
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stop);

    // Begin drag
    options.start(e);
  };

  drag = (e) => {
    if (e.button !== downButton) {
      return stop(e);
    }

    e.deltaX = e.screenX - startX;
    e.deltaY = e.screenY - startY;

    e.preventDefault();

    options.drag(e);

    element.dispatchEvent(new CustomEvent('drag:drag', { detail: e }));
  };

  stop = (e) => {
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stop);

    if (overlay) {
      overlay.remove();
      overlay = null;
    }

    options.stop(e);
  };

  element.addEventListener('mousedown', start);
};

let startSize = {
  width: null,
  height: null
};

const setup = () => {
  // Drag Helper
  const resizeHandle = document.querySelector('.mce-resizehandle');

  if (!resizeHandle) {
    return;
  }

  const wren = document.querySelector('.editor-layout .mce-wren');
  const editArea = document.querySelector('.editor-layout .mce-edit-area');
  const widthMarker = document.querySelector('.widthMarker');
  const widthMarkerSpan = document.querySelector('.widthMarker span');
  const widthInput = document.querySelector('#jform_config_editor_width');
  const heightInput = document.querySelector('#jform_config_editor_height');

  if (!wren || !editArea) {
    return;
  }

  dragHelper(resizeHandle, {
    'start': () => {
      startSize = {
        width: wren.offsetWidth,
        height: editArea.offsetHeight
      };
    },
    'drag': (e) => {
      let width = startSize.width + e.deltaX;
      let height = startSize.height + e.deltaY;

      width = Math.min(0xFFFF, Math.max(100, width));
      height = Math.min(0xFFFF, Math.max(100, height));

      wren.style.width = `${width}px`;

      if (widthMarker) {
        widthMarker.style.width = `${width}px`;
      }

      if (widthMarkerSpan) {
        widthMarkerSpan.textContent = `${width}px`;
      }

      if (widthInput) {
        widthInput.value = width;
      }

      editArea.style.height = `${height}px`;

      if (heightInput) {
        heightInput.value = height;
      }
    },
    'stop': () => {
      // mark the fields as changed so they are submitted
      [widthInput, heightInput].forEach((input) => {
        if (input) {
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }
  });
};

export default {
  setup
};
