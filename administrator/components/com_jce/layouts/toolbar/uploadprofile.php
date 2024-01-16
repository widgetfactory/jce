<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright     Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Language\Text;

$title = Text::_('WF_PROFILES_IMPORT_IMPORT');
?>
<joomla-toolbar-button>
    <div class="upload-profile-container">
        <input name="profile_file" accept="application/xml" type="file" />
        <button class="button-import btn btn-small btn-sm btn-outline-primary"><span class="icon-upload text-body" title="<?php echo $title; ?>"></span> <?php echo $title; ?></button>
    </div>
</joomla-toolbar-button>