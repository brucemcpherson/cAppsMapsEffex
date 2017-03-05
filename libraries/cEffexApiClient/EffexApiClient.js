/**
 * basic rough driver for effex api
 * @namespace EffexApiClient
 */
var EffexApiClient =  (function (ns) {

  var DEV = 'https://nodestuff-xlibersion.c9users.io';
  var PROD = 'https://ephex-auth.appspot-preview.com';
 
  
  // the api base url
  function gasAxios () {
    var self = this;
    
    self.create= function (options) {
      self.options = options;
      return self;
    };
    
    self.get = function (url) {
      return self.exec (url);
    };
    
    self.remove = function (url) {
      return self.exec(url,"delete" );
    };
    
    self.post = function (url,payload) {
      return self.exec(url,"post" , payload);
    };
    
    self.exec = function (url , method , payload) {
      
      // all interactions are from here
      var u = self.options.baseURL + url;
      var options = {
        method:(method || "get").toUpperCase(),
        muteHttpExceptions:true
      };
      
      // if there's a payload it will always be JSON
      if (payload) {
        options.payload = JSON.stringify(payload);
        options.contentType = "application/JSON";
      }
      
      // do the fetch
      var response = UrlFetchApp.fetch (u, options);
      
      // verbose means to log the url
      if (self.options.verbose) {
        Logger.log(options.method + ":" + u);
      }
      
      // do the parse, and fail over if its garbled
      var ob;
      try {
        ob = JSON.parse (response.getContentText());
      }
      catch(err) {
        ob = {
          ok:false,
          content:response.getContentText()
        }
      }
      
      // finally add a message about failure if needed
      if (Math.floor(response.getResponseCode() /100) !== 2) {
        ob.code = response.getResponseCode;
        ob.content = response.getContentText();
        ob.ok = false;
      }
      return ob;
    }
    
  };
  
  function clone (ob) {
    return JSON.parse(JSON.stringify(ob || {}));
  }
  
  var ax = new gasAxios()
  .create ({
    baseURL:PROD,
    verbose:false
  });
  var keys;

  ns.setKeys = function (pkeys){
    keys = pkeys;
  };

  ns.getKeys = function () {
    return keys;
  };  
  
  ns.setDev = function () {
    return ns.setBase (DEV);
  };
  
  ns.setProd = function () {
    return ns.setBase (PROD);
  };
  
  ns.setVerbose = function (verbose) {
    ax.options.verbose = verbose;
    return ns;
  };
  
  ns.setBase = function (base) {
    ax.options.baseURL = base;
    return ns;
  };
  
 function clone (ob) {
    return JSON.parse(JSON.stringify(ob || {}));
  }

  /**
   * turns a params object into a url
   * @param {object} params the params
   * @return {string} the uri
   */
  function makeParams(params) {
    params = params || {};
    var pa = Object.keys(params).reduce(function(p, c) {
      p.push(c + "=" + encodeURIComponent(params[c]));
      return p;
    }, []);

    return pa.length ? ("?" + pa.join("&")) : "";
  }

  ns.checkKeys = function (preview) {
    if (!Array.isArray(preview)) preview = [preview];
    return preview.every(function(d){ return keys[d]});
  };
  
  /**
  * @param {string} boss the boss key
  * @param {string} mode the type like writer/reader/updater
  * @param {object} params the params 
  * @return {Promise} to the result
  */
  ns.generateKey = function (boss, mode,params) {
    return ax.get ('/' + boss  + '/' + mode + makeParams(params));
  };

  /**
   * ping the service
   * @return {object} "PONG"
   */
  ns.ping = function() {
    return ax.get('/ping');
  };

  /**
   * info the service
   * @return {object} result
   */
  ns.info = function() {
    return ax.get('/info');
  };

  /**
   * get quotas 
   * @return {object} the quotas
   */
  ns.getQuotas = function() {
    return ax.get('/quotas');
  };

  /**
  * update an item
  * @param {string} id the item id
  * @param {string} updater the updater key
  * @param {object} data what to write
  * @param {string} method the to use (post,get)
  * @param {object} params the params 
  * @return {Promise} to the result
  */
  ns.update = function (data, id, updater, method  , params) {
    method = (method || "post").toLowerCase();
    params = params || {};
    
    if (method === "get") {
      params = clone(params);
      params.data = JSON.stringify(data);
    }
    var url = "/updater/" + ns.checkKey("updater",updater) + "/" + ns.checkKey("item",id) + makeParams(params);
    return ax[method] (url, {data:data}); 
  };

   /**
  * @param {string} writer the writer key
  * @param {object} data what to write
  * @param {string} method the to use (post,get)
  * @param {object} params the params 
  * @return {Promise} to the result
  */
  ns.write = function (data, writer, method  , params) {
    method = (method || "post").toLowerCase();
    params = params || {};
    
    if (method === "get") {
      params = clone(params);
      params.data = JSON.stringify(data);
    }
    var url = "/writer/" + ns.checkKey("writer",writer)  + makeParams(params);
    return ax[method] (url, {data:data}); 
  };

  
  ns.checkKey = function (type, value) {
    var k=  value || keys[type];
    if (!k) console.log ("failed key check", type, value);
    return k;
  };
  

  /**
  * @param {string} id the item id
  * @param {string} writer the writer key
  * @param {object} params the params 
  * @return {Promise} to the result
  */
  ns.remove = function (id, writer  , params) {
    return ax.remove ('/writer/' + ns.checkKey("writer",writer) + '/' +  ns.checkKey("item",id) + makeParams(params || []));
  };
  
  ns.read = function (id, reader  , params) {
    params = params || {};
    id = id || keys.item;
    reader = reader || keys.reader;
    return ax.get ('/reader/' + ns.checkKey("reader",reader) + '/' + ns.checkKey("item",id) + makeParams(params));
  };

  /**
  * @param {string} coupon the coupon code
  * @return {Promise} to the result
  */
  ns.validateKey = function (coupon) {
    return ax.get ('/validate/' + coupon);
  };

  /**
  * @param {string} id the item id
  * @param {string} writer the writer key
  * @param {string} key the key to assign the alias for
  * @param {string} alias the alias to assign
  * @param {object} params the params 
  * @return {Promise} to the result
  */
  ns.registerAlias = function (writer, key, id , alias, params) {
    return ax.get('/'+ ns.checkKey("writer",writer) + '/' + key + 
      '/alias/' + encodeURIComponent(alias) + '/' + ns.checkKey("item",id) + makeParams(params));
  };


    
  return ns;
})({});



