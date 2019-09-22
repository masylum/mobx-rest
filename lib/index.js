'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var mobx = require('mobx');
var includes = _interopDefault(require('lodash/includes'));
var isObject = _interopDefault(require('lodash/isObject'));
var debounce = _interopDefault(require('lodash/debounce'));
var isEqual = _interopDefault(require('lodash/isEqual'));
var isPlainObject = _interopDefault(require('lodash/isPlainObject'));
var union = _interopDefault(require('lodash/union'));
var uniqueId = _interopDefault(require('lodash/uniqueId'));
var deepmerge = _interopDefault(require('deepmerge'));
var difference = _interopDefault(require('lodash/difference'));
var intersection = _interopDefault(require('lodash/intersection'));
var entries = _interopDefault(require('lodash/entries'));
var compact = _interopDefault(require('lodash/compact'));

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

var ErrorObject = /** @class */ (function () {
    function ErrorObject(error) {
        this.error = null;
        this.payload = {};
        this.requestResponse = null;
        if (error instanceof Error) {
            console.error(error);
            this.requestResponse = null;
            this.error = error;
        }
        else if (typeof error === 'string') {
            this.requestResponse = null;
            this.error = error;
        }
        else if (error.requestResponse || error.error) {
            this.requestResponse = error.requestResponse;
            this.error = error.error;
        }
        else {
            this.payload = error;
        }
    }
    return ErrorObject;
}());

var Request = /** @class */ (function () {
    function Request(promise, _a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, labels = _b.labels, abort = _b.abort, _c = _b.progress, progress = _c === void 0 ? 0 : _c;
        this.state = 'pending';
        this.labels = labels;
        this.abort = abort;
        this.progress = progress = 0;
        this.promise = promise;
        this.promise
            .then(function () { _this.state = 'fulfilled'; })
            .catch(function () { _this.state = 'rejected'; });
    }
    // This allows to use async/await on the request object
    Request.prototype.then = function (onFulfilled, onRejected) {
        return this.promise.then(function (data) { return onFulfilled(data || {}); }, onRejected);
    };
    __decorate([
        mobx.observable
    ], Request.prototype, "progress", void 0);
    __decorate([
        mobx.observable
    ], Request.prototype, "state", void 0);
    return Request;
}());

var currentAdapter;
/**
 * Sets or gets the api client instance
 */
function apiClient(adapter, options) {
    if (options === void 0) { options = {}; }
    if (adapter) {
        currentAdapter = Object.assign({}, adapter, options);
    }
    if (!currentAdapter) {
        throw new Error('You must set an adapter first!');
    }
    return currentAdapter;
}

var Base = /** @class */ (function () {
    function Base() {
        this.requests = mobx.observable.array([]);
    }
    /**
     * Returns the resource's url.
     *
     * @abstract
     */
    Base.prototype.url = function () {
        throw new Error('You must implement this method');
    };
    Base.prototype.withRequest = function (labels, promise, abort) {
        var _this = this;
        if (typeof labels === 'string') {
            labels = [labels];
        }
        var handledPromise = promise
            .then(function (response) {
            if (_this.request === request)
                _this.request = null;
            mobx.runInAction('remove request', function () {
                _this.requests.remove(request);
            });
            return response;
        })
            .catch(function (error) {
            mobx.runInAction('remove request', function () {
                _this.requests.remove(request);
            });
            throw new ErrorObject(error);
        });
        var request = new Request(handledPromise, {
            labels: labels,
            abort: abort
        });
        this.request = request;
        this.requests.push(request);
        return request;
    };
    Base.prototype.getRequest = function (label) {
        return this.requests.find(function (request) { return includes(request.labels, label); });
    };
    Base.prototype.getAllRequests = function (label) {
        return this.requests.filter(function (request) { return includes(request.labels, label); });
    };
    /**
     * Questions whether the request exists
     * and matches a certain label
     */
    Base.prototype.isRequest = function (label) {
        return !!this.getRequest(label);
    };
    /**
     * Call an RPC action for all those
     * non-REST endpoints that you may have in
     * your API.
     */
    Base.prototype.rpc = function (endpoint, options, label) {
        if (label === void 0) { label = 'fetching'; }
        var url = isObject(endpoint) ? endpoint.rootUrl : this.url() + "/" + endpoint;
        var _a = apiClient().post(url, options), promise = _a.promise, abort = _a.abort;
        return this.withRequest(label, promise, abort);
    };
    __decorate([
        mobx.observable
    ], Base.prototype, "request", void 0);
    __decorate([
        mobx.observable.shallow
    ], Base.prototype, "requests", void 0);
    __decorate([
        mobx.action
    ], Base.prototype, "rpc", null);
    return Base;
}());

var currentModelMapperAdapter;
/**
 * Sets or gets the api client instance
 */
function modelMapper(adapter, clear // hack for better testing
) {
    if (clear === void 0) { clear = false; }
    if (clear) {
        currentModelMapperAdapter = undefined;
    }
    if (adapter) {
        currentModelMapperAdapter = adapter;
    }
    if (!currentModelMapperAdapter && !clear) {
        throw new Error('You must set an model mapper adapter first!');
    }
    return currentModelMapperAdapter;
}

var dontMergeArrays = function (_oldArray, newArray) { return newArray; };
var DEFAULT_PRIMARY = 'id';
var Model = /** @class */ (function (_super) {
    __extends(Model, _super);
    function Model(attributes, defaultAttributes, modelMap) {
        if (attributes === void 0) { attributes = {}; }
        if (defaultAttributes === void 0) { defaultAttributes = {}; }
        if (modelMap === void 0) { modelMap = []; }
        var _this = _super.call(this) || this;
        _this.defaultAttributes = {};
        _this.attributes = mobx.observable.map();
        _this.committedAttributes = mobx.observable.map();
        _this.optimisticId = uniqueId('i_');
        _this.collection = null;
        _this.defaultAttributes = defaultAttributes;
        var mergedAttributes = __assign({}, _this.defaultAttributes, attributes);
        _this.modelMap = modelMap;
        _this.attributes.replace(mergedAttributes);
        _this.commitChanges();
        return _this;
    }
    /**
     * Returns a JSON representation
     * of the model
     */
    Model.prototype.toJS = function () {
        return mobx.toJS(this.attributes, { exportMapsAsObjects: true });
    };
    Object.defineProperty(Model.prototype, "primaryKey", {
        /**
         * Define which is the primary
         * key of the model.
         */
        get: function () {
            return DEFAULT_PRIMARY;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Return the base url used in
     * the `url` method
     *
     * @abstract
     */
    Model.prototype.urlRoot = function () {
        return null;
    };
    /**
     * Return the url for this given REST resource
     */
    Model.prototype.url = function () {
        var urlRoot = this.urlRoot();
        if (!urlRoot && this.collection) {
            urlRoot = this.collection.url();
        }
        if (!urlRoot) {
            throw new Error('implement `urlRoot` method or `url` on the collection');
        }
        if (this.isNew) {
            return urlRoot;
        }
        else {
            return urlRoot + "/" + this.get(this.primaryKey);
        }
    };
    Object.defineProperty(Model.prototype, "isNew", {
        /**
         * Wether the resource is new or not
         *
         * We determine this asking if it contains
         * the `primaryKey` attribute (set by the server).
         */
        get: function () {
            return !this.has(this.primaryKey) || !this.get(this.primaryKey);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Get the attribute from the model.
     *
     * Since we want to be sure changes on
     * the schema don't fail silently we
     * throw an error if the field does not
     * exist.
     *
     * If you want to deal with flexible schemas
     * use `has` to check wether the field
     * exists.
     */
    Model.prototype.get = function (attribute) {
        if (this.has(attribute)) {
            return this.attributes.get(attribute);
        }
        throw new Error("Attribute \"" + attribute + "\" not found");
    };
    /**
     * Returns whether the given field exists
     * for the model.
     */
    Model.prototype.has = function (attribute) {
        return this.attributes.has(attribute);
    };
    Object.defineProperty(Model.prototype, "id", {
        /**
         * Get an id from the model. It will use either
         * the backend assigned one or the client.
         */
        get: function () {
            return this.has(this.primaryKey)
                ? this.get(this.primaryKey)
                : this.optimisticId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "changedAttributes", {
        /**
         * Get an array with the attributes names that have changed.
         */
        get: function () {
            return getChangedAttributesBetween(mobx.toJS(this.committedAttributes), mobx.toJS(this.attributes));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "changes", {
        /**
         * Gets the current changes.
         */
        get: function () {
            return getChangesBetween(mobx.toJS(this.committedAttributes), mobx.toJS(this.attributes));
        },
        enumerable: true,
        configurable: true
    });
    /**
     * If an attribute is specified, returns true if it has changes.
     * If no attribute is specified, returns true if any attribute has changes.
     */
    Model.prototype.hasChanges = function (attribute) {
        if (attribute) {
            return includes(this.changedAttributes, attribute);
        }
        return this.changedAttributes.length > 0;
    };
    Model.prototype.commitChanges = function () {
        this.committedAttributes.replace(mobx.toJS(this.attributes));
    };
    Model.prototype.discardChanges = function () {
        this.attributes.replace(mobx.toJS(this.committedAttributes));
    };
    /**
     * Replace all attributes with new data
     */
    Model.prototype.reset = function (data) {
        this.attributes.replace(data
            ? __assign({}, this.defaultAttributes, data) : this.defaultAttributes);
    };
    /**
     * Merge the given attributes with
     * the current ones
     */
    Model.prototype.set = function (data) {
        this.attributes.merge(data);
    };
    /**
     * Fetches the model from the backend.
     */
    Model.prototype.fetch = function (_a) {
        var _this = this;
        if (_a === void 0) { _a = {}; }
        var data = _a.data, otherOptions = __rest(_a, ["data"]);
        var modelMap = this.modelMap;
        var _b = apiClient().get(this.url(), mapToApi(data, modelMap), otherOptions), abort = _b.abort, promise = _b.promise; // changed from const to let in order to apply chaining
        promise
            .then(function (data) { return mapToModel(data, modelMap); })
            .then(function (data) {
            _this.set(data);
            _this.commitChanges();
        })
            .catch(function (_error) {
        }); // do nothing
        return this.withRequest('fetching', promise, abort);
    };
    /**
     * Saves the resource on the backend.
     *
     * If the item has a `primaryKey` it updates it,
     * otherwise it creates the new resource.
     *
     * It supports optimistic and patch updates.
     */
    Model.prototype.save = function (attributes, _a) {
        var _this = this;
        if (_a === void 0) { _a = {}; }
        var _b = _a.optimistic, optimistic = _b === void 0 ? true : _b, _c = _a.patch, patch = _c === void 0 ? true : _c, _d = _a.keepChanges, keepChanges = _d === void 0 ? false : _d, otherOptions = __rest(_a, ["optimistic", "patch", "keepChanges"]);
        var currentAttributes = this.toJS();
        var label = this.isNew ? 'creating' : 'updating';
        var collection = this.collection;
        var data;
        var modelMap = this.modelMap;
        if (patch && attributes && !this.isNew) {
            data = attributes;
        }
        else if (patch && !this.isNew) {
            data = this.changes;
        }
        else {
            data = __assign({}, currentAttributes, attributes);
        }
        var method;
        if (this.isNew) {
            method = 'post';
        }
        else if (patch) {
            method = 'patch';
        }
        else {
            method = 'put';
        }
        if (optimistic && attributes) {
            this.set(patch
                ? applyPatchChanges(currentAttributes, attributes)
                : attributes);
        }
        if (optimistic && collection)
            collection.add([this]);
        var onProgress = debounce(function (progress) {
            if (optimistic && _this.request)
                _this.request.progress = progress;
        });
        var _e = apiClient()[method](this.url(), mapToApi(data, modelMap), __assign({ onProgress: onProgress }, otherOptions)), promise = _e.promise, abort = _e.abort;
        promise
            .then(function (data) { return mapToModel(data, modelMap); })
            .then(function (data) {
            var changes = getChangesBetween(currentAttributes, mobx.toJS(_this.attributes));
            mobx.runInAction('save success', function () {
                _this.set(data);
                _this.commitChanges();
                if (!optimistic && collection)
                    collection.add([_this]);
                if (keepChanges) {
                    _this.set(applyPatchChanges(data, changes));
                }
            });
        })
            .catch(function (error) {
            _this.set(currentAttributes);
            if (optimistic && _this.isNew && collection) {
                collection.remove(_this);
            }
        });
        return this.withRequest(['saving', label], promise, abort);
    };
    /**
     * Destroys the resurce on the client and
     * requests the backend to delete it there
     * too
     */
    Model.prototype.destroy = function (_a) {
        var _this = this;
        if (_a === void 0) { _a = {}; }
        var data = _a.data, _b = _a.optimistic, optimistic = _b === void 0 ? true : _b, otherOptions = __rest(_a, ["data", "optimistic"]);
        var collection = this.collection;
        var modelMap = this.modelMap;
        if (this.isNew && collection) {
            collection.remove(this);
            return new Request(Promise.resolve());
        }
        if (this.isNew) {
            return new Request(Promise.resolve());
        }
        var _c = apiClient().del(this.url(), mapToApi(data, modelMap), otherOptions), promise = _c.promise, abort = _c.abort;
        if (optimistic && collection) {
            collection.remove(this);
        }
        promise
            .then(function (data) { return mapToModel(data, modelMap); })
            .then(function (data) {
            if (!optimistic && collection)
                collection.remove(_this);
        })
            .catch(function (error) {
            if (optimistic && collection)
                collection.add(_this);
        });
        return this.withRequest('destroying', promise, abort);
    };
    /*
    * Helper method.
    * We may need this method to use before rpc requests response
     */
    Model.prototype.toApiObject = function (throwException) {
        if (throwException === void 0) { throwException = false; }
        return mapToApi(this.toJS(), this.modelMap, modelMapper, throwException);
    };
    /*
    * Helper method.
    * We may need this method to use after rpc requests response
     */
    Model.prototype.toModelObject = function (data, throwException) {
        if (throwException === void 0) { throwException = false; }
        return mapToModel(data, this.modelMap, modelMapper, throwException);
    };
    __decorate([
        mobx.computed
    ], Model.prototype, "isNew", null);
    __decorate([
        mobx.computed
    ], Model.prototype, "changedAttributes", null);
    __decorate([
        mobx.computed
    ], Model.prototype, "changes", null);
    __decorate([
        mobx.action
    ], Model.prototype, "commitChanges", null);
    __decorate([
        mobx.action
    ], Model.prototype, "discardChanges", null);
    __decorate([
        mobx.action
    ], Model.prototype, "reset", null);
    __decorate([
        mobx.action
    ], Model.prototype, "set", null);
    __decorate([
        mobx.action
    ], Model.prototype, "fetch", null);
    __decorate([
        mobx.action
    ], Model.prototype, "save", null);
    __decorate([
        mobx.action
    ], Model.prototype, "destroy", null);
    return Model;
}(Base));
/**
 * Merges old attributes with new ones.
 * By default it doesn't merge arrays.
 */
var applyPatchChanges = function (oldAttributes, changes) {
    return deepmerge(oldAttributes, changes, {
        arrayMerge: dontMergeArrays
    });
};
var getChangedAttributesBetween = function (source, target) {
    var keys = union(Object.keys(source), Object.keys(target));
    return keys.filter(function (key) { return !isEqual(source[key], target[key]); });
};
var getChangesBetween = function (source, target) {
    var changes = {};
    getChangedAttributesBetween(source, target).forEach(function (key) {
        changes[key] = isPlainObject(source[key]) && isPlainObject(target[key])
            ? getChangesBetween(source[key], target[key])
            : target[key];
    });
    return changes;
};
/*
* Maps api response model to model.
* Default : It returns api response data as is.
 */
var mapToModel = function (data, map, mapper, throwError) {
    if (mapper === void 0) { mapper = modelMapper; }
    if (throwError === void 0) { throwError = false; }
    try {
        var adapter = mapper();
        if (map.length > 0) { // test if model has map and modelMapper has an adapter
            data = adapter.apiToModel(data, map);
        }
        else {
            if (throwError)
                throw new Error("Undefined model map");
        }
    }
    catch (_error) {
        //do nothing so we can return data as is
        if (throwError)
            throw new Error(_error);
    }
    return data;
};
/*
* Maps model to api(request) model.
* Default : It returns data as is.
 */
var mapToApi = function (data, map, mapper, throwError) {
    if (mapper === void 0) { mapper = modelMapper; }
    if (throwError === void 0) { throwError = false; }
    try {
        var adapter = mapper();
        if (map.length > 0) { // test if model has map and modelMapper has an adapter
            data = adapter.modelToApi(data, map);
        }
        else {
            if (throwError)
                throw new Error("Undefined model map");
        }
    }
    catch (_error) {
        //do nothing so we can return data as is
        if (throwError)
            throw new Error(_error);
    }
    return data;
};

function getAttribute(resource, attribute) {
    if (resource instanceof Model) {
        return resource.has(attribute)
            ? resource.get(attribute)
            : null;
    }
    else {
        return resource[attribute];
    }
}
var Collection = /** @class */ (function (_super) {
    __extends(Collection, _super);
    function Collection(data) {
        if (data === void 0) { data = []; }
        var _this = _super.call(this) || this;
        _this.models = mobx.observable.array([]);
        _this.indexes = [];
        _this.set(data);
        return _this;
    }
    Object.defineProperty(Collection.prototype, "primaryKey", {
        /**
         * Define which is the primary key
         * of the model's in the collection.
         *
         * FIXME: This contains a hack to use the `primaryKey` as
         * an instance method. Ideally it should be static but that
         * would not be backward compatible and Typescript sucks at
         * static polymorphism (https://github.com/microsoft/TypeScript/issues/5863).
         */
        get: function () {
            var ModelClass = this.model();
            if (!ModelClass)
                return DEFAULT_PRIMARY;
            return (new ModelClass()).primaryKey;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Collection.prototype, "index", {
        /**
         * Returns a hash with all the indexes for that
         * collection.
         *
         * We keep the indexes in memory for as long as the
         * collection is alive, even if no one is referencing it.
         * This way we can ensure to calculate it only once.
         */
        get: function () {
            var _this = this;
            var indexes = this.indexes.concat([this.primaryKey]);
            return indexes.reduce(function (tree, attr) {
                var newIndex = _this.models.reduce(function (index, model) {
                    var value = model.has(attr)
                        ? model.get(attr)
                        : null;
                    var oldModels = index.get(value) || [];
                    return index.set(value, oldModels.concat(model));
                }, new Map());
                return tree.set(attr, newIndex);
            }, new Map());
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Collection.prototype, "length", {
        /**
         * Alias for models.length
         */
        get: function () {
            return this.models.length;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Alias for models.map
     */
    Collection.prototype.map = function (callback) {
        return this.models.map(callback);
    };
    /**
     * Alias for models.forEach
     */
    Collection.prototype.forEach = function (callback) {
        return this.models.forEach(callback);
    };
    /**
     * Returns a JSON representation
     * of the collection
     */
    Collection.prototype.toJS = function () {
        return this.models.map(function (model) { return model.toJS(); });
    };
    /**
     * Alias of slice
     */
    Collection.prototype.toArray = function () {
        return this.slice();
    };
    /**
     * Returns a defensive shallow array representation
     * of the collection
     */
    Collection.prototype.slice = function () {
        return this.models.slice();
    };
    Object.defineProperty(Collection.prototype, "isEmpty", {
        /**
         * Wether the collection is empty
         */
        get: function () {
            return this.length === 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Collection.prototype, "_ids", {
        /**
         * Gets the ids of all the items in the collection
         */
        get: function () {
            return compact(Array.from(this.index.get(this.primaryKey).keys()));
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Get a resource at a given position
     */
    Collection.prototype.at = function (index) {
        return this.models[index];
    };
    /**
     * Get a resource with the given id or uuid
     */
    Collection.prototype.get = function (id, _a) {
        var _b = (_a === void 0 ? {} : _a).required, required = _b === void 0 ? false : _b;
        var models = this.index.get(this.primaryKey).get(id);
        var model = models && models[0];
        if (!model && required) {
            throw new Error("Invariant: Model must be found with " + this.primaryKey + ": " + id);
        }
        return model;
    };
    /**
     * Get a resource with the given id or uuid or fail loudly.
     */
    Collection.prototype.mustGet = function (id) {
        return this.get(id, { required: true });
    };
    /**
     * Get resources matching criteria.
     *
     * If passing an object of key:value conditions, it will
     * use the indexes to efficiently retrieve the data.
     */
    Collection.prototype.filter = function (query) {
        var _this = this;
        if (typeof query === 'function') {
            return this.models.filter(function (model) { return query(model); });
        }
        else {
            // Sort the query to hit the indexes first
            var optimizedQuery = entries(query).sort(function (A, B) {
                return Number(_this.index.has(B[0])) - Number(_this.index.has(A[0]));
            });
            return optimizedQuery.reduce(function (values, _a) {
                var attr = _a[0], value = _a[1];
                // Hitting index
                if (_this.index.has(attr)) {
                    var newValues = _this.index.get(attr).get(value) || [];
                    return values ? intersection(values, newValues) : newValues;
                }
                else {
                    // Either Re-filter or Full scan
                    var target = values || _this.models;
                    return target.filter(function (model) {
                        return model.has(attr) && model.get(attr) === value;
                    });
                }
            }, null);
        }
    };
    /**
     * Finds an element with the given matcher
     */
    Collection.prototype.find = function (query, _a) {
        var _b = (_a === void 0 ? {} : _a).required, required = _b === void 0 ? false : _b;
        var model = typeof query === 'function'
            ? this.models.find(function (model) { return query(model); })
            : this.filter(query)[0];
        if (!model && required) {
            throw new Error("Invariant: Model must be found");
        }
        return model;
    };
    /**
     * Get a resource with the given id or uuid or fails loudly.
     */
    Collection.prototype.mustFind = function (query) {
        return this.find(query, { required: true });
    };
    /**
     * Adds a model or collection of models.
     */
    Collection.prototype.add = function (data) {
        var _this = this;
        var _a;
        if (!Array.isArray(data))
            data = [data];
        var models = difference(data.map(function (m) { return _this.build(m); }), this.models);
        (_a = this.models).push.apply(_a, models);
        return models;
    };
    /**
     * Resets the collection of models.
     */
    Collection.prototype.reset = function (data) {
        var _this = this;
        this.models.replace(data.map(function (m) { return _this.build(m); }));
    };
    /**
     * Removes the model with the given ids or uuids
     */
    Collection.prototype.remove = function (ids) {
        var _this = this;
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        ids.forEach(function (id) {
            var model;
            if (id instanceof Model && id.collection === _this) {
                model = id;
            }
            else if (typeof id === 'number' || typeof id === 'string') {
                model = _this.get(id);
            }
            if (!model) {
                return console.warn(_this.constructor.name + ": Model with " + _this.primaryKey + " " + id + " not found.");
            }
            _this.models.splice(_this.models.indexOf(model), 1);
            model.collection = undefined;
        });
    };
    /**
     * Sets the resources into the collection.
     *
     * You can disable adding, changing or removing.
     */
    Collection.prototype.set = function (resources, _a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, _c = _b.add, add = _c === void 0 ? true : _c, _d = _b.change, change = _d === void 0 ? true : _d, _e = _b.remove, remove = _e === void 0 ? true : _e;
        if (remove) {
            var ids = compact(resources.map(function (r) {
                return getAttribute(r, _this.primaryKey);
            }));
            var toRemove = difference(this._ids, ids);
            if (toRemove.length)
                this.remove(toRemove);
        }
        resources.forEach(function (resource) {
            var id = getAttribute(resource, _this.primaryKey);
            var model = id ? _this.get(id) : null;
            if (model && change) {
                model.set(resource instanceof Model ? resource.toJS() : resource);
            }
            if (!model && add)
                _this.add([resource]);
        });
    };
    /**
     * Creates a new model instance with the given attributes
     */
    Collection.prototype.build = function (attributes) {
        if (attributes === void 0) { attributes = {}; }
        if (attributes instanceof Model) {
            attributes.collection = this;
            return attributes;
        }
        var ModelClass = this.model(attributes);
        var model = new ModelClass(attributes);
        model.collection = this;
        return model;
    };
    /**
     * Creates the model and saves it on the backend
     *
     * The default behaviour is optimistic but this
     * can be tuned.
     */
    Collection.prototype.create = function (attributesOrModel, _a) {
        var _this = this;
        var _b = (_a === void 0 ? {} : _a).optimistic, optimistic = _b === void 0 ? true : _b;
        var model = this.build(attributesOrModel);
        var request = model.save({}, { optimistic: optimistic });
        this.requests.push(request);
        var promise = request.promise;
        promise
            .then(function (_response) {
            _this.requests.remove(request);
        })
            .catch(function (error) {
            _this.requests.remove(request);
        });
        return request;
    };
    /**
     * Fetches the models from the backend.
     *
     * It uses `set` internally so you can
     * use the options to disable adding, changing
     * or removing.
     */
    Collection.prototype.fetch = function (_a) {
        var _this = this;
        if (_a === void 0) { _a = {}; }
        var data = _a.data, otherOptions = __rest(_a, ["data"]);
        var _b = apiClient().get(this.url(), data, otherOptions), abort = _b.abort, promise = _b.promise;
        promise
            .then(function (data) { return _this.set(data, otherOptions); })
            .catch(function (_error) { }); // do nothing
        return this.withRequest('fetching', promise, abort);
    };
    __decorate([
        mobx.observable
    ], Collection.prototype, "models", void 0);
    __decorate([
        mobx.computed({ keepAlive: true })
    ], Collection.prototype, "index", null);
    __decorate([
        mobx.computed
    ], Collection.prototype, "length", null);
    __decorate([
        mobx.computed
    ], Collection.prototype, "isEmpty", null);
    __decorate([
        mobx.computed
    ], Collection.prototype, "_ids", null);
    __decorate([
        mobx.action
    ], Collection.prototype, "add", null);
    __decorate([
        mobx.action
    ], Collection.prototype, "reset", null);
    __decorate([
        mobx.action
    ], Collection.prototype, "remove", null);
    __decorate([
        mobx.action
    ], Collection.prototype, "set", null);
    __decorate([
        mobx.action
    ], Collection.prototype, "create", null);
    __decorate([
        mobx.action
    ], Collection.prototype, "fetch", null);
    return Collection;
}(Base));

exports.Collection = Collection;
exports.ErrorObject = ErrorObject;
exports.Model = Model;
exports.Request = Request;
exports.apiClient = apiClient;
