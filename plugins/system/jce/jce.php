<?php

/**
 * @copyright   Copyright (C) 2015 - 2023 Ryan Demmer. All rights reserved
 * @copyright   Copyright (C) 2005 - 2014 Open Source Matters, Inc. All rights reserved
 * @license     GNU General Public License version 2 or later
 */

defined('JPATH_BASE') or die;

JLoader::registerNamespace('Joomla\\Plugin\\Editors\\Jce', JPATH_PLUGINS . '/editors/jce/src', false, false, 'psr4');
JLoader::register('WfBrowserHelper', JPATH_ADMINISTRATOR . '/components/com_jce/helpers/browser.php');

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Form\Form;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Uri\Uri;

/**
 * JCE.
 *
 * @since       2.5.5
 */
class PlgSystemJce extends CMSPlugin
{
    protected $mediaLoaded = false;

    protected $booted = false;
    
    private function getDummyDispatcher()
    {
        $app = Factory::getApplication();

        if (method_exists($app, 'getDispatcher')) {
            $dispatcher = Factory::getApplication()->getDispatcher();
        } else {
            $dispatcher = JEventDispatcher::getInstance();
        }

        return $dispatcher;
    }

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

        // Joomla 4+ only
        if (!method_exists($app, 'bootPlugin')) {
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

    private function bootCustomPlugin($className, $config = array())
    {
        if (class_exists($className)) {
            $dispatcher = $this->getDummyDispatcher();

            // Instantiate and register the event
            $plugin = new $className($dispatcher, $config);

            if ($plugin instanceof \Joomla\CMS\Extension\PluginInterface) {
                $plugin->registerListeners();
            }
        }
    }

    public function onBeforeWfEditorLoad()
    {
        $items = glob(__DIR__ . '/templates/*.php');

        foreach ($items as $item) {
            $name = basename($item, '.php');

            $className = 'WfTemplate' . ucfirst($name);

            require_once $item;

            $this->bootCustomPlugin($className);
        }
    }

    public function onAfterRoute()
    {
        // JCE Pro will load media
        if (PluginHelper::isEnabled('system', 'jcepro')) {
            $this->mediaLoaded = true;
        }
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

    /**
     * Transforms the field into a DOM XML element and appends it as a child on the given parent.
     *
     * @param   stdClass    $field   The field.
     * @param   DOMElement  $parent  The field node parent.
     * @param   Form        $form    The form.
     *
     * @return  DOMElement
     *
     * @since   3.7.0
     */
    public function onCustomFieldsPrepareDom($field, \DOMElement $parent, Form $form)
    {
        if ($field->type !== 'mediajce') {
            return;
        }
        
        // check if field media have been loaded
        if ($this->mediaLoaded) {
            return;
        }

        $document = Factory::getDocument();

        // load scripts and styles for core JCE Media field
        HTMLHelper::_('jquery.framework');

        $option = Factory::getApplication()->input->getCmd('option');
        $component = ComponentHelper::getComponent($option);

        $document->addScriptOptions('plg_system_jce', array(
            'context' => (int) $component->id,
        ), true);

        $document->addScript(Uri::root(true) . '/media/com_jce/site/js/media.min.js', array('version' => 'auto'));
        $document->addStyleSheet(Uri::root(true) . '/media/com_jce/site/css/media.min.css', array('version' => 'auto'));

        // update the mediaLoaded flag
        $this->mediaLoaded = true;
    }
}
