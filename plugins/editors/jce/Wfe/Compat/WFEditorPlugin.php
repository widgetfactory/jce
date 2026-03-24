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
 * Backwards-compatibility shim for legacy code that references WFEditorPlugin.
 *
 * @deprecated  Use \Wfe\Editor\Plugin\AbstractPlugin via dependency injection instead.
 *              This class will be removed in a future major version.
 */
class WFEditorPlugin extends \Wfe\Editor\Plugin\AbstractPlugin
{
    /**
     * Returns the shared EditorPlugin instance.
     *
     * @deprecated  Use dependency injection instead of getInstance().
     *
     * @return \Wfe\Editor\Plugin\AbstractPlugin
     */
    public static function getInstance($config = array())
    {
        trigger_error(
            'WFEditorPlugin::getInstance() is deprecated. Use dependency injection instead.',
            E_USER_DEPRECATED
        );

        return \Wfe\Factory::getEditorPlugin();
    }
}
