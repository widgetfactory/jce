<?php
/**
 * @package     JCE
 * @subpackage  Extension.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved
 * @copyright   Copyright (c) 2023-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Extension\Jce\Extension;

\defined('_JEXEC') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Database\DatabaseAwareTrait;
use Joomla\Event\EventInterface;
use Joomla\Event\SubscriberInterface;
use Joomla\Plugin\Extension\Jce\PluginTraits\EventsTrait;

/**
 * JCE extension plugin for Joomla 4+.
 *
 * @since  2.9.99
 */
final class Jce extends CMSPlugin implements SubscriberInterface
{
    use EventsTrait;
    use DatabaseAwareTrait;

    /**
     * Returns an array of events this subscriber will listen to.
     *
     * @return array
     */
    public static function getSubscribedEvents(): array
    {
        return [
            'onExtensionBeforeInstall'  => 'onExtensionBeforeInstall',
            'onExtensionAfterInstall'   => 'onExtensionAfterInstall',
            'onExtensionAfterUninstall' => 'onExtensionAfterUninstall',
        ];
    }

    /**
     * Get the database driver.
     *
     * @return \Joomla\Database\DatabaseInterface
     */
    protected function getExtensionDatabase()
    {
        return $this->getDatabase();
    }

    // Generic event arguments are used as the typed Extension events only exist in Joomla 5+
    public function onExtensionBeforeInstall(EventInterface $event): void
    {
        $this->processBeforeInstall($event->getArgument('type'));
    }

    public function onExtensionAfterInstall(EventInterface $event): void
    {
        $this->processAfterInstall($event->getArgument('installer'), $event->getArgument('eid'));
    }

    public function onExtensionAfterUninstall(EventInterface $event): void
    {
        $this->processAfterUninstall($event->getArgument('installer'), $event->getArgument('eid'));
    }
}
