<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Form\Field\ListField;
use Joomla\CMS\Language\Text;
use Joomla\Utilities\ArrayHelper;

/**
 * Form Field class for the Joomla Framework.
 *
 * @since       11.4
 */
class JFormFieldComponentsList extends ListField
{
    /**
     * The field type.
     *
     * @var string
     *
     * @since  11.4
     */
    protected $type = 'ComponentsList';

    /**
     * Method to get a list of options for a list input.
     *
     * @return array An array of JHtml options
     *
     * @since   11.4
     */
    protected function getOptions()
    {
        $language = Factory::getLanguage();

        $exclude = array(
            'com_admin',
            'com_cache',
            'com_checkin',
            'com_config',
            'com_cpanel',
            'com_fields',
            'com_finder',
            'com_installer',
            'com_languages',
            'com_login',
            'com_mailto',
            'com_menus',
            'com_media',
            'com_messages',
            'com_newsfeeds',
            'com_plugins',
            'com_redirect',
            'com_templates',
            'com_users',
            'com_wrapper',
            'com_search',
            'com_user',
            'com_updates',
        );

        // Get list of plugins
        $db = Factory::getDbo();
        $query = $db->getQuery(true)
            ->select('element AS value, name AS text')
            ->from('#__extensions')
            ->where('type = ' . $db->quote('component'))
            ->where('enabled = 1')
            ->order('ordering, name');
        $db->setQuery($query);

        $items = $db->loadObjectList();

        $options = array();

        foreach ($items as $item) {
            // Load language
            $extension = $item->value;

            $language->load("$extension.sys", JPATH_ADMINISTRATOR)
                || $language->load("$extension.sys", JPATH_ADMINISTRATOR . '/components/' . $extension);

            $text = strtoupper($item->text);

            if ($text === 'COM_JCE') {
                $text = 'WF_CPANEL_BROWSER';
            }

            // Translate component name
            $item->text = Text::_($text);

            $options[] = $item;
        }

        // Sort by component name
        $options = ArrayHelper::sortObjects($options, 'text', 1, true, true);

        // Merge any additional options in the XML definition.
        $options = array_merge(parent::getOptions(), $options);

        return $options;
    }
}
