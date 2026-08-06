/**
 * @package    JCE
 * @copyright    Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license    GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

import Layout from './layout.js';
import BlockFormats from './blockformats.js';
import Fonts from './fonts.js';
import Filetypes from './filetype.js';
import StyleFormats from './styleformat.js';
import Drag from './drag.js';

function htmlspecialchars_decode(str) {
    var reverseEntities = {
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '&',
        '&quot;': '"',
        '&apos;': "'"
    };
    return str.replace(/&(#)?([\w]+);/g, function (all, numeric, value) {
        if (numeric) {
            return String.fromCharCode(value);
        }

        return reverseEntities[all];
    });
}

// fire when everything is loaded
window.addEventListener('load', function () {

    /*document.querySelectorAll('.com_jce_select_custom').forEach((elm) => {
        const id = elm.id;
        const selector = `#${id}_chzn`;

        function tagHandler(evt, element) {
            const highlighted = document.querySelector(`${selector} li.active-result.highlighted:first-child`);

            if (evt.which === 13 && highlighted.textContent !== '') {
                const customOptionValue = highlighted.textContent;

                const customOption = [...document.querySelectorAll(`${selector} option`)].find((option) => {
                    return element.value == option.textContent;
                });

                if (customOption) {
                    customOption.remove();
                }

                const newCustomOption = [...document.querySelectorAll(`${selector} option`)].find((option) => {
                    return element.innerHTML == option.textContent;
                });

                if (newCustomOption) {
                    newCustomOption.selected = true;
                }
            } else {
                const customOption = [...elm.querySelectorAll('option')].find((option) => {
                    return element.innerHTML == option.textContent;
                });

                if (customOption && customOption.textContent !== '') {
                    customOption.selected = true;
                } else {
                    const option = document.createElement('option');
                    option.text = element.value;
                    option.value = element.value;
                    option.selected = true;
                    elm.appendChild(option);
                }
            }

            element.value = '';

            const event = new CustomEvent('liszt:updated');
            elm.dispatchEvent(event);
        }

        const input = document.querySelector(`${selector} input`);

        input.addEventListener('keypress', function (event) {
            if (event.charCode === 44) {
                if (this.value && this.value.length >= 3) {
                    tagHandler(event, this);
                }

                event.preventDefault();
            }
        });

        input.addEventListener('keyup', function (event) {
            if (event.which === 13) {
                if (this.value && this.value.length >= 3) {
                    tagHandler(event, this);
                }

                event.preventDefault();
            }
        });
    });*/
});

const dataToggle = (event) => {
    const { target } = event;
    const group = target.closest('.control-group');

    if (!group) {
        return;
    }

    const key = target.getAttribute('data-toggle');
    const value = target.value;

    const parent = group.parentNode;

    // only process inputs the element directly owns, not those belonging to a nested toggle
    const setDisabled = (element, state) => {
        element.querySelectorAll('input,select,textarea').forEach((input) => {
            if (input.closest('[data-toggle-target]') === element) {
                input.disabled = state;
            }
        });
    };

    // hide all targets belonging to this toggle
    parent.querySelectorAll(`[data-toggle-target^="${key}-"]`).forEach((element) => {
        element.hidden = true;

        setDisabled(element, true);
    });

    target.dispatchEvent(new Event('toggle:hidden'));

    if (!value) {
        return;
    }

    const item = parent.querySelector(`[data-toggle-target="${key}-${value}"]`);

    if (!item) {
        return;
    }

    item.hidden = false;

    setDisabled(item, false);

    // re-apply nested toggles so their own state determines what is enabled
    item.querySelectorAll('select[data-toggle]').forEach((select) => {
        dataToggle({ target: select });
    });

    target.dispatchEvent(new Event('toggle:visible'));
};

function init() {
    let isInit = true;

    // setup various controls
    BlockFormats.setup();
    Fonts.setup();
    Filetypes.setup();
    StyleFormats.setup();

    // Layout
    Layout.createLayout();

    // editor resize handle
    Drag.setup();

    // init toggle
    document.querySelectorAll('select[data-toggle]').forEach((select) => {
        dataToggle({ target: select });
    });

    // global change event listener
    const form = document.querySelector('.jce-ui > form');

    if (form) {
        form.addEventListener('change', function (e) {
            // Skip on init
            if (isInit) {
                return;
            }
    
            // data-toggle
            if (e.target.matches('select[data-toggle]')) {
                dataToggle(e);
            }
    
            // only process submittable form elements
            if (!e.target.matches('input[name],select[name],textarea[name]')) {
                return;
            }
    
            const elm = e.target;
    
            // Skip name values that are not submittable
            if (elm.name.indexOf('jform[config]') === -1) {
                return;
            }
    
            // trigget Layout events
            Layout.triggerChange(e);
    
            // Add class to this element and any that share its name, e.g., param[]
            Array.from(this.elements).filter((el) => el.name === elm.name).forEach((element) => {
                element.classList.add('isdirty');
            });
    
            // Add "isdirty" class to each input on change
            elm.classList.add('isdirty');
        });

        Layout.init(form);
    }

    // Additional Features
    document.querySelectorAll('.editor-features input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener('click', () => {
            Layout.setPlugins();
        });
    });

    // Reset input[type="number"] if < 1
    document.querySelectorAll('input[type="number"]').forEach((input) => {
        input.addEventListener('change', () => {
            if (input.value < 1) {
                input.value = '';
            }
        });
    });

    // Fix encoding of some characters in text fields
    document.querySelectorAll('input[data-decode]').forEach((input) => {
        const value = input.value;

        if (value) {
            input.value = htmlspecialchars_decode(value);
        }
    });

    // Secondary tabs within profile content
    document.querySelectorAll('.nav-tabs li').forEach((tab) => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();

            const index = Array.from(tab.parentNode.children).indexOf(tab);
            const container = tab.closest('.tabbable');

            Array.from(tab.parentNode.children).forEach((child) => {
                child.classList.remove('active', 'show', 'hide');
            });

            tab.classList.add('active', 'show');

            const tabPanes = container.querySelectorAll('.tab-content .tab-pane');

            tabPanes.forEach((pane) => {
                pane.classList.remove('active', 'show', 'hide');
            });

            tabPanes[index].classList.add('active', 'show');
        });
    });

    document.querySelector('.jce-ui').classList.remove('loading');

    isInit = false;
}

document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => requestAnimationFrame(init));
});

export default {};