const dragHelper = function (element, options) {
  let downButton, overlay, start, stop, drag, startX, startY;

  options = options || {
    start: function () { },
    drag: function () { },
    stop: function () { }
  };

  start = (e) => {
    const dw = document.documentElement.clientWidth;
    const dh = document.documentElement.clientHeight;

    e.preventDefault();
    downButton = e.button;
    startX = e.screenX;
    startY = e.screenY;

    const html = `<div style="position: absolute; top: 0; left: 0; width: ${dw}px; height: ${dh}px; z-index: 2147483647; opacity: 0.0001;"></div>`;
    document.body.insertAdjacentHTML('beforeend', html);

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

    overlay.remove();

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

  dragHelper(resizeHandle, {
    'start': (e) => {
      startSize = {
        width: document.querySelector('.editor-layout .mce-wren').offsetWidth,
        height: document.querySelector('.mce-edit-area').offsetHeight
      };
    },
    'drag': (o, e) => {
      let width = startSize.width + e.deltaX;
      let height = startSize.height + e.deltaY;

      if (width !== null) {
        width = Math.max(100, width);
        width = Math.min(0xFFFF, width);

        document.querySelector('.editor-layout .mce-wren').style.width = `${width}px`;
        document.querySelector('.widthMarker').style.width = `${width}px`;
        document.querySelector('#jform_config_editor_width').value = width;
        document.querySelector('.widthMarker span').innerHTML = `${width}px`;
      }

      if (height !== null) {
        height = Math.max(100, height);
        height = Math.min(0xFFFF, height);

        document.querySelector('.editor-layout .mce-edit-area').style.height = `${height}px`;
        document.querySelector('#jform_config_editor_height').value = height;
      }
    }
  });
};

export default {
  setup
};
