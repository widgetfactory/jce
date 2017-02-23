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
    protected function getLink($filter = 'images')
    {
        require_once JPATH_ADMINISTRATOR.'/components/com_jce/helpers/browser.php';

        $link = WFBrowserHelper::getMediaFieldLink('', $filter);

        return $link;
    }

    public function onPlgSystemJceContentPrepareForm($form, $data)
    {
        return $this->onContentPrepareForm($form, $data);
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

        if (!$version->isCompatible('3.4')) {
            return true;
        }

        if (!($form instanceof JForm)) {
            $this->_subject->setError('JERROR_NOT_A_FORM');

            return false;
        }

        $params = JComponentHelper::getParams('com_jce');

        if ((bool) $params->get('replace_media_manager', 1) === false) {
            return;
        }

        // get form name.
        $name = $form->getName();

        if (!$version->isCompatible('3.6')) {
            $valid = array(
                'com_content.article',
                'com_categories.categorycom_content',
                'com_templates.style',
                'com_tags.tag',
                'com_banners.banner',
                'com_contact.contact',
                'com_newsfeeds.newsfeed',
            );

            // only allow some forms, see - https://github.com/joomla/joomla-cms/pull/8657
            if (!in_array($name, $valid)) {
                return true;
            }
        }

        $config = JFactory::getConfig();
        $user = JFactory::getUser();

        if ($user->getParam('editor', $config->get('editor')) !== 'jce') {
            return true;
        }

        if (!JPluginHelper::getPlugin('editors', 'jce')) {
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
                return;
            }

            $type = $field->getAttribute('type');

            if (strtolower($type) === 'media') {
                // get filter value for field, eg: images, media, files
                $filter = $field->getAttribute('filter', 'images');

                // get file browser link
                $link = $this->getLink($filter);

                // link not available for environment
                if (empty($link)) {
                    continue;
                }

                $group = (string) $field->group;
                $form->setFieldAttribute($name, 'link', $link, $group);
                $form->setFieldAttribute($name, 'class', 'input-large wf-media-input', $group);

                $hasMedia = true;
            }
        }

        if ($hasMedia) {
            // Include jQuery
            JHtml::_('jquery.framework');

            $document = JFactory::getDocument();
            $document->addScriptDeclaration('jQuery(document).ready(function($){$(".wf-media-input").removeAttr("readonly");});');

            $document->addStyleSheet(JURI::root(true).'/plugins/content/jce/css/media.css');
        }

        return true;
    }
}
