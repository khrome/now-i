Now I ...
=========

Work/Time Tracker/Analyzer

Inspired by Derek Sivers concept of [Now Pages](https://sivers.org/now), [NowNowNow](https://nownownow.com/) and my previous system for updating a timeline on my personal page, this is a system to track things you're working on without any kind of planning process. (**Got** things done, lol)

I think we waste a massive amount of effort rationalizing our projections of idyllic futures in meeting rooms, when in reality those drafted plans are altered in the field in a state of triage. This leads to a lack of any real data as the ideal never matches the implementation.

I would like to forward the un-radical idea that only work that is done actually matters, and that mingling work tracking(something that should have hard data) and project planning(something with softer, more ephemeral data and less concrete goals) **only** benefits the companies that provide tools to facilitate this process and their partner networks of affiliates, experts, event planners and third party implementors. By separating work tracking, we get something simple and reliable, without subjecting that work to the constant flux of wishful projections.

Someday this may intersect a forcasting tool, but it will never internalize that forcast data.

It looks something like this:

`now-i did my-project-prototype --add-complete=3.5`

There are essentially 4 steps to the process:

1. create an entry
2. aggregate entries
3. generate analytics
4. push data against a text template

This JSON provides a structured format for the updating of a single item of work, giving

Final Model
-----------

    - stack of JSON entries
    - a stack of meta instructions to do simple calculations
        - a set selection criteria
        - an operation to perform on the set
    - a template that runs on the aggregated results of the
    - various places to write this output
        - home page
        - personal social network
        - professional social network
        - coding profile


A Sample Quickstart
-------------------

```bash
# I did a couple of hours work on some design
now-i did --activity=design --scope=my-project:mvp --complete=2
# I did some more work and figured out I think the total design will take 10 hours
now-i did --activity=design --scope=my-project:mvp --add-complete=2 --total=10
# built out a skeleton of the project
now-i did --activity=programming --scope=my-project:mvp --complete=2
# did some more work and figured out the total scope of programming the MVP
now-i did --activity=design --scope=my-project:mvp --add-complete=2
now-i did --activity=programming --scope=my-project:mvp --add-complete=3 --total=15
#later I finish the MVP design
now-i did --activity=design --scope=my-project:mvp --complete=10
#I get ahead by starting on the design for the next phase of the project
now-i did --activity=design --scope=my-project:ui-spec --complete=2
```

Now let's look and see what we've done on the project thusfar:
```bash
now-i search --for scope…my-project
```

table here

If I want to see what items are left unfinished:
```bash
now-i work --for scope…my-project
```

![work-output](docs/ouput.png)

`--output-format` supports `json`, `json-pretty`, `ansi-table` and [TBD]`csv`

Taxonomy Format[TBD]
---------------

works like CSS selectors

`root-item > sub-item > leaf-item`

will match with:

`parent-item > root-item > some-other-item > sub-item > leaf-item`

(maybe use holons?, possibly support xpath)

all matching is local against an indexed DB (containing all seen tags). This ensures granularity changes don't break linkages, only branch moving.

can define aliases `[something]` which can then be used as "packages" of taxonomies for common work


JSON Entry Format
-----------------

```js
{
    "activity" : '',
    "iteration" : '', //default : 0
    "complete" : '', //default : 0
    "total" : '', //default : 0
    "taxonomies" : [],
    "links" : {}, //default : {}
    "meta" : {}, //default : {} untracked data
    "magnitude" : 1, //default : 1 the granularity of a task
    "type" : '', //any string: design, development, etc.
    "scope" : '', // personal, public, private or a custom string
}
```
**now** is always the scope of any activity, nothing happens in the past

JSON Aggregation Format [TBD]
-----------------------

```js
{
    "set" : /* Mongo Query Document */'',
    "operation" : /* name or  */'',
    "options" : {}
}
```

Simple Template

```handlebars
Hi! I'm {{full-name}}!

{{description}}

I tend to work on {{#each expertises as expertise}}{{expertise.label}}{{/each}}

```

Roadmap
-------

- feature complete
    - query language support
        - mongo
        - SQL
    - analytics
    - visualization
- streaming
- git import
