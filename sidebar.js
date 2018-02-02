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
	item      : [],
	itemId    : [],
	folders   : [],
	foldersId : [],
	domains   : [],
	domainsId : []
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

document.title      = options.sidebar.method;
doc.classList.add(status.side);

const blockStyle    = dcea('link', document.head, [['type', 'text/css'], ['rel', 'stylesheet']]);
const tempContainer = dce('div');

const controls      = {};
controls.main       = dcea('nav', document.body, []);
controls.sidebar    = dcea('div', controls.main, [['classList', 'controls'], ['id', 'controls-sidebar']]);
controls.iframe     = null;

let block           = null;
let oldBlock        = null;
let rootFolder      = null;
let searchResults   = null;

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
			setFixed(info);
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
	tabs      : null,
	bookmarks : null,
	history   : null,
	downloads : null,
	rss       : null,
	pocket    : null
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
			if (firefox)
				if (status.side === 'rightBar') {
					doc.addEventListener('mouseleave', event => {
						if (event.x > doc.offsetWidth)
							send('background', 'sidebar', 'sideDetection', {'sender': 'content', 'action': 'leave', 'side': 'rightBar'});
					});
					doc.addEventListener('mouseover', event => {
						if (event.x > doc.offsetWidth)
							send('background', 'sidebar', 'sideDetection',{'sender': 'content', 'action': 'over', 'side': 'rightBar'});
					});
				}
				else {
					doc.addEventListener('mouseleave', event => {
						if (event.x < doc.offsetWidth)
							send('background', 'sidebar', 'sideDetection', {'sender': 'content', 'action': 'leave', 'side': 'leftBar'});
					});
					doc.addEventListener('mouseover', event => {
						if (event.x < doc.offsetWidth)
							send('background', 'sidebar', 'sideDetection',{'sender': 'content', 'action': 'over', 'side': 'leftBar'});
					});
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
			if (service === 'rss')
				dcea('div', button.rss, [['id', 'rss-unreaded']]);
		}
		else
			button[service].classList[response.options.services[service] === true ? 'remove' : 'add']('hidden');

	setRssUnreaded(status.info.rssUnreaded);
	setDownloadStatus[status.info.downloadStatus]();

	if (options.sidebar.method === 'iframe') {
		doc.classList.remove('fixed');
		window.onresize = _ => {setFontSize();};
		if (controls.iframe === null) {
			controls.iframe = dcea('div', controls.main, [['id', 'controls-iframe'], ['classList', 'controls']]);
			makeButton('pin', 'header', 'iframe');
			makeButton('unpin', 'header', 'iframe');
			makeButton('wide', 'header', 'iframe');
			makeButton('narrow', 'header', 'iframe');
		}
		setWide(options.sidebar.wide);
		setFixed(options.sidebar.fixed);
	}

	initBlock[options.sidebar.mode](response.data);

	brauzer.runtime.onMessage.addListener(onMessage);
}

function prepareBlock(mode) {

	oldBlock = block;
	block    = dcea('div', document.body, []);

	controls.user    = dcea('div', block, [['classList', 'controls'], ['id', 'controls-user']]);
	rootFolder       = dcea('div', block, [['id', 'root-folder']]);
	dcea('div', rootFolder, []).dataset.id = '0';
	dcea('div', rootFolder, []);

	searchResults    = dcea('div', block, [['id', 'search-results']]);
	dcea('div', searchResults, []).dataset.id = 'search-results';
	dcea('div', searchResults, []);

	controls.item    = dcea('div', block, [['classList', 'controls'], ['id', 'controls-item']]);
	controls.button  = dcea('div', block, [['classList', 'controls'], ['id', 'controls-button']]);
	controls.bottom  = dcea('div', block, [['classList', 'controls'], ['id', 'controls-bottom']]);

	clearData();

	clearTimeout(status.scrollTimer);
	window.removeEventListener('scroll', onscroll);
	status.scrollTimer = 0;
	status.scrolling   = false;
	blockStyle.href    = `sidebar-${mode}.css`;

	if (options.sidebar.mode !== mode) {
		messageHandler[options.sidebar.mode] = null;
		options.sidebar.mode                 = mode;
	}
	searchActive(false);

}

function finishBlock() {
	document.body.classList = options.sidebar.mode;
	if (oldBlock !== null)
		document.body.removeChild(oldBlock);

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

	setTimeout(setScroll, 100);
}

const initBlock = {

	tabs : info => {

		const moveTab       = info => {
			const tab = getById(info.id);
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
			setBlockClass(view);
			if (view !== 'tree')
				setView(view, tabs, folders);
			else {
				let fakeFolders = [];
				for (let i = 0, l = tabs.length; i < l; i++)
					fakeFolders.push(fakeFolder(tabs[i]));
				setView('tree', tabs, fakeFolders);
			}
		};

		prepareBlock('tabs');
		setBlockClass();
		setDomainStyle.rewrite(info.domains);
		i18n.tabs             = info.i18n;
		status.activeTabId    = info.activeTabId;
		status.timeStamp.mode = info.timeStamp;

		messageHandler.tabs   = {
			created    : info => {
				if (options.misc.tabsMode === 'tree')
					insertFolders([fakeFolder(info.tab)], true);
				insertItems([info.tab]);
			},
			active     : info => {
				status.activeTabId = info;
				if (status.activeTab !== false) {
					status.activeTab.classList.remove('active');
					if (options.misc.tabsMode === 'domain')
						status.activeTab.parentNode.parentNode.firstChild.classList.remove('active');
				}
				status.activeTab = getById(info);
				if (status.activeTab === false) return;
				status.activeTab.classList.add('active');
				if (options.misc.tabsMode === 'domain')
					status.activeTab.parentNode.parentNode.firstChild.classList.add('active');
			},
			title      : info => {
				const tab = getById(info.id);
				if (tab !== false)
					tab.textContent = info.title;
			},
			status     : info => {
				const tab = getById(info.id);
				if (tab !== false)
					tab.classList[info.loading]('loading');
			},
			urlChanged  : info => {
				if (options.misc.tabsMode !== 'tree')
					insertItems([info.tab]);
				else {
					const tab = getById(info.tab.id);
					if (tab !== false)
						tab.href = info.tab.url;
				}
			},
			folderChanged : info => {
				if (options.misc.tabsMode === 'domain') {
					const tab = getById(info.tab.id);
					if (tab !== false)
						insertFolders([info.folder]);
					insertItems([info.tab]);
				}
			},
			removed      : info => {
				const removing = {
					plain  : tab => {
						removeById(info.id);
					},
					domain : tab => {
						const pid    = tab.parentNode.parentNode.firstChild.dataset.id;
						const folder = getFolderById(pid);
						removeById(info.id);
						if (folder === false) return;
						if (!folder.lastChild.hasChildNodes())
							removeFolderById(pid);
						else
							folder.firstChild.classList.remove('active');
					},
					tree   : tab => {
						const folder = tab.parentNode;
						for (let i = 0, l = folder.children.length; i < l; i++)
							if (folder.children[i].classList.contains('folder'))
								folder.parentNode.insertBefore(folder.children[i], folder);
						folder.parentNode.removeChild(folder);
						removeById(info.id);
					}
				};
				const tab = getById(info.id);
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
				const tab = getById(info.id);
				if (tab !== false)
					tab.classList.add('pinned');
			},
			unpinned       : info => {
				const tab = getById(info.id);
				if (tab !== false)
					tab.classList.remove('pinned');
			},
			newFolder    : info => {
				if (options.misc.tabsMode === 'domain')
					insertFolders([info]);
			},
			domainCount  : info => {
				const folder = getFolderById(info.id);
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
				const folder = getFolderById(info);
				if (folder !== false)
					removeFolderById(info);
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
						folder = getFolderById(pid);
					}
					if (folder === false) return;
					folder.lastChild.appendChild(tab);
					if (status.activeTab === tab)
						folder.firstChild.classList.add('active');
				},
				tree  : i => {
					folder = getFolderById(tabs[i].id);
					if (folder.lastChild.hasChildNodes())
						folder.lastChild.insertBefore(tab, folder.lastChild.firstChild);
					else
						folder.lastChild.appendChild(tab);
				}
			};

			for (let i = 0, l = tabs.length; i < l; i++) {
				tab = getById(tabs[i].id);
				if (tab === false)
					tab = createById(tabs[i].id);
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
		finishBlock();
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
			const bookmark = getById(id);
			if (info.hasOwnProperty('url'))
				bookmark.title = info.url;
			if (info.hasOwnProperty('title'))
				bookmark.textContent = info.title;
		};

		prepareBlock('bookmarks');
		setBlockClass();
		setDomainStyle.rewrite(info.domains);
		i18n.bookmarks           = info.i18n;
		status.timeStamp.mode    = info.timeStamp;

		messageHandler.bookmarks = {
			removed         : info => {
				removeById(info.id);
			},
			folderRemoved   : info => {
				removeFolderById(info.id);
			},
			changedBookmark : info => {
				changeBook(info.id, info.info);
			},
			changedFolder   : info => {
				const folde = getFolderById(info.id);
				if (folder !== false)
					folder.firstChild.textContent = info.title;
			},
			createdBookmark : info => {
				insertItems([info.item]);
			},
			createdFolder   : info => {
				insertFolders([info.item]);
			},
			moved           : info => {
				if (status.moving === true)
					doc.addEventListener('mouseup', finishMoving, {'once': true});
				else if (info.isFolder === false)
					moveBook(getById(info.id) , getFolderById(info.pid), info.newIndex);
				else if (info.isFolder === true)
					moveBook(getFolderById(info.id) , getFolderById(info.pid), info.newIndex);
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
								folder = getFolderById(pid);
								if (folder === false)
									folder = rootFolder;
								count  = folder.lastChild.children.length - 1;
							}
							count++;
						} :
						item => {};

			for (let i = 0, l = items.length; i < l; i++) {
				checkPid(items[i]);
				const bookmark       = createById(items[i].id, true);
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
			insertFolders(info.bookmarksFolders);
		insertItems(info.bookmarks, 'last');
		finishBlock();
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
				let hist = getById(items[i].id);
				if (hist === false)
					hist = createById(items[i].id);
				if (items[i].pid !== pid) {
					pid    = items[i].pid;
					folder = getFolderById(pid);
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
				removeById(ids[i]);
		};

		const historyTotalWipe   = _ => {
			for (let i = data.historyId.length - 1; i >= 0; i--)
				removeById(data.historyId[i]);
			getMoreButton.classList.add('hidden');
		};

		prepareBlock('history');
		setBlockClass();
		setDomainStyle.rewrite(info.domains);
		i18n.history             = info.i18n;
		status.timeStamp.mode    = info.timeStamp;

		messageHandler.history   = {
			new     : info =>  {
				insertFolders([info.folder]);
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
				insertFolders(info.historyFolders);
				insertItems(info.history, 'last');
				if (info.historyEnd === true)
					getMoreButton.classList.add('hidden');
			},
			title   : info =>  {
				const item = getById(info.id);
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

		insertFolders(info.historyFolders);
		insertItems(info.history, 'last');
		if (info.historyEnd === true)
			getMoreButton.classList.add('hidden');
		finishBlock();
	},

	downloads : info => {

		const insertDownload = item => {
			const down           = createById(item.id);
			down.title           = item.url;
			const filename       = dcea('p', down, [['textContent', item.filename]]);
			let classList        = `download item ${item.state}`;
			classList            += item.exists === true ? '' : ' deleted';
			if (item.paused === true)
				classList += item.canResume === true ? ' paused' : ' canceled';
			down.classList       = classList;
			const status         = dcea('div', down, [['title', ''], ['classList', 'status']]);
			const progress       = dcea('div', status, [['classList', 'progress-bar']]);
			dcea('span', progress, []).style.width = item.progressPercent;
			dcea('div', status, [['classList', 'recived'], ['textContent', item.progressNumbers]]);
			dcea('div', status, [['classList', 'file-size'], ['textContent', item.fileSize]]);
			rootFolder.lastChild.insertBefore(down, rootFolder.lastChild.lastChild);
		};

		prepareBlock('downloads');
		setBlockClass();
		setDomainStyle.rewrite(info.domains);
		i18n.downloads           = info.i18n;
		status.timeStamp.mode    = info.timeStamp;

		messageHandler.downloads = {
			created    : info => {
				insertDownload(info.item);
			},
			erased     : info => {
				removeById(info.id);
			},
			exists     : info => {
				const download = getById(info.id);
				if (download === false) return;
				download.classList[info.method]('deleted');
			},
			startPause : info => {
				const download = getById(info.id);
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
				const download = getById(info.id);
				if (download === false) return;
				download.classList.remove('complete', 'interrupted', 'in_progress');
				download.classList.add(info.state);
			},
			progress  : info => {
				const download = getById(info.item.id);
				if (download === false) return;
				download.firstChild.nextElementSibling.firstChild.firstChild.style.width = info.item.progressPercent;
				download.firstChild.nextElementSibling.firstChild.nextElementSibling.textContent = `${info.item.progressNumbers}  |  ${info.item.speed}`;
				download.firstChild.nextElementSibling.firstChild.nextElementSibling.nextElementSibling.textContent = info.item.fileSize;
			},
			filename  : info => {
				const download = getById(info.id);
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
		finishBlock();
	},

	rss : info => {

		const setReadedMode = (readedMode, rssMode) => {
			if (rssMode !== undefined)
				options.misc.rssMode = rssMode;
			options.misc.rssHideReaded = readedMode;
			setBlockClass(options.misc.rssMode, readedMode === true ? 'hide-readed' : 'show-readed');
		};

		prepareBlock('rss');
		setReadedMode(options.misc.rssHideReaded);
		setDomainStyle.rewrite(info.domains);
		i18n.rss              = info.i18n;
		status.timeStamp.mode = info.timeStamp;

		messageHandler.rss    = {
			createdFeed      : info =>  {
				insertFolders([info.feed]);
			},
			newItems         : info =>  {
				if (options.misc.rssMode === 'plain')
					insertItems(info.items, 'date');
				else
					insertItems(info.items, 'first');
			},
			rssReaded        : info =>  {
				const rssItem = getById(info.id);
				if (rssItem === false) return;
				rssItem.classList.remove('unreaded');
				if (info.feedReaded === true)
					rssItem.parentNode.classList.remove('unreaded');
			},
			rssReadedAll     : info =>  {
				const feed = getFolderById(info.id);
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
				setView(info.view, info.items, info.folders);
			},
			rssHideReaded    : info =>  {
				const feed = getFolderById(info.id);
				if (feed !== false)
					feed.classList.add('hide-readed');
			},
			rssShowReaded    : info =>  {
				const feed = getFolderById(info.id);
				if (feed !== false)
					feed.classList.remove('hide-readed');
			},
			rssFeedChanged   : info =>  {
				const feed = getFolderById(info.id);
				if (feed === false) return;
				feed.firstChild.firstChild.textContent = info.title;
				feed.firstChild.title                  = info.description;
			},
			rssFeedDeleted   : info =>  {
				removeFolderById(info.id);
			},
			rssItemDeleted   : info => {
				removeById(info.id);
			},
			update           : info => {
				const feed = getFolderById(info.id);
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
					folder = getFolderById(pid);
				}
			};

			let pid = 0;
			let folder = rootFolder;
			for (let i = 0, l = items.length; i < l; i++) {
				const item         = createById(items[i].id);
				item.textContent   = items[i].title;
				item.dataset.link  = items[i].link;
				item.dataset.date  = items[i].date;
				item.href          = items[i].link;
				item.dataset.title = `${items[i].title}\n\n${items[i].description}`;
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
		setView(options.misc.rssMode, info.rss, info.rssFolders);
		finishBlock();
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
		setBlockClass(options.misc.pocketMode, options.pocket.auth === false ? 'logout' : '');
		setDomainStyle.rewrite(info.domains);
		i18n.pocket           = info.i18n;
		status.timeStamp.mode = info.timeStamp;

		messageHandler.pocket = {
			newItems     : info =>  {
				insertItems(info, 'first');
			},
			newFolder    : info => {
				insertFolders([info]);
			},
			updated      : info => {
				const pocket = getById(info.id);
				if (pocket !== false)
					updateItem(pocket, info);
			},
			deleted      : info => {
				const pocket = getById(info);
				if (pocket !== false)
					removeById(info);
			},
			domainCount  : info => {
				const folder = getFolderById(info.id);
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
				const folder = getFolderById(info);
				if (folder !== false)
					removeFolderById(info);
			},
			view         : info => {
				setBlockClass(info.view);
				setView(info.view, info.items, info.folders);
			},
			login        : info => {
				options.pocket.auth = true;
				block.classList.remove('logout');
				i18n.pocket.usernameText             = info.username;
				i18n.pocket.username                 = info.username;
				controls.user.firstChild.textContent = info.username;
				controls.user.firstChild.title       = info.username;
			},
			logout       : info => {
				options.pocket.auth = false;
				block.classList.add('logout');
				clearData('pocket');
			},
			fav          : info => {
				const pocket = getById(info);
				if (pocket !== false)
					pocket.classList.add('favorite');
			},
			unfav        : info => {
				const pocket = getById(info);
				if (pocket !== false)
					pocket.classList.remove('favorite');
			},
			archive      : info => {
				const pocket = getById(info);
				if (pocket === false) return;
				pocket.classList.add('type-archives');
				if (options.misc.pocketMode === 'type') {
					const archive = getFolderById('archives');
					if (archive !== false)
						archive.lastChild.appendChild(pocket);
				}
			},
			unarchive   : info => {
				const pocket = getById(info.id);
				if (pocket === false) return;
				pocket.classList.remove('type-archives');
				if (options.misc.pocketMode === 'type') {
					const folder = getFolderById(info.pid);
					if (folder !== false)
						folder.lastChild.appendChild(pocket);
				}
				else if (options.misc.pocketMode === 'domain') {
					const folder = getFolderById(info.domain);
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
				const pocket = createById(items[i].id);
				updateItem(pocket, items[i]);
				if (options.misc.pocketMode !== 'plain') {
					if (items[i][options.misc.pocketMode] !== pid) {
						pid    = items[i][options.misc.pocketMode];
						folder = getFolderById(items[i][options.misc.pocketMode]);
					}
				}
				if (folder !== false)
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

		setView(options.misc.pocketMode, info.pocket, info.pocketFolders);
		finishBlock();
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
	if (mode === true) {
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

function setScroll() {
	window.scrollTo(0, options.scroll[options.sidebar.mode]);
	window.addEventListener('scroll', onscroll, {'passive': true});
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
	dcea('style', document.head, [['id', item.id], ['textContent', `.domain-${item.id}{background-image: url(${item.fav})}`]]);
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
			const index = data.domainsId.indexOf(items[i].id);
			if (index !== -1)
				data.domains[index].textContent = `.domain-${items[i].id}{background-image: url(${items[i].fav})}`;
			else
				setStyle(items[i]);
		}
	}
};

function setBlockClass(view, extraClass = '') {
	if (view !== undefined)
		options.misc[`${options.sidebar.mode}Mode`] = view;
	block.classList = `hidden ${options.sidebar.mode} ${view !== undefined ? view : ''} ${extraClass}`;
	setTimeout(_ => {block.classList.remove('hidden');}, 100);
}

function setView(view, items, folders) {
	if (rootFolder.lastChild.hasChildNodes()) {
		rootFolder.removeChild(rootFolder.lastChild);
		rootFolder.appendChild(dce('div'));
	}
	clearData();
	if (view !== 'plain')
		insertFolders(folders, view === 'tree');
	insertItems(items, 'first');
}

function insertFolders(items, fake = false) {
	let folders = [];
	for (let i = 0, l = items.length; i < l; i++) {
		if (getFolderById(items[i].id) !== false)
			continue;
		const index = data.folders.push(dce('ul')) - 1;
		data.foldersId.push(items[i].id);
		folders.push({'index': index, 'pid': items[i].pid});
		let classList = 'folder';
		classList += ` ${items[i].view}-view`;
		classList += items[i].folded === true ? ' folded' : '';
		data.folders[index].classList  = classList;
		data.folders[index].id         = `${options.sidebar.mode}-folder-${items[i].id}`;
		data.folders[index].dataset.id = items[i].id;
		if (fake === false) {
			dcea('div', data.folders[index],
				[
					['title', items[i].description || items[i].title],
				 	['classList', `folder-name domain-${items[i].domain} ${items[i].status}`],
				 	['textContent', items[i].title || String.fromCharCode(0x00a0)]
				]
			).dataset.id = items[i].id;
		}
		dcea('div', data.folders[index], [['classList', 'folder-content']]);
	}
	for (let i = 0, l = folders.length; i < l; i++) {
		const parentFolder = getFolderById(folders[i].pid) || rootFolder;
		parentFolder.lastChild.appendChild(data.folders[folders[i].index]);
	}
}

function getFolderById(id) {
	if (id === 0)
		return rootFolder;
	const index = data.foldersId.indexOf(id);
	if (index !== -1)
		return data.folders[index];
	else
		return false;
}

function removeFolderById(id) {
	const index = data.foldersId.indexOf(id);
	if (index === -1) return;
	data.folders[index].parentNode.removeChild(data.folders[index]);
	data.folders.splice(index, 1);
	data.foldersId.splice(index, 1);
}

function createById(id, search = false) {
	let item        = getById(id);
	if (item !== false)
		return item;
	item            = dce(element[options.sidebar.mode]);
	item.id         = (search === true) ? `search-${options.sidebar.mode}-${id}` : `${options.sidebar.mode}-${id}`;
	item.dataset.id = id;
	data.item.push(item);
	data.itemId.push(id);
	return item;
}

function getById(id) {
	const index = data.itemId.indexOf(id);
	return index !== -1 ? data.item[index] : false;
}

function removeById(id) {
	const index = data.itemId.indexOf(id);
	if (index === -1) return;
	data.item[index].parentNode.removeChild(data.item[index]);
	data.item.splice(index, 1);
	data.itemId.splice(index, 1);
}

function clearData() {
	data.item      = [];
	data.itemId    = [];
	data.folders   = [];
	data.foldersId = [];
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
	const button     = dcea('span', controls[sub], [['id', `${mode}-${type}`], ['title', i18n[mode][type]]]);
	if (i18n[mode].hasOwnProperty(`${type}Text`)) {
		button.classList   = `text-button ${hidden === true ? ' hidden' : ''}`;
		button.textContent = i18n[mode][`${type}Text`];
	}
	else {
		button.classList = `button ${hidden === true ? ' hidden' : ''}`;
		dcea('span', button, []).style.setProperty(mask, `url('icons/${type}.svg')`);
	}
	button.addEventListener('click', event => {
		event.stopPropagation();
		event.preventDefault();
		buttonsEvents[mode][type]();
	});
	return button;
}

function makeSearch(mode) {
	status.lastSearch   = '';
	const search = dcea('input', controls.bottom, [['id', 'search'], ['classList', 'search'], ['type', 'text'], ['placeholder', i18n[mode].searchPlaceholder]]);
	dcea('span', search, [['classList', 'search-icon']]);

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
			moveItem('tabs', controls.item.parentNode);
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
			send('background', 'downloads', 'cancel', {'id': parseInt(controls.item.parentNode.dataset.id), 'url': controls.item.parentNode.title});
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

function dce(nodeName) {
	return document.createElement(nodeName);
}

function dcea(nodeName, parent, attrs) {
	const element = document.createElement(nodeName);
	for (let i = attrs.length - 1; i >= 0; i--)
		element[attrs[i][0]] = attrs[i][1];
	parent.appendChild(element);
	return element;
}


})();