(function() {
    var ref = YAHOO.namespace('lcl.querybuilder');
    var helper = YAHOO.lcl.helper;
    var Dom = YAHOO.util.Dom;
     
    ref.captureFieldTyping = function() {
        clearTimeout(this.fieldTypingTimeout);
        this.fieldTypingTimeout = setTimeout(this.updateIframe, 500);
    };

    ref.captureUrlTyping = function() {
        clearTimeout(this.urlTypingTimeout);
        this.urlTypingTimeout = setTimeout(this.updateIframe, 1000);
    };

    /**
     * finds out if current method (according to ref.service and ref.command) is post
     * method can be set via commands['my_command'].method = 'post'
     */
    ref.isPost = function() {
	var method = config[ref.service].commands[ref.command].method;
	if (typeof method != 'undefined' && method == 'post') {
	    return true;
	}
	return false;
    };
     
    /**
     * builds url (that's the REAL querybuilder) and sets iFrame.src = url
     */
    ref.updateIframe = function() {
        var host = config[ref.service].hosts[ref.host];
        var hostname = YAHOO.lang.substitute(host.host, config[ref.service].commands[ref.command].host_args);
        var baseUrl = hostname + '/' + host.applicationname + '/' + config[ref.service].commands[ref.command].path;
        baseUrl = 'http://' + baseUrl.replace('//', '/');
        var inputs = YAHOO.util.Dom.getElementsByClassName('field', '', document.getElementById('search_parameters'));
        var params = {};
        var encodedParams = {};
        var getParams = {};
        for (var i=0; i<inputs.length; i++) {
            var input = inputs[i];
            var value;
            if (input.tagName.toLowerCase() == 'textarea') {
                value = input.innerHTML;
            } else {
                value = input.value;
            }
            var encodedValue = encodeURIComponent(value);
            params[input.name] = value;
            encodedParams[input.name] = encodedValue;
            // just include fields in the get-parameters, that are not part of the url, e.g. exclude 'slot' when url='{slot}/comments'
            if (input.value != '' && baseUrl.indexOf('{' + input.name + '}') == -1) {
                getParams[input.name] = encodedValue;
            }
        }

        var url = YAHOO.lang.substitute(baseUrl, encodedParams);
        var params_string = '';
	    if (!ref.isPost()) {
            params_string = helper.object2str(getParams);
        }
        if (params_string.length > 0) {
		    url += '?' + params_string;
        }
        
        var urlIframe = url;
        
        if (ref.html == true) {
            params.url = url;
            // safe to use for the url_html-url in config
            if (params_string.length > 0) {
                params.url_safe = url;
            } else {
                params.url_safe = url + '?dummy=1';
            }
            
            // should the html view be built by xslt-transformation?
            if (config[ref.service].commands[ref.command].url_html.startsWith('xslt:')) {
                var tmp = config[ref.service].commands[ref.command].url_html.substring("xslt:".length).split('|');
                var processUrl = YAHOO.lang.substitute(tmp[0].split('=')[1], params);
                var xslt = YAHOO.lang.substitute(tmp[1].split('=')[1], params);
                urlIframe = xslt_processor + '?url=' + helper.urlencode(processUrl) + '&xslt=' + helper.urlencode(xslt);
		        if (tmp.length == 3) {
		            urlIframe += '&' + tmp[2];
		        }
            } else {
                urlIframe = YAHOO.lang.substitute(config[ref.service].commands[ref.command].url_html, params);
            }
        }

        if (urlIframe != ref.lastUrlIframe) {
            document.getElementById('url').value=url;
	    if (ref.isPost()) {
		document.getElementById('form').action = urlIframe;
	    } else {
		ref.startLoadingAnimation();
		document.getElementById('iframe').src = urlIframe;
	    }
	    ref.lastUrlIframe = urlIframe;
	    ref.lastUrl = url;
	    ref.urlFieldValid();
        }
    };

    ref.onCommandChange = function(command) {
        ref.command = command;
        document.getElementById('search_parameters').innerHTML = '';
        
        // if a url_html is configured for command: add html view tab
        var c_config = config[ref.service].commands[ref.command];
        if (typeof c_config.url_html != 'undefined' && typeof ref.tabViewResult.getTab(1) == 'undefined') {
            ref.tabViewResult.addTab(ref.htmlTab);
        }
        if (typeof c_config.url_html == 'undefined' && typeof ref.tabViewResult.getTab(1) != 'undefined') {
            ref.tabViewResult.removeTab(ref.htmlTab);
        }

        if (typeof c_config.url_html == 'undefined' || c_config.default_view == 'xml') {
            ref.html = false;
        } else if (typeof c_config.url_html != 'undefined' && c_config.default_view == 'html') {
            ref.html = true;
        }
        ref.activateResultTab(ref.html);

        if (ref.isPost()) {
            document.getElementById('form').method = 'post';
            document.getElementById('form').target = 'iframe';
            document.getElementById('submit').style.display = 'block';
            document.getElementById('iframe').src = 'about:blank';
            document.getElementById('submit').value = config[ref.service].commands[ref.command].name;
            document.getElementById('form').onsubmit = '';
        } else {
            document.getElementById('form').action = '';
            document.getElementById('form').onsubmit = function() {ref.updateIframe(); return false;};
            document.getElementById('submit').style.display = 'none';
        }
        
        ref.updateIframe();
        ref.resizeIframe();
        ref.addDefaultFields();
        ref.updateChooseList();
        ref.updateResponseDocs();
        ref.updateDocumentation();
        document.title = 'Querybuilder: ' + config[ref.service].name + ' - ' + config[ref.service].commands[ref.command].name;
        document.location.hash = '#' + ref.service + "." + ref.command;
    };

    ref.onServiceChange = function(service) {
        ref.service = service;
        if (!(ref.command in config[service].commands)) {
            ref.command = helper.getFirstProperty(config[service].commands);
        }
        ref.loadHostDropdown();
        ref.loadTabs();
        ref.updateSimilarServicesList();
        document.getElementById('servicename').innerHTML = config[service].name;
        ref.activateTab(ref.command);
    };

    ref.onUrlFieldFocus = function() {
        ref.lastUrlFieldValue = document.getElementById('url').value;
    };

    ref.urlFieldInvalid = function(message) {
        document.getElementById('url').className = 'error';
        document.getElementById('url_message').innerHTML = message;
    };
    ref.urlFieldValid = function() {
        document.getElementById('url').className = '';
        document.getElementById('url_message').innerHTML = '';
    };
     
    ref.onUrlFieldChange = function() {
        var url = document.getElementById('url').value;

        var extract = function(url) {
            var hostname_ends = url.indexOf('/', "https://".length);
            var hostname = url.substring(0,hostname_ends);
            var tmp = url.substring(hostname_ends).split('?');
            var path = tmp[0];
            var query = tmp[1];
            path = path.substring(1);
            if (typeof query == 'undefined') {
                query = '';
            }
            return [hostname, path, query];
        };

                    
        if (url != ref.lastUrlFieldValue) {
            var tmp = extract(ref.lastUrlFieldValue);
            var lastHost = tmp[0];
            var lastPath = tmp[1];
            var lastQuery = tmp[2];
            tmp = extract(url);
            var currentHost = tmp[0];
            var currentPath = tmp[1];
            var currentQuery = tmp[2];

            // alter page depending on what has changed
            // path changed e.g. from local_application/basedatasearch/phonebook/category.xml to local_application/search/guide.xml
            if (lastPath != currentPath) {
                var found = false;
                serviceloop: for(servicename in config) {
                    var applicationnames = {};
                    for (hostname in config[servicename].hosts) {
                        var host = config[servicename].hosts[hostname];
                        if (!(host.applicationname in applicationnames)) {
                            applicationnames[host.applicationname] = 1;
                        }
                    }
                    for (commandname in config[servicename].commands) {
                        var command = config[servicename].commands[commandname];
                        for (applicationname in applicationnames) {
                            // path: path according to current servicename/commandname
                            // currentPath: path according to what is entered in the url-field
                            // substitute_reverse now checks if those two match and also returns the key/value-pair needed for the command (if url is e.g. comment/{guid}/{slot} )
                            var path = applicationname + '/' + command.path;
                            // console.log(path + "<>" + currentPath);
                            var same = helper.substitute_reverse(currentPath, path);
                            if (same != false) {
                                if (servicename != ref.service) {
                                    ref.onServiceChange(servicename);
                                    ref.activateTab(commandname);
                                } else if (commandname != ref.command) {
                                    ref.activateTab(commandname);
                                }
                                found = true;
                                // force revaluation of url-parameters
                                lastQuery = 'dummy';
                                break serviceloop;
                            }
                        }
                    }
                }
                if (found) {
                    ref.urlFieldValid();
                    ref.captureUrlTyping();
                } else {
                    ref.urlFieldInvalid('found no command matching path: ' + currentPath);
                    return;
                }
            }

            // hostname changed e.g. from query-dev to query04
            if (lastHost != currentHost) {
                tmp = currentHost.split('//');
                var http = tmp[0];
                var hostname = tmp[1];
                var host = ref.findBestMatchingHost(hostname, '');
                if (host == '') {
                    var hostsAvailable = config[ref.service].hosts;
                    var hostnamesAvailable = [];
                    for (hostAvailable in hostsAvailable) {
                        hostnamesAvailable.push(hostsAvailable[hostAvailable].host.replace('.intra.local.ch', ''));
                    }
                    ref.urlFieldInvalid('found no host matching: ' + hostname + "<br />possible hostnames: " + hostnamesAvailable.join(", "));
                } else {
                    ref.host = host;
                    ref.loadHostDropdown();
                    ref.urlFieldValid();
                    ref.captureUrlTyping();
                }
            }
            
            if (lastQuery != currentQuery && !currentQuery.endsWith('=')) {
                var currentQueryParams = currentQuery.split('&');
                if (currentQuery == '') {
                    currentQueryParams = [];
                }
                // add queryparams given in the path e.g. comment/{guid}/{slot} to currentQueryParams
                var path = config[ref.service].hosts[ref.host].applicationname + '/' + config[ref.service].commands[ref.command].path;
                var params = helper.substitute_reverse(currentPath, path);
                var length = 0;
                for (var i=0; i<currentQueryParams.length; i++) {
                    tmp = currentQueryParams[i].split('=');
                    if (tmp.length == 2) {
                        var key = tmp[0];
                        var value = tmp[1];
                        params[key] = value;
                    }
                }

                // check if the fields changed
                var inputs = YAHOO.util.Dom.getElementsByClassName('field', '', document.getElementById('search_parameters'));
                var currentFields = {};
                for (i=0; i<inputs.length; i++) {
                    var input = inputs[i];
                    currentFields[input.name] = input.value;
                }
                var fieldsChanged = !helper.hasSameProperties(currentFields, params);

                if (fieldsChanged) {
                    helper.removeAllChildNodes(document.getElementById('search_parameters'));
                }
                var hasInvalidFields = false;
                for (param in params) {
                    if (fieldsChanged) {
                        if (param in config[ref.service].commands[ref.command].fields) {
                            ref.addFieldByName(param, false);
                        } else {
                            hasInvalidFields = true;
                            var input = ref.addField({name: param, preset: params[param], description: '<em><strong>→ invalid field ←</strong></em>'}, false);
                            input.disabled = true;
                            input.className = 'error';
                        }
                    }
                    document.getElementById('f_' + param).value = unescape(params[param]);
                }
                ref.updateChooseList();
                ref.updateResponseDocs();
                ref.resizeIframe();
                if (!hasInvalidFields) {
                    ref.urlFieldValid();
                    ref.captureUrlTyping();
                } else {
                    ref.urlFieldInvalid('there are invalid query parameters. See fields marked red');
                }
            }
            ref.lastUrlFieldValue = url;
            document.getElementById('url').focus();
        }
    };

    ref.activateTab = function(command) {
        var i = 0;
        for (key in config[ref.service].commands) {
            if (key == command) {
                ref.tabView.set('activeTab', ref.tabView.getTab(i));
                return;
            }
            i++;
        }
    };
     
    /**
     * 0 to activate xml view, 1 to activate html view
     */
    ref.activateResultTab = function(view) {
        ref.tabViewResult.set('activeTab', ref.tabViewResult.getTab(Number(view)));
    };

    ref.writeInitHtml = function() {
        document.body.className = 'yui-skin-sam';
        document.body.innerHTML = '\n\
    <img src="querybuilder/home.png" id="home" />\n\
    <img src="querybuilder/loading.gif" id="loading" />\n\
    <div id="servicenav"><div id="servicename"></div><div id="similar_services"></div></div>\n\
    <div id="home_screen"></div>\n\
    <div id="container">\n\
      <div id="tabs"></div>\n\
      <input id="url" />\n\
      <div id="url_message"></div>\n\
      <table>\n\
        <tr>\n\
          <td id="result">\n\
            <span id="host_span">\n\
              Host: <select id="host"></select>\n\
            </span>\n\
            <form id="form">\n\
              <table>\n\
	        <tbody id="search_parameters">\n\
		</tbody>\n\
              </table>\n\
	      <input type="submit" name="submit" id="submit" />\n\
            </form>\n\
            <div id="tabs_result"></div>\n\
            <iframe id="iframe" name="iframe"></iframe>\n\
          </td>\n\
          <td id="optionstd">\n\
            <table id="options"></table>\n\
            <div id="response"></div>\n\
            <div id="documentation"></div>\n\
          </td>\n\
        </tr>\n\
      </table>\n\
   </div>';
    };

    ref.init = function() {
        var command;
        var service;
        ref.writeInitHtml();
        if (document.location.hash.length > 1) {
            var tmp = document.location.hash.substr(1).split(".");
            service = tmp[0];
            command = tmp[1];
        }
        if (typeof service == 'undefined' || typeof config[service] == 'undefined') {
            ref.showHomeScreen();
        } else {
            ref.service = service;
            ref.command = command;
            if (document.referrer != '') {
                var referrerHost = document.referrer.split('//')[1].split('/')[0];
                ref.host = ref.findBestMatchingHost(referrerHost, helper.getFirstProperty(config[ref.service].hosts));
                ref.loadHostDropdown();
            }
            ref.onServiceChange(service);
            ref.activateTab(command);
        }


        YAHOO.util.Event.addListener(document.getElementById('home'), 'click', ref.showHomeScreen);
        YAHOO.util.Event.addListener(document.getElementById('servicename'), 'click', ref.showHomeScreen);
        YAHOO.util.Event.addListener(document.getElementById('url'), 'keyup', ref.onUrlFieldChange);
        YAHOO.util.Event.addListener(document.getElementById('url'), 'mouseup', ref.onUrlFieldChange);
        YAHOO.util.Event.addListener(document.getElementById('url'), 'focus', ref.onUrlFieldFocus);
        YAHOO.util.Event.addListener(document.getElementById('iframe'), 'load', ref.stopLoadingAnimation);
        YAHOO.util.Event.addListener(document.getElementById('iframe'), 'error', ref.stopLoadingAnimation);
    };

    ref.stopLoadingAnimation = function() {
        document.getElementById('loading').src = 'querybuilder/reload.png';
        document.getElementById('loading').onclick = function() { ref.startLoadingAnimation(); var url = document.getElementById('iframe').src; document.getElementById('iframe').src=''; document.getElementById('iframe').src=url; };
        document.getElementById('loading').style.cursor = 'pointer';
    };
    ref.startLoadingAnimation = function() {
        document.getElementById('loading').src = 'querybuilder/loading.gif';
        document.getElementById('loading').onclick = '';
        document.getElementById('loading').style.cursor = 'default';
    };

    ref.resizeIframe = function() {
        document.getElementById('iframe').style.height = (document.documentElement.clientHeight - YAHOO.util.Dom.getXY('iframe')[1] - 10) + 'px';
    };

    /**
     * e.g. call with document.referrer
     * returns e.g. 'query-dev', the key in config[service].hosts
     */
    ref.findBestMatchingHost = function(hostname, noMatch) {
        var hostsAvailable = config[ref.service].hosts;
        for (hostAvailable in hostsAvailable) {
            var hostnameAvailable = hostsAvailable[hostAvailable].host;
            if (hostnameAvailable.replace('.intra.local.ch', '') == hostname.replace('.intra.local.ch', '')) {
                return hostAvailable;
            }
        }
        return noMatch;
    };

    ref.loadHostDropdown = function() {
        var h = document.getElementById('host');
        helper.removeAllChildNodes(h);
        var first = true;
        var setHost = false;
        if (!(ref.host in config[ref.service].hosts)) {
            setHost = true;
        }
        for (key in config[ref.service].hosts) {
            var option = document.createElement('option');
            option.value=key;
            option.innerHTML=key;
            if (setHost && first) {
                ref.host = key;
            }
            if (key == ref.host) {
                option.selected = true;
            }
            h.appendChild(option);
            first = false;
        }
        h.onchange = function() { ref.host = h.value; ref.updateIframe(); };
        h.onkeyup = function() { ref.host = h.value; ref.updateIframe(); };
    };

   ref.getFieldObject = function(fieldname) {
       var field = config[ref.service].commands[ref.command].fields[fieldname];
       field.name = fieldname;
       for (fieldname in helper.objectConverter(['preset', 'description'])) {
           if (typeof field[fieldname] == 'undefined') {
               field[fieldname] = '';
           }
       }
       return field;
    };


    ref.updateChooseList = function() {
        var html = '';
        
        var present_fields = [];
        var inputs = YAHOO.util.Dom.getElementsByClassName('field', '', document.getElementById('search_parameters'));
        for (var i=0; i<inputs.length; i++) {
            present_fields.push(inputs[i].name);
        }
        
        i = 1;
        for (fieldname in config[ref.service].commands[ref.command].fields) {
            if (fieldname.substring(0,1) == '_') {
                html += '<h2>' + config[ref.service].commands[ref.command].fields[fieldname] + '</h2>';
            } else {
                var field = ref.getFieldObject(fieldname);
                
                // don't show fields in choose-list that are already chosen
                if (!(field.name in helper.objectConverter(present_fields))) {
                    html +=  '<tr class="zebra' + (i % 2) + '"><th><label><a href="javascript:void(0)" onclick="javascript:YAHOO.lcl.querybuilder.addFieldByName(\''+field.name+'\', true)">'+field.name+'</a></label></th><td>'+field.description.replace(/\|/g, "")+'</td></tr>';
                }
                i++;
            }
        }
        if (i == 1) {
            document.getElementById('result').style.width = '100%';
        } else {
            document.getElementById('result').style.width = '60%';
        }
        document.getElementById('options').innerHTML = html;
    };
    
    /**
     * Update the documentation of the response.
     */
    ref.updateResponseDocs = function() {
        var service = config[ref.service];
        var command = config[ref.service].commands[ref.command];
        var responseNode = Dom.get('response');
        responseNode.innerHTML = '';
        if (!('responses' in command)) {
            if (ref.tabOptionsResponse !== null && typeof(ref.tabOptionsResponse) !== 'undefined') {
                // There was a response documentation in a previous command
                responseNode.innerHTML = "This command doesn't have any response documentation.";
            }
            return;
        }
        var responses = command.responses;
        for (response_type in responses) {
            response_type = new String(response_type)
            var response = responses[response_type];
            // Response code title
            var el = document.createElement('h2');
            if (response_type.length === 3 && parseInt(response_type, 10) !== NaN) {
                // Assume HTTP code
                // Need to calculate the section. Give me a better linkable
                // spec and I'll use it
                var chapter = response_type[0];
                var section = parseInt(response_type.substr(1), 10) + 1;
                var link = 'http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html' +
                    '#sec10.' + chapter + '.' + section;
                el.innerHTML = '<a href="'+link+'">' + response_type + '</a>';
            } else {
                el.innerHTML = response_type;
            }
            responseNode.appendChild(el);
            
            // Description of the code
            if ('__desc' in response) {
                var el = document.createElement('p');
                el.innerHTML = response['__desc'];
                responseNode.appendChild(el);
                Dom.addClass(el, 'description');
                Dom.addClass(el, 'code_description');
            }
            
            // Hierarchical information
            var list = ref.createResponseList(response);
            if (list.length > 0) {
                el = document.createElement('div');
                responseNode.appendChild(el);
                var tree = new YAHOO.widget.TreeView(el, list);
                tree.render();
            }
        }
        if (ref.tabOptionsResponse === null || typeof(ref.tabOptionsResponse) === 'undefined') {
            ref.tabOptionsResponse = ref.createOptionsResponseTab();
        }
    };
    
    /**
     * Recursively creates a dictionary for the TreeView construction of the
     * response documentation.
     */
    ref.createResponseList = function(doc) {
        var list = [];
        var child;
        
        for (child in doc) {
            if (child !== '__desc') {
                if (typeof(doc[child]) === 'object') {
                    var el = {
                        'type': 'HTML',
                        expanded: true,
                        children: ref.createResponseList(doc[child])
                    };
                    el['html'] = '<strong class="name">' + child + '</strong>';
                    if ('__desc' in doc[child]) {
                        el['html'] += ': <span class="desc">' +
                            doc[child]['__desc'] + '</span>';
                    }
                    list.push(el);
                } else if (child == '@xmlns') {
                    // Handle XML namespace specially
                    var content = '<strong class="name">XML namespace</strong>' +
                        ': <span class="desc">' + doc[child] + '</span>';
                    list.push({
                        'type': 'HTML',
                        'contentStyle': 'namespace',
                        'html': content
                    });
                } else {
                    var content = '<strong class="name">' + child +
                        '</strong>: <span class="desc">' + doc[child] +
                        '</span>';
                    var cls = (child[0] == '@') ? 'attribute' : 'node';
                    list.push({
                        'type': 'HTML',
                        'contentStyle': cls,
                        'html': content
                    });
                }
            }
        }
        
        return list;
    };
    
    ref.createOptionsResponseTab = function() {
        console.debug("createOptionsResponseTab");
        var cont = document.createElement('div');
        Dom.get('optionstd').insertBefore(cont, Dom.get('options'));
        Dom.addClass(cont, 'optionsresponse');
        var tabs = new YAHOO.widget.TabView(cont);
        tabs.addTab(new YAHOO.widget.Tab({
            label: 'Request', active: true, 'contentEl': Dom.get('options')
        }));
        tabs.addTab(new YAHOO.widget.Tab({
            label: 'Response', 'contentEl': Dom.get('response')
        }));
        return tabs;
    }

    ref.updateSimilarServicesList = function() {
        var currentServiceName = config[ref.service].name;
        var ul = document.createElement("ul");

        // need to do this via createFunction, see http://joust.kano.net/weblog/archive/2005/08/08/a-huge-gotcha-with-javascript-closures/
        var createFunction = function(service) {
            return function() {
                ref.onServiceChange(service);
                ref.resizeIframe();
            };
        };
        
        for (service in config) {
            var serviceName = config[service].name;
            var diff = helper.stringDiff(currentServiceName, serviceName);
            if (typeof diff != 'undefined') {
                var li = document.createElement("li");
                var a = document.createElement("a");
                a.appendChild(document.createTextNode(diff[1]));
                a.onclick = createFunction(service);
                li.appendChild(a);
                ul.appendChild(li);
            }
        }
        if (ul.childNodes.length > 0) {
            var div = document.getElementById('similar_services');
            helper.removeAllChildNodes(div);
            div.appendChild(ul);
        }
    };

    ref.updateDocumentation = function() {
        var html = [];
        if (config[ref.service].commands[ref.command].doc_parameters) {
            html.push('<a href="'+config[ref.service].commands[ref.command].doc_parameters+'">Documentation query-parameters</a>');
        }
        if (config[ref.service].commands[ref.command].doc_response) {
            html.push('<a href="'+config[ref.service].commands[ref.command].doc_response+'">Documentation query-result</a>');
        }
        document.getElementById('documentation').innerHTML=html.join('<br />');
    };

    ref.addDefaultFields = function() {
        if (typeof config[ref.service].commands[ref.command].fields == 'undefined') {
            return;
        }
        var first = true;
        for (fieldname in config[ref.service].commands[ref.command].fields) {
            if (fieldname.substring(0, 1) != '_') {
                var field = ref.getFieldObject(fieldname);
                if (field.added == 'start' || field.added == 'mustbepresent') {
                    var input = ref.addField(field, true);
                    if (first) {
                        input.focus();
                        first = false;
                    }
                }
            }
        }
    };

    /**
     * field reference to the field
     * fromChooseList: different behaviour when adding a field from choose-list (table on right), than when adding the field via url-field
     */
    ref.addField = function(field, fromChooseList) {
        var tr = document.createElement('tr');
        var tdx = document.createElement('td');
        if (field.added != 'mustbepresent') {
            var a = document.createElement('a');
            a.href='#';
            a.onclick = function() { tr.parentNode.removeChild(tr); ref.resizeIframe(); ref.updateIframe(); ref.updateChooseList(); };
            a.innerHTML = '×';
            tdx.appendChild(a);
        }
        tdx.className="close";
        tr.appendChild(tdx);
        var th = document.createElement('th');
        var label = document.createElement('label');
        label.innerHTML = field.name;
        th.appendChild(label);
        tr.appendChild(th);
        var td = document.createElement('td');
        var input;
        if (field.type == 'textarea') {
            input = document.createElement('textarea');
        } else {
            input = document.createElement('input');
        }
        input.name=field.name;
        input.id = 'f_' + field.name;
        if (fromChooseList) {
            if (input.type == 'textarea') {
                input.innerHTML = field.preset;
                // line-height is 1.1em so we need to multiply by 1.1
                var lines = Math.max(field.preset.split("\n").length, 10);
                input.style.height = (lines * 1.1) + 'em';
            } else {
                input.value = field.preset;
            }
        }
        input.setAttribute('autocomplete', 'off');
        input.tabIndex=1;
        input.className="field";
        var onchange = ref.captureFieldTyping;
        if (typeof field.onchange != 'undefined') {
            onchange = function() { field.onchange(input); ref.captureFieldTyping(); };
        }
        YAHOO.util.Event.addListener(input, 'keyup', onchange, ref, true);
        YAHOO.util.Event.addListener(input, 'mouseup', onchange, ref, true);
        YAHOO.util.Event.addListener(input, 'focus', function() { input.select(); } );
        td.appendChild(input);
        td.appendChild(document.createElement('br'));
        tr.appendChild(td);
        if (typeof field.onchange != 'undefined') {
            field.onchange(input);
        }
        var tdEx = document.createElement('td');
        // replacing the |value| with a link that adds that value to the field
        tdEx.innerHTML = field.description.replace(/\|([a-zA-Z0-9_]+)\|/g, '<a href="javascript:void(0)" class="value" onclick="YAHOO.lcl.querybuilder.setInputfieldValue(\'f_'+field.name+'\', \'$1\')">$1</a>');
        tr.appendChild(tdEx);
        document.getElementById('search_parameters').appendChild(tr);
        if (fromChooseList) {
            ref.updateIframe();
            ref.updateChooseList();
            ref.resizeIframe();
        }
        return input;
    };

    ref.handleGUIDField = function(input) {
        // if there's a long guid then replace it with shortUid
        // e.g. 36096AB3-EFE3-3BC1-1E2A-11632B973E53
        var longPos = input.value.search(/^[ ]*[0-9A-Z]{8}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{12}[ ]*$/);
        if (longPos >= 0) {
            var longUid = input.value.substring(longPos, 36);
            input.value = helper.guidLong2Short(longUid);
        }
        
        var shortPos = input.value.search(/^[ ]*[A-Za-z0-9\-_\+\/]{22}[ ]*$/);
        var message = "<em>invalid shortUid</em>";
        if (shortPos >= 0) {
            var longUid = helper.guidShort2Long(input.value.substring(shortPos, shortPos + 22));
            message = 'long uid: ' + longUid;
        }
        var parent = input.parentNode;
        if (parent.childNodes.length == 3) {
            parent.removeChild(parent.childNodes[2]);
        }
        var span = document.createElement('span');
        span.innerHTML = '<small>' + message + '</small>';
        parent.appendChild(span);
    };

    ref.setInputfieldValue = function(field_id, value) {
        document.getElementById(field_id).value = value;
        ref.updateIframe();
    };

    /**
     * fieldname: e.g. 'guid'
     * fromChooseList: different behaviour when adding a field from choose-list (table on right), than when adding the field via url-field
     */
    ref.addFieldByName = function(fieldname, fromChooseList) {
        var field = ref.getFieldObject(fieldname);
        var input = ref.addField(field, fromChooseList);
        if (fromChooseList) {
            input.focus();
        }
    };

    ref.loadTabs = function() {
        var tabView = new YAHOO.widget.TabView();
        var handleActiveTabChange = function(e) {
            var key = e.newValue._configs.href.value.substring(1);
            ref.onCommandChange(key);
        };
        tabView.addListener('activeTabChange', handleActiveTabChange);
        for (command in config[ref.service].commands) {
            tabView.addTab( new YAHOO.widget.Tab({ 
                label: config[ref.service].commands[command].name,
                content: '',
                href: '#' + command,
                active: (command == ref.command)
            }));
        }
        var container = document.getElementById('tabs');
        helper.removeAllChildNodes(container);
        tabView.appendTo(container);
        ref.tabView = tabView;

        var tabViewResult = new YAHOO.widget.TabView();
        var handleActiveTabResultChange = function(e) {
            var key = e.newValue._configs.label.value;
            var html = false;
            if (key == 'html view') {
                html = true;
            }
            if (ref.html != html) {
                ref.html = html;
                ref.updateIframe();
            }
        };
        tabViewResult.addListener('activeTabChange', handleActiveTabResultChange);
        tabViewResult.addTab( new YAHOO.widget.Tab({ 
            label: 'xml view',
            content: '',
            active: true
        }));
        ref.htmlTab = new YAHOO.widget.Tab({ 
            label: 'html view',
            content: ''
        });
        tabViewResult.addTab(ref.htmlTab);
        container = document.getElementById('tabs_result');
        helper.removeAllChildNodes(container);
        tabViewResult.appendTo(container);
        ref.html = false;
        ref.tabViewResult = tabViewResult;
    };

     ref.showHomeScreen = function() {
         var h = document.getElementById('home_screen');
         document.location.hash = '#';
         helper.removeAllChildNodes(h);
         for (service in config) {
             var service_div = document.createElement('div');
             service_div.className = 'service_description';
             var service_title = document.createElement('h2');
             service_title.appendChild(document.createTextNode(config[service].name));
             service_div.appendChild(service_title);
             var service_paragraph = document.createElement('p');
             var ul = document.createElement('ul');
             var names = [];
             var i = 0;
             for (commandname in config[service].commands) {
                 var li = document.createElement('li');
                 li.appendChild(document.createTextNode(config[service].commands[commandname].name));
                 ul.appendChild(li);
                 i++;
                 if (i > 7) {
                     li = document.createElement('li');
                     li.appendChild(document.createTextNode('...'));
                     ul.appendChild(li);
                     break;
                 }
             }
             service_paragraph.appendChild(ul);
             service_div.appendChild(service_paragraph);
             // need to do this via createFunction, see http://joust.kano.net/weblog/archive/2005/08/08/a-huge-gotcha-with-javascript-closures/
             var createFunction = function(service) {
                 return function() {
                     h.style.display = 'none';
                     ref.onServiceChange(service);
                     ref.resizeIframe();
                 };
             };
             service_div.onclick = createFunction(service);
             h.appendChild(service_div);
         }
         h.style.display = 'block';
     };

})();

YAHOO.util.Event.onDOMReady(YAHOO.lcl.querybuilder.init);
window.onresize = YAHOO.lcl.querybuilder.resizeIframe;

var config = {};
