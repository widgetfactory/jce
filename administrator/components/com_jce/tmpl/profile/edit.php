<?php
/**
 * @package     Wfe.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (C) 2009 - 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_SITE') or die;

use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Router\Route;

/** @var \Joomla\Component\Banners\Administrator\View\Banner\HtmlView $this */

/** @var Joomla\CMS\WebAsset\WebAssetManager $wa */
$wa = $this->getDocument()->getWebAssetManager();
$wa->useScript('keepalive')
    ->useScript('form.validate');

$wa->useScript('com_jce.profile.script')
	->useStyle('com_jce.profile.style');

// load editor skin for button and toolbar styling
$wa->registerAndUseStyle('com_jce.skin.admin.default', 'media/plg_editors_jce/tinymce/themes/core/skins/default/ui.admin.css')
	->registerAndUseStyle('com_jce.skin.admin.modern', 'media/plg_editors_jce/tinymce/themes/core/skins/modern/ui.admin.css');

?>
<div class="jce-ui loading">
	<div class="donut"></div>
	<form action="<?php echo Route::_('index.php?option=com_jce'); ?>" id="application-form" method="post" name="adminForm" class="main-card form-validate">

		<div class="main-card p-3" id="profile-data">
			<div class="row row-fluid">
					<!-- Begin Content -->
					<div class="col-md-12">
						<?php echo HTMLHelper::_('uitab.startTabSet', 'profile', array('active' => 'profile-setup')); ?>

						<?php foreach (array('setup', 'features', 'editor', 'plugins') as $item): ?>
							<?php echo HTMLHelper::_('uitab.addTab', 'profile', 'profile-' . $item, Text::_('WF_PROFILES_' . strtoupper($item), true)); ?>

							<div class="row-fluid">
								<?php echo $this->loadTemplate($item); ?>
							</div>

							<?php echo HTMLHelper::_('uitab.endTab'); ?>
						<?php endforeach;?>

						<?php echo HTMLHelper::_('uitab.endTabSet'); ?>
					</div>
					<!-- End Content -->
			</div>
		</div>

		<input type="hidden" name="task" value="" />
		<input type="hidden" name="id" value="<?php echo $this->item->id; ?>" />
		<?php echo HTMLHelper::_('form.token'); ?>
	</form>
</div>