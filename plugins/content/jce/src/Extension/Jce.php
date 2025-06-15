<?php
/**
 * @package     JCE
 * @subpackage  Content.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Content\Jce\Extension;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Form\Form;
use Joomla\Event\Event;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

/**
 * JCE WYSIWYG Editor Plugin.
 *
 * @since 1.5
 */
final class Jce extends CMSPlugin
{
    /**
     * Affects constructor behavior. If true, language files will be loaded automatically.
     *
     * @var    boolean
     */
    protected $autoloadLanguage = true;

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
    public function onContentPrepareForm(Form $form, $data = [])
    {        
        $event = new Event('onWfContentPrepareForm', [
            'subject' => $this,
            'form' => $form,
            'data' => $data
        ]);
        
        $this->getApplication()->getDispatcher()->dispatch('onWfContentPrepareForm', $event);
    }
}
