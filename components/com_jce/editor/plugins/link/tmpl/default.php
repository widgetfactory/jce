<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

 defined('JPATH_PLATFORM') or die;

 use Joomla\CMS\Factory;
 use Joomla\CMS\Language\Text;
 use Joomla\CMS\Session\Session;

$tabs = WFTabs::getInstance();

?>
<form action="#" class="uk-form uk-form-horizontal">
	<!-- Render Tabs -->
	<?php $tabs->render(); ?>
	<!-- Token -->	
	<input type="hidden" id="token" name="<?php echo Session::getFormToken(); ?>" value="1" />
</form>
<div class="actionPanel">
	<button class="button" id="cancel"><?php echo Text::_('WF_LABEL_CANCEL')?></button>
	<button class="button" id="help"><?php echo Text::_('WF_LABEL_HELP')?></button>
	<button class="button" id="insert"><?php echo Text::_('WF_LABEL_INSERT')?></button>
</div>