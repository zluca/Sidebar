(function() {

'use strict';

const firefox     = typeof InstallTrigger !== 'undefined' ? true : false;
const opera       = window.hasOwnProperty('opr')          ? true : false;
const brauzer     = firefox ? browser : chrome;
const version     = brauzer.runtime.getManifest().version;

const execMethod  = firefox ?
(method, callback, options) => {
	return method(options).then(callback);
} :
(method, callback, options) => {
	return options === undefined ? method(callback) : method(options, callback);
};

const sidebarAction =
	firefox ?
		browser.hasOwnProperty('sidebarAction') ?
			browser.sidebarAction : null
	: opera ?
		opr.hasOwnProperty('sidebarAction') ?
			opr.sidebarAction : null
	: null;

const i18n = {
	notification: {
		rssNewFeedErrorTitle       : getI18n('notificationRssNewFeedErrorTitle'),
		rssNewFeedErrorText        : getI18n('notificationRssNewFeedErrorText'),
		rssFeedExistErrorTitle     : getI18n('notificationRssFeedExistErrorTitle'),
		rssFeedExistErrorText      : getI18n('notificationRssFeedExistErrorText')
	},
	startpage: {
		pageTitle                   : getI18n('startpagePageTitle'),
		addNewSiteTitle             : getI18n('startpageAddNewSiteTitle'),
		editButtonTitle             : getI18n('startpageEditButtonTitle'),
		searchPlaceholder           : getI18n('startpageSearchPlaceholder'),
		translatePlaceholder        : getI18n('startpageTranslatePlaceholder'),
		buyPlaceholder              : getI18n('startpageBuyPlaceholder'),
		searchButtonTitle           : getI18n('startpageSearchButtonTitle'),
		searchEngineDuckDuckGo      : getI18n('startpageDuckDuckGoLabel'),
		searchEngineGoogle          : getI18n('startpageGoogleLabel'),
		searchEngineYandex          : getI18n('startpageYandexLabel'),
		searchEngineBing            : getI18n('startpageBingLabel'),
		searchEngineYahoo           : getI18n('startpageYahooLabel'),
		searchEngineWikipedia       : getI18n('startpageWikipediaLabel'),
		searchEngineMdn             : getI18n('startpageMdnLabel'),
		searchEngineStackoverflow   : getI18n('startpageStackoverflowLabel'),
		searchEngineAmazon          : getI18n('startpageAmazonLabel'),
		searchEngineEbay            : getI18n('startpageEbayLabel'),
		searchEngineAliexpress      : getI18n('startpageAliexpressLabel'),
		searchEngineGoogleTranslate : getI18n('startpageGoogleTranslateLabel'),
		searchEngineYandexTranslate : getI18n('startpageYandexTranslateLabel')
	},
	domains: {
		default   : getI18n('domainsDefault'),
		startpage : getI18n('domainsStartPage'),
		system    : getI18n('domainsSystem'),
		extension : getI18n('domainsExtension')
	},
	header: {
		wide      : getI18n('sbControlsWideTitle'),
		narrow    : getI18n('sbControlsNarrowTitle'),
		pin       : getI18n('sbControlsFixedTitle'),
		unpin     : getI18n('sbControlsUnfixedTitle'),
		tabs      : getI18n('sbControlsTabsTitle'),
		bookmarks : getI18n('sbControlsBookmarksTitle'),
		history   : getI18n('sbControlsHistoryTitle'),
		downloads : getI18n('sbControlsDownloadsTitle'),
		rss       : getI18n('sbControlsRssTitle')
	},
	tabs        : {},
	bookmarks   : {},
	history     : {},
	downloads   : {},
	rss         : {}
};

const data = {
	tabs               : [],
	tabsId             : [],
	tabsFolders        : [],
	tabsFoldersId      : [],
	activeTabId        : -1,
	bookmarks          : [],
	bookmarksId        : [],
	bookmarksFolders   : [],
	bookmarksFoldersId : [],
	history            : [],
	historyId          : [],
	historyFolders     : [],
	historyFoldersId   : [],
	historyLastTime    : Date.now(),
	historyEnd         : false,
	downloads          : [],
	downloadsId        : [],
	rss                : [],
	rssId              : [],
	rssFolders         : [],
	rssFoldersId       : [],
	domains            : [],
	domainsId          : [],
	favs               : [],
	favsId             : [],
	speadDial          : [],
	info               : {
		rssUnreaded    : 0,
		downloadStatus : 'idle',
		downloadsCount : 0
	},
	init               : {
		'startpage' : false,
		'favs'      : false,
		'tabs'      : false,
		'bookmarks' : false,
		'history'   : false,
		'downloads' : false,
		'rss'       : false
	},
	initDone        : false,
	extensionUrl    : brauzer.extension.getURL('/'),
	defaultStartPage: firefox ? `${brauzer.extension.getURL('/')}startpage.html` : opera ? 'chrome://startpage/' : 'chrome://newtab/',
	defaultIcon     : 'icons/default.svg',
	systemIcon      : 'icons/wrench.svg',
	startpageIcon   : 'icons/startpage.svg',
	rssIcon         : 'icons/rss.svg',
	leftBar         : {
		windowId      : -1,
		tabId         : -1
	},
	rightBar        : {
		windowId      : -1,
		tabId         : -1
	},
	activeWindow    : -1,
	dialogData      : null,
	dialogType      : ''
};

const optionsHandler = {
	method : (section, option, newValue) => {
		const oldValueHandler = {
			iframe   : _ => {
				send('content', 'iframe', 'remove', {'side': section});
			},
			native   : _ => {},
			window   : _ => {
				removeSidebarWindow(section);
			},
			disabled : _ => {},
		};
		const newValueHandler = {
			iframe   : _ => {
				send('content', 'iframe', 'add', {'side': section, 'width': options[section].width.value});},
			native   : _ => {
				send('sidebar', 'set', 'side', section);
			},
			window   : _ => {
				createSidebarWindow(section);
			},
			disabled : _ => {},
		};
		oldValueHandler[options[section].method.value]();
		newValueHandler[newValue]();
		setOption(section, 'method', newValue);
		setIcon();
	},
	mode : (section, option, newValue) => {
		setOption(section, 'mode', newValue);
		send(section, 'options', 'mode', {value: newValue, data: modeData[newValue]()});
	},
	service: (section, option, newValue) => {
		if (newValue) {
			init[option](true);
			send('sidebar', 'options', 'services', {'service': option, 'enabled': true});
		}
		else {
			const firstEnabledService = side => {
				for (let services = ['tabs', 'bookmarks', 'history', 'downloads', 'rss'], i = services.length - 1; i >= 0; i--) {
					if (options.services[services[i]].value && services[i] !== option) {
						setOption(side, 'mode', services[i]);
						send(side, 'options', 'mode', {value: services[i], data: modeData[services[i]]()});
						break;
					}
				}
			};
			if (options.leftBar.mode.value === option)
				firstEnabledService('leftBar');
			if (options.rightBar.mode.value === option)
				firstEnabledService('rightBar');
			init[option](false);
			send('sidebar', 'options', 'services', {'service': option, 'enabled': false});
		}
		brauzer.storage.local.set({'options': options});
	},
	sites: (section, option, newValue) => {
		const oppositeDimension = {
			rows    : 'columns',
			columns : 'rows'
		};
		const change = options.startpage[option].value - newValue;
		if (change < 0) {
			const oldLength = options.startpage[option].value * options.startpage[oppositeDimension[option]].value;
			const newLength = newValue * options.startpage[oppositeDimension[option]].value;
			send('startpage', 'site', 'addSites', {'sites': data.speadDial.slice(oldLength, newLength)});
		}
		else
			send('startpage', 'site', 'remove', '');
	},
	view: (section, option, newValue) => {
		const mode = option.replace('Mode', '');
		if (options.leftBar.mode.value === mode)
			send('leftBar', mode, 'view', {view: newValue, items: data[mode], folders: data[`${mode}Folders`]});
		if (options.rightBar.mode.value === mode)
			send('rightBar', mode, 'view', {view: newValue, items: data[mode], folders: data[`${mode}Folders`]});
	}
};

const options = {
	leftBar: {
		method : {
			value   : 'disabled',
			type    : 'select',
			values  : ['iframe', 'window', 'disabled'],
			targets : [],
			hidden  : true,
			handler : 'method'
		},
		width  : {
			value   : 15,
			type    : 'float',
			range   : [5, 40],
			targets : ['leftBar' ,'content']
		},
		fixed  : {
			value   : false,
			type    : 'boolean',
			targets : ['leftBar' ,'content']
		},
		wide   : {
			value   : true,
			type    : 'boolean',
			targets : ['leftBar' ,'content']
		},
		mode   : {
			value   : 'bookmarks',
			type    : 'select',
			values  : ['tabs', 'bookmarks', 'history', 'downloads', 'rss'],
			targets : [],
			handler : 'mode'
		},
		hidden : {}
	},
	rightBar: {
		method : {
			value   : 'iframe',
			type    : 'select',
			values  : ['iframe', 'window', 'disabled'],
			targets : [],
			hidden  : true,
			handler : 'method'
		},
		width  : {
			value   : 15,
			type    : 'float',
			range   : [5, 40],
			targets : ['rightBar' ,'content']
		},
		fixed  : {
			value   : false,
			type    : 'boolean',
			targets : ['rightBar' ,'content']
		},
		wide   : {
			value   : true,
			type    : 'boolean',
			targets : ['rightBar' ,'content']
		},
		mode   : {
			value   : 'bookmarks',
			type    : 'select',
			values  : ['tabs', 'bookmarks', 'history', 'downloads', 'rss'],
			targets : [],
			handler : 'mode'
		},
		hidden : {}
	},
	services: {
		startpage : {
			value   : true,
			type    : 'boolean',
			targets : [],
			hidden  : true
		},
		favs      : {
			value   : true,
			type    : 'boolean',
			targets : [],
			hidden  : true
		},
		tabs      : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'service'
		},
		bookmarks : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'service'
		},
		history   : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'service'
		},
		downloads : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'service'
		},
		rss       : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'service'
		}
	},
	warnings: {
		deleteBookmark       : {
			value   : true,
			type    : 'boolean',
			targets : ['sidebar']
		},
		deleteBookmarkFolder : {
			value   : true,
			type    : 'boolean',
			targets : ['sidebar']
		},
		deleteSite           : {
			value   : true,
			type    : 'boolean',
			targets : ['startpage']
		},
		deleteRssFeed        : {
			value   : true,
			type    : 'boolean',
			targets : ['sidebar']
		},
		closeDomainFolder    : {
			value   : true,
			type    : 'boolean',
			targets : ['sidebar']
		}
	},
	theme: {
		fontSize              : {
			value   : 16,
			type    : 'float',
			range   : [5, 32],
			targets : ['sidebar' ,'content', 'startpage']
		},
		backgroundColor       : {
			value   : '#fafafa',
			type    : 'color',
			targets : ['sidebar' ,'startpage']
		},
		backgroundColorActive : {
			value   : '#e3ecf1',
			type    : 'color',
			targets : ['sidebar' ,'startpage']
		},
		fontColor             : {
			value   : '#444444',
			type    : 'color',
			targets : ['sidebar' ,'startpage']
		},
		fontColorActive       : {
			value   : '#000000',
			type    : 'color',
			targets : ['sidebar' ,'startpage']
		},
		fontColorInactive     : {
			value   : '#999999',
			type    : 'color',
			targets : ['sidebar' ,'startpage']
		},
		borderColor           : {
			value   : '#eeeeee',
			type    : 'color',
			targets : ['sidebar' ,'startpage', 'content']
		},
		borderColorActive     : {
			value   : '#cccccc',
			type    : 'color',
			targets : ['sidebar' ,'startpage', 'content']
		},
		sidebarImage   : {
			value   : '',
			type    : 'image',
			targets : ['sidebar']
		},
		startpageImage : {
			value   : '',
			type    : 'image',
			targets : ['startpage']
		}
	},
	misc: {
		limitHistory       : {
			value   : 50,
			type    : 'integer',
			range   : [10, 999],
			targets : ['sidebar']
		},
		maxSavedRssPerFeed : {
			value   : 99,
			type    : 'integer',
			range   : [10, 999],
			targets : ['sidebar']
		},
		rssUpdatePeriod    : {
			value   : 60,
			type    : 'integer',
			range   : [20, 999],
			targets : ['sidebar']
		},
		rssHideReaded      : {
			value   : false,
			type    : 'boolean',
			targets : ['sidebar'],
			hidden  : true
		},
		tabsMode           : {
			value   : 'domain',
			type    : 'select',
			values  : ['plain', 'domain', 'tree'],
			targets : [],
			handler : 'view',
			hidden  : true
		},
		rssMode            : {
			value   : 'domain',
			type    : 'select',
			values  : ['plain', 'domain'],
			targets : [],
			handler : 'view',
			hidden  : true
		}
	},
	startpage: {
		rows           : {
			value   : 3,
			type    : 'integer',
			range   : [1, 15],
			targets : ['startpage'],
			handler : 'sites'
		},
		columns        : {
			value   : 3,
			type    : 'integer',
			range   : [1, 20],
			targets : ['startpage'],
			handler : 'sites'
		},
		marginV        : {
			value   : 60,
			type    : 'float',
			range   : [0, 99],
			targets : ['startpage']
		},
		marginH        : {
			value   : 30,
			type    : 'float',
			range   : [0, 99],
			targets : ['startpage']
		},
		padding        : {
			value   : 60,
			type    : 'float',
			range   : [0, 160],
			targets : ['startpage']
		},
		searchEnabled  : {
			value   : true,
			type    : 'boolean',
			targets : ['startpage']
		},
		searchEngine   : {
			value   : 'duckduckgo',
			type    : 'select',
			hidden  : true,
			values  : ['duckduckgo', 'google', 'yandex', 'bing', 'yahoo', 'wikipedia', 'mdn', 'stackoverflow', 'amazon', 'ebay', 'aliexpress', 'googleTranslate', 'yandexTranslate'],
			targets : ['startpage']
		},
		wikiSearchLang : {
			value   : 'en',
			type    : 'text',
			targets : ['startpage']
		},
		translateFrom  : {
			value   : 'en',
			type    : 'text',
			targets : ['startpage']
		},
		translateTo    : {
			value   : 'en',
			type    : 'text',
			targets : ['startpage']
		}
	}
};

const optionsShort = {};

const modeData = {
	tabs       : _ => {
		return {
			mode           : 'tabs',
			i18n           : i18n.tabs,
			tabs           : data.tabs,
			tabsFolders    : data.tabsFolders,
			activeTabId    : data.activeTabId
		};
	},
	bookmarks  : _ => {
		return {
			mode             : 'bookmarks',
			i18n             : i18n.bookmarks,
			bookmarks        : data.bookmarks,
			bookmarksFolders : data.bookmarksFolders,
			activeTabId      : data.activeTabId
		};
	},
	history    : _ => {
		return {
			mode             : 'history',
			i18n             : i18n.history,
			history          : data.history,
			historyEnd       : data.historyEnd,
			historyFolders   : data.historyFolders
		};
	},
	downloads  : _ => {
		return {
			mode             : 'downloads',
			i18n             : i18n.downloads,
			downloads        : data.downloads,
		};
	},
	rss        : _ => {
		return {
			mode             : 'rss',
			i18n             : i18n.rss,
			rss              : data.rss,
			rssFolders       : data.rssFolders
		};
	}
};

const defaultTabsHandler = {
	new : (message, sender, sendResponse) => {
		const newUrl = message.data.url === '' ? data.defaultStartPage : message.data.url;
		if (message.data.newWindow)
			brauzer.windows.create({url: newUrl});
		else
			brauzer.tabs.create({url: newUrl});
	},
	update : (message, sender, sendResponse) => {
		brauzer.tabs.update(data.activeTabId, {'url': message.data.url});
	}
};

const messageHandler = {

	request : {
		status : (message, sender, sendResponse) => {
			sendResponse({
				'leftBar'           : optionsShort.leftBar,
				'rightBar'          : optionsShort.rightBar,
				'fontSize'          : optionsShort.theme.fontSize,
				'borderColor'       : optionsShort.theme.borderColor,
				'borderColorActive' : optionsShort.theme.borderColorActive
			});
			if (data.dialogData)
				sendToTab(sender.tab.id, 'content', 'dialog', 'create', data.dialogType);
		},
		mode : (message, sender, sendResponse) => {
			const handler = {
				window: side => {
					data[side].tabId = sender.tab.id;
					sendResponse(sideBarData(side));
					return true;
				},
				native: side => {
					let trueSide = side;
					const oppositeSide = {
						'leftBar'  : 'rightBar',
						'rightBar' : 'leftBar'
					};
					if (firefox) {
						if (options[side].method.value !== 'native')
							if (options[oppositeSide[side]].method.value === 'native')
								trueSide = oppositeSide[side];
							else
								optionsHandler.method(side, 'method', 'native');
					}
					sendResponse(sideBarData(trueSide));
					return true;
				},
				iframe: side => {
					sendResponse(sideBarData(side));
					return true;
				}
			};
			handler[message.data.method](message.data.side);
		},
		startpage : (message, sender, sendResponse) => {
			sendResponse({
				'sites'     : data.speadDial.slice(0, options.startpage.rows.value * options.startpage.columns.value),
				'startpage' : optionsShort.startpage,
				'theme'     : optionsShort.theme,
				'i18n'      : i18n.startpage,
			});
		},
		options : (message, sender, sendResponse) => {
			sendResponse(options);
		},
		popup : (message, sender, sendResponse) => {
			sendResponse({'leftBar': options.leftBar.method, 'rightBar': options.rightBar.method});
		},
		dialog : (message, sender, sendResponse) => {
			sendResponse({data: data.dialogData, warnings: optionsShort.warnings, theme: optionsShort.theme});
			data.dialogData = null;
		}
	},

	options : {
		handler: (message, sender, sendResponse) => {
			const section  = message.data.section;
			const option   = message.data.option;
			const value    = message.data.value;
			if (options[section][option].hasOwnProperty('handler'))
				optionsHandler[options[section][option].handler](section, option, value);
			setOption(section, option, value);
			for (let i = options[section][option].targets.length - 1; i >= 0; i--)
				send(options[section][option].targets[i], 'options', option, {'section': section, 'option': option, value: value});
		},
	},

	set : {
		fold : (message, sender, sendResponse) => {
			const folder = getFolderById(message.data.mode, message.data.id);
			if (folder) {
				folder.folded = message.data.folded;
				brauzer.storage.local.set({'data': data});
				send('sidebar', 'set', 'fold', message.data);
			}
		},
		hover : (message, sender, sendResponse) => {
			send(message.data.side, 'set', 'hover', message.data.hover);
			sendResponse('done');
		}
	},

	dialog : {
		siteCreate : (message, sender, sendResponse) => {
			createDialogWindow(message.action, message.data);
		},
		siteChange : (message, sender, sendResponse) => {
			const site = data.speadDial[message.data.index];
			createDialogWindow(message.action, {
				index : message.data.index,
				url   : site.url,
				text  : site.text,
				color : site.color
			});
		},
		siteDelete : (message, sender, sendResponse) => {
			createDialogWindow(message.action, message.data);
		},
		closeDomainFolder : (message, sender, sendResponse) => {
			const folder = getFolderById('tabs', message.data.id);
			createDialogWindow(message.action, {id: message.data.id, title: folder.title});
		},
		bookmarkDelete : (message, sender, sendResponse) => {
			createDialogWindow(message.action, message.data);
		},
		bookmarkFolderDelete : (message, sender, sendResponse) => {
			createDialogWindow(message.action, message.data);
		},
		newBookmark : (message, sender, sendResponse) => {
			const activeTab = getById('tabs', data.activeTabId);
			if (activeTab) {
				const dataToSend = {
					'id'      : data.activeTabId,
					'url'     : activeTab.url,
					'title'   : activeTab.title,
					'folders' : data.bookmarksFolders
				};
				createDialogWindow(message.action, dataToSend);
			}
		},
		editBookmark : (message, sender, sendResponse) => {
			const bookmark = getById('bookmarks', message.data.id);
			if (bookmark)
				createDialogWindow('editBookmark', {'id': message.data.id, 'url': bookmark.url,'title': bookmark.title});
		},
		editBookmarkFolder : (message, sender, sendResponse) => {
			const folder = getFolderById('bookmarks', message.data.id);
			if (folder)
				createDialogWindow('editBookmarkFolder', {'id': message.data.id, 'title': folder.title});
		},
		rssAdd : (message, sender, sendResponse) => {
			const activeTab = getById('tabs', data.activeTabId);
			if (activeTab)
				send('content', 'dialog', 'checkRss', '');
			else
				createDialogWindow(message.action, message.data);
		},
		rssUrlConfirmed : (message, sender, sendResponse) => {
			createDialogWindow('rssAdd', message.data);
		},
		rssEditFeed : (message, sender, sendResponse) => {
			createDialogWindow(message.action, message.data);
		},
		rssDeleteFeed : (message, sender, sendResponse) => {
			createDialogWindow(message.action, message.data);
		},
		rssDeleteItem : (message, sender, sendResponse) => {
			createDialogWindow(message.action, message.data);
		},
		downloadDelete : (message, sender, sendResponse) => {
			createDialogWindow(message.action, message.data);
		},
		remove : (message, sender, sendResponse) => {
			sendToTab(sender.tab.id, 'content', 'dialog', 'remove');
		}
	},

	startpage : {
		search : (message, sender, sendResponse) => {
			setOption('startpage', 'searchEngine', message.data.engine);
			send('startpage', 'search', 'engine', optionsShort.startpage.searchEngine);
		}
	},

	site : {
		change : (message, sender, sendResponse) => {
			const site = data.speadDial[message.data.index];
			if (site) {
				site.text  = message.data.text;
				site.url   = message.data.url;
				site.color = message.data.color;
				brauzer.storage.local.set({'speadDial': data.speadDial});
				send('startpage', 'site', 'changed', {index: message.data.index, site: site});
			}
		},
		delete : (message, sender, sendResponse) => {
			makeSite(message.data.index, false);
			brauzer.storage.local.set({'speadDial': data.speadDial});
			send('startpage', 'site', 'changed', {index: message.data.index, site: data.speadDial[message.data.index]});
		},
		create : (message, sender, sendResponse) => {
			makeSite(message.data.index, message.data);
			brauzer.storage.local.set({'speadDial': data.speadDial});
			send('startpage', 'site', 'changed', {index: message.data.index, site: data.speadDial[message.data.index]});
		},
		move : (message, sender, sendResponse) => {
			const movedSite = data.speadDial.splice(message.data.from, 1)[0];
			data.speadDial.splice(message.data.to, 0, movedSite);
			brauzer.storage.local.set({'speadDial': data.speadDial});
			send('startpage', 'site', 'moved', {from: message.data.from, to: message.data.to});
		}
	},

	tabs      : defaultTabsHandler,

	bookmarks : null,

	history   : null,

	downloads : null,

	rss       : null
};

const fillItem = {
	tabs       : null,
	bookmarks  : null,
	history    : null,
	downloads  : null,
	rss        : null,
	domains    : (newItem, item) => {
		newItem.fav   = item.fav;
		newItem.title = item.title;
		return newItem;
	},
	favs      : (newItem, item) => {
		newItem.fav = item.fav;
		return newItem.fav;
	}
};

const gettingStorage = res => {

	const starter = _ => {
		for (let section in options) {
			optionsShort[section] = {};
			for (let option in options[section])
				optionsShort[section][option] = options[section][option].value;
		}
		init.favs(true);
		for (let service in options.services)
			if (options.services[service])
				init[service](true);
			else
				data.init[service] = true;
	};

	if (res.hasOwnProperty('version'))
		if (res.version === version) {
			for (let section in options)
				options[section] = res.options[section];
			return starter();
		}
	// set defaults
	for (let service of ['tabs', 'bookmarks', 'history', 'downloads']) {
		if (!brauzer.hasOwnProperty(service)) {
			options.services[service].value  = false;
			options.services[service].hidden = true;
		}
	}

	options.startpage.translateFrom.value  = brauzer.i18n.getUILanguage().split('-')[0];
	options.startpage.wikiSearchLang.value = brauzer.i18n.getUILanguage().split('-')[0];
	if (sidebarAction) {
		options.leftBar.method.values.push('native');
		if (firefox)
			options.rightBar.method.values.push('native');
	}
	options.startpage.rows.value    = Math.ceil(window.screen.height / 400);
	options.startpage.columns.value = Math.ceil(window.screen.width  / 400);
	const top = topSites => {
		for (let i = 0, l = options.startpage.rows.range[1] * options.startpage.columns.range[1] - 1; i < l; i++)
			data.speadDial.push(makeSite(i, topSites[i]));
		brauzer.storage.local.set({'options': options});
		brauzer.storage.local.set({'speadDial': data.speadDial});
		brauzer.storage.local.set({'version': version});
		brauzer.storage.local.set({'favs': [], 'favsId': []});
		starter();
	};
	execMethod(brauzer.topSites.get, top);
};

if (sidebarAction !== null) {
	let port;
	brauzer.runtime.onConnect.addListener(p => {
		port = p;
		port.onDisconnect.addListener(_ => {
			if (options.leftBar.method.value === 'native')
				optionsHandler.method('leftBar', 'method', 'disabled');
			else if (options.rightBar.method.value === 'native')
				optionsHandler.method('rightBar', 'method', 'disabled');
		});
	});
	if (firefox) {
		data.sideDetection = {};
		data.sideDetection.sidebar = '';
		data.sideDetection.content = '';
		messageHandler.sidebar = {
			sideDetection: (message, sender, sendResponse) => {

				const setSide = (sender, side) => {
					data.sideDetection[sender] = side;
					setTimeout(_ => {data.sideDetection[sender] = '';}, 100);
				};

				const detectSide = (prevSender, side) => {
					if (data.sideDetection[prevSender] !== side)
						return;
					if (options[side].method.value !== 'native') {
						const oppositeSide = {
							leftBar  : 'rightBar',
							rightBar : 'leftBar'
						};
						optionsHandler.method(side, 'method', 'native');
						optionsHandler.mode(side, 'mode', options[oppositeSide[side]].mode.value);
						if (options[oppositeSide[side]].method.value === 'native')
							optionsHandler.method(oppositeSide[side], 'method', 'disabled');
					}
				};

				const handler = {
					sidebarleave : side => setSide('sidebar', side),
					sidebarover  : side => detectSide('content', side),
					contentleave : side => setSide('content', side),
					contentover  : side => detectSide('sidebar', side)
				};

				handler[`${message.data.sender}${message.data.action}`](message.data.side);
			}
		};
	}
}

execMethod(brauzer.storage.local.get, gettingStorage, ['options', 'version']);

function initWindow() {
	if (options.leftBar.method.value === 'window')
		createSidebarWindow('leftBar');
	if (options.rightBar.method.value === 'window')
		createSidebarWindow('rightBar');
}

function checkForInit() {
	if (data.initDone) return;
	for (let serviceInitialized in data.init)
		if (!serviceInitialized) return;
	data.initDone = true;
	brauzer.runtime.onMessage.addListener((message, sender, sendResponse) => {
		// console.log(message);
		if (message.hasOwnProperty('target'))
			if (message.target === 'background') {
				messageHandler[message.subject][message.action](message, sender, sendResponse);
				if (message.hasOwnProperty('data'))
					if (message.data.hasOwnProperty('needResponse'))
						return true;
			}
	});
	initWindow();
	setIcon();
}

const init = {

	startpage: _ => {

		const gettingStorage = res => {
			if (Array.isArray(res.speadDial))
				data.speadDial = res.speadDial;
			data.init.startpage = true;
			checkForInit();
		};

		execMethod(brauzer.storage.local.get, gettingStorage, 'speadDial');
	},

	favs: _ => {
		if (data.init.favs)
			return;
		const gettingStorage = res => {
			if (Array.isArray(res.favs)) {
				data.favs      = res.favs;
				data.favsId    = res.favsId;
			}
			data.init.favs = true;
			checkForInit();
		};

		execMethod(brauzer.storage.local.get, gettingStorage, ['favs', 'favsId']);
	},

	tabs: start => {

		const initTabs = _ => {
			messageHandler.tabs = {
				new : (message, sender, sendResponse) => {
					const newUrl = message.data.url === '' ? data.defaultStartPage : message.data.url;
					if (message.data.newWindow)
						brauzer.windows.create({url: newUrl});
					else
						brauzer.tabs.create({url: newUrl});
				},
				update : (message, sender, sendResponse) => {
					brauzer.tabs.update(data.activeTabId, {'url': message.data.url});
				},
				setActive : (message, sender, sendResponse) => {
					const tab = getById('tabs', message.data.id);
					if (tab) {
						const windowId = tab.windowId;
						if (data.activeWindow !== windowId)
							brauzer.windows.update(windowId, {focused: true}, _ => {
								brauzer.tabs.update(message.data.id, {active: true});
							});
						else
							brauzer.tabs.update(message.data.id, {active: true});
					}
				},
				reload : (message, sender, sendResponse) => {
					brauzer.tabs.reload(message.data.id);
				},
				removeById : (message, sender, sendResponse) => {
					brauzer.tabs.remove(message.data.idList);
				},
				removeByDomain: (message, sender, sendResponse) => {
					let toClose = [];
					const folder = getFolderById('tabs', message.data.id);
					for (let i = folder.itemsId.length - 1; i >= 0; i--)
						toClose.push(folder.itemsId[i]);
					brauzer.tabs.remove(toClose);
				},
				move : (message, sender, sendResponse) => {
					brauzer.tabs.move(message.data.id, {index: message.data.to});
				},
				pin : (message, sender, sendResponse) => {
					brauzer.tabs.update(message.data.id, {pinned: true});
				},
				unpin : (message, sender, sendResponse) => {
					brauzer.tabs.update(message.data.id, {pinned: false});
				}
			};

			i18n.tabs = {
				newText    : getI18n('tabsNewText'),
				newTitle   : getI18n('tabsNewTitle'),
				new        : getI18n('tabsNewTitle'),
				reload     : getI18n('tabsControlsReload'),
				pin        : getI18n('tabsControlsPin'),
				unpin      : getI18n('tabsControlsUnpin'),
				close      : getI18n('tabsControlsClose'),
				closeAll   : getI18n('tabsControlsCloseAll'),
				plain      : getI18n('tabsPlainModeButton'),
				domain     : getI18n('tabsDomainModeButton'),
				tree       : getI18n('tabsTreeModeButton')
			};

			brauzer.tabs.onCreated.addListener(createTab);
			brauzer.tabs.onActivated.addListener(onActivated);
			brauzer.tabs.onUpdated.addListener(onUpdated);
			brauzer.tabs.onRemoved.addListener(onRemoved);
			brauzer.tabs.onMoved.addListener(onMoved);

			data.init.tabs = true;
			checkForInit();
		};

		const makeFolder        = tab => {
			const domain = makeDomain(tab.url, tab.favIconUrl);
			let folder   = createFolderById('tabs', domain.id, 'last');
			if (folder) {
				folder.pid        = 0;
				folder.title      = domain.title;
				folder.folded     = false;
				folder.view       = 'hidden';
				folder.domain     = domain.id;
				folder.itemsId    = [tab.id];
				send('sidebar', 'tabs', 'newFolder', folder);
				return folder;
			}
			else {
				folder = getFolderById('tabs', domain.id);
				if (folder) {
					const index = folder.itemsId.indexOf(tab.id);
					if (index === -1) {
						folder.itemsId.push(tab.id);
						checkCount(folder);
					}
					return folder;
				}
			}
			return false;
		};

		const checkCount        = folder => {
			const length  = folder.itemsId.length;
			const oldView = folder.view;
			if (length === 0) {
				deleteFolderById('tabs', folder.id);
				if (options.misc.tabsMode.value === 'domain')
					send('sidebar', 'tabs', 'domainCount', {id: folder.id, view: 'hidden'});
			}
			else {
				folder.view = length === 1 ? 'hidden' : 'domain';
				if (options.misc.tabsMode.value === 'domain') {
					if (oldView !== folder.view)
						send('sidebar', 'tabs', 'domainCount', {id: folder.id, view: folder.view});
				}
			}
		};

		const createTab         = opera ?
			tab => {
				if (tab.url.match(`${data.extensionUrl}sidebar.html`))
					return false;
				if (tab.url === data.defaultStartPage)
					brauzer.tabs.update(tab.id, {url: `${data.extensionUrl}startpage.html`});
				makeFolder(tab);
				return createById('tabs', tab, 'last');
			} :
			tab => {
				if (tab.url.match(`${data.extensionUrl}sidebar.html`))
					return false;
				makeFolder(tab);
				return createById('tabs', tab, 'last');
			};

		const onActivated       = tabInfo => {
			const tab = getById('tabs', tabInfo.tabId);
			if (tab) {
				data.activeTabId = tabInfo.tabId;
				send('sidebar', 'tabs', 'active', data.activeTabId);
				if (options.leftBar.method.value === 'iframe') {
					if (firefox)
						send('leftBar', 'set', 'reInit', sideBarData('leftBar'));
					send('content', 'reInit', 'leftBar', {
						options: optionsShort.leftBar,
						theme: {
							borderColor       : options.theme.borderColor.value,
							borderColorActive : options.theme.borderColorActive.value,
							fontSize          : options.theme.fontSize.value
						}
					});
				}
				if (options.rightBar.method.value === 'iframe') {
					if (firefox)
						send('rightBar', 'set', 'reInit', sideBarData('rightBar'));
					send('content', 'reInit', 'rightBar', {
						options: optionsShort.rightBar,
						theme: {
							borderColor       : options.theme.borderColor.value,
							borderColorActive : options.theme.borderColorActive.value,
							fontSize          : options.theme.fontSize.value
						}
					});
				}
			}
		};

		const onUpdated         = (id, info, tab) => {
			const oldTab = getById('tabs', id);
			if (!oldTab) return;
			const pid    = oldTab.pid;
			const folder = makeFolder(tab);
			if (info.hasOwnProperty('pinned')) {
				oldTab.pinned = info.pinned;
				if (info.pinned) {
					const index  = data.tabsId.indexOf(id);
					moveFromTo('tabs', id, index, 0);
					send('sidebar', 'tabs', 'moved', {'id': id, 'fromIndex': index, 'toIndex': tab.index, 'pinned': info.pinned});
				}
				else
					send('sidebar', 'tabs', 'unpin', {'id': id});
			}
			if (info.hasOwnProperty('url')) {
				oldTab.url   = info.url;
				if (pid !== folder.id) {
					oldTab.pid = folder.id;
					const oldFolder = getFolderById('tabs', pid);
					if (oldFolder) {
						const index = oldFolder.itemsId.indexOf(id);
						oldFolder.itemsId.splice(index, 1);
						checkCount(oldFolder);
						checkCount(folder);
						send('sidebar', 'tabs', 'urlChange', {'tab': oldTab, 'folder': folder});
					}
				}
				else
					send('sidebar', 'tabs', 'urlChange', {'tab': oldTab});
			}
			if (info.hasOwnProperty('title')) {
				oldTab.title = info.title;
				send('sidebar', 'tabs', 'title', {'id': id, 'title': info.title});
				if (options.services.history) {
					const item = getById('tabs', id);
					for (let i = data.history.length - 1; i >= 0; i--)
						if (item.url === data.history[i].url) {
							data.history[i].title = info.title;
							send('sidebar', 'history', 'title', {'id': data.history[i].id, 'title': info.title});
							break;
						}
				}
			}
			if (info.hasOwnProperty('status')) {
				oldTab.status = info.status;
				send('sidebar', 'tabs', 'status', {'id': id, 'loading': info.status === 'loading' ? 'add' : 'remove'});
			}
			if (info.hasOwnProperty('favIconUrl')) {
				const domain = getById('domains', pid);
				if (domain)
					domain.fav = makeFav(domain.id, null, info.favIconUrl, true);
			}
		};

		const onRemoved         = id => {
			const tab = getById('tabs', id);
			if (tab) {
				const folder      = getFolderById('tabs', tab.pid);
				const newOpenerId = tab.openerId;
				deleteById('tabs', id);
				if (folder) {
					const index = folder.itemsId.indexOf(id);
					folder.itemsId.splice(index, 1);
					checkCount(folder);
				}
				for (let i = data.tabs.length - 1; i >= 0; i--)
					if (data.tabs[i].openerId === id)
						data.tabs[i].openerId = newOpenerId;
				send('sidebar', 'tabs', 'removed', {'id': id});
			}
		};

		const onMoved           = (id, moveInfo) => {
			moveFromTo('tabs', moveInfo.fromIndex, moveInfo.toIndex);
			send('sidebar', 'tabs', 'moved', {'id': id, 'fromIndex': moveInfo.fromIndex, 'toIndex': moveInfo.toIndex});
		};

		const getTabs           = tabs => {
			for (let i = 0, l = tabs.length; i < l; i++)
				createTab(tabs[i], true);
			initTabs();
		};

		if (start) {
			fillItem.tabs = (newItem, item) => {
				const domain = makeDomain(item.url, item.favIconUrl).id;
				if (item.active)
					data.activeTabId  = item.id;
				newItem.pid        = domain;
				newItem.domain     = domain;
				newItem.pinned     = item.pinned;
				newItem.index      = item.index;
				newItem.status     = item.status;
				newItem.openerId   = item.hasOwnProperty('openerTabId') ? item.openerTabId : 0;
				newItem.url        = item.url;
				newItem.title      = item.title;
				newItem.discarded  = item.discarded;
				newItem.windowId   = item.windowId;
				return newItem;
			};

			execMethod(brauzer.tabs.query, getTabs, {});
		}
		else {
			i18n.tabs           = {};
			fillItem.tabs       = null;
			messageHandler.tabs = defaultTabsHandler;
			data.tabs           = [];
			data.tabsId         = [];
			data.tabsFolders    = [];
			data.tabsFoldersId  = [];
			brauzer.tabs.onCreated.removeListener(createTab);
			brauzer.tabs.onActivated.removeListener(onActivated);
			brauzer.tabs.onUpdated.removeListener(onUpdated);
			brauzer.tabs.onRemoved.removeListener(onRemoved);
			brauzer.tabs.onMoved.removeListener(onMoved);
			data.init.tabs      = false;
		}
	},

	bookmarks: start => {

		const initBookmarks = _ => {
			messageHandler.bookmarks = {
				deleteItem : (message, sender, sendResponse) => {
					brauzer.bookmarks.remove(message.data.id);
				},
				deleteFolder : (message, sender, sendResponse) => {
					brauzer.bookmarks.removeTree(message.data.id);
				},
				newBookmark : (message, sender, sendResponse) => {
					brauzer.bookmarks.create(message.data);
				},
				editBookmark :(message, sender, sendResponse) => {
					brauzer.bookmarks.update(message.data.id, message.data.changes);
				},
				editBookmarkFolder :(message, sender, sendResponse) => {
					brauzer.bookmarks.update(message.data.id, message.data.changes);
				},
				move : (message, sender, sendResponse) => {
					brauzer.bookmarks.move(message.data.id, {'parentId': message.data.pid, 'index': message.data.index});
				},
				search : (message, sender, sendResponse) => {
					const onFulfilled = bookmarkItems => {
						const result = [];
						for (let i = 0, l = bookmarkItems.length; i < l; i++)
							result.push({
								url      : bookmarkItems[i].url,
								title    : bookmarkItems[i].title,
								domain   : makeDomain(bookmarkItems[i].url).id
							});
						sendResponse(result);
					};
					execMethod(brauzer.bookmarks.search, onFulfilled, {'query': message.data.request});
					return true;
				}
			};

			i18n.bookmarks = {
				bookmarkThisText   : getI18n('bkBookmarkThisText'),
				bookmarkThisTitle  : getI18n('bkBookmarkThisTitle'),
				edit               : getI18n('bkEditBookmark'),
				move               : getI18n('bkMoveBookmark'),
				delete             : getI18n('bkDeleteBookmark'),
				deleteFolder       : getI18n('bkDeleteBookmarkFolder'),
				searchPlaceholder  : getI18n('bkSearchPlaceholder')
			};

			brauzer.bookmarks.onCreated.addListener(onCreated);
			brauzer.bookmarks.onChanged.addListener(onChanged);
			brauzer.bookmarks.onMoved.addListener(onMoved);
			brauzer.bookmarks.onRemoved.addListener(onRemoved);

			data.init.bookmarks = true;
			checkForInit();
		};

		const makeFolder    = folder => {
			let newFolder = getFolderById('bookmarks', folder.id);
			if (!newFolder) {
				newFolder           = createFolderById('bookmarks', folder.id, 'last');
				newFolder.pid       = folder.parentId;
				newFolder.title     = folder.title;
				newFolder.index     = folder.index;
				newFolder.view      = 'normal';
				newFolder.folded    = false;
			}
			return newFolder;
		};

		const parseTree     = folder => {

			const detector = firefox ?
				child => {
					if (child.type === 'folder')
						parseTree(child);
					else if (child.type === 'bookmark')
						if (!/^place:/.test(child.url))
							createById('bookmarks', child, 'last');
				} :
				child => {
					if (child.hasOwnProperty('url'))
						createById('bookmarks', child, 'last');
					else parseTree(child);
				};

			if (Array.isArray(folder)) {
				parseTree(folder[0]);
				return initBookmarks();
			}
			if (folder.hasOwnProperty('parentId'))
				if (folder.parentId !== undefined)
					makeFolder(folder);
			if (folder.children)
				for (let i = 0, l = folder.children.length; i < l; i++)
					detector(folder.children[i]);
		};

		const onCreated     = (id, bookmark) => {
			if (bookmark.url)
				send('sidebar', 'bookmarks', 'createdBookmark', {'item': createById('bookmarks', bookmark, 'last')});
			else
				send('sidebar', 'bookmarks', 'createdFolder', {'item': makeFolder(bookmark)});
		};

		const onChanged     = (id, info) => {
			const bookmark = getById('bookmarks', id);
			if (bookmark) {
				bookmark.url   = info.url;
				bookmark.title = info.title;
				send('sidebar', 'bookmarks', 'changedBookmark', {'id': id, 'info': info});
			}
			else {
				const folder = getFolderById('bookmarks', id);
				if (folder) {
					folder.title = info.title;
					send('sidebar', 'bookmarks', 'changedFolder', {'id': id, 'title': info.title});
				}
			}
		};

		const onMoved       = (id, info) => {
			const bookmark = getById('bookmarks', id);
			bookmark.pid   = info.parentId;
			bookmark.index = info.index;
			send('sidebar', 'bookmarks', 'moved', {'id': id, 'pid': info.parentId, 'index': info.index});
		};

		const onRemoved     = (id, info) => {
			let bookmark = getById('bookmarks', id);
			if (bookmark) {
				deleteById('bookmarks', id);
				send('sidebar', 'bookmarks', 'removed', {'id': id});
			}
			else {
				bookmark = getFolderById('bookmarks', id);
				if (bookmark) {
					deleteFolderById('bookmarks', id, true);
					send('sidebar', 'bookmarks', 'folderRemoved', {'id': id});
				}
			}
		};

		if (start) {
			fillItem.bookmarks = (newItem, item) => {
				newItem.pid     = item.parentId;
				newItem.domain  = makeDomain(item.url).id;
				newItem.title   = item.title;
				newItem.index   = item.index;
				newItem.url     = item.url;
				return newItem;
			};

			execMethod(brauzer.bookmarks.getTree, parseTree);
		}
		else {
			i18n.bookmarks           = {};
			fillItem.bookmarks       = null;
			messageHandler.bookmarks = null;
			data.bookmarks           = [];
			data.bookmarksId         = [];
			data.bookmarksFolders    = [];
			data.bookmarksFoldersId  = [];
			brauzer.bookmarks.onCreated.removeListener(onCreated);
			brauzer.bookmarks.onChanged.removeListener(onChanged);
			brauzer.bookmarks.onMoved.removeListener(onMoved);
			brauzer.bookmarks.onRemoved.removeListener(onRemoved);
			data.init.bookmarks      = false;
		}
	},

	history: start => {

		const initHistory = _ => {
			messageHandler.history = {
				getMore : (message, sender, sendResponse) => {
					searchMore(true);
				},
				search : (message, sender, sendResponse) => {
					search(sendResponse, message.data.request, 999);
					return true;
				}
			};

			i18n.history = {
				getMoreText        : getI18n('hsGetMoreText'),
				getMoreTitle       : getI18n('hsGetMoreTitle'),
				searchPlaceholder  : getI18n('hsSearchPlaceholder')
			};

			brauzer.history.onVisited.addListener(onVisited);
			brauzer.history.onVisitRemoved.addListener(onVisitRemoved);

			data.init.history = true;
			checkForInit();
		};

		const searchMore = (sendData = false) => {

			const dataToSend = {
				'historyEnd'     : false,
				'history'        : [],
				'historyFolders' : []
			};

			const searchHandler = history => {
				const l = history.length;
				if (l < options.misc.limitHistory.value) data.historyEnd = true;
				let foldersId = [];
				for (let i = 0; i < l; i++) {
					const item   = createById('history', history[i], 'last');
					const folder = makeHistoryFolder(history[i], 'last');
					if (sendData) {
						if (foldersId.indexOf(folder.id) === -1) {
							foldersId.push(folder.id);
							dataToSend.historyFolders.push(folder);
						}
						dataToSend.history.push(item);
					}
				}
				data.historyLastTime = l > 0 ? history[l - 1].lastVisitTime : 0;
				if (sendData) {
					dataToSend.historyEnd = data.historyEnd;
					send('sidebar', 'history', 'gotMore', dataToSend);
				}
				else
					initHistory();
			};

			const searchObject = {text: '', maxResults: options.misc.limitHistory.value, startTime: 0, endTime: data.historyLastTime};

			execMethod(brauzer.history.search, searchHandler, searchObject);
		};

		const search = (sendResponse, request) => {

			const searchHandler = history => {
				let results = [];
				for (let i = 0, l = history.length; i < l && i < options.misc.limitHistory.value; i++) {
					const domain = makeDomain(history[i].url);
					results.push({
						url    : history[i].url,
						domain : domain.id,
						title  : history[i].title || history[i].url,
						id     : history[i].id,
						pid    : 'search-results',
						fav    : domain.fav,
						color  : colorFromUrl(history[i].url)
					});
				}
				sendResponse(results);
			};

			const searchObject = {'text': request, 'maxResults': options.misc.limitHistory.value, 'startTime': 0};

			execMethod(brauzer.history.search, searchHandler, searchObject);
		};

		const makeHistoryFolder = (item, position) => {
			let title   = new Date(item.lastVisitTime);
			title       = title.toLocaleDateString();
			const id    = title.replace(/\./g, '');
			let folder  = getFolderById('history', id);
			if (!folder) {
				folder        = createFolderById('history', id, position);
				folder.pid    = 0;
				folder.view   = 'normal';
				folder.folded = false;
				folder.title  = title;
			}
			return folder;
		};

		const onVisited = item => {
			const hs = getById('history', item.id);
			if (hs)
				deleteById('history', item.id);
			send('sidebar', 'history', 'new', {'item': createById('history', item, 'first'), 'folder': makeHistoryFolder(item, 'first')});
		};

		const onVisitRemoved = info => {
			const urls = info.urls;
			if (info.allHistory) {
				data.historyId = [];
				data.history   = [];
				send('sidebar', 'history', 'wiped', '');
			}
			else {
				let removedIds = [];
				for (let i = data.history.length - 1; i >= 0; i--) {
					if (urls.length === 0) break;
					for (let j = urls.length - 1; j >= 0; j--)
						if (urls[j] === data.history[i].url) {
							removedIds.push(data.history[i].id);
							data.historyId.splice(i, 1);
							data.history.splice(i, 1);
							urls.splice(j, 1);
							j++;
						}
				}
				send('sidebar', 'history', 'removed', {'ids': removedIds});
			}
		};


		if (start) {
			fillItem.history = (newItem, item) => {
				let title      = new Date(item.lastVisitTime);
				title          = title.toLocaleDateString();
				const pid      = title.replace(/\./g, '');
				newItem.url    = item.url;
				newItem.domain = makeDomain(item.url).id;
				newItem.title  = item.title || item.url;
				newItem.pid    = pid;
				return newItem;
			};

			searchMore(false);
		}
		else {
			i18n.history           = {};
			fillItem.history       = null;
			messageHandler.history = null;
			data.history           = [];
			data.historyId         = [];
			data.historyFolders    = [];
			data.historyFoldersId  = [];
			brauzer.history.onVisited.removeListener(onVisited);
			brauzer.history.onVisitRemoved.removeListener(onVisitRemoved);
			data.init.history      = false;
		}
	},

	downloads: start => {

		const initDownloads = _ => {
			messageHandler.downloads = {
				pause : (message, sender, sendResponse) => {
					brauzer.downloads.pause(message.data.id);
				},
				resume : (message, sender, sendResponse) => {
					brauzer.downloads.resume(message.data.id);
				},
				cancel : (message, sender, sendResponse) => {
					brauzer.downloads.cancel(message.data.id);
				},
				reload : (message, sender, sendResponse) => {
					const index = data.downloadsId.indexOf(message.data.id);
					if (data.downloads[index].exists)
						brauzer.downloads.removeFile(message.data.id);
					brauzer.downloads.erase({'id': message.data.id});
					brauzer.downloads.download({'url': data.downloads[index].url, 'conflictAction': 'uniquify'});
				},
				erase : (message, sender, sendResponse) => {
					brauzer.downloads.erase({'id': message.data.id});
				},
				removeFile : (message, sender, sendResponse) => {
					brauzer.downloads.removeFile(message.data.id);
				}
			};

			i18n.downloads           = {
				pause  : getI18n('dlControlsPause'),
				resume : getI18n('dlControlsResume'),
				reload : getI18n('dlControlsReload'),
				stop   : getI18n('dlControlsCancel'),
				delete : getI18n('dlControlsDelete')
			};

			brauzer.downloads.onCreated.addListener(onCreated);
			brauzer.downloads.onErased.addListener(onErased);
			brauzer.downloads.onChanged.addListener(onChanged);

			data.init.downloads = true;
			checkForInit();
		};


		const beautySize = number => {
			if (number > 1073741824)
				return `${(number / (1073741824)).toFixed(2)} GB`;
			else if (number > 1048576)
				return `${(number / (1048576)).toFixed(2)} MB`;
			else if (number > 1024)
				return `${(number / 1024).toFixed(2)} KB`;
			else
				return `${number} B`;
		};

		const setDownloadsCount = {
			add    : _ => {
				data.info.downloadsCount++;
				if (data.info.downloadStatus === 'idle') {
					data.info.downloadStatus = 'progress';
					send('sidebar', 'info', 'downloadStatus', 'progress');
				}
			},
			delete : _ => {
				data.info.downloadsCount--;
				if (data.info.downloadsCount < 0)
					data.info.downloadsCount = 0;
				if (data.info.downloadsCount === 0) {
					data.info.downloadStatus = 'idle';
					send('sidebar', 'info', 'downloadStatus', 'idle');
				}
			},
			info   : _ => {
				let count = 0;
				for (let i = data.downloads.length - 1; i >= 0; i--)
					if (data.downloads[i].state === 'in_progress')
						count++;
				data.info.downloadsCount = count;
				if (count > 0)
					data.info.downloadStatus = 'progress';
				else
					data.info.downloadStatus = 'idle';
				send('sidebar', 'info', 'downloadStatus', data.info.downloadStatus);
			}
		};

		const onCreated = download => {
			send('sidebar', 'downloads', 'created', {'item': createById('downloads', download, 'last')});
		};

		const onErased = id => {
			deleteById('downloads', id);
			send('sidebar', 'downloads', 'erased', {'id': id});
		};

		const onChanged = delta => {
			const download = getById('downloads', delta.id);
			if (download === false)
				return;
			if (delta.hasOwnProperty('paused')) {
				download.paused = delta.paused.current;
				if (delta.canResume)
					download.canResume = delta.canResume.current;
				send('sidebar', 'downloads', 'startPause', {'id': download.id, 'paused': download.paused, 'canResume': download.canResume});
			}
			if (delta.hasOwnProperty('state')) {
				if (delta.state.current === 'in_progress')
					setDownloadsCount.add();
				else
					setDownloadsCount.delete();
				download.state = delta.state.current;
				send('sidebar', 'downloads', 'state', {'id': download.id, 'state': download.state});
			}
			if (delta.hasOwnProperty('filename')) {
				download.filename = delta.filename.current.split('/').pop();
				send('sidebar', 'downloads', 'filename', {'id': download.id, 'filename': download.filename});
			}
			if (delta.hasOwnProperty('exists')) {
				download.exists = delta.exists.current;
				send('sidebar', 'downloads', 'exists', {'id': download.id, 'method': download.exist ? 'remove' : 'add'});
			}
		};

		const getDownloads = downloads => {
			for (let i = 0, l = downloads.length; i < l; i ++)
				createById('downloads', downloads[i], 'last');
			initDownloads();
		};

		if (start) {
			fillItem.downloads       = (newItem, item) => {

				const checkDownloadState = id => {
					setTimeout(_ => {

						const updateDown = download => {
							const index = data.downloadsId.indexOf(download[0].id);
							data.downloads[index].bytesReceived   = download[0].bytesReceived;
							data.downloads[index].progressPercent = `${(100 * download[0].bytesReceived / download[0].totalBytes).toFixed(2)}%`;
							data.downloads[index].progressNumbers = `${beautySize(download[0].bytesReceived)} / ${beautySize(download[0].totalBytes)}`;
							send('sidebar', 'downloads', 'progress', {'item': data.downloads[index]});
							if (download[0].state === 'in_progress')
								checkDownloadState(id);
							else
								setDownloadsCount.delete();
						};

						execMethod(brauzer.downloads.search, updateDown, {'id': id});
					}, 200);
				};

				let filename = item.filename.split('/').pop();
				if (!filename)
					filename = item.url.split('/').pop();
				let url = item.finalUrl;
				if (!url)
					url = item.url;
				if (item.state === 'in_progress') {
					setDownloadsCount.add();
					checkDownloadState(item.id);
				}
				newItem.paused          = item.paused;
				newItem.filename        = decodeURIComponent(filename);
				newItem.totalBytes      = item.totalBytes;
				newItem.bytesReceived   = item.bytesReceived;
				newItem.progressPercent = `${(100 * item.bytesReceived / item.totalBytes).toFixed(2)}%`;
				newItem.progressNumbers = `${beautySize(item.bytesReceived)} / ${beautySize(item.totalBytes)}`;
				newItem.fileSize        = beautySize(item.fileSize);
				newItem.canResume       = item.canResume;
				newItem.url             = decodeURIComponent(url);
				newItem.state           = item.state;
				newItem.exists          = item.exists;
				return newItem;
			};

			execMethod(brauzer.downloads.search, getDownloads, {});
		}
		else {
			i18n.downloads           = null;
			fillItem.downloads       = null;
			messageHandler.downloads = null;
			data.downloads           = [];
			data.downloadsId         = [];
			brauzer.downloads.onCreated.removeListener(onCreated);
			brauzer.downloads.onErased.removeListener(onErased);
			brauzer.downloads.onChanged.removeListener(onChanged);
			data.init.downloads      = false;
		}
	},

	rss: start => {

		const initRss = _ => {
			messageHandler.rss = {
				rssReaded : (message, sender, sendResponse) => {
					rssSetReaded('rssItem', getById('rss', message.data.id));
				},
				rssReadedAll : (message, sender, sendResponse) => {
					rssSetReaded('feed', getFolderById('rss', message.data.id), 'save');
				},
				rssReadedAllFeeds : (message, sender, sendResponse) => {
					rssSetReaded('all');
				},
				rssHideReaded : (message, sender, sendResponse) => {
					const feed = getFolderById('rss', message.data.id);
					if (feed) {
						feed.hideReaded = true;
						brauzer.storage.local.set({'rssFolders': data.rssFolders});
						send('sidebar', 'rss', 'rssHideReaded', {'id': message.data.id});
					}
				},
				rssShowReaded : (message, sender, sendResponse) => {
					const feed = getFolderById('rss', message.data.id);
					feed.hideReaded = false;
					brauzer.storage.local.set({'rssFolders': data.rssFolders});
					send('sidebar', 'rss', 'rssShowReaded', {'id': message.data.id});
				},
				rssNew : (message, sender, sendResponse) => {
					createRssFeed(message.data.url);
				},
				rssDeleteItem : (message, sender, sendResponse) => {
					deleteRssItem(message.data.id);
				},
				rssEditFeed : (message, sender, sendResponse) => {
					const feed = getFolderById('rss', message.data.id);
					if (feed) {
						feed.title = message.data.title;
						feed.description = message.data.description;
						brauzer.storage.local.set({'rssFolders': data.rssFolders});
						send('sidebar', 'rss', 'rssFeedChanged', {'id': message.data.id, 'title': message.data.title, 'description': message.data.description});
					}
				},
				rssDeleteFeed : (message, sender, sendResponse) => {
					const feed = getFolderById('rss', message.data.id);
					rssSetReaded('feed', feed, 'kill');
					brauzer.alarms.clear(`rss-update**${message.data.id}`);
					deleteFolderById('rss', message.data.id);
					brauzer.storage.local.set({'rss': data.rss, 'rssId': data.rssId, 'rssFolders': data.rssFolders, 'rssFoldersId': data.rssFoldersId});
					send('sidebar', 'rss', 'rssFeedDeleted', {'id': message.data.id});
				},
				readAllFeeds : (message, sender, sendResponse) => {
					rssSetReaded('all');
				},
				updateFeed   : (message, sender, sendResponse) => {
					const feed = getFolderById('rss', message.data.id);
					if (feed) {
						send('sidebar', 'rss', 'update', {id: feed.id, method: 'add'});
						brauzer.alarms.clear(`rss-update**${feed.id}`);
						updateRssFeed(message.data.id);
					}
				},
				updateAll    : (message, sender, sendResponse) => {
					const update = {
						domain : id => {
							send('sidebar', 'rss', 'update', {id: id, method: 'add'});
							updateRssFeed(id);
						},
						plain  : id => {
							updateRssFeed(id);
						}
					};
					brauzer.alarms.clearAll();
					for (let i = data.rssFoldersId.length - 1; i >= 0; i--)
						update[options.misc.rssMode.value](data.rssFoldersId[i]);
				}
			};

			i18n.rss = {
				options          : getI18n('rssControlsOptions'),
				markRead         : getI18n('rssControlsMarkRead'),
				markReadAll      : getI18n('rssControlsMarkReadAll'),
				markReadAllFeeds : getI18n('rssControlsMarkReadAllFeeds'),
				hideReaded       : getI18n('rssControlsHideReaded'),
				showReaded       : getI18n('rssControlsShowReaded'),
				hideReadedAll    : getI18n('rssControlsHideReaded'),
				showReadedAll    : getI18n('rssControlsShowReaded'),
				delete           : getI18n('rssControlsDeleteItem'),
				reload           : getI18n('rssControlsReload'),
				new              : getI18n('rssNew'),
				reloadAll        : getI18n('rssReloadAll'),
				plain            : getI18n('rssPlainModeButton'),
				domain           : getI18n('rssDomainModeButton')
			};

			data.init.rss = true;
			checkForInit();
		};

		const guidFromUrl = url => {
			let id = '';
			for (let i = 0, l = url.length; i < l; i++)
				if (/[a-z]|[A-Z]|[0-9]|-|_/i.test(url[i]))
					id += url[i];
			return id;
		};

		const makeRssDomain = (url, fav) => {
			const id   = url.replace(/\.|\:|\\|\/|\?|\s|=/g, '');
			let domain = getById('domains', id);
			if (domain === false) {
				domain = createById('domains', {'id': id, 'fav': makeFav(id, url, fav), 'title': ''}, 'last');
				send('sidebar', 'info', 'newDomain', {'domain': domain});
			}
			return domain;
		};

		const createRssFeed = url => {
			const rssUrl = urlFromUser(url);
			for (let i = data.rssFolders.length - 1; i >= 0; i--)
				if (data.rssFolders[i].url === rssUrl)
					return brauzer.notifications.create('rss-error', {'type': 'basic', 'iconUrl': data.defaultIcon, 'title': i18n.notification.rssFeedExistErrorTitle, 'message':  `${i18n.notification.rssFeedExistErrorText}
							${data.rssFolders[i].title}`});
			const xhttp  = new XMLHttpRequest();
			xhttp.open("GET", rssUrl, true);
			xhttp.send();
			xhttp.onreadystatechange = _ => {
				if (xhttp.readyState === 4) {
					if (xhttp.status === 200) {
						const parser     = new DOMParser();
						const xmlDoc     = parser.parseFromString(xhttp.responseText, 'text/xml');
						const head       = xmlDoc.querySelector('channel, feed');
						let title        = head.querySelector('title');
						if (title) title = title.textContent.trim();
						let desc         = head.querySelector('description, subtitle');
						if (desc) desc   = desc.textContent.trim();
						let fav          = head.querySelector('image>url');
						fav              = fav ? fav.textContent.trim() : firefox ? data.rssIcon : false;
						const guid       = guidFromUrl(rssUrl);
						const feed       = createFolderById('rss', guid, 'first');
						feed.folded      = false;
						feed.pid         = 0;
						feed.title       = title;
						feed.view        = 'domain';
						feed.description = desc;
						feed.domain      = makeRssDomain(rssUrl, fav).id;
						feed.url         = rssUrl;
						feed.fav         = fav;
						feed.itemsId     = [];
						feed.hideReaded  = false;
						feed.readed      = true;
						feed.lastUpdate  = Date.now();
						if (options.misc.rssMode.value === 'domain')
							send('sidebar', 'rss', 'createdFeed', {'feed': feed});
						injectRss(xmlDoc, feed);
						rssSetUpdate(feed, options.misc.rssUpdatePeriod.value);
						brauzer.storage.local.set({'rssFolders': data.rssFolders, 'rssFoldersId': data.rssFoldersId});
					}
					else
						brauzer.notifications.create('rss-error', {'type': 'basic', 'iconUrl': data.defaultIcon, 'title': i18n.notification.rssNewFeedErrorTitle, 'message':  `${i18n.notification.rssNewFeedErrorText}
							${url}`});
				}

			};
		};

		const updateRssFeed = id => {

			const feed  = getFolderById('rss', id);
			const xhttp = new XMLHttpRequest();
			xhttp.open("GET", feed.url, true);
			xhttp.send();
			xhttp.onreadystatechange = _ => {
				if (xhttp.readyState === 4) {
					if (xhttp.status === 200) {
						const parser    = new DOMParser();
						const xmlDoc    = parser.parseFromString(xhttp.responseText, 'text/xml');
						feed.lastUpdate = Date.now();
						injectRss(xmlDoc, feed);
						rssSetUpdate(feed, options.misc.rssUpdatePeriod.value);
						brauzer.storage.local.set({'rssFolders': data.rssFolders, 'rssFoldersId': data.rssFoldersId});
					}
					else {
						feed.lastUpdate = Date.now();
						rssSetUpdate(feed, 10);
					}
					if (options.misc.rssMode.value === 'domain')
						send('sidebar', 'rss', 'update', {id: id, method: 'remove'});
				}
			};
		};

		const rssSetUpdate = (feed, timeout) => {
			brauzer.alarms.clearAll();
			if (feed.lastUpdate < Date.now() - (timeout * 60000))
				updateRssFeed(feed.id);
			else
				brauzer.alarms.create(`rss-update**${feed.id}`,
					{
						'when'            : feed.lastUpdate + (timeout * 60000),
						'periodInMinutes' : options.misc.rssUpdatePeriod.value
					});
		};

		const deleteRssItem = id => {
			const rssItem = getById('rss', id);
			rssSetReaded('rssItem', rssItem);
			const feed   = getFolderById('rss', rssItem.pid);
			const index2 = feed.itemsId.indexOf(id);
			feed.itemsId.splice(index2, 1);
			deleteById('rss', id);
			send('sidebar', 'rss', 'rssItemDeleted', {'id': id});
		};

		const injectRss = (xml, feed) => {
			let newItems = [];
			for (let items = xml.querySelectorAll('item, entry'), i = items.length - 1; i >= 0; i--) {
				const item = {
					'readed'     : false,
					'title'      : '',
					'link'       : '',
					'description': '',
					'id'         : '',
					'pid'        : feed.id,
					'domain'     : feed.domain,
					'date'       : 0
				};
				for (let ch = items[i].children, j = 0, l = ch.length; j < l; j++) {
					const nodeName = ch[j].nodeName;
					if (nodeName === 'title')
						item.title = ch[j].textContent;
					else if (nodeName === 'link') {
						const link = ch[j].textContent || ch[j].getAttribute('href');
						if (link.match(/^https?:\/\//))
							item.link = link;
						else
							item.link = `${feed.link}${link}`;
					}
					else if (nodeName === 'description' || nodeName === 'content')
						item.description = ch[j].textContent.replace(/&#?....;/g, '').replace(/<[^<>]*>/g, '').replace(/\s\s*/g, ' ');
					else if (nodeName === 'guid' || nodeName === 'id')
						item.id = guidFromUrl(ch[j].textContent);
					else if (nodeName === 'pubDate' || nodeName === 'published')
						item.date = Date.parse(ch[j].textContent);
				}
				if (item.title === '')
					item.title = item.description.substring(0, 40);
				if (feed.itemsId.indexOf(item.id) === -1)
					newItems.push(createById('rss', item, 'date'));
			}
			const l = feed.itemsId.length - options.misc.maxSavedRssPerFeed.value;
			if (l > 0)
				for (let i = 0; i < l; i++)
					deleteRssItem(feed.itemsId[0]);
			if (newItems.length > 0) {
				newItems.sort((a, b) => a.date - b.date);
				for (let i = 0, l = newItems.length, r = data.rssId.length - 1; i < l; i++)
					newItems[i].index = r - data.rssId.indexOf(newItems[i].id);
				brauzer.storage.local.set({'rss': data.rss, 'rssId': data.rssId});
				send('sidebar', 'rss', 'newItems', {'items': newItems});
				rssSetReaded('info');
			}
		};

		const rssSetReaded = (method, target, killOrSave) => {

			const setReaded = {
				rssItem : _ => {
					if (target.readed) return;
					target.readed = true;
					data.info.rssUnreaded--;
					const feed = getFolderById('rss', target.pid);
					let feedReaded = true;
					for (let itemsId = feed.itemsId, i = itemsId.length - 1; i >= 0; i--) {
						const rssItem = getById('rss', itemsId[i]);
						if (!rssItem.readed) {
							feedReaded = false;
							break;
						}
					}
					feed.readed = feedReaded;
					brauzer.storage.local.set({'rss': data.rss});
					send('sidebar', 'rss', 'rssReaded', {'id': target.id, 'feedReaded': feedReaded});
				},
				feed    : _ => {
					const childrensHandler = {
						kill : _ => {
							for (let itemsId = target.itemsId, i = itemsId.length - 1; i >= 0; i--) {
								const index = data.rssId.indexOf(itemsId[i]);
								if (index !== -1) {
									if (!data.rss[index].readed)
										data.info.rssUnreaded--;
									data.rss.splice(index, 1);
									data.rssId.splice(index, 1);
								}
							}
						},
						save : _ => {
							for (let itemsId = target.itemsId, i = itemsId.length - 1; i >= 0; i--) {
								const rssItem = getById('rss', itemsId[i]);
								if (!rssItem.readed) {
									rssItem.readed = true;
									data.info.rssUnreaded--;
								}
							}
							brauzer.storage.local.set({'rss': data.rss});

							send('sidebar', 'rss', 'rssReadedAll', {'id': target.id});
						}
					};

					childrensHandler[killOrSave]();
				},
				info   : _ => {},
				count  : _ => {
					data.info.rssUnreaded = 0;
					for (let i = data.rss.length - 1; i >= 0; i--)
						if (!data.rss[i].readed)
							data.info.rssUnreaded++;
				},
				all    : _ => {
					data.info.rssUnreaded = 0;
					for (let i = data.rss.length - 1; i >= 0; i--)
						data.rss[i].readed = true;
					brauzer.storage.local.set({'rss': data.rss});
					send('sidebar', 'rss', 'rssReadedAllFeeds', '');
				}
			};
			setReaded[method]();
			send('sidebar', 'info', 'rssUnreaded', {'unreaded': data.info.rssUnreaded});
		};

		const getRss = res => {
			if (res.hasOwnProperty('rssFolders'))
				if (res.hasOwnProperty('rssFoldersId'))
					if (res.hasOwnProperty('rss')) {
						data.rssFolders   = res.rssFolders;
						data.rssFoldersId = res.rssFoldersId;
						data.rss          = res.rss;
						data.rssId        = res.rssId;
						for (let i = data.rssFolders.length - 1; i >= 0; i--) {
							makeRssDomain(data.rssFolders[i].url, data.rssFolders[i].fav);
							rssSetUpdate(res.rssFolders[i], options.misc.rssUpdatePeriod.value);
						}
						rssSetReaded('count');
					}
			initRss();
			brauzer.alarms.onAlarm.addListener(alarm => {
				if (/rss-update\*\*/i.test(alarm.name)) {
					const id    = alarm.name.split('**').pop();
					const feed  = getFolderById('rss', id);
					if (feed)
						updateRssFeed(id);
				}
			});
		};

		if (start) {
			fillItem.rss = (newItem, item) => {
				newItem.readed      = item.readed;
				newItem.title       = item.title;
				newItem.link        = item.link;
				newItem.description = item.description.substring(0, 600);
				newItem.pid         = item.pid;
				newItem.domain      = item.domain;
				newItem.date        = item.date;
				data.info.rssUnreaded++;
				const feed  = getFolderById('rss', item.pid);
				feed.readed = false;
				let success = false;
				for (let i = 0, l = feed.itemsId.length; i < l; i++)
					if (item.date < feed.itemsId[i].date) {
						feed.itemsId.splice(i, 0, item.id);
						success = true;
						break;
					}
				if (!success)
					feed.itemsId.push(item.id);
				return newItem;
			};

			execMethod(brauzer.storage.local.get, getRss, ['rss', 'rssId', 'rssFolders', 'rssFoldersId']);
		}
		else {
			i18n.rss            = null;
			messageHandler.rss  = null;
			fillItem.rss        = null;
			data.rss            = [];
			data.rssId          = [];
			data.rssFolders     = [];
			data.rssFoldersId   = [];
			brauzer.alarms.clearAll();
			data.init.rss       = false;
		}
	}
};

function sideBarData(side) {

	return {
		'side'     : side,
		'mode'     : options[side].mode.value,
		'wide'     : options[side].wide.value,
		'fixed'    : options[side].fixed.value,
		'width'    : options[side].width.value,
		'data'     : modeData[options[side].mode.value](),
		'info'     : data.info,
		'domains'  : data.domains,
		'i18n'     : {
						'header' : i18n.header,
						'mode'   : i18n[options[side].mode.value]
					 },
		'services' : optionsShort.services,
		'warnings' : optionsShort.warnings,
		'misc'     : optionsShort.misc,
		'theme'    : optionsShort.theme
	};
}

function send(target, subject, action, dataToSend) {

	const sendToSidebar = (target, subject, action, dataToSend) => {
		if (/tabs|bookmarks|history|downloads|rss/.test(subject))
			if (subject !== options[target].mode.value)
				return;

		const sendByMethod = {
			native : _ => {
				brauzer.runtime.sendMessage({'target': target, 'subject': subject, 'action': action, 'data': dataToSend});
			},
			iframe : _ => {
				if (firefox)
					sendToTab(data.activeTabId, target, subject, action, dataToSend);
				else
					brauzer.runtime.sendMessage({'target': target, 'subject': subject, 'action': action, 'data': dataToSend});
			},
			window : _ => {
				if (data[target].tabId !== -1)
					sendToTab(data[target].tabId, target, subject, action, dataToSend);
			},
			disabled : _ => {}
		};

		sendByMethod[options[target].method.value]();
	};

	const sendTo = {
		sidebar  : _ => {
			sendTo.leftBar();
			sendTo.rightBar();
		},
		leftBar  : _ => sendToSidebar('leftBar', subject, action, dataToSend),
		rightBar : _ => sendToSidebar('rightBar', subject, action, dataToSend),
		startpage    : _ => {
			brauzer.runtime.sendMessage({'target': 'startpage', 'subject': subject, 'action': action, 'data': dataToSend});
		},
		content  : _ => {
			sendToTab(data.activeTabId, 'content', subject, action, dataToSend);
		}
	};

	sendTo[target]();
}

function sendToTab(tabId, target, subject, action, dataToSend) {
	brauzer.tabs.sendMessage(tabId, {'target': target, 'subject': subject, 'action': action, 'data': dataToSend});
}

function getI18n(message) {
	return brauzer.i18n.getMessage(message);
}

function urlFromUser(url) {
	if (!/^https?:\/\/|^ftp:\/\//.test(url))
		return 'https://' + url.replace(/^\/*/, '');
	else return url;
}

function makeFav(id, url, favIconUrl, update = false) {

	const favFromUrl = firefox ?
		_ => {
			const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon fill="${colorFromUrl(url)}" points="0,0 0,64 64,64 64,0"/></svg>`;
			return `data:image/svg+xml;base64,${btoa(svg)}`;
		} :
		_ => `chrome://favicon/${url}`;

	const updateFav= {
		truetrue   : _ => {
			fav.fav = favIconUrl;
			return favIconUrl;
		},
		truefalse  : _ => {
			fav = createById('favs', {id: id, fav: favIconUrl}, 'last');
			return favIconUrl;
		} ,
		falsetrue  : _ => {
			fav.fav = favFromUrl();
			return fav.fav;
		} ,
		falsefalse : _ => {
			fav = createById('favs', {id: id, fav: favFromUrl()}, 'last');
			return fav.fav;
		} ,
	};

	let fav = getById('favs', id);
	let favIcon = '';
	if (id === 'default')
		favIcon = data.defaultIcon;
	else if (id === 'startpage')
		favIcon = data.startpageIcon;
	else if (id === 'system')
		favIcon = data.systemIcon;
	else if (id === 'extension')
		favIcon = data.defaultIcon;
	else
		favIcon = updateFav[`${typeof favIconUrl === 'string'}${fav !== false}`]();
	if (update)
		send('sidebar', 'info', 'updateDomain', {'id': id, 'fav': favIcon});
	brauzer.storage.local.set({'favs': data.favs, 'favsId': data.favsId});
	return favIcon;
}

function makeDomain(url, fav) {
	let id    = '';
	let title = '';
	if (url === '')
		id = 'default';
	else if (url === data.defaultStartPage)
		id = 'startpage';
	else if (/^about:|^chrome:/.test(url))
		id = 'system';
	else if (/^chrome-extension:|^moz-extension:/i.test(url))
		id = 'extension';
	if (id !== '')
		title = i18n.domains[id];
	else {
		// id    = prefix + url.split('//', 2).pop().split('/', 2).shift().replace(/\./g, '');
		title = domainFromUrl(url, true);
		id    = title.replace(/\./g, '');
	}
	let domain = getById('domains', id);
	if (!domain) {
		domain = createById('domains', {'id': id, 'fav': makeFav(id, url, fav), title: title}, 'last');
		send('sidebar', 'info', 'newDomain', {'domain': domain});
	}
	return domain;
}

function createDialogWindow(type, dialogData) {
	data.dialogData = dialogData;
	data.dialogType = type;
	const activeTab = getById('tabs', data.activeTabId);
	if (!activeTab) return;
	if (/^https?:|^ftp:|^file:|^chrome:\/\/newtab|^chrome:\/\/startpage/.test(activeTab.url) || activeTab.url === data.defaultStartPage)
		sendToTab(data.activeTabId, 'content', 'dialog', 'create', type);
	else
		brauzer.tabs.create({url: data.defaultStartPage});
}

function createSidebarWindow(side) {
	brauzer.windows.getCurrent({}, win => {
		const width  = Math.ceil(options[side].width.value * screen.width / 100);
		const params = {
			'url'        : `sidebar.html#${side}-window`,
			'top'        : 0,
			'left'       : side === 'rightBar' ? screen.width - width : 0,
			'width'      : width,
			'height'     : win.height,
			'type'       : 'popup'
		};

		const onCreate = win => {
			data[side].windowId = win.id;
			brauzer.windows.onRemoved.addListener(id => {
				if (id === win.id) {
					data[side].windowId = -1;
					data[side].tabId = -1;
					if (options[side].method.value === 'window') {
						setOption(side, 'method', 'disabled');
						setIcon();
					}
				}
			});
		};

		execMethod(brauzer.windows.create, onCreate, params);

	});
}

function removeSidebarWindow(side) {
	brauzer.windows.remove(data[side].windowId);
}

function setIcon() {
	const set = {
		truetrue   : _ => {
			brauzer.browserAction.setIcon({path: 'icons/both.svg'});
			brauzer.browserAction.setTitle({'title': getI18n('extBoth')});
		},
		falsetrue  : _ => {
			brauzer.browserAction.setIcon({path: 'icons/right.svg'});
			brauzer.browserAction.setTitle({'title': getI18n('extRightBar')});
		},
		truefalse  : _ => {
			brauzer.browserAction.setIcon({path: 'icons/left.svg'});
			brauzer.browserAction.setTitle({'title': getI18n('extLeftBar')});
		},
		falsefalse : _ => {
			brauzer.browserAction.setIcon({path: 'icons/none.svg'});
			brauzer.browserAction.setTitle({'title': getI18n('extNone')});
		},
	};
	set[`${options.leftBar.method.value !== 'disabled'}${options.rightBar.method.value !== 'disabled'}`]();
}

function createById(mode, item, position) {

	let index = data[`${mode}Id`].indexOf(item.id);

	const insert = {
		last  : _ => {
			data[mode].push({'id': item.id});
			index = data[`${mode}Id`].push(item.id) - 1;
			return data[mode][index];
		},
		first : _ => {
			data[mode].unshift({'id': item.id});
			data[`${mode}Id`].unshift(item.id);
			return data[mode][0];
		},
		date : _ => {
			if (!item.date)
				item.date = Date.now();
			for (let i = 0, l = data[mode].length; i < l; i++)
				if (item.date < data[mode][i].date) {
					data[mode].splice(i, 0, {'id': item.id});
					data[`${mode}Id`].splice(i, 0, item.id);
					return data[mode][i];
				}
			data[mode].push({'id': item.id});
			index = data[`${mode}Id`].push(item.id) - 1;
			return data[mode][index];
		}
	};

	if (index !== -1)
		return data[mode][index];
	else
		return fillItem[mode](insert[position](), item);
}

function deleteById(mode, id) {
	const index = data[`${mode}Id`].indexOf(id);
	if (index !== -1) {
		data[mode].splice(index, 1);
		data[`${mode}Id`].splice(index, 1);
	}
}

function getById(mode, id) {
	const index = data[`${mode}Id`].indexOf(id);
	if (index !== -1)
		return data[mode][index];
	else return false;
}

function moveFromTo(mode, from, to) {
	const item = data[mode].splice(from, 1)[0];
	data[`${mode}Id`].splice(from, 1);
	data[mode].splice(to, 0, item);
	data[`${mode}Id`].splice(to, 0, item.id);
}

function createFolderById(mode, id, position) {

	let index = data[`${mode}FoldersId`].indexOf(id);
	const insert = {
		last  : _ => {
			data[`${mode}Folders`].push({'id': id});
			index = data[`${mode}FoldersId`].push(id) - 1;
			return data[`${mode}Folders`][index];
		},
		first : _ => {
			data[`${mode}Folders`].unshift({'id': id});
			data[`${mode}FoldersId`].unshift(id);
			return data[`${mode}Folders`][0];
		}
	};

	if (index !== -1)
		return false;
	else
		return insert[position]();
}

function deleteFolderById(mode, id, killChildrens = false) {
	const index = data[`${mode}FoldersId`].indexOf(id);
	if (index !== -1) {
		if (killChildrens) {
			for (let maybeChildren = data[mode], i = maybeChildren.length - 1; i >= 0; i--)
				if (maybeChildren.pid === id)
					deleteById(mode, children[i]);
		}
		data[`${mode}Folders`].splice(index, 1);
		data[`${mode}FoldersId`].splice(index, 1);
	}
}

function getFolderById(mode, id) {
	const index = data[`${mode}FoldersId`].indexOf(id);
	if (index !== -1)
		return data[`${mode}Folders`][index];
	else return null;
}

function domainFromUrl(url, noProtocol = false) {
	if (!url)
		return 'default';
	else if (!noProtocol) {
		const domain = url.match(/^(.*:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})/i);
		if (domain)
			return domain[0];
	}
	else {
		const domain = url.match(/([\da-z\.-]+)\.([a-z\.]{2,6})/i);
		if (domain)
			return domain[0];
	}
	return 'default';
}

function colorFromUrl(url) {
	const t = url.replace(/www|https?:\/\//i, '').replace(/\n/g, '').replace(/\.|\//, '').substring(0, 6)
		.replace(/g|w/ig, '0').replace(/h|x|\s/ig, '1').replace(/i|y/ig, '2')
		.replace(/j|z/ig, '3').replace(/k|\./ig, '4').replace(/l|-/ig, '5')
		.replace(/m|\//ig, '6').replace(/n|:/ig, '7').replace(/o|v/ig, '8')
		.replace(/p|\#/ig, '9').replace(/r|%/ig, 'a').replace(/s|~/ig, 'b')
		.replace(/q|_/ig, 'c').replace(/r|\$/ig, 'd').replace(/t|\*/ig, 'e')
		.replace(/u|!|\+|\(|\)|,/ig, 'f');

	const normilize = input => {
		let temp = (Math.round(parseInt(input, 16) * 0.8)).toString(16);
		if (temp.length < 2) temp += '0';
		return temp;
	};

	const R = normilize((t[0] || 'a') + (t[3] || 'a'));
	const G = normilize((t[1] || 'a') + (t[4] || 'a'));
	const B = normilize((t[2] || 'a') + (t[5] || 'a'));
	return '#' + R + G + B;
}

function makeSite(index, site) {

	if (site) {
		const url  = urlFromUser(site.url);
		let domen  = domainFromUrl(site.url, true).replace('/', '');
		domen      = domen.split('.', 6);
		let text   = ' ' + domen[0];
		const l    = domen.length;
		for (let i = 1; i < l; i++)
			text += `\n ${domen[i]}`;
		if (l < 3)
			text += '\n';
		data.speadDial[index] = {
			color : site.color ? site.color : colorFromUrl(site.url),
			url   : url,
			text  : text,
			class : 'site'
		};
	}
	else
		data.speadDial[index] = {
			color : '',
			url   : '',
			text  : ' \n+\n ',
			class : 'add-new'
		};
}

function setOption(section, option, newValue) {
	options[section][option].value = newValue;
	optionsShort[section][option]  = newValue;
	brauzer.storage.local.set({'options': options});
}

})();
