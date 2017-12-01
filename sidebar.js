(function() {

'use strict';

const firefox          = (typeof InstallTrigger !== 'undefined') ? true : false;
const brauzer          = firefox ? browser : chrome;
const doc              = document.documentElement;
const mask             = window.CSS.supports('mask-image') ? 'mask-image' : '-webkit-mask-image';

const status           = {
	side              : window.location.hash.replace('#', '').split('-')[0],
	method            : window.location.hash.replace('#', '').split('-')[1],
	fixed             : false,
	wide              : false,
	width             : 0,
	mode              : '',
	init: {
		tabs         : false,
		bookmarks    : false,
		downloads    : false,
		history      : false,
		rss          : false
	},
	misc             : null,
	warnings         : null,
	bookmarkFolders  : [],
	historyInfo       : {
		lastDate : 0,
		lastNum  : 0
	},
	activeTab           : null,
	activeTabId         : 0,
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
	domains             : [],
	domainsId           : [],
	info                : {
		rssUnreaded    : 0,
		downloadStatus : ''
	},
	moving              : false
};

document.title         = status.method;
doc.classList.add(status.side);

if (status.method === 'native') {
	const port = brauzer.runtime.connect({name: 'sidebar-alive'});
	if (firefox) {
		doc.addEventListener('mouseleave', event => {
			send('background', 'sidebar', 'sideDetection', {'sender': 'sidebar', 'action': 'leave', 'side': (event.x < doc.offsetWidth) ? 'rightBar' : 'leftBar'});
		});
		doc.addEventListener('mouseover', event => {
			send('background', 'sidebar', 'sideDetection',{'sender': 'sidebar', 'action': 'over', 'side': (event.x < doc.offsetWidth) ? 'rightBar' : 'leftBar'});
		});
	}
}

const controls = {
	header: {
		main      : document.createElement('nav'),
		sidebar   : document.createElement('div'),
		iframe    : null
	},
	tabs      : {
		item     : null,
		bottom   : null
	},
	bookmarks : {
		item     : null,
		bottom   : null
	},
	history   : {
		bottom   : null
	},
	downloads : {
		item     : null
	},
	rss       : {
		item     : null,
		bottom   : null
	}
};

controls.header.main.id    = 'controls';
controls.header.sidebar.id = 'controls-block';
controls.header.main.appendChild(controls.header.sidebar);
document.body.appendChild(controls.header.main);

const button = {
	tabs        : null,
	bookmarks   : null,
	history     : null,
	downloads   : null,
	rss         : null
};

let rootFolder  = null;

const block = {
	tabs        : makeBlock('tabs'),
	bookmarks   : makeBlock('bookmarks'),
	history     : makeBlock('history'),
	downloads   : makeBlock('downloads'),
	rss         : makeBlock('rss')
};

const i18n = {
	controls    : null,
	tabs        : null,
	bookmarks   : null,
	history     : null,
	downloads   : null,
	rss         : null
};

send('background', 'request', 'mode', {'side': status.side, 'method': status.method, needResponse: true}, fullInit);

const messageHandler = {
	options  : {
		wide               : data => {
			setWide(data.value);
		},
		fixed              : data => {
			setFixed(data.value);
		},
		width              : data => {
			status.width = data.value;
		},
		mode               : data => {
			blockInit(data.value, data.data);
		},
		warnings           : data => {
			status.warnings[data.option] = data.value;
		},
		fontSize           : data => {
			setFontSize(data.value);
		},
		backgroundColor       : data => {
			setColor({'backgroundColor': data.value});
		},
		backgroundColorActive : data => {
			setColor({'backgroundColorActive': data.value});
		},
		fontColor          : data => {
			setColor({'fontColor': data.value});
		},
		fontColorActive    : data => {
			setColor({'fontColorActive': data.value});
		},
		fontColorInactive    : data => {
			setColor({'fontColorInactive': data.value});
		},
		borderColor        : data => {
			setColor({'borderColor': data.value});
		},
		borderColorActive  : data => {
			setColor({'borderColorActive': data.value});
		},
		sidebarImage       : data => {
			doc.style.backgroundImage = `url(${data.value})`;
		},
		rssHideReaded      : data => {
			setReadedMode(data.value);
		},
		services           : data => {
			if (data.enabled)
				enableBlock(data.service);
			else
				button[data.service].classList.add('hidden');
		}

	},
	set : {
		fold         : data => {
			if (data.mode !== status.mode) return;
			const folder = getFolderById(data.mode, data.id);
			if (folder)
				folder.classList[data.method]('folded');
		},
		reInit       : data => {
			fullInit(data);
		},
		hover       : data => {
			document.documentElement.classList[data]('hover');
		},
		side        : data => {
			if (status.method === 'native')
				status.side = data;
		}
	},
	info : {
		rssUnreaded    : data => {
			button.rss.lastChild.textContent = data.unreaded || ' ';
		},
		newDomain      : data => {
			setDomainStyle.update([data.domain]);
		},
		updateDomain   : data => {
			setDomainStyle.update(data);
		},
		downloadStatus : data => {
			setDownloadStatus[data]();
		}
	},
	tabs : {},
	bookmarks : {},
	history : {},
	downloads : {},
	rss : {}
};

const initBlock = {

	tabs : data => {

		status.activeTabId = data.activeTabId;

		messageHandler.tabs = {
			created    : data => {
				insertTabs([data.tab]);
			},
			active     : data => {
				status.activeTabId = data;
				if (status.activeTab)
					status.activeTab.classList.remove('active');
				status.activeTab = getById('tabs', data);
				if (status.activeTab)
					status.activeTab.classList.add('active');
			},
			title      : data => {
				const tab = getById('tabs', data.id);
				if (tab)
					tab.textContent = data.title;
			},
			status     : data => {
				const tab = getById('tabs', data.id);
				if (tab)
					tab.classList[data.loading]('loading');
			},
			urlChange   : data => {
				const tab = getById('tabs', data.tab.id);
				if (tab) {
					if (status.misc.tabsMode === 'domain')
						if (data.hasOwnProperty('folder'))
							insertFolders([data.folder], 'tabs');
				}
				insertTabs([data.tab]);
			},
			removed      : data => {
				const removing = {
					plain  : _ => {
						removeById('tabs', data.id);
					},
					domain : _ => {
						const folder = tab.parentNode;
						if (folder.children.length === 2)
							folder.parentNode.removeChild(folder);
						removeById('tabs', data.id);
					},
					tree   : _ => {
						const folder = tab.parentNode;
						for (let i = 0, l = folder.children.length; i < l; i++)
							if (folder.children[i].classList.contains('folder'))
								folder.parentNode.insertBefore(folder.children[i], folder);
						folder.parentNode.removeChild(folder);
						removeById('tabs', data.id);
					}
				};
				const tab = getById('tabs', data.id);
				if (tab)
					removing[status.misc.tabsMode]();
			},
			moved        : data => {
				moveTab(data);
			},
			unpin        : data => {
				getById('tabs', data.id).classList.remove('pinned');
			},
			newFolder    : data => {
				if (status.misc.tabsMode === 'domain')
					insertFolders([data], 'tabs');
			},
			domainCount  : data => {
				const folder = getFolderById('tabs', data.id);
				if (data.view === 'hidden') {
					folder.classList.remove('domain-view');
					folder.classList.add('hidden-view');
				}
				else {
					folder.classList.add('domain-view');
					folder.classList.remove('hidden-view');
				}
			},
			view         : data => {
				setTabsMode(data.view, data.items, data.folders);
			}
		};

		rootFolder                = document.createElement('div');
		rootFolder.id             = 'tabs-0';
		controls.tabs.item        = document.createElement('div');
		controls.tabs.item.classList.add('controls');
		makeButton('reload', 'tabs', 'item');
		makeButton('pin', 'tabs', 'item');
		makeButton('unpin', 'tabs', 'item');
		makeButton('close', 'tabs', 'item');
		makeButton('closeAll', 'tabs', 'item');
		controls.tabs.bottom      = document.createElement('div');
		controls.tabs.bottom.classList.add('bottom-bar');
		makeButton('new', 'tabs', 'bottom');
		makeButton('plain', 'tabs', 'bottom');
		makeButton('domain', 'tabs', 'bottom');
		makeButton('tree', 'tabs', 'bottom');

		block.tabs.appendChild(rootFolder);
		block.tabs.appendChild(makeItemButton('new', 'tabs'));
		block.tabs.appendChild(controls.tabs.item);
		block.tabs.appendChild(controls.tabs.bottom);

		block.tabs.addEventListener('click', event => {
			event.stopPropagation();
			event.preventDefault();
			const target = event.target;
			if (target.classList.contains('active'))
				return;
			else if (target.classList.contains('tab'))
				send('background', 'tabs', 'setActive', {'id': parseInt(target.dataset.id)});
		});

		block.tabs.addEventListener('mouseover', event => {
			event.stopPropagation();
			const target = event.target;
			if (target.classList.contains('tab'))
				target.appendChild(controls.tabs.item);
			else if (target.classList.contains('folder-name'))
				target.appendChild(controls.tabs.item);
		});

		const setTabsMode = (mode, tabs, tabsFolders) => {
			status.misc.tabsMode = mode;
			block.tabs.classList = `block ${status.misc.tabsMode}`;
			while (rootFolder.hasChildNodes())
				rootFolder.removeChild(rootFolder.firstChild);
			clearStatus('tabs');
			if (status.misc.tabsMode === 'domain')
				insertFolders(tabsFolders, 'tabs');
			insertTabs(tabs);
		};

		const insertTabs = tabs => {
			let pid         = 0;
			let tab         = null;
			let folder      = rootFolder;
			let treeFolders = [];

			const postProcess = {
				plain : _ => {
					folder.appendChild(tab);
				},
				domain : i => {
					if (pid !== tabs[i].pid) {
						pid    = tabs[i].pid;
						folder = getFolderById('tabs', pid);
					}
					if (folder)
						folder.appendChild(tab);
				},
				tree  : i => {
					treeFolders[i] = {
						id     : tabs[i].id,
						pid    : tabs[i].openerId,
						view   : 'hidden',
						domain : 'default',
						title  : '',
						folded : false
					};
				}
			};

			for (let i = 0, l = tabs.length; i < l; i++) {
				tab = getById('tabs', tabs[i].id);
				if (!tab)
					tab = createById('tabs', tabs[i].id);
				tab.textContent = tabs[i].title;
				tab.title       = tabs[i].url;
				tab.href        = tabs[i].url;
				let classList   = `tab item domain-${tabs[i].pid} ${tabs[i].status}`;
				if (tabs[i].id === status.activeTabId) {
					status.activeTab = tab;
					classList += ' active';
				}
				classList += tabs[i].pinned    ? ' pinned'    : '';
				classList += tabs[i].discarded ? ' discarded' : '';
				tab.classList = classList;
				postProcess[status.misc.tabsMode](i);
			}
			if (status.misc.tabsMode === 'tree') {
				insertFolders(treeFolders, 'tabs', true);
				for (let i = 0, l = tabs.length; i < l; i++) {
					const folder = getFolderById('tabs', tabs[i].id);
					if (folder)
						folder.insertBefore(getById('tabs', tabs[i].id), folder.firstChild);
					else
						rootFolder.appendChild(getById('tabs', tabs[i].id));
				}
			}
		};

		const moveTab = info => {
			const tab = getById('tabs', info.id);
			if (tab) {
				if (status.misc.tabsMode === 'plain')
					if (info.toIndex < info.fromIndex)
						rootFolder.insertBefore(tab, rootFolder.children[info.toIndex]);
					else
						rootFolder.insertBefore(tab, rootFolder.children[info.toIndex + 1]);
				if (info.hasOwnProperty('pinned'))
					tab.classList.add('pinned');
				else
					tab.classList.remove('pinned');
			}
		};

		setTabsMode(status.misc.tabsMode, data.tabs, data.tabsFolders);
	},

	bookmarks : data => {

		let lastSearch = '';

		messageHandler.bookmarks = {
			removed         : data => {
				removeById('bookmarks', data.id);
			},
			folderRemoved   : data => {
				removeFolderById('bookmarks', data.id);
			},
			changedBookmark : data => {
				changeBook(data.id, data.info);
			},
			changedFolder   : data => {
				getFolderById('bookmarks', data.id).firstChild.textContent = data.title;
			},
			createdBookmark : data => {
				insertBookmarks([data.item]);
			},
			createdFolder   : data => {
				insertFolders([data.item], 'bookmarks');
			},
			moved           : data => {
				const mouseup = event => {
					event.stopPropagation();
					event.preventDefault();
					doc.removeEventListener('mouseup', mouseup);
					setTimeout(_ => {status.moving = false;}, 500);
				};
				if (status.moving)
					doc.addEventListener('mouseup', mouseup);
				else
					addBook(getById('bookmarks', data.id) , getFolderById('bookmarks', data.pid), data.index);
			}
		};

		rootFolder                   = document.createElement('div');
		rootFolder.id                = 'bookmarks-0';
		const bookmarksSearchResults = document.createElement('div');
		bookmarksSearchResults.id    = 'bookmarks-search-results';
		bookmarksSearchResults.classList.add('search-results');
		controls.bookmarks.item      = document.createElement('div');
		controls.bookmarks.item.classList.add('controls');
		makeButton('edit', 'bookmarks', 'item');
		makeButton('move', 'bookmarks', 'item');
		makeButton('delete', 'bookmarks', 'item');
		makeButton('deleteFolder', 'bookmarks', 'item');
		controls.bookmarks.bottom    = document.createElement('div');
		controls.bookmarks.bottom.classList.add('bottom-bar');
		const bookmarksSearch        = document.createElement('input');
		bookmarksSearch.id           = 'bookmarks-search';
		bookmarksSearch.classList.add('search');
		bookmarksSearch.type         = 'text';
		bookmarksSearch.placeholder  = i18n.bookmarks.searchPlaceholder;
		controls.bookmarks.bottom.appendChild(bookmarksSearch);
		const searchIcon             = document.createElement('span');
		searchIcon.classList.add('search-icon');
		controls.bookmarks.bottom.appendChild(searchIcon);
		block.bookmarks.appendChild(rootFolder);
		block.bookmarks.appendChild(makeItemButton('bookmarkThis', 'bookmarks'));
		block.bookmarks.appendChild(bookmarksSearchResults);
		block.bookmarks.appendChild(controls.bookmarks.item);
		block.bookmarks.appendChild(controls.bookmarks.bottom);

		bookmarksSearch.addEventListener('keyup', event => {
			event.stopPropagation();
			const value = bookmarksSearch.value;
			if (value.length > 1) {
				if (lastSearch !== value) {
					lastSearch = value;
					send('background', 'bookmarks', 'search', {'request': value, needResponse: true}, response => {
						while (bookmarksSearchResults.firstChild)
							bookmarksSearchResults.removeChild(bookmarksSearchResults.firstChild);
						insertBookmarks(response, 'search');
						block.bookmarks.classList.add('search-active');
					});
				}
			}
			else
				block.bookmarks.classList.remove('search-active');
		});

		block.bookmarks.addEventListener('click', event => {
			event.stopPropagation();
			event.preventDefault();
			if (status.moving)
				return;
			if (event.target.classList.contains('bookmark'))
				openLink(event.target.title, event);
		});

		block.bookmarks.addEventListener('mouseover', event => {
			event.stopPropagation();
			const target = event.target;
			if (target.classList.contains('bookmark') || target.classList.contains('folder-name'))
				target.appendChild(controls.bookmarks.item);
		});

		const insertBookmarks = (items, method = 'last') => {
			let parent     = rootFolder;
			let pid        = 0;

			const checkPid = status.misc.bookmarksMode === 'tree' ?
				item => {
					if (item.pid !== pid) {
						pid = item.pid;
						parent = getFolderById('bookmarks', pid);
					}
				} :
				item => {};

			const append   = {
				last   : bookmark => parent.appendChild(bookmark),
				search : bookmark => bookmarksSearchResults.appendChild(bookmark),
				index  : bookmark => addBook(bookmark, parent, bookmark.index)
			};

			for (let i = 0, l = items.length; i < l; i++) {
				checkPid(items[i]);
				const bookmark = createById('bookmarks', items[i].id);
				bookmark.classList.add('bookmark', 'item', `domain-${items[i].domain}`);
				bookmark.title = items[i].url;
				bookmark.href  = items[i].url;
				bookmark.textContent = items[i].title;
				append[method](bookmark);
			}
		};

		const addBook = (item, parent, index) => {
			const beacon = parent.children[index + 1];
			if (beacon)
				parent.insertBefore(item, beacon);
			else
				parent.appendChild(item);
		};

		const moveBook = (item, parent, index) => {
			if (parent !== item.parentNode)
				addBook(item, parent, index);
			else {
				const temp = document.createElement('div');
				temp.appendChild(item);
				addBook(item, parent, index);
			}
		};

		const changeBook = (id, info) => {
			const bookmark = getById('bookmarks', id);
			if (info.url)
				bookmark.title = info.url;
			bookmark.textContent = info.title;
		};

		if (status.misc.bookmarksMode === 'tree') {
			insertFolders(data.bookmarksFolders, 'bookmarks');
			insertBookmarks(data.bookmarks, 'index');
		}
		else
			insertBookmarks(data.bookmarks, 'last');
	},

	history : data => {

		messageHandler.history = {
			new     : data =>  {
				insertFolders([data.folder], 'history');
				insertHistoryes([data.item], 'first');
				if (data.historyEnd)
					getMoreButton.classList.add('hidden');
			},
			removed : data =>  {
				removeHistoryItems(data.ids);
			},
			wiped   : data =>  {
				historyTotalWipe();
			},
			gotMore : data =>  {
				insertFolders(data.historyFolders, 'history');
				insertHistoryes(data.history, 'last');
			},
			title   : data =>  {
				getById('history', data.id).textContent = data.title;
			}
		};

		let lastSearch = '';
		const now = new Date();
		status.historyInfo.lastDate = now.toLocaleDateString();

		rootFolder                 = document.createElement('div');
		rootFolder.id              = 'history-0';
		const historySearchResults = document.createElement('div');
		historySearchResults.id    = 'history-search-results';
		historySearchResults.classList.add('search-results');
		controls.history.bottom    = document.createElement('div');
		controls.history.bottom.classList.add('bottom-bar');
		const searchIcon           = document.createElement('span');
		const historySearch        = document.createElement('input');
		historySearch.id           = 'historySearch';
		historySearch.classList.add('search');
		historySearch.type         = 'text';
		historySearch.placeholder  = i18n.history.searchPlaceholder;
		controls.history.bottom.appendChild(historySearch);
		searchIcon.classList.add('search-icon');
		controls.history.bottom.appendChild(searchIcon);
		const getMoreButton        = makeItemButton('getMore', 'history');

		block.history.appendChild(rootFolder);
		block.history.appendChild(getMoreButton);
		block.history.appendChild(historySearchResults);
		block.history.appendChild(controls.history.bottom);

		historySearch.addEventListener('keyup', event => {
			event.stopPropagation();
			const value = historySearch.value;
			if (value.length > 1) {
				if (lastSearch !== value) {
					lastSearch = value;
					send('background', 'history', 'search', {'request': value, needResponse: true}, response => {
						while (historySearchResults.firstChild)
							historySearchResults.removeChild(historySearchResults.firstChild);
						insertHistoryes(response, 'search');
						block.history.classList.add('search-active');
					});
				}
			}
			else
				block.history.classList.remove('search-active');
		});

		block.history.addEventListener('click', event => {
			event.stopPropagation();
			event.preventDefault();
			const target = event.target;
			if (target.classList.contains('history'))
				openLink(target.title, event);
		});

		const insertHistoryes = (items, method) => {
			let pid = -1;
			let folder = null;
			const insert = {
				first : item => {
					if (folder.children[1])
						folder.insertBefore(item, folder.children[1]);
					else
						folder.appendChild(item);
				},
				search : item => {
					historySearchResults.appendChild(item);
				},
				last : item => {
					status.historyInfo.lastNum++;
					folder.appendChild(item);
				}
			};
			for (let i = 0, l = items.length; i < l; i++) {
				let hist = getById('history', items[i].id);
				if (!hist)
					hist = createById('history', items[i].id);
				if (items[i].pid !== pid) {
					pid = items[i].pid;
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

		const historyTotalWipe = _ => {
			for (let i = status.historyId.length - 1; i >= 0; i--)
				removeById('history', status.historyId[i]);
		};

		insertFolders(data.historyFolders, 'history');
		insertHistoryes(data.history, 'last');
		if (data.historyEnd)
			getMoreButton.classList.add('hidden');
		status.historyInfoInit = true;
	},

	downloads : data => {

		messageHandler.downloads = {
			created    : data => {
				insertDownload(data.item);
			},
			erased     : data => {
				block.downloads.removeChild(getById('downloads', data.id));
			},
			exists     : data => {
				const download = getById('downloads', data.id);
				download.classList[data.method]('deleted');
			},
			startPause : data => {
				const download = getById('downloads', data.id);
				if (data.paused) {
					if (data.canResume)
						download.classList.add('paused');
					else
						download.classList.add('canceled');
				}
				else
					download.classList.remove('paused');
			},
			state     : data => {
				const download = getById('downloads', data.id);
				download.classList.remove('complete', 'interrupted', 'in_progress');
				download.classList.add(data.state);
			},
			progress  : data => {
				const download = getById('downloads', data.item.id);
				download.firstChild.nextElementSibling.firstChild.firstChild.style.width = data.item.progressPercent;
				download.firstChild.nextElementSibling.firstChild.nextElementSibling.textContent = data.item.progressNumbers;
				download.firstChild.nextElementSibling.firstChild.nextElementSibling.nextElementSibling.textContent = data.item.fileSize;
			},
			filename  : data => {
				const download = getById('downloads', data.id);
				download.firstChild.textContent = data.filename;
			}
		};

		controls.downloads.item = document.createElement('div');
		controls.downloads.item.classList.add('controls');
		makeButton('pause', 'downloads', 'item');
		makeButton('resume', 'downloads', 'item');
		makeButton('reload', 'downloads', 'item');
		makeButton('stop', 'downloads', 'item');
		makeButton('delete', 'downloads', 'item');

		block.downloads.addEventListener('click', event => {
			event.stopPropagation();
			const target = event.target;
			if (target.classList.contains('download')) {
				if (event.pageX - target.offsetLeft < 20)
					brauzer.downloads.show(parseInt(target.dataset.id));
				else
					brauzer.downloads.open(parseInt(target.dataset.id));
			}
		});

		block.downloads.addEventListener('mouseover', event => {
			event.stopPropagation();
			const target = event.target;
			if (target.classList.contains('item'))
				return target.appendChild(controls.downloads.item);
			if (target.parentNode.classList.contains('item'))
				return target.parentNode.appendChild(controls.downloads.item);
		});

		const insertDownload = item => {
			const down           = createById('downloads', item.id);
			down.title           = item.url;
			down.textContent     = item.filename;
			let classList        = `download item ${item.state}`;
			classList            += item.exists ? '' : ' deleted';
			if (item.paused)
				classList += item.canResume ? ' paused' : ' canceled';
			down.classList       = classList;
			const status         = document.createElement('div');
			status.classList.add('status');
			status.title         = '';
			const progress       = document.createElement('div');
			progress.classList.add('progress-bar');
			const bar            = document.createElement('span');
			progress.appendChild(bar);
			bar.style.width      = item.progressPercent;
			const recived        = document.createElement('div');
			recived.classList.add('recived');
			recived.textContent  = item.progressNumbers;
			const fileSize       = document.createElement('div');
			fileSize.classList.add('file-size');
			fileSize.textContent = item.fileSize;
			status.appendChild(progress);
			status.appendChild(recived);
			status.appendChild(fileSize);
			down.appendChild(status);
			block.downloads.insertBefore(down, block.downloads.firstChild);
		};

		for (let i = 0, l = data.downloads.length; i < l; i++)
			insertDownload(data.downloads[i]);
	},

	rss : data => {

		messageHandler.rss = {
			createdFeed      : data =>  {
				insertFolders([data.feed], 'rss');
			},
			newItems         : data =>  {
				if (status.misc.rssMode === 'plain')
					insertRss(data.items, 'date');
				else
					insertRss(data.items, 'first');
			},
			rssReaded        : data =>  {
				const rssItem = getById('rss', data.id);
				if (rssItem) {
					rssItem.classList.remove('unreaded');
					if (data.feedReaded)
						rssItem.parentNode.classList.remove('unreaded');
				}
			},
			rssReadedAll     : data =>  {
				const feed = getFolderById('rss', data.id);
				if (feed) {
					feed.classList.remove('unreaded');
					for (let items = feed.children, i = items.length - 1; i >= 0; i--)
						items[i].classList.remove('unreaded');
				}
			},
			rssReadedAllFeeds : data => {
				for (let i = status.rss.length - 1; i >= 0; i--)
					status.rss[i].classList.remove('unreaded');
				for (let i = status.rssFolders.length - 1; i >= 0; i--)
					status.rssFolders[i].classList.remove('unreaded');
			},
			view             : data =>  {
				setRssMode(data.view, data.items, data.folders);
			},
			rssHideReaded    : data =>  {
				const feed = getFolderById('rss', data.id);
				if (feed)
					feed.classList.add('hide-readed');
			},
			rssShowReaded    : data =>  {
				const feed = getFolderById('rss', data.id);
				if (feed)
					feed.classList.remove('hide-readed');
			},
			rssFeedChanged   : data =>  {
				const feed = getFolderById('rss', data.id);
				if (feed) {
					feed.firstChild.firstChild.textContent = data.title;
					feed.firstChild.title                  = data.description;
				}
			},
			rssFeedDeleted   : data =>  {
				removeFolderById('rss', data.id);
			},
			rssItemDeleted   : data => {
				removeById('rss', data.id);
			},
			update           : data => {
				const feed = getFolderById('rss', data.id);
				if (feed)
					feed.firstChild.classList[data.method]('loading');
			}
		};

		rootFolder              = document.createElement('div');
		rootFolder.id           = 'rss-0';

		controls.rss.item       = document.createElement('div');
		controls.rss.item.classList.add('controls');
		makeButton('reload', 'rss', 'item');
		makeButton('markRead', 'rss', 'item');
		makeButton('markReadAll', 'rss', 'item');
		makeButton('hideReaded', 'rss', 'item');
		makeButton('showReaded', 'rss', 'item');
		makeButton('options', 'rss', 'item');

		controls.rss.bottom     = document.createElement('div');
		controls.rss.bottom.classList.add('bottom-bar');
		makeButton('new', 'rss', 'bottom');
		makeButton('hideReadedAll', 'rss', 'bottom');
		makeButton('showReadedAll', 'rss', 'bottom');
		makeButton('markReadAllFeeds', 'rss', 'bottom');
		makeButton('reloadAll', 'rss', 'bottom');
		makeButton('plain', 'rss', 'bottom');
		makeButton('domain', 'rss', 'bottom');

		block.rss.appendChild(rootFolder);
		block.rss.appendChild(controls.rss.item);
		block.rss.appendChild(controls.rss.bottom);

		block.rss.addEventListener('click', event => {
			event.preventDefault();
			event.stopPropagation();
			const target = event.target;
			if (target.classList.contains('rss-item')) {
				openLink(target.dataset.link, event);
				send('background', 'rss', 'rssReaded', {'id': target.dataset.id});
			}
		});

		block.rss.addEventListener('mouseover', event => {
			event.stopPropagation();
			const target = event.target;
			if (target.classList.contains('rss-item'))
				target.appendChild(controls.rss.item);
			else if (target.classList.contains('folder-name'))
				target.appendChild(controls.rss.item);
		});

		const setRssMode = (mode, rss, rssFolders) => {
			status.misc.rssMode = mode;
			block.rss.classList = `block ${mode}`;
			while (rootFolder.firstChild)
				rootFolder.removeChild(rootFolder.firstChild);
			clearStatus('rss');
			if (mode === 'domain')
				insertFolders(rssFolders, 'rss');
			insertRss(rss, 'first');
			setReadedMode(status.misc.rssHideReaded);
		};

		const insertRss = (items, method) => {

			const insert = {
				domainfirst : (item, data) => {
					pidCheck(data.pid);
					folder.insertBefore(item, folder.firstChild.nextElementSibling);
				},
				plainfirst  : (item, data) => {
					folder.insertBefore(item, folder.firstChild);
				},
				domainlast  : (item, data) => {
					pidCheck(data.pid);
					folder.appendChild(item);
				},
				plainlast   : (item, data) => {
					folder.appendChild(item);
				},
				domaindate  : (item, data) => {
					pidCheck(data.pid);
					if (folder.children.length < 2)
						folder.appendChild(item);
					else
						folder.insertBefore(item, folder.firstChild.nextElementSibling);
				},
				plaindate   : (item, data) => {
					if (status.rss.length < 2)
						folder.appendChild(item);
					else
						folder.insertBefore(item, folder.children[data.index]);
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
				item.addEventListener('mouseover', _ => {
					item.title =
`${items[i].title}

${items[i].description}`;
				},
				{'passive': true, 'once': true});
				if (items[i].readed)
					item.classList.add('item', 'rss-item', `domain-${items[i].domain}`);
				else {
					item.classList.add('item', 'rss-item', `domain-${items[i].domain}`, 'unreaded');
					folder.classList.add('unreaded');
				}
				insert[`${status.misc.rssMode}${method}`](item, items[i]);
			}
		};

		setRssMode(status.misc.rssMode, data.rss, data.rssFolders);
	}
};

///------------------------------------------------------------------///
//                     Commons Block
///------------------------------------------------------------------///

function setWide(mode) {
	status.wide = mode;
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
	status.fixed = mode;
	if (mode) {
		doc.classList.remove('unfixed');
		doc.classList.add('fixed');
	}
	else {
		doc.classList.remove('fixed');
		doc.classList.add('unfixed');
	}
}

function setReadedMode(mode) {
	status.misc.rssHideReaded = mode;
	if (mode) {
		block.rss.classList.add('hide-readed');
		block.rss.classList.remove('show-readed');
	}
	else {
		block.rss.classList.add('show-readed');
		block.rss.classList.remove('hide-readed');
	}
}

function setFontSize(fontSize) {
	if (fontSize)
		status.theme.fontSize = fontSize;
	doc.style.fontSize   = `${status.theme.fontSize / window.devicePixelRatio}px`;
	doc.style.lineHeight = `${status.theme.fontSize / window.devicePixelRatio * 1.2}px`;
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

function blockInit(newMode, data) {
	const cleanse = _ => {
		while (block[status.mode].hasChildNodes())
			block[status.mode].removeChild(block[status.mode].firstChild);
		clearStatus(status.mode);
		block[status.mode].classList.remove('search-active');
	};
	if (!status.init[newMode]) {
		i18n[newMode] = data.i18n;
		const link    = document.createElement('link');
		link.type     = 'text/css';
		link.rel      = 'stylesheet';
		link.href     = `sidebar-${newMode}.css`;
		document.head.appendChild(link);
		status.init[newMode] = true;
	}
	if (status.mode !== newMode) {
		initBlock[newMode](data);
		if (status.mode)
			cleanse();
	}
	else {
		cleanse();
		initBlock[newMode](data);
	}
	document.body.classList = newMode;
	status.mode             = newMode;
	status.activeBlock      = block[newMode];
}

function enableBlock(mode) {
	button[mode].classList.remove('hidden');
	if (mode === 'rss') {
		const unreaded  = document.createElement('div');
		unreaded.id     = 'rss-unreaded';
		button.rss.appendChild(unreaded);
	}
}

function fullInit(response) {

	if (!response) return setTimeout(fullInit, 200);

	status.side         = response.side;
	status.misc         = response.misc;
	status.theme        = response.theme;
	status.wide         = response.wide;
	status.fixed        = response.fixed;
	status.width        = response.width;
	i18n.header         = response.i18n.header;
	status.warnings     = response.warnings;

	setFontSize();
	setColor(response.theme);

	doc.style.backgroundImage = `url(${status.theme.sidebarImage})`;

	if (button.tabs === null)
		button.tabs      = makeButton('tabs', 'header', 'sidebar');
	if (button.bookmarks === null)
		button.bookmarks = makeButton('bookmarks', 'header', 'sidebar');
	if (button.history === null)
		button.history   = makeButton('history', 'header', 'sidebar');
	if (button.downloads === null)
		button.downloads = makeButton('downloads', 'header', 'sidebar');
	if (button.rss === null)
		button.rss       = makeButton('rss', 'header', 'sidebar');

	if (response.services.tabs)
		enableBlock('tabs');
	else
		button.tabs.classList.add('hidden');
	if (response.services.bookmarks)
		enableBlock('bookmarks');
	else
		button.bookmarks.classList.add('hidden');
	if (response.services.history)
		enableBlock('history');
	else
		button.history.classList.add('hidden');
	if (response.services.downloads)
		enableBlock('downloads');
	else
		button.downloads.classList.add('hidden');
	if (response.services.rss)
		enableBlock('rss');
	else
		button.rss.classList.add('hidden');

	setRssUnreaded(response.info.rssUnreaded);
	setDownloadStatus[response.info.downloadStatus]();

	if (status.method === 'iframe') {
		doc.classList.remove('fixed');
		window.onresize              = _ => {setFontSize();};
		if (controls.header.iframe === null) {
			controls.header.iframe       = document.createElement('div');
			controls.header.iframe.id    = 'controls-sidebar';
			makeButton('pin', 'header', 'iframe');
			makeButton('unpin', 'header', 'iframe');
			makeButton('wide', 'header', 'iframe');
			makeButton('narrow', 'header', 'iframe');
			controls.header.main.appendChild(controls.header.iframe);
		}
		setWide(status.wide);
		setFixed(status.fixed);
	}

	setDomainStyle.rewrite(response.domains);
	blockInit(response.mode, response.data);

	brauzer.runtime.onMessage.addListener((message, sender, sendResponse) => {
		// console.log(message);
		if (message.hasOwnProperty('target')) {
			if (message.target === 'sidebar')
				messageHandler[message.subject][message.action](message.data, sendResponse);
			else if (message.target === status.side)
				messageHandler[message.subject][message.action](message.data, sendResponse);
		}
	});
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

function insertFolders(items, mode, noTitle = false) {
	let folders = [];
	for (let i = 0, l = items.length; i < l; i++) {
		if (getFolderById(mode, items[i].id))
			continue;
		const index = status[`${mode}Folders`].push(document.createElement('ul')) - 1;
		status[`${mode}FoldersId`].push(items[i].id);
		folders.push({'index': index, 'pid': items[i].pid});
		let classList = 'folder';
		classList += ` ${items[i].view}-view`;
		classList += items[i].folded ? ' folded' : '';
		status[`${mode}Folders`][index].classList = classList;
		status[`${mode}Folders`][index].id = `${mode}-folder-${items[i].id}`;
		if (!noTitle) {
			const title       = document.createElement('div');
			const text        = document.createTextNode(items[i].title || String.fromCharCode(0x00a0));
			title.title       = items[i].description || items[i].title;
			title.dataset.id  = items[i].id;
			title.classList.add('folder-name', `domain-${items[i].domain}`);
			title.appendChild(text);
			status[`${mode}Folders`][index].appendChild(title);
			title.addEventListener('click', event => {
				event.preventDefault();
				event.stopPropagation();
				const folded = status.moving ?  false : !title.parentNode.classList.contains('folded');
				send('background', 'set', 'fold', {'mode': mode, 'id': items[i].id, 'folded': folded, 'method': folded ? 'add' : 'remove'});
			});
		}
	}
	for (let i = 0, l = folders.length; i < l; i++) {
		if (folders[i].pid === 0)
			rootFolder.appendChild(status[`${mode}Folders`][folders[i].index]);
		else {
			const parentFolder = getFolderById(mode, folders[i].pid);
			if (parentFolder !== false)
				parentFolder.appendChild(status[`${mode}Folders`][folders[i].index]);
			else
				rootFolder.appendChild(status[`${mode}Folders`][folders[i].index]);
		}
	}
}

function setStyle(item) {
	const style       = createById('domains', item.id);
	style.textContent = `.domain-${item.id}{background-image: url(${item.fav})}`;
	document.head.appendChild(style);
}

const setDomainStyle = {
	rewrite : items => {
		for (let i = status.domains.length - 1; i >= 0; i--)
			document.head.removeChild(status.domains[i]);
		status.domains   = [];
		status.domainsId = [];
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

const element = {
	tabs:      'a',
	bookmarks: 'a',
	history:   'a',
	downloads: 'li',
	rss:       'a',
	domains:   'style'
};

function createById(mode, id) {
	const item      = document.createElement(element[mode]);
	item.id         = `${mode}-${id}`;
	item.dataset.id = id;
	status[mode].push(item);
	status[`${mode}Id`].push(id);
	return item;
}

function getById(mode, id) {
	const index = status[`${mode}Id`].indexOf(id);
	if (index !== -1)
		return status[mode][index];
	else
		return false;
}

function removeById(mode, id) {
	const index = status[`${mode}Id`].indexOf(id);
	if (index !== -1) {
		status[mode][index].parentNode.removeChild(status[mode][index]);
		status[mode].splice(index, 1);
		status[`${mode}Id`].splice(index, 1);
	}
}

function getFolderById(mode, id) {
	if (id === 0)
		return rootFolder;
	const index = status[`${mode}FoldersId`].indexOf(id);
	if (index !== -1)
		return status[`${mode}Folders`][index];
	else
		return false;
}

function removeFolderById(mode, id) {
	const index = status[`${mode}FoldersId`].indexOf(id);
	if (index !== -1) {
		status[`${mode}Folders`][index].parentNode.removeChild(status[`${mode}Folders`][index]);
		status[`${mode}Folders`].splice(index, 1);
		status[`${mode}FoldersId`].splice(index, 1);
	}
}

function clearStatus(mode) {
	status[mode]               = [];
	status[`${mode}Id`]        = [];
	status[`${mode}Folders`]   = [];
	status[`${mode}FoldersId`] = [];
}

function send(target, subject, action, data = {}, callback = _ => {}) {
	brauzer.runtime.sendMessage({'target': target, 'subject': subject, 'action': action, 'data': data}, callback);
}

function openLink(href, event) {
	if (event.ctrlKey)
		send('background', 'tabs', 'new', {'url': href});
	else if (event.shiftKey)
		send('background', 'tabs', 'new', {'url': href, 'newWindow': true});
	else
		send('background', 'tabs', 'update', {'url': href});
}

function makeBlock(type) {
	const block = document.createElement('div');
	block.id    = type;
	block.classList.add('block');
	document.body.appendChild(block);
	return block;
}

function makeButton(type, block, sub) {
	const button     = document.createElement('span');
	button.id        = `${block}-${type}`;
	button.classList = 'button';
	button.title     = i18n[block][type];
	const icon       = document.createElement('span');
	icon.style.setProperty(mask, `url('icons/${type}.svg')`);
	button.appendChild(icon);
	controls[block][sub].appendChild(button);
	button.addEventListener('click', buttonsEvents[block][type]);
	return button;
}

function makeItemButton(type, block) {
	const item       = document.createElement('span');
	item.title       = i18n[block][`${type}Title`];
	item.id          = `${block}-${type}`;
	item.classList.add('item-button');
	item.addEventListener('click', buttonsEvents[block][type]);
	if (i18n[block][`${type}Text`] !== '')
		item.textContent = i18n[block][`${type}Text`];
	else {
		const button     = document.createElement('span');
		button.classList.add('button');
		item.appendChild(button);
		const icon       = document.createElement('span');
		button.appendChild(icon);
	}
	return item;
}

const buttonsEvents = {
	header    : {
		tabs : event => {
			event.stopPropagation();
			event.preventDefault();
			if (status.mode !== 'tabs')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'tabs'});
		},
		bookmarks : event => {
			event.stopPropagation();
			event.preventDefault();
			if (status.mode !== 'bookmarks')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'bookmarks'});
		},
		history : event => {
			event.stopPropagation();
			event.preventDefault();
			if (status.mode !== 'history')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'history'});
		},
		downloads : event => {
			event.stopPropagation();
			event.preventDefault();
			if (status.mode !== 'downloads')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'downloads'});
		},
		rss : event => {
			event.stopPropagation();
			event.preventDefault();
			if (status.mode !== 'rss')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'rss'});
		},
		pin: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'options', 'handler', {'section': status.side, 'option': 'fixed', 'value': true});
		},
		unpin: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'options', 'handler', {'section': status.side, 'option': 'fixed', 'value': false});
		},
		wide: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'options', 'handler', {'section': status.side, 'option': 'wide', 'value': false});
		},
		narrow: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'options', 'handler', {'section': status.side, 'option': 'wide', 'value': true});
		}
	},
	tabs      : {
		reload: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'tabs', 'reload', {'id': parseInt(controls.tabs.item.parentNode.dataset.id)});
		},
		pin: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'tabs', 'pin', {'id': parseInt(controls.tabs.item.parentNode.dataset.id)});
		},
		unpin: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'tabs', 'unpin', {'id': parseInt(controls.tabs.item.parentNode.dataset.id)});
		},
		close: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'tabs', 'removeById', {'idList': [parseInt(controls.tabs.item.parentNode.dataset.id)]});
		},
		closeAll: event => {
			event.stopPropagation();
			event.preventDefault();
			if (status.warnings.closeDomainFolder)
				send('background', 'dialog', 'closeDomainFolder', {'id': controls.tabs.item.parentNode.dataset.id});
			else
				send('background', 'tabs', 'removeByDomain', {'id': controls.tabs.item.parentNode.dataset.id});
		},
		new: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'tabs', 'new', {'url': ''});
		},
		plain: event => {
			event.stopPropagation();
			event.preventDefault();
			if (status.misc.tabsMode !== 'plain')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'tabsMode', 'value': 'plain'});
		},
		domain: event => {
			event.stopPropagation();
			event.preventDefault();
			if (status.misc.tabsMode !== 'domain')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'tabsMode', 'value': 'domain'});
		},
		tree: event => {
			event.stopPropagation();
			event.preventDefault();
			if (status.misc.tabsMode !== 'tree')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'tabsMode', 'value': 'tree'});
		}
	},
	bookmarks : {
		move : event => {

			const mouseover = event => {
				event.stopPropagation();
				const target = event.target;
				if (target.classList.contains('bookmark'))
					target.parentNode.insertBefore(item, target);
				else if (target.classList.contains('folder-name')) {
					target.parentNode.appendChild(item);
					if (target.parentNode.classList.contains('folded'))
						target.click();
				}
			};

			const keydown = event => {
				if (event.key === 'Escape') {
					finilize();
					status.moving = false;
					if (folder !== item.parentNode)
						folder.insertBefore(item, folder.children[index]);
					else if (index >= folder.children.length - 1)
						folder.appendChild(item);
					else {
						let newindex  = -1;
						for (let i = 0, l = folder.children.length; i < l; i++)
							if (folder.children[i] === item) {
								newindex = i;
								break;
							}
						const k = newindex < index ? 1 : 0;
						folder.insertBefore(item, folder.children[index + k]);
					}
				}
			};

			const mousedown = event => {
				event.stopPropagation();
				event.preventDefault();
				let newindex = 0;
				const length  = item.parentNode.children.length;
				if (length > 2) {
					for (let i = 1; i < length; i++)
						if (item.parentNode.children[i] === item) {
							newindex = i - 1;
							break;
						}
					if (newindex === 0)
						newindex = length - 1;
				}
				finilize();
				send('background', 'bookmarks', 'move', {'id': id, 'pid': item.parentNode.firstChild.dataset.id, 'index': newindex});
			};

			const finilize = _ => {
				block.bookmarks.removeEventListener('mouseover', mouseover);
				doc.removeEventListener('keydown', keydown);
				doc.removeEventListener('mousedown', mousedown);
				item.classList.remove('moved');
				rootFolder.classList.remove('moving');
			};

			status.moving = true;
			const item    = event.target.parentNode.parentNode.parentNode;
			const folder  = item.parentNode;
			const id      = item.dataset.id;
			let   index   = -1;
			for (let i = 0, l = folder.children.length; i < l; i++)
				if (folder.children[i] === item) {
					index = i;
					break;
				}
			rootFolder.classList.add('moving');
			item.classList.add('moved');

			block.bookmarks.addEventListener('mouseover', mouseover);
			doc.addEventListener('keydown', keydown);
			doc.addEventListener('mousedown', mousedown);

		},
		delete : event => {
			event.stopPropagation();
			event.preventDefault();
			const target = controls.bookmarks.item.parentNode;
			if (status.warnings.deleteBookmark)
				send('background', 'dialog', 'bookmarkDelete', {'id': target.dataset.id, 'title': target.textContent});
			else
				send('background', 'bookmarks', 'deleteItem', {'id': target.dataset.id});
		},
		deleteFolder : event => {
			event.stopPropagation();
			event.preventDefault();
			const target = controls.bookmarks.item.parentNode;
			if (status.warnings.deleteBookmarkFolder)
				send('background', 'dialog', 'bookmarkFolderDelete', {'id': target.dataset.id, 'title': target.textContent});
			else
				send('background', 'bookmarks', 'deleteFolder', {'id': target.dataset.id});
		},
		bookmarkThis : event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'dialog', 'newBookmark', '');
		},
		edit : event => {
			event.stopPropagation();
			event.preventDefault();
			const target = controls.bookmarks.item.parentNode;
			if (target.nodeName === 'DIV')
				send('background', 'dialog', 'editBookmarkFolder', {'id': target.dataset.id});
			else
				send('background', 'dialog', 'editBookmark', {'id': target.dataset.id});
		}
	},
	history   : {
		getMore : event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'history', 'getMore', '');
		}
	},
	downloads : {
		pause: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'downloads', 'pause', {'id': parseInt(controls.downloads.item.parentNode.dataset.id)});
		},
		resume: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'downloads', 'resume', {'id': parseInt(controls.downloads.item.parentNode.dataset.id)});
		},
		reload: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'downloads', 'reload', {'id': parseInt(controls.downloads.item.parentNode.dataset.id)});
		},
		cancel: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'downloads', 'cancel', {'id': parseInt(controls.downloads.item.parentNode.dataset.id), 'url': controls.downloads.item.parentNode.title});
		},
		delete: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'dialog', 'downloadDelete', {'id': parseInt(controls.downloads.item.parentNode.dataset.id), 'title': controls.downloads.item.parentNode.firstChild.textContent});
		}
	},
	rss       : {
		new : event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'dialog', 'rssAdd', {});
		},
		hideReadedAll: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'options', 'handler', {'section': 'misc', 'option': 'rssHideReaded', 'value': true});
		},
		showReadedAll: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'options', 'handler', {'section': 'misc', 'option': 'rssHideReaded', 'value': false});
		},
		options: event => {
			event.stopPropagation();
			event.preventDefault();
			const folderTitle = controls.rss.item.parentNode;
			send('background', 'dialog', 'rssEditFeed', {'id': folderTitle.dataset.id, 'title': folderTitle.textContent.trim(), 'description': folderTitle.title});
		},
		reload: event => {
			event.stopPropagation();
			event.preventDefault();
			const id = controls.rss.item.parentNode.dataset.id;
			send('background', 'rss', 'updateFeed', {'id': id});
		},
		reloadAll: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'rss', 'updateAll');
		},
		markRead: event => {
			event.stopPropagation();
			event.preventDefault();
			const rss  = controls.rss.item.parentNode;
			const feed = rss.parentNode.firstChild;
			send('background', 'rss', 'rssReaded', {'id': rss.dataset.id});
		},
		markReadAll: event => {
			event.stopPropagation();
			event.preventDefault();
			const feed = controls.rss.item.parentNode;
			send('background', 'rss', 'rssReadedAll', {'id': feed.dataset.id});
		},
		markReadAllFeeds: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'rss', 'rssReadedAllFeeds', {});
		},
		hideReaded: event => {
			event.stopPropagation();
			event.preventDefault();
			const feed = controls.rss.item.parentNode;
			send('background', 'rss', 'rssHideReaded', {'id': feed.dataset.id});
		},
		showReaded: event => {
			event.stopPropagation();
			event.preventDefault();
			const feed = controls.rss.item.parentNode;
			send('background', 'rss', 'rssShowReaded', {'id': feed.dataset.id});
		},
		delete: event => {
			event.stopPropagation();
			event.preventDefault();
			const item = controls.rss.item.parentNode;
			send('background', 'dialog', 'rssDeleteItem', {'id': item.dataset.id, 'title': item.textContent});
		},
		plain: event => {
			event.stopPropagation();
			event.preventDefault();
			if (status.misc.rssMode !== 'plain')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'rssMode', 'value': 'plain'});
		},
		domain: event => {
			event.stopPropagation();
			event.preventDefault();
			if (status.misc.rssMode !== 'domain')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'rssMode', 'value': 'domain'});
		}
	},
};

})();