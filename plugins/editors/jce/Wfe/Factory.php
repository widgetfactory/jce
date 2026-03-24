<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe;

\defined('_JEXEC') or die;

/**
 * Static service locator used exclusively by BC wrapper classes.
 *
 * Modern code must never call this class directly.  It exists solely
 * so that deprecated shims (WFApplication, WFEditorPlugin, etc.) can
 * return the container-managed instances to legacy third-party code.
 */
final class Factory
{
    /**
     * @var \Wfe\Application\Application|null
     */
    private static $application = null;

    /**
     * @var \Wfe\Editor\Plugin\AbstractPlugin|null
     */
    private static $editorPlugin = null;

    /**
     * Return the shared Application instance.
     *
     * @return \Wfe\Application\Application
     */
    public static function getApplication()
    {
        if (self::$application === null)
        {
            self::$application = new \Wfe\Application\Application();
        }

        return self::$application;
    }

    /**
     * Register the authoritative Application instance.
     * Called by the bootstrap code that creates the Application.
     *
     * @param  \Wfe\Application\Application  $application
     *
     * @return void
     */
    public static function setApplication(\Wfe\Application\Application $application)
    {
        self::$application = $application;
    }

    /**
     * Return the shared EditorPlugin instance.
     *
     * @return \Wfe\Editor\Plugin\AbstractPlugin|null
     */
    public static function getEditorPlugin()
    {
        return self::$editorPlugin;
    }

    /**
     * Register the authoritative EditorPlugin instance.
     * Called by AbstractPlugin at construction time.
     *
     * @param  \Wfe\Editor\Plugin\AbstractPlugin  $plugin
     *
     * @return void
     */
    public static function setEditorPlugin(\Wfe\Editor\Plugin\AbstractPlugin $plugin)
    {
        self::$editorPlugin = $plugin;
    }
}
