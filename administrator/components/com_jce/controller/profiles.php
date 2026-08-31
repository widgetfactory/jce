<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Controller\AdminController;
use Joomla\CMS\Response\JsonResponse;
use Joomla\CMS\Router\Route;
use Joomla\CMS\Session\Session;

class JceControllerProfiles extends AdminController
{
    /**
     * Throw unless the current user holds the given com_jce action.
     *
     * Mirrors AuthoriseTrait::assertAuthorised() in 3.0, which is a trait because more
     * than one controller uses it there.
     *
     * @param string $action The com_jce access action, eg: "jce.profiles"
     *
     * @return void
     *
     * @throws Exception
     */
    private function assertAuthorised($action)
    {
        if (!Factory::getUser()->authorise($action, 'com_jce')) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }
    }

    public function publish()
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));

        $this->assertAuthorised('jce.profiles');

        return parent::publish();
    }

    public function delete()
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));

        $this->assertAuthorised('jce.profiles');

        return parent::delete();
    }

    public function saveorder()
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));

        $this->assertAuthorised('jce.profiles');

        return parent::saveorder();
    }

    public function reorder()
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));

        $this->assertAuthorised('jce.profiles');

        return parent::reorder();
    }

    public function checkin()
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));

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
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));

        $this->assertAuthorised('jce.profiles');

        $app = Factory::getApplication();

        $model = $this->getModel();

        $result = $model->import();

        // Get redirect URL
        $redirect_url = Route::_('index.php?option=com_jce&view=profiles', false);

        // Push message queue to session because we will redirect page by Javascript, not $app->redirect().
        // The "application.queue" is only set in redirect() method, so we must manually store it.
        $app->getSession()->set('application.queue', $app->getMessageQueue());

        header('Content-Type: application/json');

        echo new JsonResponse(array('redirect' => $redirect_url), "", !$result);

        exit();
    }

    public function repair()
    {
        // Check for request forgeries
        Session::checkToken('get') or jexit(Text::_('JINVALID_TOKEN'));

        $this->assertAuthorised('jce.profiles');

        $model = $this->getModel('profiles');

        try {
            $model->repair();
        } catch (Exception $e) {
            $this->setMessage($e->getMessage(), 'error');
        }

        $this->setRedirect('index.php?option=com_jce&view=profiles');
    }

    public function copy()
    {
        // Check for request forgeries
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));

        $this->assertAuthorised('jce.profiles');

        $cid = (array) $this->input->get('cid', array(), 'int');

        if (empty($cid)) {
            throw new Exception(Text::_('No Item Selected'));
        } else {
            $model = $this->getModel();
            // Copy the items.
            try {
                $model->copy($cid);
                $ntext = $this->text_prefix . '_N_ITEMS_COPIED';
                $this->setMessage(Text::plural($ntext, count($cid)));
            } catch (Exception $e) {
                $this->setMessage($e->getMessage(), 'error');
            }
        }

        $this->setRedirect('index.php?option=com_jce&view=profiles');
    }

    public function export()
    {
        // Check for request forgeries
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));

        $this->assertAuthorised('jce.profiles');
        
        $ids = (array) $this->input->get('cid', array(), 'int');

        if (empty($ids)) {
            throw new Exception(Text::_('No Item Selected'));
        } else {
            $model = $this->getModel();
            // Publish the items.
            if (!$model->export($ids)) {
                throw new Exception($model->getError());
            }
        }
    }

    /**
     * Proxy for getModel.
     *
     * @param string $name   The model name. Optional
     * @param string $prefix The class prefix. Optional
     * @param array  $config The array of possible config values. Optional
     *
     * @return object The model
     *
     * @since   1.6
     */
    public function getModel($name = 'Profile', $prefix = 'JceModel', $config = array('ignore_request' => true))
    {
        return parent::getModel($name, $prefix, $config);
    }
}
