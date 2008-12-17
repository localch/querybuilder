/**
 * Demo configuration for the Yahoo! BOSS web service.
 * http://developer.yahoo.com/search/boss/
 */

// Fill in your Yahoo! Boss API key here
var BOSS_APPID = '';

config.yahoo_boss = {
    name: 'Yahoo! BOSS',
    hosts: {
        live: {host: 'boss.yahooapis.com', applicationname: ''}
    },
    commands: {
        websearch: {
            name: 'Web Search',
            path: 'ysearch/web/v1/{query}',
            fields: {
                appid: {added: 'mustbepresent', preset: BOSS_APPID, description: 'Boss App ID. <a href="https://developer.yahoo.com/wsregapp/">Request one from Yahoo</a>.'},
                query: {added: 'start', description: 'The search terms. See <a href="http://developer.yahoo.com/search/boss/boss_guide/univer_api_query.html">Universal BOSS API Arguments</a> for documentation.'},
                start: {description: 'Ordinal position of first result. First position is 0. Default sets start to 0.'},
                count: {description: 'Total number of results to return. Maximum value is |50|. Default sets count to |10|.'},
                lang: {description: 'Specifies the language search product to query. See <a href="http://developer.yahoo.com/search/boss/boss_guide/supp_regions_lang.html">Supported Regions and Languages for Web and News Search</a>. Default sets lang to "|en|". Must be used in parallel with region.'},
                region: {description: 'Specifies which regional (country) search product to query. See <a href="http://developer.yahoo.com/search/boss/boss_guide/supp_regions_lang.html">Supported Regions and Languages for Web and News Search</a>. Default sets region to "|us|". Must be used in parallel with lang.'},
                format: {added: 'start', preset: 'xml', description: 'The data format of the response. Value can be set to either "|xml|" or "|json|". Default sets format to "json".'},
                callback: {description: 'The name of the callback function to wrap the result. Parameter is valid only if format is set to "json". No default value exists.'},
                sites: {description: 'Restrict BOSS search results to a set of pre-defined sites. Multiple sites must be comma separated. Example: (sites=abc.com,cnn.com). The Images service does not yet support multiple sites. Note: This argument can use a single site parameter.'},
                view: {description: 'Introducing View! Retrieve additional search data provided by the respective BOSS service. In the current version only view=|keyterms| is offered via the BOSS Web Search service. More views for more BOSS services coming soon.'}
            },
            doc_parameters: 'http://developer.yahoo.com/search/boss/boss_guide/univer_api_query.html',
            doc_response: 'http://developer.yahoo.com/search/boss/boss_guide/ch02s02.html',
            responses: {
                200: {
                    '__desc': 'Normal response.',
                    ysearchresponse: {
                        '@xmlns': 'http://www.inktomi.com/',
                        nextpage: 'Link to paginate to the next page.',
                        resultset_web: {
                            '@count': 'Number of results on this page.',
                            '@start': 'Ordinal position of the first result.',
                            '@totalhits': 'A result count that reflects no duplicates (the doc argument) and only two results per host (the host 2 argument). The totalhits value is an approximation, and its value may change depending on the requested “start” and “count” values, because the approximation is adjusted as more exact result URLs are processed. A normal use for totalhits is to determine how many pages of results to offer in search result navigation. Since TOTALHITS is an approximation, and the value may change as “start” increases on successive result pages, the result page navigation may need to be adjusted as a user browses result pages.',
                            '@deephits': 'It returns an approximate count that reflects duplicate documents and all documents from a host. deephits, therefore, is invariably equal to or larger than TotalHits. The deephits value is normally used as an information display on a search result page, reporting how many total documents matched the search terms.',
                            result: {
                                '__desc': 'Repeated for every result.',
                                'abstract': 'Abstract with keywords highlighted with html tags',
                                title: 'Title with keywords highlighted with html tags',
                                url: 'URL of result',
                                clickurl: 'Returns a navigation URL that leads to the target URL for each result. A clickurl might lead through a redirect server, which provides Yahoo! with important usage data from search result sets. See coding requirement (url vs clickurl) in overview',
                                dispurl: 'Returns the URLs of documents matching the query result. Use this field only for display purposes on result pages. To direct search users to the target document, use the clickurl value',
                                size: 'Returns the document’s size in bytes',
                                date: 'Returns date in YYYY/MM/DD format'
                            }
                        }
                    }
                },
                403: {
                    error: {
                        '@xmlns': 'http://schemas.yahooapis.com/v1/schema.xsd',
                        code: 'HTTP error code.',
                        description: 'Basic description of the error.',
                        detail: 'Extended description of the error,'
                    }
                }
            }
        }
    }
};
