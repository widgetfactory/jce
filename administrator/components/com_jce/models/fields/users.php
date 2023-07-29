<?php

defined('JPATH_PLATFORM') or die;

/**
 * Field to select a user ID from a modal list.
 *
 * @since  1.6
 */
class JFormFieldUsers extends JFormFieldUser
{
	/**
	 * The form field type.
	 *
	 * @var    string
	 * @since  2.7
	 */
	public $type = 'Users';

	/**
	 * Method to get the user field input markup.
	 *
	 * @return  string  The field input markup.
	 *
	 * @since   1.6
	 */
	protected function getInput()
	{
		if (empty($this->layout))
		{
			throw new \UnexpectedValueException(sprintf('%s has no layout assigned.', $this->name));
		}

		$options = $this->getOptions();

		$name = $this->name;

		// clear name
		$this->name = "";

		// set onchange to update 
		$this->onchange = "(function(){WfSelectUsers();})();";

		// remove autocomplete
		$this->autocomplete = false;

		// clear value
		$this->value = "";

		$html  = $this->getRenderer($this->layout)->render($this->getLayoutData());
		$html  .= '<div class="users-select">';

		// add "joomla-field-fancy-select" manually for Joomla 4
		$html .= '<joomla-field-fancy-select placeholder="...">';
		$html .= '<select name="' . $name . '" id="' . $this->id . '_select" class="custom-select" data-placeholder="..." multiple>';
		
		foreach ($options as $option) {
			$html  .= '<option value="' . $option->value . '" selected>' . $option->text . '</option>';
		}

		$html .= '</select>';
		$html .= '</joomla-field-fancy-select>';
		$html .= '</div>';

		return $html;

	}

    /**
     * Allow to override renderer include paths in child fields
     *
     * @return  array
     *
     * @since   3.5
     */
    protected function getLayoutPaths()
    {
        return array(JPATH_ADMINISTRATOR . '/components/com_jce/layouts', JPATH_SITE . '/layouts');
	}
	
	/**
     * Method to get the field options.
     *
     * @return array The field option objects
     *
     * @since   11.1
     */
    protected function getOptions()
    {
		$options = array();
		
		if (empty($this->value)) {
			return $options;
		}

		$fieldname = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $this->fieldname);
		$table = JTable::getInstance('user');

		// clean value
		$this->value = str_replace('"', '', $this->value);

        foreach (explode(',', $this->value) as $id) {
            if (empty($id)) {
				continue;
			}
			
			if ($table->load((int) $id)) {
                $text = htmlspecialchars($table->name, ENT_COMPAT, 'UTF-8');
				$text = JText::alt($text, $fieldname);

				$tmp = array(
					'value' => $id,
					'text' => $text
				);
	
				// Add the option object to the result set.
				$options[] = (object) $tmp;
            }
        }

        return $options;
    }
}
