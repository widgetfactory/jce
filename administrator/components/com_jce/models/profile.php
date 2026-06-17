<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\Filesystem\File;
use Joomla\CMS\Filter\InputFilter;
use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\FormHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Model\AdminModel;
use Joomla\CMS\Table\Table;
use Joomla\Registry\Registry;
use Joomla\String\StringHelper;
use Joomla\Event\DispatcherAwareInterface;

require JPATH_SITE . '/components/com_jce/editor/libraries/classes/editor.php';

require JPATH_ADMINISTRATOR . '/components/com_jce/helpers/plugins.php';
require JPATH_ADMINISTRATOR . '/components/com_jce/helpers/profiles.php';

/**
 * Item Model for a Profile.
 *
 * @since       1.6
 */
class JceModelProfile extends AdminModel
{
    /**
     * The type alias for this content type.
     *
     * @var string
     *
     * @since  3.2
     */
    public $typeAlias = 'com_jce.profile';

    /**
     * The prefix to use with controller messages.
     *
     * @var string
     *
     * @since  1.6
     */
    protected $text_prefix = 'COM_JCE';

    /**
     * Constructor. Wires up the event dispatcher when running on Joomla 4+.
     *
     * @param   array  $config  Configuration array for the model
     */
    public function __construct($config = array())
    {
        if ($this instanceof DispatcherAwareInterface) {
            $this->setDispatcher(Factory::getApplication()->getDispatcher());
        }

        parent::__construct($config);
    }

    /**
     * Returns a Table object, always creating it.
     *
     * @param type   $type   The table type to instantiate
     * @param string $prefix A prefix for the table class name. Optional
     * @param array  $config Configuration array for model. Optional
     *
     * @return JTable A database object
     *
     * @since   1.6
     */
    public function getTable($type = 'Profiles', $prefix = 'JceTable', $config = array())
    {
        return Table::getInstance($type, $prefix, $config);
    }

    /**
     * Override to prevent Joomla plugins from mutating profile form data.
     * Decodes and normalises the config array for display instead.
     *
     * @param   string  $context  The context for the data
     * @param   object  &$data    The data object to normalise in place
     * @param   string  $group    The plugin group (unused)
     *
     * @return  void
     */
    protected function preprocessData($context, &$data, $group = 'system')
    {
        if (!isset($data->config)) {
            return;
        }

        $config = $data->config;

        if (is_string($config)) {
            $config = json_decode($config, true);
        }

        if (empty($config)) {
            return;
        }

        // editor parameters
        if (isset($config['editor'])) {
            if (!empty($config['editor']['toolbar_theme']) && $config['editor']['toolbar_theme'] === 'mobile') {
                $config['editor']['toolbar_theme'] = 'default.touch';
            }

            if (isset($config['editor']['relative_urls']) && !isset($config['editor']['convert_urls'])) {
                $config['editor']['convert_urls'] = $config['editor']['relative_urls'] == 0 ? 'absolute' : 'relative';
            }
        }

        // decode config values for display
        array_walk_recursive($config, function (&$value) {
            $value = htmlspecialchars_decode($value);
        });

        $data->config = $config;
    }

    /**
     * Method to allow derived classes to preprocess the form.
     *
     * @param JForm  $form  A JForm object
     * @param mixed  $data  The data expected for the form
     * @param string $group The name of the plugin group to import (defaults to "content")
     *
     * @see     JFormField
     * @since   1.6
     *
     * @throws Exception if there is an error in the form event
     */
    protected function preprocessForm(Form $form, $data, $group = 'content')
    {
        if (!empty($data)) {
            $registry = new Registry($data->config);

            // process individual fields to remove default value if required
            $fields = $form->getFieldset();

            foreach ($fields as $field) {
                $name = $field->getAttribute('name');

                // get the field group and add the field name
                $group = (string) $field->group;

                // must be a grouped parameter, eg: editor, imgmanager etc.
                if (!$group) {
                    continue;
                }

                // create key from group and name
                $group = $group . '.' . $name;

                // explode group to array
                $parts = explode('.', $group);

                // remove "config" from group name so it matches params data object
                if ($parts[0] === "config") {
                    array_shift($parts);
                    $group = implode('.', $parts);
                }

                // reset the "default" attribute value if a value is set
                if ($registry->exists($group)) {
                    $form->setFieldAttribute($name, 'default', '', (string) $field->group);
                }
            }
        }

        if ($form->getName() == 'com_jce.profile') {
            // editor manifest
            $manifest = __DIR__ . '/forms/editor.xml';

            // load editor manifest
            if (is_file($manifest)) {
                if ($editor_xml = simplexml_load_file($manifest)) {
                    $form->setField($editor_xml, 'config');
                }
            }
        }

        // Allow for additional modification of the form, and events to be triggered.
        // We pass the data because plugins may require it.
        parent::preprocessForm($form, $data);

        // Load the data into the form after the plugins have operated.
        $form->bind($data);
    }

    /**
     * Get the profile edit form.
     *
     * @param   array  $data      Pre-populate data (unused; form always loads from the model state)
     * @param   bool   $loadData  Whether to load data into the form
     *
     * @return  Form|bool  The form, or false on failure
     */
    public function getForm($data = array(), $loadData = true)
    {
        if ($this instanceof DispatcherAwareInterface) {
            $this->setDispatcher(Factory::getApplication()->getDispatcher());
        }

        FormHelper::addFieldPath(JPATH_ADMINISTRATOR . '/components/com_jce/models/fields');

        // Get the setup form.
        return $this->loadForm('com_jce.profile', 'profile', array('control' => 'jform', 'load_data' => true));
    }

    /**
     * Method to get the data that should be injected in the form.
     *
     * @return mixed The data for the form
     *
     * @since   1.6
     */
    protected function loadFormData()
    {
        $data = $this->getItem();

        // convert 0 value to null to force defaults
        if (empty($data->area)) {
            $data->area = null;
        }

        // convert to array if set
        if (!empty($data->device)) {
            $data->device = explode(',', $data->device);
        }

        if (!empty($data->components)) {
            $data->components = explode(',', $data->components);
            $data->components_select = 1;
        }

        if (!empty($data->types)) {
            $data->types = explode(',', $data->types);
        }

        $data->config = $data->params;

        $this->preprocessData('com_jce.profiles', $data);

        return $data;
    }

    /**
     * Return the profile toolbar layout as a nested array of button groups indexed by row number.
     *
     * @return  array  [ rowIndex => [ groupIndex => [ button, ... ], ... ], ... ]
     */
    public function getRows()
    {
        $data = $this->getItem();

        $array = array();
        $rows = empty($data->rows) ? array() : explode(';', $data->rows);

        $plugins = $this->getButtons();

        $i = 1;

        foreach ($rows as $row) {
            $groups = array();
            // remove spacers
            $row = str_replace(array('|', 'spacer'), '', $row);

            foreach (explode('spacer', $row) as $group) {
                // get items in group
                $items = explode(',', $group);
                $buttons = array();

                // remove duplicates
                $items = array_unique($items);

                foreach ($items as $x => $item) {
                    if ($item === 'spacer') {
                        unset($items[$x]);
                        continue;
                    }

                    // not in the list...
                    if (empty($item) || array_key_exists($item, $plugins) === false) {
                        continue;
                    }

                    // must be assigned...
                    if (!$plugins[$item]->active) {
                        continue;
                    }

                    // assign icon
                    $buttons[] = $plugins[$item];
                }

                $groups[] = $buttons;
            }

            $array[$i] = $groups;

            ++$i;
        }

        // allow for empty toolbar row when creating a new profile
        if (empty($array)) {
            $array[$i] = array();
        }

        return $array;
    }

    /**
     * Return plugins/commands that are not currently placed in the toolbar layout.
     *
     * @return  array  Keyed by plugin name
     */
    public function getAvailableButtons()
    {
        $plugins = $this->getButtons();

        $available = array_filter($plugins, function ($plugin) {
            return !$plugin->active;
        });

        return $available;
    }

    /**
     * Return editor plugins that are not placed in any toolbar row.
     *
     * @return  array  Keyed by plugin name
     */
    public function getAdditionalPlugins()
    {
        $plugins = $this->getButtons();

        $additional = array_filter($plugins, function ($plugin) {
            return $plugin->editable && !$plugin->row;
        });

        return $additional;
    }

    /**
     * Return the merged set of toolbar commands and editor plugins for this profile.
     *
     * @return  array  Keyed by item name
     */
    public function getButtons()
    {
        $commands = $this->getCommands();
        $plugins = $this->getPlugins();

        return array_merge($commands, $plugins);
    }

    /**
     * Return all registered toolbar commands (bold, italic, undo, etc.) decorated with
     * active state and translated labels for the current profile.
     *
     * @return  array  Keyed by command name
     */
    public function getCommands()
    {
        static $commands;

        if (empty($commands)) {
            $data = $this->getItem();
            $rows = empty($data->rows) ? array() : preg_split('#[;,]#', $data->rows);

            $commands = array();

            foreach (JcePluginsHelper::getCommands() as $name => $command) {
                // set as active
                $command->active = in_array($name, $rows);
                $command->icon = explode(',', $command->icon);

                // set default empty value
                $command->image = '';

                // ui class, default is blank
                if (empty($command->class)) {
                    $command->class = '';
                }

                // cast row to integer
                $command->row = (int) $command->row;

                // cast editable to integer
                $command->editable = (int) $command->editable;

                // translate title
                $command->title = Text::_($command->title);

                // translate description
                $command->description = Text::_($command->description);

                $command->name = $name;

                $commands[$name] = $command;
            }
        }

        // merge plugins and commands
        return $commands;
    }

    /**
     * Return all registered editor plugins decorated with active state, translated labels,
     * and loaded parameter forms (including extension sub-forms) for the current profile.
     *
     * @return  array  Keyed by plugin name
     */
    public function getPlugins()
    {
        static $plugins;

        if (empty($plugins)) {
            $plugins = array();

            $data = $this->loadFormData();

            // array or profile plugin items
            $rows = empty($data->plugins) ? array() : explode(',', $data->plugins);

            // remove duplicates
            $rows = array_unique($rows);

            $extensions = JcePluginsHelper::getExtensions();

            // only need plugins with xml files
            foreach (JcePluginsHelper::getPlugins() as $name => $plugin) {
                $plugin->icon = empty($plugin->icon) ? array() : explode(',', $plugin->icon);

                // set as active if it is in the profile
                $plugin->active = in_array($plugin->name, $rows);

                // ui class, default is blank
                if (empty($plugin->class)) {
                    $plugin->class = '';
                }

                $plugin->class = preg_replace_callback('#\b([a-z0-9]+)-([a-z0-9]+)\b#', function ($matches) {
                    return 'mce' . ucfirst($matches[1]) . ucfirst($matches[2]);
                }, $plugin->class);

                // translate title
                $plugin->title = Text::_($plugin->title);

                // translate description
                $plugin->description = Text::_($plugin->description);

                // cast row to integer
                $plugin->row = (int) $plugin->row;

                // cast editable to integer
                $plugin->editable = (int) $plugin->editable;

                // plugin extensions
                $plugin->extensions = array();

                if (is_file($plugin->manifest)) {
                    $plugin->form = $this->loadForm('com_jce.profile.' . $plugin->name, $plugin->manifest, array('control' => 'jform[config]', 'load_data' => true), true, '//extension');
                    $plugin->formclass = 'options-grid-form options-grid-form-full';

                    $fieldsets = $plugin->form->getFieldsets();

                    // no parameter fields
                    if (empty($fieldsets)) {
                        $plugin->form = false;
                        $plugins[$name] = $plugin;
                        continue;
                    }

                    // bind data to the form
                    $plugin->form->bind($data->params);

                    foreach ($extensions as $type => $items) {

                        $item = new StdClass;
                        $item->name = '';
                        $item->title = '';
                        $item->manifest = WF_EDITOR_LIBRARIES . '/xml/config/' . $type . '.xml';
                        $item->context = '';

                        array_unshift($items, $item);

                        foreach ($items as $p) {
                            // check for plugin fieldset using xpath, as fieldset can be empty
                            $fieldset = $plugin->form->getXml()->xpath('(//fieldset[@name="plugin.' . $type . '"])');

                            // not supported, move along...
                            if (empty($fieldset)) {
                                continue;
                            }

                            $context = (string) $fieldset[0]->attributes()->context;

                            // check for a context, eg: images, web, video
                            if ($context && !in_array($p->context, explode(',', $context))) {
                                continue;
                            }

                            if (is_file($p->manifest)) {
                                $path = array($plugin->name, $type, $p->name);

                                // create new extension object
                                $extension = new StdClass;

                                // set extension name as the plugin name
                                $extension->name = $p->name;

                                // set extension title
                                $extension->title = $p->title;

                                // load form
                                $extension->form = $this->loadForm('com_jce.profile.' . implode('.', $path), $p->manifest, array('control' => 'jform[config][' . $plugin->name . '][' . $type . ']', 'load_data' => true), true, '//extension');
                                $extension->formclass = 'options-grid-form options-grid-form-full';

                                // get fieldsets if any
                                $fieldsets = $extension->form->getFieldsets();

                                foreach ($fieldsets as $fieldset) {
                                    // load form
                                    $plugin->extensions[$type][$p->name] = $extension;

                                    if (!isset($data->params[$plugin->name])) {
                                        continue;
                                    }

                                    if (!isset($data->params[$plugin->name][$type])) {
                                        continue;
                                    }

                                    // bind data to the form
                                    $extension->form->bind($data->params[$plugin->name][$type]);
                                }
                            }
                        }
                    }
                }

                // add to array
                $plugins[$name] = $plugin;
            }
        }

        return $plugins;
    }

    /**
     * Prepare and sanitise the table data prior to saving.
     *
     * @param   JTable $table A reference to a JTable object
     */
    protected function prepareTable($table)
    {
        $filter = InputFilter::getInstance();

        foreach ($table->getProperties() as $key => $value) {
            switch ($key) {
                case 'name':
                case 'description':
                    $value = $filter->clean($value, 'STRING');
                    break;
                case 'device':
                    $value = $filter->clean($value, 'STRING');

                    if (is_array($value)) {
                        $value = implode(',', $value);
                    }
                    break;
                case 'area':
                    if (is_array($value)) {
                        // remove empty value
                        $value = array_filter($value, 'strlen');

                        // for simplicity, set multiple area selections as "0"
                        if (count($value) > 1) {
                            $value = 0;
                        } else {
                            $value = $value[0];
                        }
                    }

                    break;
                case 'components':
                    $value = $filter->clean($value, 'STRING');

                    if (is_array($value)) {
                        $value = implode(',', $value);
                    }

                    break;
                case 'params':
                    break;
                case 'types':
                    $value = $filter->clean($value, 'INT');

                    if (is_array($value)) {
                        $whitelist = array_filter(array_map('intval', (array) ComponentHelper::getParams('com_jce')->get('profile_groups_whitelist', [])));

                        if (!empty($whitelist)) {
                            $value = array_intersect($value, $whitelist);
                        }

                        $value = implode(',', $value);
                    }

                    break;
                case 'users':
                    $value = $filter->clean($value, 'INT');

                    if (is_array($value)) {
                        $ids = array_filter(array_map('intval', $value));

                        if (!empty($ids)) {
                            $db = $this->getDbo();
                            $query = $db->getQuery(true)
                                ->select($db->quoteName('id'))
                                ->from($db->quoteName('#__users'))
                                ->where($db->quoteName('id') . ' IN (' . implode(',', $ids) . ')');
                            $db->setQuery($query);
                            $value = implode(',', array_map('intval', $db->loadColumn()));
                        } else {
                            $value = '';
                        }
                    }

                    break;
                case 'plugins':
                    $value = preg_replace('#[^\w_,]+#', '', $value);
                    break;
                case 'rows':
                    $value = preg_replace('#[^\w,;]+#', '', $value);
                    break;
            }

            $table->$key = $value;
        }

        $user = Factory::getUser();
        $date = Factory::getDate();

        if (empty($table->id)) {
            // Set ordering to the last item if not set
            if (empty($table->ordering)) {
                $db = $this->getDbo();
                $query = $db->getQuery(true)
                    ->select('MAX(ordering)')
                    ->from($db->quoteName('#__wf_profiles'));

                $db->setQuery($query);
                $max = $db->loadResult();

                $table->ordering = $max + 1;
            }

            $table->created    = $date->toSQL();
            $table->created_by = $user->get('id');
        }

        $table->modified    = $date->toSQL();
        $table->modified_by = $user->get('id');
    }

    /**
     * Validate and normalise raw form submission data before it reaches the model.
     * Moves the 'config' key to 'params' (JSON-encoded) and clears empty multi-select fields.
     *
     * @param   Form        $form   The form
     * @param   array       $data   Raw POST data
     * @param   string|null $group  Validation group (unused)
     *
     * @return  array  Cleaned data array ready for save()
     */
    public function validate($form, $data, $group = null)
    {
        $filter = InputFilter::getInstance();

        // get unfiltered config data
        $config = isset($data['config']) ? $data['config'] : array();

        // get layout rows and plugins data
        $rows = isset($data['rows']) ? $data['rows'] : '';
        $plugins = isset($data['plugins']) ? $data['plugins'] : '';

        // clean layout rows and plugins data
        $data['rows'] = $filter->clean($rows, 'STRING');
        $data['plugins'] = $filter->clean($plugins, 'STRING');

        // add back config data
        $data['params'] = json_encode($filter->clean($config, 'ARRAY'));

        if (empty($data['components']) || empty($data['components_select'])) {
            $data['components'] = '';
        }

        if (empty($data['users'])) {
            $data['users'] = '';
        }

        if (empty($data['types'])) {
            $data['types'] = '';
        }

        return $data;
    }

    /**
     * Normalise plugin parameter arrays before saving: renames legacy keys and
     * decodes JSON-encoded sub-values so the stored params stay clean.
     *
     * @param   array  $data  Plugin params keyed by plugin name
     *
     * @return  array
     */
    private static function cleanParamData($data)
    {
        // clean up link plugin parameters
        array_walk($data, function (&$params, $plugin) {
            if ($plugin === "link") {
                if (isset($params['dir'])) {

                    if (!empty($params['dir']) && empty($params['direction'])) {
                        $params['direction'] = $params['dir'];
                    }

                    unset($params['dir']);
                }
            }

            if (is_array($params) && WFUtility::is_associative_array($params)) {
                array_walk($params, function (&$value, $key) {
                    if (is_string($value) && WFUtility::isJson($value)) {
                        $value = json_decode($value, true);
                    }
                });
            }
        });

        return $data;
    }

    /**
     * Recursively normalise a parameter node before it is stored:
     * - Strings that look like JSON ({...} or [...]) are decoded when safe.
     * - Arrays that represent an empty key/value pair are dropped (return null).
     * - All other scalars and objects are returned as-is.
     *
     * @param   mixed  $node  A scalar, array, or object to normalise
     *
     * @return  mixed  The normalised value, or null to signal removal
     */
    private static function normalizeParams($node)
    {
        // 1) Strings: decode JSON-in-strings when safe
        if (is_string($node)) {
            $trim = ltrim($node);

            if ($trim !== '' && ($trim[0] === '{' || $trim[0] === '[')) {
                $decoded = json_decode($node, true);

                if (json_last_error() === JSON_ERROR_NONE) {
                    return self::normalizeParams($decoded);
                }
            }

            return $node;
        }

        // 2) Arrays: handle key/value pairs & recurse
        if (is_array($node)) {
            // Drop empty key/value pair objects
            if (array_key_exists('name', $node) && array_key_exists('value', $node)) {
                $name  = trim((string) ($node['name'] ?? ''));
                $value = $node['value'] ?? '';

                $valueIsEmpty =
                    (is_string($value) && trim($value) === '') ||
                    $value === null ||
                    (is_array($value) && $value === []);

                if ($name === '' && $valueIsEmpty) {
                    return null; // signal to remove
                }
            }

            $result = [];

            // Preserve numeric indexes for lists; associative for objects
            foreach ($node as $k => $v) {
                $normalized = self::normalizeParams($v);

                // Skip nulls returned from empty key/value pairs
                if ($normalized === null) {
                    continue;
                }

                $result[$k] = $normalized;
            }

            return $result;
        }

        // 3) Other scalars / objects: return as-is
        return $node;
    }

    /**
     * Save the profile form data, merging plugin params with the existing stored params.
     *
     * @param   array  $data  The validated form data
     *
     * @return  bool  True on success
     *
     * @since   2.7
     */
    public function save($data)
    {
        $app = Factory::getApplication();

        // get profile table
        $table = $this->getTable();

        // Alter the title for save as copy
        if ($app->input->get('task') == 'save2copy') {

            // Alter the title
            $name = $data['name'];

            while ($table->load(array('name' => $name))) {
                if ($name == $table->name) {
                    $name = StringHelper::increment($name);
                }
            }

            $data['name'] = $name;
            $data['published'] = 0;
        }

        $key = $table->getKeyName();
        $pk = (!empty($data[$key])) ? $data[$key] : (int) $this->getState($this->getName() . '.id');

        if ($pk && $table->load($pk)) {
            if (empty($data['rows'])) {
                $data['rows'] = $table->rows;
            }

            if (empty($data['plugins'])) {
                $data['plugins'] = $table->plugins;
            }

            $json = array();
            $params = empty($table->params) ? '' : $table->params;

            // convert params to json data array
            $params = (array) json_decode($params, true);

            $plugins = isset($data['plugins']) ? $data['plugins'] : $table->plugins;

            // get plugins
            $items = explode(',', $plugins);

            // add "editor" for editor parameters
            $items[] = 'editor';

            // add "setup" for setup parameters (via plugins, eg: jcepro)
            $items[] = 'setup';

            if (is_string($data['params'])) {
                $data['params'] = json_decode($data['params'], true);
            }

            // make sure we have a value
            if (empty($data['params'])) {
                $data['params'] = array();
            }

            $data['params'] = self::cleanParamData($data['params']);

            // data for editor and plugins
            foreach ($items as $item) {
                // add config data
                if (array_key_exists($item, $data['params'])) {
                    $value = $data['params'][$item];

                    // normalize the value
                    $value = self::normalizeParams($value);
                    
                    // Add to json array for merging
                    $json[$item] = $value;
                }
            }

            // merge and encode as json string
            $data['params'] = json_encode(WFUtility::array_merge_recursive_distinct($params, $json));
        }

        // set a default value for validation
        if (empty($data['params'])) {
            $data['params'] = '{}';
        }

        if (parent::save($data)) {
            return true;
        }

        return false;
    }

    /**
     * Duplicate one or more profiles. The copy is unpublished and stamped with
     * the current user's created/modified tracking fields.
     *
     * @param   array  $ids  Primary keys of the profiles to copy
     *
     * @return  bool
     */
    public function copy($ids)
    {
        $table = $this->getTable();

        $user = Factory::getUser();
        $date = Factory::getDate();

        foreach ($ids as $id) {
            if (!$table->load($id)) {
                $this->setError($table->getError());
                return false;
            } else {
                $name = Text::sprintf('WF_PROFILES_COPY_OF', $table->name);
                $table->name = $name;
                $table->id = 0;
                $table->published = 0;
                $table->created    = $date->toSQL();
                $table->created_by = $user->get('id');
                $table->modified    = $date->toSQL();
                $table->modified_by = $user->get('id');
            }

            // Check the row.
            if (!$table->check()) {
                $this->setError($table->getError());

                return false;
            }

            // Store the row.
            if (!$table->store()) {
                $this->setError($table->getError());

                return false;
            }
        }

        return true;
    }

    /**
     * Stream one or more profiles as a downloadable XML file and terminate the request.
     *
     * @param   array  $ids  Primary keys of the profiles to export
     *
     * @return  void  Does not return — exits after sending the response body
     */
    public function export($ids)
    {
        $db = Factory::getDBO();

        $buffer = '<?xml version="1.0" encoding="utf-8" standalone="yes"?>';
        $buffer .= "\n" . '<export type="profiles">';
        $buffer .= "\n\t" . '<profiles>';

        $validFields = array('name', 'description', 'users', 'types', 'components', 'area', 'device', 'rows', 'plugins', 'published', 'ordering', 'params');

        foreach ($ids as $id) {
            $table = $this->getTable();

            if (!$table->load($id)) {
                continue;
            }

            $buffer .= "\n\t\t";
            $buffer .= '<profile>';

            $fields = $table->getProperties();

            foreach ($fields as $key => $value) {
                // only allow a subset of fields
                if (!in_array($key, $validFields)) {
                    continue;
                }

                // set published to 0
                if ($key === "published") {
                    $value = 0;
                }

                if ($key == 'params') {
                    $buffer .= "\n\t\t\t" . '<' . $key . '><![CDATA[' . trim($value) . ']]></' . $key . '>';
                } else {
                    $buffer .= "\n\t\t\t" . '<' . $key . '>' . JceProfilesHelper::encodeData($value) . '</' . $key . '>';
                }
            }

            $buffer .= "\n\t\t</profile>";
        }

        $buffer .= "\n\t</profiles>";
        $buffer .= "\n</export>";

        // set_time_limit doesn't work in safe mode
        if (!ini_get('safe_mode')) {
            @set_time_limit(0);
        }

        $name = 'jce_editor_profile_' . date('Y_m_d') . '.xml';

        $app = Factory::getApplication();

        $app->allowCache(false);
        $app->setHeader('Content-Transfer-Encoding', 'binary');
        $app->setHeader('Content-Type', 'text/xml');
        $app->setHeader('Content-Disposition', 'attachment;filename="' . $name . '";');

        // set output content
        $app->setBody($buffer);

        // stream to client
        echo $app->toString();

        jexit();
    }

    /**
     * Validate that a file is a well-formed JCE profile export document.
     *
     * @param string $path Path to the XML file
     *
     * @return bool
     */
    private static function validateProfileImport($path)
    {
        $prev = false;

        if (PHP_MAJOR_VERSION < 8) {
            $prev = libxml_disable_entity_loader(true);
        }

        libxml_use_internal_errors(true);
        $xml = simplexml_load_file($path);
        libxml_clear_errors();

        if (PHP_MAJOR_VERSION < 8) {
            libxml_disable_entity_loader($prev);
        }

        return $xml
            && $xml->getName() === 'export'
            && (string) $xml['type'] === 'profiles'
            && isset($xml->profiles);
    }

    /**
     * Process XML restore file.
     *
     * @return bool
     */
    public function import()
    {
        $app = Factory::getApplication();

        $file = $app->input->files->get('profile_file', null, 'raw');

        // check for valid uploaded file
        if (empty($file) || !is_uploaded_file($file['tmp_name'])) {
            $app->enqueueMessage(Text::_('WF_PROFILES_UPLOAD_NOFILE'), 'error');
            return false;
        }

        if ($file['error'] || $file['size'] < 1) {
            if (!empty($file['tmp_name'])) {
                @unlink($file['tmp_name']);
            }
            $app->enqueueMessage(Text::_('WF_PROFILES_UPLOAD_NOFILE'), 'error');
            return false;
        }

        // 512 KB is far more than any legitimate profile export
        if ($file['size'] > 1024 * 512) {
            @unlink($file['tmp_name']);
            $app->enqueueMessage(Text::_('WF_PROFILES_IMPORT_ERROR'), 'error');
            return false;
        }

        try {
            WFUtility::isSafeFile($file, ['xml']);
        } catch (\InvalidArgumentException $e) {
            $app->enqueueMessage(Text::_('WF_PROFILES_IMPORT_INVALID_FILE'), 'error');
            return false;
        }

        // sanitize the file name for use as destination path
        $name = File::makeSafe($file['name']);

        if (empty($name)) {
            @unlink($file['tmp_name']);
            $app->enqueueMessage(Text::_('WF_PROFILES_IMPORT_ERROR'), 'error');
            return false;
        }

        $source = $file['tmp_name'];

        if (!self::validateProfileImport($source)) {
            @unlink($source);
            $app->enqueueMessage(Text::_('WF_PROFILES_IMPORT_INVALID_FILE'), 'error');
            return false;
        }

        // Build the appropriate paths.
        $config = Factory::getConfig();
        $destination = $config->get('tmp_path') . '/' . $name;

        // Move uploaded file.
        File::upload($source, $destination, false);

        if (!is_file($destination)) {
            @unlink($source);
            $app->enqueueMessage(Text::_('WF_PROFILES_UPLOAD_FAILED'), 'error');
            return false;
        }

        $result = JceProfilesHelper::processImport($destination);

        File::delete($destination);

        if ($result === false) {
            $app->enqueueMessage(Text::_('WF_PROFILES_IMPORT_ERROR'), 'error');
            return false;
        }

        $app->enqueueMessage(Text::sprintf('WF_PROFILES_IMPORT_SUCCESS', $result));

        return true;
    }
}