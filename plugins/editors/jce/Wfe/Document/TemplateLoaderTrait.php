<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Document;

\defined('_JEXEC') or die;

use Joomla\Filesystem\Path;

trait TemplateLoaderTrait
{
    private array $paths = [];

    public function addTemplatePath(string $path): void
    {
        $this->paths[] = $path;
    }

    /**
     * Locate, include and return the rendered output of a template file.
     *
     * @param  string  $file  Sanitized filename without extension
     *
     * @return string
     *
     * @throws \InvalidArgumentException  When the template file cannot be found
     */
    protected function renderTemplate(string $file): string
    {
        $template = Path::find($this->paths, $file . '.php');

        if (!$template) {
            throw new \InvalidArgumentException(
                'Template "' . $file . '" not found in ' . implode(', ', $this->paths)
            );
        }

        ob_start();
        include $template;
        return ob_get_clean();
    }
}
