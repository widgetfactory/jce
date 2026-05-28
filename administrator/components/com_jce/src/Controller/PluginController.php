<?php

/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (C) 2023 Ryan Demmer. All rights reserved.
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

        $wf = \Wfe\Factory::getApplication();

        $app = Factory::getApplication();

        $language = $app->getLanguage();
        $plugin = $this->input->get('plugin');

        // Get plugin name
        if (strpos($plugin, '.') !== false) {
            list($plugin, $caller) = explode('.', $plugin);
        }

        // map plugin name to internal / legacy name
        $mapped = $this->mapPluginName($plugin);

        if ($mapped !== $plugin) {
            // If the plugin name was mapped, update the input
            if (!empty($caller)) {
                $mapped = $plugin . '.' . $caller;
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

        if ($filepath === false) {
            jexit('Invalid Plugin');
        }

        // Dynamically load and instantiate class
        $instance = $this->loadPluginClass((object) [
            'path' => $filepath,
            'namespace' => $namespace,
            'plugin' => $plugin
        ]);

        if (!$instance) {
            jexit('Could not load plugin class');
        }

        // Load plugin-specific language
        $language->load('plg_jce_' . $plugin, dirname($filepath));

        // Execute task
        $instance->execute($task);

        jexit();
    }
}
