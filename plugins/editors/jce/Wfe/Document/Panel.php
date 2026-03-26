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

use Wfe\Container\ContainerTrait;

final class Panel
{
    use ContainerTrait;
    use TemplateLoaderTrait;

    private array $data = [];

    public function __construct(
        private readonly string $name,
        private readonly int    $state,
        array $paths = []
    ) {
        $this->paths = $paths;
    }

    public function getState(): int
    {
        return $this->state;
    }

    public function set(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->data[$key] ?? $default;
    }

    /**
     * Allow direct property access in templates, e.g. $this->plugin
     */
    public function __get(string $key): mixed
    {
        return $this->data[$key] ?? null;
    }

    /**
     * Load and render the panel template, optionally with a sub-template suffix.
     * When $tpl is provided the resolved filename is "{name}_{tpl}.php", which
     * mirrors the View convention used by Table's General panel.
     *
     * @param  string|null  $tpl  Optional sub-template name
     *
     * @return string  Rendered output
     *
     * @throws \InvalidArgumentException  When the template file cannot be found
     */
    public function loadTemplate(?string $tpl = null): string
    {
        $file = isset($tpl) ? $this->name . '_' . $tpl : $this->name;
        $file = preg_replace('/[^A-Z0-9_\.-]/i', '', $file);

        return $this->renderTemplate($file);
    }
}
