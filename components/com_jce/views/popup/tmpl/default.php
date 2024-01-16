<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Language\Text;
use Joomla\CMS\Uri\Uri;

?>
<style type="text/css">
    /* Reset template style sheet */
    body{margin:0;padding:0;}div{margin:0;padding:0;}img{margin:0;padding:0;}
</style>
<div id="wf_popup_image">
    <?php if ($this->features['mode']) {
    ?>
        <div class="contentheading"><?php echo $this->features['title']; ?></div>
    <?php 
} ?>
    <?php if ($this->features['mode'] && $this->features['print']) {
    ?>
        <div class="buttonheading"><a href="javascript:;" onClick="window.print();
                return false"><img src="<?php echo Uri::root(); ?>media/com_jce/img/print.png" width="16" height="16" alt="<?php echo Text::_('Print'); ?>" title="<?php echo Text::_('Print'); ?>" /></a></div>
<?php 
} ?>
    <div><img src="<?php echo $this->features['img']; ?>" width="<?php echo $this->features['width']; ?>" height="<?php echo $this->features['height']; ?>" alt="<?php echo $this->features['alt']; ?>" onclick="window.close();" /></div>
</div>