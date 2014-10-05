/*============== ElasticSearch module start ===============*/

var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    host: '178.62.234.113:9200'
});


var queryElastic = function (req, res, next) {
    if (!req.query.q) {
        var error = new Error("search query is empty");
        error.status = 400;
        return next(error);
    }

    if (req.query.q.length > 256) {
        var error = new Error("search query is to long");
        error.status = 400;
        return next(error);
    }

    var page = 1,
        size = 5;

    if (req.query.page && req.query.page > 0) page = req.query.page;
    if (req.query.size && req.query.size > 0) size = req.query.size;

    var q = req.query.q,
        first_q = req.query.q.split(/([' ', '+'])/)[0];

    client.search({
            index: 'spots',
            type: 'spot',
            page: page,
            size: size,
            body: {
                "query": {
                    "bool": {
                        "should": [
                            {
                                "match": {
                                    "name": {
                                        "query": q,
                                        "operator": "or"
                                    }
                                }
                            },
                            { "match": {
                                "name": {
                                    "query": first_q,
                                    "boost": 1
                                }
                            }
                            }
                        ]
                    }
                }
            }
        },
        function (err, resp) {
            if (err) return next(err);
            resp.page = page;
            resp.size = size;
            return next(null, resp, res);
        })

}

var handleResult = function (err, data, res) {

    if (err) {
        res.send({
            status: err.status || 500,
            message: err.message || "server error",
            data: {
                total: 0
            }
        })
    } else {
        res.send({
            status: 200,
            data: {
                total: data.hits.total,
                page: data.page,
                size: data.size,
                results: data.hits.hits
            }
        });
    }
}

var search = function (req, res) {
    queryElastic(req, res, handleResult)
}

module.exports = search;