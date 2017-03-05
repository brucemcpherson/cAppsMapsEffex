/**
* some helpers to connect Apps and Effex
* @namespace AppsMapsEffex
*/
var AppsMapsEffex = (function (ns) {
  
  // short cut
  var efx = cEffexApiClient.EffexApiClient;
  
  /**
  * make a set of keys that can be stored to props service
  * @param {string} boss the boss key to use
  * @param {object|null} [params] any params to pass on to the API
  * @return {object} containg {keySet:{}, results:{}}
  */
  ns.makeKeys = function (boss,params) {
    return ['writer','reader','updater']
    .reduce (function (p,c) {
      var result = efx.generateKey (boss, c, params);
      if (!result.ok) throw 'failed to generate key ' + JSON.stringify(result);
      p[c] = result.keys[0];
      return p;
    },{});
  };
  
  /**
  * pull data from sheet and change it back to sheet format
  * @param {string} readerKey the key to use to read it with
  * @param {string} itemId the item id or alias
  */
  ns.pullValues = function (key , itemId) {
    
    // that's it
    var result = ns.pullFromEffex (key,itemId);
    if (!result.ok) {
      throw 'failed to pull data ' + JSON.stringify (result);
    }
    
    // now unobjectify data and write to sheet
    return ns.unObjectify (result.value);
  };
  
  /**
  * transform  rows of objects to values
  * @param {[]} data the data to transform
  * @param {[[*]]} spreadsheetValues
  */
  ns.unObjectify = function (data) {
    var heads = data.length ? Object.keys(data[0]) : [];
    if (heads.length) {
      var rows = data.map (function (row) {
        return heads.map (function (col) {
          return row[col];
        });
      });
      return [heads].concat (rows);
    }
    else {
      return [heads];
    }
  };
  
  /**
  * create a data item on effex for updating
  * @param {string} key the key
  * @param {string} id an alias or id to use 
  * @return {object} the final pull result
  */
  ns.pullFromEffex = function (key, id) {
    // now read the item
    return efx.read (id, key);
  };
  
  /**
  * push to effex
  * @param {object} keys a set of keys
  * @param {object} data the object to write
  * @param {boolean} [alias] to write - if no alias, then no aliasing will be done
  * @param {object} [params] any params for the API
  * @return {object} write results
  */
  ns.pushDataForUpdate = function (data , keys, alias, params) {
    
    // ensure that the updater has access if not already something else in params
    params = params || {};
    if (!params.updaters) {
      params.updaters = [keys.updater];
    }
    
    // now write the item
    result = efx.write ( data , keys.writer , "post", params);
    if (!result.ok) return result;
    
    // if an alias is required, make one 
    if (alias) {
      result = efx.registerAlias(keys.writer, keys.updater, result.id, alias);
    }
    
    // all done
    return result;
    
  };
  
  /**
  * objectify a sheet
  * @param {[[*]]} sheetValues the values
  * @return {[object]} objectfied data
  */
  ns.objectify = function(sheetValues) {
    // objectify
    var values = sheetValues.slice()
    var heads = values.shift();
    return values.map (function (row) {
      return heads.reduce (function (p,c,i) {
        p[c] = row[i];
        return p;
      },{});
    });
  };
  
  return ns;

})({});


