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
use Joomla\CMS\MVC\Controller\AdminController;
use Joomla\CMS\Response\JsonResponse;
use Joomla\CMS\Router\Route;

use Joomla\Component\Jce\Administrator\Traits\AuthoriseTrait;

/**
 * Profiles list controller class.
 *
 * @since  1.6
 */
class ProfilesController extends AdminController
{
	use AuthoriseTrait;

	/**
	 * Proxy for getModel
	 *
	 * @param   string  $name    The model name. Optional.
	 * @param   string  $prefix  The class prefix. Optional.
	 * @param   array   $config  The array of possible config values. Optional.
	 *
	 * @return  object  The model.
	 *
	 * @since   1.6
	 */
	public function getModel($name = 'Profile', $prefix = 'Administrator', $config = ['ignore_request' => true])
	{
		return parent::getModel($name, $prefix, $config);
	}

    public function publish()
    {
        $this->checkToken();

        $this->assertAuthorised('jce.profiles');

        return parent::publish();
    }

    public function delete()
    {
        $this->checkToken();

        $this->assertAuthorised('jce.profiles');

        return parent::delete();
    }

    public function saveorder()
    {
        $this->checkToken();

        $this->assertAuthorised('jce.profiles');

        return parent::saveorder();
    }

    public function reorder()
    {
        $this->checkToken();

        $this->assertAuthorised('jce.profiles');

        return parent::reorder();
    }

    public function checkin()
    {
        $this->checkToken();

        $this->assertAuthorised('jce.profiles');

        return parent::checkin();
    }

	/**
     * Method to import profile data from an XML file.
     *
     * @since   3.0
     */
    public function import()
    {
        // Check for request forgeries
        $this->checkToken();

        $this->assertAuthorised('jce.profiles');

        $model = $this->getModel();

        $result = $model->import();

        // Get redirect URL
        $redirect_url = Route::_(
			'index.php?option=' . $this->option . '&view=' . $this->view_list
			. $this->getRedirectToListAppend(),
			false
		);

        // Push message queue to session because we will redirect page by Javascript, not $app->redirect().
        // The "application.queue" is only set in redirect() method, so we must manually store it.
        $this->app->getSession()->set('application.queue', $this->app->getMessageQueue());

        $this->app->setHeader('Content-Type', 'application/json');
        $this->app->sendHeaders();

        echo new JsonResponse(['redirect' => $redirect_url], '', !$result);

        $this->app->close();
    }

    public function repair()
    {
        // Check for request forgeries using "get"
        $this->checkToken('get');

        $this->assertAuthorised('jce.profiles');

        $model = $this->getModel('Profiles');

        try {
            $model->repair();
        } catch (\Exception $e) {
            $this->setMessage($e->getMessage(), 'error');
        }

        $this->setRedirect(
            Route::_(
                'index.php?option=' . $this->option . '&view=' . $this->view_list
                . $this->getRedirectToListAppend(),
                false
            )
        );
    }

    public function copy()
    {
        // Check for request forgeries
        $this->checkToken();

        $this->assertAuthorised('jce.profiles');

        $cid = $this->input->get('cid', [], 'array');

        if (empty($cid)) {
            throw new \Exception(Text::_('JLIB_HTML_PLEASE_MAKE_A_SELECTION_FROM_THE_LIST'));
        } else {
            $model = $this->getModel();
            // Copy the items.
            try {
                $model->copy($cid);
                $ntext = $this->text_prefix . '_N_ITEMS_COPIED';
                $this->setMessage(Text::plural($ntext, count($cid)));
            } catch (\Exception $e) {
                $this->setMessage($e->getMessage(), 'error');
            }
        }

        $this->setRedirect(
            Route::_(
                'index.php?option=' . $this->option . '&view=' . $this->view_list
                . $this->getRedirectToListAppend(),
                false
            )
        );
    }

    public function export()
    {
        // Check for request forgeries
        $this->checkToken();

        $this->assertAuthorised('jce.profiles');

        $ids = $this->input->get('cid', [], 'array');

        if (empty($ids)) {
            throw new \Exception(Text::_('JLIB_HTML_PLEASE_MAKE_A_SELECTION_FROM_THE_LIST'));
        } else {
            $model = $this->getModel();

            // Publish the items.
            if (!$model->export($ids)) {
                throw new \Exception($model->getError());
            }
        }
    }
}
