const axios = require('axios');
const elastic = require('./elastic/client')
const BLOG_URL = 'https://blog.seccionamarilla.com.mx/api/get_posts';

exports.blogCron = function () {
    const client = elastic.getClient();

    const totalLastPost = axios.get(BLOG_URL, {
        params: {
            page: 1, count: 20
        }
    });
    const totalElastic = client.count(
        { index: 'blog_rep' }
    );
    Promise.all([totalElastic, totalLastPost]).then(response => {
        let postDiference = response[1].data.count_total - response[0].count;
        if (postDiference > 0) {
            updateElasticPosts(postDiference);
        }
    });
}

function updateElasticPosts(diference, page = 1) {
    let count = diference >= 20 ? 20 : diference;
    axios.get(BLOG_URL, {
        params: {
            page: page++, count
        }
    }).then(response => {
        savePostInElastic(response.data.posts);
        diference -= 20;
        if (diference > 0) {
            updateElasticPosts(diference, page);
        }
    });
}

function savePostInElastic(posts) {
    const client = elastic.getClient();

    let body = [];
    posts.forEach(element => {
        delete element.custom_fields.response_body
        element.content = element.content.replace(/(\r\n|\n|\r)/gm, "");
        element.excerpt = element.excerpt.replace(/(\r\n|\n|\r)/gm, "");
        body.push({ "index": {} });
        body.push(element)
    });
    client.bulk({
        index: 'blog_rep',
        body
    }).then(data => {
        console.log("Se ingresaron nuevos articulos:", posts.length);
    }).catch(err => {
        console.error(err);
    })
}