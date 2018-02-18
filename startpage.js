(function() {

'use strict';

const firefox = typeof InstallTrigger !== 'undefined';
const brauzer = firefox ? browser : chrome;
const doc     = document.documentElement;

const status  = {
	initDone            : false,
	siteSettingsChanged : false,
	bigFontSize         : 0,
	dragging            : false,
};

const data    = {
	sites           : [],
	searchFolders   : [],
	searchFoldersId : [],
	searchHeaders   : [],
	domains         : [],
	domainsId       : []
};

let i18n      = {};

let options   = {};

let siteContainer   = null;
let searchContainer = null;
let searchNav       = null;
let searchResults   = null;
let searchField     = null;
let searchOptions   = null;

let initTimer       = -1;
tryToInit();

function tryToInit() {
	send('background', 'request', 'startpage', {needResponse: true}, response => {
		// console.log(response);
		if (response === undefined) {
			initTimer = setTimeout(tryToInit, 200);
			return;
		}
		if (response.options.startpage.empty === true) return;
		init(response);
	});
}

function init(response) {

	// console.log(response);
	let lastSearch           = '';
	let hoveredItem          = null;
	options                  = response.options;
	i18n                     = response.i18n;
	document.title           = i18n.pageTitle;

	const siteStyle          = dce('style', document.head);
	const search             = dcea('header', document.body, ['id', 'search']);
	searchOptions            = dcea('span', search, ['id', 'search-options']);
	dcea('span', searchOptions, ['classList', 'search-icon']);
	searchField              = dceam('input', search, [['id', 'search-field'], ['value', response.searchQuery]]);
	const letsSearch         = dceam('span', search, [['id', 'lets-search'], ['title', i18n.searchButtonTitle]]);
	dce('span', letsSearch);
	siteContainer            = dcea('main', document.body, ['id', 'site-container']);
	searchContainer          = dcea('main', document.body, ['id', 'search-container']);
	searchNav                = dce('nav', searchContainer);
	searchResults            = dcea('div', searchContainer, ['id', 'search-results']);
	const editButton         = dceam('span', document.body, [['id', 'edit-button'], ['title', i18n.editButtonTitle]]);
	dce('span', editButton);
	const placeholder        = dcea('section', document.body, ['id', 'placeholder']);

	initSearch(response.searchFolders, response.searchQuery);
	insertSearchItems(response.search, true);
	setStyle();
	setColor(options.theme);
	setBackground();
	setImageStyle[options.startpage.imageStyle]();
	setDomainsStyles.rewrite(response.domains);
	setSearchType();

	for (let i = 0, l = response.sites.length; i < l; i++)
		insertSite(i, response.sites[i]);
	insertFinisher();

	setMode();

	brauzer.runtime.onMessage.addListener(message => {
		// console.log(message);
		if (message.hasOwnProperty('target'))
			if (message.target === 'startpage')
				messageHandler[message.subject][message.action](message.data);
	});

	window.addEventListener('resize', setStyle, {'passive': true});

	siteContainer.addEventListener('mousedown', event => {
		event.stopPropagation();
		if (event.button !== 0) return;
		if (event.target.nodeName !== 'A') return;
		const target = event.target.parentNode;
		event.preventDefault();
		let timer;

		const makeDraggable = _ => {

			let shiftX, shiftY, lastX = 0, lastY = 0, color, w, h, startPosition, placeholderPosition, newPosition;
			const lastColumn   = options.startpage.columns - 1;
			const lastRow      = options.startpage.rows - 1;
			const dx           = 1 / options.startpage.columns;
			const dy           = 1 / options.startpage.rows;
			const rect         = siteContainer.getClientRects()[0];
			const topBorder    = rect.top;
			const bottomBorder = rect.bottom;
			const width        = rect.width;
			const height       = rect.height;

			const finishDrag = _ => {
				document.body.removeEventListener('mousemove', drag);
				document.body.removeEventListener('mouseup', finishDrag);
				siteContainer.insertBefore(target, placeholder);
				target.classList.remove('draggable');
				placeholder.classList.remove('active');
				document.body.appendChild(placeholder);
				target.style.left   = 0;
				target.style.top    = 0;
				target.style.width  = 'auto';
				target.style.height = 'auto';
				if (startPosition !== placeholderPosition)
					send('background', 'startpage', 'move', {'from': startPosition, 'to': newPosition});
				else
					status.dragging = false;
			};

			const calculatePos = (x, y) => {
				const nx = Math.floor((x / width) / dx);
				if (y < topBorder)
					newPosition = nx;
				else if (y > bottomBorder)
					newPosition = (lastRow * options.startpage.columns) + nx;
				else {
					const ny = Math.floor((y - topBorder) / height / dy);
					newPosition = ny * options.startpage.columns + nx;
				}
				if (newPosition < placeholderPosition) {
					siteContainer.insertBefore(placeholder, children[newPosition]);
					placeholderPosition = newPosition;
				}
				else if (newPosition > placeholderPosition) {
					siteContainer.insertBefore(placeholder, children[newPosition + 1]);
					placeholderPosition = newPosition + 1;
				}
			};

			const drag = event => {
				if (Math.abs(event.pageX - lastX) > 20) {
					lastX = event.pageX;
					lastY = event.pageY;
					calculatePos(lastX, lastY);
				}
				else if (Math.abs(event.pageY - lastY) > 20) {
					lastX = event.pageX;
					lastY = event.pageY;
					calculatePos(lastX, lastY);
				}
				target.style.left = `${shiftX + event.pageX}px`;
				target.style.top  = `${shiftY + event.pageY}px`;
			};

			document.body.removeEventListener('mouseup', cancelDrag);
			event.preventDefault();
			const targetRect = target.getClientRects()[0];
			w = targetRect.width;
			h = targetRect.height;
			status.dragging = true;
			startPosition = parseInt(target.dataset.index);
			placeholderPosition = startPosition;
	        shiftX = targetRect.left - event.pageX;
	        shiftY = targetRect.top  - event.pageY;
			target.style.left   = `${targetRect.left}px`;
			target.style.top    = `${targetRect.top}px`;
			target.style.width  = `${w}px`;
			target.style.height = `${h}px`;
			target.classList.add('draggable');
			siteContainer.insertBefore(placeholder, target);
			document.body.appendChild(target);
			const children     = siteContainer.children;
			placeholder.classList.add('active');
			document.body.addEventListener('mousemove', drag);
			document.body.addEventListener('mouseup', finishDrag);
		};

		const cancelDrag = _ => {
			clearTimeout(timer);
			document.body.removeEventListener('mouseup', cancelDrag, {'passive': true});
		};

		timer = setTimeout(makeDraggable, 500);
		document.body.addEventListener('mouseup', cancelDrag, {'passive': true});
	});

	siteContainer.addEventListener('mouseover', event => {
		const target = event.target;
		if (status.dragging === true) return;
		if (target.nodeName === 'A')
			target.parentNode.appendChild(editButton);
	}, {'passive': true});

	siteContainer.addEventListener('click', event => {
		const target = event.target;
		if (target.classList.contains('add-new'))
			send('background', 'dialog', 'siteCreate', {'index': target.dataset.index});
		else if (target.classList.contains('site')) {
			if (event.ctrlKey === true)
				send('background', 'tabs', 'new', {'url': event.target.title});
			else if (event.shiftKey === true)
				send('background', 'tabs', 'new', {'url': event.target.title, 'newWindow': true});
			else
				document.location = event.target.title;
		}
	}, {'passive': true});

	editButton.addEventListener('click', event => {
		event.stopPropagation();
		event.preventDefault();
		send('background', 'dialog', 'siteChange', {index: editButton.parentNode.dataset.index});
	});

	searchOptions.addEventListener('click', event => {
		send('background', 'dialog', 'spSearchSelect', '');
	}, {'passive': true});

	letsSearch.addEventListener('click', event => {
		const subject    = searchField.value;
		if (subject !== '') {
			lastSearch = subject;
			send('background', 'spSearch', 'query', subject);
		}
		else
			send('background', 'spSearch', 'changeQuery', subject);
	}, {'passive': true});

	searchField.addEventListener('keydown', event => {
		if (event.key === 'Enter')
			letsSearch.click();
		else {
			setTimeout(_ => {
				const subject = searchField.value;
				if (subject !== lastSearch) {
					lastSearch = subject;
					send('background', 'spSearch', 'changeQuery', subject);
				}
			}, 10);
		}
	}, {'passive': true});

	searchResults.addEventListener('mouseover', event => {
		if (hoveredItem === event.target)
			return;
		if (options.search.type === 'general')
			if (event.target.parentNode.nodeName === 'UL') {
				hoveredItem = event.target;
				siteStyle.textContent =
					`a.${event.target.dataset.domain}-domain{
						border-color:var(--border-color-active);
						background-color: var(--background-color-active);
						color: var(--font-color-active);
					}`;
			}
	}, {'passive': true});

	searchResults.addEventListener('mouseleave', event => {
		hoveredItem = null;
		siteStyle.textContent = '';
	}, {'passive': true});
}

function insertSite(index, newSite) {
	data.sites[index] = dceamd('section', siteContainer, [['id', `site-${index}`]], [['index', index]]);
	dce('a', data.sites[index]);
	setSiteProperties(data.sites[index], newSite);
}

function insertFinisher() {
	siteContainer.appendChild(document.createElement('div'));
	siteContainer.lastChild.id = `site-${options.startpage.rows * options.startpage.columns}`;
	status.initDone = true;
}

function insertSearchItems(info, clean) {
	let folder = null;
	let pid    = -1;
	const makeItem = {
		general : item => dceamd('a', folder,
			[['innerHTML', item.title], ['href', item.url], ['title', item.description], ['classList', `${item.domain}-domain search item`]],
			[['url', item.url], ['domain', item.domain]]),
		dev     : item => dceamd('a', folder,
			[['innerHTML', item.title], ['href', item.url], ['title', item.description], ['classList', `${item.domain}-domain search item`]],
			[['url', item.url], ['domain', item.domain]]),
		video   : item => dceamd('a', folder,
			[['innerHTML', item.title], ['href', item.url], ['title', item.description], ['classList', `${item.domain}-domain search item`]],
			[['url', item.url], ['domain', item.domain]]),
		buy     : item => dceamd('a', folder,
			[['innerHTML', `<b>${item.price}</b><p>${item.title}</p>`], ['href', item.url], ['title', `${item.price}\n\n${item.title}`], ['classList', `${item.domain}-domain search item`]],
			[['url', item.url], ['domain', item.domain]]).style.backgroundImage = `url(${item.img}`
	};
	for (let i = 0, l = info.length; i < l; i++) {
		if (pid !== info[i].type) {
			const index = data.searchFoldersId.indexOf(info[i].type);
			if (index === -1) continue;
			pid         = data.searchFoldersId[index];
			folder      = data.searchFolders[index];
			if (clean === true)
				while (folder.hasChildNodes())
					folder.removeChild(folder.firstChild);
		}

		makeItem[options.search.type](info[i]);
	}
}

function insertSearchFolder(item) {
	data.searchFoldersId.push(item.id);
	data.searchFolders.push(dcea('ul', searchResults, ['classList', `search-folder mode-${item.mode} ${item.hidden === true ? 'hidden' : ''}`]));
	const length = data.searchHeaders.push(dcea('h2', searchNav, ['classList', `mode-${item.mode} ${item.hidden === true ? 'hidden' : ''}`]));
	dceam('a', data.searchHeaders[length - 1], [['href', item.searchLink || ''], ['classList', `domain-${item.id}`], ['textContent', item.title]]);
}

const messageHandler = {
	options : {
		searchType          : info => {
			setSearchType(info.value);
		},
		searchEnabled         : info => {
			options.startpage.searchEnabled = info.value;
			initSearch();
			setStyle();
		},
		backgroundColor       : info => {
			setColor({'backgroundColor': info.value});
		},
		backgroundColorActive : info => {
			setColor({'backgroundColorActive': info.value});
		},
		fontColor          : info => {
			setColor({'fontColor': info.value});
		},
		fontColorActive    : info => {
			setColor({'fontColorActive': info.value});
		},
		fontColorInactive    : info => {
			setColor({'fontColorInactive': info.value});
		},
		borderColor        : info => {
			setColor({'borderColor': info.value});
		},
		borderColorActive  : info => {
			setColor({'borderColorActive': info.value});
		},
		rows                  : info => {
			options.startpage.rows    = info.value;
			setStyle();
		},
		columns               : info => {
			options.startpage.columns = info.value;
			setStyle();
		},
		marginV               : info => {
			options.startpage.marginV = info.value;
			setStyle();
		},
		marginH               : info => {
			options.startpage.marginH = info.value;
			setStyle();
		},
		padding               : info => {
			options.startpage.padding = info.value;
			setStyle();
		},
		fontSize              : info => {
			options.theme.fontSize = info.value;
			setStyle();
		},
		image                 : info => {
			setBackground(`url(${info.value})`);
		},
		imageStyle            : info => {
			setImageStyle[info.value]();
		},
		// wikiSearchLang        : info => {
		// 	options.startpage.wikiSearchLang = info.value;
		// },
		// translateFrom         : info => {
		// 	options.startpage.translateFrom = info.value;
		// },
		// translateTo           : info => {
		// 	options.startpage.translateTo = info.value;
		// },
		mode                  : info => {
			setMode(info.value);
		},
		type                  : info => {
			setSearchType(info.value);
		}
	},
	info    : {
		newDomain      : info => {
			setDomainsStyles.update([info.domain]);
		},
		updateDomain   : info => {
			setDomainsStyles.update([info]);
		}
	},
	site    : {
		changed       : info => {
			setSiteProperties(data.sites[info.index], info.site);
		},
		moved         : info => {
			if (status.dragging === true)
				status.dragging = false;
			else {
				let beacon;
				if (info.from < info.to)
					beacon = data.sites[info.to + 1];
				else
					beacon = data.sites[info.to];
				siteContainer.insertBefore(data.sites[info.from], beacon);
			}
			for (let i = 0, sites = siteContainer.children, l = sites.length; i < l; i++) {
				sites[i].dataset.index = i;
				sites[i].id            = `site-${i}`;
			}
		},
		remove        : _ => {
			const count = options.startpage.rows * options.startpage.columns;
			while (count < siteContainer.children.length)
				siteContainer.removeChild(siteContainer.lastChild);
			insertFinisher();
		},
		addSites      : info => {
			siteContainer.removeChild(siteContainer.lastChild);
			const oldCount = siteContainer.children.length;
			for (let i = 0, l = info.sites.length; i < l; i ++)
				insertSite(i + oldCount, info.sites[i]);
			insertFinisher();
		}
	},
	search  : {
		update     : info => {
			const index = data.searchFoldersId.indexOf(info.target);
			if (index === -1) return;
			data.searchFolders[index].classList[info.method]('loading');
		},
		newItems    : info => {
			if (options.startpage.mode !== 'search')
				setMode('search');
			const index = data.searchFoldersId.indexOf(info.target);
			if (index === -1) return;
			insertSearchItems(info.items, true);
		},
		changeQuery  : info => {
			searchField.value = info;
		},
		showFolder    : info => {
			const index = data.searchFoldersId.indexOf(info.id);
			if (index === -1) return;
			data.searchFolders[index].classList.remove('hidden');
			data.searchHeaders[index].classList.remove('hidden');
		},
		hideFolder : info => {
			const index = data.searchFoldersId.indexOf(info.id);
			if (index === -1) return;
			data.searchFolders[index].classList.add('hidden');
			data.searchHeaders[index].classList.add('hidden');
		}
	}
};

function initSearch(folders, query = '') {

	while (searchResults.hasChildNodes()) {
		searchResults.removeChild(searchResults.firstChild);
		searchNav.removeChild(searchNav.firstChild);
	}

	for (let i = 0; i < folders.length; i++)
		insertSearchFolder(folders[i]);
}

function setDomainStyle(item) {
	dceam('style', document.head, [['id', item.id], ['textContent', `.${item.id}-domain{background-image: url(${item.fav})}`]]);
}

const setDomainsStyles = {
	rewrite : items => {
		for (let i = data.domains.length - 1; i >= 0; i--)
			document.head.removeChild(data.domains[i]);
		data.domains   = [];
		data.domainsId = [];
		for (let i = items.length - 1; i >= 0; i--)
			setDomainStyle(items[i]);
	},
	update  : items => {
		for (let i = items.length - 1; i >= 0; i--) {
			const index = data.domainsId.indexOf(items[i].id);
			if (index !== -1)
				data.domains[index].textContent = `.domain-${items[i].id}{background-image: url(${items[i].fav})}`;
			else
				setDomainStyle(items[i]);
		}
	}
};

function setSearchType(type) {
	if (type !== undefined)
		options.search.type = type;
	searchOptions.title       = i18n[`type${options.search.type}`];
	searchField.placeholder   = i18n[`${options.search.type}Placeholder`];
	document.body.classList   = options.search.type;
}

function setSiteProperties(target, site) {
	target.classList              = site.class;
	target.firstChild.textContent = site.text;
	if (site.url === '')
		target.title           = i18n.addNewSiteTitle;
	else {
		target.firstChild.href = site.url;
		target.title           = site.url;
	}
	target.style.backgroundColor  = site.color;
	target.classList.add(`lines-${site.text.split('\n').length}`);
}

function setColor(colors) {
	if (colors.hasOwnProperty('backgroundColor'))
		doc.style.setProperty('--background-color', colors.backgroundColor);
	if (colors.hasOwnProperty('backgroundColorActive'))
		doc.style.setProperty('--background-color-active', colors.backgroundColorActive);
	if (colors.hasOwnProperty('fontColor'))
		doc.style.setProperty('--font-color', colors.fontColor);
	if (colors.hasOwnProperty('fontColorActive'))
		doc.style.setProperty('--font-color-active', colors.fontColorActive);
	if (colors.hasOwnProperty('fontColorInactive'))
		doc.style.setProperty('--font-color-inactive', colors.fontColorInactive);
	if (colors.hasOwnProperty('borderColor'))
		doc.style.setProperty('--border-color', colors.borderColor);
	if (colors.hasOwnProperty('borderColorActive'))
		doc.style.setProperty('--border-color-active', colors.borderColorActive);
}

function setStyle() {
	const fontSize        = options.theme.fontSize  / window.devicePixelRatio;
	const marginH         = options.startpage.marginH / window.devicePixelRatio;
	const marginV         = options.startpage.marginV / window.devicePixelRatio;
	const padding         = options.startpage.padding / window.devicePixelRatio;
	const containerHeight = window.innerHeight - (2 * padding) - (options.startpage.searchEnabled * (fontSize + padding));
	const sectionSize     = Math.round(((containerHeight - ((options.startpage.rows + 1) * marginV)) / options.startpage.rows));
	doc.style.fontSize    = fontSize;
	doc.style.setProperty('--marginH', `${marginH}px`);
	doc.style.setProperty('--marginV', `${marginV}px`);
	doc.style.setProperty('--padding', `${padding}px`);
	doc.style.setProperty('--bigFont1', `${sectionSize}px`);
	doc.style.setProperty('--rows', options.startpage.rows);
	doc.style.setProperty('--columns', options.startpage.columns);
	doc.style.setProperty('--searchDisplay', options.startpage.searchEnabled ? "grid" : "none");
}

function setBackground(image) {
	if (image !== undefined)
		options.startpage.image = image;
	document.body.style.backgroundImage = `url(${options.startpage.image})`;
}

function setMode(value) {
	if (value !== undefined)
		options.startpage.mode = value;
	doc.classList = options.startpage.mode;
}

const setImageStyle = {
	cover   : _ => {
		document.body.style.backgroundSize     = 'cover';
		document.body.style.backgroundRepeat   = 'no-repeat';
		document.body.style.backgroundPosition = 'initial';
	},
	contain : _ => {
		document.body.style.backgroundSize     = 'contain';
		document.body.style.backgroundRepeat   = 'no-repeat';
		document.body.style.backgroundPosition = 'center';
	},
	center  : _ => {
		document.body.style.backgroundSize     = 'initial';
		document.body.style.backgroundRepeat   = 'no-repeat';
		document.body.style.backgroundPosition = 'center';
	},
	repeat  : _ => {
		document.body.style.backgroundSize     = 'initial';
		document.body.style.backgroundRepeat   = 'repeat';
		document.body.style.backgroundPosition = 'initial';
	}
};

function send(target, subject, action, data, callback) {
	brauzer.runtime.sendMessage({'target': target, 'subject': subject, 'action': action, 'data': data}, callback);
}

function dce(nodeName, parent) {
	return parent.appendChild(document.createElement(nodeName));
}

function dcea(nodeName, parent, attr) {
	const element    = document.createElement(nodeName);
	element[attr[0]] = attr[1];
	parent.appendChild(element);
	return element;
}

function dceam(nodeName, parent, attrs) {
	const element = document.createElement(nodeName);
	for (let i = attrs.length - 1; i >= 0; i--)
		element[attrs[i][0]] = attrs[i][1];
	parent.appendChild(element);
	return element;
}

function dceamd(nodeName, parent, attrs, dataset) {
	const element = document.createElement(nodeName);
	for (let i = attrs.length - 1; i >= 0; i--)
		element[attrs[i][0]] = attrs[i][1];
	for (let i = dataset.length - 1; i >= 0; i--)
		element.dataset[dataset[i][0]] = dataset[i][1];
	parent.appendChild(element);
	return element;
}

})();