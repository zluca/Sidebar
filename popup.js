(function(){

'use strict';

const firefox = (typeof InstallTrigger !== 'undefined') ? true : false;
const brauzer = firefox ? browser : chrome;

brauzer.runtime.sendMessage({target: 'background', subject: 'request', action: 'popup', data: {needResponse: true}}, response => {

	// console.log(response);

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
		if (response[side].value === 'native' || method === 'native') {
			input.disabled   = true;
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

	const container = document.createElement('main');
	container.id    = 'container';
	createForm('leftBar');
	createForm('rightBar');
	const p         = document.createElement('p');
	const options   = document.createElement('span');
	options.id      = 'options';
	options.title   = getI18n('popupButtonOptionsTitle');
	const home      = document.createElement('span');
	home.id         = 'home';
	home.title      = getI18n('popupButtonHomeTitle');
	p.appendChild(home);
	p.appendChild(options);
	container.appendChild(p);
	document.body.appendChild(container);

	container.addEventListener('click', event => {
		event.stopPropagation();
		if (/label/i.test(event.target.nodeName))
			event.target.previousElementSibling.click();
	});
	container.addEventListener('change', event => {
		event.stopPropagation();
		brauzer.runtime.sendMessage({target: 'background', subject: 'options', action: 'handler', data: {section: event.target.name, option: 'method', value: event.target.dataset.method}});
	});
	options.addEventListener('click', event => {
		event.stopPropagation();
		brauzer.runtime.openOptionsPage();
	});
	home.addEventListener('click', event => {
		brauzer.runtime.sendMessage({target: 'background', subject: 'tabs', action: 'new', data: {url: 'https://github.com/zluca/Sidebar'}});
	});
});

})();