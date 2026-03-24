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
 * Backwards-compatibility shim for legacy code that references WFApplication.
 *
 * @deprecated  Use \Wfe\Application\Application via dependency injection instead.
 *              This class will be removed in a future major version.
 */
class WFApplication extends \Wfe\Application\Application
{
    /**
     * Returns the shared Application instance.
     *
     * @deprecated  Use dependency injection instead of getInstance().
     *
     * @return \Wfe\Application\Application
     */
    public static function getInstance($config = array())
    {
        trigger_error(
            'WFApplication::getInstance() is deprecated. Use dependency injection instead.',
            E_USER_DEPRECATED
        );

        return \Wfe\Factory::getApplication();
    }
}
