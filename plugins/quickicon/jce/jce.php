<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die;

/**
 * JCE File Browser Quick Icon plugin.
 *
 * @since		2.1
 */
class plgQuickiconJce extends JPlugin
{
    public function __construct(&$subject, $config)
    {
        parent::__construct($subject, $config);

        $app = JFactory::getApplication();

        // only in Admin and only if the component is enabled
        if ($app->isSite() || JComponentHelper::getComponent('com_jce', true)->enabled === false) {
            return;
        }

        $this->loadLanguage();
    }

    public function onGetIcons($context)
    {
        @include_once JPATH_ADMINISTRATOR.'/components/com_jce/models/model.php';

        // check for class to prevent fatal errors
        if (!class_exists('WFModel')) {
            return;
        }

        if ($context != $this->params->get('context', 'mod_quickicon') || WFModel::authorize('browser') === false) {
            return;
        }

        $document = JFactory::getDocument();
        $language = JFactory::getLanguage();

        $language->load('com_jce', JPATH_ADMINISTRATOR);

        $width = $this->params->get('width', 780);
        $height = $this->params->get('height', 560);
        $filter = $this->params->get('filter', '');

        JHtml::_('behavior.modal');

        $document->addScriptDeclaration("
    		window.addEvent('domready', function() {
    			SqueezeBox.assign($$('#plg_quickicon_jce a'), {
    				handler: 'iframe', size: {x: " .$width.', y: '.$height.'}
    			});
    		});'
        );

        require_once JPATH_ADMINISTRATOR.'/components/com_jce/helpers/browser.php';

        $version = new JVersion();
        $icon = $version->isCompatible('3.0') ? 'pictures' : 'header/icon-48-media.png';

        $link = WFBrowserHelper::getBrowserLink('', $filter);

        if ($link) {
            return array(array(
                'link' => $link,
                'image' => $icon,
                'icon' => 'pictures',
                'access' => array('jce.browser', 'com_jce'),
                'text' => JText::_('PLG_QUICKICON_JCE_TITLE'),
                'id' => 'plg_quickicon_jce',
            ));
        }

        return array();
    }
}
