<?php

/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2023-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Controller;

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Controller\BaseController;
use Joomla\CMS\Session\Session;
use Joomla\Event\Event;
use Joomla\Filesystem\Path;

/**
 * Releases Main Controller
 *
 * @since  1.5
 */
class PluginController extends BaseController
{
    private const ALLOWED_TASKS = ['display', 'xhr', 'loadlanguages', 'pack'];

    private function mapPluginName($name)
    {
        $map = array(
            'image' => 'imgmanager',
            'imagepro' => 'imgmanager_ext',
        );

        if (isset($map[$name])) {
            return $map[$name];
        }

        return $name;
    }

    /**
     * Generate a legacy class name for non-namespaced plugins.
     *
     * Converts plugin names like "editor_link" or "editor-link"
     * into class names like "WFEditorLinkPlugin", following the old convention.
     *
     * @param string $name The plugin name (e.g., "editor_link", "editor-link").
     * @return string The generated class name (e.g., "WFEditorLinkPlugin").
     */
    private function createLegacyClassName($name)
    {
        // Replace dashes and underscores with spaces to prepare for ucwords()
        $name = str_replace(['-', '_'], ' ', $name);

        // Convert each word to StudlyCase (PascalCase)
        $name = ucwords($name);

        // Remove spaces and prepend/append class prefix and suffix
        return 'WF' . str_replace(' ', '', $name) . 'Plugin';
    }

    /**
     * Loads a PHP file and instantiates the first class it defines within the given namespace.
     *
     * @param object $info An object with:
     *                     - $info->path (string): Absolute file path to the plugin class.
     *                     - $info->namespace (string): Expected class namespace prefix (must end with \\).
     *
     * @return object|null An instance of the class, or null if not found.
     */
    /**
     * Check that a plugin file is a php file inside a directory plugins live in.
     *
     * @param   string  $filepath  The resolved plugin file path
     *
     * @return  boolean
     */
    private function isPluginPath($filepath)
    {
        // normalise separators without resolving symlinks
        $filepath = Path::clean($filepath);

        if (strpos($filepath, '..') !== false || !is_file($filepath)) {
            return false;
        }

        if (strtolower(pathinfo($filepath, PATHINFO_EXTENSION)) !== 'php') {
            return false;
        }

        $roots = [JPATH_PLUGINS, WF_EDITOR_PLUGINS];

        // only defined when the pro plugin is installed
        if (\defined('WF_EDITOR_PRO_PLUGINS')) {
            $roots[] = WF_EDITOR_PRO_PLUGINS;
        }

        $realpath = realpath($filepath);

        foreach ($roots as $root) {
            if (strpos($filepath, Path::clean($root . '/')) === 0) {
                return true;
            }

            $realroot = realpath($root);

            // Path::find resolves symlinks in the path it returns
            if ($realroot && $realpath && strpos($realpath, Path::clean($realroot . '/')) === 0) {
                return true;
            }
        }

        return false;
    }

    protected function loadPluginClass($info, $plugin = null)
    {
        if (!isset($info->path, $info->namespace)) {
            throw new \InvalidArgumentException('Missing path or namespace.');
        }

        if (!is_file($info->path) || !is_readable($info->path)) {
            return null;
        }

        include_once $info->path;

        // Try namespaced class first: Namespace\Plugin
        $class = rtrim($info->namespace, '\\') . '\\Plugin';

        if (class_exists($class)) {
            return new $class([
                'base_path' => dirname($info->path),
            ]);
        }

        // Fallback: legacy classname like WFEditorLinkPlugin
        $legacyClass = $this->createLegacyClassName($info->plugin);

        if (class_exists($legacyClass)) {
            return new $legacyClass([
                'base_path' => dirname($info->path),
            ]);
        }

        return null;
    }

    public function execute($task)
    {
        // Check for session token
        Session::checkToken('request') or jexit(Text::_('JINVALID_TOKEN'));

        // accept the "controller.task" form too, in case the caller has not stripped the
        // prefix, as EditorController::execute() already does
        if (strpos($task, '.') !== false) {
            [, $task] = explode('.', $task);
        }

        // validate the task against allowed tasks
        if (!in_array($task, self::ALLOWED_TASKS, true)) {
            throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        $wf = \Wfe\Factory::getApplication();

        $app = Factory::getApplication();

        $language = $app->getLanguage();
        $plugin = $this->input->get('plugin', '', 'cmd');
        $caller = '';

        // Get plugin name
        if (strpos($plugin, '.') !== false) {
            list($plugin, $caller) = explode('.', $plugin);
        }

        // map plugin name to internal / legacy name
        $mapped = $this->mapPluginName($plugin);

        if ($mapped !== $plugin) {
            // If the plugin name was mapped, update the input
            if (!empty($caller)) {
                $mapped = $mapped . '.' . $caller;
            }

            $this->input->set('plugin', $mapped);

            $plugin = $mapped;
        }

        // check this is a valid plugin
        if (!$wf->isValidPlugin($plugin)) {
            throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        // check a valid profile exists
        if (!$wf->checkProfile($plugin)) {
            throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        // Load language files
        $language->load('com_jce', JPATH_ADMINISTRATOR);

        // Default filepath and namespace
        $filepath = false;
        $namespace = 'Wfe\\Plugins\\Editor\\' . ucfirst($plugin) . '\\';

        // Check installed plugins first
        if (preg_match('/^editor[-_]/', $plugin)) {
            $path = JPATH_PLUGINS . '/jce/' . $plugin;
            $filepath = $path . '/' . $plugin . '.php';

            // Check for alternate PSR-4-style path
            if (is_dir($path . '/src')) {
                $name = substr($plugin, 7);
                $filepath = $path . '/src/' . ucfirst($name) . '.php';

                // Update namespace
                $namespace = 'Wfe\\Plugins\\Editor\\' . ucfirst($name) . '\\';
            }

            if (!file_exists($filepath)) {
                $filepath = false;
            }
        }

        // Allow event-based override (e.g. for custom/pro plugins)
        $event = new Event('onWfPluginExecute', [
            'subject' => $this,
            'plugin' => $plugin,
            'filepath' => $filepath,
            'namespace' => $namespace,
        ]);

        $app->getDispatcher()->dispatch('onWfPluginExecute', $event);

        $filepath = $event->getArgument('filepath');
        $namespace = $event->getArgument('namespace');

        // Check core plugins if still not found
        if ($filepath === false) {
            $filepath = Path::find(
                [WF_EDITOR_PLUGINS . '/' . ucfirst($plugin)],
                'Plugin.php'
            );

            $namespace = 'Wfe\\Plugins\\Editor\\' . ucfirst($plugin) . '\\';
        }

        // an event handler can set any path, so confine it before loading
        if ($filepath === false || !$this->isPluginPath($filepath)) {
            throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        // Dynamically load and instantiate class
        $instance = $this->loadPluginClass((object) [
            'path' => $filepath,
            'namespace' => $namespace,
            'plugin' => $plugin
        ]);

        if (!$instance) {
            throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        // Load plugin-specific language
        $language->load('plg_jce_' . $plugin, dirname($filepath));

        // Execute task
        $instance->execute($task);

        jexit();
    }
}
