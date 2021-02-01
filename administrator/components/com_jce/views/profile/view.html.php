<?php

/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

class JceViewProfile extends JViewLegacy
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

        $params = JComponentHelper::getParams('com_jce');

        if ($params->get('inline_help', 1)) {
            $this->formclass .= ' form-help-inline';
        }

        $this->plugins = $this->get('Plugins');
        $this->rows = $this->get('Rows');
        $this->available = $this->get('AvailableButtons');
        $this->additional = $this->get('AdditionalPlugins');

        // load language files
        $language = JFactory::getLanguage();
        $language->load('com_jce', JPATH_SITE);
        $language->load('com_jce_pro', JPATH_SITE);

        // set JLayoutHelper base path
        JLayoutHelper::$defaultBasePath = JPATH_COMPONENT_ADMINISTRATOR;

        // Check for errors.
        if (count($errors = $this->get('Errors'))) {
            JError::raiseError(500, implode("\n", $errors));

            return false;
        }

        $this->addToolbar();
        parent::display($tpl);

        // only in Joomla 3.x
        if (version_compare(JVERSION, '4', 'lt')) {
            JHtml::_('formbehavior.chosen', 'select');
        }

        // version hash
        $hash = md5(WF_VERSION);

        $document = JFactory::getDocument();
        $document->addStyleSheet('components/com_jce/media/css/profile.min.css?' . $hash);
        $document->addStyleSheet(JURI::root(true) . '/components/com_jce/editor/libraries/vendor/jquery/css/jquery-ui.min.css?' . $hash);

        $document->addScript(JURI::root(true) . '/components/com_jce/editor/libraries/vendor/jquery/js/jquery-ui.min.js?' . $hash);

        $document->addScript('components/com_jce/media/js/core.min.js?' . $hash);
        $document->addScript('components/com_jce/media/js/profile.min.js?' . $hash);

        // default theme
        $document->addStyleSheet(JURI::root(true) . '/components/com_jce/editor/tiny_mce/themes/advanced/skins/default/ui.admin.css?' . $hash);
    }

    /**
     * Add the page title and toolbar.
     *
     * @since   2.7
     */
    protected function addToolbar()
    {
        JFactory::getApplication()->input->set('hidemainmenu', true);

        $user       = JFactory::getUser();
        $canEdit    = $user->authorise('core.create', 'com_jce');

        JToolbarHelper::title(JText::_('WF_PROFILES_EDIT'), 'user');

        // For new records, check the create permission.
        if ($canEdit) {
            JToolbarHelper::apply('profile.apply');
            JToolbarHelper::save('profile.save');
            JToolbarHelper::save2new('profile.save2new');
        }

        if (empty($this->item->id)) {
            JToolbarHelper::cancel('profile.cancel');
        } else {
            JToolbarHelper::cancel('profile.cancel', 'JTOOLBAR_CLOSE');
        }

        JToolbarHelper::divider();
        JToolbarHelper::help('WF_PROFILES_EDIT');
    }
}
