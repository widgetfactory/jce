<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Filter\InputFilter;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Object\CMSObject;
use Joomla\CMS\Session\Session;

/**
 * Dispatcher for editor XHR requests.
 *
 * Plugins register the methods they expose with setRequest(), and process() resolves the
 * incoming request to one of them and returns the result as a JSON-RPC response. A request
 * arrives either as a JSON-RPC body (raw "application/json", or a form encoded "json" field)
 * or as a plain "method" request variable, which returns markup rather than json.
 *
 * The request body is decoded once and cached, so getJson(), getMethod() and getId() may be
 * called before process() to determine what is being requested, eg: to authorise it.
 */
final class WFRequest extends CMSObject
{
    /**
     * Singleton instance.
     *
     * @var WFRequest
     */
    protected static $instance;

    /**
     * Registered request methods, keyed by method name.
     *
     * @var array
     */
    protected $requests = array();

    /**
     * Decoded json request data. False until the request body has been read.
     *
     * @var object|null|false
     */
    protected $json = false;

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Get the singleton WFRequest instance.
     *
     * @return WFRequest
     */
    public static function getInstance()
    {
        if (!isset(self::$instance)) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Register a method that may be called by a request.
     *
     * @param array|string $function Either array($object, 'method'), or the name of a
     *                               callable function
     *
     * @return void
     */
    public function register($function)
    {
        $object = new stdClass();

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

    /**
     * Check whether a method has been registered.
     *
     * Registration is conditional in most plugins, so this answers "is this method
     * available to the current user", not "does this method exist".
     *
     * @param string $function The method name
     *
     * @return bool
     */
    private function isRegistered($function)
    {
        return array_key_exists($function, $this->requests);
    }

    /**
     * Get a registered method.
     *
     * @param string $function The method name, which must be registered
     *
     * @return stdClass Object with "fn" (method name) and, for an object method, "ref"
     */
    public function getFunction($function)
    {
        return $this->requests[$function];
    }

    /**
     * Check whether the HTTP request is an editor XHR request.
     *
     * @return bool True for an XMLHttpRequest, or a multipart or json body
     */
    private function isRequest()
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        return (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') || strpos($contentType, 'multipart') !== false || strpos($contentType, 'application/json') !== false;
    }

    /**
     * Register a method that may be called by a request.
     *
     * @param array|string $request Either array($object, 'method'), or the name of a
     *                              callable function
     *
     * @return void
     */
    public function setRequest($request)
    {
        return $this->register($request);
    }

    /**
     * Check request parameters for null bytes, recursing into nested values.
     *
     * @param mixed $query A scalar, array or object of request parameters
     *
     * @return void
     *
     * @throws InvalidArgumentException If a key or value contains a null byte
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
                throw new InvalidArgumentException("Invalid Data", 403);
            }

            // Recurse into nested arrays/objects.
            if (is_array($value) || is_object($value)) {
                $this->checkQuery($value);
                continue;
            }

            // Guard scalar values for null bytes
            if ($value !== null && strpos((string) $value, "\x00") !== false) {
                throw new InvalidArgumentException("Invalid Data", 403);
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
     * Use getJson() instead, which caches the result. A json body is read from the raw
     * input, otherwise the form encoded "json" field is used. A multipart request, eg: an
     * upload, has neither and decodes to null.
     *
     * @return object|null The decoded data, or null if there is none or it is not valid json
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
            jexit('Invalid Content');
        }

        $raw = file_get_contents('php://input');

        return ($raw !== '' && $raw !== false) ? json_decode($raw, false, 32) : null;
    }

    /**
     * Get the decoded json data for the current request.
     *
     * The body is read and decoded only once, so this is safe to call before the request
     * is processed, and safe to call more than once.
     *
     * @return object|null The decoded data, or null if there is none or it is not valid json
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
     * The name is returned whether it was passed in a json body or as a request variable.
     * No check is made that the method is registered, so this can be called before any
     * methods have been registered, and returns the name even when it is not permitted.
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
     * The id is echoed back in the response so the client can match it to the call it made.
     *
     * @return string The id from the json body, falling back to the "id" request variable
     */
    public function getId()
    {
        $json = $this->getJson();

        return empty($json->id) ? Factory::getApplication()->input->getWord('id') : $json->id;
    }

    /**
     * Resolve the current request into a registered method name and its arguments.
     *
     * The arguments come from the json "params" value: an array is spread across the
     * method's arguments, anything else is passed as a single argument.
     *
     * @return array array($fn, $args), the method name and its arguments
     *
     * @throws InvalidArgumentException With a JSON-RPC code as the exception code: -32600
     *                                  if the json body has no method, -32601 if the method
     *                                  is missing or not registered, or 403 from checkQuery()
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
                throw new InvalidArgumentException('Invalid Request', -32600);
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
            throw new InvalidArgumentException('Method not found', -32601);
        }

        return array($fn, $args);
    }

    /**
     * Process the current request and send the response.
     *
     * Resolves the request to a registered method, calls it, and sends the result. This
     * does not return for a valid request: the response is sent and execution ends. Errors
     * are sent as a JSON-RPC error response rather than thrown.
     *
     * @param bool $array Unused
     *
     * @return bool False if this is not an editor XHR request, otherwise does not return
     *
     * @throws InvalidArgumentException If the request has neither a method nor a json body
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
            throw new InvalidArgumentException("Invalid Data", 403);
        }

        // get current request id
        $id = $this->getId();

        // create response
        $response = new WFResponse($id);

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
            } catch (Exception $e) {
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
            } catch (Exception $e) {
                $response->setError(array('code' => $e->getCode(), 'message' => $e->getMessage()))->send();
            }

            $response->setContent($result)->send();
        }

        // default response
        $response->setError(array('code' => -32601, 'message' => 'The server returned an invalid response'))->send();
    }
}
