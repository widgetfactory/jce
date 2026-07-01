<?php

/**
 * @package     Jce.Site
 * @subpackage  com_jce
 *
 * @copyright   Copyright (c) 2026-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Site\Controller;

use Joomla\CMS\Access\Exception\NotAllowed;
use Joomla\CMS\MVC\Controller\BaseController;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

class DisplayController extends BaseController
{
    public function display($cachable = false, $urlparams = []): void
    {
        throw new NotAllowed('Access denied', 403);
    }
}