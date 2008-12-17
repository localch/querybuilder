# Introduction

Querybuilder is a in-browser tool to debug and document REST web services.

This software was built by Philipp Keller at local.ch.

# Setup

To use querybuilder first copy the template folder somewhere else. Then move
the querybuilder folder into that folder. You'll end up with a folder
structure like this:

        template/
            index.html
            config/
                yahoo-boss.js
            querybuilder/
                ....

You can rename the root "template" folder to any name you like.

If you open the index.html in the browser you should see a box with the
"Yahoo! BOSS" title. Click on "Web Search" and you'll get the debug window
with some default parameters in the center and additional available parameters
at the right. Whenever you add parameters or change values the URL on top will
change and the result view on the bottom will be updated.

# Configuration

Configuration is handled using JSON. Create new config files under the config
directory and add them to the index.html file (copy or change the
yahoo-boss.js line).

## Service

Assign new services to the config hash using

        config.servicename = {
            ....
        }

The service can contain the following elements:

* name: A descriptive name of the service.
* hosts: A list of hosts. See "Hosts" below.
* commands: All commands available in the service. See "commands" below.

### Hosts

The service contains a key "hosts" which is a dictionary of all the hosts
where the service has been deployed. This dictionary needs to contain at least
one element.

        hosts: {
            live: {
                host: '{subdomain}.service',
                applicationname: ''
            }
        }

* The key ("live" in the example) will be shown to the user as the name.
* host: This is the hostname to use in the URL. Can contain parameters in
  curly brackets which are replaced from the commands "host_args" parameters.
* applicationname: This is a prefix which gets added as the first part of the
  URL. Useful when a service is mounted on different paths on different hosts.

### Commands

The "commands" dictionary of a service contains a list of all available
commands on a service.

Each command can contain the following keys:

* name: Name of the command displayed to the user.
* path: Path to the command. Can include params in curly brackets which will
  be substituted from the field values which the user enters. Do not include
  the leading slash.
* method: HTTP method to use - either "get" or "post". Defaults to "get".
* host_args: Dictionary of arguments which are substituted into the host name.
* url_html: Same as "path" but leads to an HTML view. Alternatively can be a
  URL to an XSLT stylesheet prefixed with "xslt:". In that case the service
  request is done and then transformed using the given XSLT.
* default_view: The view to show by default. Either "xml" or "html". Defaults
  to "xml".
* fields: Dictionary with the configuration of the fields. See "Fields" below.
* doc_parameters: URL of an external documentation of the request parameters.
* doc_response: URL of an external documentation of the response format.

        commands: {
            websearch: {
                name: 'Web Search',
                host_args: { subdomain: 'boss' },
                path: 'ysearch/web/v1/{query}',
                fields: {
                    ....
                },
                responses: {
                    ....
                },
                doc_parameters: 'http://developer.yahoo.com/search/boss/boss_guide/univer_api_query.html',
                doc_response: 'http://developer.yahoo.com/search/boss/boss_guide/ch02s02.html'
            }
        }

#### Fields

The fields are defined as a dictionary. The dictionary keys define the field
name which gets included in the paths. The value is again a dictionary with
this possible keys:

* added: Can take two values: "mustbepresent" or "start". "mustbepresent"
  means that the field will always be shown and can't be removed from the
  query. "start" means that the field gets added by default but is not
  required. The default is empty.
* preset: Default value to include when the field is selected.
* description: Description of the field. Can contain HTML. Additionally
  possible values can be embedded within pipes. That will make them clickable
  so it directly puts the value into the text field.
* type: Set type "textarea" to get a textarea field.

        fields: {
            appid: {
                added: 'mustbepresent',
                preset: 'app id',
                description: 'Boss <strong>App ID</strong>'
            },
            query: {
                added: 'start',
                preset: 'Yahoo Test',
                description: 'The search terms. See <a href="http://developer.yahoo.com/search/boss/boss_guide/univer_api_query.html">Universal BOSS API Arguments</a> for documentation.'
            },
            start: {
                description: 'Ordinal position of first result. First position is |0|. Default sets start to 0.'
            }
            format: {
                added: 'start',
                preset: 'xml',
                description: 'The data format of the response. Value can be set to either "|xml|" or "|json|". Default sets format to "json".'},
            }
        }

#### Responses

The responses are defined as a dictionary. The keys describe the different
versions - HTTP response codes are recommended. If you use HTTP response
codes, they are linked to the respective section of the official HTTP RFC.

The value is a recursive dictionary which defines the XML response structure.

There are a few special keys:

* __desc: Treated as a description of the parent.
* @* (Any key starting with "@"): Attributes. They are formatted a big
  differently in the output.
* @xmlns: XML namespace. Formatted a bit differently and with special wording.
* All other keys are treated as XML element names.

The value of each key can be a string - in which case it's the documentation
of the key - or a dictionary with the same schema.

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
                            abstract: 'Abstract with keywords highlighted with html tags',
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
