var asynk = require('async');
var moment = require('moment');

var Now = {};

Now.common = {};

Now.common.taxonomyAliases = {
    'programming' : ['javascript', 'HTML', 'css', 'nodejs']
}
Now.common.taxonomies = {
    'programming' : [
        'engineering:computer science:implementation'
    ]
}
Now.common.types = ['home', 'chore', 'design', 'development']


Now.defaults = {
    "activity" : '',
    "iteration" : '', //default : 0
    "complete" : '', //default : 0
    "total" : '', //default : 0
    "taxonomies" : [],
    "links" : {}, //default : {}
    "meta" : {}, //default : {} untracked data
    "magnitude" : 1, //default : 1 the granularity of a task
    "type" : '', //any string: design, development, etc.
    "scope" : 'personal', // personal, public, private or a custom string
}

Now.I = function(opts){
    var options = opts || {};
    this.options = {};
    this.data = {};
    if(options.activity) this.data.activity = options.activity;
    if(options.iteration) this.data.iteration = options.iteration;
    if(options.complete) this.data.complete = options.complete;
    if(options.date) this.data.date = moment(options.date);
    if(options.total) this.data.total = options.total;
    if(options.taxonomies) this.data.taxonomies = options.taxonomies;
    if(options.meta) this.data.links = options.links;
    if(options.magnitude) this.data.magnitude = options.magnitude;
    if(options.type) this.data.type = options.type;
    if(options.scope) this.data.scope = options.scope;
}

Now.I.prototype.set = function(name, value){
    return (this.data[name] = value);
}

Now.I.prototype.get = function(name, value){
    return this.data[name];
}

Now.I.prototype.reconcile = function(object, analytics){
    //todo: support analytics gathering, too
    var data = this.data;
    Object.keys(this.data).forEach(function(key){
        object[key] = Now.collations[key](data[key], object[key], data, object);
    });

    return object;
}

Now.Collection = function(set, opts){ //a grouping of events to analyze
    this.collations = {};
    this.set = set;
    this.options = opts || {};
}

//todo: progressive collation
var val = function(ob, key){
    return ob[key] || Now.defaults[key];
}
Now.Collection.prototype.collate = function(gp, cb){
    var grouper = (cb && gp) || function(item){
        return val(item.data,'activity')+':'+val(item.data,'scope')};
    var callback = (gp && cb) || gp;
    var ob = this;
    var set = this.set;
    var options = this.options;
    var name;
    //todo: sort by date
    asynk.eachOfSeries(set.sort(function(a, b){
        return a.data.date.unix() - b.data.date.unix();
    }), function(item, index, done){
        name = grouper(item);
        if(!ob.collations[name]) ob.collations[name] = new Now.Collation();
        ob.collations[name].now(item);
        done();
    }, function(){
        //data is now assembled and ready to process
        var results = {};
        var history = {};
        asynk.eachOfSeries(Object.keys(ob.collations), function(key, index, done){
            ob.collations[key].collate(function(){
                results[key] = ob.collations[key].data;
                history[key] = ob.collations[key].history;
                done();
            });
        }, function(){
            callback(undefined, results, history, grouper);
        });
    })
}

Now.Collation = function(){ //the current state of any particular thing
    this.events = [];
    this.unreconciled = [];
    this.history = [];
    this.data = {};
}

Now.Collation.prototype.now = function(event){
    this.events.push(event);
    this.unreconciled.push(event);
}
Now.Collation.prototype.collate = function(cb){
    var event;
    var ob = this;
    while(this.unreconciled.length){ //safest for recovery
        event = this.unreconciled.shift();
        ob.data = event.reconcile(ob.data);
        ob.history.push(JSON.parse(JSON.stringify(ob.data)));
    }
    cb();
}

var preferCurrent = function(newValue, currentValue, newObject, existingObject){
    return currentValue || newValue;
}

var preferNew = function(newValue, currentValue, newObject, existingObject){
    return newValue || currentValue;
}

var keepAllUnique = function(newValue, currentValue, newObject, existingObject){
    if(newValue && currentValue){
        newValue.forEach(function(value, index){
            if(currentValue.indexOf(value) === -1){
                currentValue.push(value);
            }
        });
        return currentValue;
    }else return newValue || currentValue;
};

var integrate = function(newValue, currentValue, newObject, existingObject){
    if(newValue && currentValue){
        Object.keys(newValue).forEach(function(key, index){
            currentValue[key] = newValue;
        });
        return currentValue;
    }else return newValue || currentValue;
};

var dateHandler = function(newValue, currentValue, newObject, existingObject){
    if(
        (
            existingObject['creation-date'] > newValue
        ) || !existingObject['creation-date']
    ) existingObject['creation-date'] = newValue;
    if(
        existingObject['modification-date'] < newValue ||
        !existingObject['modification-date']
    )existingObject['modification-date'] = newValue;
    return newValue;
};

Now.collations = {
    activity : preferCurrent, //shouldn't change past first set
    iteration : preferNew,
    complete : preferNew,
    date : dateHandler,
    total : preferNew,
    taxonomies : keepAllUnique,
    links : integrate,
    meta : integrate,
    magnitude : preferNew,
    scope : preferCurrent //shouldn't change past first set
}

module.exports = Now;
