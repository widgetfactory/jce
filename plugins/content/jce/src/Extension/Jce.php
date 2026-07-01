<?php

/**
 * @copyright   Copyright (c) 2015-2026 Ryan Demmer. All rights reserved
 * @copyright   Copyright (C) 2005 - 2024 Open Source Matters, Inc. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('JPATH_BASE') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Form\Form;
use Joomla\Event\Event;
use Joomla\CMS\Event\Model\PrepareFormEvent;
use Joomla\Event\SubscriberInterface;

/**
 * JCE.
 *
 * @since       2.5.20
 */
class PlgContentJce extends CMSPlugin implements SubscriberInterface
{
    /**
     * Returns an array of events this subscriber will listen to.
     *
     * @return  array
     *
     * @since   5.0.0
     */
    public static function getSubscribedEvents(): array
    {
        return [
            'onContentPrepareForm' => 'onContentPrepareForm',
        ];
    }

    /**
     * Process form fields in content.
     * This is included to process Joomla Media Fields in 3rd party extensions that call onContentPrepareForm after the System - JCE plugin has been dispatched.
     *
     * @param Form $form The form to be altered
     * @param mixed $data The associated data for the form
     *
     * @return bool
     *
     */
    public function onContentPrepareForm(PrepareFormEvent $event)
    {
        $wfEvent = new Event('onWfContentPrepareForm', [
            'subject'   => $this,
            'form'      => $event->getForm(),
            'data'      => $event->getData()
        ]);
    
        $this->getApplication()->getDispatcher()->dispatch('onWfContentPrepareForm', $wfEvent);
    }
}