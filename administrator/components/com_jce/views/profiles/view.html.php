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
use Joomla\CMS\HTML\Helpers\Sidebar;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\FileLayout;
use Joomla\CMS\MVC\View\HtmlView;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Table\Table;
use Joomla\CMS\Toolbar\Toolbar;
use Joomla\CMS\Toolbar\ToolbarHelper;
use Joomla\CMS\Uri\Uri;

class JceViewProfiles extends HtmlView
{
    protected $items;
    protected $pagination;
    protected $state;

    protected function isEmpty()
    {
        // Create a new query object.
        $db = Factory::getDbo();
        $query = $db->getQuery(true);

        // Select the required fields from the table.
        $query->select('COUNT(id)')->from($db->quoteName('#__wf_profiles'));

        $db->setQuery($query);

        return $db->loadResult() == 0;
    }

    /**
     * Display the view.
     */
    public function display($tpl = null)
    {
        $this->items = $this->get('Items');
        $this->pagination = $this->get('Pagination');
        $this->state = $this->get('State');
        $this->filterForm = $this->get('FilterForm');
        $this->activeFilters = $this->get('ActiveFilters');

        $this->params = ComponentHelper::getParams('com_jce');

        // Check for errors.
        if (count($errors = $this->get('Errors'))) {
            throw new Exception(implode("\n", $errors), 500);
        }

        if ($this->isEmpty()) {
            $link = HTMLHelper::link('index.php?option=com_jce&task=profiles.repair&' . Session::getFormToken() . '=1', Text::_('WF_DB_CREATE_RESTORE'), array('class' => 'wf-profiles-repair'));
            Factory::getApplication()->enqueueMessage(Text::_('WF_DB_PROFILES_ERROR') . ' - ' . $link, 'error');
        }

        HTMLHelper::_('jquery.framework');

        // only in Joomla 3.x
        if (version_compare(JVERSION, '4', 'lt')) {
            HTMLHelper::_('formbehavior.chosen', 'select');
        }

        $document = Factory::getDocument();
        $document->addScript(Uri::root(true) . '/media/com_jce/admin/js/profiles.min.js');
        $document->addStyleSheet(Uri::root(true) . '/media/com_jce/admin/css/profiles.min.css');

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

        ToolbarHelper::title('JCE - ' . Text::_('WF_PROFILES'), 'users');

        $bar = ToolBar::getInstance('toolbar');

        if ($user->authorise('jce.profiles', 'com_jce')) {
            ToolbarHelper::addNew('profile.add');
            ToolbarHelper::custom('profiles.copy', 'copy', 'copy', 'WF_PROFILES_COPY', true);

            // Instantiate a new JLayoutFile instance and render the layout
            $layout = new FileLayout('toolbar.uploadprofile');
            $bar->appendButton('Custom', $layout->render(array()), 'upload');

            ToolbarHelper::custom('profiles.export', 'download', 'download', 'WF_PROFILES_EXPORT', true);

            ToolbarHelper::publish('profiles.publish', 'JTOOLBAR_PUBLISH', true);
            ToolbarHelper::unpublish('profiles.unpublish', 'JTOOLBAR_UNPUBLISH', true);

            ToolbarHelper::deleteList('', 'profiles.delete', 'JTOOLBAR_DELETE');
        }

        Sidebar::setAction('index.php?option=com_jce&view=profiles');

        if ($user->authorise('core.admin', 'com_jce')) {
            ToolbarHelper::preferences('com_jce');
        }
    }

    /**
     * Returns an array of fields the table can be sorted by.
     *
     * @return array Array containing the field name to sort by as the key and display text as value
     *
     * @since   3.0
     */
    protected function getSortFields()
    {
        return array(
            'ordering' => Text::_('JGRID_HEADING_ORDERING'),
            'name' => Text::_('JGLOBAL_TITLE'),
            'published' => Text::_('JSTATUS'),
            'id' => Text::_('JGRID_HEADING_ID'),
        );
    }
}
