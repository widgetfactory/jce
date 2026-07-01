<?php
/**
 * @package     Wfe.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_SITE') or die; 

use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Router\Route;

/** @var Joomla\CMS\WebAsset\WebAssetManager $wa */
$wa = $this->document->getWebAssetManager();
$wa->useScript('keepalive')
    ->useScript('form.validate');

$wa->useScript('com_jce.core.script')
    ->useStyle('com_jce.core.style');
?>

<form action="<?php echo Route::_('index.php?option=com_jce'); ?>" id="application-form" method="post" name="adminForm" class="main-card form-validate">
    <div class="jce-ui row card-body p-4">
        <div class="col-md-12">
            <?php echo LayoutHelper::render('joomla.content.options_default', $this, JPATH_ADMINISTRATOR . '/components/com_jce'); ?>
        </div>
        <input type="hidden" name="view" value="config" />
        <input type="hidden" name="task" value="" />
        <?php echo HTMLHelper::_('form.token'); ?>
    </div>
</form>