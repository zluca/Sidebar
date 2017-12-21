(function() {

'use strict';

const firefox  = (typeof InstallTrigger !== 'undefined') ? true : false;
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
	init: {
		tabs         : false,
		bookmarks    : false,
		downloads    : false,
		history      : false,
		rss          : false,
		pocket       : false
	},
	bookmarkFolders  : [],
	historyInfo       : {
		lastDate : 0,
		lastNum  : 0
	},
	activeTab           : false,
	activeTabId         : 0,
	domainsId           : [],
	info                : {
		rssUnreaded    : 0,
		downloadStatus : ''
	},
	moving              : false,
	lastClicked         : {
		id   : -1,
		time : -1
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
	domains             : []
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

let initTimer = -1;
tryToInit();

document.title = options.sidebar.method;
doc.classList.add(status.side);

let rootFolder = null;

const controls = {
	header: {
		main      : dce('nav'),
		sidebar   : dce('div'),
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
	},
	pocket    : {
		item     : null,
		bottom   : null,
		user     : null
	}
};

controls.header.main.id    = 'controls';
controls.header.sidebar.id = 'controls-block';
controls.header.main.appendChild(controls.header.sidebar);
document.body.appendChild(controls.header.main);

const button   = {
	tabs        : null,
	bookmarks   : null,
	history     : null,
	downloads   : null,
	rss         : null,
	pocket      : null
};

const block    = {
	tabs        : makeBlock('tabs'),
	bookmarks   : makeBlock('bookmarks'),
	history     : makeBlock('history'),
	downloads   : makeBlock('downloads'),
	rss         : makeBlock('rss'),
	pocket      : makeBlock('pocket')
};

const messageHandler = {
	options  : {
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
			blockInit(info.value, info.data);
		},
		warnings           : info => {
			options.warnings[info.option] = info.value;
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
		rssHideReaded      : info => {
			setReadedMode(info.value);
		},
		services           : info => {
			if (info.enabled === true)
				enableBlock(info.service);
			else
				button[info.service].classList.add('hidden');
		}
	},
	set : {
		fold         : info => {
			if (info.mode !== options.sidebar.mode) return;
			const folder = getFolderById(info.mode, info.id);
			if (folder !== false)
				folder.classList[info.method]('folded');
		},
		reInit       : info => {
			initSidebar(info);
		},
		hover       : info => {
			doc.classList[info]('hover');
		},
		side        : info => {
			if (options.sidebar.method === 'native')
				status.side = info;
		}
	},
	info : {
		rssUnreaded    : info => {
			button.rss.lastChild.textContent = info.unreaded || ' ';
		},
		newDomain      : info => {
			setDomainStyle.update([info.domain]);
		},
		updateDomain   : info => {
			setDomainStyle.update(info);
		},
		downloadStatus : info => {
			setDownloadStatus[info]();
		}
	},
	tabs : {},
	bookmarks : {},
	history : {},
	downloads : {},
	rss : {}
};

const initBlock = {

	tabs : info => {

		status.activeTabId = info.activeTabId;

		messageHandler.tabs = {
			created    : info => {
				if (options.misc.tabsMode === 'tree')
					insertFolders('tabs', [fakeFolder(info.tab)], true);
				insertItems.tabs([info.tab]);
			},
			active     : info => {
				status.activeTabId = info;
				if (status.activeTab !== false)
					status.activeTab.classList.remove('active');
				status.activeTab = getById('tabs', info);
				if (status.activeTab !== false)
					status.activeTab.classList.add('active');
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
					insertItems.tabs([info.tab]);
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
					insertItems.tabs([info.tab]);
				}
			},
			removed      : info => {
				const removing = {
					plain  : tab => {
						removeById('tabs', info.id);
					},
					domain : tab => {
						const pid    = tab.parentNode.firstChild.dataset.id;
						const folder = getFolderById('tabs', pid);
						removeById('tabs', info.id);
						if (folder !== false)
							if (!folder.lastChild.hasChildNodes())
								removeFolderById('tabs', pid);
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
				if (tab !== false)
					removing[options.misc.tabsMode](tab);
			},
			moved        : info => {
				moveTab(info);
			},
			unpin        : info => {
				getById('tabs', info.id).classList.remove('pinned');
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

		rootFolder                = dce('div');
		rootFolder.id             = 'tabs-folder-0';
		const rootContent         = dce('div');
		rootFolder.appendChild(rootContent);
		controls.tabs.item        = dce('div');
		controls.tabs.item.classList.add('controls');
		makeButton('reload', 'tabs', 'item');
		makeButton('pin', 'tabs', 'item');
		makeButton('unpin', 'tabs', 'item');
		makeButton('close', 'tabs', 'item');
		makeButton('closeAll', 'tabs', 'item');
		controls.tabs.bottom      = dce('div');
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

		insertItems.tabs = tabs => {
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
					if (folder !== false)
						folder.lastChild.appendChild(tab);
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

		const moveTab = info => {
			const tab = getById('tabs', info.id);
			if (tab !== false) {
				if (options.misc.tabsMode === 'plain')
					if (info.toIndex < info.fromIndex)
						rootFolder.lastChild.insertBefore(tab, rootFolder.children[info.toIndex]);
					else
						rootFolder.lastChild.insertBefore(tab, rootFolder.children[info.toIndex + 1]);
				if (info.hasOwnProperty('pinned'))
					tab.classList.add('pinned');
				else
					tab.classList.remove('pinned');
			}
		};

		const fakeFolder = tab => {
			return {
				id     : tab.id,
				pid    : tab.opener,
				view   : 'tree',
				folded : false
			};
		};

		const checkForTree = (tabs, folders, view) => {
			if (view !== 'tree')
				setView('tabs', view, info.tabs, folders);
			else {
				let fakeFolders = [];
				for (let i = 0, l = tabs.length; i < l; i++)
					fakeFolders.push(fakeFolder(tabs[i]));
				setView('tabs', view, info.tabs, fakeFolders);
			}
		};
		checkForTree(info.tabs, info.tabsFolders, options.misc.tabsMode);
	},

	bookmarks : info => {
		let lastSearch = '';

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
				insertBookmarks([info.item]);
			},
			createdFolder   : info => {
				insertFolders('bookmarks', [info.item]);
			},
			moved           : info => {
				const mouseup = event => {
					event.stopPropagation();
					event.preventDefault();
					doc.removeEventListener('mouseup', mouseup);
					setTimeout(_ => {status.moving = false;}, 500);
				};
				if (status.moving === true)
					doc.addEventListener('mouseup', mouseup);
				else if (info.isFolder === false)
					moveBook(getById('bookmarks', info.id) , getFolderById('bookmarks', info.pid), info.index);
				else if (info.isFolder === true)
					moveBook(getFolderById('bookmarks', info.id) , getFolderById('bookmarks', info.pid), info.index);
			}
		};

		block.bookmarks.classList    = `block ${options.misc.bookmarksMode}`;
		rootFolder                   = dce('div');
		rootFolder.id                = 'bookmarks-folder-0';
		const rootContent            = dce('div');
		rootFolder.appendChild(rootContent);
		const bookmarksSearchResults = dce('div');
		bookmarksSearchResults.id    = 'bookmarks-search-results';
		bookmarksSearchResults.classList.add('search-results');
		controls.bookmarks.item      = dce('div');
		controls.bookmarks.item.classList.add('controls');
		makeButton('edit', 'bookmarks', 'item');
		makeButton('move', 'bookmarks', 'item');
		makeButton('delete', 'bookmarks', 'item');
		makeButton('deleteFolder', 'bookmarks', 'item');
		controls.bookmarks.bottom    = dce('div');
		controls.bookmarks.bottom.classList.add('bottom-bar');
		const bookmarksSearch        = dce('input');
		bookmarksSearch.id           = 'bookmarks-search';
		bookmarksSearch.classList.add('search');
		bookmarksSearch.type         = 'text';
		bookmarksSearch.placeholder  = i18n.bookmarks.searchPlaceholder;
		controls.bookmarks.bottom.appendChild(bookmarksSearch);
		const searchIcon             = dce('span');
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
				openLink(event);
		});

		block.bookmarks.addEventListener('mouseover', event => {
			event.stopPropagation();
			const target = event.target;
			if (target.classList.contains('bookmark') || target.classList.contains('folder-name'))
				target.appendChild(controls.bookmarks.item);
		});

		const insertBookmarks = (items, method = 'last') => {
			let folder = rootFolder;
			let count  = 0;
			let pid    = 0;

			const checkPid =
				method === 'search' ?
					item => {
						folder = bookmarksSearchResults;
					} :
					options.misc.bookmarksMode === 'tree' ?
						item => {
							if (item.pid !== pid) {
								pid    = item.pid;
								folder = getFolderById('bookmarks', pid);
								count  = folder.lastChild.children.length - 1;
								if (folder === false)
									folder = rootFolder;
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

		const moveBook = (item, parent, index) => {

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

		const changeBook = (id, info) => {
			const bookmark = getById('bookmarks', id);
			if (info.hasOwnProperty('url'))
				bookmark.title = info.url;
			if (info.hasOwnProperty('title'))
				bookmark.textContent = info.title;
		};

		if (options.misc.bookmarksMode === 'tree')
			insertFolders('bookmarks', info.bookmarksFolders);
		insertBookmarks(info.bookmarks, 'last');
	},

	history : info => {

		messageHandler.history = {
			new     : info =>  {
				insertFolders('history', [info.folder]);
				insertHistoryes([info.item], 'first');
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
				insertHistoryes(info.history, 'last');
			},
			title   : info =>  {
				const item = getById('history', info.id);
				if (item !== false)
					item.textContent = info.title;
			}
		};

		let lastSearch = '';
		const now = new Date();
		status.historyInfo.lastDate = now.toLocaleDateString();

		rootFolder                 = dce('div');
		rootFolder.id              = 'history-folder-0';
		const rootContent          = dce('div');
		rootFolder.appendChild(rootContent);
		const historySearchResults = dce('div');
		historySearchResults.id    = 'history-search-results';
		historySearchResults.classList.add('search-results');
		controls.history.bottom    = dce('div');
		controls.history.bottom.classList.add('bottom-bar');
		const searchIcon           = dce('span');
		const historySearch        = dce('input');
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
			if (event.target.classList.contains('history'))
				openLink(event);
		});

		const insertHistoryes = (items, method) => {
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
					historySearchResults.appendChild(item);
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

		const historyTotalWipe = _ => {
			for (let i = data.historyId.length - 1; i >= 0; i--)
				removeById('history', data.historyId[i]);
		};

		insertFolders('history', info.historyFolders);
		insertHistoryes(info.history, 'last');
		if (info.historyEnd === true)
			getMoreButton.classList.add('hidden');
		status.init.history = true;
	},

	downloads : info => {

		messageHandler.downloads = {
			created    : info => {
				insertDownload(info.item);
			},
			erased     : info => {
				block.downloads.removeChild(getById('downloads', info.id));
			},
			exists     : info => {
				const download = getById('downloads', info.id);
				if (download !== false)
					download.classList[info.method]('deleted');
			},
			startPause : info => {
				const download = getById('downloads', info.id);
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
				download.classList.remove('complete', 'interrupted', 'in_progress');
				download.classList.add(info.state);
			},
			progress  : info => {
				const download = getById('downloads', info.item.id);
				download.firstChild.nextElementSibling.firstChild.firstChild.style.width = info.item.progressPercent;
				download.firstChild.nextElementSibling.firstChild.nextElementSibling.textContent = `${info.item.progressNumbers}  |  ${info.item.speed}`;
				download.firstChild.nextElementSibling.firstChild.nextElementSibling.nextElementSibling.textContent = info.item.fileSize;
			},
			filename  : info => {
				const download = getById('downloads', info.id);
				download.firstChild.textContent = info.filename;
			}
		};

		controls.downloads.item = dce('div');
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
			down.appendChild(status);
			block.downloads.insertBefore(down, block.downloads.firstChild);
		};

		for (let i = 0, l = info.downloads.length; i < l; i++)
			insertDownload(info.downloads[i]);
	},

	rss : info => {

		messageHandler.rss = {
			createdFeed      : info =>  {
				insertFolders('rss', [info.feed]);
			},
			newItems         : info =>  {
				if (options.misc.rssMode === 'plain')
					insertItems.rss(info.items, 'date');
				else
					insertItems.rss(info.items, 'first');
			},
			rssReaded        : info =>  {
				const rssItem = getById('rss', info.id);
				if (rssItem !== false) {
					rssItem.classList.remove('unreaded');
					if (info.feedReaded === true)
						rssItem.parentNode.classList.remove('unreaded');
				}
			},
			rssReadedAll     : info =>  {
				const feed = getFolderById('rss', info.id);
				if (feed !== false) {
					feed.classList.remove('unreaded');
					for (let items = feed.children, i = items.length - 1; i >= 0; i--)
						items[i].classList.remove('unreaded');
				}
			},
			rssReadedAllFeeds : info => {
				for (let i = data.rss.length - 1; i >= 0; i--)
					data.rss[i].classList.remove('unreaded');
				for (let i = data.rssFolders.length - 1; i >= 0; i--)
					data.rssFolders[i].classList.remove('unreaded');
			},
			view             : info =>  {
				setView('rss', info.view, info.items, info.folders);
				setReadedMode(options.misc.rssHideReaded);
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
				if (feed !== false) {
					feed.firstChild.firstChild.textContent = info.title;
					feed.firstChild.title                  = info.description;
				}
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
			}
		};

		rootFolder              = dce('div');
		rootFolder.id           = 'rss-folder-0';
		const rootContent       = dce('div');
		rootFolder.appendChild(rootContent);

		controls.rss.item       = dce('div');
		controls.rss.item.classList.add('controls');
		makeButton('reload', 'rss', 'item');
		makeButton('markReaded', 'rss', 'item');
		makeButton('markReadedAll', 'rss', 'item');
		makeButton('hideReaded', 'rss', 'item');
		makeButton('showReaded', 'rss', 'item');
		makeButton('options', 'rss', 'item');

		controls.rss.bottom     = dce('div');
		controls.rss.bottom.classList.add('bottom-bar');
		makeButton('new', 'rss', 'bottom');
		makeButton('importExport', 'rss', 'bottom');
		makeButton('hideReadedAll', 'rss', 'bottom');
		makeButton('showReadedAll', 'rss', 'bottom');
		makeButton('markReadedAllFeeds', 'rss', 'bottom');
		makeButton('reloadAll', 'rss', 'bottom');
		makeButton('plain', 'rss', 'bottom');
		makeButton('domain', 'rss', 'bottom');

		block.rss.appendChild(rootFolder);
		block.rss.appendChild(controls.rss.item);
		block.rss.appendChild(controls.rss.bottom);

		block.rss.addEventListener('click', event => {
			event.preventDefault();
			event.stopPropagation();
			if (event.target.classList.contains('rss-item')) {
				openLink(event);
				send('background', 'rss', 'rssReaded', {'id': event.target.dataset.id});
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

		insertItems.rss = (items, method) => {
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
				item.addEventListener('mouseover', _ => {
					item.title = `${items[i].title}\n\n${items[i].description}`;
				},
				{'passive': true, 'once': true});
				if (items[i].readed)
					item.classList.add('item', 'rss-item', `domain-${items[i].domain}`);
				else {
					item.classList.add('item', 'rss-item', `domain-${items[i].domain}`, 'unreaded');
					folder.classList.add('unreaded');
				}
				insert[`${options.misc.rssMode}${method}`](item, items[i]);
			}
		};

		setView('rss', options.misc.rssMode, info.rss, info.rssFolders);
		setReadedMode(options.misc.rssHideReaded);
	},

	pocket : info => {

		messageHandler.pocket = {
			newItems     : info =>  {
				insertItems.pocket(info, 'first');
			},
			newFolder    : info => {
				insertFolders('pocket', [info]);
			},
			updated      : info => {
				const pocket = getById('pocket', info.id);
				if (pocket !== false)
					updateItem.pocket(pocket, info);
			},
			deleted      : info => {
				const pocket = getById('pocket', info);
				if (pocket !== false)
					removeById('pocket', info);
			},
			domainCount  : info => {
				const folder = getFolderById('pocket', info.id);
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
				setView('pocket', info.view, info.items, info.folders);
			},
			logout       : info => {
				if (options.sidebar.mode === 'pocket')
					block.pocket.classList[info.method]('logout');
				if (info.method === 'add') {
					rootFolder.removeChild(rootFolder.firstChild);
					const newContent = dce('div');
					rootFolder.appendChild(newContent);
				}
				else
					controls.pocket.user.firstChild.textContent = info.username;
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
				if (pocket !== false) {
					pocket.classList.add('type-archives');
					if (options.misc.pocketMode === 'type') {
						const archive = getFolderById('pocket', 'archives');
						if (archive !== false)
							archive.lastChild.appendChild(pocket);
					}
				}
			},
			unarchive   : info => {
				const pocket = getById('pocket', info.id);
				if (pocket !== false) {
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
				}
			}
		};

		if (options.pocket.auth === false)
			block.pocket.classList.add('logout');

		rootFolder              = dce('div');
		rootFolder.id           = 'pocket-folder-0';
		const rootContent       = dce('div');
		rootFolder.appendChild(rootContent);

		const loginContainer    = dce('div');
		const login             = makeItemButton('login', 'pocket');
		login.id                = 'login';
		controls.pocket.user    = dce('div');
		controls.pocket.user.id = 'user';
		controls.pocket.user.classList.add('controls');
		const username          = dce('a');
		username.id             = 'username';
		username.textContent    = info.username;
		controls.pocket.user.appendChild(username);
		makeButton('logout', 'pocket', 'user');
		loginContainer.appendChild(login);
		loginContainer.appendChild(controls.pocket.user);
		controls.pocket.item    = dce('div');
		controls.pocket.item.classList.add('controls');
		makeButton('fav', 'pocket', 'item');
		makeButton('unfav', 'pocket', 'item');
		makeButton('archive', 'pocket', 'item');
		makeButton('unarchive', 'pocket', 'item');
		makeButton('delete', 'pocket', 'item');
		controls.pocket.bottom  = dce('div');
		controls.pocket.bottom.classList.add('bottom-bar');
		makeButton('new', 'pocket', 'bottom');
		makeButton('plain', 'pocket', 'bottom');
		makeButton('type', 'pocket', 'bottom');
		makeButton('domain', 'pocket', 'bottom');
		makeButton('reload', 'pocket', 'bottom');

		block.pocket.appendChild(loginContainer);
		block.pocket.appendChild(rootFolder);
		block.pocket.appendChild(controls.pocket.bottom);
		block.pocket.appendChild(controls.pocket.item);

		block.pocket.addEventListener('mouseover', event => {
			event.stopPropagation();
			const target = event.target;
			if (target.classList.contains('pocket'))
				target.appendChild(controls.pocket.item);
		});

		block.pocket.addEventListener('click', event => {
			event.stopPropagation();
			event.preventDefault();
			const target = event.target;
			if (target.classList.contains('pocket'))
				openLink(event);
		});

		updateItem.pocket  = (pocket, info) => {
			let classList      = `pocket item ${info.favorite === true ? 'favorite ' : ''} domain-${info.domain} type-${info.type}`;
			pocket.href        = info.url;
			pocket.dataset.url = info.url;
			pocket.textContent = info.title;
			pocket.classList   = classList;
			pocket.title       = info.description !== '' ? info.description : info.url;
		};

		insertItems.pocket = (items, position = 'last') => {
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
				updateItem.pocket(pocket, items[i]);
				if (options.misc.pocketMode !== 'plain') {
					if (items[i][options.misc.pocketMode] !== pid) {
						pid    = items[i][options.misc.pocketMode];
						folder = getFolderById('pocket', items[i][options.misc.pocketMode]);
					}
				}
				insert[position](pocket);
			}
		};

		setView('pocket', options.misc.pocketMode, info.pocket, info.pocketFolders);
		if (options.pocket.auth === false)
			block.pocket.classList.add('logout');
	}
};

///------------------------------------------------------------------///
//                     Commons Block
///------------------------------------------------------------------///

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

function setReadedMode(mode) {
	options.misc.rssHideReaded = mode;
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

function blockInit(newMode, info) {
	const cleanse = _ => {
		while (block[options.sidebar.mode].hasChildNodes())
			block[options.sidebar.mode].removeChild(block[options.sidebar.mode].firstChild);
		clearData(options.sidebar.mode);
		block[options.sidebar.mode].classList.remove('search-active');
	};

	if (status.init[newMode] === false) {
		i18n[newMode] = info.i18n;
		const link    = dce('link');
		link.type     = 'text/css';
		link.rel      = 'stylesheet';
		link.href     = `sidebar-${newMode}.css`;
		document.head.appendChild(link);
		status.init[newMode] = true;
	}
	if (options.sidebar.mode !== newMode) {
		initBlock[newMode](info);
		if (options.sidebar.mode)
			cleanse();
	}
	else {
		cleanse();
		initBlock[newMode](info);
	}
	document.body.classList = newMode;
	options.sidebar.mode    = newMode;
	status.activeBlock      = block[newMode];
}

function enableBlock(mode) {
	button[mode].classList.remove('hidden');
	if (mode === 'rss') {
		const unreaded  = dce('div');
		unreaded.id     = 'rss-unreaded';
		button.rss.appendChild(unreaded);
	}
}

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
				});
				doc.addEventListener('mouseover', event => {
					send('background', 'sidebar', 'sideDetection',{'sender': 'sidebar', 'action': 'over', 'side': (event.x < doc.offsetWidth) ? 'rightBar' : 'leftBar'});
				});
			}
		}

		initSidebar(response);
	});
}

function initSidebar(response) {
	const onMessage = (message, sender, sendResponse) => {
		// console.log(message);
		if (message.hasOwnProperty('target')) {
			if (message.target === 'sidebar')
				messageHandler[message.subject][message.action](message.data, sendResponse);
			else if (message.target === status.side)
				messageHandler[message.subject][message.action](message.data, sendResponse);
		}
	};

	brauzer.runtime.onMessage.removeListener(onMessage);

	status.side                  = response.side;
	options.misc                 = response.options.misc;
	options.theme                = response.options.theme;
	options.warnings             = response.options.warnings;
	options.sidebar              = response.options.sidebar;
	options.pocket               = response.options.pocket;
	i18n.header                  = response.i18n.header;
	status.info                  = response.info;

	setFontSize();
	setColor(options.theme);

	doc.style.backgroundImage = `url(${options.theme.sidebarImage})`;

	for (let service in response.options.services) {
		if (button[service] === null)
			button[service] = makeButton(service, 'header', 'sidebar');
		if (response.options.services[service] === true)
			enableBlock(service);
		else
			button[service].classList.add('hidden');
	}

	setRssUnreaded(status.info.rssUnreaded);
	setDownloadStatus[status.info.downloadStatus]();

	if (options.sidebar.method === 'iframe') {
		doc.classList.remove('fixed');
		window.onresize              = _ => {setFontSize();};
		if (controls.header.iframe === null) {
			controls.header.iframe       = dce('div');
			controls.header.iframe.id    = 'controls-sidebar';
			makeButton('pin', 'header', 'iframe');
			makeButton('unpin', 'header', 'iframe');
			makeButton('wide', 'header', 'iframe');
			makeButton('narrow', 'header', 'iframe');
			controls.header.main.appendChild(controls.header.iframe);
		}
		setWide(options.sidebar.wide);
		setFixed(options.sidebar.fixed);
	}

	setDomainStyle.rewrite(response.domains);
	blockInit(options.sidebar.mode, response.data);

	brauzer.runtime.onMessage.addListener(onMessage);
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
		data[`${mode}Folders`][index].classList = classList;
		data[`${mode}Folders`][index].id        = `${mode}-folder-${items[i].id}`;
		if (fake === false) {
			const title       = dce('div');
			const text        = document.createTextNode(items[i].title || String.fromCharCode(0x00a0));
			title.title       = items[i].description || items[i].title;
			title.dataset.id  = items[i].id;
			title.classList.add('folder-name', `domain-${items[i].domain}`);
			title.appendChild(text);
			data[`${mode}Folders`][index].appendChild(title);
			title.addEventListener('click', event => {
				event.preventDefault();
				event.stopPropagation();
				const folded = status.moving === true ? false : !title.parentNode.classList.contains('folded');
				send('background', 'set', 'fold', {'mode': mode, 'id': items[i].id, 'folded': folded, 'method': folded ? 'add' : 'remove'});
			});
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

function setStyle(item) {
	const style       = createById('domains', item.id);
	style.textContent = `.domain-${item.id}{background-image: url(${item.fav})}`;
	document.head.appendChild(style);
}

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

const insertItems = {};

const updateItem = {};

function setView(mode, view, items, folders) {
	options.misc[`${mode}Mode`] = view;
	block[mode].classList       = `block ${view}`;
	while (rootFolder.firstChild.hasChildNodes())
		rootFolder.firstChild.removeChild(rootFolder.firstChild.firstChild);
	clearData(mode);
	if (view !== 'plain')
		insertFolders(mode, folders, view === 'tree' ? true : false);
	insertItems[mode](items, 'first');
}

function createById(mode, id, search = false) {
	const item      = dce(element[mode]);
	item.id         = (search === true) ? `search-${mode}-${id}` : `${mode}-${id}`;
	item.dataset.id = id;
	data[mode].push(item);
	data[`${mode}Id`].push(id);
	return item;
}

function getById(mode, id) {
	const index = data[`${mode}Id`].indexOf(id);
	if (index !== -1)
		return data[mode][index];
	else
		return false;
}

function removeById(mode, id) {
	const index = data[`${mode}Id`].indexOf(id);
	if (index !== -1) {
		data[mode][index].parentNode.removeChild(data[mode][index]);
		data[mode].splice(index, 1);
		data[`${mode}Id`].splice(index, 1);
	}
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
	if (index !== -1) {
		data[`${mode}Folders`][index].parentNode.removeChild(data[`${mode}Folders`][index]);
		data[`${mode}Folders`].splice(index, 1);
		data[`${mode}FoldersId`].splice(index, 1);
	}
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
	if (event.target.id === status.lastClicked.id)
		if (Date.now() - status.lastClicked.time < 1000)
			return;
	if (event.ctrlKey)
		send('background', 'tabs', 'new', {'url': event.target.href});
	else if (event.shiftKey)
		send('background', 'tabs', 'new', {'url': event.target.href, 'newWindow': true});
	else
		send('background', 'tabs', 'update', {'url': event.target.href});
	status.lastClicked = {
		id   : event.target.id,
		time : Date.now()
	};
}

function makeBlock(type) {
	const block = dce('div');
	block.id    = type;
	block.classList.add('block');
	document.body.appendChild(block);
	return block;
}

function makeButton(type, block, sub) {
	const button     = dce('span');
	button.id        = `${block}-${type}`;
	button.classList = 'button';
	button.title     = i18n[block][type];
	const icon       = dce('span');
	icon.style.setProperty(mask, `url('icons/${type}.svg')`);
	button.appendChild(icon);
	controls[block][sub].appendChild(button);
	button.addEventListener('click', buttonsEvents[block][type]);
	return button;
}

function makeItemButton(type, block) {
	const item       = dce('span');
	item.title       = i18n[block][`${type}Title`];
	item.id          = `${block}-${type}`;
	item.classList.add('item-button');
	item.addEventListener('click', buttonsEvents[block][type]);
	if (i18n[block][`${type}Text`] !== '')
		item.textContent = i18n[block][`${type}Text`];
	else {
		const button     = dce('span');
		button.classList.add('button');
		item.appendChild(button);
		const icon       = dce('span');
		button.appendChild(icon);
	}
	return item;
}

const buttonsEvents = {
	header    : {
		tabs : event => {
			event.stopPropagation();
			event.preventDefault();
			if (options.sidebar.mode !== 'tabs')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'tabs'});
		},
		bookmarks : event => {
			event.stopPropagation();
			event.preventDefault();
			if (options.sidebar.mode !== 'bookmarks')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'bookmarks'});
		},
		history : event => {
			event.stopPropagation();
			event.preventDefault();
			if (options.sidebar.mode !== 'history')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'history'});
		},
		downloads : event => {
			event.stopPropagation();
			event.preventDefault();
			if (options.sidebar.mode !== 'downloads')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'downloads'});
		},
		rss : event => {
			event.stopPropagation();
			event.preventDefault();
			if (options.sidebar.mode !== 'rss')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'rss'});
		},
		pocket : event => {
			event.stopPropagation();
			event.preventDefault();
			if (options.sidebar.mode !== 'pocket')
				send('background', 'options', 'handler', {'section': status.side, 'option': 'mode', 'value': 'pocket'});
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
			if (options.warnings.domainFolderClose === true)
				send('background', 'dialog', 'domainFolderClose', {'id': controls.tabs.item.parentNode.dataset.id});
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
			if (options.misc.tabsMode !== 'plain')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'tabsMode', 'value': 'plain'});
		},
		domain: event => {
			event.stopPropagation();
			event.preventDefault();
			if (options.misc.tabsMode !== 'domain')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'tabsMode', 'value': 'domain'});
		},
		tree: event => {
			event.stopPropagation();
			event.preventDefault();
			if (options.misc.tabsMode !== 'tree')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'tabsMode', 'value': 'tree'});
		}
	},
	bookmarks : {
		move : event => {

			const mouseover = event => {
				event.stopPropagation();
				event.preventDefault();
				const target = event.target;
				if (target.parentNode === item)
					return;
				if (target.classList.contains('bookmark'))
					target.parentNode.insertBefore(item, target);
				else if (target.classList.contains('folder-name')) {
					target.nextElementSibling.appendChild(item);
					if (target.parentNode.classList.contains('folded'))
						target.click();
				}
				else if (target.classList.contains('folder'))
					target.lastChild.appendChild(item);
			};

			const keydown = event => {
				if (event.key === 'Escape') {
					finilize();
					status.moving = false;
					if (folder !== item.parentNode)
						folder.lastChild.insertBefore(item, folder.children[index]);
					else if (index >= folder.children.length - 1)
						folder.lastChild.appendChild(item);
					else {
						let newindex  = -1;
						for (let i = 0, l = folder.lastChild.children.length; i < l; i++)
							if (folder.lastChild.children[i] === item) {
								newindex = i;
								break;
							}
						const k = newindex < index ? 1 : 0;
						folder.lastChild.insertBefore(item, folder.lastChild.children[index + k]);
					}
				}
			};

			const mousedown = event => {
				event.stopPropagation();
				event.preventDefault();
				let newindex  = 0;
				for (let i = 0, l = item.parentNode.children.length; i < l; i++)
					if (item.parentNode.children[i] === item) {
						newindex = i;
						break;
					}
				finilize();
				send('background', 'bookmarks', 'move', {'id': id, 'pid': item.parentNode.previousElementSibling.dataset.id, 'index': newindex, 'isFolder': isFolder});
			};

			const finilize = _ => {
				block.bookmarks.removeEventListener('mouseover', mouseover);
				doc.removeEventListener('keydown', keydown);
				doc.removeEventListener('mousedown', mousedown);
				item.classList.remove('moved');
				rootFolder.classList.remove('moving');
			};

			event.stopPropagation();
			event.preventDefault();

			status.moving = true;
			let isFolder  = false;
			let item      = event.target.parentNode.parentNode.parentNode;
			const id      = item.dataset.id;
			if (item.classList.contains('folder-name')) {
				isFolder = true;
				item     = item.parentNode;
			}
			const folder  = item.parentNode;
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
			if (options.warnings.bookmarkDelete === true)
				send('background', 'dialog', 'bookmarkDelete', {'id': target.dataset.id, 'title': target.textContent});
			else
				send('background', 'bookmarks', 'bookmarkDelete', {'id': target.dataset.id});
		},
		deleteFolder : event => {
			event.stopPropagation();
			event.preventDefault();
			const target = controls.bookmarks.item.parentNode;
			if (options.warnings.bookmarkFolderDelete)
				send('background', 'dialog', 'bookmarkFolderDelete', {'id': target.dataset.id, 'title': target.textContent});
			else
				send('background', 'bookmarks', 'bookmarkFolderDelete', {'id': target.dataset.id});
		},
		bookmarkThis : event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'dialog', 'bookmarkNew', '');
		},
		edit : event => {
			event.stopPropagation();
			event.preventDefault();
			const target = controls.bookmarks.item.parentNode;
			if (target.nodeName === 'DIV')
				send('background', 'dialog', 'bookmarkFolderEdit', {'id': target.dataset.id});
			else
				send('background', 'dialog', 'bookmarkEdit', {'id': target.dataset.id});
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
			send('background', 'dialog', 'rssNew');
		},
		importExport: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'dialog', 'rssImportExport');
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
			send('background', 'dialog', 'rssFeedEdit', {'id': folderTitle.dataset.id, 'title': folderTitle.textContent.trim(), 'description': folderTitle.title});
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
		markReaded: event => {
			event.stopPropagation();
			event.preventDefault();
			const rss  = controls.rss.item.parentNode;
			const feed = rss.parentNode.firstChild;
			send('background', 'rss', 'rssReaded', {'id': rss.dataset.id});
		},
		markReadedAll: event => {
			event.stopPropagation();
			event.preventDefault();
			const feed = controls.rss.item.parentNode;
			send('background', 'rss', 'rssReadedAll', {'id': feed.dataset.id});
		},
		markReadedAllFeeds: event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'rss', 'rssReadedAllFeeds');
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
			send('background', 'dialog', 'rssItemDelete', {'id': item.dataset.id, 'title': item.textContent});
		},
		plain: event => {
			event.stopPropagation();
			event.preventDefault();
			if (options.misc.rssMode !== 'plain')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'rssMode', 'value': 'plain'});
		},
		domain: event => {
			event.stopPropagation();
			event.preventDefault();
			if (options.misc.rssMode !== 'domain')
				send('background', 'options', 'handler', {'section': 'misc', 'option': 'rssMode', 'value': 'domain'});
		}
	},
	pocket    : {
		login : event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'pocket', 'login');
		},
		logout : event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'pocket', 'logout');
		},
		new : event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'dialog', 'pocketNew');
		},
		plain : event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'options', 'handler', {'section': 'misc', 'option': 'pocketMode', 'value': 'plain'});
		},
		type : event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'options', 'handler', {'section': 'misc', 'option': 'pocketMode', 'value': 'type'});
		},
		domain : event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'options', 'handler', {'section': 'misc', 'option': 'pocketMode', 'value': 'domain'});
		},
		reload : event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'pocket', 'reloadAll');
		},
		fav : event => {
			event.stopPropagation();
			event.preventDefault();
			const target = event.target.parentNode.parentNode.parentNode;
			send('background', 'pocket', 'fav', target.dataset.id);
		},
		unfav : event => {
			event.stopPropagation();
			event.preventDefault();
			const target = event.target.parentNode.parentNode.parentNode;
			send('background', 'pocket', 'unfav', target.dataset.id);
		},
		archive : event => {
			event.stopPropagation();
			event.preventDefault();
			const target = event.target.parentNode.parentNode.parentNode;
			send('background', 'pocket', 'archive', target.dataset.id);
		},
		unarchive : event => {
			event.stopPropagation();
			event.preventDefault();
			const target = event.target.parentNode.parentNode.parentNode;
			send('background', 'pocket', 'unarchive', target.dataset.id);
		},
		delete : event => {
			event.stopPropagation();
			event.preventDefault();
			const target = event.target.parentNode.parentNode.parentNode;
			if (options.warnings.pocketDelete === true)
				send('background', 'dialog', 'pocketDelete', target.dataset.id);
			else
				send('background', 'pocket', 'delete', target.dataset.id);
		}
	}
};

function dce(element) {
	return document.createElement(element);
}

})();