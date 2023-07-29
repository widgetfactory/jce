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

class JceViewBrowser extends HtmlView
{
    protected $icons;
    protected $state;

    /**
     * Display the view.
     */
    public function display($tpl = null)
    {
        if (!PluginHelper::isEnabled('quickicon', 'jce')) {
            Factory::getApplication()->redirect('index.php?option=com_jce');
        }
        
        $user = Factory::getUser();
        
        $this->state    = $this->get('State');
        $this->params   = ComponentHelper::getParams('com_jce');

        // Check for errors.
        if (count($errors = $this->get('Errors'))) {
            throw new GenericDataException(implode("\n", $errors), 500);
        }

        HTMLHelper::_('jquery.framework');

        $document = Factory::getDocument();
        $document->addStyleSheet(Uri::root(true) . '/media/com_jce/css/browser.min.css');

        $this->addToolbar();

        if (Factory::getApplication()->input->getInt('sidebar', 1) == 1) {
            $this->sidebar = Sidebar::render();
        }

        parent::display($tpl);
    }

    /**
     * Add the page title and toolbar.
     *
     * @since   1.6
     */
    protected function addToolbar()
    {
        ToolbarHelper::title('JCE - ' . Text::_('WF_BROWSER_TITLE'), 'picture');
        Sidebar::setAction('index.php?option=com_jce&view=browser');
    }
}
