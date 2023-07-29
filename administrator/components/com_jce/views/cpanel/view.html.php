<?php

// Check to ensure this file is included in Joomla!
defined('JPATH_PLATFORM') or die;

use Joomla\CMS\MVC\View\HtmlView;
use Joomla\CMS\Factory;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\HTML\Helpers\Sidebar;
use Joomla\CMS\Toolbar\ToolbarHelper;
use Joomla\CMS\Uri\Uri;

class JceViewCpanel extends HtmlView
{
    protected $icons;
    protected $state;

    /**
     * Display the view.
     */
    public function display($tpl = null)
    {
        $user = Factory::getUser();
        
        $this->state    = $this->get('State');
        $this->icons    = $this->get('Icons');
        $this->params   = ComponentHelper::getParams('com_jce');

        // Check for errors.
        if (count($errors = $this->get('Errors'))) {
            throw new GenericDataException(implode("\n", $errors), 500);
        }

        HTMLHelper::_('jquery.framework');

        $document = Factory::getDocument();
        $document->addScript(Uri::root(true) . '/media/com_jce/js/cpanel.min.js');
        $document->addStyleSheet(Uri::root(true) . '/media/com_jce/css/cpanel.min.css');

        $this->addToolbar();
        $this->sidebar = Sidebar::render();
        parent::display($tpl);
    }

    /**
     * Add the page title and toolbar.
     *
     * @since   1.6
     */
    protected function addToolbar()
    {
        $state = $this->get('State');
        $user = Factory::getUser();

        ToolbarHelper::title('JCE - ' . Text::_('WF_CPANEL'), 'home');

        Sidebar::setAction('index.php?option=com_jce&view=cpanel');

        if ($user->authorise('core.admin', 'com_jce')) {
            ToolbarHelper::preferences('com_jce');
        }
    }
}
