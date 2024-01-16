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

;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Router\Route;

// Load tooltips behavior
HTMLHelper::_('behavior.formvalidator');
HTMLHelper::_('behavior.keepalive');

// Load JS message titles
Text::script('ERROR');
Text::script('WARNING');
Text::script('NOTICE');
Text::script('MESSAGE');

?>
<div class="ui-jce loading">
	<div class="donut"></div>
	<form action="<?php echo Route::_('index.php?option=com_jce'); ?>" id="adminForm" method="post" name="adminForm" class="form-validate">

	<?php if (!empty($this->sidebar)): ?>
		<div id="j-sidebar-container" class="span2">
			<?php echo $this->sidebar; ?>
		</div>
		<div id="j-main-container" class="span10">
	<?php else: ?>
		<div id="j-main-container">
	<?php endif;?>

			<div class="row row-fluid">
					<!-- Begin Content -->
					<div class="span12 col-md-12">
						<?php echo HTMLHelper::_('bootstrap.startTabSet', 'profile', array('active' => 'profile-setup')); ?>
						<?php foreach (array('setup', 'features', 'editor', 'plugins') as $item): ?>
							<?php echo HTMLHelper::_('bootstrap.addTab', 'profile', 'profile-' . $item, Text::_('WF_PROFILES_' . strtoupper($item), true)); ?>

							<div class="row-fluid">
								<?php echo $this->loadTemplate($item); ?>
							</div>

							<?php echo HTMLHelper::_('bootstrap.endTab'); ?>
						<?php endforeach;?>

						<?php echo HTMLHelper::_('bootstrap.endTabSet'); ?>
					</div>
					<!-- End Content -->
			</div>
			<input type="hidden" name="task" value="" />
			<input type="hidden" name="id" value="<?php echo $this->item->id; ?>" />
			<?php echo HTMLHelper::_('form.token'); ?>
		</div>
	</form>
</div>