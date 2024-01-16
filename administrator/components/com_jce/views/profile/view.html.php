<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\MVC\View\HtmlView;
use Joomla\CMS\Toolbar\ToolbarHelper;
use Joomla\CMS\Uri\Uri;

class JceViewProfile extends HtmlView
{
    protected $state;
    protected $item;
    public $form;

    /**
     * Display the view.
     */
    public function display($tpl = null)
    {
        $this->state = $this->get('State');
        $this->item = $this->get('Item');
        $this->form = $this->get('Form');

        $this->formclass = 'form-horizontal options-grid-form options-grid-form-full';

        $params = ComponentHelper::getParams('com_jce');

        if ($params->get('inline_help', 1)) {
            $this->formclass .= ' form-help-inline';
        }

        $this->plugins = $this->get('Plugins');
        $this->rows = $this->get('Rows');
        $this->available = $this->get('AvailableButtons');
        $this->additional = $this->get('AdditionalPlugins');

        // load language files
        $language = Factory::getLanguage();
        $language->load('com_jce', JPATH_SITE);
        $language->load('com_jce_pro', JPATH_SITE);

        // set JLayoutHelper base path
        LayoutHelper::$defaultBasePath = JPATH_COMPONENT_ADMINISTRATOR;

        // Check for errors.
        if (count($errors = $this->get('Errors'))) {
            throw new Exception(implode("\n", $errors), 500);
        }

        $this->addToolbar();
        parent::display($tpl);

        // only in Joomla 3.x
        if (version_compare(JVERSION, '4', 'lt')) {
            HTMLHelper::_('formbehavior.chosen', 'select');
        }

        // version hash
        $hash = md5(WF_VERSION);

        $document = Factory::getDocument();
        $document->addStyleSheet(Uri::root(true) . '/media/com_jce/admin/css/profile.min.css?' . $hash);
        $document->addStyleSheet(Uri::root(true) . '/media/com_jce/editor/vendor/jquery/css/jquery-ui.min.css?' . $hash);

        $document->addScript(Uri::root(true) . '/media/com_jce/editor/vendor/jquery/js/jquery-ui.min.js?' . $hash);
        $document->addScript(Uri::root(true) . '/media/com_jce/editor/vendor/jquery/js/jquery-ui.touch.min.js?' . $hash);

        $document->addScript(Uri::root(true) . '/media/com_jce/admin/js/core.min.js?' . $hash);
        $document->addScript(Uri::root(true) . '/media/com_jce/admin/js/profile.min.js?' . $hash);

        // default theme
        $document->addStyleSheet(Uri::root(true) . '/media/com_jce/editor/tinymce/themes/advanced/skins/default/ui.css?' . $hash);
        $document->addStyleSheet(Uri::root(true) . '/media/com_jce/editor/tinymce/themes/advanced/skins/default/ui_touch.css?' . $hash);
        $document->addStyleSheet(Uri::root(true) . '/media/com_jce/editor/tinymce/themes/advanced/skins/default/ui.admin.css?' . $hash);
    }

    /**
     * Add the page title and toolbar.
     *
     * @since   2.7
     */
    protected function addToolbar()
    {
        Factory::getApplication()->input->set('hidemainmenu', true);

        $user = Factory::getUser();
        $canEdit = $user->authorise('core.create', 'com_jce');

        ToolbarHelper::title(Text::_('WF_PROFILES_EDIT'), 'user');

        // For new records, check the create permission.
        if ($canEdit) {
            ToolbarHelper::apply('profile.apply');
            ToolbarHelper::save('profile.save');
            ToolbarHelper::save2new('profile.save2new');
        }

        if (empty($this->item->id)) {
            ToolbarHelper::cancel('profile.cancel');
        } else {
            ToolbarHelper::cancel('profile.cancel', 'JTOOLBAR_CLOSE');
        }

        ToolbarHelper::divider();
        ToolbarHelper::help('WF_PROFILES_EDIT');
    }
}
