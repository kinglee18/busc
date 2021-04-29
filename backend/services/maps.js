const client = require('../elastic/client');

/** 
* This function search the address or searchterm in elasticsearch.
* if address is provided it will perform a phrase search into state, city or zipcode fields, 
* a cross field search into state and city and a search into colony field including certain cities
* if searchTerm is provided it will perform a 
* @param {string} address - placename previously extracted from search
* @param {string} searchTerm - complete searchTerm
*/
exports.search = async function (address, searchTerm) {
	let body = {};
	if (address) {
		body = {
			"sort": [
				"_score",
				{
					"relevance": {
						"order": "desc"
					}
				}
			],
			"size": 1,
			"query": {
				"bool": {
					"should": [
						stateQuery(address),
						cityQuery(address),
						colonyQuery(address),
							{
								bool: {
									must_not:[{
										exists: {
											field: 'colony'
										}
									}],
									must: [
										{
											"multi_match": {
												"query": address,
												"fields": [
													"statename",
													"state",
													"city",
													"initials",
													"statename",
													'zc'
												],
												"analyzer": "spanish_analyzer",
												"type": "cross_fields",
												"_name": 'multi'
											}
										}
									]
								}
							}
						]
					}
					
				}
			}
		} else {
			body = {
				"size": 1,
				"query": {
					"bool": {
						"should": [
							{
								"multi_match": {
									"query": searchTerm,
									"fields": [
										"zc",
										"state.spanish^8",
										"statename^3",
										"city.spanish",
										"statename.keyword"
									],
								}
							},
							{
								"bool": {
									"must": [
										{
											"match": {
												"statename": searchTerm
											}
										},
										{
											"match": {
												"city": searchTerm
											}
										}
									],
									"filter": [
										{
											"script": {
												"script": {
													"source": "if (doc['city.keyword'].size() > 0 ){doc['city.keyword'].value !=  doc['statename.keyword'].value}"
												}
											}
										},
										{
											bool: {
												"must_not": [
													{
														"exists": {
															"field": "postal_code"
														}
													},
													{
														"exists": {
															"field": "zc"
														}
													}
												]
											}
										}
									]
								}
							}
						]
					}
				}
			}
		}
		const requestBody = {
			index: process.env.locations,
			body
		};
		const request = await client.getClient().search(requestBody);
		if (request.hits.hits.length) {
		console.log(JSON.stringify(request.hits.hits[0]._id));

			return {
				"physicalstate": request.hits.hits[0]._source.statename,
				"physicalcity": request.hits.hits[0]._source.city,
				"postalCode": request.hits.hits[0]._source.zc || request.hits.hits[0]._source.zip,
				"colony": request.hits.hits[0]._source.colony,
				"initials": request.hits.hits[0]._source.initials || request.hits.hits[0]._source.state
			};
		}
		return
	}
	
	const stateQuery = (address) => {
		return {
			bool: {
				must_not: [
					{
						exists: {
							field: 'city'
						}
					}
				],
				must: [
					{
						"match": {
							"state.spanish": {
								'query': address,
								'boost': 10,
								'operator': 'and',
								'_name': 'state'
							}
						}
					}
				]
			}
		}
	};
	
	const cityQuery = (address) => {
		return {
			bool: {
				must_not: [
					{
						"match": {
							"state.spanish": {
								'query': address, 
								'operator': 'and'
							}
						}
					},
					{
						exists: {
							field: 'colony'
						}
					}
				],
				
				must: [
					{
						"match": {
							"city.spanish": {
								'query': address,
								'_name': 'city',
								'operator': 'and',
								'fuzziness': 1,
								boost: 2
							}
						}
					}
				]
			}
		}
	}

	const colonyQuery = (address) => {
		return {
			"bool": {
				must_not: [
					{
						"match": {
							"state.spanish": {
								"query": address,
								"operator": "and"
							}
						}
					},
				],
				must: [
					{
						"match": {
							"colony.spanish": {
								"query": address,
								"operator": "and",
								'_name': 'col'
							}
						}
					}
				],
				filter: [
					{
						"bool": {
							"should": [
								{
									"match": {
										"statename": "DISTRITO FEDERAL"
									}
								},
								{
									"match": {
										"city": "MONTERREY"
									}
								},
								{
									"match": {
										"city": "GUADALAJARA"
									}
								}
							]
						}}
					]
				}
		}
	} 