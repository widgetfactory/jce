<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Compat;

\defined('_JEXEC') or die;

/**
 * Backwards-compatibility shim for legacy media manager adapters that extend WFMediaManager.
 *
 * @deprecated  Legacy filesystem adapters should call getConfig() directly.
 *              This class will be removed in a future major version.
 */
class WFMediaManager extends \Wfe\Editor\Plugin\Manager\AbstractManager
{
}