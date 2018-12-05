const express = require('express')
const Promise = require('promise');
const berlioz = require('berlioz-connector');
const AWS = require('aws-sdk');

const app = express();
berlioz.setupExpress(app);

app.use(express.static('public'))
app.set('view engine', 'ejs');

app.get('/', function (req, response) {
    response.send({
        message: 'Hello from Account :: Api Service',
        appId: process.env.BERLIOZ_TASK_ID
    });
});

app.get('/search', function (req, response) {
    console.log(req.query);
    var options = { url: '/3/search/movie?api_key=' + process.env.TMDB_KEY + '&query=' + req.query.query, json: true };
    return berlioz.cluster('tmdb').request(options)
        .then(result => {
            var entries = result.results;
            entries = entries.map(x => parseItem(x))
            response.send(entries);
        })
        .catch(error => {
            console.log(err);
            response.send({
                error: error.message
            });
        });
});

app.post('/add', function (req, response) {
    console.log(req.body);

    if (!req.body.id) {
        return response.send({error: 'Missing id'});
    }

    var options = { url: '/3/movie/' + req.body.id + '?api_key=' + process.env.TMDB_KEY, json: true };
    return berlioz.cluster('tmdb').request(options)
        .then(result => {
            var item = parseItem(result);

            var docClient = berlioz.database('movies').client(AWS);
            var params = {
                Item: item
            };
            return docClient.put(params)
                .then(data => {
                    response.send(data);
                })
        })
        .catch(err => {
            console.log(err);
            response.send({error: err.message});
        });
});

app.get('/list', function (req, response) {
    var docClient = berlioz.database('movies').client(AWS);
    return docClient.scan({})
        .then(data => {
            response.send(data.Items);
        })
        .catch(err => {
            console.log(err);
            response.send({error: err.message});
        });
});

app.get('/watch', function (req, response) {
    console.log(req.query);
    var item = {};
    return Promise.resolve()
        .then(() => {
            var options = { url: '/3/movie/' + req.query.id + '?api_key=' + process.env.TMDB_KEY, json: true };
            return berlioz.cluster('tmdb').request(options)
        })
        .then(result => {
            item = parseItem(result);
        })
        .then(() => {
            var options = { url: '/3/movie/' + req.query.id + '/images?api_key=' + process.env.TMDB_KEY, json: true };
            return berlioz.cluster('tmdb').request(options)
        })
        .then(result => {
            var images = result.backdrops.map(x => x.file_path);
            images = images.map(x => getImagePath(x));
            item.images = images;
        })
        .then(() => {
            response.send(item);
        })
        .catch(error => {
            console.log(err);
            response.send({
                error: error.message
            });
        });
});

app.listen(process.env.BERLIOZ_LISTEN_PORT_DEFAULT, process.env.BERLIOZ_LISTEN_ADDRESS, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${process.env.BERLIOZ_LISTEN_ADDRESS}:${process.env.BERLIOZ_LISTEN_PORT_DEFAULT}`)
})


function parseItem(result) {
    var item = {
        id: result.id,
        name: result.title,
        year: result.release_date.substring(0, 4),
        poster: getImagePath(result.poster_path)
    }
    return item;
}

function getImagePath(img) {
    return 'https://image.tmdb.org/t/p/w500' + img;
}