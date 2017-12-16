(function(){

'use strict';

const firefox = (typeof InstallTrigger !== 'undefined') ? true : false;
const opera   = window.hasOwnProperty('opr')            ? true : false;
const brauzer = firefox ? browser : chrome;

brauzer.runtime.sendMessage({target: 'background', subject: 'request', action: 'popup', data: {needResponse: true}}, response => {

	const status = {
		leftBar  : response.leftBar.value,
		rightBar : response.rightBar.value
	};

	const getI18n = (message, subs) => {
		return brauzer.i18n.getMessage(message, subs);
	};

	const createInputRow = (form, side, method) => {
		const input          = document.createElement('input');
		input.name           = side;
		input.type           = 'radio';
		input.dataset.method = method;
		const label          = document.createElement('label');
		label.textContent    = getI18n(`popupLabelText${method}`);
		input.checked        = (response[side].value === method);
		if (response[side].values.indexOf('native') !== -1)
			if (response[side].value === 'native') {
				if (opera)
					if (method !== 'native') {
						input.disabled = true;
						label.classList.add('disabled');
					}
			}
			else if (response.status.nativeSbPosition.value !== side || opera)
				if (method === 'native') {
					input.disabled = true;
					label.classList.add('disabled');
				}
		form.appendChild(input);
		form.appendChild(label);
	};

	const createForm = side => {
		const form    = document.createElement('form');
		form.name     = side;
		const p       = document.createElement('p');
		p.textContent = getI18n(`popupFormText${side}`);
		form.appendChild(p);
		for (let i = response[side].values.length - 1; i >= 0; i--)
			createInputRow(form, side, response[side].values[i]);
		container.appendChild(form);
	};

	const buttonEvents = {
		options   : event => {
			event.stopPropagation();
			brauzer.runtime.openOptionsPage();
		},
		home      : event => {
			brauzer.runtime.sendMessage({'target': 'background', 'subject': 'tabs', 'action': 'new', 'data': {'url': 'https://github.com/zluca/Sidebar'}});
		},
		translate : event => {
			brauzer.runtime.sendMessage({'target': 'background', 'subject': 'tabs', 'action': 'new', 'data': {'url': 'https://github.com/zluca/Sidebar/blob/master/CONTRIBUTING.md'}});
		},
		rate      : event => {
			brauzer.runtime.sendMessage({'target': 'background', 'subject': 'tabs', 'action': 'new', 'data': {'url': firefox ? 'https://addons.mozilla.org/en-US/firefox/addon/sidebar_plus/' : 'https://chrome.google.com/webstore/detail/sidebar%20/dnafkfkoknddnkdajibiigkopoelnhei?hl=en'}});
		}
	};

	const createButton = name => {
		const button  = document.createElement('span');
		button.id     = name;
		button.title  = getI18n(`popupButton${name}Title`);
		button.addEventListener('click', buttonEvents[name]);
		return button;
	};

	const container = document.createElement('main');
	container.id    = 'container';
	createForm('leftBar');
	createForm('rightBar');
	const p         = document.createElement('p');
	p.appendChild(createButton('rate'));
	p.appendChild(createButton('translate'));
	p.appendChild(createButton('home'));
	p.appendChild(createButton('options'));
	container.appendChild(p);
	document.body.appendChild(container);

	container.addEventListener('click', event => {
		event.stopPropagation();
		if (event.target.nodeName === 'LABEL')
			event.target.previousElementSibling.click();
	});
	container.addEventListener('change', event => {
		event.stopPropagation();
		const target    = event.target;
		const section   = target.name;
		const value     = target.dataset.method;
		if (firefox) {
			if (status[section] === 'native' && value !== 'native')
				brauzer.sidebarAction.close();
			else if (status[section] !== 'native' && value === 'native')
				brauzer.sidebarAction.open();
			status[section] = value;
		}
		brauzer.runtime.sendMessage({target: 'background', subject: 'options', action: 'handler', data: {'section': section, 'option': 'method', 'value': value}});
	});
});

})();