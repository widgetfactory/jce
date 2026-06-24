<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\MVC\Controller\BaseController;

/**
 * Default frontend controller. Handles bare requests and any controller name
 * not explicitly provided in components/com_jce/controller/ — all of which
 * are restricted to the backend only.
 */
class JceController extends BaseController
{
    public function execute($task)
    {
        throw new \Exception('Restricted', 403);
    }

    public function display($cachable = false, $urlparams = [])
    {
        throw new \Exception('Restricted', 403);
    }
}
