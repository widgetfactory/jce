<?php

/**
 * @copyright   Copyright (C) 2015 - 2023 Ryan Demmer. All rights reserved
 * @copyright   Copyright (C) 2005 - 2014 Open Source Matters, Inc. All rights reserved
 * @license     GNU General Public License version 2 or later
 */

defined('JPATH_BASE') or die;

JLoader::registerNamespace('Joomla\\Plugin\\Editors\\Jce', JPATH_PLUGINS . '/editors/jce/src', false, false, 'psr4');
JLoader::register('WfBrowserHelper', JPATH_ADMINISTRATOR . '/components/com_jce/helpers/browser.php');

use Joomla\CMS\Factory;
use Joomla\CMS\Form\Form;
use Joomla\CMS\Plugin\CMSPlugin;

/**
 * JCE.
 *
 * @since       2.5.5
 */
class PlgSystemJce extends CMSPlugin
{
    public function onAfterDispatch()
    {
        $app = Factory::getApplication();

        // only in "site"
        if ($app->getClientId() !== 0) {
            return;
        }

        $document = Factory::getDocument();

        // must be an html doctype
        if ($document->getType() !== 'html') {
            return true;
        }

        $app->triggerEvent('onWfPluginAfterDispatch');
    }

    /**
     * adds additional fields to the user editing form.
     *
     * @param Form $form The form to be altered
     * @param mixed $data The associated data for the form
     *
     * @return bool
     *
     * @since   2.6.64
     */
    public function onContentPrepareForm(Form $form, $data = [])
    {
        $app = Factory::getApplication();

        // Only for admin
        if (!$app->isClient('administrator')) {
            return true;
        }

        $formName = $form->getName();

        // profile form data
        if ($form->getName() == 'com_config.component') {

            // only for JCE component
            if ($app->input->getCmd('component') !== 'com_jce') {
                return true;
            }

            Form::addFormPath(__DIR__ . '/forms');
            $form->loadFile('updates', false, '/config');
        }
    }
}
