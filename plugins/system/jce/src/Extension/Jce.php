<?php

/**
 * @package     JCE
 * @subpackage  System.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\System\Jce\Extension;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Factory;
use Joomla\Event\Event;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Event\CustomFields\PrepareDomEvent;

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
    /**
     * Affects constructor behavior. If true, language files will be loaded automatically.
     *
     * @var    boolean
     */
    protected $autoloadLanguage = true;

    /**
     * Flag to indicate if the media scripts have been loaded.
     *
     * @var    boolean
     */
    protected $mediaLoaded = false;

    /**
     * Flag to indicate if the editor plugins have been booted.
     *
     * @var    boolean
     */
    protected $booted = false;

    /**
     * Returns an array of events this subscriber will listen to.
     *
     * @return array
     *
     * @since   5.0.0
     */
    public static function getSubscribedEvents(): array
    {
        return [
            'onAfterRoute' => 'onAfterRoute',
            'onAfterDispatch' => 'onAfterDispatch',
            'onCustomFieldsPrepareDom' => 'onCustomFieldsPrepareDom',
            'onAfterInitialise' => 'onAfterInitialise',
            'onWfEditorBeforeLoad' => 'onWfEditorBeforeLoad',
            'onWfEditorBeforeProfileItem' => 'onWfEditorBeforeProfileItem'
        ];
    }

    protected function mapLegacyName($name)
    {
        // backwards compatability map
        $map = array(
            'paste' => 'clipboard',
            'spacer' => '|',
            'forecolor' => 'fontcolor',
            'backcolor' => 'backcolor'
        );

        if (array_key_exists($name, $map)) {
            return $map[$name];
        }

        return $name;
    }

    public function onAfterInitialise(Event $event): void
    {
        // Core namespace
        \JLoader::registerNamespace('Wfe', JPATH_PLUGINS . '/editors/jce/Wfe', false, false);

        $app = $this->getApplication();

        if (!$app->isClient('site')) {
            return;
        }

        $input = $app->getInput();

        if ($input->get('option') === 'com_jce' && $input->get('format', 'html') === 'html') {
            $input->set('format', 'raw');
        }
    }

    public function onAfterDispatch()
    {
        $app = $this->getApplication();

        // only in "site"
        if ($app->getClientId() !== 0) {
            return;
        }

        $document = $app->getDocument();

        // must be an html doctype
        if ($document->getType() !== 'html') {
            return true;
        }

        $this->bootEditorPlugins();

        $event = new Event(
            'onWfPluginBeforeDispatch',
            array(
                'subject' => $this
            )
        );

        $app->getDispatcher()->dispatch('onWfPluginBeforeDispatch', $event);
    }

    /**
     * Transforms the field into a DOM XML element and appends it as a child on the given parent.
     *
     * @param   PrepareDomEvent $event The event object.
     *
     * @return  DOMElement
     *
     * @since   3.7.0
     */
    public function onCustomFieldsPrepareDom(PrepareDomEvent $event)
    {
        $field = $event->getField();

        if ($field->type !== 'mediajce') {
            return;
        }

        // check if field media have been loaded
        if ($this->mediaLoaded) {
            return;
        }

        $app = $this->getApplication();

        $document = $app->getDocument();

        $option = $app->input->getCmd('option');
        $component = ComponentHelper::getComponent($option);

        $document->addScriptOptions('plg_system_jce', array(
            'context' => (int) $component->id,
        ), true);

        $wa = $document->getWebAssetManager();

        $wa->registerAndUseScript('plg_system_jce.media', 'media/com_jce/site/js/media.min.js');
        $wa->registerAndUseStyle('plg_system_jce.media', 'media/com_jce/site/css/media.min.css');

        // update the mediaLoaded flag
        $this->mediaLoaded = true;
    }

    public function onAfterRoute()
    {
        // JCE Pro will load media
        if (PluginHelper::isEnabled('system', 'jcepro')) {
            $this->mediaLoaded = true;
        }
    }

    public function onWfEditorBeforeLoad(Event $event): void
    {
        // load template events
        $this->loadTemplateEvents();
    }

    private function loadTemplateEvents()
    {
        $items = glob(JPATH_PLUGINS . '/system/jce/src/Templates/*.php');

        $dispatcher = Factory::getApplication()->getDispatcher();

        foreach ($items as $item) {
            $name = basename($item, '.php');

            $className = '\\Joomla\\Plugin\\System\\Jce\\Templates\\' . ucfirst($name);

            require_once $item;

            if (class_exists($className)) {
                // Instantiate and register the event
                $plugin = new $className($dispatcher);
                $plugin->registerListeners();
            }
        }
    }

    private function bootEditorPlugins()
    {
        if ($this->booted) {
            return;
        }

        $app = $this->getApplication();

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

    public function onWfEditorBeforeProfileItem(Event $event): void
    {
        $item = $event->getArgument('item');

        $plugins = explode(',', $item->plugins);

        // convert legacy plugin names
        array_walk($plugins, function (&$name) {
            $name = $this->mapLegacyName($name);
        });

        $item->plugins = implode(',', $plugins);

        // set the updated item back to the event
        $event->setArgument('item', $item);
    }
}
