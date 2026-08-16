<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Http;

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Filter\InputFilter;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Session\Session;
use Wfe\Registry\ConfigurationTrait;

final class Request
{
    use ConfigurationTrait;
    
    protected static $instance;

    protected $requests = array();

    /**
     * Decoded json request data. False until the request body has been read.
     *
     * @var object|null|false
     */
    protected $json = false;

    /**
     * Returns a reference to a WFRequest object.
     *
     * This method must be invoked as:
     *    <pre>  $request = WFRequest::getInstance();</pre>
     *
     * @return object WFRequest
     */
    public static function getInstance()
    {
        if (!isset(self::$instance)) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Set Request function.
     *
     * @param array $function An array containing the function and object
     */
    public function register($function)
    {
        $object = new \stdClass();

        if (is_array($function)) {
            $ref = array_shift($function);
            $name = array_shift($function);

            $object->fn = $name;
            $object->ref = $ref;

            $this->requests[$name] = $object;
        } else {
            $object->fn = $function;
            $this->requests[$function] = $object;
        }
    }

    private function isRegistered($function)
    {
        return array_key_exists($function, $this->requests);
    }

    /**
     * Get a request function.
     *
     * @param string $function
     */
    public function getFunction($function)
    {
        return $this->requests[$function];
    }

    /**
     * Check if the HTTP Request is a WFRequest.
     *
     * @return bool
     */
    private function isRequest()
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        return (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') || strpos($contentType, 'multipart') !== false || strpos($contentType, 'application/json') !== false;
    }

    public function setRequest($request)
    {
        return $this->register($request);
    }

    /**
     * Check a request query for bad stuff.
     *
     * @param array $query
     */
    private function checkQuery($query)
    {
        // Normalise scalars to an array so the loop handles every case
        if (!is_array($query) && !is_object($query)) {
            $query = array($query);
        }

        foreach ($query as $key => $value) {
            // Array keys are always int or string; guard string keys for null bytes
            if (is_string($key) && strpos($key, "\x00") !== false) {
                throw new \InvalidArgumentException("Invalid Data", 403);
            }

            // Recurse into nested arrays/objects.
            // Do NOT return here - every sibling element must be checked.
            if (is_array($value) || is_object($value)) {
                $this->checkQuery($value);
                continue;
            }

            // Guard scalar values for null bytes
            if ($value !== null && strpos((string) $value, "\x00") !== false) {
                throw new \InvalidArgumentException("Invalid Data", 403);
            }
        }
    }

    /**
     * Check whether the request body is json rather than form encoded.
     *
     * @return bool
     */
    private function isJsonBody()
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        return stripos($contentType, 'application/json') !== false;
    }

    /**
     * Read and decode the request body.
     *
     * @return object|null
     */
    private function decode()
    {
        // json passed as a form encoded field
        if ($this->isJsonBody() === false) {
            $raw = Factory::getApplication()->input->getVar('json', '', 'POST', 'STRING', 2);

            return $raw ? json_decode($raw, false, 32) : null;
        }

        // Reject oversized bodies up front rather than truncating (which corrupts the JSON)
        if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 65536) {
            jexit(Text::_('JINVALID_TOKEN'));
        }

        $raw = file_get_contents('php://input');

        return ($raw !== '' && $raw !== false) ? json_decode($raw, false, 32) : null;
    }

    /**
     * Get the decoded json data for the current request.
     *
     * The body is read and decoded only once, so this is safe to call before the
     * request is processed.
     *
     * @return object|null
     */
    public function getJson()
    {
        if ($this->json === false) {
            $this->json = $this->decode();
        }

        return $this->json;
    }

    /**
     * Get the method name for the current request.
     *
     * The name is returned whether it was passed as a query variable or in a json
     * body. No check is made that the method is registered, so this can be called
     * before any request handlers have been set.
     *
     * @return string The method name, or an empty string if there is none
     */
    public function getMethod()
    {
        $json = $this->getJson();

        if (is_object($json) && isset($json->method)) {
            return InputFilter::getInstance()->clean($json->method, 'cmd');
        }

        return Factory::getApplication()->input->getWord('method', '');
    }

    /**
     * Get the id for the current request.
     *
     * @return string
     */
    public function getId()
    {
        $json = $this->getJson();

        return empty($json->id) ? Factory::getApplication()->input->getWord('id') : $json->id;
    }

    /**
     * Resolve the current request into a registered method name and its arguments.
     *
     * @return array array($fn, $args)
     *
     * @throws \InvalidArgumentException with a JSON-RPC error code
     */
    private function getRequest()
    {
        $json = $this->getJson();
        $fn = $this->getMethod();
        $args = array();

        // check if valid json object
        if (is_object($json)) {
            // no function call
            if (isset($json->method) === false) {
                throw new \InvalidArgumentException('Invalid Request', -32600);
            }

            // pass params to input and flatten
            if (empty($json->params)) {
                $json->params = "";
            }

            // check query
            $this->checkQuery($json->params);

            // merge array with args
            if (is_array($json->params)) {
                $args = array_merge($args, $json->params);
                // pass through string or object
            } else {
                $args[] = $json->params;
            }
        }

        if (empty($fn) || $this->isRegistered($fn) === false) {
            throw new \InvalidArgumentException('Method not found', -32601);
        }

        return array($fn, $args);
    }

    /**
     * Process an ajax call and return result.
     *
     * @return string
     */
    public function process($array = false)
    {
        if ($this->isRequest() === false) {
            return false;
        }

        // Check for request forgeries
        Session::checkToken('request') or jexit(Text::_('JINVALID_TOKEN'));

        $app = Factory::getApplication();

        $method = $app->input->getWord('method');

        // read the request body
        $json = $this->getJson();

        if ($this->isJsonBody()) {
            // The body is pure JSON, so the "data" payload (read by handlers such as createTemplate
            // via $app->input->post) is not in $_POST. Surface it to the POST input so those handlers
            // keep working, matching the urlencoded path where it arrives as a POST field. Only "data"
            // is exposed; the RPC envelope (method/params/id) stays in $json for the dispatcher.
            if (is_object($json) && isset($json->data) && is_scalar($json->data)) {
                $app->input->post->set('data', $json->data);
            }
        }

        if (!$method && !$json) {
            throw new \InvalidArgumentException("Invalid Data", 403);
        }

        // get current request id
        $id = $this->getId();

        // create response
        $response = new Response($id);

        if ($method || $json) {
            // set request flag
            define('JCE_REQUEST', 1);

            // a plain method call returns markup rather than json
            if (!is_object($json)) {
                $response->setHeaders(array('Content-type' => 'text/html;charset=UTF-8'));
            }

            $fn = '';
            $args = array();

            try {
                list($fn, $args) = $this->getRequest();
            } catch (\Exception $e) {
                $response->setError(array('code' => $e->getCode(), 'message' => $e->getMessage()))->send();
            }

            // get method
            $request = $this->getFunction($fn);

            // create callable function
            $callback = array($request->ref, $request->fn);

            // check function is callable
            if (is_callable($callback) === false) {
                $response->setError(array('code' => -32601, 'message' => 'Method not found'))->send();
            }

            // create empty result
            $result = '';

            try {
                $result = call_user_func_array($callback, (array) $args);

                if (is_array($result) && !empty($result['error'])) {
                    if (is_array($result['error'])) {
                        $result['error'] = implode("\n", $result['error']);
                    }

                    $response->setError(array('message' => $result['error']))->send();
                }
            } catch (\Exception $e) {
                $response->setError(array('code' => $e->getCode(), 'message' => $e->getMessage()))->send();
            }

            $response->setContent($result)->send();
        }

        // default response
        $response->setError(array('code' => -32601, 'message' => 'The server returned an invalid response'))->send();
    }
}
