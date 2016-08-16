<?php

/**
 * @package    JCE
 * @copyright    Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license    GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

defined('_JEXEC') or die('RESTRICTED');
?>
<form class="ui-form ui-form-horizontal" onsubmit="return false;" action="<?php echo $this->action; ?>" target="_self"
      method="post" enctype="multipart/form-data">
    <div id="browser">
        <nav class="ui-navbar ui-grid ui-grid-collapse ui-width-1-1">
            <div id="browser-message" class="ui-width-5-10 ui-navbar-content">
                  <div id="layout-full-toggle" class="ui-button" role="button">
                    <i class="ui-icon ui-icon-small ui-icon-angle-double-up"></i>
                    <i class="ui-icon ui-icon-small ui-icon-angle-double-down"></i>
                  </div>

                  <ul class="ui-breadcrumb pathway ui-margin-remove">
                    <li title="<?php echo WFText::_('WF_LABEL_HOME', 'Home'); ?>">
                      <i class="ui-icon ui-icon-spinner"></i>
                      <i class="ui-icon ui-icon-home"></i>
                    </li>
                  </ul>
            </div>
            <div id="browser-actions" class="ui-width-5-10 ui-navbar-content ui-navbar-flip ui-text-right ui-padding-remove"></div>
        </nav>

        <main class="ui-grid ui-grid-collapse ui-width-1-1 ui-position-cover ui-flex">
            <div class="ui-width-3-10">
                <div class="ui-navbar">
                    <div class="ui-navbar-content ui-navbar-center"><?php echo WFText::_('WF_LABEL_FOLDERS'); ?></div>
                </div>
                <div id="browser-tree">
                    <div id="tree-body" class="tree"></div>
                </div>
            </div>
            <div class="ui-flex-item-auto ui-position-relative">
                <div class="ui-navbar">
                    <div class="ui-navbar-content ui-width-1-1 ui-grid ui-grid-collapse ui-flex ui-padding-remove ui-position-relative" id="browser-list-actions">
                            <!-- Check-All -->
                            <div id="check-all" class="ui-width-0-10 ui-button ui-button-link">
                                <!--span class="checkbox" role="checkbox" aria-checked="false"></span-->
                                <input type="checkbox" />
                            </div>

                            <!-- Sort Extension -->
                            <div class="ui-width-1-10 ui-button ui-padding-remove ui-text-left" id="sort-ext" role="button" data-sort-type="extension" aria-labelledby="sort-ext-label">
                                <i class="ui-icon-sort-alpha-asc"></i>
                                <i class="ui-icon-sort-alpha-desc"></i>
                                <span id="sort-ext-label" class="ui-hidden"><?php echo WFText::_('WF_LABEL_EXTENSION'); ?></span>
                            </div>

                            <!-- Sort Name -->
                            <div class="ui-flex-item-auto ui-button ui-padding-remove ui-text-left" id="sort-name" role="button" data-sort-type="string" aria-labelledby="sort-name-label">
                                <i class="ui-icon-sort-alpha-asc"></i>
                                <i class="ui-icon-sort-alpha-desc"></i>
                                <span id="sort-name-label">&nbsp;<?php echo WFText::_('WF_LABEL_NAME'); ?></span>
                            </div>

                            <!-- Sort Date -->
                            <div class="ui-width-2-10 ui-button ui-padding-remove ui-text-left" id="sort-date" role="button" data-sort-type="date" aria-labelledby="sort-date-label"
                                 aria-hidden="true">
                                <i class="ui-icon-sort-numeric-asc"></i>
                                <i class="ui-icon-sort-numeric-desc"></i>
                                <span id="sort-data-label">&nbsp;<?php echo WFText::_('WF_LABEL_DATE'); ?></span>
                            </div>

                            <!-- Sort Size -->
                            <div class="ui-width-3-10 ui-button ui-padding-remove ui-text-left" id="sort-size" role="button" data-sort-type="number" aria-labelledby="sort-size-label"
                                 aria-hidden="true">
                                <i class="ui-icon-sort-numeric-asc"></i>
                                <i class="ui-icon-sort-numeric-desc"></i>
                                <span id="sort-size-label">&nbsp;<?php echo WFText::_('WF_LABEL_SIZE'); ?></span>
                            </div>

                            <div class="ui-padding-remove ui-text-right ui-position-top-right">
                                <!-- Toggle Details -->
                                <div class="ui-button ui-active" id="show-details" role="button">
                                    <i class="ui-icon-columns details"></i>
                                </div>
                                <!-- Search -->
                                <div class="ui-button" id="show-search" role="button">
                                    <i class="ui-icon-search"></i>
                                </div>
                            </div>

                            <div id="searchbox" class="ui-form-icon ui-form-icon-flip ui-hidden ui-flex-item-auto ui-position-absolute ui-position-top" role="popup">
                                <input type="search" id="search" class="ui-width-1-1" />
                                <i class="ui-icon ui-icon-close"></i>
                            </div>
                        </div>
                </div>

                <div id="browser-list"></div>

                <div id="browser-list-limit" class="ui-navbar">
                    <div class="ui-width-1-1 ui-grid ui-grid-collapse">
                        <ul class="limit-left ui-pagination ui-pagination-left ui-width-1-4">
                            <li class="limit-left-end ui-hidden" role="button">
                              <a href=""><i class="ui-icon-fast-backward"></i></a>
                            </li>
                            <li class="limit-left ui-hidden" role="button">
                                <a href=""><i class="ui-icon-backward"></i></a>
                            </li>
                        </ul>
                        <div class="limit-text ui-navbar-content ui-width-2-4">
                            <label for="browser-list-limit-select"
                                   class="ui-margin-small-right"><?php echo WFText::_('WF_LABEL_SHOW'); ?></label>
                            <select id="browser-list-limit-select" class="ui-form-small">
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                                <option value="all"><?php echo WFText::_('WF_OPTION_ALL'); ?></option>
                            </select>
                        </div>
                        <ul class="limit-right ui-pagination ui-pagination-right ui-width-1-4">
                            <li class="limit-right ui-hidden" role="button">
                                <a href=""><i class="ui-icon-forward"></i></a>
                            </li>
                            <li class="limit-right-end ui-hidden" role="button">
                                <a href=""><i class="ui-icon-fast-forward"></i></a>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>

            <div class="ui-width-3-10 ui-position-relative">
                <div class="ui-navbar">
                    <div class="ui-navbar-content ui-navbar-center"><?php echo WFText::_('WF_LABEL_DETAILS'); ?></div>
                </div>
                <div id="browser-details-container" class="ui-grid ui-grid-collapse ui-flex">
                    <div id="browser-details" class="ui-flex-item-auto">
                        <div id="browser-details-text"></div>
                        <div id="browser-details-comment"></div>
                    </div>

                    <div id="browser-buttons" class="ui-text-center"></div>
                </div>
                <div id="browser-details-nav" class="ui-navbar">
                    <div class="ui-navbar-content ui-width-1-1 ui-padding-remove">
                        <ul class="ui-pagination ui-width-1-1 ui-display-block ui-align-left">
                            <li class="details-nav-left ui-pagination-previous ui-invisible ui-width-1-10" role="button">
                                <a href=""><i class="ui-icon-backward"></i></a>
                            </li>
                            <li class="ui-navbar-center details-nav-text ui-width-7-10"></li>
                            <li class="details-nav-right ui-pagination-next ui-invisible ui-width-1-10" role="button">
                                <a href=""><i class="ui-icon-forward"></i></a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
    </div>
    </main>
    <input type="hidden" name="<?php echo WFToken::getToken(); ?>" value="1"/>
</form>
