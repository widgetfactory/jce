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

/**
 * Form Field class for the Joomla Framework.
 *
 * @since       11.4
 */
class JFormFieldComponents extends ListField
{
    /**
     * The field type.
     *
     * @var string
     *
     * @since  11.4
     */
    protected $type = 'Components';

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
            'com_jce',
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

        $components = $db->loadObjectList();

        $options = array();

        // load component languages
        for ($i = 0; $i < count($components); ++$i) {
            if (!in_array($components[$i]->value, $exclude)) {
                // load system language file
                $language->load($components[$i]->value . '.sys', JPATH_ADMINISTRATOR);
                $language->load($components[$i]->value, JPATH_ADMINISTRATOR);

                // translate name
                $components[$i]->text = Text::_($components[$i]->text, true);

                $components[$i]->disable = '';

                $options[] = $components[$i];
            }
        }

        // Merge any additional options in the XML definition.
        return array_merge(parent::getOptions(), $options);
    }
}
