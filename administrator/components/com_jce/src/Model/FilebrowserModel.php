<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Model;

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\MVC\Model\BaseDatabaseModel;
use Joomla\CMS\Language\Text;

use Joomla\Component\Jce\Administrator\Helper\BrowserHelper;

/**
 * Releases model.
 *
 * @since  1.5
 */
class FilebrowserModel extends BaseDatabaseModel
{
	/**
	 * The type alias for this content type.
	 *
	 * @var    string
	 * @since  3.0
	 */
	public $typeAlias = 'com_jce.filebrowser';
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
        
        $filter = $app->input->getCmd('filter', '');
        
        $url = BrowserHelper::getBrowserLink(null, $filter);

        if (empty($url)) {
            $app->enqueueMessage(Text::_('JERROR_ALERTNOAUTHOR'), 'error');
            $app->redirect('index.php?option=com_jce', 403);
        }

        $this->setState('url', $url);
    }
}