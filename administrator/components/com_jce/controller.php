<?php

/**
 * @copyright     Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license       GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
// no direct access
\defined('_JEXEC') or die;

use Joomla\CMS\MVC\Controller\BaseController;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Uri\Uri;

/**
 * JCE Component Controller.
 *
 * @since 1.5
 */
class JceController extends BaseController
{
    /**
     * Permission required to open each view.
     *
     * Every screen is linked task-less as &view=x, which routes here rather than to the
     * matching controller, so the view is what has to be gated - not the controller name.
     * A null value means no jce.* permission of its own.
     *
     * The action is stated per view rather than derived from the view name: "profile"
     * needs jce.profiles, so a derived name would be wrong.
     *
     * This mirrors DisplayController::ALLOWED_VIEWS in 3.0. Delta: 3.0 names the browser
     * view "filebrowser" and accepts "browser" as an alias for it.
     *
     * @var array
     */
    private const ALLOWED_VIEWS = array(
        'cpanel' => null,
        'config' => 'jce.config',
        'profiles' => 'jce.profiles',
        'profile' => 'jce.profiles',
        'mediabox' => 'jce.mediabox',
        'browser' => 'jce.browser',
    );

    /**
     * @var string The extension for which the categories apply
     *
     * @since  1.6
     */
    protected $extension;

    /**
     * Constructor.
     *
     * @param array $config An optional associative array of configuration settings
     *
     * @see     JController
     * @since   1.5
     */
    public function __construct($config = array())
    {
        parent::__construct($config);

        // Guess the JText message prefix. Defaults to the option.
        if (empty($this->extension)) {
            $this->extension = $this->input->get('extension', 'com_jce');
        }
    }

    /**
     * Method to display a view.
     *
     * @param bool  $cachable  If true, the view output will be cached
     * @param array $urlparams An array of safe url parameters and their variable types, for valid values see {@link JFilterInput::clean()}
     *
     * @return BaseController This object to support chaining
     *
     * @since   1.5
     */
    public function display($cachable = false, $urlparams = false)
    {
        // Get the document object.
        $document = Factory::getDocument();
        $app = Factory::getApplication();
        $user = Factory::getUser();

        Factory::getLanguage()->load('com_jce', JPATH_ADMINISTRATOR);

        // Set the default view name and format from the Request.
        $vName = $app->input->get('view', 'cpanel');
        $vFormat = $document->getType();
        $lName = $app->input->get('layout', 'default');

        // legacy front-end popup view
        if ($vName === "popup") {
            // add a view path
            $this->addViewPath(JPATH_SITE . '/components/com_jce/views');
            $view = $this->getView($vName, $vFormat);

            if ($view) {
                $view->display();
            }

            return $this;
        }

        $vName = strtolower($vName);

        // An empty value means "the default view"; Input::get() returns it rather than
        // falling back to the default above.
        if ($vName === '') {
            $vName = 'cpanel';
        }

        if (!array_key_exists($vName, self::ALLOWED_VIEWS)) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        // The admin screens additionally require component management rights. In 3.0 this
        // check applies to the whole component, from ComponentDispatcher::checkAccess().
        $adminViews = array('config', 'profiles', 'profile', 'mediabox');

        if (in_array($vName, $adminViews, true) && !$user->authorise('core.manage', 'com_jce')) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        $action = self::ALLOWED_VIEWS[$vName];

        if ($action !== null && !$user->authorise($action, 'com_jce')) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        // create view
        $view = $this->getView($vName, $vFormat);

        // Get and render the view.
        if ($view) {
            // reset view name
            $vName = $view->getName();

            // Get the model for the view.
            $model = $this->getModel($vName, 'JceModel', array('name' => $vName));

            // Push the model into the view (as default).
            $view->setModel($model, true);
            $view->setLayout($lName);

            // Push document object into the view.
            $view->document = $document;

            $document->addStyleSheet(Uri::root(true) . '/media/com_jce/admin/css/global.min.css?' . md5(WF_VERSION));

            // only for Joomla 3.x
            if (version_compare(JVERSION, '4', 'lt')) {
                require_once __DIR__ . '/includes/classmap.php';
                
                JceHelperAdmin::addSubmenu($vName);

                $document->addStyleSheet(Uri::root(true) . '/media/com_jce/admin/css/compat.min.css?' . md5(WF_VERSION));
            }

            $view->display();
        }

        return $this;
    }
}
