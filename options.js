(function() {

'use strict';

const firefox = typeof InstallTrigger !== 'undefined';
const brauzer = firefox ? browser : chrome;

let mode      = document.location.hash.replace('#', '');
document.body.classList.add(mode);

brauzer.runtime.sendMessage({target: 'background', subject: 'request', action: 'options', data: {needResponse: true}}, response => {

	const changes = {};

	const getI18n = (message, subs) => {
		return brauzer.i18n.getMessage(message, subs);
	};

	const header   = document.createElement('header');
	const nav      = document.createElement('nav');
	const main     = document.createElement('main');
	const sections = {};
	const footer   = document.createElement('footer');

	document.body.appendChild(header);
	document.body.appendChild(nav);
	document.body.appendChild(main);
	document.body.appendChild(footer);

	header.textContent       = getI18n('optHeaderText');

	const cancelButton       = document.createElement('span');
	cancelButton.textContent = getI18n('optCancelText');
	const saveButton         = document.createElement('span');
	saveButton.textContent   = getI18n('optSaveText');

	footer.appendChild(cancelButton);
	footer.appendChild(saveButton);

	const makeNavButton = name => {
		const button = document.createElement('span');
		button.id = `${name}-button`;
		button.textContent = getI18n(`opt${name}Button`);
		button.addEventListener('click', event => {
			document.body.classList = name;
		});
		nav.appendChild(button);
	};

	const addLabel = (name, target) => {
		const label = document.createElement('label');
		label.textContent = getI18n(`opt${name}Label`) || `"${name}"`;
		target.appendChild(label);
		return label;
	};

	const addOption = {
		float   : (section, option) => {
			const input           = document.createElement('input');
			input.min             = response[section][option].range[0];
			input.max             = response[section][option].range[1];
			input.step            = '0.1';
			input.dataset.section = section;
			input.dataset.option  = option;
			input.type            = 'number';
			input.dataset.type    = 'float';
			input.value           = response[section][option].value;
			input.classList.add('text');
			sections[section].appendChild(input);
			addLabel(`${section}${option}`, sections[section]);
		},
		integer : (section, option) => {
			const input           = document.createElement('input');
			input.min             = response[section][option].range[0];
			input.max             = response[section][option].range[1];
			input.step            = '1';
			input.dataset.section = section;
			input.dataset.option  = option;
			input.dataset.type    = 'integer';
			input.type            = 'number';
			input.value           = response[section][option].value;
			input.classList.add('text');
			sections[section].appendChild(input);
			addLabel(`${section}${option}`, sections[section]);
		},
		boolean : (section, option) => {
			const checkbox           = document.createElement('input');
			checkbox.dataset.section = section;
			checkbox.dataset.option  = option;
			checkbox.dataset.type    = 'boolean';
			checkbox.type            = 'checkbox';
			checkbox.checked         = response[section][option].value;
			sections[section].appendChild(checkbox);
			addLabel(`${section}${option}`, sections[section]);
		},
		select  : (section, option) => {
			const p = document.createElement('p');
			p.textContent = getI18n(`opt${section}${option}Text`);
			sections[section].appendChild(p);
			const form    = document.createElement('form');
			sections[section].appendChild(form);
			form.name     = option;
			for (const opt in response[section][option].values) {
				const radio           = document.createElement('input');
				radio.type            = 'radio';
				radio.dataset.type    = 'select';
				radio.name            = option;
				radio.dataset.value   = response[section][option].values[opt];
				radio.id              = `${section}-${response[section][option].values[opt]}`;
				radio.dataset.section = section;
				radio.dataset.option  = option;
				form.appendChild(radio);
				if (response[section][option].values[opt] === response[section][option].value)
					radio.checked = true;
				addLabel(`${response[section][option].values[opt]}`, form);
			}
		},
		dropdown  : (section, option) => {
			const dropdown = document.createElement('select');
			dropdown.value = response[section][option].value;
			dropdown.dataset.type = 'dropdown';
			dropdown.dataset.section = section;
			dropdown.dataset.option  = option;
			sections[section].appendChild(dropdown);
			addLabel(`${section}${option}`, sections[section]);
			for (const opt in response[section][option].values) {
				const dOption       = document.createElement('option');
				dOption.id          = `${section}-${response[section][option].values[opt]}`;
				dOption.value       = response[section][option].values[opt];
				dOption.textContent = getI18n(`opt${section}${dOption.value}Text`) || `"${dOption.value}"`;
				if (response[section][option].values[opt] === response[section][option].value)
				    dOption.selected = true;
				dropdown.appendChild(dOption);
			}
		},
		text    : (section, option) => {
			const input           = document.createElement('input');
			input.dataset.section = section;
			input.dataset.option  = option;
			input.dataset.type    = 'text';
			input.type            = 'text';
			input.value           = response[section][option].value;
			input.classList.add('text');
			sections[section].appendChild(input);
			addLabel(`${section}${option}`, sections[section]);
		},
		color   : (section, option) => {
			const input = document.createElement('input');
			input.dataset.section = section;
			input.dataset.option  = option;
			input.type            = 'color';
			input.dataset.type    = 'color';
			input.value           = response[section][option].value;
			sections[section].appendChild(input);
			addLabel(`${section}${option}`, sections[section]);
		},
		image   : (section, option) => {
			const checkbox           = document.createElement('input');
			checkbox.dataset.section = section;
			checkbox.dataset.option  = option;
			checkbox.dataset.type    = 'image';
			checkbox.type            = 'checkbox';
			checkbox.checked         = response[section][option].value !== '';
			const file               = document.createElement('input');
			file.dataset.section     = section;
			file.dataset.option      = option;
			file.dataset.type        = 'file';
			file.type                = 'file';
			file.multiple            = false;
			file.accept              = 'image/*';
			sections[section].appendChild(checkbox);
			sections[section].appendChild(file);
			addLabel(`${section}${option}`, sections[section]);
		}

	};

	const makeSection = section => {
		if (response[section].hasOwnProperty('hidden'))
			return;
		makeNavButton(section);
		sections[section]    = document.createElement('section');
		sections[section].id = `${section}-section`;
		const p              = document.createElement('p');
		p.textContent        = getI18n(`opt${section}Text`);
		sections[section].appendChild(p);
		main.appendChild(sections[section]);
		for (const option in response[section]) {
			if (!response[section][option].hasOwnProperty('hidden'))
				addOption[response[section][option].type](section, option);
		}
	};

	for (const name in response)
		makeSection(name);

	main.addEventListener('change', event => {
		event.stopPropagation();

		const getValue = {
			boolean  : target => target.checked,
			integer  : target => parseInt(target.value),
			float    : target => parseFloat(target.value),
			select   : target => target.dataset.value,
			color    : target => target.value,
			text     : target => target.value,
			dropdown : target => target.value,
			image    : target => target.checked === true ? true : '',
			file     : target => {
			    const reader     = new FileReader();
			    reader.onloadend = _ => {
			    	if (/^image/.test(target.files[0].type))
			    		changes[section][option] = reader.result;
			    };
			    reader.readAsDataURL(target.files[0]);
			}
		};

		const section  = event.target.dataset.section;
		const option   = event.target.dataset.option;
		const type     = event.target.dataset.type;
		if (type === 'image') {
			if (getValue.image(event.target) === true)
				return event.target.nextElementSibling.click();
		}
		if (!changes.hasOwnProperty(section))
			changes[section] = {};
		changes[section][option] = getValue[type](event.target);
		if (changes[section][option] === response[section][option]) {
			delete changes[section][option];
			if (Object.keys(changes[section]).length < 1)
				delete changes[section];
		}
	});

	main.addEventListener('click', event => {
		event.stopPropagation();
		if (event.target.nodeName === 'LABEL')
			event.target.previousElementSibling.click();
	});

	cancelButton.addEventListener('click', event => {
		event.stopPropagation();
		open(location, '_self').close();
	});

	saveButton.addEventListener('click', event => {
		event.stopPropagation();
		for (const section in changes) {
			for (const option in changes[section])
				brauzer.runtime.sendMessage({
					target  : 'background',
					subject : 'options',
					action  : 'handler',
					data    : {'section': section, 'option': option, 'value': changes[section][option]}
				});
		}
		open(location, '_self').close();
	});
});

})();