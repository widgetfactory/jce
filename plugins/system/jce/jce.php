<?php

/**
 * @copyright   Copyright (C) 2015 - 2023 Ryan Demmer. All rights reserved
 * @copyright   Copyright (C) 2005 - 2014 Open Source Matters, Inc. All rights reserved
 * @license     GNU General Public License version 2 or later
 */

defined('JPATH_BASE') or die;

JLoader::registerNamespace('Joomla\\Plugin\\Editors\\Jce', JPATH_PLUGINS . '/editors/jce/src', false, false, 'psr4');

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
    /**
     * Flag to set / check if media assests have been loaded
     *
     * @var boolean
     */
    private $mediaLoaded = false;

    public function onPlgSystemJceContentPrepareForm($form, $data)
    {
        return $this->onContentPrepareForm($form, $data);
    }

    private function getMediaRedirectOptions()
    {
        $app = Factory::getApplication();

        require_once JPATH_ADMINISTRATOR . '/components/com_jce/helpers/browser.php';

        $id = $app->input->get('fieldid', '');
        $mediatype = $app->input->getVar('mediatype', $app->input->getVar('view', 'images'));
        $context = $app->input->getVar('context', '');
        $plugin = $app->input->getCmd('plugin', '');

        $options = WFBrowserHelper::getMediaFieldOptions(array(
            'element' => $id,
            'converted' => true,
            'mediatype' => $mediatype,
            'context' => $context,
            'plugin' => $plugin,
        ));

        if (empty($options['url'])) {
            return false;
        }

        return $options;
    }

    private function redirectMedia()
    {
        $options = $this->getMediaRedirectOptions();

        if ($options && isset($options['url'])) {
            Factory::getApplication()->redirect($options['url']);
        }
    }

    private function isEditorEnabled()
    {
        return ComponentHelper::isEnabled('com_jce') && PluginHelper::isEnabled('editors', 'jce');
    }

    private function canRedirectMedia()
    {
        $app = Factory::getApplication();
        $params = ComponentHelper::getParams('com_jce');

        // must have fieldid
        if (!$app->input->get('fieldid')) {
            return false;
        }

        // jce converted mediafield
        if ($app->input->getCmd('option') == 'com_jce' && $app->input->getCmd('task') == 'mediafield.display') {
            return true;
        }

        if ((bool) $params->get('replace_media_manager', 1) == true) {
            // flexi-content mediafield
            if ($app->input->getCmd('option') == 'com_media' && $app->input->getCmd('asset') == 'com_flexicontent') {
                return true;
            }
        }

        return false;
    }

    public function onAfterRoute()
    {
        if (false == $this->isEditorEnabled()) {
            return false;
        }

        if ($this->canRedirectMedia() && $this->isEditorEnabled()) {
            // redirect to file browser
            $this->redirectMedia();
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

        // only if enabled
        if ((int) $this->params->get('column_styles', 1)) {
            $hash = md5_file(JPATH_SITE . '/media/com_jce/site/css/content.min.css');
            $document->addStyleSheet(Uri::root(true) . '/media/com_jce/site/css/content.min.css?' . $hash);
        }

        $this->bootEditorPlugins();

        $app->triggerEvent('onWfPluginAfterDispatch');
    }

    public function onWfContentPreview($context, &$article, &$params, $page)
    {
        $article->text = '<style type="text/css">@import url("' . Uri::root(true) . '/media/com_jce/site/css/content.min.css");</style>' . $article->text;
    }

    private function loadMediaFiles($form, $replace_media_manager = true)
    {
        if ($this->mediaLoaded) {
            return;
        }

        $app = Factory::getApplication();

        $option = $app->input->getCmd('option');
        $component = ComponentHelper::getComponent($option);

        $document = Factory::getDocument();

        $document->addScriptOptions('plg_system_jce', array(
            'convert_mediafield' => $replace_media_manager,
            'context' => $component->id,
        ), true);

        $form->addFieldPath(JPATH_PLUGINS . '/fields/mediajce/fields');

        // Include jQuery
        HTMLHelper::_('jquery.framework');

        $document = Factory::getDocument();
        $document->addScript(Uri::root(true) . '/media/com_jce/site/js/media.min.js', array('version' => 'auto'));
        $document->addStyleSheet(Uri::root(true) . '/media/com_jce/site/css/media.min.css', array('version' => 'auto'));

        $this->mediaLoaded = true;
    }

    public function onCustomFieldsPrepareDom($field, $fieldset, $form)
    {
        if ($field->type == 'mediajce') {
            $this->loadMediaFiles($form);
        }
    }

    /**
     * adds additional fields to the user editing form.
     *
     * @param JForm $form The form to be altered
     * @param mixed $data The associated data for the form
     *
     * @return bool
     *
     * @since   2.5.20
     */
    public function onContentPrepareForm($form, $data)
    {
        $app = Factory::getApplication();
        $docType = Factory::getDocument()->getType();

        // must be an html doctype
        if ($docType !== 'html') {
            return true;
        }

        if (!($form instanceof Form)) {
            $this->_subject->setError('JERROR_NOT_A_FORM');
            return false;
        }

        // editor not enabled
        if (false == $this->isEditorEnabled()) {
            return true;
        }

        // Get File Browser options
        $options = $this->getMediaRedirectOptions();

        // not enabled
        if (false == $options) {
            return true;
        }

        $params = ComponentHelper::getParams('com_jce');

        $hasMedia = false;
        $fields = $form->getFieldset();

        // should the Joomla Media field be converted?
        $replace_media_manager = (bool) $params->get('replace_media_manager', 1) && $options['converted'];

        foreach ($fields as $field) {
            if (method_exists($field, 'getAttribute') === false) {
                continue;
            }

            $name = $field->getAttribute('name');

            // avoid processing twice
            if ($form->getFieldAttribute($name, 'class') && strpos($form->getFieldAttribute($name, 'class'), 'wf-media-input') !== false) {
                continue;
            }

            $type = $field->getAttribute('type');

            if ($type) {
                // jce media field
                if (strtolower($type) == 'mediajce' || strtolower($type) == 'extendedmedia') {
                    $hasMedia = true;
                }

                // joomla media field and flexi-content converted media field
                if (strtolower($type) == 'media' || strtolower($type) == 'fcmedia') {

                    // media replacement disabled, skip...
                    if ($replace_media_manager == false) {
                        continue;
                    }

                    $group = (string) $field->group;
                    $form->setFieldAttribute($name, 'type', 'mediajce', $group);
                    $form->setFieldAttribute($name, 'converted', '1', $group);

                    // set converted attribute flag instead of class attribute (extension conflict?)
                    $form->setFieldAttribute($name, 'data-wf-converted', '1', $group);

                    $hasMedia = true;
                }
            }
        }

        // form has a media field
        if ($hasMedia) {
            $this->loadMediaFiles($form, $replace_media_manager);
        }

        return true;
    }

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

    public function onWfPluginInit($instance)
    {
        $app = Factory::getApplication();
        $user = Factory::getUser();

        // set mediatype values for Template Manager parameters
        if ($app->input->getCmd('plugin') == 'browser.templatemanager') {

            // only in "admin"
            if ($app->getClientId() !== 1) {
                return;
            }

            // restrict to admin with component manage access
            if (!$user->authorise('core.manage', 'com_jce')) {
                return false;
            }

            // check for element and standalone should indicate mediafield
            if ($app->input->getVar('element') && $app->input->getInt('standalone')) {
                $mediatype = $app->input->getVar('mediatype');

                if (!$mediatype) {
                    return false;
                }

                $accept = $instance->getParam('templatemanager.extensions', '');

                if ($accept) {
                    $instance->setFileTypes($accept);
                    $accept = $instance->getFileTypes();
                    $mediatype = implode(',', array_intersect(explode(',', $mediatype), $accept));
                }

                $instance->setFileTypes($mediatype);
            }
        }
    }
}
