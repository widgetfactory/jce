<?php
/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

// no direct access
defined('_JEXEC') or die('Restricted access');

$app = JFactory::getApplication();

// only in Admin and only if the component is enabled
if ($app->isSite() || JComponentHelper::getComponent('com_jce', true)->enabled === false) {
    return;
}

@include_once(JPATH_ADMINISTRATOR . '/components/com_jce/models/model.php');

// check for class to prevent fatal errors and authorize
if (!class_exists('WFModel') || WFModel::authorize('browser') === false) {
    return;
}

JHtml::_('behavior.modal');

require_once(JPATH_ADMINISTRATOR . '/components/com_jce/helpers/browser.php');

$language = JFactory::getLanguage();

$language->load('com_jce', JPATH_ADMINISTRATOR);

$document = JFactory::getDocument();
$document->addStyleSheet('components/com_jce/media/css/module.css');

$module = JModuleHelper::getModule('mod_jcefilebrowser');

$width = 800;
$height = 600;
$filter = '';

if ($module) {
    $params = new JParameter($module->params);
    $width = $params->get('width', 800);
    $height = $params->get('height', 600);
    $filter = $params->get('filter', '');
}

$float = $language->isRTL() ? 'right' : 'left';
$link = WFBrowserHelper::getBrowserLink('', $filter);

// if no link given, no output
if (empty($link)) {
	return;
}

?>
<div id="cpanel">
    <div class="icon-wrapper" style="float:<?php echo $float; ?>;">
        <div class="icon">
            <a class="modal" rel="{handler: 'iframe', size: {x: <?php echo $width; ?>, y: <?php echo $height; ?>}}" href="<?php echo $link; ?>">
                <span class="jce-file-browser"></span>
                <span><?php echo JText::_('WF_QUICKICON_BROWSER'); ?></span>
            </a>
        </div>
    </div>
</div>