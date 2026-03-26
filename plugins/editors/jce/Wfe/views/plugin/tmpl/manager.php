<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Language\Text;

$container = $this->getContainer();
$filebrowser = $container->getFileBrowser();
$tabs = $container->getTabs();

?>
<div class="uk-position-cover uk-browser uk-browser-<?php echo $filebrowser->getConfig('position'); ?>">
    <?php

    // render tabs and panels
    $tabs->render();

    if ($filebrowser->getConfig('position') !== 'external') {
        $filebrowser->render();
    }
    ?>
</div>
<div class="actionPanel uk-modal-footer">
    <button class="uk-button uk-button-cancel" id="cancel"><?php echo Text::_('WF_LABEL_CANCEL') ?></button>
    <button class="uk-button uk-button-refresh" id="refresh"><?php echo Text::_('WF_LABEL_REFRESH') ?></button>
    <button class="uk-button uk-button-confirm" id="insert"><?php echo Text::_('WF_LABEL_INSERT') ?></button>
</div>