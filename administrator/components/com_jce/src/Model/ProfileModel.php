<?php

/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Model;

use Exception;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Filter\InputFilter;
use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\FormHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Model\AdminModel;
use Joomla\Registry\Registry;

use Wfe\Helper\ArrayHelper;
use Wfe\Helper\StringHelper;
use Wfe\Utility\Utility as WfeUtility;

use Joomla\Component\Jce\Administrator\Helper\PluginsHelper;
use Joomla\Component\Jce\Administrator\Helper\ProfilesHelper;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

/**
 * Methods supporting a list of profile records.
 *
 * @since  3.0.0
 */
class ProfileModel extends AdminModel
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
     * Returns a Table object, always creating it.
     *
     * @param   string  $type    The table type to instantiate
     * @param   string  $prefix  A prefix for the table class name. Optional
     * @param   array   $config  Configuration array for model. Optional
     *
     * @return  \Joomla\CMS\Table\Table
     *
     * @since   1.6
     */
    public function getTable($type = 'Profiles', $prefix = '', $config = [])
    {
        return parent::getTable($type, $prefix, $config);
    }

    /**
     * Override to prevent Joomla plugins from mutating profile form data.
     *
     * @param   string  $context  The context for the data
     * @param   object  &$data    The data object (unused)
     * @param   string  $group    The plugin group (unused)
     *
     * @return  void
     */
    protected function preprocessData($context, &$data, $group = 'content') {}

    /**
     * Decode and normalise profile params for display, including legacy key migrations.
     *
     * @param   object  $data  The raw item data from the database
     *
     * @return  object  The mutated data object with a populated `config` property
     */
    protected function processData($data)
    {
        if (!isset($data->params)) {
            return $data;
        }

        $config = $data->params;

        if (is_string($config)) {
            $config = json_decode($config, true);
        }

        if (empty($config)) {
            return $data;
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

        array_walk($config, function (&$value, $key) {
            if (ArrayHelper::is_associative_array($value)) {
                if (array_key_exists('popups', $value)) {
                    $value['lightbox'] = $value['popups'];

                    unset($value['popups']);
                }

                if (array_key_exists('aggregator', $value)) {
                    $value['media'] = $value['aggregator'];

                    unset($value['aggregator']);
                }

                if (array_key_exists('links', $value)) {
                    if (array_key_exists('joomlalinks', $value['links'])) {
                        $legacy = $value['links']['joomlalinks'];

                        // Carry over flat keys (renamed or unchanged)
                        $joomla = array_intersect_key($legacy, array_flip(['itemid', 'article_unpublished']));

                        if (isset($legacy['article_alias'])) {
                            $joomla['alias'] = $legacy['article_alias'];
                        }

                        $list = [];

                        // Group adapter keys under 'list'
                        foreach (['content', 'contacts', 'weblinks', 'menu', 'tags'] as $listKey) {
                            if (isset($legacy[$listKey]) && (int) $legacy[$listKey] === 1) {
                                $list[] = $listKey;
                            }
                        }

                        if (!empty($list)) {
                            $joomla['list'] = [
                                'providers' => $list
                            ];
                        }

                        // Merge legacy search providers into joomla config
                        if (array_key_exists('search', $value) && array_key_exists('link', $value['search'])) {
                            $searchLegacy = $value['search']['link'];
                            $searchList = [];

                            if (isset($searchLegacy['plugins'])) {
                                foreach (['content', 'categories', 'contacts', 'weblinks', 'menu', 'tags'] as $listKey) {
                                    if (in_array($listKey, $searchLegacy['plugins'])) {
                                        $searchList[] = $listKey;
                                    }
                                }
                            }

                            if (!empty($searchList)) {
                                $joomla['search'] = [
                                    'providers' => $searchList
                                ];
                            }
                        }

                        $value['links']['joomla'] = $joomla;
                        unset($value['links']['joomlalinks']);
                    }
                }
            }
        });

        $data->config = $config;

        return $data;
    }

    /**
     * Preprocess the profile form: clears default attribute values where saved data
     * already exists, then injects the editor manifest fieldset.
     *
     * @param   Form    $form   The form object
     * @param   mixed   $data   The data to bind
     * @param   string  $group  The plugin group (defaults to "content")
     *
     * @return  void
     *
     * @since   1.6
     *
     * @throws  Exception
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

        // editor manifest
        $manifest = JPATH_ADMINISTRATOR . '/components/com_jce/forms/editor.xml';

        // load editor manifest
        if (is_file($manifest)) {
            if ($editor_xml = simplexml_load_file($manifest)) {
                $form->setField($editor_xml, 'config');
            }
        }

        // allow plugins to process form, eg: MediaField etc.
        parent::preprocessForm($form, $data);

        // re-load the data into the form after the plugins have operated.
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
    public function getForm($data = [], $loadData = true)
    {
        Form::addFieldPath(JPATH_ADMINISTRATOR . '/components/com_jce/src/Field');
        FormHelper::addFieldPrefix('Joomla\Component\Jce\Administrator\Field');

        // Get the setup form.
        return $this->loadForm('com_jce.profile', 'profile', ['control' => 'jform', 'load_data' => true]);
    }

    /**
     * Get the data to inject into the profile form.
     *
     * @return  object  The profile item with config, device, components, and types prepared for display
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

        $data->types = explode(',', $data->types);

        // process form data seperately
        $data = $this->processData($data);

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

        $array = [];
        $rows = explode(';', $data->rows);

        $plugins = $this->getButtons();

        $i = 1;

        foreach ($rows as $row) {
            $groups = [];
            // remove spacers
            $row = str_replace(['|', 'spacer'], '', $row);

            foreach (explode('spacer', $row) as $group) {
                // get items in group
                $items = explode(',', $group);
                $buttons = [];

                // remove duplicates
                $items = array_unique($items);

                foreach ($items as $x => $item) {
                    if ($item === 'spacer') {
                        unset($items[$x]);
                        continue;
                    }

                    // $item = PluginsHelper::legacyMap($item);

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
     * Return editor plugins that are editable but not yet placed in any toolbar row.
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
            $rows = preg_split('#[;,]#', $data->rows);

            $commands = [];

            foreach (PluginsHelper::getCommands() as $name => $command) {
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
     * and loaded parameter forms (including adapter-plugin sub-forms) for the current profile.
     *
     * @return  array  Keyed by plugin name
     */
    public function getPlugins()
    {
        static $plugins;

        if (empty($plugins)) {
            $plugins = [];

            $data = $this->loadFormData();

            // array or profile plugin items
            $rows = explode(',', $data->plugins);

            // remove duplicates
            $rows = array_unique($rows);

            $adapterPlugins = PluginsHelper::getAdapterPlugins();
            $editorPlugins  = PluginsHelper::getEditorPlugins();

            // only need plugins with xml files
            foreach ($editorPlugins as $name => $plugin) {
                $plugin->icon = empty($plugin->icon) ? [] : explode(',', $plugin->icon);

                // set as active if it is in the profile
                $plugin->active = in_array($name, $rows);

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

                // plugin extensions
                $plugin->adapterPlugins = array();

                if (!is_file($plugin->manifest)) {
                    continue;
                }

                $xml = simplexml_load_file($plugin->manifest);

                if (!$xml) {
                    continue;
                }

                $xmlString = $xml->asXml();

                $plugin->form = $this->loadForm('com_jce.profile.' . $plugin->name, $xmlString, ['control' => 'jform[config]', 'load_data' => true], true, '//extension');
                $plugin->formclass = 'options-grid-form options-grid-form-full';

                if (!$plugin->form) {
                    continue;
                }

                $formXml = $plugin->form->getXml();

                if (!isset($formXml->config)) {
                    $formXml->addChild('config');
                }

                if (!isset($formXml->config->inlinehelp)) {
                    $formXml->config->addChild('inlinehelp')->addAttribute('button', 'show');
                }

                $fieldsets = $plugin->form->getFieldsets();

                // no parameter fields
                if (empty($fieldsets)) {
                    $plugin->form = false;
                    $plugins[$name] = $plugin;

                    continue;
                }

                // bind data to the form
                $plugin->form->bind($data->config);

                $plugin->form->addFieldPath([
                    JPATH_ADMINISTRATOR . '/components/com_jce/src/Field'
                ]);

                // adapters supported by this plugin
                $supportedAdapters = [];

                $adapterFieldsets = $plugin->form->getXml()->xpath('//fieldset[starts-with(@name, "plugin.")]');

                foreach ($adapterFieldsets as $adapterFieldset) {
                    $adapterFieldsetName = (string) $adapterFieldset['name'];

                    if (empty($adapterFieldsetName)) {
                        continue;
                    }

                    $adapterName = str_replace('plugin.', '', $adapterFieldsetName);
                    $adapterName = trim(strtolower($adapterName));

                    $supportedAdapters[] = $adapterName;
                }

                foreach ($adapterPlugins as $type => $items) {
                    // not supported, move along...
                    if (!in_array($type, $supportedAdapters)) {
                        continue;
                    }

                    $item = new \stdClass();
                    $item->name = '';
                    $item->title = '';
                    $item->manifest = WF_PLUGIN . '/Adapter/Plugin/' . ucfirst($type) . '/' . $type . '.xml';
                    $item->context = '';

                    array_unshift($items, $item);

                    foreach ($items as $p) {
                        if (!is_file($p->manifest)) {
                            continue;
                        }

                        $xml = simplexml_load_file($p->manifest);

                        if (!$xml) {
                            continue;
                        }

                        $xmlString = $xml->asXml();

                        $path = [$plugin->name, $type, $p->name];

                        // create new adapter plugin object
                        $adapterPlugin = new \stdClass();

                        // set adapter plugin name as the plugin name
                        $adapterPlugin->name = $p->name;

                        // set adapter plugin title
                        $adapterPlugin->title = $p->title;

                        // load form
                        $adapterPlugin->form = $this->loadForm('com_jce.profile.' . implode('.', $path), $xmlString, ['control' => 'jform[config][' . $plugin->name . '][' . $type . ']', 'load_data' => true], true, '//extension');
                        $adapterPlugin->formclass = 'options-grid-form options-grid-form-full';

                        if (!$adapterPlugin->form) {
                            continue;
                        }

                        $formXml = $adapterPlugin->form->getXml();

                        if (!isset($formXml->config)) {
                            $formXml->addChild('config');
                        }

                        if (!isset($formXml->config->inlinehelp)) {
                            $formXml->config->addChild('inlinehelp')->addAttribute('button', 'show');
                        }

                        $adapterPlugin->form->addFieldPath([
                            JPATH_ADMINISTRATOR . '/components/com_jce/src/Field'
                        ]);

                        // get fieldsets if any
                        $fieldsets = $adapterPlugin->form->getFieldsets();

                        if (empty($fieldsets)) {
                            continue;
                        }

                        foreach ($fieldsets as $fieldset) {
                            // load form
                            $plugin->adapterPlugins[$type][$p->name] = $adapterPlugin;

                            if (!isset($data->config[$plugin->name])) {
                                continue;
                            }

                            if (!isset($data->config[$plugin->name][$type])) {
                                continue;
                            }

                            // bind data to the form
                            $adapterPlugin->form->bind($data->config[$plugin->name][$type]);
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
     * Sets created/created_by on insert and modified/modified_by on every save.
     *
     * @param   \Joomla\CMS\Table\Table  $table  A reference to a Table object
     *
     * @return  void
     *
     * @since   1.6
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
                            $db = $this->getDatabase();
                            $query = $db->getQuery(true)
                                ->select($db->quoteName('id'))
                                ->from($db->quoteName('#__users'))
                                ->whereIn($db->quoteName('id'), $ids);
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
                case 'params':
                    break;
            }

            $table->$key = $value;
        }

        $user = Factory::getApplication()->getIdentity();
        $date = Factory::getDate();

        if (empty($table->id)) {
            // Set ordering to the last item if not set
            if (empty($table->ordering)) {
                $db = $this->getDatabase();

                $query = $db->getQuery(true)
                    ->select('MAX(ordering)')
                    ->from($db->quoteName('#__wf_profiles'));

                $db->setQuery($query);
                $max = $db->loadResult();

                $table->ordering = $max + 1;
            }

            $table->created    = $date->toSQL();
            $table->created_by = $user->id;
        }

        $table->modified    = $date->toSQL();
        $table->modified_by = $user->id;
    }

    /**
     * Validate and normalise raw form submission data before it reaches the model.
     * Moves the 'config' key to 'params' and clears empty multi-select fields.
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
        $config = $data['config'] ?? [];

        // get layout rows and plugins data
        $rows = isset($data['rows']) ? $data['rows'] : '';
        $plugins = isset($data['plugins']) ? $data['plugins'] : '';

        // clean layout rows and plugins data
        $data['rows'] = $filter->clean($rows, 'STRING');
        $data['plugins'] = $filter->clean($plugins, 'STRING');

        // add back config data to params key
        $data['params'] = $filter->clean($config, 'ARRAY');

        // delete the "config" key
        unset($data['config']);

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
    private function cleanParamData($data)
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

            if (is_array($params) && ArrayHelper::isAssociative($params)) {
                array_walk($params, function (&$value, $key) {
                    if (is_string($value) && StringHelper::isJson($value)) {
                        $value = json_decode($value, true);
                    }
                });
            }
        });

        return $data;
    }

    /**
     * Method to save the form data.
     *
     * @param   array  $data  The form data
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

            while ($table->load(['name' => $name])) {
                if ($name == $table->name) {
                    $name = \Joomla\String\StringHelper::increment($name);
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

            $json = [];

            // get original params value
            $params = empty($table->params) ? '' : $table->params;

            // convert params to json data array
            $params = (array) json_decode($params, true);

            $plugins = $data['plugins'] ?? $table->plugins;

            // get plugins
            $items = explode(',', $plugins);

            // add "editor"
            $items[] = 'editor';

            // make sure we have a params value
            if (empty($data['params'])) {
                $data['params'] = [];
            }

            // recursively clean the params value
            $data['params'] = $this->cleanParamData($data['params']);

            // data for editor and plugins
            foreach ($items as $item) {
                // add params data
                if (array_key_exists($item, $data['params'])) {
                    $value = $data['params'][$item];

                    // clean and add to json array for merging
                    $json[$item] = filter_var_array($value, FILTER_SANITIZE_SPECIAL_CHARS);
                }
            }

            // merge and encode as json string
            $data['params'] = json_encode(ArrayHelper::array_merge_recursive_distinct($params, $json));
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
     *
     * @throws  \Exception
     */
    public function copy($ids)
    {
        $table = $this->getTable();

        foreach ($ids as $id) {
            if (!$table->load($id)) {
                throw new Exception($table->getError(), 500);
            } else {
                $name = Text::sprintf('WF_PROFILES_COPY_OF', $table->name);
                $table->name = $name;
                $table->id = 0;
                $table->published = 0;

                $user = Factory::getApplication()->getIdentity();
                $date = Factory::getDate();
                $table->created    = $date->toSQL();
                $table->created_by = $user->id;
                $table->modified    = $date->toSQL();
                $table->modified_by = $user->id;
            }

            // Check the row.
            if (!$table->check()) {
                throw new Exception($table->getError(), 500);
            }

            // Store the row.
            if (!$table->store()) {
                throw new Exception($table->getError(), 500);
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
        $buffer = '<?xml version="1.0" encoding="utf-8" standalone="yes"?>';
        $buffer .= "\n" . '<export type="profiles">';
        $buffer .= "\n\t" . '<profiles>';

        $validFields = ['name', 'description', 'users', 'types', 'components', 'custom', 'area', 'device', 'rows', 'plugins', 'published', 'ordering', 'params'];

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
                    $buffer .= "\n\t\t\t" . '<' . $key . '>' . ProfilesHelper::encodeData($value) . '</' . $key . '>';
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

        $app->close();
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
        libxml_use_internal_errors(true);
        $xml = simplexml_load_file($path);
        libxml_clear_errors();

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
            WfeUtility::isSafeFile($file, ['xml']);
        } catch (\InvalidArgumentException) {
            $app->enqueueMessage(Text::_('WF_PROFILES_IMPORT_INVALID_FILE'), 'error');
            return false;
        }

        $source = $file['tmp_name'];

        if (!self::validateProfileImport($source)) {
            @unlink($source);
            $app->enqueueMessage(Text::_('WF_PROFILES_IMPORT_INVALID_FILE'), 'error');
            return false;
        }

        $result = $this->processImport($source);

        @unlink($source);

        if ($result === false) {
            $app->enqueueMessage(Text::_('WF_PROFILES_IMPORT_ERROR'), 'error');
            return false;
        }

        $app->enqueueMessage(Text::sprintf('WF_PROFILES_IMPORT_SUCCESS', $result));

        return true;
    }

    /**
     * Process import data from XML file.
     * Stamps each imported profile with created/modified tracking fields.
     *
     * @param   string  $file  Path to the XML file to import
     *
     * @return  int|false  Number of profiles imported, or false on failure
     */
    public function processImport($file)
    {
        $n = 0;

        $app = Factory::getApplication();

        // load data from file
        $data = file_get_contents($file);

        // trim
        $data = trim($data);

        // format params data as CDATA
        $data = preg_replace('#<params>{(.+?)}<\/params>#', '<params><![CDATA[{$1}]]></params>', $data);

        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($data);
        libxml_clear_errors();

        if (!$xml) {
            return false;
        }

        $user = $app->getIdentity();
        $date = Factory::getDate();

        $language = $app->getLanguage();
        $language->load('com_jce', JPATH_ADMINISTRATOR, null, true);

        $allowedKeys = ['name', 'description', 'users', 'types', 'components', 'custom', 'area', 'device', 'rows', 'plugins', 'published', 'ordering', 'params'];

        $whitelist = (array) ComponentHelper::getParams('com_jce')->get('profile_groups_whitelist', []);
        $whitelist = array_filter(array_map('intval', $whitelist));

        foreach ($xml->profiles->children() as $profile) {
            $table = $this->getTable();

            foreach ($profile->children() as $item) {
                $key = $item->getName();

                if (!in_array($key, $allowedKeys, true)) {
                    continue;
                }

                $value = (string) $item;

                $filter = InputFilter::getInstance();

                switch ($key) {
                    case 'name':
                        $value = $filter->clean($value, 'STRING');
                        // create name copy if exists
                        if ($value) {
                            while ($table->load(['name' => $value])) {
                                if ($value === $table->name) {
                                    $value = \Joomla\String\StringHelper::increment($value);
                                }
                            }
                        }
                        break;

                    case 'description':
                        $value = $filter->clean(Text::_($value), 'STRING');
                        break;

                    case 'types':
                        if ($value === '') {
                            $area = (string) $profile->area[0] || 0;
                            $groups = ProfilesHelper::getUserGroups($area);
                            $value = implode(',', array_unique($groups));
                        } else {
                            $value = implode(',', array_filter(array_map('intval', explode(',', $value))));
                        }

                        if (!empty($whitelist)) {
                            $filtered = !empty($value) ? array_intersect(explode(',', $value), $whitelist) : [];

                            if (!empty($filtered)) {
                                $value = implode(',', $filtered);
                            } elseif (empty((string) $profile->users)) {
                                // no group overlap and no individual users — default to full whitelist
                                $value = implode(',', $whitelist);
                            } else {
                                // individual users are set, so empty types is valid
                                $value = '';
                            }
                        }

                        break;

                    case 'users':
                        if ($value !== '') {
                            $ids = array_filter(array_map('intval', explode(',', $value)));

                            if (!empty($ids)) {
                                $db = $this->getDatabase();
                                $query = $db->getQuery(true)
                                    ->select($db->quoteName('id'))
                                    ->from($db->quoteName('#__users'))
                                    ->whereIn($db->quoteName('id'), $ids);
                                $db->setQuery($query);
                                $value = implode(',', array_map('intval', $db->loadColumn()));
                            } else {
                                $value = '';
                            }
                        }
                        break;

                    case 'area':
                        $value = $value === '' ? 0 : (int) $value;
                        break;

                    case 'components':
                        $value = $filter->clean($value, 'STRING');
                        break;

                    case 'custom':
                        break;

                    case 'params':
                        if (!empty($value)) {
                            $decoded = json_decode($value, true);

                            if (is_array($decoded)) {
                                array_walk($decoded, function (&$param, $key) {
                                    if (is_string($param) && StringHelper::isJson($param)) {
                                        $param = json_decode($param, true);
                                    }
                                });
                            }

                            $value = json_encode($decoded);
                        }

                        if (empty($value)) {
                            $value = "{}";
                        }

                        break;

                    case 'rows':
                        $value = preg_replace('#[^\w,;]+#', '', $value);
                        break;

                    case 'plugins':
                        $value = preg_replace('#[^\w_,]+#', '', $value);
                        break;
                    case 'published':
                        // always import as unpublished; only users with publish permission may enable it
                        $value = 0;
                        break;
                    case 'ordering':
                        $value = (int) $value;
                        break;
                }

                $table->$key = $value;
            }

            // set new id
            $table->id = 0;

            // update with new custom field
            if (!isset($table->custom)) {
                $table->custom = '';
            }

            // set checked_out
            $table->checked_out = $user->id;

            // set checked_out_time
            $table->checked_out_time = $date->toSQL();

            $table->created    = $date->toSQL();
            $table->created_by = $user->id;
            $table->modified    = $date->toSQL();
            $table->modified_by = $user->id;

            if (!$table->store()) {
                $app->enqueueMessage($table->getError(), 'error');
                return false;
            }

            // check-in
            $table->checkin();

            ++$n;
        }

        return $n;
    }
}
