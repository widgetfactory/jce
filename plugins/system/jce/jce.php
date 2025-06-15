<?php

/**
 * @copyright   Copyright (C) 2015 - 2023 Ryan Demmer. All rights reserved
 * @copyright   Copyright (C) 2005 - 2014 Open Source Matters, Inc. All rights reserved
 * @license     GNU General Public License version 2 or later
 */

defined('JPATH_BASE') or die;

JLoader::registerNamespace('Joomla\\Plugin\\Editors\\Jce', JPATH_PLUGINS . '/editors/jce/src', false, false, 'psr4');
JLoader::register('WfBrowserHelper', JPATH_ADMINISTRATOR . '/components/com_jce/helpers/browser.php');

use Joomla\CMS\Document\Factory;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Form\Form;
use Joomla\Plugin\System\Jce\PluginTraits\TemplatesTrait;

/**
 * JCE.
 *
 * @since       2.5.5
 */
class PlgSystemJce extends CMSPlugin
{
    use TemplatesTrait;

    /**
     * Affects constructor behavior. If true, language files will be loaded automatically.
     *
     * @var    boolean
     */
    protected $autoloadLanguage = true;

    /**
     * Constructor.
     *
     * @param object $subject The object to observe
     * @param array  $config  An array that holds the plugin configuration
     *
     * @since       1.5
     */
    public function __construct(&$subject, $config)
    {
        parent::__construct($subject, $config);
    }

    private function getDummyDispatcher()
    {
        $dispatcher = JEventDispatcher::getInstance();

        return $dispatcher;
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

        $app->triggerEvent('onWfPluginBeforeDispatch');
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

    public function onWfBeforeEditorLoad($config = array())
    {
        $this->BeforeEditorLoad();
    }
}