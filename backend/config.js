module.exports = {
    prod: {
        ip: '172.18.1.96:9200',
        taxonomias: 'taxonomias_globales',
        negocios: 'negocios_secam',
        claro_shop: 'claro_shop',
        blog: 'blog_secam'
    },

    dev: {
        ip: '10.34.180.126:9200',
        taxonomias: 'taxonomias_globales',
        negocios: 'mex_negocios',
        claro_shop: 'claro_shop_rep',
        blog: 'blog_rep'
    },

    test: {
        ip: 'https://10.34.180.131:9200',
        taxonomias: 'taxonomias_globales',
        negocios: 'businesslistingsacom',
        claro_shop: 'claro_shop_rep',
        blog: 'blog_rep'
    }
}