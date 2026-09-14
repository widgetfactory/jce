<?php

/**
 * @package     JCE
 * @subpackage  Quickicon.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved
 * @copyright   Copyright (c) 2023-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Quickicon\Jce\Extension;

\defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Event\SubscriberInterface;
use Joomla\Module\Quickicon\Administrator\Event\QuickIconsEvent;

final class Jce extends CMSPlugin implements SubscriberInterface
{
    /**
     * Load the language file on instantiation.
     *
     * @var    boolean
     * @since  3.1
     */
    protected $autoloadLanguage = true;

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
            'onGetIcons' => 'onGetIcons',
        ];
    }

    /**
     * Add the JCE File Browser icon to the quickicon module
     *
     * @param   QuickIconsEvent  $event  The event object
     *
     * @return  void
     */
    public function onGetIcons(QuickIconsEvent $event): void
    {
        if ($event->getContext() !== $this->params->get('context', 'mod_quickicon')) {
            return;
        }

        // only if the component is enabled
        if (!ComponentHelper::isEnabled('com_jce')) {
            return;
        }

        if (!$this->getApplication()->getIdentity()->authorise('jce.browser', 'com_jce')) {
            return;
        }

        $result = $event->getArgument('result', []);

        $result[] = [
            [
                'link'   => 'index.php?option=com_jce&view=browser',
                'image'  => 'icon-images',
                'access' => ['jce.browser', 'com_jce'],
                'text'   => Text::_('PLG_QUICKICON_JCE_TITLE'),
                'id'     => 'plg_quickicon_jce',
            ],
        ];

        $event->setArgument('result', $result);
    }
}
