<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

?>
<div class="ui-jce uk-flex">
    <nav class="uk-panel uk-panel-box uk-height-1-1">
        <?php echo $this->plugin->renderTopics(); ?>
    </nav>
    <main class="uk-panel uk-panel-box uk-height-1-1">
        <header>
            <a class="uk-button uk-button-link" data-toggle="collapse">
                <span class="uk-icon uk-icon-list"></span>
            </a>
        </header>
        <section>
            <iframe id="help-iframe" src="javascript:;" scrolling="auto" frameborder="0"></iframe>
        </section>
    </main>
</div>