<?php

/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
class WFStyleselectPluginConfig {

    public static function getConfig(&$settings) {
        wfimport('admin.models.editor');
        $model = new WFModelEditor();
        $wf = WFEditor::getInstance();

        $include = (array) $wf->getParam('styleselect.styles', array('stylesheet', 'custom'));

        if (in_array('custom', $include)) {
            // theme styles list (legacy)
            $theme_advanced_styles = $wf->getParam('editor.theme_advanced_styles', '');

            // list of custom styles
            $custom_classes = $wf->getParam('styleselect.custom_classes', '');

            if (!empty($custom_classes)) {
                $settings['styleselect_custom_classes'] = $custom_classes;
            }

            // add legacy to custom_style_classes
            if (!empty($theme_advanced_styles)) {
                $list1 = explode(",", $custom_classes);
                $list2 = explode(",", $theme_advanced_styles);

                $settings['styleselect_custom_classes'] = implode(",", array_merge($list1, $list2));
            }

            $custom_styles = json_decode($wf->getParam('styleselect.custom_styles', $wf->getParam('editor.custom_styles', '')));

            if (!empty($custom_styles)) {
              $styles = array();

              $blocks = array('section', 'nav', 'article', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'footer', 'address', 'main', 'p', 'pre', 'blockquote', 'figure', 'figcaption', 'div');

              foreach ((array) $custom_styles as $style) {
                  if (isset($style->styles)) {
                      $style->styles = self::cleanJSON($style->styles);
                  }

                  if (isset($style->attributes)) {
                      $style->attributes = self::cleanJSON($style->attributes, " ", "=");
                  }

                  if (!isset($style->element)) {
                      $style->element = 'span';

                      if (!isset($style->selector)) {
                          $style->selector = '*';
                      }
                  }

                  if (in_array($style->element, $blocks)) {
                      $style->block = $style->element;
                  } else {
                      $style->inline = $style->element;
                  }

                  // remove
                  $style->remove = "all";

                  $styles[] = $style;
              }

              if (!empty($styles)) {
                  $settings['style_formats'] = htmlentities(json_encode($styles), ENT_NOQUOTES, "UTF-8");
              }
            }
        }

        // set this value false if stylesheet not included
        if (in_array('stylesheet', $include) === false) {
            $settings['styleselect_stylesheet'] = false;
        }
    }

    protected static function cleanJSON($string, $delim1 = ";", $delim2=":") {
        $ret = array();

        foreach (explode($delim1, $string) as $item) {
            $item = trim($item);

            // split style at colon
            $parts = explode($delim2, $item);

            if (count($parts) < 2) {
                continue;
            }

            // cleanup string
            $parts = preg_replace('#^["\']#', '', $parts);
            $parts = preg_replace('#["\']$#', '', $parts);

            $ret[trim($parts[0])] = trim($parts[1]);
        }

        return $ret;
    }

    /**
     * Get a list of editor font families
     *
     * @return string font family list
     * @param string $add Font family to add
     * @param string $remove Font family to remove
     */
    protected static function getFonts() {
        $wf = WFEditor::getInstance();

        $add = $wf->getParam('editor.theme_advanced_fonts_add');
        $remove = $wf->getParam('editor.theme_advanced_fonts_remove');

        // Default font list
        $fonts = self::$fonts;

        if (empty($remove) && empty($add)) {
            return "";
        }

        $remove = preg_split('/[;,]+/', $remove);

        if (count($remove)) {
            foreach ($fonts as $key => $value) {
                foreach ($remove as $gone) {
                    if ($gone && preg_match('/^' . $gone . '=/i', $value)) {
                        // Remove family
                        unset($fonts[$key]);
                    }
                }
            }
        }
        foreach (explode(";", $add) as $new) {
            // Add new font family
            if (preg_match('/([^\=]+)(\=)([^\=]+)/', trim($new)) && !in_array($new, $fonts)) {
                $fonts[] = $new;
            }
        }

        natcasesort($fonts);
        return implode(';', $fonts);
    }

}

?>
