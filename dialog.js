(function() {

'use strict';

const firefox = (typeof InstallTrigger !== 'undefined') ? true : false;
const brauzer = firefox ? browser : chrome;

const type    = decodeURIComponent(document.location.hash).replace('#', '');
const doc     = document.documentElement;

send('background', 'request', 'dialog', {needResponse: true}, response => {
	makeDialogWindow(response.data, response.warnings, response.theme);
});

function setFontSize() {
	document.body.style.fontSize = `${10 / window.devicePixelRatio}px`;
}

function makeDialogWindow(data, warnings, colors) {

	setFontSize();
	window.onresize = _ => {setFontSize();};

	doc.style.setProperty('--background-color', colors.backgroundColor);
	doc.style.setProperty('--background-color-active', colors.backgroundColorActive);
	doc.style.setProperty('--font-color', colors.fontColor);
	doc.style.setProperty('--font-color-active', colors.fontColorActive);
	doc.style.setProperty('--font-color-inactive', colors.fontColorInactive);
	doc.style.setProperty('--border-color', colors.borderColor);
	doc.style.setProperty('--border-color-active', colors.borderColorActive);

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
	dialog.style.width      = `${width}px`;
	dialog.appendChild(header);
	dialog.appendChild(main);
	dialog.appendChild(footer);
	footer.appendChild(warning);
	footer.appendChild(buttons);
	main.addEventListener('change', _ => {
		optionsChanged = true;
	});
	dialog.classList.add(type);

	const addInputRow = (labelText, inputType, inputValue, inputPlaceholder = '', reverse = false) => {
		const label = document.createElement('label');
		label.textContent = labelText;
		main.appendChild(label);
		if (inputType === 'textarea') {
			const input = document.createElement('textarea');
			input.value = inputValue;
			main.appendChild(input);
			return input;
		}
		const input = document.createElement('input');
		input.type = inputType;
		if (inputType === 'text') input.placeholder = inputPlaceholder;
		if (inputType === 'checkbox') input.checked = inputValue;
		else input.value = inputValue;
		if (reverse) {
			label.classList.add('reverse');
			label.addEventListener('click', event => {
				event.stopPropagation();
				label.previousElementSibling.click();
			});
			main.insertBefore(input, label);
		}
		else
			main.appendChild(input);
		return input;
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

	const addWarning = option => {
		const input       = document.createElement('input');
		input.type        = 'checkbox';
		input.checked     = warnings[option];
		input.addEventListener('click', event => {
			event.stopPropagation();
			send('background', 'options', 'handler', {'section': 'warnings', 'option': option, 'value': input.checked});
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

	const addAlert = text => {
		const p = document.createElement('p');
		p.textContent = text;
		main.appendChild(p);
	};

	const showCompleter = response => {
		if (!response.length)
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
			if (focused)
				focused.blur();
			okButton.click();
		}
	};

	const fillWindow = {

		siteCreate : _ => {

			let completerTimer;
			let lastValue;
			let inputText;

			header.textContent = getI18n('dialogSiteNewHeader');

			const inputUrl     = addInputRow(
				getI18n('dialogEditSiteUrlLabel'), 'text', '', getI18n('dialogEditSiteUrlPlaceholder'));
			addAutoCompleter();
			const inputColor   = addInputRow(getI18n('dialogEditSiteColorLabel'), 'color', '#006688');

			inputUrl.addEventListener('keyup', function() {
					if (inputUrl.value.length > 2) {
						if (lastValue !== inputUrl.value) {
							lastValue = inputUrl.value;
							send('background', 'history', 'search', {request: inputUrl.value, maxResults: 10, needResponse: true}, response => showCompleter(response));
						}
					}
					else
						hideCompleter();
			});

			addButton('save', _ => {
				if (optionsChanged) {
					const url   = inputUrl.value;
					if (url)
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

			header.textContent = getI18n('dialogEditSiteHeader');

			const inputUrl     = addInputRow(
				getI18n('dialogEditSiteUrlLabel'), 'text', data.url, getI18n('dialogEditSiteUrlPlaceholder'));
			const inputText  = addInputRow(getI18n('dialogEditSiteTextLabel'), 'textarea', data.text, '');
			const inputColor = addInputRow(getI18n('dialogEditSiteColorLabel'), 'color', data.color);

			addButton('save', _ => {
				if (optionsChanged)
					send('background', 'startpage', 'change', {'index': data.index, 'url': inputUrl.value, 'color': inputColor.value, 'text': inputText.value});
				removeDialogWindow();
			});
			addButton('delete', _ => {
				removeDialogWindow();
				if (warnings.deleteSite)
					send('background', 'dialog', 'siteDelete', {'index': data.index, 'title': data.url});
				else
					send('background', 'startpage', 'delete', {'index': data.index});
			});
			addButton('cancel', removeDialogWindow);
		},

		siteDelete : _ => {

			header.textContent = getI18n('dialogSiteDeleteHeader');

			addAlert(getI18n('dialogSiteDeleteText', data.title));

			const warningCheckbox = addWarning('deleteSite');
			addButton('confirm', _ => {
				send('background', 'startpage', 'delete', {'index': data.index});
				if (!warningCheckbox.checked)
					send('background', 'options', 'warnings', {'option': 'deleteSite', 'value': false});
				removeDialogWindow();
			});
			addButton('cancel', removeDialogWindow);
		},

		closeDomainFolder : _ => {

			header.textContent = getI18n('dialogTabsCloseDomainHeader');

			addAlert(getI18n('dialogTabsCloseDomainAlertText', [data.title]));

			const warningCheckbox = addWarning('closeDomainFolder');
			addButton('confirm', _ => {
				send('background', 'tabs', 'removeByDomain', {'id': data.id});
				if (!warningCheckbox.checked)
					send('background', 'options', 'warnings', {'option': 'closeDomainFolder', 'value': false});
				removeDialogWindow();
			});
			addButton('cancel', removeDialogWindow);
		},

		bookmarkDelete : _ => {

			header.textContent = getI18n('dialogBookmarkDeleteHeader');

			addAlert(getI18n('dialogBookmarkDeleteAlertText', [data.title]));

			const warningCheckbox = addWarning('deleteBookmark');
			addButton('confirm', _ => {
				send('background', 'bookmarks', 'deleteItem', {'id': data.id});
				if (!warningCheckbox.checked)
					send('background', 'options', 'warnings', {'option': 'deleteBookmark', 'value': false});
				removeDialogWindow();
			});
			addButton('cancel', removeDialogWindow);
		},

		bookmarkFolderDelete : _ => {

			header.textContent = getI18n('dialogBookmarkFolderDeleteHeader');

			addAlert(getI18n('dialogBookmarkFolderDeleteAlertText', [data.title]));

			const warningCheckbox = addWarning('deleteBookmarkFolder');
			addButton('confirm', _ => {
				send('background', 'bookmarks', 'deleteFolder', {'id': data.id});
				removeDialogWindow();
			});
			addButton('cancel', removeDialogWindow);
		},

		newBookmark : _ => {

			header.textContent = getI18n('dialogNewBookmarkHeader');

			const title = addInputRow(getI18n('dialogBookmarkTitleLabel'), 'text', data.title || getI18n('dialogBookmarkDefaultTitle'));
			const url = addInputRow(getI18n('dialogBookmarkUrlLabel'), 'text', data.url);
			const folder = addSelectRow(getI18n('dialogBookmarkFoldersLabel'), data.folders);

			addButton('save', _ => {
				send('background', 'bookmarks', 'newBookmark', {'url': url.value, 'title': title.value, 'parentId': folder.value || "0"});
				removeDialogWindow();
			});
			addButton('cancel', removeDialogWindow);
		},

		editBookmark : _ => {

			header.textContent = getI18n('dialogEditBookmarkHeader');

			const title = addInputRow(getI18n('dialogBookmarkTitleLabel'), 'text', data.title || getI18n('dialogBookmarkDefaultTitle'));
			const url = addInputRow(getI18n('dialogBookmarkUrlLabel'), 'text', data.url);

			addButton('save', _ => {
				send('background', 'bookmarks', 'editBookmark', {'id': data.id, 'changes': {'url': url.value, 'title': title.value}});
				removeDialogWindow();
			});
			addButton('cancel', removeDialogWindow);
		},

		editBookmarkFolder : _ => {

			header.textContent = getI18n('dialogEditBookmarkFolderHeader');

			const title = addInputRow(getI18n('dialogBookmarkTitleLabel'), 'text', data.title || getI18n('dialogBookmarkDefaultTitle'));

			addButton('save', _ => {
				send('background', 'bookmarks', 'editBookmarkFolder', {'id': data.id, 'changes' : {'title': title.value}});
				removeDialogWindow();
			});
			addButton('cancel', removeDialogWindow);
		},

		rssAdd : _ => {

			header.textContent = getI18n('dialogRSSNewHeader');

			const inputTitle = addInputRow(getI18n('dialogRSSNewTitleLabel'), 'text', data.title ? data.title : '', getI18n('dialogRSSNewTitlePlaceholder'));
			const inputUrl = addInputRow(getI18n('dialogRSSNewUrlLabel'), 'text', data.url ? data.url : '', getI18n('dialogRSSNewUrlPlaceholder'));

			addButton('save', _ => {
				if (optionsChanged || data) {
					const url = inputUrl.value;
					if (url)
						send('background', 'rss', 'rssNew', {'url': url, 'title': inputTitle.value});
				}
				removeDialogWindow();
			});
			addButton('cancel', removeDialogWindow);

			inputUrl.focus();
		},

		rssEditFeed : _ => {

			header.textContent = getI18n('dialogRSSEditFeedHeader');

			const inputTitle = addInputRow(getI18n('dialogRSSEditFeedTitleLabel'), 'text', data.title, '');
			const inputDesc  = addInputRow(getI18n('dialogRSSEditFeedDescriptionLabel'), 'text', data.description, '');

			addButton('save', _ => {
				if (optionsChanged) {
					send('background', 'rss', 'rssEditFeed', {'id': data.id, 'title': inputTitle.value, 'description': inputDesc.value});
				removeDialogWindow();
				}
			});
			addButton('delete', _ => {
				if (warnings.deleteRssFeed)
					send('background', 'dialog', 'rssDeleteFeed', {'id': data.id, 'title': data.title});
				else
					send('background', 'rss', 'rssDeleteFeed', {'id': data.id});

			});
			addButton('cancel', removeDialogWindow);

			inputTitle.focus();
		},

		rssDeleteFeed : _ => {

			header.textContent = getI18n('dialogRSSFeedDeleteHeader');

			addAlert(getI18n('dialogRSSFeedDeleteAlertText', [data.title]));

			const warningCheckbox = addWarning('deleteRssFeed');
			addButton('confirm', _ => {
				send('background', 'rss', 'rssDeleteFeed', {'id': data.id});
				removeDialogWindow();
			});
			addButton('cancel', removeDialogWindow);
		},

		downloadDelete : _ => {

			header.textContent = getI18n('dialogDownloadDeleteHeader');

			const alert = document.createElement('p');
			let title = data.title;
			if (title.length > 30) title = title.substring(0, 28) + '...';
			alert.textContent = getI18n('dialogDownloadDeleteAlert', [title]);
			main.appendChild(alert);

			const deleteFromHistory = addInputRow(getI18n('dialogDownloadDeleteFromHistoryLabel'), 'checkbox', true, '', true);
			const deleteFile = addInputRow(getI18n('dialogDownloadDeleteFileLabel'), 'checkbox', false, '', true);

			addButton('confirm', _ => {
				if (deleteFile.checked)
					send('background', 'downloads', 'removeFile', {'id': data.id});
				if (deleteFromHistory.checked)
					send('background', 'downloads', 'erase', {'id': data.id});
				removeDialogWindow();
			});
			addButton('cancel', removeDialogWindow);
		}
	};

	fillWindow[type]();
	document.body.style.paddingTop = `calc(50vh - ${dialog.offsetHeight >> 1}px)`;
	document.body.addEventListener('keydown', keyboardListener);
}

function send(target, subject, action, data = {}, callback = _ => {}) {
	brauzer.runtime.sendMessage({'target': target, 'subject': subject, 'action': action, 'data': data}, callback);
}

})();