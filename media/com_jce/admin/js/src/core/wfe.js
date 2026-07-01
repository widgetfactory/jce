/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

import KeyValue from "./keyvalue";
import Repeatable from "./repeatable";

// Run init when the document is ready
document.addEventListener('DOMContentLoaded', () => {

  KeyValue.setup();
  Repeatable.setup();

  // remove loader
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.jce-ui').classList.remove('loading');
  });
  
});

export default {};