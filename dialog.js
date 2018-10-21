(function() {

'use strict';

const firefox = typeof InstallTrigger !== 'undefined';
const brauzer = firefox ? browser : chrome;

const type    = decodeURIComponent(document.location.hash).replace('#', '');
const doc     = document.documentElement;

send('background', 'request', 'dialog', {needResponse: true}, response => {
	makeDialogWindow(response.data, response.warnings, response.theme);
});

function setFontSize(mainfontSize) {
	doc.style.setProperty('font-size', mainfontSize);
	const fontSize = parseInt(window.getComputedStyle(doc).getPropertyValue('font-size'));
	brauzer.tabs.getZoom(zoom => {
		doc.style.fontSize   = `${fontSize / zoom}px`;
		doc.style.lineHeight = `${fontSize * 1.2 / zoom}px`;
	});
}

function makeDialogWindow(data, warnings, theme) {

	setFontSize();
	window.onresize = _ => {setFontSize(theme.mainFontSize);};

	doc.style.setProperty('--background-color', theme.backgroundColor);
	doc.style.setProperty('--background-color-active', theme.backgroundColorActive);
	doc.style.setProperty('--font-color', theme.fontColor);
	doc.style.setProperty('--font-color-active', theme.fontColorActive);
	doc.style.setProperty('--font-color-inactive', theme.fontColorInactive);
	doc.style.setProperty('--border-color', theme.borderColor);
	doc.style.setProperty('--border-color-active', theme.borderColorActive);

	let optionsChanged = false;
	let completer, completerTimer;
	let okButton, cancelButton;

	const dialog   = document.createElement('div');
	const header   = document.createElement('header');
	const main     = document.createElement('main');
	const footer   = document.createElement('footer');
	const warning  = document.createElement('div');
	const buttons  = document.createElement('div');
	dialog.id      = 'sbp-dialog';
	document.body.appendChild(dialog);
	let width = document.body.offsetWidth / 3;
	if (width > 600) width  = 600;
	if (width < 300) width  = 300;
	dialog.style.width      = `${width / document.body.offsetWidth * 100}%`;
	dialog.appendChild(header);
	dialog.appendChild(main);
	dialog.appendChild(footer);
	footer.appendChild(warning);
	footer.appendChild(buttons);
	main.addEventListener('change', _ => {
		optionsChanged = true;
	});
	dialog.classList.add(type);

	const setHeader = _ => {
		header.textContent = getI18n(`dialog${type}Header`);
	};

	const addInputRow =  {
		text : inputType => {
			const label       = document.createElement('label');
			label.textContent = getI18n(`dialog${inputType}Label`);
			const input       = document.createElement('input');
			input.type        = 'text';
			input.placeholder = getI18n(`dialog${type}${inputType}Placeholder`);
			input.value       = data.hasOwnProperty(inputType) ? data[inputType] : '';
			main.appendChild(label);
			main.appendChild(input);
			return input;
		},
		textarea : inputType => {
			const label       = document.createElement('label');
			label.textContent = getI18n(`dialog${inputType}Label`);
			const input       = document.createElement('textarea');
			input.value       = data.hasOwnProperty(inputType) ? data[inputType] : '';
			main.appendChild(label);
			main.appendChild(input);
			return input;
		},
		color : _ => {
			const label       = document.createElement('label');
			label.textContent = getI18n(`dialogColorLabel`);
			const input       = document.createElement('input');
			input.type        = 'color';
			input.value       = data.hasOwnProperty('color') ? data.color : '#006688';
			main.appendChild(label);
			main.appendChild(input);
			return input;
		},
		checkbox : (inputType, checked, reverse = false) => {
			const label       = document.createElement('label');
			label.textContent = getI18n(`dialog${inputType}Label`);
			const input       = document.createElement('input');
			input.type        = 'checkbox';
			input.checked     = checked;
			if (reverse === false) {
				label.addEventListener('click', event => {
					event.stopPropagation();
					label.nextElementSibling.click();
				});
				main.appendChild(label);
				main.appendChild(input);
			}
			else {
				label.classList.add('reverse');
				label.addEventListener('click', event => {
					event.stopPropagation();
					label.previousElementSibling.click();
				});
				main.appendChild(input);
				main.appendChild(label);
			}
			return input;
		},
		togglers : (type, options, prefix, select = false) => {
			const label         = document.createElement('label');
			label.textContent   = getI18n(`type${type}`);
			label.classList.add('options-section');
			label.dataset.id    = type;
			const section = document.createElement('div');
			section.classList.add('options-section');
			if (select === true) {
				section.classList.add('active');
				label.classList.add('active');
			}
			if (prefix === 'searchEngine') {
				label.style.backgroundImage = `url(icons/${type}.svg)`;
				label.style.paddingLeft     = '2.8rem';
			}
			for (let option in options) {
				const optionIcon        = document.createElement('span');
				optionIcon.classList    = `option ${options[option] === true ? ' selected' : ''}`;
				optionIcon.style.backgroundImage = `url(icons/${option}.svg)`;
				optionIcon.dataset.id   = option;
				optionIcon.dataset.type = type;
				optionIcon.title        = getI18n(`${prefix}${option}`);
				section.appendChild(optionIcon);
			}
			main.appendChild(label);
			main.appendChild(section);
		},
		selectors : (type, options) => {
			const label         = document.createElement('label');
			label.textContent   = getI18n(`type${type}`);
			label.classList.add('options-section');
			label.dataset.id    = type;
			const section       = document.createElement('div');
			section.classList.add('options-section');
			for (let option in options) {
				const label          = document.createElement('label');
				label.textContent    = getI18n(`clickActions${option}`);
				const selector       = document.createElement('select');
				selector.dataset.id  = option;
				selector.name        = option;
				selector.addEventListener('change', event => {
					for (let i = selector.children.length - 1; i >= 0; i--)
						if (selector.children[i].selected === true)
							options[option].value = selector.children[i].value;
				});
				const optgroup       = document.createElement('optgroup');
				selector.appendChild(optgroup);
				for (let i = 0, l = options[option].values.length; i < l; i++) {
					const opt       = document.createElement('option');
					opt.textContent = getI18n(`clickActions${options[option].values[i]}`);
					opt.value       = options[option].values[i];
					if (options[option].values[i] === options[option].value)
						opt.selected = true;
					optgroup.appendChild(opt);
				}
				label.appendChild(selector);
				section.appendChild(label);
			}
			main.appendChild(label);
			main.appendChild(section);
		}
	};

	const addSelectRow = (labelText, options) => {
		const label = document.createElement('label');
		label.textContent = labelText;
		main.appendChild(label);
		const select = document.createElement('select');
		for (let i = 0, l = options.length; i < l; i++) {
			const option = document.createElement('option');
			option.value = options[i].id;
			option.textContent = options[i].title;
			select.appendChild(option);
		}
		main.appendChild(select);
		return select;
	};

	const addWarning = _ => {
		const input       = document.createElement('input');
		input.type        = 'checkbox';
		input.checked     = warnings[type];
		input.addEventListener('click', event => {
			event.stopPropagation();
			send('background', 'options', 'handler', {'section': 'warnings', 'option': type, 'value': input.checked});
		});
		warning.appendChild(input);
		const label       = document.createElement('label');
		label.textContent = getI18n('dialogAskAgainWarning');
		label.addEventListener('click', event => {
			event.stopPropagation();
			label.previousElementSibling.click();
		});
		warning.appendChild(label);
		return input;
	};

	const addButton = (type, callback) => {
		const button = document.createElement('span');
		const make = {
			save    : _ => {
				button.textContent = getI18n('dialogSaveButton');
				button.addEventListener('click', callback);
				okButton = button;
			},
			delete  : _ => {
				button.textContent = getI18n('dialogDeleteButton');
				button.addEventListener('click', callback);
			},
			confirm : _ => {
				button.textContent = getI18n('dialogConfirmButton');
				button.addEventListener('click', callback);
				okButton = button;
			},
			cancel  : _ => {
				button.textContent = getI18n('dialogCancelButton');
				button.addEventListener('click', removeDialogWindow);
				cancelButton = button;
			},
			import  : _ => {
				button.textContent = getI18n('dialogImportButton');
				button.addEventListener('click', callback);
			},
			export  : _ => {
				button.textContent = getI18n('dialogExportButton');
				button.addEventListener('click', callback);
			},
			copy   : _ => {
				button.textContent = getI18n('dialogCopyButton');
				button.addEventListener('click', callback);
			}
		};
		make[type]();
		buttons.appendChild(button);
	};

	const addAutoCompleter = _ => {
		completer = document.createElement('div');
		completer.id = 'completer';
		dialog.appendChild(completer);
		return completer;
	};

	const addAlert = _ => {
		const p       = document.createElement('p');
		p.textContent = getI18n(`dialog${type}Alert`, [data.title]);
		main.appendChild(p);
	};

	const showCompleter = response => {
		if (response.length === 0)
			return hideCompleter();
		cleanCompleter();
		const inputs    = dialog.querySelectorAll('input');
		const rect      = inputs[0].getClientRects()[0];
		for (let i = 0, l = response.length; i < l; i++) {
			const site                 = document.createElement('p');
			site.textContent           = response[i].title || response[i].url;
			site.dataset.index         = i;
			site.title                 = response[i].url;
			site.style.backgroundImage = `url(${response[i].fav})`;
			completer.appendChild(site);
		}
		completer.style.display = 'block';
		completer.style.top     = rect.bottom + 'px';
		completer.style.left    = rect.left + 'px';
		completer.style.width   = rect.width + 'px';
		document.addEventListener('click', event => {
			if (event.target.nodeName === 'P') {
				const index     = event.target.dataset.index;
				inputs[0].value = response[index].url;
				inputs[1].value = response[index].color;
			}
			hideCompleter();
			completer.style.display = 'none';
		});
	};

	const hideCompleter = _ => {
		cleanCompleter();
		completer.style.display = 'none';
	};

	const cleanCompleter = _ => {
		for (let i = completer.firstChild; i !== null; i = completer.firstChild)
			completer.removeChild(i);
	};

	const removeDialogWindow = _ => {
		send('background', 'dialog', 'remove', {});
	};

	const getI18n = (message, subs) => {
		return brauzer.i18n.getMessage(message, subs);
	};

	const keyboardListener = event => {
		event.stopPropagation();
		if (/textarea/i.test(event.target.nodeName)) return;
		if (event.key === 'Escape')
			cancelButton.click();
		else if (event.key === 'Enter') {
			const focused = document.querySelector(':focus');
			if (focused !== null)
				focused.blur();
			okButton.click();
		}
	};

	const fillWindow = {

		siteCreate : _ => {

			let completerTimer;
			let lastValue;
			setHeader();
			const inputUrl   = addInputRow.text('url');
			addAutoCompleter();
			const inputColor = addInputRow.color();
			inputUrl.addEventListener('keyup', function() {
				if (inputUrl.value.length > 2) {
					if (lastValue !== inputUrl.value) {
						lastValue = inputUrl.value;
						send('background', 'history', 'searchSite', {request: inputUrl.value, maxResults: 10, needResponse: true}, response => showCompleter(response));
					}
				}
				else
					hideCompleter();
			});
			addButton('save', _ => {
				if (optionsChanged === true) {
					const url   = inputUrl.value;
					if (url !== '')
						send('background', 'startpage', 'create',
							{
								'url'   : url,
								'index' : data.index,
								'color' : inputColor.value,
							}
						);
				}
				removeDialogWindow();
			});
			addButton('cancel');
			inputUrl.focus();
		},

		siteChange : _ => {

			setHeader();
			const inputUrl   = addInputRow.text('url');
			const inputText  = addInputRow.textarea('text');
			const inputColor = addInputRow.color();
			addButton('save', _ => {
				removeDialogWindow();
				if (optionsChanged === true)
					send('background', 'startpage', 'change', {'index': data.index, 'url': inputUrl.value, 'color': inputColor.value, 'text': inputText.value});
			});
			addButton('delete', _ => {
				removeDialogWindow();
				if (warnings.siteDelete === true)
					send('background', 'dialog', 'siteDelete', {'index': data.index, 'title': data.url});
				else
					send('background', 'startpage', 'delete', {'index': data.index});
			});
			addButton('cancel');
		},

		siteDelete : _ => {

			setHeader();
			addAlert();
			addWarning();
			addButton('confirm', _ => {
				removeDialogWindow();
				send('background', 'startpage', 'delete', {'index': data.index});
			});
			addButton('cancel');
		},

		domainFolderClose : _ => {

			setHeader();
			addAlert();
			addWarning();
			addButton('confirm', _ => {
				send('background', 'tabs', 'domainFolderClose', {'id': data.id});
				removeDialogWindow();
			});
			addButton('cancel');
		},

		bookmarkDelete : _ => {

			setHeader();
			addAlert();
			addWarning();
			addButton('confirm', _ => {
				removeDialogWindow();
				send('background', 'bookmarks', 'bookmarkDelete', {'id': data.id});
			});
			addButton('cancel');
		},

		bookmarkFolderDelete : _ => {

			setHeader();
			addAlert();
			addWarning();
			addButton('confirm', _ => {
				removeDialogWindow();
				send('background', 'bookmarks', 'bookmarkFolderDelete', {'id': data.id});
			});
			addButton('cancel');
		},

		bookmarkNew : _ => {

			setHeader();
			const inputUrl    = addInputRow.text('url');
			const inputTitle  = addInputRow.text('title');
			const folder      = addSelectRow(getI18n('dialogBookmarkFoldersLabel'), data.folders);
			addButton('save', _ => {
				send('background', 'bookmarks', 'bookmarkNew', {'url': inputUrl.value, 'title': inputTitle.value, 'parentId': folder.value || "0"});
				removeDialogWindow();
			});
			addButton('cancel');
		},

		bookmarkFolderNew : _ => {

			setHeader();
			const inputTitle  = addInputRow.text('title');
			const folder      = addSelectRow(getI18n('dialogBookmarkFoldersLabel'), data.folders);
			addButton('save', _ => {
				send('background', 'bookmarks', 'bookmarkFolderNew', {'title': inputTitle.value, 'parentId': folder.value || "0"});
				removeDialogWindow();
			});
			addButton('cancel');
		},

		bookmarkEdit : _ => {

			setHeader();
			const inputTitle  = addInputRow.text('title');
			const inputUrl    = addInputRow.text('url');
			addButton('save', _ => {
				send('background', 'bookmarks', 'bookmarkEdit', {'id': data.id, 'changes': {'url': inputUrl.value, 'title': inputTitle.value}});
				removeDialogWindow();
			});
			addButton('cancel');
		},

		bookmarkFolderEdit : _ => {

			setHeader();
			const inputTitle  = addInputRow.text('title');
			addButton('save', _ => {
				send('background', 'bookmarks', 'bookmarkFolderEdit', {'id': data.id, 'changes' : {'title': inputTitle.value}});
				removeDialogWindow();
			});
			addButton('cancel');
		},

		historyFolderDelete : _ => {

			setHeader();
			addAlert();
			addWarning();
			addButton('confirm', _ => {
				removeDialogWindow();
				send('background', 'history', 'historyFolderDelete', {'id': data.id});
			});
			addButton('cancel');
		},

		rssNew : _ => {

			setHeader();
			const inputTitle  = addInputRow.text('title');
			const inputUrl    = addInputRow.text('url');
			addButton('save', _ => {
				if (optionsChanged === true || data.hasOwnProperty('url')) {
					const url = inputUrl.value;
					if (url !== '')
						send('background', 'rss', 'rssNew', {'url': url, 'title': inputTitle.value});
				}
				removeDialogWindow();
			});
			addButton('cancel');
			inputUrl.focus();
		},

		rssImportExport : _ => {

			const importInput     = document.createElement('input');
			importInput.type      = 'file';
			importInput.multiple  = false;
			importInput.accept    = '.opml';

			importInput.addEventListener('change', event => {
			    const reader     = new FileReader();
			    reader.onloadend = _ => {
		    		send('background', 'rss', 'import', reader.result);
		    		removeDialogWindow();
			    };
			    reader.readAsText(importInput.files[0]);
			});

			setHeader();
			addAlert();

			addButton('import', _ => {
				importInput.click();
			});
			addButton('export', _ => {
				send('background', 'rss', 'export');
				removeDialogWindow();
			});
			addButton('cancel');
		},

		rssExport : _ => {
			setHeader();
			const opml = addInputRow.textarea('text');
			addButton('copy', _ => {
				opml.select();
				document.execCommand('copy');
			});
			addButton('cancel');
		},

		rssFeedEdit : _ => {

			setHeader();
			const inputTitle = addInputRow.text('title');
			const inputDesc  = addInputRow.text('description');
			addButton('save', _ => {
				if (optionsChanged === true) {
					send('background', 'rss', 'rssFeedEdit', {'id': data.id, 'title': inputTitle.value, 'description': inputDesc.value});
				removeDialogWindow();
				}
			});
			addButton('delete', _ => {
				removeDialogWindow();
				if (warnings.rssFeedDelete === true)
					send('background', 'dialog', 'rssFeedDelete', {'id': data.id, 'title': data.title});
				else
					send('background', 'rss', 'rssFeedDelete', {'id': data.id});
			});
			addButton('cancel');
			inputTitle.focus();
		},

		rssFeedDelete : _ => {
			setHeader();
			addAlert();
			addWarning();
			addButton('confirm', _ => {
				send('background', 'rss', 'rssFeedDelete', {'id': data.id});
				removeDialogWindow();
			});
			addButton('cancel');
		},

		downloadDelete : _ => {

			setHeader();
			const alert = document.createElement('p');
			let title = data.title;
			if (title.length > 30)
				title = title.substring(0, 28) + '...';
			alert.textContent = getI18n('dialogDownloadDeleteAlert', [title]);
			main.appendChild(alert);
			const deleteFromHistory = addInputRow.checkbox('deleteFromHistory', true, true);
			const deleteFile        = addInputRow.checkbox('deleteFile', false, true);
			addButton('confirm', _ => {
				if (deleteFile.checked === true)
					send('background', 'downloads', 'removeFile', {'id': data.id});
				if (deleteFromHistory.checked === true)
					send('background', 'downloads', 'erase', {'id': data.id});
				removeDialogWindow();
			});
			addButton('cancel');
		},

		pocketNew : _ => {

			setHeader();
			const inputUrl   = addInputRow.text('url');
			const inputTitle = addInputRow.text('title');
			addButton('save', _ => {
				if (optionsChanged === true || data.hasOwnProperty('url')) {
					const url = inputUrl.value;
					if (url !== '')
						send('background', 'pocket', 'add', {'url': url, 'title': inputTitle.value});
				}
				removeDialogWindow();
			});
			addButton('cancel');
		},

		pocketDelete : _ => {

			setHeader();

			const alert = document.createElement('p');
			let title = data.title;
			if (title.length > 30)
				title = title.substring(0, 28) + '...';
			alert.textContent = getI18n('dialogPocketDeleteAlert', [title]);
			main.appendChild(alert);
			addWarning();
			addButton('confirm', _ => {
				send('background', 'pocket', 'delete', data.id);
				removeDialogWindow();
			});
			addButton('cancel');
		},

		pocketFolderDelete : _ => {

			setHeader();
			addAlert();
			addWarning();
			addButton('confirm', _ => {
				removeDialogWindow();
				send('background', 'pocket', 'folderDelete', data.id);
			});
			addButton('cancel');
		},

		searchSelect : _ => {

			let options = {};
			let type    = data.type;

			setHeader();
			for (let type in data.searchTypes) {
				options[type] = {};
				for (let i = 0, l = data.searchTypes[type].length; i < l; i++)
					options[type][data.searchTypes[type][i]] = data.options[data.searchTypes[type][i]];
				addInputRow.togglers(type, options[type], 'searchEngine', data.options.type === type);
			}
			addButton('save', _ => {
				for (let type in options)
					for (let option in options[type])
						if (options[type][option] !== data.options[option])
							send('background', 'options', 'handler', {'section': data.target, 'option': option, 'value': options[type][option]});
				if (type !== data.type)
					send('background', 'options', 'handler', {'section': data.target, 'option': 'type', 'value': type});
				removeDialogWindow();
			});
			addButton('cancel');

			main.addEventListener('click', event => {
				if (event.target.nodeName === 'SPAN') {
					event.target.classList.toggle('selected');
					options[event.target.dataset.type][event.target.dataset.id] = !options[event.target.dataset.type][event.target.dataset.id];
				}
				else if (event.target.nodeName === 'LABEL') {
					const active = document.getElementsByClassName('active');
					active[1].classList.remove('active');
					active[0].classList.remove('active');
					event.target.classList.add('active');
					event.target.nextElementSibling.classList.add('active');
					type = event.target.dataset.id;
				}
			});
		},

		actions : _ => {

			const options = {
				'clickActions' : {},
				'hoverActions' : {}
			};
			for (let option in data.hoverActions)
				options.hoverActions[option] = data.hoverActions[option];
			for (let option in data.clickActions)
				if (option !== 'hidden') {
					options.clickActions[option]        = {};
					options.clickActions[option].value  = data.clickActions[option].value;
					options.clickActions[option].values = data.clickActions[option].values;
				}

			setHeader();
			for (let option in options.hoverActions) {
				addInputRow.togglers('hoverActions', options.hoverActions, data.prefix);
				break;
			}
			addInputRow.selectors('clickActions', options.clickActions);

			addButton('save', _ => {
				for (let option in options.hoverActions)
					if (options.hoverActions[option] !== data.hoverActions[option])
						send('background', 'options', 'handler', {'section': `${data.type}HoverActions`, 'option': option, 'value': options.hoverActions[option]});
				for (let option in options.clickActions)
					if (options.clickActions[option].value !== data.clickActions[option].value)
						send('background', 'options', 'handler', {'section': `${data.type}ClickActions`, 'option': option, 'value': options.clickActions[option].value});
				removeDialogWindow();
			});
			addButton('cancel');

			main.addEventListener('click', event => {
				if (event.target.nodeName === 'SPAN') {
					event.target.classList.toggle('selected');
					options.hoverActions[event.target.dataset.id] = !options.hoverActions[event.target.dataset.id];
				}
			});
			main.addEventListener('change', event => {
				if (event.target.nodeName === 'SELECT')
					options.clickActions[event.target.dataset.id].value = event.target.value;
			});
		}
	};

	fillWindow[type]();
	document.body.style.paddingTop = `calc(${((document.body.offsetHeight - dialog.offsetHeight) >> 1) / document.body.offsetWidth * 80}%)`;
	document.body.addEventListener('keydown', keyboardListener);
}

function send(target, subject, action, data = {}, callback = _ => {}) {
	brauzer.runtime.sendMessage({'target': target, 'subject': subject, 'action': action, 'data': data}, callback);
}

})();