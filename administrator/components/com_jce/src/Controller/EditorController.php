<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2023-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Controller;

defined('_JEXEC') or die;

use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Controller\BaseController;
use Joomla\CMS\Session\Session;

/**
 * Releases Main Controller
 *
 * @since  1.5
 */
class EditorController extends BaseController
{
    public function execute($task)
    {
        // check for session token
        Session::checkToken('get') or jexit(Text::_('JINVALID_TOKEN'));

        $wf = \Wfe\Factory::getApplication();

        if (!$wf->checkProfile('')) {
            throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        $editor = new \Wfe\Editor\Editor();

        if (strpos($task, '.') !== false) {
            [, $task] = explode('.', $task);
        }

        if (in_array($task, ['loadlanguages', 'pack', 'compileless'])) {
            if ($task === 'pack') {
                $type = $this->input->getWord('type', 'javascript');

                if (!in_array($type, ['javascript', 'css', 'language'], true)) {
                    jexit();
                }
            }

            if (method_exists($editor, $task)) {
                $editor->$task();
            }
        }

        jexit();
    }
}