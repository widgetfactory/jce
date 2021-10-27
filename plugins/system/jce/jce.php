<?php

/**
 * @copyright   Copyright (C) 2015 Ryan Demmer. All rights reserved
 * @copyright   Copyright (C) 2005 - 2014 Open Source Matters, Inc. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

/**
 * JCE.
 *
 * @since       2.5.5
 */
class PlgSystemJce extends JPlugin
{
    public function onPlgSystemJceContentPrepareForm($form, $data)
    {
        return $this->onContentPrepareForm($form, $data);
    }

    private function redirectMedia()
    {
        $app = JFactory::getApplication();

        require_once JPATH_ADMINISTRATOR . '/components/com_jce/helpers/browser.php';

        $id = $app->input->get('fieldid');
        $mediatype = $app->input->getVar('mediatype', $app->input->getVar('view', 'images'));

        $options = WFBrowserHelper::getMediaFieldOptions(array(
            'element' => $id,
            'converted' => true,
            'mediatype' => $mediatype,
        ));

        if (!empty($options['url'])) {
            $app->redirect($options['url']);
        }
    }

    private function isEditorEnabled()
    {
        return JPluginHelper::isEnabled('editors', 'jce');
    }

    private function canRedirectMedia()
    {
        $app = JFactory::getApplication();

        // must have fieldid
        if (!$app->input->get('fieldid')) {
            return false;
        }
        
        // jce converted mediafield
        if ($app->input->getCmd('option') == 'com_jce' && $app->input->getCmd('task') == 'mediafield.display') {
            return true;
        }

        // flexi-content mediafield
        if ($app->input->getCmd('option') == 'com_media' && $app->input->getCmd('asset') == 'com_flexicontent') {
            return true;
        }

        return false;
    }

    public function onAfterRoute()
    {
        if ($this->canRedirectMedia()) {
            
            if ($this->isEditorEnabled()) {
                $params = JComponentHelper::getParams('com_jce');

                if ((bool) $params->get('replace_media_manager', 1) == true) {
                    // redirect to file browser
                    $this->redirectMedia();
                }
            }
        }
    }

    public function onAfterDispatch()
    {
        $app = JFactory::getApplication();

        // only in "site"
        if ($app->getClientId() !== 0) {
            return;
        }

        $document = JFactory::getDocument();

        // only if enabled
        if ((int) $this->params->get('column_styles', 1)) {
            $hash = md5_file(__DIR__ . '/css/content.css');
            $document->addStyleSheet(JURI::root(true) . '/plugins/system/jce/css/content.css?' . $hash);
        }
    }

    public function onWfContentPreview($context, &$article, &$params, $page)
    {
        $article->text = '<style type="text/css">@import url("' . JURI::root(true) . '/plugins/system/jce/css/content.css");</style>' . $article->text;
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
        $app = JFactory::getApplication();

        $version = new JVersion();

        // Joomla 3.9 or later...
        if (!$version->isCompatible('3.9')) {
            return true;
        }

        if (!($form instanceof JForm)) {
            $this->_subject->setError('JERROR_NOT_A_FORM');
            return false;
        }

        $params = JComponentHelper::getParams('com_jce');

        // editor not enabled
        if (!$this->isEditorEnabled()) {
            return true;
        }

        $hasMedia = false;
        $fields = $form->getFieldset();

        foreach ($fields as $field) {
            if (method_exists($field, 'getAttribute') === false) {
                continue;
            }

            $name = $field->getAttribute('name');

            // avoid processing twice
            if (strpos($form->getFieldAttribute($name, 'class'), 'wf-media-input') !== false) {
                continue;
            }

            $type = $field->getAttribute('type');

            // joomla media field and flexi-content converted media field
            if (strtolower($type) === 'media' || strtolower($type) === 'fcmedia') {

                // media replacement disabled, skip...
                if ((bool) $params->get('replace_media_manager', 1) === false) {
                    continue;
                }

                $group = (string) $field->group;
                $form->setFieldAttribute($name, 'type', 'mediajce', $group);
                $form->setFieldAttribute($name, 'converted', '1', $group);
                $hasMedia = true;
            }

            // jce media field
            if (strtolower($type) === 'mediajce') {
                $hasMedia = true;
            }
        }

        // form has a converted media field
        if ($hasMedia) {
            $form->addFieldPath(JPATH_PLUGINS . '/system/jce/fields');

            // Include jQuery
            JHtml::_('jquery.framework');

            $document = JFactory::getDocument();
            $document->addScript(JURI::root(true) . '/plugins/system/jce/js/media.js', array('version' => 'auto'));
            $document->addStyleSheet(JURI::root(true) . '/plugins/system/jce/css/media.css', array('version' => 'auto'));
        }

        return true;
    }

    public function onBeforeWfEditorLoad()
    {
        $items = glob(__DIR__ . '/templates/*.php');

        $app = JFactory::getApplication();

        if (method_exists($app, 'getDispatcher')) {
            $dispatcher = JFactory::getApplication()->getDispatcher();
        } else {
            $dispatcher = JEventDispatcher::getInstance();
        }

        foreach($items as $item) {
            $name = basename($item, '.php');

            $className = 'WfTemplate' . ucfirst($name);

            require_once($item);

			if (class_exists($className)) {
                // Instantiate and register the event
				$plugin = new $className($dispatcher);

				if ($plugin instanceof \Joomla\CMS\Extension\PluginInterface) {
                    $plugin->registerListeners();
				}
            }
        }
    }
}
