<?php

/**
 * @copyright     Copyright (c) 2009-2013 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

require_once JPATH_ADMINISTRATOR . '/components/com_jce/includes/constants.php';

class JceModelCpanel extends JModelLegacy
{
    public function getIcons()
    {
        $user = JFactory::getUser();

        $icons = array();

        $views = array(
            'config'    => 'equalizer', 
            'profiles'  => 'users', 
            'browser'   => 'picture', 
            'mediabox'  => 'pictures'
        );

        foreach ($views as $name => $icon) {

            // if its mediabox, check the plugin is installed and enabled
            if ($name === "mediabox" && !JPluginHelper::isEnabled('system', 'jcemediabox')) {
                continue;
            }

            // check if its allowed...
            if (!$user->authorise('core.admin.' . $name, 'com_jce')) {
                continue;
            }

            $link   = 'index.php?option=com_jce&amp;view=' . $name;
            $title  = JText::_('WF_' . strtoupper($name));

            if ($name === "browser") {
                $title = JText::_('WF_' . strtoupper($name) . '_TITLE');
            }

            $icons[] = '<div class="span2 thumbnail card col-sm-2"><a title="' . JText::_('WF_' . strtoupper($name) . '_DESC') . '" href="' . $link . '"><i class="icon-' . $icon . '"></i><h6 class="thumbnail-title text-center">' . $title . '</h6></a></div>';
        }

        return $icons;
    }

    /**
     * Method to auto-populate the model state.
     *
     * Note. Calling getState in this method will result in recursion.
     *
     * @since   1.6
     */
    protected function populateState($ordering = null, $direction = null)
    {
        $licence = "";
        $version = "";

        if ($xml = simplexml_load_file(JPATH_ADMINISTRATOR . '/components/com_jce/jce.xml')) {
            $licence = (string)$xml->license;
            $version = (string)$xml->version;

            if (WF_EDITOR_PRO) {
                $version = '<span class="badge badge-info badge-primary">Pro</span>&nbsp;' . $version;
            }
        }

        $this->setState('version', $version);
        $this->setState('licence', $licence);
    }
}