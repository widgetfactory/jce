<?php

/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die('RESTRICTED');
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