var Now = require('../now');
var should = require('chai').should();
var asynk = require('async');
var art = require('ascii-art');
var exec = require('child_process').exec;

var singleItem = [
    { activity : 'something', complete : 2, total : 3, date : '2019-10-31 00:00:00' },
    { activity : 'something', complete : 2, total : 8, date : '2019-10-31 00:12:45' },
    { activity : 'something', complete : 5, date : '2019-10-31 00:34:10' }
];

var secondItem = [
    { activity : 'someother', complete : 10, total : 10, date : '2019-10-31 00:00:00' },
    { activity : 'someother', total : 12, date : '2019-10-31 00:05:30' },
    { activity : 'someother', complete : 11, date : '2019-10-31 00:17:32' }
];

var binDir = './bin/';

var readmeExample = [
    // I did a couple of hours work on some design
    'now-i did --activity=design --scope=my-project:mvp --complete=2',
    // I did some more work and figured out I think the total design will take 10 hours
    'now-i did --activity=design --scope=my-project:mvp --add-complete=2 --total=10',
    // built out a skeleton of the project
    'now-i did --activity=programming --scope=my-project:mvp --complete=2',
    // did some more work and figured out the total scope of programming the MVP
    'now-i did --activity=design --scope=my-project:mvp --add-complete=2',
    'now-i did --activity=programming --scope=my-project:mvp --add-complete=3 --total=15',
    //later I finish the MVP design
    'now-i did --activity=design --scope=my-project:mvp --complete=10',
    //I get ahead by starting on the design for the next phase of the project
    'now-i did --activity=design --scope=my-project:ui-spec --complete=2',
]

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

var dataToEvents = function(items){
    return items.map(function(item){
        return new Now.I(item);
    });
}

describe('Now', function(){

    describe('exports', function(){
        it('I', function(){ should.exist(Now.I) });
        it('Collation', function(){ should.exist(Now.Collation) });
        it('Collection', function(){ should.exist(Now.Collection) });
    });

    describe('assembles', function(){

        it('A single item', function(done){
            var collection = new Now.Collection(dataToEvents(singleItem));
            collection.collate(function(err, results){
                should.not.exist(err);
                should.exist(results['something:personal']);
                results['something:personal'].activity.should.equal('something');
                results['something:personal'].complete.should.equal(5);
                results['something:personal'].total.should.equal(8);
                done();
            })
        });

        it('Multiple Items, out of order', function(done){
            var collection = new Now.Collection(
                shuffleArray(
                    dataToEvents(singleItem)
                        .concat(dataToEvents(secondItem))
                )
            );
            collection.collate(function(err, results){
                should.not.exist(err);
                should.exist(results['something:personal']);
                results['something:personal'].activity.should.equal('something');
                results['something:personal'].complete.should.equal(5);
                results['something:personal'].total.should.equal(8);
                should.exist(results['someother:personal']);
                results['someother:personal'].activity.should.equal('someother');
                results['someother:personal'].complete.should.equal(11);
                results['someother:personal'].total.should.equal(12);
                done();
            })
        });
    });

    describe('command-line', function(){
        beforeEach(function(done){
            exec('rm -Rf "'+__dirname+'/data"',function(){
                exec('mkdir -p "'+__dirname+'/data"',function(){
                    done();
                });
            });
        });

        it('works for readme example', function(testDone){
            this.timeout(10000);
            var dirArg = ' --data-directory '+__dirname+'/data --output-format json';
            asynk.eachOfSeries(readmeExample, function(line, index, done){
                var toExecute = binDir + line + dirArg;
                exec(toExecute, function(err, stdout, stderr){
                    should.not.exist(err);
                    stderr.trim().should.equal('');
                    setTimeout(function(){
                        done();
                    }, 1000);
                });
            }, function(){
                exec('./bin/now-i work --for scope…my-project'+dirArg, function(err, stdout, stderr){
                    should.not.exist(err);
                    stderr.trim().should.equal('');
                    var data;
                    try{
                        data = JSON.parse(stdout);
                    }catch(ex){
                        should.not.exist(ex);
                    }
                    var tdata = Object.keys(data.collations)
                        .map(function(key){ return data.collations[key] });
                    var thead = Object.keys(tdata[0]).map(function(key){
                        return { value : key, style : 'white' };
                    });
                    art.table({
                        width : 120,
                        data : tdata,
                        headerStyle : 'yellow',
                        bars : 'double',
                        includeHeader: true,
                        dataStyle : 'bright_white',
                        borderColor : 'gray',
                        columns : thead
                    }, function(rendered){
                        // use rendered text
                        var progMvp = data.collations['programming:my-project:mvp'];
                        var designSpec = data.collations['design:my-project:ui-spec'];
                        var designMvp = data.collations['design:my-project:mvp'];
                        should.exist(progMvp);
                        should.exist(designSpec);
                        //this is complete, it should not return as current work
                        console.log(designMvp);
                        should.not.exist(designMvp);

                        progMvp.total.should.equal(15);
                        progMvp.complete.should.equal(5);

                        designSpec.complete.should.equal(2);
                        should.not.exist(designSpec.total);

                        testDone();
                    });
                });
            })
        });
    });
});
