/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

var WFAggregator = WFExtensions.add('Aggregator', {
    
    // array of aggregators
    aggregators : {},
    
    add : function(name, o) {
    	this.aggregators[name] = o || {};
    },
    
    get : function(name) {
    	return this.aggregators[name] || null;
    },

    setup : function(options) {
        var self = this;
        
        options = options || {};

        tinymce.each(this.aggregators, function(o, k) {
            self.setParams(o, options);
            
            return self._call(o, 'setup');
        });
    },

    getTitle : function(name) {
        var f = this.get(name);
        
        if (f) {
        	return f.title;
        }
        
        return name;
    },

    getType : function(name) {
        var f = this.get(name);
        
        if (f) {
        	return f.getType();
        }
        
        return '';
    },
    
    getValues : function(name, src) {
    	var f = this.get(name);
        
        if (f) {
        	return this._call(f, 'getValues', src);
        }
    },
    
    setValues : function(name, data) {
    	var f = this.get(name);
        
        if (f) {
        	return this._call(f, 'setValues', data);
        }
    },
    
    getAttributes : function(name, args) {
    	var f = this.get(name);
        
        if (f) {
        	return this._call(f, 'getAttributes', args);
        }
    },
    
    setAttributes : function(name, args, callback) {
    	var f = this.get(name);
        
        if (f) {
        	var data = this._call(f, 'setAttributes', args);

            if (typeof callback === "function") {
                callback(data);
            }

            return data;
        }
    },

    /**
     * Check whether a media type is supported
     */
    isSupported : function(args) {
        var self = this, r, v;
        
        tinymce.each(this.aggregators, function(o) {
        	if (v = self._call(o, 'isSupported', args)) {
        		r = v;
        	}
        });

        return r;
    },

    /**
     * Return an aggregator parameter value
     * @param {String} Parameter
     */
    getParam : function(name, param) {
        var f = this.get(name);
        
        if (f) {
        	return f.params[param] || '';
        }
        
        return '';
    },

    /**
     * Set Aggregator Parameters
     * @param {Object} o Parameter Object
     */
    setParams : function(name, o) {
        var f = this.get(name);
        
        if (f) {
        	tinymce.extend(f.params, o);
        }
    },

    onSelectFile : function(name) {
    	var f = this.get(name);
    	
    	if (f) {
        	return this._call(f, 'onSelectFile');
        }
    },
    
    onInsert : function(name) {  
    	var self = this, f = this.get(name);
    	
    	if (f) {
        	return self._call(f, 'onInsert');
        }  	
    },
    
    _call : function(o, fn, vars) {
    	var f = o[fn] || function(){};
    	
    	return f.call(o, vars);
    }
});
