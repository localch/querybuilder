(function() {
    var ref = YAHOO.namespace('lcl.helper');

    ref.guidLong2Short = function(st) {
        var bin = ref.hex2Bin(st.replace(/-/g, ''));
        return ref.urlsafe_base64Encode(bin).replace(/=/g, '');
    };

    ref.guidShort2Long = function(st) {
        var hex = ref.bin2Hex(ref.urlsafe_base64Decode(st + "=="));
        return [hex.substring(0,8), hex.substring(8,12), hex.substring(12,16), hex.substring(16,20), hex.substring(20)].join('-');
    };

    /**
     * taken from http://www.webtoolkit.info/javascript-base64.html
     */
    ref.base64Encode = function(str) {
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var data = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
    
        do {
            chr1 = str.charCodeAt(i++);
            chr2 = str.charCodeAt(i++);
            chr3 = str.charCodeAt(i++);
    
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
    
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
    
            data = data + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
        } while (i < str.length);
       
        return data;
    };
    ref.urlsafe_base64Encode = function(input) {
        return ref.base64Encode(input).replace(/\+/g, '-').replace(/\//g, '_');
    };

    /**
     * taken from http://www.webtoolkit.info/javascript-base64.html
     */
    ref.base64Decode = function(input) {
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        
        // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        
        do {
           enc1 = keyStr.indexOf(input.charAt(i++));
           enc2 = keyStr.indexOf(input.charAt(i++));
           enc3 = keyStr.indexOf(input.charAt(i++));
           enc4 = keyStr.indexOf(input.charAt(i++));
        
           chr1 = (enc1 << 2) | (enc2 >> 4);
           chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
           chr3 = ((enc3 & 3) << 6) | enc4;
        
           output = output + String.fromCharCode(chr1);
        
           if (enc3 != 64) {
              output = output + String.fromCharCode(chr2);
           }
           if (enc4 != 64) {
              output = output + String.fromCharCode(chr3);
           }
        } while (i < input.length);
        
        return output;
    };
    ref.urlsafe_base64Decode = function(input) {
        return ref.base64Decode(input.replace(/-/g, '+').replace(/_/g, '/'));
    };

    ref.hex2Bin = function(string) {
        var bin = '';
        for (var i=0; i<string.length; i+=2) {
            var hex = string.substring(i, i+2);
            bin += String.fromCharCode(parseInt(hex, 16));
        }
        return bin;
    };

    ref.bin2Hex = function(bin) {
        var hex = '';
        for (var i=0; i<bin.length; i++) {
            var chunk = bin.charCodeAt(i).toString(16);
            if (chunk.length == 1) {
                chunk = '0' + chunk;
            }
            hex += chunk;
        }
        return hex.toUpperCase();
    };

     
    /**
     * taken from http://snippets.dzone.com/posts/show/5925
     */
    ref.formatDate = function (formatDate, formatString) {
        if(formatDate instanceof Date) {
	        var months = new Array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");
	        var yyyy = formatDate.getFullYear();
	        var yy = yyyy.toString().substring(2);
	        var m = formatDate.getMonth();
	        var mm = m < 10 ? "0" + m : m;
	        var mmm = months[m];
	        var d = formatDate.getDate();
	        var dd = d < 10 ? "0" + d : d;
	        
	        var h = formatDate.getHours();
	        var hh = h < 10 ? "0" + h : h;
	        var n = formatDate.getMinutes();
	        var nn = n < 10 ? "0" + n : n;
	        var s = formatDate.getSeconds();
	        var ss = s < 10 ? "0" + s : s;

	        formatString = formatString.replace(/yyyy/i, yyyy);
	        formatString = formatString.replace(/yy/i, yy);
	        formatString = formatString.replace(/mmm/i, mmm);
	        formatString = formatString.replace(/mm/i, mm);
	        formatString = formatString.replace(/m/i, m);
	        formatString = formatString.replace(/dd/i, dd);
	        formatString = formatString.replace(/d/i, d);
	        formatString = formatString.replace(/hh/i, hh);
	        formatString = formatString.replace(/h/i, h);
	        formatString = formatString.replace(/nn/i, nn);
	        formatString = formatString.replace(/n/i, n);
	        formatString = formatString.replace(/ss/i, ss);
	        formatString = formatString.replace(/s/i, s);

	        return formatString;
        } else {
	        return "";
        }
    };
     
    ref.getFirstProperty = function(obj){
        for(var key in obj){
            return key;
        }
    };

    /**
     * var o = objectConverter(['one', 'two', 'three'])
     * -> o = {one: '', two: '', three: ''}
     * used for checking if a value is in an array
     * taken from http://snook.ca/archives/javascript/testing_for_a_v/
     */
    ref.objectConverter = function(a) {
        var o = {};
        for(var i=0;i<a.length;i++) {
            o[a[i]]='';
        }
        return o;
    };

    /**
     * {a:1, b:2} → "a=1&b=2"
     */
    ref.object2str = function(object) {
        var list = [];
        for (var key in object) {
            list.push(key + '=' + object[key]);
        }
        return list.join('&');
    };

    /**
     * taken from http://keithdevens.com/weblog/archive/2007/Jun/07/javascript.clone
     */
    ref.clone = function(obj) {
	if(obj == null || typeof(obj) != 'object') {
            return obj;
        }
        var temp = new obj.constructor(); // changed (twice)
        for(var key in obj) {
            temp[key] = ref.clone(obj[key]);
        }
        return temp;
    };

    /**
     * e.g: substitute_reverse('hans hat dampf', 'hans {verb} {nomen}')
     * returns {verb:'hat', nomen:'dampf'}
     *
     * if template doesn't match str, false is returned
     */
    ref.substitute_reverse = function(str, template) {
        var search = template.replace(/\{[^\}]+\}/g, '([^/]+)');
	    var regExp = new RegExp(search, "g");
        if (str.search(regExp) == 0) {
            var values = regExp.exec(str).slice(1);
            var keys = template.match(/{([^}]+)}/g, template);
            var dict = {};
            for (var i=0; i<values.length; i++) {
                var key = keys[i].substring(1, keys[i].length - 1);
                dict[key] = values[i];
            }
            return dict;
        } else {
            return false;
        }
    };

    ref.removeAllChildNodes = function(node) {
        while (node.hasChildNodes()){
	        node.removeChild(node.firstChild);
	    }         
    };

    /**
     * taken from http://www.webtoolkit.info/javascript-url-decode-encode.html
     * needed for non-ascii-chars in urlencode (escape doesn't handle these correctly)
     */
    ref.utf8_encode = function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }
        return utftext;
    };

    ref.urlencode = function(string) {
        return escape(ref.utf8_encode(string));
    };

    /**
     * sameProperties({a:1}, {a:2}) -> true
     */
    ref.hasSameProperties = function(object1, object2) {
        var objects_merged = YAHOO.lang.merge(object1, object2);
        return ((ref.countProperties(object1) == ref.countProperties(object2)) && (ref.countProperties(object1) == ref.countProperties(objects_merged)));
    };

    /**
     * countProperties({a:1, b:2}) -> 2
     */
    ref.countProperties = function(object) {
        var count = 0;
        for (k in object) {
            if (object.hasOwnProperty(k)) {
                count++;
            }
        }
        return count;
    };

    /**
     * generates a somehow smart String-Difference:
     *
     * stringDiff("Query: Guide", "Cockpit: Guide")
     * returns ["Query", "Cockpit"]
     * 
     * stringDiff("Query: Guide", "Query Phonebook")
     * returns ["Guide", "Phonebook"]
     */
    ref.stringDiff = function(str1, str2) {
        if (str1 == str2) {
            return undefined;
        }
        var prefixLength = ref.samePrefixLength(str1, str2);
        if (prefixLength > 3) {
            return [str1.substring(prefixLength).trim(" .:"), str2.substring(prefixLength).trim(" .:")];
        }
        var postfixLength = ref.samePostfixLength(str1, str2);
        if (postfixLength > 3) {
            return [str1.slice(0, postfixLength * -1).trim(" .:"), str2.slice(0, postfixLength * -1).trim(" .:")];
        }
    };

    /**
     * e.g. samePrefixLength("Query: Guide", "Query: Phonebook")
     * returns 7 (which is == "Query: ".length)
     * function ignores case
     */
    ref.samePrefixLength = function(str1, str2) {
        var i = 0;
        var str1lower = str1.toLowerCase();
        var str2lower = str2.toLowerCase();
        while (str1.charAt(i) == str2.charAt(i)) {
            i++;
        }
        return i;
    };

    /**
     * e.g. samePrefixLength("Query: Guide", "Cockpit: Guide")
     * returns 7 (which is == ": Guide".length)
     * function ignores case
     */
    ref.samePostfixLength = function(str1, str2) {
        return ref.samePrefixLength(str1.reverse(), str2.reverse());
    };
 
})();

/**
 * taken from http://www.tek-tips.com/faqs.cfm?fid=6620
 */
String.prototype.startsWith = function(str) {
    return (this.match("^"+str)==str);
};
String.prototype.endsWith = function(str) {
    return (this.match(str+"$")==str);
};
/*
 * " string ".trim(" ")   -> "string"
 * ".:string:."trim(".:") -> "string"
 */
String.prototype.trim = function(trimChars){
    var regExpStart = new RegExp("^["+trimChars+"]+", "g");
    var regExpEnd = new RegExp("["+trimChars+"]+$", "g");
    return (this.replace(regExpStart, "").replace(regExpEnd, ""));
};
    
String.prototype.reverse = function(){
    var splitext = this.split("");
    var revertext = splitext.reverse();
    var reversed = revertext.join("");
    return reversed;
};