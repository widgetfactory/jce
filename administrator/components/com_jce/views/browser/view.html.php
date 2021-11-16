<?php

// Check to ensure this file is included in Joomla!
defined('JPATH_PLATFORM') or die;

class JceViewBrowser extends JViewLegacy
{
    protected $icons;
    protected $state;

    /**
     * Display the view.
     */
    public function display($tpl = null)
    {
        if (!JPluginHelper::isEnabled('quickicon', 'jce')) {
            JFactory::getApplication()->redirect('index.php?option=com_jce');
        }
        
        $user = JFactory::getUser();
        
        $this->state    = $this->get('State');
        $this->params   = JComponentHelper::getParams('com_jce');

        // Check for errors.
        if (count($errors = $this->get('Errors'))) {
            JError::raiseError(500, implode("\n", $errors));

            return false;
        }

        JHtml::_('jquery.framework');

        $document = JFactory::getDocument();
        $document->addStyleSheet(JURI::root(true) . '/media/com_jce/css/browser.min.css');

        $this->addToolbar();

        if (JFactory::getApplication()->input->getInt('sidebar', 1) == 1) {
            $this->sidebar = JHtmlSidebar::render();
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
        JToolbarHelper::title('JCE - ' . JText::_('WF_BROWSER_TITLE'), 'picture');
        JHtmlSidebar::setAction('index.php?option=com_jce&view=browser');
    }
}
