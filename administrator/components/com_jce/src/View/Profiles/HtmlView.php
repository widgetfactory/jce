<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (C) 2009 - 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\View\Profiles;

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\FileLayout;
use Joomla\CMS\MVC\View\GenericDataException;
use Joomla\CMS\MVC\View\HtmlView as BaseHtmlView;
use Joomla\CMS\Router\Route;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Toolbar\Toolbar;
use Joomla\CMS\Toolbar\ToolbarHelper;
use Joomla\CMS\Toolbar\ToolbarFactoryInterface;

/**
 * View class for a list of releases.
 *
 * @since  1.5
 */
class HtmlView extends BaseHtmlView
{
    /**
     * An array of items
     *
     * @var  array
     */
    protected $items;

    /**
     * The pagination object
     *
     * @var  \Joomla\CMS\Pagination\Pagination
     */
    protected $pagination;

    /**
     * The model state
     *
     * @var  \Joomla\CMS\Object\CMSObject
     */
    protected $state;

    /**
     * Form object for search filters
     *
     * @var  \Joomla\CMS\Form\Form
     */
    public $filterForm;

    /**
     * The active search filters
     *
     * @var  array
     */
    public $activeFilters;

    /**
     * Is this view an Empty State
     *
     * @var  boolean
     * @since 4.0.0
     */
    private $isEmptyState = false;

    /**
     * Display the view.
     *
     * @param   string  $tpl  The name of the template file to parse; automatically searches through the template paths.
     *
     * @return  mixed  A string if successful, otherwise an Error object.
     */
    public function display($tpl = null)
    {
        $this->state = $this->get('State');
        $this->items = $this->get('Items');
        $this->pagination = $this->get('Pagination');
        $this->filterForm = $this->get('FilterForm');
        $this->activeFilters = $this->get('ActiveFilters');

        // Check for errors.
        if (count($errors = $this->get('Errors'))) {
            throw new GenericDataException(implode("\n", $errors), 500);
        }

        if (!\count($this->items)) {
            $link = HTMLHelper::link(Route::_('index.php?option=com_jce&task=profiles.repair&' . Session::getFormToken() . '=1'), Text::_('WF_DB_CREATE_RESTORE'), array('class' => 'wf-profiles-repair'));
            Factory::getApplication()->enqueueMessage(Text::_('WF_DB_PROFILES_ERROR') . ' - ' . $link, 'error');
        }

        // We don't need toolbar in the modal layout.
        if ($this->getLayout() !== 'modal') {
            $this->addToolbar();
        }

        parent::display($tpl);
    }

    /**
     * Add the page title and toolbar.
     *
     * @return  void
     *
     * @since   1.6
     */
    protected function addToolbar()
    {
        $user = Factory::getApplication()->getIdentity();

        ToolbarHelper::title('JCE - ' . Text::_('WF_PROFILES'), 'users');

        $document = $this->getDocument();

        if (method_exists($document, 'getToolbar')) {
            $toolbar = $document->getToolbar();
        } else {
            $toolbar = Toolbar::getInstance('toolbar');
        }

        if ($user->authorise('jce.profiles', 'com_jce')) {
            $toolbar->addNew('profile.add');
            ToolbarHelper::custom('profiles.copy', 'copy', 'copy', 'WF_PROFILES_COPY', true);

            // Instantiate a new JLayoutFile instance and render the layout
            $layout = new FileLayout('toolbar.uploadprofile');
            $toolbar->appendButton('Custom', $layout->render(array()), 'upload');

            ToolbarHelper::custom('profiles.export', 'download', 'download', 'WF_PROFILES_EXPORT', true);

            $toolbar->publish('plugins.publish', 'JTOOLBAR_ENABLE')->listCheck(true);
            $toolbar->unpublish('plugins.unpublish', 'JTOOLBAR_DISABLE')->listCheck(true);

            $toolbar->delete('profiles.delete')
                ->message('JGLOBAL_CONFIRM_DELETE')
                ->listCheck(true);
        }

        $toolbar->preferences('com_jce');
    }
}
