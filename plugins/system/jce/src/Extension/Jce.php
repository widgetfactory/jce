<?php
/**
 * @package     JCE
 * @subpackage  Editors.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\System\Jce\Extension;

use JLoader;
use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\Plugin\System\Jce\PluginTraits\EventTrait;
use Joomla\Plugin\System\Jce\PluginTraits\FormTrait;

JLoader::register('WfBrowserHelper', JPATH_ADMINISTRATOR . '/components/com_jce/helpers/browser.php');

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

/**
 * JCE WYSIWYG Editor Plugin.
 *
 * @since 1.5
 */
final class Jce extends CMSPlugin
{
    use FormTrait;
    use EventTrait;

    /**
     * Affects constructor behavior. If true, language files will be loaded automatically.
     *
     * @var    boolean
     */
    protected $autoloadLanguage = true;

    private $booted = false;

    private function bootEditorPlugins()
    {
        if ($this->booted) {
            return;
        }

        $app = Factory::getApplication();

        // only in "site"
        if ($app->getClientId() !== 0) {
            return;
        }

        $plugins = PluginHelper::getPlugin('jce');

        foreach ($plugins as $plugin) {
            if (!preg_match('/^editor[-_]/', $plugin->name)) {
                continue;
            }

            $path = JPATH_PLUGINS . '/jce/' . $plugin->name;

            // only modern plugins
            if (!is_dir($path . '/src')) {
                continue;
            }

            $plugin = $app->bootPlugin($plugin->name, $plugin->type);
            $plugin->setDispatcher($app->getDispatcher());

            $plugin->registerListeners();
        }

        $this->booted = true;
    }

    public function onAfterDispatch()
    {
        $app = Factory::getApplication();

        // only in "site"
        if ($app->getClientId() !== 0) {
            return;
        }

        $document = Factory::getDocument();

        // must be an html doctype
        if ($document->getType() !== 'html') {
            return true;
        }

        $this->bootEditorPlugins();

        $app->triggerEvent('onWfPluginAfterDispatch');
    }
}
