<?php

/**
 * @package     JCE
 * @subpackage  Editors.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Editors\Jce\PluginTraits;

use Joomla\CMS\Editor\Editor;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Uri\Uri;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

trait XTDButtonsTrait
{
    /**
     * Get the XTD buttons as a list to render in the Joomla button menu
     *
     * @param   string  $editorId  The editor ID
     * @param   array   $options   Associative array with additional parameters
     *
     * @return array
     *
     * @since 2.9.99.3
     */
    private function getXtdButtonsList($editorId, array $options = []): array
    {
        $app = $this->getApplication();

        $list = [];

        $excluded = ['readmore', 'pagebreak'];

        $buttons = $options['buttons'] ?? [];

        if (!is_array($buttons)) {
            $buttons = !$buttons ? false : $excluded;
        } else {
            $buttons = array_merge($buttons, $excluded);
        }

        $buttons = Editor::getInstance('jce')->getButtons($editorId, $buttons);

        if (!empty($buttons)) {
            $list[$editorId] = [];

            $wa = $app->getDocument()->getWebAssetManager();

            foreach ($buttons as $button) {

                if (!$button->get('name')) {
                    continue;
                }

                $id             = $editorId . '_' . $button->get('name');
                $action         = $button->get('action', '');
                $legacyModal    = $button->get('modal');

                $btnAsset       = 'editor-button.' . $button->get('name');

                if ($wa->assetExists('style', $btnAsset)) {
                    $wa->useStyle($btnAsset);
                }
                if ($wa->assetExists('script', $btnAsset)) {
                    $wa->useScript($btnAsset);
                }

                $icon       = 'none icon-' . $button->get('icon', $button->get('name'));
                $btnOptions = (array) $button->get('options', []);

                $link    = $button->get('link', '#');

                if ($link === '#') {
                    $link = $btnOptions['src'] ?? '';
                } else {
                    $link               = str_contains($link, '&amp;') ? htmlspecialchars_decode($link) : $link;
                    $link               = Uri::base(true) . '/' . $link;
                    $btnOptions['src'] ??= $link;
                }

                if ($action === 'modal' && $wa->assetExists('script', 'joomla.dialog')) {
                    $wa->useScript('joomla.dialog');
                
                    $legacyModal = false;

                    $btnOptions['src']        = $btnOptions['src'] ?? $link;
                    $btnOptions['textHeader'] = $btnOptions['textHeader'] ?? $button->get('text');
                    $btnOptions['iconHeader'] = $btnOptions['iconHeader'] ?? 'icon-' . $icon;
                    $btnOptions['popupType']  = $btnOptions['popupType'] ?? 'iframe';
                }

                if ($legacyModal) {
                    $button->id = $id . '_modal';
                    echo LayoutHelper::render('joomla.editors.buttons.modal', $button);
                }

                $args = [
                    'name'    => $button->get('text'),
                    'id'      => $id,
                    'title'   => $button->get('text'),
                    'icon'    => $icon,
                    'href'    => $link,
                    'onclick' => $button->get('onclick', ''),
                    'svg'     => $button->get('iconSVG'),
                    'options' => $btnOptions,
                    'action'  => $action,
                ];

                if ($legacyModal) {
                    $args['bsModal'] = true;
                }

                $list[$editorId][] = $args;
            }
        }

        return $list;
    }
    /**
     * Display the extended buttons for the editor.
     *
     * @param   string  $editorId  The editor ID
     * @param   array   $options   Associative array with additional parameters
     *
     * @return  string
     */
    protected function displayXtdButtons(string $editorId, array $options): string
    {
        $app = $this->getApplication();

        $options['buttons'] ??= true;

        $buttons = Editor::getInstance('jce')->getButtons($editorId, $options['buttons']);

        if (!empty($buttons)) {
            $wa = $app->getDocument()->getWebAssetManager();

            foreach ($buttons as $button) {
                $cls = $button->get('class', '');

                if (empty($cls) || strpos($cls, 'btn') === false) {
                    $button->set('class', trim($cls . ' btn'));
                }

                $button->set('editor', $editorId);

                if ($options['hidden'] ?? false) {
                    $button->set('class', 'd-none hidden');
                }

                $btnAsset = 'editor-button.' . $button->get('name');

                if ($wa->assetExists('style', $btnAsset)) {
                    $wa->useStyle($btnAsset);
                }
                if ($wa->assetExists('script', $btnAsset)) {
                    $wa->useScript($btnAsset);
                }

                if ($button->get('action') === 'modal' && $wa->assetExists('script', 'joomla.dialog')) {
                    $wa->useScript('joomla.dialog');
                }
            }

            return LayoutHelper::render('joomla.editors.buttons', $buttons);
        }

        return '';
    }
}
