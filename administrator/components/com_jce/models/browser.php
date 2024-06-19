<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright     Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Model\BaseDatabaseModel;

require_once JPATH_ADMINISTRATOR . '/components/com_jce/helpers/browser.php';

class JceModelBrowser extends BaseDatabaseModel
{
    /**
     * Method to auto-populate the model state.
     *
     * Note. Calling getState in this method will result in recursion.
     *
     * @since   1.6
     */
    protected function populateState($ordering = null, $direction = null)
    {
        $app = Factory::getApplication();

        $mediatype  = $app->input->getCmd('mediatype', '');
        $folder     = $app->input->getPath('folder', '');

        $options = array();

        if ($folder) {
            $options['folder'] = $folder;
        }

        $url = WfBrowserHelper::getBrowserLink(null, $mediatype, '', $options);

        if (empty($url)) {
            $app->enqueueMessage(Text::_('JERROR_ALERTNOAUTHOR'), 'error');
            $app->redirect('index.php?option=com_jce');
        }

        $this->setState('url', $url);
    }
}
