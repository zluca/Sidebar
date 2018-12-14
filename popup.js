(function(){

'use strict';

const firefox = typeof InstallTrigger !== 'undefined';
const opera   = window.hasOwnProperty('opr');
const brauzer = firefox ? browser : chrome;

brauzer.runtime.sendMessage({target: 'background', subject: 'request', action: 'popup', data: {needResponse: true}}, response => {

	const fontSize                            = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('font-size'));
	document.documentElement.style.fontSize   = `${fontSize / response.zoom}px`;
	document.documentElement.style.lineHeight = `${fontSize * 1.2 / response.zoom}px`;

	const status = {
		leftBar  : response.leftBar.value,
		rightBar : response.rightBar.value
	};

	const extensionUrl = firefox ? 'https://addons.mozilla.org/en-US/firefox/addon/sidebar_plus/' : 'https://chrome.google.com/webstore/detail/sidebar%20/dnafkfkoknddnkdajibiigkopoelnhei?hl=en';

	const getI18n = (message, subs) => {
		return brauzer.i18n.getMessage(message, subs);
	};

	const send = (target, subject, action, data = {}) => {
		brauzer.runtime.sendMessage({'target': target, 'subject': subject, 'action': action, 'data': data});
	}

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
		share     : event => {
			p.classList.toggle('share');
		},
		options   : event => {
			brauzer.runtime.openOptionsPage();
		},
		home      : event => {
			send('background', 'tabs', 'new', {'url': 'https://github.com/zluca/Sidebar'});
		},
		translate : event => {
			send('background', 'tabs', 'new', {'url': 'https://github.com/zluca/Sidebar/blob/master/CONTRIBUTING.md'});
		},
		rate      : event => {
			send('background', 'tabs', 'new', {'url': extensionUrl});
		},
		facebook  : event => {
			send('background', 'tabs', 'new', {'url': `https://www.facebook.com/sharer/sharer.php?u=${extensionUrl}`, 'newWindow': false});
		},
		vkontakte : event => {
			send('background', 'tabs', 'new', {'url': `http://vk.com/share.php?url=${extensionUrl}&title=${getI18n('extDescription')}`, 'newWindow': false});
		},
		twitter   : event => {
			send('background', 'tabs', 'new', {'url': `https://twitter.com/share?url=${extensionUrl}&text=${getI18n('extDescription')}`, 'newWindow': false});
		},
		telegram: event => {
			send('background', 'tabs', 'new', {'url': `https://telegram.me/share/url?url=${extensionUrl}&amp;text=${getI18n('extDescription')}`, 'newWindow': false});
		}
	};

	const createButton = name => {
		const button  = document.createElement('span');
		button.id     = name;
		button.title  = getI18n(`popupButton${name}Title`);
		button.addEventListener('click', buttonEvents[name]);
		p.appendChild(button);
	};

	const container = document.createElement('main');
	const p         = document.createElement('p');
	container.id    = 'container';
	createForm('leftBar');
	createForm('rightBar');
	createButton('rate');
	createButton('translate');
	createButton('home');
	createButton('options');
	createButton('facebook');
	createButton('vkontakte');
	createButton('twitter');
	createButton('telegram');
	createButton('share');
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