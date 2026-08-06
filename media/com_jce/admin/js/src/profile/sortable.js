const noop = function () { };

const findImmediateParent = (childNode, parentNode) => {
    let currentParent = childNode.parentNode;

    while (currentParent !== parentNode && currentParent !== null) {
        currentParent = currentParent.parentNode;
    }

    return currentParent === parentNode ? currentParent : null;
};

const getSortableParentElement = (node, nodeList) => {
    return Array.from(nodeList).find((element) => findImmediateParent(node, element));
};

function getDirectChildofContainer(container, target) {
    var elm = target;

    while (elm && elm.parentNode !== container) {
        elm = elm.parentNode;
    }

    return (elm && elm.parentNode === container) ? elm : null;
}

const getContainers = (selector) => {
    let containers = [];

    if (typeof selector === 'string') {
        // If the selector is a CSS selector string, use document.querySelectorAll to get the elements
        containers = Array.from(document.querySelectorAll(selector));
    } else if (selector instanceof Element) {
        // If the selector is a single element, convert it to an array
        containers = [selector];
    } else if (Array.isArray(selector)) {
        // If the selector is already an array of elements, use it as is
        containers = selector;
    }

    // Ensure that all elements in the "containers" array are unique by converting it to a Set and back to an array
    containers = Array.from(new Set(containers));

    return containers;
};

const Sortable = (selector, options) => {

    options = {
        filter: '*',
        ignore: false,
        handle: false,
        direction: 'both',
        placeholder: '',
        init: noop,
        start: noop,
        stop: noop,
        ...options
    };

    let placeholder = null;
    let dragElement = null;

    const getSortableElements = (parent) => {
        return Array.from(parent.children).filter((item) => item.matches(options.filter));
    };

    const removeDraggable = () => {
        getContainers(selector).forEach(parent => {
            getSortableElements(parent).forEach(item => {
                item.removeAttribute('draggable');
            });
        });
    };

    const removePlaceholder = () => {
        if (placeholder) {
            placeholder.remove();
        }

        placeholder = null;
    };

    // Add event listeners to each parent container
    getContainers(selector).forEach(container => {

        container.addEventListener('mousedown', (evt) => {
            var e = {
                event: evt,
                state: true
            };

            options.init(e);

            // allow sorting to be cancelled
            if (!e.state) {
                return;
            }

            // elm is the direct descendant of the container that was clicked
            let elm = getDirectChildofContainer(container, evt.target);

            if (!elm) {
                return;
            }

            // ignore mousedown on an invalid element
            if (options.ignore && elm.matches(options.ignore)) {
                return;
            }

            // restrict to handle
            if (options.handle) {
                if (!elm.closest(options.handle)) {
                    return;
                }

                elm = getSortableParentElement(elm, container.children);
            }

            // invalid target
            if (options.filter) {
                elm = elm.closest(options.filter);

                if (!elm) {
                    return;
                }
            }

            if (elm.parentNode == container) {

                // prevent bubbling if there are more than one sortable elements
                evt.stopPropagation();

                // all listeners below are bound to this signal so they can be removed in one step
                const controller = new AbortController();
                const signal = controller.signal;

                let dragStarted = false;

                // clean up if the mouse is released without a drag starting
                document.addEventListener('mouseup', () => {
                    if (!dragStarted) {
                        removeDraggable();
                        controller.abort();
                    }
                }, { signal });

                // Create a new Set and add the container element
                const containerSet = new Set([container]);

                if (options.connect) {
                    // Add the nodeList elements to the Set
                    Array.from(document.querySelectorAll(options.connect)).forEach((element) => containerSet.add(element));
                }

                // get unique array from set
                const containers = Array.from(containerSet);

                // set all related items draggable
                getContainers(selector).forEach(parent => {
                    Array.from(parent.children).filter((item) => item.matches(options.filter)).forEach(item => {
                        item.draggable = true;
                    });
                });

                elm.addEventListener('dragstart', (evt) => {
                    dragStarted = true;

                    evt.dataTransfer.effectAllowed = 'move';

                    // Create a placeholder div with the same width and height as the dragged element
                    placeholder = document.createElement('div');

                    if (options.placeholder) {
                        placeholder.classList.add(options.placeholder);
                    }

                    placeholder.style.width = `${elm.offsetWidth}px`;
                    placeholder.style.height = `${elm.offsetHeight}px`;

                    dragElement = elm;

                    setTimeout(function () {
                        dragElement.hidden = true;
                        elm.before(placeholder);
                    }, 1);

                    options.start({ event: evt, element: elm, placeholder: placeholder });
                }, { once: true, signal });

                containers.forEach(item => {
                    item.addEventListener('dragover', (evt) => {
                        evt.preventDefault();

                        // ignore placeholder
                        if (evt.target === placeholder || (options.placeholder && evt.target.matches(`.${options.placeholder}`))) {
                            return;
                        }

                        if (placeholder) {
                            if (item.querySelectorAll('[draggable]').length === 0) {
                                // If no targets, append the placeholder to the end of the container
                                item.appendChild(placeholder);
                            } else {
                                // find the nearest draggable element
                                const target = evt.target.closest('[draggable]');

                                if (!target) {
                                    return;
                                }

                                // Get the mouse Y position relative to the target element
                                const mouseY = evt.clientY - target.getBoundingClientRect().top;
                                const midY = target.offsetHeight / 2;

                                // Determine whether to move the dragged element above or below, or to the left or right of the target element
                                if (options.direction === 'both' || (options.direction === 'vertical' && Math.abs(mouseY - midY) < midY / 2)) {
                                    if (mouseY < midY) {
                                        target.before(placeholder);
                                    } else {
                                        target.after(placeholder);
                                    }
                                }

                                // For 'both' direction, also check horizontal direction
                                if (options.direction === 'both') {
                                    const mouseX = evt.clientX - target.getBoundingClientRect().left;
                                    const midX = target.offsetWidth / 2;

                                    if (Math.abs(mouseX - midX) < midX / 2) {
                                        if (mouseX < midX) {
                                            target.before(placeholder);
                                        } else {
                                            target.after(placeholder);
                                        }
                                    }
                                }
                            }
                        }
                    }, { signal });

                    item.addEventListener('drop', (evt) => {
                        evt.preventDefault();
                        const target = evt.target;
                        evt.dataTransfer.dropEffect = 'move';

                        // Move the dragged element to the final position
                        if (placeholder && placeholder.parentNode === item) {
                            // Move the dragged element to the final position
                            if (dragElement && target !== dragElement) {
                                placeholder.replaceWith(dragElement);
                                placeholder = null;
                            }

                            // trigger stop event
                            options.stop({ element: dragElement });
                        }

                        removePlaceholder();
                        removeDraggable();

                        // note: cleanup is left to "dragend", which always fires after "drop"
                    }, { once: true, signal });

                    item.addEventListener('dragend', (evt) => {
                        if (dragElement) {
                            dragElement.hidden = false;
                        }

                        removePlaceholder();
                        removeDraggable();

                        controller.abort();
                    }, { once: true, signal });
                });
            }
        });
    });
};

export default Sortable;