<?php
namespace Joomla\Component\Jce\Administrator\Field;

defined('JPATH_SITE') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;

/**
 * Repeatable filesystem field.
 *
 * Renders a list of additional filesystems, each one presenting the same adapter
 * selector and per-adapter configuration as the single Filesystem field, plus a
 * base folder, a label and a hidden, stable id. Each row compiles to one mount in
 * the browser's directory store.
 */
class FilesystemsField extends FilesystemField
{
    /**
     * The form field type.
     *
     * @var string
     */
    protected $type = 'Filesystems';

    /**
     * Method to get the field input markup.
     *
     * @return string The field input markup.
     */
    protected function getInput()
    {
        $rows = $this->value;

        // decode json string
        if (!empty($rows) && is_string($rows)) {
            $rows = json_decode($rows, true);
        }

        if (!is_array($rows)) {
            $rows = array();
        }

        // normalise to a positional list of rows
        $rows = array_values($rows);

        $this->loadAssets();

        $html = '';

        // the container carries the base control name so the client can build new rows
        $html .= '<div class="wf-filesystems" data-filesystems data-control="' . htmlspecialchars($this->name, ENT_COMPAT, 'UTF-8') . '" data-next-index="' . count($rows) . '">';

        $html .= '<div class="wf-filesystems-rows" data-filesystems-rows>';

        foreach ($rows as $i => $row) {
            $html .= $this->renderRow($this->name . '[' . $i . ']', $this->fieldname . '_' . $i, (array) $row);
        }

        $html .= '</div>';

        // hidden template used by the client to build new rows; __index__ is replaced on add
        $html .= '<template data-filesystems-template>';
        $html .= $this->renderRow($this->name . '[__index__]', $this->fieldname . '___index__', array('name' => $this->default, 'id' => ''));
        $html .= '</template>';

        $html .= '<button type="button" class="btn btn-secondary btn-sm mt-2" data-filesystems-add>'
            . '<span class="icon-plus" aria-hidden="true"></span> ' . Text::_('WF_PARAM_FILESYSTEM_ADD')
            . '</button>';

        $html .= '</div>';

        return $html;
    }

    /**
     * Render a single filesystem row.
     *
     * @param   string  $control   Base control name for the row, eg jform[params][filesystems][0].
     * @param   string  $formName  Unique form name prefix for the row's per-adapter config forms.
     * @param   array   $value     Row value: array('name', 'path', 'label', 'id', <plugin> => array(...)).
     *
     * @return  string  The rendered row HTML.
     */
    protected function renderRow($control, $formName, $value)
    {
        $id    = isset($value['id']) ? (string) $value['id'] : '';
        $path  = isset($value['path']) ? (string) $value['path'] : '';
        $label = isset($value['label']) ? (string) $value['label'] : '';

        $html = '';

        $html .= '<div class="wf-filesystem-row card p-3 mb-2" data-filesystems-row>';

        // row header: reorder controls and remove
        $html .= '<div class="wf-filesystem-row-header d-flex justify-content-end align-items-center mb-2">';
        $html .= '<button type="button" class="btn btn-sm btn-link p-1" data-filesystems-up title="' . Text::_('WF_PARAM_FILESYSTEM_MOVE_UP') . '"><span class="icon-arrow-up" aria-hidden="true"></span></button>';
        $html .= '<button type="button" class="btn btn-sm btn-link p-1" data-filesystems-down title="' . Text::_('WF_PARAM_FILESYSTEM_MOVE_DOWN') . '"><span class="icon-arrow-down" aria-hidden="true"></span></button>';
        $html .= '<button type="button" class="btn btn-sm btn-danger p-1 ms-2" data-filesystems-remove title="' . Text::_('WF_PARAM_FILESYSTEM_REMOVE') . '"><span class="icon-trash" aria-hidden="true"></span></button>';
        $html .= '</div>';

        // adapter selector + per-adapter configuration (reused from the single Filesystem field)
        $html .= $this->renderInstance($control, $formName, $value);

        // base folder
        $html .= '<div class="control-group">';
        $html .= '<div class="control-label"><label>' . Text::_('WF_PARAM_DIRECTORY') . '</label></div>';
        $html .= '<div class="controls"><input type="text" class="form-control" name="' . $control . '[path]" value="' . htmlspecialchars($path, ENT_COMPAT, 'UTF-8') . '" placeholder="images" /></div>';
        $html .= '</div>';

        // label
        $html .= '<div class="control-group">';
        $html .= '<div class="control-label"><label>' . Text::_('WF_PARAM_FILESYSTEM_LABEL') . '</label></div>';
        $html .= '<div class="controls"><input type="text" class="form-control" name="' . $control . '[label]" value="' . htmlspecialchars($label, ENT_COMPAT, 'UTF-8') . '" /></div>';
        $html .= '</div>';

        // hidden, stable id (auto-generated by the client when a new row is added)
        $html .= '<input type="hidden" name="' . $control . '[id]" value="' . htmlspecialchars($id, ENT_COMPAT, 'UTF-8') . '" data-filesystems-id />';

        $html .= '</div>';

        return $html;
    }

    /**
     * Register the field's script and stylesheet.
     *
     * @return void
     */
    protected function loadAssets()
    {
        static $loaded = false;

        if ($loaded) {
            return;
        }

        $loaded = true;

        HTMLHelper::_('stylesheet', 'com_jce/admin/css/filesystems.css', array('version' => 'auto', 'relative' => true));
        HTMLHelper::_('script', 'com_jce/admin/js/filesystems.js', array('version' => 'auto', 'relative' => true));
    }
}
