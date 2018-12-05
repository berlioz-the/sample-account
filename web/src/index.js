const express = require('express')
const Promise = require('promise');
const berlioz = require('berlioz-connector');

const app = express();
berlioz.setupExpress(app);

app.use(express.static('public'))
app.set('view engine', 'ejs');

app.get('/', function (req, response) {
    var renderData = {
        watchlist: []
    };

    return Promise.resolve()
        .then(() => {
            var options = { url: '/list', json: true, resolveWithFullResponse: true };
            return berlioz.service('api').request(options)
                .then(result => {
                    console.log(result);
                    if (result) {
                        renderData.watchlist = result.body; 
                    }
                })
                .catch(error => {
                    if (error instanceof Error) {
                        renderData.error = error.message + error.stack;
                    } else {
                        renderData.error = JSON.stringify(error, null, 2);
                    }
                });
        })
        .catch(error => {
            if (error instanceof Error) {
                renderData.error = error.message + error.stack;
            } else {
                renderData.error = JSON.stringify(error, null, 2);
            }
        })
        .then(() => {
            response.render('pages/index', renderData);
        });
});


app.post('/search', function (req, response) {
    var renderData = {
        entries: []
    };
    console.log("**************************************")
    console.log(req.query)
    console.log(req.params)
    console.log(req.body)
    console.log(req)

    return Promise.resolve()
        .then(() => {
            var options = { url: '/search?query=' + req.body.query, json: true, resolveWithFullResponse: true };
            return berlioz.service('api').request(options)
                .then(result => {
                    console.log(result);
                    if (result) {
                        renderData.entries = result.body; 
                    }
                })
                .catch(error => {
                    if (error instanceof Error) {
                        renderData.error = error.message + error.stack;
                    } else {
                        renderData.error = JSON.stringify(error, null, 2);
                    }
                });
        })
        .catch(error => {
            if (error instanceof Error) {
                renderData.error = error.message + error.stack;
            } else {
                renderData.error = JSON.stringify(error, null, 2);
            }
        })
        .then(() => {
            response.render('pages/search', renderData);
        });
});

app.post('/add', function (req, response) {
    var renderData = {
        entries: []
    };
    console.log("**************************************")
    console.log(req.query)
    console.log(req.params)
    console.log(req.body)

    var options = { method: 'POST', url: '/add', body: req.body, json: true};
    return berlioz.service('api').request(options)
        .then(() => {
            response.redirect("/");
        })
        .catch(error => {
            return response.status(500).send({
                message: 'Something wrong happened!'
            });
        });
});

app.listen(process.env.BERLIOZ_LISTEN_PORT_DEFAULT, process.env.BERLIOZ_LISTEN_ADDRESS, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${process.env.BERLIOZ_LISTEN_ADDRESS}:${process.env.BERLIOZ_LISTEN_PORT_DEFAULT}`)
})
