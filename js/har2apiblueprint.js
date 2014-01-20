function har2apiblueprint(har) {
	var context = {
		url: getPath(har.request.url),
		method: har.request.method,
		params: []
	};
	if (context.method.toLowerCase() == 'get') {
		var queryString = har.request.queryString;
		for (var i = 0; i < queryString.length; i++) {
			var param = queryString[i];
			if (param.name == '_t') {
				continue;
			}
			context.params.push({
				name: param.name,
				value: param.value,
				type: guessTypeFromValue(param.value)
			});
		}
	} else {
		var postData = JSON.parse(har.request.postData.text);
		for (var key in postData) {
			if (postData.hasOwnProperty(key) && key != '_t') {
				context.params.push({
					name: key,
					value: postData[key],
					type: guessTypeFromValue(postData[key])
				});
			}
		}
	}
	context.hasParams = context.params.length > 0;

	var sampleRequest = {};
	for (var i = 0; i < context.params.length; i++) {
		var param = context.params[i];
		sampleRequest[param.name] = param.value;
	}
	context.sampleRequest = indent(JSON.stringify(sampleRequest, null, '    '),'        ');
	context.sampleResponse = getSampleResponse(har);

	var tmpl = '' +
		'# {{method}} {{url}}\n\n' +
		'该API的说明。\n\n' + 
		'{{#if hasParams}}' +
			'+ Parameters\n\n' +
			'{{#each params}}' +
			'    + {{name}} ({{type}}) ... 参数{{name}}的说明\n' +
			'{{/each}}' +
			'\n+ Request\n\n{{{sampleRequest}}}\n\n' +
		'{{/if}}' +
		'+ Response\n\n{{{sampleResponse}}}';

	var compiled = Handlebars.compile(tmpl);
	try {
		var md = compiled(context);
	} catch (ex) {
		alert(ex);
	}
	return md;

}

function guessTypeFromValue(value) {
	if (/^\d+$/.test(value)) {
		return 'Integer';
	}
	if (/^[\d\.]+$/.test(value)) {
		return 'Number';
	}
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return 'Date';
	}
	return 'String';
}

function indent(str, indention) {
	str = str || '';
	indention = indention || '    ';
	return str.replace(/^/mg, indention);
}

function getPath(url) {
	var result = /(https?:\/\/[^\/]+)?([^\?]+)/.exec(url);
	if (result && result.length > 2) {
		return result[2];
	} else {
		return url;
	}
}

function getSampleResponse(har) {
	var result = har.response.content.text;
	if (/json$/i.test(har.response.content.mimeType)) {
		try {
			result = JSON.parse(result);
			result = JSON.stringify(result, null, '    ');
		} catch (ex) {
			result = har.response.content.text;
		}
	}
	return indent(result, '        ');
}