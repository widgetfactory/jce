<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2023-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Traits;

defined('_JEXEC') or die;

use Joomla\CMS\Access\Exception\NotAllowed;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;

/**
 * Shared authorisation guard for com_jce controllers and models.
 *
 * @since  3.0
 */
trait AuthoriseTrait
{
    /**
     * Throw if the current user is not granted the given com_jce action.
     *
     * @param   string  $action  The com_jce access action, eg. "jce.profiles".
     *
     * @return  void
     *
     * @throws  NotAllowed
     */
    protected function assertAuthorised($action)
    {
        if (!Factory::getApplication()->getIdentity()->authorise($action, 'com_jce')) {
            throw new NotAllowed(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }
    }
}
