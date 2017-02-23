<?php

/**
 * @copyright    Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license    GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');
?>
  <form class="uk-form uk-form-horizontal" onsubmit="return false;" action="<?php echo $this->action; ?>" target="_self" method="post" enctype="multipart/form-data">
    <div id="browser">
      <nav class="uk-navbar uk-grid uk-grid-collapse uk-width-1-1">
        <div id="browser-message" class="uk-width-5-10 uk-navbar-content uk-padding-remove">
          <div id="layout-full-toggle" class="uk-button" role="button">
            <i class="uk-icon uk-icon-small uk-icon-angle-double-up"></i>
            <i class="uk-icon uk-icon-small uk-icon-angle-double-down"></i>
          </div>

          <ul class="uk-breadcrumb pathway uk-margin-remove">
            <li title="<?php echo WFText::_('WF_LABEL_HOME', 'Home'); ?>">
              <i class="uk-icon uk-icon-spinner"></i>
              <i class="uk-icon uk-icon-home"></i>
            </li>
          </ul>
        </div>
        <div id="browser-actions" class="uk-width-5-10 uk-navbar-content uk-navbar-flip uk-text-right uk-padding-remove"></div>
      </nav>

      <main class="uk-grid uk-grid-collapse uk-width-1-1 uk-position-cover uk-flex">
        <div class="uk-width-3-10">
          <div class="uk-navbar">
            <div class="uk-navbar-content uk-width-1-1 uk-text-center">
              <?php echo WFText::_('WF_LABEL_FOLDERS'); ?>
            </div>
          </div>
          <div id="browser-tree">
            <div id="tree-body" class="tree"></div>
          </div>
        </div>
        <div class="uk-flex-item-auto uk-width-4-10 uk-position-relative">
          <div class="uk-navbar">
            <div class="uk-navbar-content uk-width-1-1 uk-grid uk-grid-collapse uk-flex uk-padding-remove uk-position-relative" id="browser-list-actions">
              <!-- Check-All -->
              <div id="check-all" class="uk-width-0-10 uk-button uk-button-link">
                <!--span class="checkbox" role="checkbox" aria-checked="false"></span-->
                <input type="checkbox" />
              </div>

              <!-- Sort Extension -->
              <div class="uk-width-1-10 uk-button uk-padding-remove uk-text-left" id="sort-ext" role="button" data-sort-type="extension" aria-labelledby="sort-ext-label">
                <i class="uk-icon-sort-alpha-asc"></i>
                <i class="uk-icon-sort-alpha-desc"></i>
                <span id="sort-ext-label" class="uk-hidden"><?php echo WFText::_('WF_LABEL_EXTENSION'); ?></span>
              </div>

              <!-- Sort Name -->
              <div class="uk-flex-item-auto uk-button uk-padding-remove uk-text-left" id="sort-name" role="button" data-sort-type="string" aria-labelledby="sort-name-label">
                <i class="uk-icon-sort-alpha-asc"></i>
                <i class="uk-icon-sort-alpha-desc"></i>
                <span id="sort-name-label">&nbsp;<?php echo WFText::_('WF_LABEL_NAME'); ?></span>
              </div>

              <!-- Sort Date -->
              <div class="uk-width-2-10 uk-button uk-padding-remove uk-text-left" id="sort-date" role="button" data-sort-type="date" aria-labelledby="sort-date-label" aria-hidden="true">
                <i class="uk-icon-sort-numeric-asc"></i>
                <i class="uk-icon-sort-numeric-desc"></i>
                <span id="sort-data-label">&nbsp;<?php echo WFText::_('WF_LABEL_DATE'); ?></span>
              </div>

              <!-- Sort Size -->
              <div class="uk-width-3-10 uk-button uk-text-left" id="sort-size" role="button" data-sort-type="number" aria-labelledby="sort-size-label" aria-hidden="true">
                <i class="uk-icon-sort-numeric-asc"></i>
                <i class="uk-icon-sort-numeric-desc"></i>
                <span id="sort-size-label">&nbsp;<?php echo WFText::_('WF_LABEL_SIZE'); ?></span>
              </div>

              <div class="uk-padding-remove uk-text-right uk-position-top-right">
                <!-- Toggle Details -->
                <div class="uk-button uk-active" id="show-details" role="button">
                  <i class="uk-icon-columns details"></i>
                </div>
                <!-- Search -->
                <div class="uk-button" id="show-search" role="button">
                  <i class="uk-icon-search"></i>
                </div>
              </div>

              <div id="searchbox" class="uk-form-icon uk-form-icon-flip uk-hidden uk-flex-item-auto uk-position-absolute uk-position-top" role="popup">
                <input type="search" id="search" class="uk-width-1-1" />
                <i class="uk-icon uk-icon-close"></i>
              </div>
            </div>
          </div>

          <div id="browser-list"></div>

          <div id="browser-list-limit" class="uk-navbar">
            <div class="uk-width-1-1 uk-grid uk-grid-collapse">
              <ul class="limit-left uk-pagination uk-pagination-left uk-width-1-4">
                <li class="limit-left-end uk-invisible" role="button">
                  <a href=""><i class="uk-icon-fast-backward"></i></a>
                </li>
                <li class="limit-left uk-invisible" role="button">
                  <a href=""><i class="uk-icon-backward"></i></a>
                </li>
              </ul>
              <div class="limit-text uk-navbar-content uk-width-2-4">
                <label for="browser-list-limit-select" class="uk-margin-small-right">
                  <?php echo WFText::_('WF_LABEL_SHOW'); ?>
                </label>
                <select id="browser-list-limit-select" class="uk-form-small">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="all">
                    <?php echo WFText::_('WF_OPTION_ALL'); ?>
                  </option>
                </select>
              </div>
              <ul class="limit-right uk-pagination uk-pagination-right uk-width-1-4">
                <li class="limit-right uk-invisible" role="button">
                  <a href=""><i class="uk-icon-forward"></i></a>
                </li>
                <li class="limit-right-end uk-invisible" role="button">
                  <a href=""><i class="uk-icon-fast-forward"></i></a>
                </li>
              </ul>
            </div>
          </div>

        </div>

        <div class="uk-width-3-10 uk-position-relative">
          <div class="uk-navbar">
            <div class="uk-navbar-content uk-width-1-1 uk-text-center">
              <?php echo WFText::_('WF_LABEL_DETAILS'); ?>
            </div>
          </div>
          <div id="browser-details-container" class="uk-grid uk-grid-collapse uk-flex">
            <div id="browser-details" class="uk-width-8-10 uk-flex-item-auto">
              <div id="browser-details-text"></div>
              <div id="browser-details-comment"></div>
            </div>

            <div id="browser-buttons" class="uk-text-center"></div>
          </div>
          <div id="browser-details-nav" class="uk-navbar">
            <div class="uk-navbar-content uk-width-1-1 uk-padding-remove">
              <ul class="uk-pagination uk-width-1-1 uk-display-block uk-align-left">
                <li class="details-nav-left uk-pagination-previous uk-invisible uk-width-1-10" role="button">
                  <a href=""><i class="uk-icon-backward"></i></a>
                </li>
                <li class="uk-navbar-center details-nav-text uk-width-7-10"></li>
                <li class="details-nav-right uk-pagination-next uk-invisible uk-width-1-10" role="button">
                  <a href=""><i class="uk-icon-forward"></i></a>
                </li>
              </ul>
            </div>
          </div>
        </div>
    </div>
    </main>
    <input type="hidden" name="<?php echo WFToken::getToken(); ?>" value="1" />
  </form>