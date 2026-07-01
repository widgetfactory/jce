<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\View\Profiles;

defined('_JEXEC') or die;

use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\FileLayout;
use Joomla\CMS\MVC\View\GenericDataException;
use Joomla\CMS\MVC\View\HtmlView as BaseHtmlView;
use Joomla\CMS\Router\Route;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Toolbar\ToolbarHelper;

/**
 * View class for a list of profiles.
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
     * Display the view.
     *
     * @param   string  $tpl  The name of the template file to parse; automatically searches through the template paths.
     *
     * @return  mixed  A string if successful, otherwise an Error object.
     */
    public function display($tpl = null)
    {
        $model = $this->getModel();

        $this->items         = $model->getItems();
        $this->pagination    = $model->getPagination();
        $this->state         = $model->getState();
        $this->filterForm    = $model->getFilterForm();
        $this->activeFilters = $model->getActiveFilters();

        // Check for errors.
        if (count($errors = $this->get('Errors'))) {
            throw new GenericDataException(implode("\n", $errors), 500);
        }

        if (!\count($this->items)) {
            $link = HTMLHelper::link(Route::_('index.php?option=com_jce&task=profiles.repair&' . Session::getFormToken() . '=1'), Text::_('WF_DB_CREATE_RESTORE'), ['class' => 'wf-profiles-repair']);
            $this->app->enqueueMessage(Text::_('WF_DB_PROFILES_ERROR') . ' - ' . $link, 'error');
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
        $user = $this->getCurrentUser();

        ToolbarHelper::title('JCE - ' . Text::_('WF_PROFILES'), 'users');

        $toolbar = $this->getDocument()->getToolbar();

        if ($user->authorise('jce.profiles', 'com_jce')) {
            $toolbar->addNew('profile.add');
            ToolbarHelper::custom('profiles.copy', 'copy', 'copy', 'WF_PROFILES_COPY', true);

            // Instantiate a new JLayoutFile instance and render the layout
            $layout = new FileLayout('toolbar.uploadprofile');
            $toolbar->appendButton('Custom', $layout->render([]), 'upload');

            ToolbarHelper::custom('profiles.export', 'download', 'download', 'WF_PROFILES_EXPORT', true);

            $toolbar->publish('profiles.publish', 'JTOOLBAR_ENABLE')->listCheck(true);
            $toolbar->unpublish('profiles.unpublish', 'JTOOLBAR_DISABLE')->listCheck(true);

            $toolbar->delete('profiles.delete')
                ->message('JGLOBAL_CONFIRM_DELETE')
                ->listCheck(true);
        }

        $toolbar->preferences('com_jce');
    }
}
