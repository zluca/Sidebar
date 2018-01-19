(function() {

'use strict';

const firefox  = typeof InstallTrigger !== 'undefined';
const brauzer  = firefox ? browser : chrome;
const doc      = document.documentElement;
const mask     = window.CSS.supports('mask-image') ? 'mask-image' : '-webkit-mask-image';
const element  = {
	tabs      : 'a',
	bookmarks : 'a',
	history   : 'a',
	downloads : 'li',
	rss       : 'a',
	pocket    : 'a',
	domains   : 'style'
};

const i18n     = {
	controls    : null,
	tabs        : null,
	bookmarks   : null,
	history     : null,
	downloads   : null,
	rss         : null
};

const status   = {
	side              : window.location.hash.replace('#', '').split('-')[0],
	bookmarkFolders  : [],
	historyInfo       : {
		lastDate : 0,
		lastNum  : 0
	},
	activeTab           : false,
	activeTabId         : 0,
	info                : {
		rssUnreaded    : 0,
		downloadStatus : ''
	},
	moving              : false,
	lastClicked         : {
		id   : -1,
		time : -1
	},
	lastSearch          : '',
	scrolling           : false,
	scrollTimer         : 0,
	timeStamp           : {
		mode    : 0,
		options : 0,
		info    : 0
	}
};

const data     = {
	tabs                : [],
	tabsId              : [],
	tabsFolders         : [],
	tabsFoldersId       : [],
	bookmarks           : [],
	bookmarksId         : [],
	bookmarksFolders    : [],
	bookmarksFoldersId  : [],
	history             : [],
	historyId           : [],
	historyFolders      : [],
	historyFoldersId    : [],
	downloads           : [],
	downloadsId         : [],
	rss                 : [],
	rssId               : [],
	rssFolders          : [],
	rssFoldersId        : [],
	pocket              : [],
	pocketId            : [],
	pocketFolders       : [],
	pocketFoldersId     : [],
	domains             : [],
	domainsId           : []
};

const options  = {
	sidebar          : {
		method            : window.location.hash.replace('#', '').split('-')[1],
		fixed             : false,
		wide              : false,
		width             : 0,
		mode              : '',
	},
	theme            : null,
	misc             : null,
	warnings         : null,
};

let initTimer  = -1;
tryToInit();

let onClick     = _ => {};
let insertItems = _ => {};

document.title = options.sidebar.method;
doc.classList.add(status.side);

const blockStyle = dce('link');
blockStyle.type  = 'text/css';
blockStyle.rel   = 'stylesheet';
document.head.appendChild(blockStyle);

const controls = {
	main     : dce('nav'),
	sidebar  : dce('div'),
	iframe   : null,

	item     : dce('div'),
	button   : dce('div'),
	bottom   : dce('div'),
	user     : dce('div')
};

controls.sidebar.classList.add('controls');
controls.bottom.classList.add('controls');
controls.item.classList.add('controls');
controls.button.classList.add('controls');
controls.user.classList.add('controls');
controls.sidebar.id = 'controls-sidebar';
controls.bottom.id  = 'controls-bottom';
controls.item.id    = 'controls-item';
controls.button.id  = 'controls-button';
controls.user.id    = 'controls-user';
controls.main.appendChild(controls.sidebar);

const block         = dce('main');
const searchResults = dce('div');
searchResults.id    = 'search-results';
searchResults.appendChild(dce('div'));
searchResults.firstChild.dataset.id = 'search-results';
searchResults.appendChild(dce('div'));
const rootFolder    = dce('div');
rootFolder.id       = 'root-folder';
rootFolder.appendChild(dce('div'));
rootFolder.firstChild.dataset.id = 0;
rootFolder.appendChild(dce('div'));
block.appendChild(controls.user);
block.appendChild(rootFolder);
block.appendChild(searchResults);
block.appendChild(controls.button);
block.appendChild(controls.bottom);
block.appendChild(controls.item);

document.body.appendChild(controls.main);
document.body.appendChild(block);

block.addEventListener('mouseover', event => {
	const target = event.target;
	if (target.classList.contains('item')) {
		target.appendChild(controls.item);
		if (options.sidebar.mode === 'rss')
			target.title = target.dataset.title;
	}
	else if (target.classList.contains('folder-name'))
		target.appendChild(controls.item);
	else if (target.parentNode.classList.contains('item'))
		target.parentNode.appendChild(controls.item);
}, {'passive': true});

block.addEventListener('click', event => {
	if (event.button !== 0) return;
	event.stopPropagation();
	event.preventDefault();
	if (event.target.classList.contains('folder-name')) {
		const folded = status.moving === true ? false : !event.target.parentNode.classList.contains('folded');
		send('background', 'set', 'fold', {'mode': options.sidebar.mode, 'id': event.target.parentNode.dataset.id, 'folded': folded, 'method': folded ? 'add' : 'remove'});
	}
	else if (status.moving === true)
		return;
	else
		onClick(event);
});

const button   = {
	tabs        : null,
	bookmarks   : null,
	history     : null,
	downloads   : null,
	rss         : null,
	pocket      : null
};

const messageHandler = {
	options   : {
		wide               : info => {
			setWide(info.value);
		},
		fixed              : info => {
			setFixed(info.value);
		},
		width              : info => {
			options.sidebar.width = info.value;
		},
		mode               : info => {
			initBlock[info.value](info.data);
		},
		bookmarkDelete     : info => {
			options.warnings.bookmarkDelete = info.value;
		},
		bookmarkFolderDelete: info => {
			options.warnings.bookmarkFolderDelete = info.value;
		},
		rssFeedDelete      : info => {
			options.warnings.rssFeedDelete = info.value;
		},
		domainFolderClose  : info => {
			options.warnings.domainFolderClose = info.value;
		},
		pocketDelete       : info => {
			options.warnings.pocketDelete = info.value;
		},
		fontSize           : info => {
			setFontSize(info.value);
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
		sidebarImage       : info => {
			doc.style.backgroundImage = `url(${info.value})`;
		},
		sidebarImageStyle  : info => {
			setImageStyle[info.value]();
		},
		services           : info => {
			button[info.service].classList[info.enabled === true ? 'remove' : 'add']('hidden');
		},
		tabsMode           : info => {
			options.misc.tabsMode = info;
		},
		rssMode            : info => {
			options.misc.rssMode = info;
		},
		pocketMode         : info => {
			options.misc.pocketMode = info;
		}
	},
	set       : {
		fold         : info => {
			if (info.mode !== options.sidebar.mode) return;
			const folder = getFolderById(info.mode, info.id);
			if (folder !== false)
				folder.classList[info.method]('folded');
		},
		reInit       : info => {
			if (info.timeStamp.options !== status.timeStamp.options)
				return initSidebar(info);
			if (info.timeStamp.info !== status.timeStamp.info) {
				info.timeStamp.info = status.timeStamp.info;
				button.rss.lastChild.textContent = info.info.rssUnreaded || ' ';
				setDownloadStatus[info.info.downloadStatus]();
			}
			if (info.data.mode !== options.sidebar.mode)
				return initBlock[info.data.mode](info.data);
			if (info.timeStamp[options.sidebar.mode] !== status.timeStamp.mode)
				return initBlock[info.data.mode](info.data);
			if (info.timeStamp.favs !== status.timeStamp.info.favs) {
				info.timeStamp.favs = status.timeStamp.info.favs;
				setDomainStyle.update(info.data.domains);
			}
		},
		hover       : info => {
			doc.classList[info]('hover');
		},
		side        : info => {
			if (options.sidebar.method === 'native')
				status.side = info;
		},
		scroll      : info => {
			options.scroll[options.sidebar.mode] = info;
			if (status.scrolling === true) {
				if (status.scrollTimer === 0)
					status.scrollTimer = setTimeout(_ => {status.scrolling = false;status.scrollTimer = 0;}, 500);
			}
			else {
				status.scrolling = true;
				window.scrollTo(0, info);
			}
		}
	},
	info      : {
		rssUnreaded    : info => {
			button.rss.lastChild.textContent = info.unreaded || ' ';
		},
		newDomain      : info => {
			setDomainStyle.update([info.domain]);
		},
		updateDomain   : info => {
			setDomainStyle.update([info]);
		},
		downloadStatus : info => {
			setDownloadStatus[info]();
		}
	},
	tabs      : {},
	bookmarks : {},
	history   : {},
	downloads : {},
	rss       : {},
	pocket    : {}
};

function tryToInit() {
	send('background', 'request', 'mode', {'side': status.side, 'method': options.sidebar.method, needResponse: true}, response => {
		if (response === undefined) {
			initTimer = setTimeout(tryToInit, 200);
			return;
		}

		if (options.sidebar.method === 'native') {
			const port = brauzer.runtime.connect({name: 'sidebar-alive'});
			if (firefox) {
				doc.addEventListener('mouseleave', event => {
					send('background', 'sidebar', 'sideDetection', {'sender': 'sidebar', 'action': 'leave', 'side': (event.x < doc.offsetWidth) ? 'rightBar' : 'leftBar'});
				}, {'passive': true});
				doc.addEventListener('mouseover', event => {
					send('background', 'sidebar', 'sideDetection',{'sender': 'sidebar', 'action': 'over', 'side': (event.x < doc.offsetWidth) ? 'rightBar' : 'leftBar'});
				}, {'passive': true});
			}
		}
		else if (options.sidebar.method === 'iframe') {
			if (firefox) {
				doc.addEventListener('mouseleave', event => {
					send('background', 'sidebar', 'sideDetection', {'sender': 'content', 'action': 'leave', 'side': (event.x > doc.offsetWidth) ? 'rightBar' : 'leftBar'});
				}, {'passive': true});
				doc.addEventListener('mouseover', event => {
					send('background', 'sidebar', 'sideDetection',{'sender': 'content', 'action': 'over', 'side': (event.x > doc.offsetWidth) ? 'rightBar' : 'leftBar'});
				}, {'passive': true});
			}
		}

		initSidebar(response);
	});
}

function initSidebar(response) {
	const onMessage = (message, sender, sendResponse) => {
		// console.log(message);
		if (message.hasOwnProperty('target'))
			if (message.target === 'sidebar' || message.target === status.side)
				if (messageHandler.hasOwnProperty(message.subject))
					if (messageHandler[message.subject].hasOwnProperty(message.action))
						messageHandler[message.subject][message.action](message.data, sendResponse);
	};

	brauzer.runtime.onMessage.removeListener(onMessage);

	status.side         = response.side;
	status.timeStamp    = response.timeStamp;
	options.misc        = response.options.misc;
	options.theme       = response.options.theme;
	options.warnings    = response.options.warnings;
	options.sidebar     = response.options.sidebar;
	options.pocket      = response.options.pocket;
	options.scroll      = response.options.scroll;
	i18n.header         = response.i18n.header;
	status.info         = response.info;

	setFontSize();
	setColor(options.theme);
	setImageStyle[options.theme.sidebarImageStyle]();

	doc.style.backgroundImage = `url(${options.theme.sidebarImage})`;

	for (let service in response.options.services)
		if (button[service] === null) {
			button[service] = makeButton(service, 'header', 'sidebar', !response.options.services[service]);
			if (service === 'rss') {
				const unreaded  = dce('div');
				unreaded.id     = 'rss-unreaded';
				button.rss.appendChild(unreaded);
			}
		}
		else
			button[service].classList[response.options.services[service] === true ? 'remove' : 'add']('hidden');

	setRssUnreaded(status.info.rssUnreaded);
	setDownloadStatus[status.info.downloadStatus]();

	if (options.sidebar.method === 'iframe') {
		doc.classList.remove('fixed');
		window.onresize = _ => {setFontSize();};
		if (controls.iframe === null) {
			controls.iframe       = dce('div');
			controls.iframe.id    = 'controls-iframe';
			controls.iframe.classList.add('controls');
			makeButton('pin', 'header', 'iframe');
			makeButton('unpin', 'header', 'iframe');
			makeButton('wide', 'header', 'iframe');
			makeButton('narrow', 'header', 'iframe');
			controls.main.appendChild(controls.iframe);
		}
		setWide(options.sidebar.wide);
		setFixed(options.sidebar.fixed);
	}

	initBlock[options.sidebar.mode](response.data);

	brauzer.runtime.onMessage.addListener(onMessage);
}

function prepareBlock(mode) {

	if (rootFolder.lastChild.hasChildNodes()) {
		rootFolder.removeChild(rootFolder.lastChild);
		rootFolder.appendChild(dce('div'));
	}
	if (controls.user.hasChildNodes()) {
		block.removeChild(controls.user);
		controls.user      = dce('div');
		controls.user.id   = 'controls-user';
		controls.user.classList.add('controls');
		block.insertBefore(controls.user, rootFolder);
	}
	if (controls.item !== null)
		controls.item.parentNode.removeChild(controls.item);
	controls.item    = dce('div');
	controls.item.id = 'controls-item';
	controls.item.classList.add('controls');
	block.appendChild(controls.item);
	if (controls.button.hasChildNodes()) {
		block.removeChild(controls.button);
		controls.button    = dce('div');
		controls.button.id = 'controls-button';
		controls.button.classList.add('controls');
		block.appendChild(controls.button);
	}
	if (controls.bottom.hasChildNodes()) {
		block.removeChild(controls.bottom);
		controls.bottom    = dce('div');
		controls.bottom.id = 'controls-bottom';
		controls.bottom.classList.add('controls');
		block.appendChild(controls.bottom);
	}

	clearData(options.sidebar.mode);

	clearTimeout(status.scrollTimer);
	window.removeEventListener('scroll', onscroll);
	status.scrollTimer = 0;
	status.scrolling   = false;
	blockStyle.href    = `sidebar-${mode}.css`;

	document.body.classList = mode;
	if (options.sidebar.mode !== mode) {
		options.sidebar.mode    = mode;
		messageHandler[options.sidebar.mode] = {};
	}
	searchActive(false);

	window.scrollTo(0, options.scroll[options.sidebar.mode]);
	window.addEventListener('scroll', onscroll, {'passive': true});
}

const initBlock = {

	tabs : info => {

		const moveTab       = info => {
			const tab = getById('tabs', info.id);
			if (tab === false) return;
			if (options.misc.tabsMode === 'plain') {
				if (info.newIndex < info.oldIndex)
					rootFolder.lastChild.insertBefore(tab, rootFolder.lastChild.children[info.newIndex]);
				else
					rootFolder.lastChild.insertBefore(tab, rootFolder.lastChild.children[info.newIndex + 1]);
			}
			else if (options.misc.tabsMode === 'tree') {
				if (info.newIndex < info.oldIndex)
					rootFolder.lastChild.insertBefore(tab.parentNode.parentNode, rootFolder.lastChild.children[info.newIndex]);
				else
					rootFolder.lastChild.insertBefore(tab.parentNode.parentNode, rootFolder.lastChild.children[info.newIndex + 1]);
			}
		};

		const fakeFolder    = tab => {
			return {
				id     : tab.id,
				pid    : tab.opener,
				view   : 'tree',
				folded : false
			};
		};

		const checkForTree  = (tabs, folders, view) => {
			setBlockClass('tabs', view);
			if (view !== 'tree')
				setView('tabs', view, tabs, folders);
			else {
				let fakeFolders = [];
				for (let i = 0, l = tabs.length; i < l; i++)
					fakeFolders.push(fakeFolder(tabs[i]));
				setView('tabs', 'tree', tabs, fakeFolders);
			}
		};

		prepareBlock('tabs');
		setBlockClass('tabs');
		setDomainStyle.rewrite(info.domains);
		i18n.tabs             = info.i18n;
		status.activeTabId    = info.activeTabId;
		status.timeStamp.mode = info.timeStamp;

		messageHandler.tabs   = {
			created    : info => {
				if (options.misc.tabsMode === 'tree')
					insertFolders('tabs', [fakeFolder(info.tab)], true);
				insertItems([info.tab]);
			},
			active     : info => {
				status.activeTabId = info;
				if (status.activeTab !== false) {
					status.activeTab.classList.remove('active');
					if (options.misc.tabsMode === 'domain')
						status.activeTab.parentNode.parentNode.firstChild.classList.remove('active');
				}
				status.activeTab = getById('tabs', info);
				if (status.activeTab === false) return;
				status.activeTab.classList.add('active');
				if (options.misc.tabsMode === 'domain')
					status.activeTab.parentNode.parentNode.firstChild.classList.add('active');
			},
			title      : info => {
				const tab = getById('tabs', info.id);
				if (tab !== false)
					tab.textContent = info.title;
			},
			status     : info => {
				const tab = getById('tabs', info.id);
				if (tab !== false)
					tab.classList[info.loading]('loading');
			},
			urlChanged  : info => {
				if (options.misc.tabsMode !== 'tree')
					insertItems([info.tab]);
				else {
					const tab = getById('tabs', info.tab.id);
					if (tab !== false)
						tab.href = info.tab.url;
				}
			},
			folderChanged : info => {
				if (options.misc.tabsMode === 'domain') {
					const tab = getById('tabs', info.tab.id);
					if (tab !== false)
						insertFolders('tabs', [info.folder]);
					insertItems([info.tab]);
				}
			},
			removed      : info => {
				const removing = {
					plain  : tab => {
						removeById('tabs', info.id);
					},
					domain : tab => {
						const pid    = tab.parentNode.parentNode.firstChild.dataset.id;
						const folder = getFolderById('tabs', pid);
						removeById('tabs', info.id);
						if (folder === false) return;
						if (!folder.lastChild.hasChildNodes())
							removeFolderById('tabs', pid);
						else
							folder.firstChild.classList.remove('active');
					},
					tree   : tab => {
						const folder = tab.parentNode;
						for (let i = 0, l = folder.children.length; i < l; i++)
							if (folder.children[i].classList.contains('folder'))
								folder.parentNode.insertBefore(folder.children[i], folder);
						folder.parentNode.removeChild(folder);
						removeById('tabs', info.id);
					}
				};
				const tab = getById('tabs', info.id);
				if (status.activeTabId === info.id) {
					status.activeTabId = -1;
					status.activeTab   = false;
				}
				if (tab !== false)
					removing[options.misc.tabsMode](tab);
			},
			moved           : info => {
				if (status.moving === true)
					doc.addEventListener('mouseup', finishMoving, {'once': true});
				else if (info.isFolder === false)
					moveTab(info);
				else
					moveFolder('tabs', info);
			},
			pinned       : info => {
				const tab = getById('tabs', info.id);
				if (tab !== false)
					tab.classList.add('pinned');
			},
			unpinned       : info => {
				const tab = getById('tabs', info.id);
				if (tab !== false)
					tab.classList.remove('pinned');
			},
			newFolder    : info => {
				if (options.misc.tabsMode === 'domain')
					insertFolders('tabs', [info]);
			},
			domainCount  : info => {
				const folder = getFolderById('tabs', info.id);
				if (info.view === 'hidden') {
					folder.classList.remove('domain-view');
					folder.classList.add('hidden-view');
				}
				else {
					folder.classList.add('domain-view');
					folder.classList.remove('hidden-view');
				}
			},
			folderRemoved: info => {
				const folder = getFolderById('tabs', info);
				if (folder !== false)
					removeFolderById('tabs', info);
			},
			view         : info => {
				checkForTree(info.items, info.folders, info.view);
			}
		};

		insertItems = tabs => {
			let pid         = 0;
			let tab         = null;
			let folder      = rootFolder;
			let treeFolders = [];

			const postProcess = {
				plain : _ => {
					folder.lastChild.appendChild(tab);
				},
				domain : i => {
					if (pid !== tabs[i].domain) {
						pid    = tabs[i].domain;
						folder = getFolderById('tabs', pid);
					}
					if (folder === false) return;
					folder.lastChild.appendChild(tab);
					if (status.activeTab === tab)
						folder.firstChild.classList.add('active');
				},
				tree  : i => {
					folder = getFolderById('tabs', tabs[i].id);
					if (folder.lastChild.hasChildNodes())
						folder.lastChild.insertBefore(tab, folder.lastChild.firstChild);
					else
						folder.lastChild.appendChild(tab);
				}
			};

			for (let i = 0, l = tabs.length; i < l; i++) {
				tab = getById('tabs', tabs[i].id);
				if (tab === false)
					tab = createById('tabs', tabs[i].id);
				tab.textContent = tabs[i].title;
				tab.title       = tabs[i].url;
				tab.href        = tabs[i].url;
				let classList   = `tab item domain-${tabs[i].domain} ${tabs[i].status}`;
				if (tabs[i].id === status.activeTabId) {
					status.activeTab = tab;
					classList += ' active';
				}
				classList += tabs[i].pinned    ? ' pinned'    : '';
				classList += tabs[i].discarded ? ' discarded' : '';
				tab.classList = classList;
				postProcess[options.misc.tabsMode](i);
			}
		};

		onClick     = event => {
			if (event.target.classList.contains('active'))
				return;
			else if (event.target.classList.contains('tab'))
				send('background', 'tabs', 'setActive', {'id': parseInt(event.target.dataset.id)});
		};

		makeButton('new', 'tabs', 'button');
		makeButton('move', 'tabs', 'item');
		makeButton('fav', 'tabs', 'item');
		makeButton('reload', 'tabs', 'item');
		makeButton('pin', 'tabs', 'item');
		makeButton('unpin', 'tabs', 'item');
		makeButton('close', 'tabs', 'item');
		makeButton('closeAll', 'tabs', 'item');
		makeButton('new', 'tabs', 'bottom');
		makeButton('plain', 'tabs', 'bottom');
		makeButton('domain', 'tabs', 'bottom');
		makeButton('tree', 'tabs', 'bottom');

		checkForTree(info.tabs, info.tabsFolders, options.misc.tabsMode);
	},

	bookmarks : info => {

		const moveBook        = (item, parent, index) => {

			const injectBook = _ => {
				const beacon = parent.lastChild.children[index];
				if (beacon !== undefined)
					parent.lastChild.insertBefore(item, beacon);
				else
					parent.lastChild.appendChild(item);
			};
			if (parent !== item.parentNode.parentNode)
				injectBook();
			else {
				rootFolder.lastChild.appendChild(item);
				injectBook();
			}
		};

		const changeBook      = (id, info) => {
			const bookmark = getById('bookmarks', id);
			if (info.hasOwnProperty('url'))
				bookmark.title = info.url;
			if (info.hasOwnProperty('title'))
				bookmark.textContent = info.title;
		};

		prepareBlock('bookmarks');
		setBlockClass('bookmarks');
		setDomainStyle.rewrite(info.domains);
		i18n.bookmarks           = info.i18n;
		status.timeStamp.mode    = info.timeStamp;

		messageHandler.bookmarks = {
			removed         : info => {
				removeById('bookmarks', info.id);
			},
			folderRemoved   : info => {
				removeFolderById('bookmarks', info.id);
			},
			changedBookmark : info => {
				changeBook(info.id, info.info);
			},
			changedFolder   : info => {
				const folde = getFolderById('bookmarks', info.id);
				if (folder !== false)
					folder.firstChild.textContent = info.title;
			},
			createdBookmark : info => {
				insertItems([info.item]);
			},
			createdFolder   : info => {
				insertFolders('bookmarks', [info.item]);
			},
			moved           : info => {
				if (status.moving === true)
					doc.addEventListener('mouseup', finishMoving, {'once': true});
				else if (info.isFolder === false)
					moveBook(getById('bookmarks', info.id) , getFolderById('bookmarks', info.pid), info.newIndex);
				else if (info.isFolder === true)
					moveBook(getFolderById('bookmarks', info.id) , getFolderById('bookmarks', info.pid), info.newIndex);
			}
		};

		onClick               = event => {
			if (event.target.classList.contains('bookmark'))
				openLink(event);
		};

		insertItems = (items, method = 'last') => {
			let folder = rootFolder;
			let count  = -1;
			let pid    = 0;

			const checkPid =
				method === 'search' ?
					item => {
						folder = searchResults;
					} :
					options.misc.bookmarksMode === 'tree' ?
						item => {
							if (item.pid !== pid) {
								pid    = item.pid;
								folder = getFolderById('bookmarks', pid);
								if (folder === false)
									folder = rootFolder;
								count  = folder.lastChild.children.length - 1;
							}
							count++;
						} :
						item => {};

			for (let i = 0, l = items.length; i < l; i++) {
				checkPid(items[i]);
				const bookmark       = createById('bookmarks', items[i].id, true);
				bookmark.classList.add('bookmark', `domain-${items[i].domain}`, `${items[i].hidden === true ? 'hidden' : 'item'}`);
				bookmark.title       = items[i].url;
				bookmark.href        = items[i].url;
				bookmark.textContent = items[i].title;
				if (count > items[i].index - 1)
					folder.lastChild.insertBefore(bookmark, folder.lastChild.children[items[i].index]);
				else
					folder.lastChild.appendChild(bookmark);
			}
		};

		makeButton('new', 'bookmarks', 'button');
		makeButton('folderNew', 'bookmarks', 'button');
		makeButton('edit', 'bookmarks', 'item');
		makeButton('move', 'bookmarks', 'item');
		makeButton('delete', 'bookmarks', 'item');
		makeButton('folderDelete', 'bookmarks', 'item');
		makeSearch('bookmarks');

		if (options.misc.bookmarksMode === 'tree')
			insertFolders('bookmarks', info.bookmarksFolders);
		insertItems(info.bookmarks, 'last');
	},

	history : info => {

		insertItems    = (items, method) => {
			let pid = -1;
			let folder = null;
			const insert = {
				first : item => {
					if (folder.lastChild.hasChildNodes())
						folder.lastChild.insertBefore(item, folder.lastChild.firstChild);
					else
						folder.lastChild.appendChild(item);
				},
				search : item => {
					searchResults.lastChild.appendChild(item);
				},
				last : item => {
					status.historyInfo.lastNum++;
					folder.lastChild.appendChild(item);
				}
			};
			for (let i = 0, l = items.length; i < l; i++) {
				let hist = getById('history', items[i].id);
				if (hist === false)
					hist = createById('history', items[i].id);
				if (items[i].pid !== pid) {
					pid    = items[i].pid;
					folder = getFolderById('history', pid);
				}
				hist.classList.add('history', 'item', `domain-${items[i].domain}`);
				hist.title = items[i].url;
				hist.href  = items[i].url;
				hist.textContent = items[i].title;
				insert[method](hist);
			}
		};

		const removeHistoryItems = ids => {
			for (let i = ids.length - 1; i >= 0; i--)
				removeById('history', ids[i]);
		};

		const historyTotalWipe   = _ => {
			for (let i = data.historyId.length - 1; i >= 0; i--)
				removeById('history', data.historyId[i]);
			getMoreButton.classList.add('hidden');
		};

		prepareBlock('history');
		setBlockClass('history');
		setDomainStyle.rewrite(info.domains);
		i18n.history             = info.i18n;
		status.timeStamp.mode    = info.timeStamp;

		messageHandler.history   = {
			new     : info =>  {
				insertFolders('history', [info.folder]);
				insertItems([info.item], 'first');
				if (info.historyEnd === true)
					getMoreButton.classList.add('hidden');
			},
			removed : info =>  {
				removeHistoryItems(info.ids);
			},
			wiped   : info =>  {
				historyTotalWipe();
			},
			gotMore : info =>  {
				insertFolders('history', info.historyFolders);
				insertItems(info.history, 'last');
				if (info.historyEnd === true)
					getMoreButton.classList.add('hidden');
			},
			title   : info =>  {
				const item = getById('history', info.id);
				if (item !== false)
					item.textContent = info.title;
			}
		};

		onClick               = event => {
			if (event.target.classList.contains('history'))
				openLink(event);
		};

		const now = new Date();
		status.historyInfo.lastDate = now.toLocaleDateString();

		const getMoreButton         = makeButton('getMore', 'history', 'button');

		makeSearch('history');

		insertFolders('history', info.historyFolders);
		insertItems(info.history, 'last');
		if (info.historyEnd === true)
			getMoreButton.classList.add('hidden');
	},

	downloads : info => {

		const insertDownload = item => {
			const down           = createById('downloads', item.id);
			down.title           = item.url;
			const filename       = dce('p');
			filename.textContent = item.filename;
			let classList        = `download item ${item.state}`;
			classList            += item.exists === true ? '' : ' deleted';
			if (item.paused === true)
				classList += item.canResume === true ? ' paused' : ' canceled';
			down.classList       = classList;
			const status         = dce('div');
			status.classList.add('status');
			status.title         = '';
			const progress       = dce('div');
			progress.classList.add('progress-bar');
			const bar            = dce('span');
			progress.appendChild(bar);
			bar.style.width      = item.progressPercent;
			const recived        = dce('div');
			recived.classList.add('recived');
			recived.textContent  = item.progressNumbers;
			const fileSize       = dce('div');
			fileSize.classList.add('file-size');
			fileSize.textContent = item.fileSize;
			status.appendChild(progress);
			status.appendChild(recived);
			status.appendChild(fileSize);
			down.appendChild(filename);
			down.appendChild(status);
			rootFolder.lastChild.insertBefore(down, rootFolder.lastChild.lastChild);
		};

		prepareBlock('downloads');
		setBlockClass('downloads');
		setDomainStyle.rewrite(info.domains);
		i18n.downloads           = info.i18n;
		status.timeStamp.mode    = info.timeStamp;

		messageHandler.downloads = {
			created    : info => {
				insertDownload(info.item);
			},
			erased     : info => {
				removeById('downloads', info.id);
			},
			exists     : info => {
				const download = getById('downloads', info.id);
				if (download === false) return;
				download.classList[info.method]('deleted');
			},
			startPause : info => {
				const download = getById('downloads', info.id);
				if (download === false) return;
				if (info.paused === true) {
					if (info.canResume === true)
						download.classList.add('paused');
					else
						download.classList.add('canceled');
				}
				else
					download.classList.remove('paused');
			},
			state     : info => {
				const download = getById('downloads', info.id);
				if (download === false) return;
				download.classList.remove('complete', 'interrupted', 'in_progress');
				download.classList.add(info.state);
			},
			progress  : info => {
				const download = getById('downloads', info.item.id);
				if (download === false) return;
				download.firstChild.nextElementSibling.firstChild.firstChild.style.width = info.item.progressPercent;
				download.firstChild.nextElementSibling.firstChild.nextElementSibling.textContent = `${info.item.progressNumbers}  |  ${info.item.speed}`;
				download.firstChild.nextElementSibling.firstChild.nextElementSibling.nextElementSibling.textContent = info.item.fileSize;
			},
			filename  : info => {
				const download = getById('downloads', info.id);
				if (download === false) return;
				download.firstChild.textContent = info.filename;
			}
		};

		onClick = event => {
			const target = event.target.classList.contains('download') ?
				event.target :
				event.target.parentNode.classList.contains('download') ?
					event.target.parentNode :
					null;
			if (target !== null)
				if (target.classList.contains('complete')) {
					if (event.pageX - target.offsetLeft < options.theme.fontSize)
						brauzer.downloads.show(parseInt(target.dataset.id));
					else
						brauzer.downloads.open(parseInt(target.dataset.id));
				}
		};

		makeButton('pause', 'downloads', 'item');
		makeButton('resume', 'downloads', 'item');
		makeButton('reload', 'downloads', 'item');
		makeButton('stop', 'downloads', 'item');
		makeButton('delete', 'downloads', 'item');

		for (let i = 0, l = info.downloads.length; i < l; i++)
			insertDownload(info.downloads[i]);
	},

	rss : info => {

		const setReadedMode = (readedMode, rssMode) => {
			if (rssMode !== undefined)
				options.misc.rssMode = rssMode;
			options.misc.rssHideReaded = readedMode;
			setBlockClass('rss', options.misc.rssMode, readedMode === true ? 'hide-readed' : 'show-readed');
		};

		prepareBlock('rss');
		setReadedMode(options.misc.rssHideReaded);
		setDomainStyle.rewrite(info.domains);
		i18n.rss              = info.i18n;
		status.timeStamp.mode = info.timeStamp;

		messageHandler.rss    = {
			createdFeed      : info =>  {
				insertFolders('rss', [info.feed]);
			},
			newItems         : info =>  {
				if (options.misc.rssMode === 'plain')
					insertItems(info.items, 'date');
				else
					insertItems(info.items, 'first');
			},
			rssReaded        : info =>  {
				const rssItem = getById('rss', info.id);
				if (rssItem === false) return;
				rssItem.classList.remove('unreaded');
				if (info.feedReaded === true)
					rssItem.parentNode.classList.remove('unreaded');
			},
			rssReadedAll     : info =>  {
				const feed = getFolderById('rss', info.id);
				if (feed === false) return;
				feed.classList.remove('unreaded');
				for (let items = feed.children, i = items.length - 1; i >= 0; i--)
					items[i].classList.remove('unreaded');
			},
			rssReadedAllFeeds : info => {
				for (let i = data.rss.length - 1; i >= 0; i--)
					data.rss[i].classList.remove('unreaded');
				for (let i = data.rssFolders.length - 1; i >= 0; i--)
					data.rssFolders[i].classList.remove('unreaded');
			},
			view             : info =>  {
				setReadedMode(options.misc.rssHideReaded, info.view);
				setView('rss', info.view, info.items, info.folders);
			},
			rssHideReaded    : info =>  {
				const feed = getFolderById('rss', info.id);
				if (feed !== false)
					feed.classList.add('hide-readed');
			},
			rssShowReaded    : info =>  {
				const feed = getFolderById('rss', info.id);
				if (feed !== false)
					feed.classList.remove('hide-readed');
			},
			rssFeedChanged   : info =>  {
				const feed = getFolderById('rss', info.id);
				if (feed === false) return;
				feed.firstChild.firstChild.textContent = info.title;
				feed.firstChild.title                  = info.description;
			},
			rssFeedDeleted   : info =>  {
				removeFolderById('rss', info.id);
			},
			rssItemDeleted   : info => {
				removeById('rss', info.id);
			},
			update           : info => {
				const feed = getFolderById('rss', info.id);
				if (feed !== false)
					feed.firstChild.classList[info.method]('loading');
			},
			moved            : info => {
				if (status.moving === true)
					doc.addEventListener('mouseup', finishMoving, {'once': true});
				else
					moveFolder('rss', info);
			},
			readedMode       : info => {
				setReadedMode(info);
			},
			updateAll        : info => {
				block.classList[info]('updated');
			}
		};

		insertItems = (items, method) => {
			const insert = {
				domainfirst : (item, info) => {
					pidCheck(info.pid);
					folder.lastChild.insertBefore(item, folder.lastChild.firstChild);
				},
				plainfirst  : (item, info) => {
					folder.lastChild.insertBefore(item, folder.lastChild.firstChild);
				},
				domainlast  : (item, info) => {
					pidCheck(info.pid);
					folder.lastChild.appendChild(item);
				},
				plainlast   : (item, info) => {
					folder.lastChild.appendChild(item);
				},
				domaindate  : (item, info) => {
					pidCheck(info.pid);
					if (folder.lastChild.hasChildNodes())
						folder.lastChild.insertBefore(item, folder.lastChild.firstChild);
					else
						folder.lastChild.appendChild(item);
				},
				plaindate   : (item, info) => {
					if (data.rss.length < 2)
						folder.lastChild.appendChild(item);
					else
						folder.lastChild.insertBefore(item, folder.lastChild.children[info.index]);
				}
			};

			const pidCheck = newPid => {
				if (pid !== newPid) {
					pid    = newPid;
					folder = getFolderById('rss', pid);
				}
			};

			let pid = 0;
			let folder = rootFolder;
			for (let i = 0, l = items.length; i < l; i++) {
				const item         = createById('rss', items[i].id);
				item.textContent   = items[i].title;
				item.dataset.link  = items[i].link;
				item.dataset.date  = items[i].date;
				item.href          = items[i].link;
				item.dataset.title = `${items[i].title}\n\n${items[i].description}`;
				// item.addEventListener('mouseover', _ => {
				// 	item.title = `${items[i].title}\n\n${items[i].description}`;
				// },
				// {'passive': true, 'once': true});
				if (items[i].readed)
					item.classList.add('item', 'rss-item', `domain-${items[i].domain}`);
				else {
					item.classList.add('item', 'rss-item', `domain-${items[i].domain}`, 'unreaded');
					folder.classList.add('unreaded');
				}
				insert[`${options.misc.rssMode}${method}`](item, items[i]);
			}
		};

		makeButton('new', 'rss', 'button');
		makeButton('reload', 'rss', 'item');
		makeButton('move', 'rss', 'item');
		makeButton('markReaded', 'rss', 'item');
		makeButton('markReadedAll', 'rss', 'item');
		makeButton('hideReaded', 'rss', 'item');
		makeButton('showReaded', 'rss', 'item');
		makeButton('options', 'rss', 'item');
		makeButton('new', 'rss', 'bottom');
		makeButton('importExport', 'rss', 'bottom');
		makeButton('hideReadedAll', 'rss', 'bottom');
		makeButton('showReadedAll', 'rss', 'bottom');
		makeButton('markReadedAllFeeds', 'rss', 'bottom');
		makeButton('reloadAll', 'rss', 'bottom');
		makeButton('plain', 'rss', 'bottom');
		makeButton('domain', 'rss', 'bottom');
		onClick = event => {
			if (event.target.classList.contains('item')) {
				openLink(event);
				send('background', 'rss', 'rssReaded', {'id': event.target.dataset.id});
			}
		};
		setView('rss', options.misc.rssMode, info.rss, info.rssFolders);
	},

	pocket : info => {

		const updateItem      = (pocket, info) => {
			let classList      = `pocket item ${info.favorite === true ? 'favorite ' : ''} domain-${info.domain} type-${info.type}`;
			pocket.href        = info.url;
			pocket.dataset.url = info.url;
			pocket.textContent = info.title;
			pocket.classList   = classList;
			pocket.title       = info.description !== '' ? info.description : info.url;
		};

		prepareBlock('pocket');
		setBlockClass('pocket', options.misc.pocketMode, options.pocket.auth === false ? 'logout' : '');
		setDomainStyle.rewrite(info.domains);
		i18n.pocket           = info.i18n;
		status.timeStamp.mode = info.timeStamp;

		messageHandler.pocket = {
			newItems     : info =>  {
				insertItems(info, 'first');
			},
			newFolder    : info => {
				insertFolders('pocket', [info]);
			},
			updated      : info => {
				const pocket = getById('pocket', info.id);
				if (pocket !== false)
					updateItem(pocket, info);
			},
			deleted      : info => {
				const pocket = getById('pocket', info);
				if (pocket !== false)
					removeById('pocket', info);
			},
			domainCount  : info => {
				const folder = getFolderById('pocket', info.id);
				if (folder === false) return;
				if (info.view === 'hidden') {
					folder.classList.remove('domain-view');
					folder.classList.add('hidden-view');
				}
				else {
					folder.classList.add('domain-view');
					folder.classList.remove('hidden-view');
				}
			},
			folderRemoved: info => {
				const folder = getFolderById('pocket', info);
				if (folder !== false)
					removeFolderById('pocket', info);
			},
			view         : info => {
				setBlockClass('pocket', info.view);
				setView('pocket', info.view, info.items, info.folders);
			},
			logout       : info => {
				block.classList[info.method]('logout');
				if (info.method === 'add') {
					rootFolder.removeChild(rootFolder.lastChild);
					rootFolder.appendChild(dce('div'));
					clearData('pocket');
				}
				else {
					i18n.pocket.usernameText             = info.username;
					i18n.pocket.username                 = info.username;
					controls.user.firstChild.textContent = info.username;
					controls.user.firstChild.title       = info.username;
				}
			},
			fav          : info => {
				const pocket = getById('pocket', info);
				if (pocket !== false)
					pocket.classList.add('favorite');
			},
			unfav        : info => {
				const pocket = getById('pocket', info);
				if (pocket !== false)
					pocket.classList.remove('favorite');
			},
			archive      : info => {
				const pocket = getById('pocket', info);
				if (pocket === false) return;
				pocket.classList.add('type-archives');
				if (options.misc.pocketMode === 'type') {
					const archive = getFolderById('pocket', 'archives');
					if (archive !== false)
						archive.lastChild.appendChild(pocket);
				}
			},
			unarchive   : info => {
				const pocket = getById('pocket', info.id);
				if (pocket === false) return;
				pocket.classList.remove('type-archives');
				if (options.misc.pocketMode === 'type') {
					const folder = getFolderById('pocket', info.pid);
					if (folder !== false)
						folder.lastChild.appendChild(pocket);
				}
				else if (options.misc.pocketMode === 'domain') {
					const folder = getFolderById('pocket', info.domain);
					if (folder !== false)
						folder.lastChild.appendChild(pocket);
				}
			},
			update      : info => {
				block.classList[info]('updated');
			},
			moved       : info => {
				if (status.moving === true)
					doc.addEventListener('mouseup', finishMoving, {'once': true});
				else
					moveFolder('pocket', info);
			}
		};

		onClick               = event => {
			if (event.target.classList.contains('item'))
				openLink(event);
		};

		insertItems           = (items, position = 'last') => {
			let pid    = 0;
			let folder = rootFolder;
			const insert = {
				last  : pocket => {
					folder.lastChild.appendChild(pocket);
				},
				first : pocket => {
					if (folder.lastChild.hasChildNodes())
						folder.lastChild.insertBefore(pocket, folder.lastChild.firstChild);
					else
						folder.lastChild.appendChild(pocket);
				}
			};
			for (let i = 0, l = items.length; i < l; i++) {
				if (items[i].status > 0 && options.misc.pocketMode !== 'type')
					continue;
				const pocket = createById('pocket', items[i].id);
				updateItem(pocket, items[i]);
				if (options.misc.pocketMode !== 'plain') {
					if (items[i][options.misc.pocketMode] !== pid) {
						pid    = items[i][options.misc.pocketMode];
						folder = getFolderById('pocket', items[i][options.misc.pocketMode]);
					}
				}
				insert[position](pocket);
			}
		};

		i18n.pocket.usernameText = info.username;
		i18n.pocket.username     = info.username;
		makeButton('username', 'pocket', 'user');
		makeButton('login', 'pocket', 'user');
		makeButton('logout', 'pocket', 'user');
		makeButton('new', 'pocket', 'button');
		makeButton('move', 'pocket', 'item');
		makeButton('fav', 'pocket', 'item');
		makeButton('unfav', 'pocket', 'item');
		makeButton('archive', 'pocket', 'item');
		makeButton('folderArchive', 'pocket', 'item');
		makeButton('unarchive', 'pocket', 'item');
		makeButton('delete', 'pocket', 'item');
		makeButton('folderDelete', 'pocket', 'item');
		makeButton('new', 'pocket', 'bottom');
		makeButton('plain', 'pocket', 'bottom');
		makeButton('type', 'pocket', 'bottom');
		makeButton('domain', 'pocket', 'bottom');
		makeButton('reload', 'pocket', 'bottom');

		setView('pocket', options.misc.pocketMode, info.pocket, info.pocketFolders);
	}
};

function setWide(mode) {
	options.sidebar.wide = mode;
	if (mode) {
		doc.classList.add('wide');
		doc.classList.remove('narrow');
	}
	else {
		doc.classList.add('narrow');
		doc.classList.remove('wide');
	}
}

function setFixed(mode) {
	options.sidebar.fixed = mode;
	if (mode) {
		doc.classList.remove('unfixed');
		doc.classList.add('fixed');
	}
	else {
		doc.classList.remove('fixed');
		doc.classList.add('unfixed');
	}
}

function setFontSize(fontSize) {
	if (fontSize)
		options.theme.fontSize = fontSize;
	doc.style.fontSize   = `${options.theme.fontSize / window.devicePixelRatio}px`;
	doc.style.lineHeight = `${options.theme.fontSize / window.devicePixelRatio * 1.2}px`;
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

function onscroll(event) {
	if (status.searchActive === false) {
		status.scrolling = true;
		if (Math.abs(window.scrollY - options.scroll[options.sidebar.mode]) > 10)
			send('background', 'options', 'handler', {'section': 'scroll', 'option': options.sidebar.mode, 'value': window.scrollY});
	}
}

function setRssUnreaded(count) {
	if (count > 0)
		button.rss.lastChild.textContent = count;
	else
		button.rss.lastChild.textContent = '';
}

const setDownloadStatus = {
	progress : _ => {
		if (status.info.downloadStatus === 'progress') return;
		button.downloads.classList.add('updating');
		status.info.downloadStatus = 'progress';
	},
	idle : _ => {
		if (status.info.downloadStatus !== 'progress') return;
		button.downloads.classList.remove('updating');
		status.info.downloadStatus = 'idle';
	}
};

function setStyle(item) {
	const style       = createById('domains', item.id);
	style.textContent = `.domain-${item.id}{background-image: url(${item.fav})}`;
	document.head.appendChild(style);
}

const setImageStyle = {
	cover   : _ => {
		doc.style.backgroundSize     = 'cover';
		doc.style.backgroundRepeat   = 'no-repeat';
		doc.style.backgroundPosition = 'initial';
	},
	contain : _ => {
		doc.style.backgroundSize     = 'contain';
		doc.style.backgroundRepeat   = 'no-repeat';
		doc.style.backgroundPosition = 'center';
	},
	center  : _ => {
		doc.style.backgroundSize     = 'initial';
		doc.style.backgroundRepeat   = 'no-repeat';
		doc.style.backgroundPosition = 'center';
	},
	repeat  : _ => {
		doc.style.backgroundSize     = 'initial';
		doc.style.backgroundRepeat   = 'repeat';
		doc.style.backgroundPosition = 'initial';
	}
};

const setDomainStyle = {
	rewrite : items => {
		for (let i = data.domains.length - 1; i >= 0; i--)
			document.head.removeChild(data.domains[i]);
		data.domains   = [];
		data.domainsId = [];
		for (let i = items.length - 1; i >= 0; i--)
			setStyle(items[i]);
	},
	update  : items => {
		for (let i = items.length - 1; i >= 0; i--) {
			const style = getById('domains', items[i].id);
			if (style !== false)
				style.textContent = `.domain-${items[i].id}{background-image: url(${items[i].fav})}`;
			else
				setStyle(items[i]);
		}
	}
};

function setBlockClass(mode, view, extraClass = '') {
	if (view !== undefined)
		options.misc[`${mode}Mode`] = view;
	block.classList = `hidden ${mode} ${view !== undefined ? options.misc[`${mode}Mode`] : ''} ${extraClass}`;
	setTimeout(_ => {block.classList.remove('hidden');}, 100);
}

function setView(mode, view, items, folders) {
	if (rootFolder.lastChild.hasChildNodes()) {
		rootFolder.removeChild(rootFolder.lastChild);
		rootFolder.appendChild(dce('div'));
	}
	clearData(mode);
	if (view !== 'plain')
		insertFolders(mode, folders, view === 'tree');
	insertItems(items, 'first');
}

function insertFolders(mode, items, fake = false) {
	let folders = [];
	for (let i = 0, l = items.length; i < l; i++) {
		if (getFolderById(mode, items[i].id) !== false)
			continue;
		const index = data[`${mode}Folders`].push(dce('ul')) - 1;
		data[`${mode}FoldersId`].push(items[i].id);
		folders.push({'index': index, 'pid': items[i].pid});
		let classList = 'folder';
		classList += ` ${items[i].view}-view`;
		classList += items[i].folded === true ? ' folded' : '';
		data[`${mode}Folders`][index].classList  = classList;
		data[`${mode}Folders`][index].id         = `${mode}-folder-${items[i].id}`;
		data[`${mode}Folders`][index].dataset.id = items[i].id;
		if (fake === false) {
			const title       = dce('div');
			const text        = document.createTextNode(items[i].title || String.fromCharCode(0x00a0));
			title.title       = items[i].description || items[i].title;
			title.dataset.id  = items[i].id;
			title.classList.add('folder-name', `domain-${items[i].domain}`, items[i].status);
			title.appendChild(text);
			data[`${mode}Folders`][index].appendChild(title);
		}
		const content = dce('div');
		content.classList.add('folder-content');
		data[`${mode}Folders`][index].appendChild(content);
	}
	for (let i = 0, l = folders.length; i < l; i++) {
		if (folders[i].pid === 0)
			rootFolder.lastChild.appendChild(data[`${mode}Folders`][folders[i].index]);
		else {
			const parentFolder = getFolderById(mode, folders[i].pid);
			if (parentFolder !== false)
				parentFolder.lastChild.appendChild(data[`${mode}Folders`][folders[i].index]);
			else
				rootFolder.lastChild.appendChild(data[`${mode}Folders`][folders[i].index]);
		}
	}
}

function createById(mode, id, search = false) {
	let item        = getById(mode, id);
	if (item !== false)
		return item;
	item            = dce(element[mode]);
	item.id         = (search === true) ? `search-${mode}-${id}` : `${mode}-${id}`;
	item.dataset.id = id;
	data[mode].push(item);
	data[`${mode}Id`].push(id);
	return item;
}

function getById(mode, id) {
	const index = data[`${mode}Id`].indexOf(id);
	return index !== -1 ? data[mode][index] : false;
}

function removeById(mode, id) {
	const index = data[`${mode}Id`].indexOf(id);
	if (index === -1) return;
	data[mode][index].parentNode.removeChild(data[mode][index]);
	data[mode].splice(index, 1);
	data[`${mode}Id`].splice(index, 1);
}

function getFolderById(mode, id) {
	if (id === 0)
		return rootFolder;
	const index = data[`${mode}FoldersId`].indexOf(id);
	if (index !== -1)
		return data[`${mode}Folders`][index];
	else
		return false;
}

function removeFolderById(mode, id) {
	const index = data[`${mode}FoldersId`].indexOf(id);
	if (index === -1) return;
	data[`${mode}Folders`][index].parentNode.removeChild(data[`${mode}Folders`][index]);
	data[`${mode}Folders`].splice(index, 1);
	data[`${mode}FoldersId`].splice(index, 1);
}

function clearData(mode) {
	data[mode]               = [];
	data[`${mode}Id`]        = [];
	data[`${mode}Folders`]   = [];
	data[`${mode}FoldersId`] = [];
}

function send(target, subject, action, data = {}, callback = _ => {}) {
	brauzer.runtime.sendMessage({'target': target, 'subject': subject, 'action': action, 'data': data}, callback);
}

function openLink(event) {
	if (status.moving === true)
		return;
	if (event.target.id === status.lastClicked.id)
		if (Date.now() - status.lastClicked.time < 1000)
			return;
	if (event.ctrlKey)
		send('background', 'tabs', 'new', {'url': event.target.href});
	else if (event.shiftKey)
		send('background', 'tabs', 'new', {'url': event.target.href, 'newWindow': true});
	else
		send('background', 'tabs', 'update', {'url': event.target.href});
	status.lastClicked.id   = event.target.id;
	status.lastClicked.time = Date.now();
}

function finishMoving(event) {
	event.stopPropagation();
	event.preventDefault();
	setTimeout(_ => {status.moving = false;}, 500);
}

function moveItem(mode, eventTarget) {

	let lastPosition = -1;
	let movingUp     = false;

	const moveItemOverTree = event => {

		event.stopPropagation();
		event.preventDefault();
		const target = event.target;
		if (target.parentNode === item)
			return;
		movingUp   = event.screenY < lastPosition;
		lastPosition = event.screenY;
		if (target.classList.contains('item')) {
			if (movingUp)
				target.parentNode.insertBefore(item, target);
			else if (target.nextElementSibling !== null)
				target.parentNode.insertBefore(item, target.nextElementSibling);
			else
				target.parentNode.appendChild(item);
		}
		else if (target.classList.contains('folder-name')) {
			target.nextElementSibling.appendChild(item);
			if (target.parentNode.classList.contains('folded'))
				target.click();
		}
		else if (target.classList.contains('folder'))
			target.lastChild.appendChild(item);
	};

	const moveItemOverFolder = event => {
		event.preventDefault();
		let target = event.target;
		if (isFolder || options.misc.tabsMode === 'tree') {
			if (target.classList.contains('item'))
				target = target.parentNode.parentNode;
			else if (target.classList.contains('folder-name'))
				target = target.parentNode;
			else return;
		}
		else if (!target.classList.contains('item'))
			return;
		if (target.parentNode !== folder)
			return;
		movingUp   = event.screenY < lastPosition;
		lastPosition = event.screenY;
		if (movingUp)
			target.parentNode.insertBefore(item, target);
		else if (target.nextElementSibling !== null)
			target.parentNode.insertBefore(item, target.nextElementSibling);
		else
			target.parentNode.appendChild(item);
	};

	const keydown = event => {
		if (event.key === 'Escape') {
			finilize();
			status.moving = false;
			if (folder !== item.parentNode)
				folder.insertBefore(item, folder.children[oldIndex]);
			else if (oldIndex >= folder.children.length - 1)
				folder.appendChild(item);
			else {
				let newIndex  = -1;
				for (let i = 0, l = folder.children.length; i < l; i++)
					if (folder.children[i] === item) {
						newIndex = i;
						break;
					}
				const k = newIndex < oldIndex ? 1 : 0;
				folder.insertBefore(item, folder.children[oldIndex + k]);
			}
		}
	};

	const getIndex = event => {
		event.stopPropagation();
		event.preventDefault();
		let newIndex  = 0;
		for (let i = 0, l = item.parentNode.children.length; i < l; i++)
			if (item.parentNode.children[i] === item) {
				newIndex = i;
				break;
			}
		finilize();
		if (newIndex !== oldIndex)
			send('background', mode, 'move', {'id': id, 'pid': item.parentNode.previousElementSibling.dataset.id, 'oldIndex': oldIndex, 'newIndex': newIndex, 'isFolder': isFolder});
		else
			status.moving = false;
	};

	const getSiblings = event => {
		event.stopPropagation();
		event.preventDefault();
		const prevElementId = item.previousElementSibling !== null ? item.previousElementSibling.dataset.id : false;
		send('background', mode, 'move', {'id': id, 'pid': item.parentNode.previousElementSibling.dataset.id, 'prevElementId': prevElementId, 'isFolder': isFolder});
		finilize();
	};

	const finilize = _ => {
		doc.removeEventListener('keydown', keydown);
		block.removeEventListener('mouseover', moveItemOverTree);
		block.removeEventListener('mouseover', moveItemOverFolder);
		doc.removeEventListener('mousedown', getIndex);
		doc.removeEventListener('mousedown', getSiblings);
		item.classList.remove('moved');
		rootFolder.classList.remove('moving');
	};

	const setListeners = {
		tabs      : _ => {
			const modes = {
				plain  : _ => {
					block.addEventListener('mouseover', moveItemOverFolder);
					doc.addEventListener('mousedown', getIndex);
				},
				domain : _ => {
					block.addEventListener('mouseover', moveItemOverFolder);
					if (isFolder)
						doc.addEventListener('mousedown', getIndex);
					else
						doc.addEventListener('mousedown', getSiblings);
				},
				tree   : _ => {
					block.addEventListener('mouseover', moveItemOverFolder);
					doc.addEventListener('mousedown', getSiblings);
				}
			};
			modes[options.misc.tabsMode]();
		},
		bookmarks : _ => {
			block.addEventListener('mouseover', moveItemOverTree);
			doc.addEventListener('mousedown', getIndex);
		},
		rss : _ => {
			block.addEventListener('mouseover', moveItemOverFolder);
			doc.addEventListener('mousedown', getIndex);
		},
		pocket : _ => {
			block.addEventListener('mouseover', moveItemOverFolder);
			doc.addEventListener('mousedown', getIndex);
		}
	};

	let item = eventTarget;
	if (eventTarget.classList.contains('item')) {
		if (options.sidebar.mode === 'tabs') {
			if (eventTarget.parentNode.parentNode.classList.contains('hidden-view'))
				item = eventTarget.parentNode.parentNode;
			else if (eventTarget.parentNode.parentNode.classList.contains('tree-view'))
				item = eventTarget.parentNode.parentNode;
		}
	}
	else if (eventTarget.classList.contains('folder-name'))
		item = eventTarget.parentNode;
	const isFolder = item.classList.contains('folder') && (options.sidebar.mode !== 'tabs' || options.misc.tabsMode !== 'tree');
	const id       = item.dataset.id;
	const folder   = item.parentNode;
	let   oldIndex = -1;
	status.moving  = true;
	for (let i = 0, l = folder.children.length; i < l; i++)
		if (folder.children[i] === item) {
			oldIndex = i;
			break;
		}
	rootFolder.classList.add('moving');
	item.classList.add('moved');

	doc.addEventListener('keydown', keydown);
	setListeners[mode]();
}

function moveFolder(mode, info) {
	const folder = getFolderById(mode, info.id);
	if (folder === false) return;
	if (info.newIndex < info.oldIndex)
		folder.parentNode.insertBefore(folder, folder.parentNode.children[info.newIndex]);
	else
		folder.parentNode.insertBefore(folder, folder.parentNode.children[info.newIndex + 1]);
}

function searchActive(isIt) {
	if (isIt === true) {
		block.classList.add('search-active');
		status.searchActive = true;
	}
	else {
		block.classList.remove('search-active');
		status.searchActive = false;
		window.scrollTo(0, options.scroll[options.sidebar.mode]);
	}
}

function makeButton(type, mode, sub, hidden = false) {
	const button     = dce('span');
	button.id        = `${mode}-${type}`;
	button.title     = i18n[mode][type];
	if (i18n[mode].hasOwnProperty(`${type}Text`)) {
		button.classList   = `text-button ${hidden === true ? ' hidden' : ''}`;
		button.textContent = i18n[mode][`${type}Text`];
	}
	else {
		button.classList = `button ${hidden === true ? ' hidden' : ''}`;
		const icon       = dce('span');
		icon.style.setProperty(mask, `url('icons/${type}.svg')`);
		button.appendChild(icon);
	}
	controls[sub].appendChild(button);
	button.addEventListener('click', event => {
		event.stopPropagation();
		event.preventDefault();
		buttonsEvents[mode][type]();
	});
	return button;
}

function makeSearch(mode) {
	status.lastSearch   = '';
	const search        = dce('input');
	search.id           = 'search';
	search.classList.add('search');
	search.type         = 'text';
	search.placeholder  = i18n[mode].searchPlaceholder;
	controls.bottom.appendChild(search);
	const searchIcon    = dce('span');
	searchIcon.classList.add('search-icon');
	controls.bottom.appendChild(searchIcon);

	search.addEventListener('keyup', event => {
		const value = search.value;
		if (value.length > 1) {
			if (status.lastSearch !== value) {
				status.lastSearch = value;
				send('background', mode, 'search', {'request': value, needResponse: true}, response => {
					while (searchResults.lastChild.firstChild)
						searchResults.lastChild.removeChild(searchResults.lastChild.firstChild);
					insertItems(response, 'search');
					searchActive(true);
				});
			}
		}
		else
			searchActive(false);
	}, {'passive': true});
}

const buttonsEvents = {
	header    : {
		tabs : event => {
			if (options.sidebar.mode !== 'tabs')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'tabs'});
		},
		bookmarks : event => {
			if (options.sidebar.mode !== 'bookmarks')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'bookmarks'});
		},
		history : event => {
			if (options.sidebar.mode !== 'history')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'history'});
		},
		downloads : event => {
			if (options.sidebar.mode !== 'downloads')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'downloads'});
		},
		rss : event => {
			if (options.sidebar.mode !== 'rss')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'rss'});
		},
		pocket : event => {
			if (options.sidebar.mode !== 'pocket')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'pocket'});
		},
		pin: event => {
			send('background', 'options', 'handler', {'section': status.side, 'option': 'fixed', 'value': true});
		},
		unpin: event => {
			send('background', 'options', 'handler', {'section': status.side, 'option': 'fixed', 'value': false});
		},
		wide: event => {
			send('background', 'options', 'handler', {'section': status.side, 'option': 'wide', 'value': false});
		},
		narrow: event => {
			send('background', 'options', 'handler', {'section': status.side, 'option': 'wide', 'value': true});
		}
	},
	tabs      : {
		fav: event => {
			send('background', 'dialog', 'bookmarkTab', {'id': parseInt(controls.item.parentNode.dataset.id)});
		},
		move: event => {
			moveItem('tabs', controls.tabs.item.parentNode);
		},
		reload: event => {
			send('background', 'tabs', 'reload', {'id': parseInt(controls.item.parentNode.dataset.id)});
		},
		pin: event => {
			send('background', 'tabs', 'pin', {'id': parseInt(controls.item.parentNode.dataset.id)});
		},
		unpin: event => {
			send('background', 'tabs', 'unpin', {'id': parseInt(controls.item.parentNode.dataset.id)});
		},
		close: event => {
			send('background', 'tabs', 'removeById', {'idList': [parseInt(controls.item.parentNode.dataset.id)]});
		},
		closeAll: event => {
			if (options.warnings.domainFolderClose === true)
				send('background', 'dialog', 'domainFolderClose', {'id': controls.item.parentNode.dataset.id});
			else
				send('background', 'tabs', 'domainFolderClose', {'id': controls.item.parentNode.dataset.id});
		},
		new: event => {
			send('background', 'tabs', 'new', {'url': ''});
		},
		plain: event => {
			if (options.misc.tabsMode !== 'plain')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'tabsMode', 'value': 'plain'});
		},
		domain: event => {
			if (options.misc.tabsMode !== 'domain')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'tabsMode', 'value': 'domain'});
		},
		tree: event => {
			if (options.misc.tabsMode !== 'tree')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'tabsMode', 'value': 'tree'});
		}
	},
	bookmarks : {
		move : event => {
			moveItem('bookmarks', controls.item.parentNode);
		},
		delete : event => {
			const target = controls.item.parentNode;
			if (options.warnings.bookmarkDelete === true)
				send('background', 'dialog', 'bookmarkDelete', {'id': target.dataset.id, 'title': target.textContent});
			else
				send('background', 'bookmarks', 'bookmarkDelete', {'id': target.dataset.id});
		},
		folderDelete : event => {
			const target = controls.item.parentNode;
			if (options.warnings.bookmarkFolderDelete)
				send('background', 'dialog', 'bookmarkFolderDelete', {'id': target.dataset.id, 'title': target.textContent});
			else
				send('background', 'bookmarks', 'bookmarkFolderDelete', {'id': target.dataset.id});
		},
		new : event => {
			send('background', 'dialog', 'bookmarkNew', '');
		},
		folderNew : event => {
			send('background', 'dialog', 'bookmarkFolderNew', '');
		},
		edit : event => {
			const target = controls.item.parentNode;
			if (target.nodeName === 'DIV')
				send('background', 'dialog', 'bookmarkFolderEdit', {'id': target.dataset.id});
			else
				send('background', 'dialog', 'bookmarkEdit', {'id': target.dataset.id});
		}
	},
	history   : {
		getMore : event => {
			send('background', 'history', 'getMore', '');
		}
	},
	downloads : {
		pause: event => {
			send('background', 'downloads', 'pause', {'id': parseInt(controls.item.parentNode.dataset.id)});
		},
		resume: event => {
			send('background', 'downloads', 'resume', {'id': parseInt(controls.item.parentNode.dataset.id)});
		},
		reload: event => {
			send('background', 'downloads', 'reload', {'id': parseInt(controls.item.parentNode.dataset.id)});
		},
		cancel: event => {
			send('background', 'downloads', 'cancel', {'id': parseInt(controls.item.parentNode.dataset.id), 'url': controls.downloads.item.parentNode.title});
		},
		delete: event => {
			send('background', 'dialog', 'downloadDelete', {'id': parseInt(controls.item.parentNode.dataset.id), 'title': controls.item.parentNode.firstChild.textContent});
		}
	},
	rss       : {
		new : event => {
			send('background', 'dialog', 'rssNew');
		},
		importExport: event => {
			send('background', 'dialog', 'rssImportExport');
		},
		hideReadedAll: event => {
			send('background', 'options', 'handler', {'section': 'misc', 'option': 'rssHideReaded', 'value': true});
		},
		showReadedAll: event => {
			send('background', 'options', 'handler', {'section': 'misc', 'option': 'rssHideReaded', 'value': false});
		},
		options: event => {
			const folderTitle = controls.item.parentNode;
			send('background', 'dialog', 'rssFeedEdit', {'id': folderTitle.dataset.id, 'title': folderTitle.textContent.trim(), 'description': folderTitle.title});
		},
		move: event => {
			moveItem('rss', controls.item.parentNode);
		},
		reload: event => {
			const id = controls.item.parentNode.dataset.id;
			send('background', 'rss', 'updateFeed', {'id': id});
		},
		reloadAll: event => {
			send('background', 'rss', 'updateAll');
		},
		markReaded: event => {
			send('background', 'rss', 'rssReaded', {'id': controls.item.parentNode.dataset.id});
		},
		markReadedAll: event => {
			send('background', 'rss', 'rssReadedAll', {'id': controls.item.parentNode.dataset.id});
		},
		markReadedAllFeeds: event => {
			send('background', 'rss', 'rssReadedAllFeeds');
		},
		hideReaded: event => {
			send('background', 'rss', 'rssHideReaded', {'id': controls.item.parentNode.dataset.id});
		},
		showReaded: event => {
			send('background', 'rss', 'rssShowReaded', {'id': controls.item.parentNode.dataset.id});
		},
		delete: event => {
			send('background', 'dialog', 'rssItemDelete', {'id': controls.item.parentNode.dataset.id, 'title': controls.item.parentNode.textContent});
		},
		plain: event => {
			if (options.misc.rssMode !== 'plain')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'rssMode', 'value': 'plain'});
		},
		domain: event => {
			if (options.misc.rssMode !== 'domain')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'rssMode', 'value': 'domain'});
		}
	},
	pocket    : {
		login : event => {
			send('background', 'pocket', 'login');
		},
		logout : event => {
			send('background', 'pocket', 'logout');
		},
		username : event => {
			send('background', 'tabs', 'new', {'url': 'https://getpocket.com/a/queue/'});
		},
		new : event => {
			send('background', 'dialog', 'pocketNew');
		},
		plain : event => {
			send('background', 'options', 'handler', {'section': 'misc', 'option': 'pocketMode', 'value': 'plain'});
		},
		type : event => {
			send('background', 'options', 'handler', {'section': 'misc', 'option': 'pocketMode', 'value': 'type'});
		},
		domain : event => {
			send('background', 'options', 'handler', {'section': 'misc', 'option': 'pocketMode', 'value': 'domain'});
		},
		reload : event => {
			send('background', 'pocket', 'reloadAll');
		},
		move: event => {
			moveItem('pocket', controls.item.parentNode);
		},
		fav : event => {
			send('background', 'pocket', 'fav', controls.item.parentNode.dataset.id);
		},
		unfav : event => {
			send('background', 'pocket', 'unfav', controls.item.parentNode.dataset.id);
		},
		archive : event => {
			send('background', 'pocket', 'archive', controls.item.parentNode.dataset.id);
		},
		folderArchive : event => {
			send('background', 'pocket', 'folderArchive', controls.item.parentNode.dataset.id);
		},
		unarchive : event => {
			send('background', 'pocket', 'unarchive', controls.item.parentNode.dataset.id);
		},
		delete : event => {
			if (options.warnings.pocketDelete === true)
				send('background', 'dialog', 'pocketDelete', controls.item.parentNode.dataset.id);
			else
				send('background', 'pocket', 'delete', controls.item.parentNode.dataset.id);
		},
		folderDelete : event => {
			if (options.warnings.pocketFolderDelete === true)
				send('background', 'dialog', 'pocketFolderDelete', controls.item.parentNode.dataset.id);
			else
				send('background', 'pocket', 'folderDelete', controls.item.parentNode.dataset.id);
		}
	}
};

function dce(element) {
	return document.createElement(element);
}

})();