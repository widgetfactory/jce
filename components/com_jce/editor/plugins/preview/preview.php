<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Table\Table;
use Joomla\CMS\Uri\Uri;
use Joomla\Registry\Registry;

class WFPreviewPlugin extends WFEditorPlugin
{
    /**
     * Constructor activating the default information of the class.
     */
    public function __construct()
    {
        parent::__construct();

        $request = WFRequest::getInstance();
        // Setup plugin XHR callback functions
        $request->setRequest(array($this, 'showPreview'));
    }

    /**
     * Display Preview content.
     */
    public function showPreview()
    {
        $app = Factory::getApplication();
        $user = Factory::getUser();

        // reset document type
        $document = Factory::getDocument();
        $document->setType('html');

        // register autoload for ContentHelperRoute
        JLoader::register('ContentHelperRoute', JPATH_SITE . '/components/com_content/helpers/route.php');

        // get post data
        $data = $app->input->post->get('data', '', 'RAW');

        // cleanup data
        $data = preg_replace(array('#<!DOCTYPE([^>]+)>#i', '#<(head|title|meta)([^>]*)>([\w\W]+)<\/1>#i', '#<\/?(html|body)([^>]*)>#i'), '', rawurldecode($data));

        // prevent processing by responsify
        $data = '{responsive=off}' . $data;

        // create params registry object
        $params = new Registry();
        $params->loadString("");

        // create context
        $context = "";

        $extension_id = $app->input->getInt('extension_id');
        $extension = Table::getInstance('extension');

        if ($extension->load($extension_id)) {
            $option = $extension->element;
            // process attribs (com_content etc.)
            $params->loadString($extension->params);
            // create context
            $context = $option . '.article';
        }

        $article = Table::getInstance('content');

        $article->id = 0;
        $article->created_by = $user->get('id');
        $article->parameters = new Registry();
        $article->text = $data;

        // load system plugins
        PluginHelper::importPlugin('system');

        // allow this to be skipped as some plugins can cause FATAL errors.
        if ((bool) $this->getParam('process_content', 1)) {
            $page = 0;

            // load content plugins
            PluginHelper::importPlugin('content');

            // set error reporting off to produce empty string on Fatal error
            error_reporting(0);

            // set params flag for responsify
            $params->set('wf_responsify', 0);

            $app->triggerEvent('onContentPrepare', array($context, &$article, &$params, $page));
        }

        $this->processURLS($article);

        // remove {responsive=off} from the beginning of the text
        $article->text = preg_replace('#^\{responsive=off\}#', '', $article->text);

        $app->triggerEvent('onWfContentPreview', array($context, &$article, &$params, 0));

        return $article->text;
    }

    /**
     * Convert URLs.
     *
     * @param object $article Article object
     */
    private function processURLS(&$article)
    {
        $base = Uri::root(true) . '/';
        $buffer = $article->text;

        $protocols = '[a-zA-Z0-9]+:'; //To check for all unknown protocals (a protocol must contain at least one alpahnumeric fillowed by :
        $regex = '#(src|href|poster)="(?!/|' . $protocols . '|\#|\')([^"]*)"#m';
        $buffer = preg_replace($regex, "$1=\"$base\$2\"", $buffer);
        $regex = '#(onclick="window.open\(\')(?!/|' . $protocols . '|\#)([^/]+[^\']*?\')#m';
        $buffer = preg_replace($regex, '$1' . $base . '$2', $buffer);

        // ONMOUSEOVER / ONMOUSEOUT
        $regex = '#(onmouseover|onmouseout)="this.src=([\']+)(?!/|' . $protocols . '|\#|\')([^"]+)"#m';
        $buffer = preg_replace($regex, '$1="this.src=$2' . $base . '$3$4"', $buffer);

        // Background image
        $regex = '#style\s*=\s*[\'\"](.*):\s*url\s*\([\'\"]?(?!/|' . $protocols . '|\#)([^\)\'\"]+)[\'\"]?\)#m';
        $buffer = preg_replace($regex, 'style="$1: url(\'' . $base . '$2$3\')', $buffer);

        // OBJECT <field name="xx", value="yy"> -- fix it only inside the <param> tag
        $regex = '#(<param\s+)name\s*=\s*"(movie|src|url)"[^>]\s*value\s*=\s*"(?!/|' . $protocols . '|\#|\')([^"]*)"#m';
        $buffer = preg_replace($regex, '$1name="$2" value="' . $base . '$3"', $buffer);

        // OBJECT <field value="xx", name="yy"> -- fix it only inside the <param> tag
        $regex = '#(<param\s+[^>]*)value\s*=\s*"(?!/|' . $protocols . '|\#|\')([^"]*)"\s*name\s*=\s*"(movie|src|url)"#m';
        $buffer = preg_replace($regex, '<field value="' . $base . '$2" name="$3"', $buffer);

        // OBJECT data="xx" attribute -- fix it only in the object tag
        $regex = '#(<object\s+[^>]*)data\s*=\s*"(?!/|' . $protocols . '|\#|\')([^"]*)"#m';
        $buffer = preg_replace($regex, '$1data="' . $base . '$2"$3', $buffer);

        $article->text = $buffer;
    }
}
