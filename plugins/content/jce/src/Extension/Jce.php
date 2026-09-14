<?php

/**
 * @package     JCE
 * @subpackage  Content.Jce
 *
 * @copyright   Copyright (C) 2005 - 2024 Open Source Matters, Inc. All rights reserved
 * @copyright   Copyright (c) 2015-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Content\Jce\Extension;

\defined('_JEXEC') or die;

use Joomla\CMS\Event\Model\PrepareFormEvent;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Event\Event;
use Joomla\Event\SubscriberInterface;

/**
 * JCE.
 *
 * @since       2.5.20
 */
final class Jce extends CMSPlugin implements SubscriberInterface
{
    /**
     * Returns an array of events this subscriber will listen to.
     *
     * @return  array
     *
     * @since   3.1
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
     * @param   PrepareFormEvent  $event  The event object
     *
     * @return  void
     */
    public function onContentPrepareForm(PrepareFormEvent $event): void
    {
        // only form and data, in this order, as listeners may still use the legacy (Form $form, $data) signature
        $wfEvent = new Event('onWfContentPrepareForm', [
            'form' => $event->getForm(),
            'data' => $event->getData(),
        ]);

        $this->getApplication()->getDispatcher()->dispatch('onWfContentPrepareForm', $wfEvent);
    }
}
