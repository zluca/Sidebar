(function() {

'use strict';

const firefox     = typeof InstallTrigger !== 'undefined';
const opera       = window.hasOwnProperty('opr');
const brauzer     = firefox ? browser : chrome;

const config = {
	version            : getVersion(),
	extensionStartPage : `${brauzer.extension.getURL('/')}startpage.html`,
	defaultStartPage   : firefox ? 'about:newtab' : opera ? 'chrome://startpage/' : 'chrome://newtab/',
	pocketRedirectPage : 'https://github.com/zluca/Sidebar/',
	sidebarIcon        : 'icons/sidebar-icon-64.png',
	rssIcon            : 'icons/rss.svg',
	pocketConsumerKey  : '72831-08ba83947577ffe5e7738034',
	bookmarksLimit     : 999,
	searchLength       : 30,
	searchTypes        : ['duckduckgo', 'google', 'yandex', 'bing', 'yahoo','wikipedia']
};

const i18n = {
	notification: {
		rssNewFeedErrorTitle       : getI18n('notificationRssErrorTitle'),
		rssNewFeedErrorText        : getI18n('notificationRssNewFeedErrorText'),
		rssFeedExistErrorTitle     : getI18n('notificationRssErrorTitle'),
		rssFeedExistErrorText      : getI18n('notificationRssFeedExistErrorText'),
		rssNothingToExportTitle    : getI18n('notificationRssErrorTitle'),
		rssNothingToExportText     : getI18n('notificationRssNothingToExportText'),
		bookmarksTitle             : getI18n('notificationBookmarksTitle'),
		bkTooManyBookmarksText     : getI18n('notificationbkTooManyBookmarksText'),
		bkSwitchToTreeText         : getI18n('notificationbkSwitchToTreeText')
	},
	domains: {
		default   : getI18n('domainsDefault'),
		pdf       : getI18n('domainsPdf'),
		file      : getI18n('domainsFile'),
		ftp       : getI18n('domainsFtp'),
		startpage : getI18n('domainsStartPage'),
		system    : getI18n('domainsSystem'),
		extension : getI18n('domainsExtension'),
		windows   : getI18n('domainsWindows')
	},
	mainControls: {
		wide         : getI18n('sbControlsWideTitle'),
		narrow       : getI18n('sbControlsNarrowTitle'),
		pin          : getI18n('sbControlsFixedTitle'),
		unpin        : getI18n('sbControlsUnfixedTitle'),
		leftBarShow  : getI18n('sbControlsLeftBarShowTitle'),
		leftBarHide  : getI18n('sbControlsLeftBarHideTitle'),
		rightBarShow : getI18n('sbControlsRightBarShowTitle'),
		rightBarHide : getI18n('sbControlsRightBarHideTitle'),
		tabs         : getI18n('optServicesTabsLabel'),
		bookmarks    : getI18n('optServicesBookmarksLabel'),
		history      : getI18n('optServicesHistoryLabel'),
		downloads    : getI18n('optServicesDownloadsLabel'),
		rss          : getI18n('optServicesRssLabel'),
		pocket       : getI18n('optServicesPocketLabel'),
		search       : getI18n('optServicesSearchLabel'),
		sidebarActions : getI18n('dialogActionsHeader')
	},
	startpage   : null,
	tabs        : null,
	bookmarks   : null,
	history     : null,
	downloads   : null,
	rss         : null,
	pocket      : null,
	search      : null
};

const status = {
	info               : {
		rssUnreaded     : 0,
		rssUpdated      : false,
		rssUpdatedCount : 0,
		downloadStatus  : 'idle',
		downloadsCount  : 0,
		tabsSearchBar   : false,
		tabsSearch      : false,
		bookmarksSearch : false,
		historySearch   : false,
		undoTab         : {
			url    : '',
			title  : '',
			active : false
		}
	},
	init               : {
		'data'      : false,
		'startpage' : false,
		'tabs'      : false,
		'bookmarks' : false,
		'history'   : false,
		'downloads' : false,
		'rss'       : false,
		'pocket'    : false
	},
	leftBar         : {
		windowId      : -1,
		tabId         : -1
	},
	rightBar        : {
		windowId      : -1,
		tabId         : -1
	},
	historyLastTime      : Date.now(),
	historyEnd           : false,
	sidebarWindowCreating: false,
	activeWindow         : -1,
	activeTabsIds        : {},
	nativeActive         : false,
	nativeCount          : 0,
	dialogData           : null,
	dialogType           : '',
	toSave               : {},
	saverActive          : false,
	sendTimer            : {},
	pocketCode           : '',
	tooManyBookmarks     : false,
	firstInit            : false,
	timeStamp            : {
		options          : 0,
		info             : 0,
		startpage        : 0,
		tabs             : 0,
		bookmarks        : 0,
		history          : 0,
		downloads        : 0,
		rss              : 0,
		pocket           : 0,
		search           : 0,
		spSearch         : 0,
		startpageCache   : {
			options : -1,
			data    : -1,
			search  : -1,
		},
		leftBarCache     : {
			options : -1,
			data    : -1,
			info    : -1
		},
		rightBarCache    : {
			options : -1,
			data    : -1,
			info    : -1
		}
	}
};

const data = {
	tabs               : [],
	tabsId             : [],
	tabsFolders        : [],
	tabsFoldersId      : [],
	windowsFolders     : [],
	windowsFoldersId   : [],
	tabsDomains        : [],
	tabsDomainsId      : [],
	tabsSearch         : [],
	tabsSearchTerm     : '',
	bookmarks          : [],
	bookmarksId        : [],
	bookmarksFolders   : [],
	bookmarksFoldersId : [],
	bookmarksDomains   : [],
	bookmarksDomainsId : [],
	bookmarksSearch    : [],
	bookmarksSearchTerm: '',
	history            : [],
	historyId          : [],
	historyFolders     : [],
	historyFoldersId   : [],
	historyDomains     : [],
	historyDomainsId   : [],
	historySearch      : [],
	historySearchTerm  : '',
	downloads          : [],
	downloadsId        : [],
	downloadsFolders   : [],
	downloadsFoldersId : [],
	rss                : [],
	rssId              : [],
	rssFolders         : [],
	rssFoldersId       : [],
	rssDomains         : [],
	rssDomainsId       : [],
	pocket             : [],
	pocketId           : [],
	pocketFolders      : [],
	pocketFoldersId    : [],
	pocketDomains      : [],
	pocketDomainsId    : [],
	searchQuery        : '',
	search             : [],
	searchId           : [],
	searchFolders      : [],
	searchFoldersId    : [],
	searchDomains      : [],
	searchDomainsId    : [],
	spSearchQuery      : '',
	spSearch           : [],
	spSearchId         : [],
	spSearchFolders    : [],
	spSearchFoldersId  : [],
	spSearchDomains    : [],
	spSearchDomainsId  : [],
	favs               : [],
	favsId             : [],
	favsFolders        : [],
	favsFoldersId      : [],
	startpage          : [],
	foldedId           : [],
	tabsWithOpeners    : [],
	tabsWithOpenersId  : [],
	tabsWithOpenersFolders   : [],
	tabsWithOpenersFoldersId : [],
	leftBar        : {
		'side'     : 'leftBar',
		'options'  : null,
		'data'     : null,
		'info'     : null,
		'i18n'     : null,
		'timeStamp': null
		},
	rightBar        : {
		'side'     : 'rightBar',
		'options'  : null,
		'data'     : null,
		'info'     : null,
		'i18n'     : null,
		'timeStamp': null
		},
	startpageData      : {
		'id'            : -1,
		'zoom'          : 1,
		'sites'         : null,
		'search'        : null,
		'searchFolders' : null,
		'searchQuery'   : null,
		'domains'       : null,
		'options'       : null,
		'i18n'          : null,
		'timeStamp'     : null
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
		open   : {
			value   : false,
			type    : 'boolean',
			targets : ['content']
		},
		mode   : {
			value   : 'bookmarks',
			type    : 'select',
			values  : ['tabs', 'bookmarks', 'history', 'downloads', 'rss', 'pocket'],
			targets : [],
			handler : 'mode'
		},
		left   : {
			value   : 0,
			type    : 'integer',
			range   : [0, 16000],
			targets : []
		},
		top   : {
			value   : 0,
			type    : 'integer',
			range   : [0, 16000],
			targets : []
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
		open   : {
			value   : false,
			type    : 'boolean',
			targets : ['content']
		},
		mode   : {
			value   : 'bookmarks',
			type    : 'select',
			values  : ['tabs', 'bookmarks', 'history', 'downloads', 'rss', 'pocket'],
			targets : [],
			handler : 'mode'
		},
		left   : {
			value   : -1,
			type    : 'integer',
			range   : [-1, 16000],
			targets : []
		},
		top   : {
			value   : 0,
			type    : 'integer',
			range   : [0, 16000],
			targets : []
		},
		hidden : {}
	},
	services: {
		startpage : {
			value   : true,
			type    : 'boolean',
			targets : [],
			hidden  : true
			// handler : 'startpage'
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
			value   : false,
			type    : 'boolean',
			targets : [],
			handler : 'service'
		},
		rss       : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'service'
		},
		pocket    : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'service'
		},
		search    : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'service'
		}
	},
	warnings: {
		bookmarkDelete       : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'clickActions'
		},
		bookmarkFolderDelete : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'clickActions'
		},
		historyFolderDelete : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'clickActions'
		},
		siteDelete           : {
			value   : true,
			type    : 'boolean',
			targets : []
		},
		rssFeedDelete        : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'clickActions'
		},
		domainFolderClose    : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'clickActions'
		},
		windowClose    : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'clickActions'
		},
		pocketDelete         : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'clickActions'
		},
		pocketFolderDelete   : {
			value   : true,
			type    : 'boolean',
			targets : [],
			handler : 'clickActions'
		}
	},
	theme: {
		mainFontSize: {
			value   : 'medium',
			type    : 'dropdown',
			values  : ['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large'],
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
			targets : [],
			handler : 'clickActions'
		},
		sidebarImageStyle : {
			value   : 'cover',
			type    : 'select',
			values  : ['cover', 'contain', 'center', 'repeat'],
			targets : [],
			handler : 'clickActions'
		}
	},
	misc: {
		limitHistory       : {
			value   : 50,
			type    : 'integer',
			range   : [10, 999],
			targets : [],
			handler : 'clickActions'
		},
		maxSavedRssPerFeed : {
			value   : 99,
			type    : 'integer',
			range   : [10, 999],
			targets : [],
			handler : 'clickActions'
		},
		rssUpdatePeriod    : {
			value   : 60,
			type    : 'integer',
			range   : [20, 999],
			targets : [],
			handler : 'clickActions'
		},
		rssHideReaded      : {
			value   : false,
			type    : 'boolean',
			targets : [],
			handler : 'rssReadedMode',
			hidden  : true
		},
		wikiSearchLang : {
			value   : 'en',
			type    : 'text',
			targets : []
		},
		treeMaxDepth   : {
			value   : 0,
			type    : 'integer',
			range   : [0, 10],
			targets : 'sidebar'
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
		},
		bookmarksMode      : {
			value   : 'tree',
			type    : 'select',
			values  : ['plain', 'tree'],
			targets : [],
			hidden  : true
		},
		pocketMode      : {
			value   : 'type',
			type    : 'select',
			values  : ['plain', 'domain', 'type'],
			targets : [],
			handler : 'view',
			hidden  : true
		},
		manualSwitch    : {
			value   : false,
			type    : 'boolean',
			targets : ['content']
		},
		searchAtTop     : {
			value   : false,
			type    : 'boolean',
			targets : ['sidebar']
		},
		hideInFullscreen : {
			value   : true,
			type    : 'boolean',
			targets : ['content']
		}
	},
	startpage: {
		empty          : {
			value   : false,
			type    : 'boolean',
			targets : [],
			handler : 'empty'
		},
		mode           : {
			value   : 'sites',
			values  : ['sites', 'search'],
			type    : 'select',
			targets : ['startpage'],
			hidden  : true
		},
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
			targets : [],
			handler : 'searchEnabled'
		},
		image : {
			value   : '',
			type    : 'image',
			targets : ['startpage']
		},
		imageStyle : {
			value   : 'cover',
			type    : 'select',
			values  : ['cover', 'contain', 'center', 'repeat'],
			targets : ['startpage']
		}
	},
	status: {
		hidden : {},
		nativeSbPosition: {
			value: 'leftBar'
		}
	},
	scroll : {
		hidden : {},
		tabs      : {
			value   : 0,
			targets : [],
			handler : 'scroll'
		},
		bookmarks : {
			value   : 0,
			targets : [],
			handler : 'scroll'
		},
		history   : {
			value   : 0,
			targets : [],
			handler : 'scroll'
		},
		downloads : {
			value   : 0,
			targets : [],
			handler : 'scroll'
		},
		rss       : {
			value   : 0,
			targets : [],
			handler : 'scroll'
		},
		pocket    : {
			value   : 0,
			targets : [],
			handler : 'scroll'
		},
		search    : {
			value   : 0,
			targets : [],
			handler : 'scroll'
		}
	},
	pocket: {
		hidden : {},
		accessToken : {
			value   : '',
			type    : 'text',
			targets : []
		},
		username    : {
			value   : '',
			type    : 'text',
			targets : []
		},
		auth        : {
			value   : false,
			type    : 'boolean',
			targets : []
		}
	},
	search: {
		hidden    : {},
		duckduckgo : {
			value   : true,
			type    : 'boolean',
			mode    : 'general',
			targets : [],
			handler : 'searchEngine'
		},
		google     : {
			value   : false,
			type    : 'boolean',
			mode    : 'general',
			targets : [],
			handler : 'searchEngine'
		},
		yandex     : {
			value   : false,
			type    : 'boolean',
			mode    : 'general',
			targets : [],
			handler : 'searchEngine'
		},
		bing       : {
			value   : false,
			type    : 'boolean',
			mode    : 'general',
			targets : [],
			handler : 'searchEngine'
		},
		yahoo      : {
			value   : false,
			type    : 'boolean',
			mode    : 'general',
			targets : [],
			handler : 'searchEngine'
		},
		wikipedia  : {
			value   : false,
			type    : 'boolean',
			mode    : 'dev',
			targets : [],
			handler : 'searchEngine'
		}
	},
	spSearch: {
		hidden    : {},
		duckduckgo : {
			value   : true,
			type    : 'boolean',
			mode    : 'general',
			targets : [],
			handler : 'searchEngine'
		},
		google     : {
			value   : true,
			type    : 'boolean',
			mode    : 'general',
			targets : [],
			handler : 'searchEngine'
		},
		yandex     : {
			value   : true,
			type    : 'boolean',
			mode    : 'general',
			targets : [],
			handler : 'searchEngine'
		},
		bing       : {
			value   : true,
			type    : 'boolean',
			mode    : 'general',
			targets : [],
			handler : 'searchEngine'
		},
		yahoo      : {
			value   : true,
			type    : 'boolean',
			mode    : 'general',
			targets : [],
			handler : 'searchEngine'
		},
		wikipedia  : {
			value   : true,
			type    : 'boolean',
			mode    : 'dev',
			targets : [],
			handler : 'searchEngine'
		}
	},
	tabsClickActions: {
		hidden : {},
		normal : {
			value   : 'setActive',
			type    : 'select',
			values  : ['setActive', 'close', 'bookmark', 'pinUnpin', 'duplicate'],
			targets : [],
			handler : 'clickActions'
		},
		middle : {
			value   : 'close',
			type    : 'select',
			values  : ['setActive', 'close', 'bookmark', 'pinUnpin', 'duplicate'],
			targets : [],
			handler : 'clickActions'
		},
		alt    : {
			value   : 'setActive',
			type    : 'select',
			values  : ['setActive', 'close', 'bookmark', 'pinUnpin', 'duplicate'],
			targets : [],
			handler : 'clickActions'
		},
		ctrl   : {
			value   : 'close',
			type    : 'select',
			values  : ['setActive', 'close', 'bookmark', 'pinUnpin', 'duplicate'],
			targets : [],
			handler : 'clickActions'
		},
		shift  : {
			value   : 'pinUnpin',
			type    : 'select',
			values  : ['setActive', 'close', 'bookmark', 'pinUnpin', 'duplicate'],
			targets : [],
			handler : 'clickActions'
		}
	},
	bookmarksClickActions: {
		hidden : {},
		normal : {
			value   : 'open',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'deleteBookmark'],
			targets : [],
			handler : 'clickActions'
		},
		middle : {
			value   : 'deleteBookmark',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'deleteBookmark'],
			targets : [],
			handler : 'clickActions'
		},
		alt    : {
			value   : 'open',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'deleteBookmark'],
			targets : [],
			handler : 'clickActions'
		},
		ctrl   : {
			value   : 'openInNewTab',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'deleteBookmark'],
			targets : [],
			handler : 'clickActions'
		},
		shift  : {
			value   : 'openInNewWindow',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'deleteBookmark'],
			targets : [],
			handler : 'clickActions'
		}
	},
	historyClickActions: {
		hidden : {},
		normal : {
			value   : 'open',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		},
		middle : {
			value   : 'bookmark',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		},
		alt    : {
			value   : 'open',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		},
		ctrl   : {
			value   : 'openInNewTab',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		},
		shift  : {
			value   : 'openInNewWindow',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		}
	},
	downloadsClickActions: {
		hidden : {},
		normal : {
			value   : 'openFile',
			type    : 'select',
			values  : ['openFile', 'openFolder', 'deleteFile'],
			targets : [],
			handler : 'clickActions'
		},
		middle : {
			value   : 'deleteFile',
			type    : 'select',
			values  : ['openFile', 'openFolder', 'deleteFile'],
			targets : [],
			handler : 'clickActions'
		},
		alt    : {
			value   : 'openFile',
			type    : 'select',
			values  : ['openFile', 'openFolder', 'deleteFile'],
			targets : [],
			handler : 'clickActions'
		},
		ctrl   : {
			value   : 'openFolder',
			type    : 'select',
			values  : ['openFile', 'openFolder', 'deleteFile'],
			targets : [],
			handler : 'clickActions'
		},
		shift  : {
			value   : 'openFolder',
			type    : 'select',
			values  : ['openFile', 'openFolder', 'deleteFile'],
			targets : [],
			handler : 'clickActions'
		}
	},
	rssClickActions: {
		hidden : {},
		normal : {
			value   : 'open',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'markReaded', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		},
		middle : {
			value   : 'bookmark',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'markReaded', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		},
		alt    : {
			value   : 'markRead',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'markReaded', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		},
		ctrl   : {
			value   : 'openInNewTab',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'markReaded', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		},
		shift  : {
			value   : 'openInNewWindow',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'markReaded', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		}
	},
	pocketClickActions: {
		hidden : {},
		normal : {
			value   : 'open',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'deletePocket'],
			targets : [],
			handler : 'clickActions'
		},
		middle : {
			value   : 'deletePocket',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'deletePocket'],
			targets : [],
			handler : 'clickActions'
		},
		alt    : {
			value   : 'open',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'deletePocket'],
			targets : [],
			handler : 'clickActions'
		},
		ctrl   : {
			value   : 'openInNewTab',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'deletePocket'],
			targets : [],
			handler : 'clickActions'
		},
		shift  : {
			value   : 'openInNewWindow',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'deletePocket'],
			targets : [],
			handler : 'clickActions'
		}
	},
	searchClickActions: {
		hidden : {},
		normal : {
			value   : 'open',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		},
		middle : {
			value   : 'bookmark',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		},
		alt    : {
			value   : 'open',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		},
		ctrl   : {
			value   : 'openInNewTab',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		},
		shift  : {
			value   : 'openInNewWindow',
			type    : 'select',
			values  : ['open', 'openInNewTab', 'openInNewInactiveTab', 'openInNewWindow', 'bookmark'],
			targets : [],
			handler : 'clickActions'
		}
	},
	tabsHoverActions: {
		hidden  : {},
		fav: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		move: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		reload: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		pin: {
			value   : false,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		unpin: {
			value   : false,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		duplicate: {
			value   : false,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		close: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		closeAll: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		}
	},
	bookmarksHoverActions: {
		hidden  : {},
		move: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		delete: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		folderDelete: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		edit: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		openAll : {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		}
	},
	historyHoverActions: {
		hidden  : {},
		delete: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		folderDelete: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
	},
	downloadsHoverActions: {
		hidden  : {},
		pause: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		resume: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		reload: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		stop: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		delete: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		}
	},
	rssHoverActions: {
		hidden  : {},
		options: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		move: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		reload: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		markReaded: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		markReadedAll: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		}
	},
	pocketHoverActions: {
		hidden  : {},
		move: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		fav: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		unfav: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		archive: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		unarchive: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		folderArchive: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		delete: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		},
		folderDelete: {
			value   : true,
			type    : 'boolean',
			handler : 'hoverActions',
			targets : []
		}
	},
	searchHoverActions: {
		hidden  : {}
	}
};

const optionsShort = {};

const sidebarAction =
	firefox ?
		browser.hasOwnProperty('sidebarAction') ?
			browser.sidebarAction :
			null :
		opera ?
			opr.hasOwnProperty('sidebarAction') ?
				opr.sidebarAction :
				null :
			null;

const modeData = {
	tabs      : _ => {},
	bookmarks : _ => {},
	history   : _ => {},
	downloads : _ => {},
	rss       : _ => {},
	pocket    : _ => {},
	search    : _ => {}
};

const optionsHandler = {
	method  : (section, option, newValue) => {
		const oldValueHandler = {
			iframe   : _ => {
				send('content', 'iframe', 'remove', {'side': section});
			},
			native   : _ => {
				status.nativeActive = false;
			},
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
				status.nativeActive = true;
			},
			window   : _ => {
				createSidebarWindow(section);
			},
			disabled : _ => {},
		};
		oldValueHandler[options[section].method.value]();
		newValueHandler[newValue]();
		setOption(section, 'method', newValue, false);
		setIcon();
	},
	mode    : (section, option, newValue) => {
		setOption(section, 'mode', newValue, false);
		send(section, 'options', 'mode', {'value': newValue, 'data': modeData[newValue]()});
	},
	service : (section, option, newValue) => {
		if (newValue) {
			initService[option](true);
			send('sidebar', 'options', 'services', {'service': option, 'enabled': true});
		}
		else {
			const firstEnabledService = side => {
				for (let services = ['tabs', 'bookmarks', 'history', 'downloads', 'rss'], i = services.length - 1; i >= 0; i--) {
					if (options.services[services[i]].value === true && services[i] !== option) {
						setOption(side, 'mode', services[i], false);
						send(side, 'options', 'mode', {value: services[i], data: modeData[services[i]]()});
						break;
					}
				}
			};
			if (options.leftBar.mode.value === option)
				firstEnabledService('leftBar');
			if (options.rightBar.mode.value === option)
				firstEnabledService('rightBar');
			initService[option](false);
			send('sidebar', 'options', 'services', {'service': option, 'enabled': false});
		}
	},
	startpage : (section, option, newValue) => {
		initService.startpage(newValue);
	},
	sites   : (section, option, newValue) => {
		const oppositeDimension = {
			rows    : 'columns',
			columns : 'rows'
		};
		const change = options.startpage[option].value - newValue;
		makeTimeStamp('startpage');
		if (change < 0) {
			const oldLength = options.startpage[option].value * options.startpage[oppositeDimension[option]].value;
			const newLength = newValue * options.startpage[oppositeDimension[option]].value;
			send('startpage', 'site', 'addSites', {'sites': data.startpage.slice(oldLength, newLength)});
		}
		else
			send('startpage', 'site', 'remove', '');
	},
	view    : (section, option, newValue) => {
		const mode = option.replace('Mode', '');
		if (options.leftBar.mode.value === mode)
			send('leftBar', mode, 'view', {'view': newValue, 'items': data[mode], 'folders': data[`${mode}Folders`], 'windowsFolders': data.windowsFolders});
		else
			send('leftBar', 'options', option, newValue);
		if (options.rightBar.mode.value === mode)
			send('rightBar', mode, 'view', {'view': newValue, 'items': data[mode], 'folders': data[`${mode}Folders`], 'windowsFolders': data.windowsFolders});
		else
			send('rightBar', 'options', option, newValue);
	},
	empty   : (section, option, newValue) => {
		for (let i = data.tabs.length - 1; i >= 0; i--) {
			if (data.tabs[i].url === config.extensionStartPage)
				brauzer.tabs.reload(data.tabs[i].id);
		}
	},
	scroll           : (section, option, newValue) => {
		if (options.leftBar.mode.value === option)
			send('leftBar', 'set', 'scroll', newValue);
		if (options.rightBar.mode.value === option)
			send('rightBar', 'set', 'scroll', newValue);
	},
	rssReadedMode    : (section, option, newValue) => {
		send('sidebar', 'rss', 'readedMode', newValue);
	},
	searchEngine     : (section, option, newValue) => {
		const target = section === 'search' ? 'sidebar' : 'startpage';
		const folder = getFolderById(section, option);
		if (folder === false) return;
		folder.hidden = options[section][option].value;
		if (options[section][option].value === false)
			send(target, 'search', 'showFolder', {'id': option});
		else
			send(target, 'search', 'hideFolder', {'id': option});
	},
	searchEnabled    : (section, option, newValue) => {
		send('startpage', 'options', 'searchEnabled', {'value': newValue, 'searchFolders': data.searchFolders, 'searchQuery': data.searchQuery});
	},
	hoverActions     : (section, option, newValue) => {
		const mode = section.replace('HoverActions', '');
		send('sidebar', 'options', 'hoverActions', {'mode': mode, 'option': option, 'value': newValue});
	},
	clickActions     : (section, option, newValue) => {
		const mode = section.replace('ClickActions', '');
		send('sidebar', 'options', 'clickActions', {'mode': mode, 'option': option, 'value': newValue});
	}
};

const messageHandler = {

	request : {
		content : (message, sender, sendResponse) => {
			if (status.init.tabs === false) {
				sendResponse(undefined);
				return;
			}
			const tab = getById('tabs', sender.tab.id);
			if (tab === false) return;
			sendResponse({
				'id'       : tab.id,
				'zoom'     : tab.zoom,
				'leftBar'  : optionsShort.leftBar,
				'rightBar' : optionsShort.rightBar,
				'theme'    : {
					'mainFontSize'      : optionsShort.theme.mainFontSize,
					'borderColor'       : optionsShort.theme.borderColor,
					'borderColorActive' : optionsShort.theme.borderColorActive
				},
				'misc'     : {
					'manualSwitch'      : optionsShort.misc.manualSwitch,
					'hideInFullscreen'  : optionsShort.misc.hideInFullscreen
				}
			});
			if (status.dialogData !== null)
				setTimeout(_ => {sendToTab(sender.tab.id, 'content', 'dialog', 'create', status.dialogType);}, 50);
		},
		mode : (message, sender, sendResponse) => {
			const handler = {
				window: side => {
					status[side].tabId  = sender.tab.id;
					sendResponse(sideBarData(side, {'id': -1, 'zoom': 1}));
				},
				native: side => {
					status.nativeActive = true;
					let trueSide        = side;
					const oppositeSide  = {
						'leftBar'  : 'rightBar',
						'rightBar' : 'leftBar'
					};
					if (firefox) {
						if (options[side].method.value !== 'native')
							if (options[oppositeSide[side]].method.value === 'native')
								trueSide = oppositeSide[side];
							else
								optionsHandler.method(options.status.nativeSbPosition.value, 'method', 'native');
					}
					sendResponse(sideBarData(trueSide, {'id': -1, 'zoom': 1}));
				},
				iframe: side => {
					const tab = getById('tabs', sender.tab.id);
					if (tab === false) return;
					tab.activated = true;
					sendResponse(sideBarData(side, tab));
				}
			};
			if (status.init[options[message.data.side].mode.value] === true)
				handler[message.data.method](message.data.side);
			else sendResponse(undefined);
		},
		startpage : (message, sender, sendResponse) => {
			if (status.init.startpage === true)
				if (options.services.startpage.value === true) {
					const tab = getById('tabs', sender.tab.id);
					if (tab === false) return;
					sendResponse(startpageData(tab));
				}
		},
		options : (message, sender, sendResponse) => {
			sendResponse(options);
		},
		popup : (message, sender, sendResponse) => {
			let zoom  = 1;
			const tab = getById('tabs', status.activeTabsIds[status.activeWindow]);
			if (tab !== false)
				zoom = tab.zoom;
			sendResponse({'leftBar': options.leftBar.method, 'rightBar': options.rightBar.method, 'status': options.status, 'zoom': zoom});
		},
		dialog : (message, sender, sendResponse) => {
			const tab = getById('tabs', sender.tab.id);
			if (tab === false) return;
			sendResponse({'data': status.dialogData, 'warnings': optionsShort.warnings, 'theme': optionsShort.theme, 'zoom': tab.zoom});
			status.dialogData = null;
		}
	},

	options : {
		handler: message => {
			const section  = message.data.section;
			const option   = message.data.option;
			const value    = message.data.value;
			if (options[section][option].hasOwnProperty('handler'))
				optionsHandler[options[section][option].handler](section, option, value);
			setOption(section, option, value, true);
		},
	},

	set : {
		fold : message => {
			const mode   = message.data.mode;
			const folder = getFolderById(mode, message.data.id);
			if (folder === false) return;
			const fid   = `${mode}-${message.data.id}`;
			const index = data.foldedId.indexOf(fid);
			if (index !== -1) {
				if (message.data.folded === false) {
					data.foldedId.splice(index, 1);
					saveNow('foldedId');
				}
			}
			else if (message.data.folded === true) {
				data.foldedId.push(fid);
				saveNow('foldedId');
			}
			folder.folded = message.data.folded;
			makeTimeStamp(mode);
			send('sidebar', 'set', 'fold', {'mode': mode === 'windows' ? 'tabs' : mode, 'id': message.data.id, 'folded': message.data.folded, 'method': message.data.folded ? 'add' : 'remove'});
		},
		rightClick : message => {
			send('content', 'set', 'rightClick', '');
		}
	},

	dialog : {
		siteCreate : message => {
			createDialogWindow(message.action, message.data);
		},
		siteChange : message => {
			const site = data.startpage[message.data.index];
			if (site === undefined) return;
			createDialogWindow(message.action, {
				index : message.data.index,
				url   : site.url,
				text  : site.text,
				color : site.color
			});
		},
		siteDelete : message => {
			createDialogWindow(message.action, message.data);
		},
		windowClose: message => {
			const folder = getFolderById('windows', parseInt(message.data.id));
			if (folder === false) return;
			createDialogWindow(message.action, {'id': message.data.id, 'title': folder.title});
		},
		domainFolderClose : message => {
			const folder = getFolderById('tabs', message.data.id);
			if (folder === false) return;
			createDialogWindow(message.action, {'id': message.data.id, 'title': folder.title});
		},
		bookmarkDelete : message => {
			createDialogWindow(message.action, message.data);
		},
		bookmarkFolderDelete : message => {
			createDialogWindow(message.action, message.data);
		},
		bookmarkNew : message => {
			const activeTab = getById('tabs', status.activeTabsIds[status.activeWindow]);
			if (activeTab === false) return;
			const dataToSend = {
				'id'      : status.activeTabsIds[status.activeWindow],
				'url'     : activeTab.url,
				'title'   : activeTab.title,
				'folders' : data.bookmarksFolders
			};
			createDialogWindow(message.action, dataToSend);
		},
		bookmarkFolderNew : message => {
			createDialogWindow(message.action, {'folders': data.bookmarksFolders});
		},
		bookmarkTab : message => {
			const tab = getById('tabs', message.data.id);
			if (tab === false) return;
			const dataToSend = {
				'id'      : tab.id,
				'url'     : tab.url,
				'title'   : tab.title,
				'folders' : data.bookmarksFolders
			};
			createDialogWindow('bookmarkNew', dataToSend);
		},
		bookmarkEdit : message => {
			const bookmark = getById('bookmarks', message.data.id);
			if (bookmark === false) return;
			createDialogWindow('bookmarkEdit', {'id': message.data.id, 'url': bookmark.url,'title': bookmark.title});
		},
		bookmarkFolderEdit : message => {
			const folder = getFolderById('bookmarks', message.data.id);
			if (folder === false) return;
			createDialogWindow('bookmarkFolderEdit', {'id': message.data.id, 'title': folder.title});
		},
		historyFolderDelete : message => {
			createDialogWindow(message.action, message.data);
		},
		rssNew : message => {
			const activeTab = getById('tabs', status.activeTabsIds[status.activeWindow]);
			if (activeTab !== false)
				if (tabIsProtected(activeTab) === false)
					return send('content', 'dialog', 'checkRss', '');
			createDialogWindow(message.action, message.data);
		},
		rssImportExport : message => {
			createDialogWindow(message.action, message.data);
		},
		rssUrlConfirmed : message => {
			createDialogWindow('rssNew', message.data);
		},
		rssFeedEdit : message => {
			createDialogWindow(message.action, message.data);
		},
		rssFeedDelete : message => {
			createDialogWindow(message.action, message.data);
		},
		downloadDelete : message => {
			createDialogWindow(message.action, message.data);
		},
		remove : (message, sender, sendResponse) => {
			sendToTab(sender.tab.id, 'content', 'dialog', 'remove');
		},
		pocketNew : message => {
			const activeTab = getById('tabs', status.activeTabsIds[status.activeWindow]);
			if (activeTab !== false)
				createDialogWindow(message.action, {
					'url'   : activeTab.url,
					'title' : activeTab.title
				});
		},
		pocketDelete: message => {
			const pocket = getById('pocket', message.data);
			if (pocket === false) return;
			createDialogWindow(message.action, {'id': pocket.id, 'title': pocket.title});
		},
		pocketFolderDelete: message => {
			const folder = getFolderById('pocket', message.data);
			if (folder === false) return;
			createDialogWindow(message.action, {'id': folder.id, 'title': folder.title});
		},
		searchSelect: message => {
			createDialogWindow('searchSelect', {
				'target'      : 'search',
				'options'     : optionsShort.search,
				'searchTypes' : config.searchTypes
			});
		},
		spSearchSelect: message => {
			createDialogWindow('searchSelect', {
				'target'      : 'spSearch',
				'options'     : optionsShort.spSearch,
				'searchTypes' : config.searchTypes
			});
		},
		actions     : message => {
			createDialogWindow(message.action, {'type': message.data, 'clickActions': options[`${message.data}ClickActions`], 'prefix': `${message.data}Controls`,'hoverActions': optionsShort[`${message.data}HoverActions`]});
		}
	},

	startpage : null,

	tabs      : null,

	bookmarks : null,

	history   : null,

	downloads : null,

	rss       : null
};

const execMethod  = firefox ?
(method, callback, options) => {
	return options === undefined ? method().then(callback) : method(options).then(callback);
} :
(method, callback, options) => {
	return typeof options === 'undefined' ? method(callback) : method(options, callback);
};

const initExtension = res => {

	const resetOptions = 33;
	const resetFavs    = 0;
	const resetRss     = 0;

	const starter = _ => {
		if (sidebarAction !== null) {
			options.leftBar.method.values.push('native');
			if (firefox)
				options.rightBar.method.values.push('native');
		}
		for (let section in options) {
			optionsShort[section] = {};
			for (let option in options[section])
				if (options[section][option].hasOwnProperty('value'))
					optionsShort[section][option] = options[section][option].value;
		}
		initService.data(true);
	};

	const setDefaults = _ => {
		status.firstInit = true;
		brauzer.windows.getCurrent({}, win => {
			for (let service of ['tabs', 'bookmarks', 'history', 'downloads']) {
				if (!brauzer.hasOwnProperty(service)) {
					options.services[service].value  = false;
					options.services[service].hidden = true;
				}
			}
			options.startpage.rows.value           = Math.ceil(win.height / 400);
			options.startpage.columns.value        = Math.ceil(win.width  / 400);
			const top = topSites => {
				for (let i = 0, l = options.startpage.rows.range[1] * options.startpage.columns.range[1] - 1; i < l; i++)
					data.startpage.push(makeSite(i, topSites[i]));
				saveNow('version');
				saveNow('options');
				saveNow('startpage');
				starter();
			};
			execMethod(brauzer.topSites.get, top);
		});
	};

	if (res.hasOwnProperty('version')) {
		if (res.hasOwnProperty('data'))
			brauzer.storage.local.remove('data');
		const oldVersion = parseInt(res.version) || 0;
		if (oldVersion < config.version) {
			saveNow('version');
			if (resetFavs > oldVersion)
				saveNow('favs');
			if (resetRss > oldVersion) {
				saveNow('rss');
				saveNow('rssFolders');
			}
			if (resetOptions > oldVersion)
				return setDefaults();
		}
		if (res.hasOwnProperty('options')) {
			for (let section in res.options)
				for (let option in res.options[section])
					if (options.hasOwnProperty(section))
						if (options[section].hasOwnProperty(option))
							options[section][option].value = res.options[section][option];
			starter();
		}
	}
	else
		setDefaults();
};

execMethod(brauzer.storage.local.get, initExtension, ['options', 'version']);

const updateItem = {
	tabs       : null,
	bookmarks  : null,
	history    : null,
	downloads  : null,
	rss        : null,
	pocket     : null,
	search     : null,
	spSearch   : null,
	domains    : (newItem, item) => {
		newItem.fav   = item.fav;
		newItem.title = item.title;
		return newItem;
	},
	favs      : (newItem, item) => {
		newItem.fav      = item.fav;
		newItem.lastUsed = Date.now();
		return newItem;
	}
};

updateItem.tabsDomains      = updateItem.domains;
updateItem.bookmarksDomains = updateItem.domains;
updateItem.historyDomains   = updateItem.domains;
updateItem.rssDomains       = updateItem.domains;
updateItem.pocketDomains    = updateItem.domains;
updateItem.searchDomains    = updateItem.domains;
updateItem.spSearchDomains  = updateItem.domains;

const updateFolder = {
	tabs       : null,
	bookmarks  : null,
	history    : null,
	downloads  : null,
	rss        : null,
	pocket     : null
};

const initService = {

	data      : _ => {

		const gettingStorage = res => {

			const initLater = [];

			if (Array.isArray(res.favs) && Array.isArray(res.favsId)) {
				data.favs            = res.favs;
				data.favsId          = res.favsId;
				cleanFavs();
			}
			if (Array.isArray(res.foldedId))
				data.foldedId        = res.foldedId;
			if (Array.isArray(res.tabsWithOpeners)) {
				data.tabsWithOpeners = res.tabsWithOpeners;
				for (let i = data.tabsWithOpeners.length - 1; i >= 0; i--) {
					data.tabsWithOpenersId[i]        = 0;
					data.tabsWithOpeners[i].openerId = 0;
					data.tabsWithOpeners[i].windowId = 0;
				}
			}

			for (let service in options.services)
				if (options.services[service].value === true) {
					if (service === 'startpage')
						initService.startpage(true);
					else if (options.leftBar.mode.value === service || options.rightBar.mode.value === service)
						initService[service](true);
					else
						initLater.push(service);
				}
				else
					status.init[service] = true;

			setTimeout(_ => {
				for (let i = initLater.length - 1; i >= 0; i--)
					initService[initLater[i]](true);
			}, 2000);
			if (sidebarAction !== null) {
				let port;
				brauzer.runtime.onConnect.addListener(p => {
					if (opera) {
						setOption('leftBar', 'method', 'native', false);
						optionsHandler.method('leftBar', 'method', 'native');
					}
					status.nativeCount++;
					port = p;
					port.onDisconnect.addListener(_ => {
						status.nativeCount--;
						if (status.nativeCount < 1) {
							if (options.leftBar.method.value === 'native')
								optionsHandler.method('leftBar', 'method', 'disabled');
							else if (options.rightBar.method.value === 'native')
								optionsHandler.method('rightBar', 'method', 'disabled');
						}
					});
				});
				if (firefox) {
					status.sideDetection         = {};
					status.sideDetection.sidebar = '';
					status.sideDetection.content = '';
					messageHandler.sidebar       = {
						sideDetection: message => {
							const setSide = (sender, side) => {
								status.sideDetection[sender] = side;
								setTimeout(_ => {status.sideDetection[sender] = '';}, 100);
							};

							const detectSide = (prevSender, side) => {
								if (status.sideDetection[prevSender] !== side)
									return;
								if (options[side].method.value !== 'native') {
									const oppositeSide = {
										leftBar  : 'rightBar',
										rightBar : 'leftBar'
									};
									setOption('status', 'nativeSbPosition', side, false);
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

			brauzer.runtime.onMessage.addListener((message, sender, sendResponse) => {
				// console.log(message);
				if (message.hasOwnProperty('target'))
					if (message.target === 'background')
						if (messageHandler.hasOwnProperty(message.subject))
							if (messageHandler[message.subject].hasOwnProperty(message.action)) {
								messageHandler[message.subject][message.action](message, sender, sendResponse);
								if (message.hasOwnProperty('data'))
									if (message.data.hasOwnProperty('needResponse'))
										return true;
							}
			});

			initWindow();
			setIcon();
		};

		if (status.init.data === true)
			return;
		status.init.data = true;

		execMethod(brauzer.storage.local.get, gettingStorage, ['favs', 'favsId', 'foldedId', 'tabsWithOpeners']);
	},

	startpage : _ => {

		const gettingStorage = res => {
				if (res.hasOwnProperty('startpage'))
					data.startpage = res.startpage;
				else if (res.hasOwnProperty('speadDial')) {
					data.startpage = res.speadDial;
					saveNow('startpage');
				}
			status.init.startpage = true;
		};

		setOption('startpage', 'mode', 'sites');
		messageHandler.startpage = {
			change : message => {
				const site = data.startpage[message.data.index];
				if (site !== undefined) {
					site.text  = message.data.text;
					site.url   = message.data.url;
					site.color = message.data.color;
					saveNow('startpage');
					send('startpage', 'site', 'changed', {'index': message.data.index, 'site': site});
				}
			},
			delete : message => {
				makeSite(message.data.index);
				saveNow('startpage');
				send('startpage', 'site', 'changed', {'index': message.data.index, 'site': data.startpage[message.data.index]});
			},
			create : message => {
				makeSite(message.data.index, message.data);
				saveNow('startpage');
				send('startpage', 'site', 'changed', {'index': message.data.index, 'site': data.startpage[message.data.index]});
			},
			move : message => {
				const movedSite = data.startpage.splice(message.data.from, 1)[0];
				data.startpage.splice(message.data.to, 0, movedSite);
				saveNow('startpage');
				send('startpage', 'site', 'moved', {'from': message.data.from, 'to': message.data.to});
			}
		};
		i18n.startpage = {
			pageTitle            : getI18n('startpagePageTitle'),
			addNewSiteTitle      : getI18n('startpageAddNewSiteTitle'),
			editButtonTitle      : getI18n('startpageEditButtonTitle'),
			searchButtonTitle    : getI18n('startpageSearchButtonTitle'),
			clearSearchTitle     : getI18n('searchClearSearchTitle'),
			searchOptions        : getI18n('searchOptions'),
			modeSites            : getI18n('startpageSitesViewButtonTitle')
		};
		execMethod(brauzer.storage.local.get, gettingStorage, ['startpage', 'speadDial']);
		if (options.startpage.searchEnabled.value === true)
			initService.search(true, 'spSearch');
	},

	tabs      : start => {

		const initTabs = _ => {
			messageHandler.tabs = {
				new : message => {
					brauzer.tabs.create({'url': message.data.url === '' ? config.extensionStartPage : message.data.url, 'windowId': status.activeWindow, 'active': message.data.active});
				},
				undo : message => {
					if (status.info.undoTab.hasOwnProperty('url'))
						brauzer.tabs.create({'url': status.info.undoTab.url, 'active': status.info.undoTab.active});
				},
				update : message => {
					for (let i = data.tabs.length - 1; i >= 0 ; i--)
						if (data.tabs[i].url === message.data.url)
							return brauzer.tabs.update(data.tabs[i].id, {'active': true});
					brauzer.tabs.update(status.activeTabsIds[status.activeWindow], {'url': message.data.url});
				},
				setActive : message => {
					const tab = getById('tabs', message.data.id);
					if (tab === false) return;
					brauzer.tabs.update(message.data.id, {'active': true});
					brauzer.windows.update(tab.windowId, {'focused': true});
				},
				reload : message => {
					brauzer.tabs.reload(message.data.id);
				},
				removeById : message => {
					if (options.services.startpage.value === true)
						for (let i = message.data.idList.length - 1; i >= 0; i--) {
							const tab = getById('tabs', message.data.idList[i]);
							if (tab === false) continue;
						}
					brauzer.tabs.remove(message.data.idList);
				},
				domainFolderClose: message => {
					const folder = getFolderById('tabs', message.data.id);
					if (folder === false) return;
					let toClose = [];
					for (let i = folder.itemsId.length - 1; i >= 0; i--)
						toClose.push(folder.itemsId[i]);
					brauzer.tabs.remove(toClose);
				},
				windowClose : message => {
					const win = getFolderById('windows', parseInt(message.data.id));
					if (win === false) return;
					brauzer.windows.remove(win.id);
				},
				move : message => {
					const id = parseInt(message.data.id);
					const handler = {
						plain  : _ => {
							brauzer.tabs.move(id, {'index': message.data.newIndex});
						},
						domain : _ => {
							if (message.data.isFolder === false) {
								if (message.data.prevElementId === false)
									return brauzer.tabs.move(id, {'index': 0});
								const oldIndex = data.tabsId.indexOf(id);
								const newIndex = data.tabsId.indexOf(parseInt(message.data.prevElementId));
								if (newIndex === -1) return;
								if (oldIndex < newIndex)
									brauzer.tabs.move(id, {'index': newIndex});
								else
									brauzer.tabs.move(id, {'index': newIndex + 1});
							}
							else {
								const oldIndex = data.tabsFoldersId.indexOf(message.data.id);
								if (oldIndex === -1) return;
								moveFromTo('tabsFolders', oldIndex, message.data.newIndex);
								send('sidebar', 'tabs', 'moved', {'id': message.data.id, 'newIndex': message.data.newIndex, 'oldIndex': oldIndex, 'isFolder': true});
							}
						},
						tree   : _ => {
							if (message.data.prevElementId === false)
								return brauzer.tabs.move(id, {'index': 0});
							const oldIndex = data.tabsId.indexOf(id);
							const newIndex = data.tabsId.indexOf(parseInt(message.data.prevElementId));
							if (newIndex === -1) return;
							if (oldIndex < newIndex)
								brauzer.tabs.move(id, {'index': newIndex});
							else
								brauzer.tabs.move(id, {'index': newIndex + 1});
						}
					};

					handler[options.misc.tabsMode.value]();
				},
				pin : message => {
					brauzer.tabs.update(message.data.id, {'pinned': true});
				},
				unpin : message => {
					brauzer.tabs.update(message.data.id, {'pinned': false});
				},
				duplicate : message => {
					brauzer.tabs.duplicate(message.data.id);
				},
				showSearchBar : message => {
					status.info.tabsSearchBar = message.data;
					send('sidebar', 'tabs', 'showSearchBar', status.info.tabsSearchBar);
				},
				search : message => {
					status.info.tabsSearch    = true;
					status.info.tabsSearchBar = true;
					data.tabsSearch           = [];
					data.tabsSearchTerm       = message.data.request;
					for (let i = 0, l = data.tabsId.length; i < l; i++) {
						if (Array.isArray(data.tabs[i].title.toLowerCase().match(data.tabsSearchTerm)))
							data.tabsSearch.push(data.tabs[i]);
						else if (Array.isArray(data.tabs[i].url.match(data.tabsSearchTerm)))
							data.tabsSearch.push(data.tabs[i]);
					}
					send('sidebar', 'tabs', 'search', {'search': data.tabsSearch, 'searchTerm': data.tabsSearchTerm});
				},
				clearSearch : message => {
					status.info.tabsSearch    = false;
					data.tabsSearch           = [];
					data.tabsSearchTerm       = '';
					send('sidebar', 'tabs', 'clearSearch', {'value': false});
				}
			};

			i18n.tabs = {
				new                : getI18n('tabsNew'),
				undo               : getI18n('tabsUndo'),
				fav                : getI18n('tabsControlsFav'),
				move               : getI18n('tabsControlsMove'),
				reload             : getI18n('tabsControlsReload'),
				pin                : getI18n('tabsControlsPin'),
				unpin              : getI18n('tabsControlsUnpin'),
				duplicate          : getI18n('tabsControlsDuplicate'),
				close              : getI18n('tabsControlsClose'),
				closeAll           : getI18n('tabsControlsCloseAll'),
				plain              : getI18n('tabsPlainModeButton'),
				domain             : getI18n('tabsDomainModeButton'),
				tree               : getI18n('tabsTreeModeButton'),
				search             : getI18n('tabsSearchButton'),
				searchPlaceholder  : getI18n('searchPlaceholder'),
				clearSearchTitle   : getI18n('searchClearSearchTitle')
			};

			modeData.tabs = _ => {
				return {
					mode             : 'tabs',
					timeStamp        : status.timeStamp.tabs,
					i18n             : i18n.tabs,
					tabs             : data.tabs,
					tabsFolders      : data.tabsFolders,
					windowsFolders   : data.windowsFolders,
					domains          : data.tabsDomains,
					activeTabId      : status.activeTabsIds[status.activeWindow]
				};
			};

			brauzer.tabs.onCreated.addListener(createTab);
			brauzer.tabs.onActivated.addListener(onActivated);
			brauzer.tabs.onUpdated.addListener(onUpdated);
			brauzer.tabs.onRemoved.addListener(onRemoved);
			brauzer.tabs.onMoved.addListener(onMoved);
			brauzer.tabs.onZoomChange.addListener(onZoomChange);

			brauzer.windows.onCreated.addListener(onWindowCreated);
			brauzer.windows.onRemoved.addListener(onWindowRemoved);
			brauzer.windows.onFocusChanged.addListener(onFocusChanged);

			status.init.tabs = true;
			if (firefox === false)
				if (opera === false)
					if (status.firstInit)
						brauzer.tabs.create({'active': true});
		};

		const onWindowRemoved   = id => {
			execMethod(brauzer.alarms.getAll, alarms => {
				for (let i = alarms.length - 1; i >= 0; i--)
					if (/removeFromOpeners\*\*/i.test(alarms[i].name)) {
						const tabId    = parseInt(alarms[i].name.split('**').pop());
						const tab      = getById('tabsWithOpeners', tabId);
						if (tab === false) return;
						if (tab.windowId !== id) return;
						brauzer.alarms.clear(alarms[i].name);
					}
			});
			if (status.activeTabsIds.hasOwnProperty(id))
				delete status.activeTabsIds[id];
			deleteFolderById('windows', id);
			send('sidebar', 'tabs', 'windowDelete', id);
			setWindowsView();
		};

		const onWindowCreated   = win => {
			if (win.type === 'normal') {
				const window = createWindow(win);
				send('sidebar', 'tabs', 'windowNew', window);
				setWindowsView();
			}
		};

		const setWindowsView    = _ => {
			if (data.windowsFolders.length === 0) return;
			status.windowsShow = data.windowsFolders.length > 1;
			for (let i = data.windowsFolders.length - 1; i >= 0; i--)
				data.windowsFolders[i].view = status.windowsShow ? 'type' : 'hidden';
			send('sidebar', 'tabs', 'windowsView', {'view': data.windowsFolders[0].view, 'ids': data.windowsFoldersId});
		};

		const onFocusChanged    = id => {
			const win   = getFolderById('windows', id);
			if (win === false) return;
			const tab   = getById('tabs', status.activeTabsIds[id]);
			if (tab === false) return;
			setFocused(win);
			tab.readed  = true;
			closeIframe();
			makeTimeStamp('tabs');
			reInit(tab.id);
			if (options.services.startpage.value === true)
				if (tab.url === config.extensionStartPage)
					send('startpage', 'reInit', 'page', startpageData(tab));
		};

		const setFocused = (win) => {
			for (let i = data.windowsFolders.length - 1; i >= 0; i--)
				data.windowsFolders[i].focused = false;
			win.focused         = true;
			status.activeWindow = win.id;
		};

		const reInit            = id => {
			const tab = getById('tabs', id);
			if (tab === false) return;
			send('sidebar', 'tabs', 'active', status.activeTabsIds[status.activeWindow]);
			if (options.leftBar.method.value === 'iframe')
				send('leftBar', 'set', 'reInit', sideBarData('leftBar', tab));
			if (options.rightBar.method.value === 'iframe')
				send('rightBar', 'set', 'reInit', sideBarData('rightBar', tab));
			send('content', 'reInit', 'sideBar', {
				leftBar  : optionsShort.leftBar,
				rightBar : optionsShort.rightBar,
				theme    : {
					borderColor       : options.theme.borderColor.value,
					borderColorActive : options.theme.borderColorActive.value,
					mainFontSize      : options.theme.mainFontSize.value
				},
				misc     : {
					manualSwitch      : options.misc.manualSwitch.value
				}
			});
		};

		const closeIframe       = _ => {
			if (options.leftBar.method.value === 'iframe')
				if (options.leftBar.fixed.value === false)
					if (options.misc.manualSwitch.value === false)
						if (options.leftBar.open.value === true)
							setOption('leftBar', 'open', false);
			if (options.rightBar.method.value === 'iframe')
				if (options.rightBar.fixed.value === false)
					if (options.misc.manualSwitch.value === false)
						if (options.rightBar.open.value === true)
							setOption('rightBar', 'open', false);
		};

		const createWindow      = item => {
			let win     = getFolderById('windows', item.id);
			if (win !== false) return win;
			win         = createFolderById('windows', item.id);
			win.folded  = false;
			win.hidden  = false;
			win.view    = 'type';
			win.domain  = 'windows';
			win.pid     = 0;
			win.focused = item.focused;
			if (win.focused)
				setFocused(win);
			win.title   = `${i18n.domains.windows} #${item.id}`;
			return win;
		};

		const createTab         = tab => {
			if (status.sidebarWindowCreating === true) {
				status.sidebarWindowCreating = false;
				return false;
			}
			if (tab.url === status.info.undoTab.url) {
				status.info.undoTab.url   = '';
				status.info.undoTab.title = '';
				send('sidebar', 'tabs', 'undo', {'url': '', 'title': ''});
			}
			const newTab = createById('tabs', tab, 'last');
			send('sidebar', 'tabs', 'created', {'tab': newTab});
			return newTab;
		};

		const onActivated       = tabInfo => {
			const tab    = getById('tabs', tabInfo.tabId);
			if (tab === false) return;
			status.activeTabsIds[tabInfo.windowId] = tabInfo.tabId;
			tab.readed   = true;
			const folder = getFolderById('tabs', tab.pid);
			if (folder !== false)
				if (folder.folded === true)
					messageHandler.set.fold({'data' : {'mode': 'tabs', 'id': folder.id, 'folded': false}});
			closeIframe();
			makeTimeStamp('tabs');
			reInit(tabInfo.tabId);
			if (options.services.startpage.value === true)
				if (tab.url === config.extensionStartPage)
					send('startpage', 'reInit', 'page', startpageData(tab));
		};

		const onUpdated         = (id, info, tab) => {
			makeTimeStamp('tabs');
			const oldTab = getById('tabs', id);
			if (oldTab === false)
				return createTab(tab);
			const oldFolder = getFolderById('tabs', oldTab.pid);
			if (info.hasOwnProperty('pinned')) {
				oldTab.pinned = info.pinned;
				send('sidebar', 'tabs', info.pinned === true ? 'pinned' : 'unpinned', {'id': id});
			}
			if (info.hasOwnProperty('url')) {
				if (info.url === oldTab.url) return;
				if (info.url === 'about:blank') return;
				if (tab.url === status.info.undoTab.url) {
					status.info.undoTab.url   = '';
					status.info.undoTab.title = '';
					send('sidebar', 'tabs', 'undo', {'url': '', 'title': ''});
				}
				getZoom(id, oldTab);
				for (let i = data.tabsWithOpeners.length - 1; i >= 0; i--) {
					if (data.tabsWithOpeners[i].url === oldTab.url)
						data.tabsWithOpeners[i].url       = info.url;
					if (data.tabsWithOpeners[i].openerUrl === oldTab.url)
						data.tabsWithOpeners[i].openerUrl = info.url;
				}
				saveNow('openers', true);
				if (status.activeTabsIds[status.activeWindow] === id)
					reInit(id);
				if (options.services.search.value === true) {
					let idList = [];
					for (let matched = getByUrl('search', info.url), i = matched.length - 1; i >= 0; i--) {
						matched[i].viewed = true;
						idList.push(matched[i].id);
					}
					if (idList.length > 0) {
						makeTimeStamp('search');
						send('sidebar', 'search', 'viewed', {'idList': idList});
					}
				}
				if (options.services.startpage.value === true) {
					let idList = [];
					for (let matched = getByUrl('spSearch', info.url), i = matched.length - 1; i >= 0; i--) {
						matched[i].viewed = true;
						idList.push(matched[i].id);
					}
					if (idList.length > 0) {
						makeTimeStamp('spSearch');
						send('startpage', 'search', 'viewed', {'idList': idList});
					}
				}
				const newDomain = makeDomain('tabs', info.url);
				newDomain.pid   = `${oldTab.windowId}_${newDomain.id}`;
				oldTab.url      = info.url;
				closeIframe();
				if (newDomain.pid !== oldFolder.id) {
					removeFromFolder('tabs', oldTab);
					oldTab.domain   = newDomain.id;
					oldTab.pid      = newDomain.pid;
					const newFolder = updateFolder.tabs(oldTab, newDomain);
					send('sidebar', 'tabs', 'folderChanged', {'tab': oldTab, 'folder': newFolder});
					if (newFolder.folded === true)
						messageHandler.set.fold({'data' : {'mode': 'tabs', 'id': newFolder.id, 'folded': false}});
				}
				else
					send('sidebar', 'tabs', 'urlChanged', {'id': oldTab.id, 'title': oldTab.title, 'url': oldTab.url});
			}
			if (info.hasOwnProperty('title')) {
				oldTab.title = info.title;
				send('sidebar', 'tabs', 'title', {'id': id, 'title': info.title, 'url': oldTab.url});
				if (options.services.history.value === true) {
					const item = getById('tabs', id);
					if (item === false) return;
					for (let i = data.history.length - 1; i >= 0; i--)
						if (item.url === data.history[i].url) {
							data.history[i].title = info.title;
							send('sidebar', 'history', 'title', {'id': data.history[i].id, 'title': info.title, 'url': data.history[i].url});
							break;
						}
				}
			}
			if (info.hasOwnProperty('status')) {
				oldTab.status = info.status;
				send('sidebar', 'tabs', 'status', {'id': id, 'loading': info.status === 'loading' ? 'add' : 'remove'});
				if (oldFolder.folded === true)
					messageHandler.set.fold({'data' : {'mode': 'tabs', 'id': oldFolder.id, 'folded': false}});
			}
			if (info.hasOwnProperty('favIconUrl')) {
				const domain = getById('tabsDomains', oldTab.domain);
				if (domain === false) return;
				domain.fav = makeFav(domain.id, null, info.favIconUrl, true);
			}
		};

		const onRemoved         = id => {
			makeTimeStamp('tabs');
			const tab = getById('tabs', id);
			if (tab === false) return;
			status.info.undoTab.url    = tab.url;
			status.info.undoTab.title  = tab.title;
			status.info.undoTab.active = status.activeTabsIds[status.activeWindow] === id;
			send('sidebar', 'tabs', 'undo', {'url': tab.url, 'title': tab.title});
			if (tab.url === config.extensionStartPage)
				if (options.startpage.mode.value === 'search')
					messageHandler.spSearch.changeQuery({'data': ''});
			removeFromOpenersTimer(tab);
			send('sidebar', 'tabs', 'removed', {'id': id});
		};

		const removeFromOpenersTimer = tab => {
			removeFromFolder('tabs', tab, true);
			brauzer.alarms.create(`removeFromOpeners**${tab.id}`, {'when': Date.now() + 1000});
			brauzer.alarms.onAlarm.addListener(alarm => {
				if (alarm.name === `removeFromOpeners**${tab.id}`)
					removeFromOpeners(tab);
			});
		};

		const removeFromOpeners = tab => {
			const newOpenerId  = tab.opener;
			const newOpener    = getById('tabs', newOpenerId);
			deleteById('tabsWithOpeners', tab.id);
			if (newOpener !== false) {
				for (let i = data.tabs.length - 1; i >= 0; i--)
					if (data.tabs[i].opener === tab.id)
						data.tabs[i].opener = newOpenerId;
				for (let i = data.tabsWithOpenersId.length - 1; i >= 0; i--)
					if (data.tabsWithOpeners[i].openerId === tab.id) {
						data.tabsWithOpeners[i].openerId  = newOpenerId;
						data.tabsWithOpeners[i].openerUrl = newOpener.url;
					}
			}
			saveNow('openers', true);
		};

		const onMoved           = (id, moveInfo) => {
			const tab = getById('tabs', id);
			if (tab === false) return;
			makeTimeStamp('tabs');
			moveFromTo('tabs', moveInfo.fromIndex, moveInfo.toIndex);
			send('sidebar', 'tabs', 'moved', {'id': id, 'oldIndex': moveInfo.fromIndex, 'newIndex': moveInfo.toIndex, 'isFolder': false, 'window': tab.windowId});
		};

		const onZoomChange      = info => {
			const tab = getById('tabs', info.tabId);
			if (tab === false) return;
			if (tab.zoom === info.newZoomFactor) return;
			tab.zoom = info.newZoomFactor;
			sendZoom(tab);
		};

		const getZoom           = (id, aTab = false) => {
			const tab = aTab === false ? getById('tabs', id) : aTab;
			if (tab === false) return;
			execMethod(brauzer.tabs.getZoom, zoom => {tab.zoom = zoom; sendZoom(tab);}, id);
		};

		const sendZoom          = (tab) => {
			send('content', 'set', 'zoom', {'id': tab.id, 'zoom': tab.zoom});
			if (options.leftBar.method.value === 'iframe')
				send('leftBar', 'set', 'zoom', {'id': tab.id, 'zoom': tab.zoom});
			if (options.rightBar.method.value === 'iframe')
				send('rightBar', 'set', 'zoom', {'id': tab.id, 'zoom': tab.zoom});
			if (options.services.startpage.value === true)
				send('startpage', 'set', 'zoom', {'id': tab.id, 'zoom': tab.zoom});
		};

		const getWindows        = windows => {
			for (let i = 0, l = windows.length; i < l; i++) {
				createWindow(windows[i]);
				for (let j = 0, l = windows[i].tabs.length; j < l; j++) {
					const tab = createTab(windows[i].tabs[j], true);
					if (tab.url === config.extensionStartPage)
						brauzer.tabs.reload(tab.id);
				}
			}
			for (let i = data.tabsId.length - 1; i >= 0; i--)
				for (let j = data.tabsWithOpeners.length - 1; j >= 0; j--) {
					if (data.tabs[i].url === 'about:blank') {
						if (data.tabsWithOpeners[j].url !== data.tabs[i].title)
							continue;
					}
					else if (data.tabsWithOpeners[j].url !== data.tabs[i].url)
						continue;
					data.tabsWithOpenersId[j] = data.tabs[i].id;
					for (let k = data.tabsId.length - 1; k >= 0; k--) {
						if (data.tabs[k].url === 'about:blank') {
							if (data.tabsWithOpeners[j].openerUrl !== data.tabs[k].title)
								continue;
						}
						else if (data.tabsWithOpeners[j].openerUrl !== data.tabs[k].url)
							continue;
						data.tabs[i].opener              = data.tabsId[k];
						data.tabsWithOpeners[j].openerId = data.tabsId[k];
						data.tabsWithOpeners[j].windowId = data.tabs[k].windowId;
					}
				}
			for (let i = data.tabsWithOpenersId.length - 1; i >= 0; i--) {
				if (data.tabsWithOpenersId[i] === 0) {
					data.tabsWithOpenersId.splice(i, 1);
					data.tabsWithOpeners.splice(i, 1);
					continue;
				}
				let hasWindow = false;
				for (let j = windows.length - 1; j >= 0; j--)
					if (data.tabsWithOpeners[i].windowId === windows[j].id)
						hasWindow = true;
				if (!hasWindow) {
					data.tabsWithOpenersId.splice(i, 1);
					data.tabsWithOpeners.splice(i, 1);
				}
			}
			saveNow('openers', true);
			setWindowsView();
			initTabs();
		};

		if (status.init.tabs === false) {
			updateItem.tabs = (newItem, item) => {
				const url    = item.url === 'about:blank' ? item.title : item.url;
				const domain = makeDomain('tabs', url, item.favIconUrl);
				if (item.active === true)
					status.activeTabsIds[item.windowId] = item.id;
				newItem.domain     = domain.id;
				newItem.pid        = `${item.windowId}_${domain.id}`;
				newItem.readed     = status.init.tabs ? item.active ? true : false : true;
				newItem.pinned     = item.pinned;
				newItem.index      = item.index;
				newItem.status     = item.status;
				newItem.opener     = 0;
				if (item.url !== config.extensionStartPage)
					if (item.url !== config.defaultStartPage)
						if (status.init.tabs)
							if (item.hasOwnProperty('openerTabId')) {
								const tabWithOpener = getById('tabsWithOpeners', item.id);
								if (tabWithOpener === false) {
									const openerTab = getById('tabs', item.openerTabId);
									if (openerTab !== false)
										if (openerTab.windowId === item.windowId) {
											newItem.opener  = item.openerTabId;
											data.tabsWithOpenersId.push(item.id);
											data.tabsWithOpeners.push({
												'url'       : item.url === 'about:blank' ? item.title : item.url,
												'openerId'  : item.openerTabId,
												'openerUrl' : openerTab.url,
												'windowId'  : item.windowId
											});
											saveNow('openers', true);
										}
									}
							}
				newItem.url        = url;
				newItem.title      = item.title || '_';
				newItem.discarded  = item.discarded;
				newItem.windowId   = item.windowId;
				newItem.activated  = false;
				newItem.zoom       = 1;
				getZoom(newItem.id, newItem);
				updateFolder.tabs(newItem, domain);
				if (status.init.tabs === true)
					makeTimeStamp('tabs');
				return newItem;
			};

			updateFolder.tabs = (tab, domain) => {
				let folder   = getFolderById('tabs', tab.pid);
				if (folder === false) {
					folder            = createFolderById('tabs', tab.pid);
					folder.pid        = tab.windowId;
					folder.title      = domain.title;
					folder.folded     = getFolded(`tabs-${tab.pid}`);
					folder.view       = 'hidden';
					folder.domain     = domain.id;
					folder.itemsId    = [tab.id];
					send('sidebar', 'tabs', 'newFolder', folder);
				}
				else
					addToFolder('tabs', tab);
				if (status.init.tabs === true)
					makeTimeStamp('tabs');
				return folder;
			};

			execMethod(brauzer.windows.getAll, getWindows, {'populate': true, 'windowTypes': ['normal']});
		}
	},

	bookmarks : start => {

		const initBookmarks = _ => {
			messageHandler.bookmarks = {
				bookmarkDelete : message => {
					brauzer.bookmarks.remove(message.data.id);
				},
				bookmarkFolderDelete : message => {
					brauzer.bookmarks.removeTree(message.data.id);
				},
				bookmarkNew : message => {
					brauzer.bookmarks.create(message.data);
				},
				bookmarkFolderNew : message => {
					brauzer.bookmarks.create(message.data);
				},
				bookmarkEdit :message => {
					brauzer.bookmarks.update(message.data.id, message.data.changes);
				},
				bookmarkFolderEdit :message => {
					brauzer.bookmarks.update(message.data.id, message.data.changes);
				},
				move : message => {
					brauzer.bookmarks.move(message.data.id, {'parentId': message.data.pid, 'index': message.data.newIndex});
				},
				search : message => {
					const onFulfilled = bookmarkItems => {
						data.bookmarksSearch = [];
						const l              = bookmarkItems.length < config.bookmarksLimit ?
							bookmarkItems.length : config.bookmarksLimit;
						for (let i = 0; i < l; i++) {
							if (bookmarkItems[i].hasOwnProperty('url'))
								if (bookmarkItems[i].url !== '')
									data.bookmarksSearch.push({
										id       : bookmarkItems[i].id,
										url      : bookmarkItems[i].url,
										title    : bookmarkItems[i].title,
										domain   : makeDomain('bookmarks', bookmarkItems[i].url).id
									});
						}
						data.bookmarksSearchTerm    = message.data.request;
						status.info.bookmarksSearch = true;
						makeTimeStamp('bookmarks');
						send('sidebar', 'bookmarks', 'search', {'search': data.bookmarksSearch, 'searchTerm': data.bookmarksSearchTerm});
					};
					execMethod(brauzer.bookmarks.search, onFulfilled, {'query': message.data.request});
					return true;
				},
				clearSearch : message => {
					status.info.bookmarksSearch = false;
					send('sidebar', 'bookmarks', 'clearSearch');
				},
				openAll : message => {
					const folder = getFolderById('bookmarks', message.data);
					if (folder === false) return;
					for (let i = folder.itemsId.length - 1; i >= 0; i--) {
						const bookmark = getById('bookmarks', folder.itemsId[i]);
						if (bookmark === false) continue;
						brauzer.tabs.create({'url': bookmark.url, 'windowId': status.activeWindow, 'active': false});
					}
				}
			};

			i18n.bookmarks = {
				new                : getI18n('bookmarksControlsBookmarkThis'),
				folderNew          : getI18n('bookmarksControlsFolderNew'),
				edit               : getI18n('bookmarksControlsEdit'),
				move               : getI18n('bookmarksControlsMove'),
				delete             : getI18n('bookmarksControlsDelete'),
				folderDelete       : getI18n('bookmarksControlsFolderDelete'),
				openAll            : getI18n('bookmarksControlsOpenAll'),
				searchPlaceholder  : getI18n('searchPlaceholder'),
				clearSearchTitle   : getI18n('searchClearSearchTitle')
			};

			modeData.bookmarks = _ => {
				return {
					mode                : 'bookmarks',
					timeStamp           : status.timeStamp.bookmarks,
					i18n                : i18n.bookmarks,
					bookmarks           : data.bookmarks,
					bookmarksFolders    : data.bookmarksFolders,
					search              : data.bookmarksSearch,
					searchTerm          : data.bookmarksSearchTerm,
					domains             : data.bookmarksDomains
				};
			};

			brauzer.bookmarks.onCreated.addListener(onCreated);
			brauzer.bookmarks.onChanged.addListener(onChanged);
			brauzer.bookmarks.onMoved.addListener(onMoved);
			brauzer.bookmarks.onRemoved.addListener(onRemoved);

			if (start === 'reInit') {
				let fakeTab = {'id': -1, 'zoom': 1};
				if (options.leftBar.method.value === 'iframe' || options.rightBar.method.value === 'iframe') {
					const tab = getById('tabs', status.activeTabsIds[status.activeWindow]);
					if (tab !== false)
						fakeTab = tab;
				}
				if (options.leftBar.mode.value === 'bookmarks')
					send('leftBar', 'set', 'reInit', sideBarData('leftBar', fakeTab));
				if (options.rightBar.mode.value === 'bookmarks')
					send('rightBar', 'set', 'reInit', sideBarData('rightBar', fakeTab));
			}
			makeTimeStamp('bookmarks');
			status.init.bookmarks = true;
		};

		const isFolder = firefox ?
			node => {
				if (node.type === 'folder')
					return true;
				return false;
			} :
			node => {
				if (node.hasOwnProperty('url'))
					return false;
				return true;
			} ;

		const parseTree     = folder => {
			if (Array.isArray(folder)) {
				parseTree(folder[0]);
				return initBookmarks();
			}
			let newFolder = {itemsId: []};
			if (folder.parentId !== undefined)
				newFolder = updateFolder.bookmarks(folder);
			if (folder.hasOwnProperty('children'))
				for (let i = 0, l = folder.children.length; i < l; i++) {
					newFolder.itemsId.push(folder.children[i].id);
					if (isFolder(folder.children[i]))
						parseTree(folder.children[i]);
					else
						createById('bookmarks', folder.children[i], 'last');
				}
		};

		const getRecent     = bookmarks => {
			if (bookmarks.length >= config.bookmarksLimit)
				status.tooManyBookmarks = true;
			execMethod(brauzer.bookmarks.getTree, parseTree);
		};

		const onCreated     = (id, bookmark) => {
			makeTimeStamp('bookmarks');
			if (isFolder(bookmark)) {
				send('sidebar', 'bookmarks', 'createdFolder', {'item': updateFolder.bookmarks(bookmark)});
			}
			else
				send('sidebar', 'bookmarks', 'createdBookmark', {'item': createById('bookmarks', bookmark, 'last')});
		};

		const onChanged     = (id, info) => {
			makeTimeStamp('bookmarks');
			const bookmark = getById('bookmarks', id);
			if (bookmark !== false) {
				if (info.hasOwnProperty('url'))
					bookmark.url   = info.url;
				if (info.hasOwnProperty('title'))
					bookmark.title = info.title;
				send('sidebar', 'bookmarks', 'changedBookmark', {'id': id, 'url': bookmark.url, 'title': bookmark.title});
			}
			else {
				const folder = getFolderById('bookmarks', id);
				if (folder === false) return;
				if (info.hasOwnProperty('title')) {
					folder.title = info.title;
					send('sidebar', 'bookmarks', 'changedFolder', {'id': id, 'title': info.title});
				}
			}
		};

		const reIndex = folder => {

			const moveToTheEnd = (mode, id) => {
				const index = data[`${mode}Id`].indexOf(id);
				const item  = data[mode].splice(index, 1)[0];
				data[`${mode}Id`].splice(index, 1);
				data[mode].push(item);
				data[`${mode}Id`].push(id);
				return item;
			};

			const onGet = items => {
				folder.itemsId = [];
				for (let i = 0, l = items[0].children.length; i < l; i++) {
					if (isFolder(items[0].children[i]))
						moveToTheEnd('bookmarksFolders', items[0].children[i].id).index = items[0].children[i].index;
					else
						moveToTheEnd('bookmarks', items[0].children[i].id).index = items[0].children[i].index;
					folder.itemsId.push(items[0].children[i].id);
				}
			};

			execMethod(brauzer.bookmarks.getSubTree, onGet, folder.id);
		};

		const onMoved       = (id, info) => {
			makeTimeStamp('bookmarks');
			const bookmark  = getById('bookmarks', id);
			const oldParent = getFolderById('bookmarks', info.oldParentId);
			const newParent = getFolderById('bookmarks', info.parentId);
			if (oldParent === false || newParent === false) return;
			if (bookmark !== false) {
				reIndex(oldParent);
				if (oldParent !== newParent)
					reIndex(newParent);
				send('sidebar', 'bookmarks', 'moved', {'id': id, 'pid': info.parentId, 'newIndex': info.index, 'isFolder': false});
			}
			else {
				reIndex(oldParent);
				if (oldParent !== newParent)
					reIndex(newParent);
				send('sidebar', 'bookmarks', 'moved', {'id': id, 'pid': info.parentId, 'newIndex': info.index, 'isFolder': true});
			}
		};

		const onRemoved     = (id, info) => {
			makeTimeStamp('bookmarks');
			let bookmark = getById('bookmarks', id);
			if (bookmark !== false) {
				deleteById('bookmarks', id);
				send('sidebar', 'bookmarks', 'removed', {'id': id});
			}
			else {
				bookmark = getFolderById('bookmarks', id);
				if (bookmark !== false) {
					deleteFolderById('bookmarks', id, true);
					send('sidebar', 'bookmarks', 'folderRemoved', {'id': id});
				}
			}
			if (bookmark !== false) {
				const parent = getFolderById('bookmarks', bookmark.pid);
				reIndex(parent);
			}
		};

		if (start === true) {
			updateItem.bookmarks = (newItem, item) => {
				newItem.pid     = item.parentId;
				newItem.domain  = status.tooManyBookmarks ? 'bookmarks' : makeDomain('bookmarks', item.url).id;
				newItem.title   = item.title;
				newItem.index   = item.index;
				newItem.url     = item.url;
				if (firefox)
					newItem.hidden  = /^place:/.test(item.url) || item.type !== 'bookmark';
				if (status.init.bookmarks === true)
					makeTimeStamp('bookmarks');
				return newItem;
			};

			updateFolder.bookmarks = folder => {
				let newFolder = getFolderById('bookmarks', folder.id);
				if (newFolder === false) {
					newFolder           = createFolderById('bookmarks', folder.id);
					newFolder.pid       = folder.parentId;
					newFolder.title     = folder.title;
					newFolder.index     = folder.index;
					newFolder.view      = 'normal';
					newFolder.folded    = getFolded(`bookmarks-${folder.id}`);
					newFolder.itemsId   = [];
					const parent        = getFolderById('bookmarks', folder.parentId);
					if (parent !== false)
						parent.itemsId.push(folder.id);
				}
				if (status.init.bookmarks === true)
					makeTimeStamp('bookmarks');
				return newFolder;
			};

			execMethod(brauzer.bookmarks.getRecent, getRecent, config.bookmarksLimit);
		}
		else if (start === 'reInit') {
			data.bookmarks           = [];
			data.bookmarksId         = [];
			data.bookmarksFolders    = [];
			data.bookmarksFoldersId  = [];
			data.bookmarksSearch     = [];
			data.bookmarksSearchTerm = '';
			makeTimeStamp('bookmarks');
			execMethod(brauzer.bookmarks.getRecent, getRecent, config.bookmarksLimit);
		}
		else {
			i18n.bookmarks           = null;
			updateItem.bookmarks     = null;
			updateFolder.bookmarks   = null;
			messageHandler.bookmarks = null;
			modeData.bookmarks       = null;
			data.bookmarks           = [];
			data.bookmarksId         = [];
			data.bookmarksFolders    = [];
			data.bookmarksFoldersId  = [];
			data.bookmarksSearch     = [];
			data.bookmarksSearchTerm = '';
			brauzer.bookmarks.onCreated.removeListener(onCreated);
			brauzer.bookmarks.onChanged.removeListener(onChanged);
			brauzer.bookmarks.onMoved.removeListener(onMoved);
			brauzer.bookmarks.onRemoved.removeListener(onRemoved);
			status.init.bookmarks    = false;
		}
	},

	history   : start => {

		const initHistory = _ => {
			messageHandler.history = {
				getMore    : message => {
					searchMore(true);
				},
				search     : message => {
					data.historySearchTerm    = message.data.request;
					status.info.historySearch = true;
					search(result => {
						data.historySearch = result;
						makeTimeStamp('history');
						send('sidebar', 'history', 'search', {'search': data.historySearch, 'searchTerm' : data.historySearchTerm});
					}, message.data.request);
				},
				clearSearch : message => {
					status.info.historySearch = false;
					send('sidebar', 'history', 'clearSearch');
				},
				searchSite  : (message, sender, sendResponse) => {
					search(sendResponse, message.data.request, message.data.maxResults);
				},
				delete      : message => {
					brauzer.history.deleteUrl({url: message.data.url});
				},
				historyFolderDelete: message => {
					const folder = getFolderById('history', message.data.id);
					if (folder === false) return;
					const year      = folder.date.getFullYear();
					const month     = folder.date.getMonth();
					const day       = folder.date.getDate();
					const startTime = new Date(year, month, day, 0, 0, 0, 0);
					const endTime   = new Date(year, month, day, 23, 59, 59, 999);
					execMethod(brauzer.history.deleteRange, _ => {}, {'startTime': startTime.getTime(), 'endTime': endTime.getTime()});
				}
			};

			i18n.history = {
				delete             : getI18n('historyControlsDelete'),
				folderDelete       : getI18n('historyControlsFolderDelete'),
				getMoreText        : getI18n('historyGetMoreText'),
				getMore            : getI18n('historyGetMoreTitle'),
				searchPlaceholder  : getI18n('searchPlaceholder'),
				clearSearchTitle   : getI18n('searchClearSearchTitle')
			};

			modeData.history = _ => {
				return {
					mode              : 'history',
					timeStamp         : status.timeStamp.history,
					i18n              : i18n.history,
					history           : data.history,
					historyEnd        : status.historyEnd,
					historyFolders    : data.historyFolders,
					search            : data.historySearch,
					searchTerm        : data.historySearchTerm,
					domains           : data.historyDomains
				};
			};

			brauzer.history.onVisited.addListener(onVisited);
			brauzer.history.onVisitRemoved.addListener(onVisitRemoved);

			status.init.history = true;
		};

		const searchMore = (sendData = false) => {

			const dataToSend = {
				'historyEnd'     : false,
				'history'        : [],
				'historyFolders' : []
			};

			const searchHandler = history => {
				const l = history.length;
				if (l < options.misc.limitHistory.value) status.historyEnd = true;
				let foldersId = [];
				for (let i = 0; i < l; i++) {
					const item   = createById('history', history[i], 'last');
					const folder = updateFolder.history(history[i], 'last');
					if (sendData !== false) {
						if (!foldersId.includes(folder.id)) {
							foldersId.push(folder.id);
							dataToSend.historyFolders.push(folder);
						}
						dataToSend.history.push(item);
					}
				}
				status.historyLastTime = l > 0 ? history[l - 1].lastVisitTime : 0;
				if (sendData !== false) {
					dataToSend.historyEnd = status.historyEnd;
					send('sidebar', 'history', 'gotMore', dataToSend);
				}
				else
					initHistory();
			};

			const searchObject = {text: '', maxResults: options.misc.limitHistory.value, startTime: 0, endTime: status.historyLastTime};

			execMethod(brauzer.history.search, searchHandler, searchObject);
		};

		const search = (sendResponse, request, maxSearch = options.misc.limitHistory.value) => {

			const searchHandler = history => {
				let results = [];
				for (let i = 0, l = history.length; i < l && i < maxSearch; i++) {
					const domain = makeDomain('history', history[i].url);
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

		const onVisited = item => {
			makeTimeStamp('history');
			const hs = getById('history', item.id);
			if (hs !== false)
				deleteById('history', item.id);
			send('sidebar', 'history', 'new', {'item': createById('history', item, 'first'), 'folder': updateFolder.history(item, 'first')});
		};

		const onVisitRemoved = info => {
			makeTimeStamp('history');
			const urls = info.urls;
			if (info.allHistory === true) {
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


		if (start === true) {
			updateItem.history = (newItem, item) => {
				let title      = new Date(item.lastVisitTime);
				title          = title.toLocaleDateString();
				const pid      = title.replace(/\./g, '');
				newItem.url    = item.url;
				newItem.domain = makeDomain('history', item.url).id;
				newItem.title  = item.title || item.url;
				newItem.pid    = pid;
				if (status.init.history === true)
					makeTimeStamp('history');
				return newItem;
			};

			updateFolder.history = (item, position) => {
				const date  = new Date(item.lastVisitTime);
				const title = date.toLocaleDateString();
				const id    = title.replace(/\./g, '');
				let folder  = getFolderById('history', id);
				if (folder === false) {
					folder        = createFolderById('history', id, position);
					folder.pid    = 0;
					folder.view   = 'normal';
					folder.folded = getFolded(`history-${id}`);
					folder.title  = title;
					folder.date   = date;
				}
				if (status.init.history === true)
					makeTimeStamp('history');
				return folder;
			};

			searchMore(false);
		}
		else {
			i18n.history           = {};
			updateItem.history     = null;
			updateFolder.history   = null;
			messageHandler.history = null;
			modeData.history       = null;
			data.history           = [];
			data.historyId         = [];
			data.historyFolders    = [];
			data.historyFoldersId  = [];
			brauzer.history.onVisited.removeListener(onVisited);
			brauzer.history.onVisitRemoved.removeListener(onVisitRemoved);
			status.init.history    = false;
		}
	},

	downloads : start => {

		const initDownloads = _ => {
			messageHandler.downloads = {
				pause : message => {
					brauzer.downloads.pause(message.data.id);
				},
				resume : message => {
					brauzer.downloads.resume(message.data.id);
				},
				cancel : message => {
					brauzer.downloads.cancel(message.data.id);
				},
				reload : message => {
					const down = getById('downloads', message.data.id);
					if (down === false) return;
					brauzer.downloads.download({'url': down.url, 'conflictAction': 'uniquify'});
				},
				erase : message => {
					brauzer.downloads.erase({'id': message.data.id});
				},
				removeFile : message => {
					const down = getById('downloads', message.data.id);
					if (down === false) return;
					if (down.exists === false) return;
					if (down.state === 'interrupted') return;
					brauzer.downloads.removeFile(message.data.id);
					down.exists = false;
					send('sidebar', 'downloads', 'exists', {'id': message.data.id, 'method': 'add'});
				}
			};

			i18n.downloads           = {
				pause  : getI18n('downloadsControlsPause'),
				resume : getI18n('downloadsControlsResume'),
				reload : getI18n('downloadsControlsReload'),
				stop   : getI18n('downloadsControlsCancel'),
				delete : getI18n('downloadsControlsDelete')
			};

			modeData.downloads  = _ => {
				return {
					mode             : 'downloads',
					timeStamp        : status.timeStamp.downloads,
					i18n             : i18n.downloads,
					downloads        : data.downloads,
					domains          : []
				};
			};

			brauzer.downloads.onCreated.addListener(onCreated);
			brauzer.downloads.onErased.addListener(onErased);
			brauzer.downloads.onChanged.addListener(onChanged);

			makeTimeStamp('downloads');
			status.init.downloads = true;
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
				status.info.downloadsCount++;
				if (status.info.downloadStatus === 'idle') {
					status.info.downloadStatus = 'progress';
					send('sidebar', 'info', 'downloadStatus', 'progress');
				}
				makeTimeStamp('downloads', true);
			},
			delete : _ => {
				status.info.downloadsCount--;
				if (status.info.downloadsCount < 0)
					status.info.downloadsCount = 0;
				if (status.info.downloadsCount === 0) {
					status.info.downloadStatus = 'idle';
					send('sidebar', 'info', 'downloadStatus', 'idle');
				}
				makeTimeStamp('downloads', true);
			},
			info   : _ => {
				let count = 0;
				for (let i = data.downloads.length - 1; i >= 0; i--)
					if (data.downloads[i].state === 'in_progress')
						count++;
				status.info.downloadsCount = count;
				if (count > 0)
					status.info.downloadStatus = 'progress';
				else
					status.info.downloadStatus = 'idle';
				send('sidebar', 'info', 'downloadStatus', status.info.downloadStatus);
				makeTimeStamp('downloads', true);
			}
		};

		const onCreated = download => {
			makeTimeStamp('downloads');
			const down  = createById('downloads', download, 'idReverse');
			const index = data.downloadsId.indexOf(down.id);
			send('sidebar', 'downloads', 'created', {'item': down, 'index': index});
		};

		const onErased = id => {
			makeTimeStamp('downloads');
			deleteById('downloads', id);
			send('sidebar', 'downloads', 'erased', {'id': id});
		};

		const onChanged = delta => {
			makeTimeStamp('downloads');
			const download = getById('downloads', delta.id);
			if (download === false)
				return;
			if (delta.hasOwnProperty('paused')) {
				download.paused = delta.paused.current;
				if (delta.hasOwnProperty('canResume'))
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
				send('sidebar', 'downloads', 'exists', {'id': download.id, 'method': (download.exists === true) ? 'remove' : 'add'});
			}
		};

		const getDownloads = downloads => {
			for (let i = 0, l = downloads.length; i < l; i ++)
				createById('downloads', downloads[i], 'idReverse');
			initDownloads();
		};

		if (start === true) {
			updateItem.downloads       = (newItem, item) => {

				const checkDownloadState = id => {
					setTimeout(_ => {

						const speedMultiplier =  1000 >> 2;
						// 1000 ms * 2 times per second / 8bytes;
						const updateDown = item => {
							const download = getById('downloads', item[0].id);
							if (download === false)
								return;
							download.bytesReceived   = item[0].bytesReceived;
							download.progressPercent = `${(100 * item[0].bytesReceived / item[0].totalBytes).toFixed(2)}%`;
							download.progressNumbers = `${beautySize(item[0].bytesReceived)} / ${beautySize(item[0].totalBytes)}`;
							download.speed           = `${beautySize(speedMultiplier * download.bytesReceived / (Date.now() - download.startTime))}/s`;
							send('sidebar', 'downloads', 'progress', {'item': download});
							if (item[0].state === 'in_progress')
								checkDownloadState(id);
							else
								setDownloadsCount.delete();
						};

						execMethod(brauzer.downloads.search, updateDown, {'id': id});
					}, 500);
				};

				let filename = item.filename.split('/').pop();
				if (filename !== '')
					filename = item.url.split('/').pop();
				let url = item.url;
				if (item.hasOwnProperty('finalUrl'))
					if (item.finalUrl !== '')
						url = item.finalUrl;
				if (item.state === 'in_progress') {
					setDownloadsCount.add();
					checkDownloadState(item.id);
				}
				newItem.paused          = item.paused;
				newItem.filename        = filename;
				newItem.totalBytes      = item.totalBytes || 0;
				newItem.bytesReceived   = item.bytesReceived || 0;
				newItem.startTime       = Date.parse(item.startTime) || Date.now();
				newItem.speed           = 0;
				newItem.progressPercent = `${(100 * item.bytesReceived / item.totalBytes).toFixed(2)}%`;
				newItem.progressNumbers = `${beautySize(item.bytesReceived)} / ${beautySize(item.totalBytes)}`;
				newItem.fileSize        = beautySize(item.fileSize);
				newItem.canResume       = item.canResume;
				newItem.url             = url;
				newItem.state           = item.state;
				newItem.exists          = item.exists;
				if (status.init.downloads === true)
					makeTimeStamp('downloads');
				return newItem;
			};

			execMethod(brauzer.downloads.search, getDownloads, {});
		}
		else {
			i18n.downloads           = null;
			updateItem.downloads     = null;
			messageHandler.downloads = null;
			modeData.downloads       = null;
			data.downloads           = [];
			data.downloadsId         = [];
			brauzer.downloads.onCreated.removeListener(onCreated);
			brauzer.downloads.onErased.removeListener(onErased);
			brauzer.downloads.onChanged.removeListener(onChanged);
			status.init.downloads    = false;
		}
	},

	rss       : start => {

		const initRss = _ => {
			messageHandler.rss = {
				rssReaded : message => {
					const rssItem = getById('rss', message.data.id);
					if (rssItem === false) return;
					rssSetReaded('rssItem', rssItem);
				},
				rssReadedAll : message => {
					const feed = getFolderById('rss', message.data.id);
					if (feed === false) return;
					rssSetReaded('feed', feed, 'save');
				},
				rssReadedAllFeeds : message => {
					rssSetReaded('all');
				},
				rssHideReaded : message => {
					const feed = getFolderById('rss', message.data.id);
					if (feed === false) return;
					feed.hideReaded = true;
					saveNow('rssFolders');
					send('sidebar', 'rss', 'rssHideReaded', {'id': message.data.id});
				},
				rssShowReaded : message => {
					const feed = getFolderById('rss', message.data.id);
					if (feed === false) return;
					feed.hideReaded = false;
					saveNow('rssFolders');
					send('sidebar', 'rss', 'rssShowReaded', {'id': message.data.id});
				},
				rssNew : message => {
					createRssFeed(message.data.url, message.data.title);
				},
				rssItemDelete : message => {
					deleteRssItem(message.data.id);
				},
				rssFeedEdit : message => {
					const feed = getFolderById('rss', message.data.id);
					if (feed === false) return;
					feed.title = message.data.title;
					feed.description = message.data.description;
					saveNow('rssFolders');
					send('sidebar', 'rss', 'rssFeedChanged', {'id': message.data.id, 'title': message.data.title, 'description': message.data.description});
				},
				rssFeedDelete : message => {
					const feed = getFolderById('rss', message.data.id);
					if (feed === false) return;
					rssSetReaded('feed', feed, 'kill');
					brauzer.alarms.clear(`rss-update**${message.data.id}`);
					deleteFolderById('rss', message.data.id, true);
					saveNow('rss');
					saveNow('rssFolders');
					send('sidebar', 'rss', 'rssFeedDeleted', {'id': message.data.id});
				},
				updateFeed   : message => {
					const feed = getFolderById('rss', message.data.id);
					if (feed === false) return;
					brauzer.alarms.clear(`rss-update**${feed.id}`);
					updateRssFeed(message.data.id);
				},
				updateAll    : message => {
					status.info.rssUpdated = 0;
					brauzer.alarms.clearAll();
					for (let i = data.rssFoldersId.length - 1; i >= 0; i--)
						updateRssFeed(data.rssFoldersId[i]);
				},
				move         : message => {
					const oldIndex = data.rssFoldersId.indexOf(message.data.id);
					if (oldIndex === -1) return;
					moveFromTo('rssFolders', oldIndex, message.data.newIndex);
					send('sidebar', 'rss', 'moved', {'id': message.data.id, 'newIndex': message.data.newIndex, 'oldIndex': oldIndex, 'isFolder': true});
				},
				import       : message => {
					const parser = new DOMParser();
					const xmlDoc = parser.parseFromString(message.data, 'text/xml');
					const feeds  = xmlDoc.querySelectorAll('outline[type="rss"]');
					for (let i = 0, l = feeds.length; i < l; i++)
						createRssFeed(feeds[i].getAttribute('xmlUrl'), feeds[i].getAttribute('title'));
				},
				export       : message => {
					if (data.rssFolders.length === 0)
						brauzer.notifications.create('rss-error', {'type': 'basic', 'iconUrl': config.sidebarIcon, 'title': i18n.notification.rssNothingToExportTitle, 'message':  i18n.notification.rssNothingToExportText});
					else {
						const makeFeed = feed => {
							return `		<outline type="rss" title="${feed.title}" text="${feed.description}" version="RSS" xmlUrl="${feed.url}"/>\n`;
						};
						const now = new Date();
						let opml = `<opml version="1.0">\n  <head>\n    <title>Sidebar+ Rss export in OPML</title>\n    <dateCreated>${now.toString()}</dateCreated>\n  </head>\n  <body>\n`;
						for (let i = 0, l = data.rssFolders.length; i < l; i++)
							opml += makeFeed(data.rssFolders[i]);
						opml += '  </body>\n</opml>';
					setTimeout(_ => {createDialogWindow('rssExport', {'text': opml});}, 1000);
					}
				}
			};

			i18n.rss = {
				options            : getI18n('rssControlsOptions'),
				markReaded         : getI18n('rssControlsMarkReaded'),
				markReadedAll      : getI18n('rssControlsMarkReadedAll'),
				markReadedAllFeeds : getI18n('rssControlsMarkReadedAllFeeds'),
				hideReaded         : getI18n('rssControlsHideReaded'),
				showReaded         : getI18n('rssControlsShowReaded'),
				hideReadedAll      : getI18n('rssControlsHideReaded'),
				showReadedAll      : getI18n('rssControlsShowReaded'),
				delete             : getI18n('rssControlsDeleteItem'),
				reload             : getI18n('rssControlsReload'),
				move               : getI18n('rssControlsMove'),
				new                : getI18n('rssNew'),
				importExport       : getI18n('rssImportExport'),
				reloadAll          : getI18n('rssReloadAll'),
				plain              : getI18n('rssPlainModeButton'),
				domain             : getI18n('rssDomainModeButton')
			};

			modeData.rss     = _ => {
				return {
					mode             : 'rss',
					timeStamp        : status.timeStamp.rss,
					i18n             : i18n.rss,
					rss              : data.rss,
					rssFolders       : data.rssFolders,
					domains          : data.rssDomains,
					updated          : status.info.rssUpdated
				};
			};

			status.init.rss = true;
		};

		const setUpdated = (count, feed) => {
			const oldStatus             = status.info.rssUpdated;
			status.info.rssUpdatedCount += count;
			status.info.rssUpdated      = status.info.rssUpdatedCount > 0;
			if (status.info.rssUpdated !== oldStatus)
				send('sidebar', 'rss', 'updateAll', status.info.rssUpdated === true ? 'add' : 'remove');
			if (feed !== undefined) {
				feed.status = count === 1 ? 'loading' : 'complete';
				if (options.misc.rssMode.value === 'domain')
					send('sidebar', 'rss', 'update', {'id': feed.id, 'method': feed.status === 'loading' ? 'add' : 'remove'});
			}
			makeTimeStamp('rss', true);
		};

		const guidFromUrl = url => {
			let id = '';
			for (let i = 0, l = url.length; i < l; i++)
				if (/[a-z]|[A-Z]|[0-9]|-|_/i.test(url[i]))
					id += url[i];
			return id;
		};

		const makeRssDomain = (link, url) => {
			return link !== null ? makeDomain('rss', guidFromUrl(url), link.textContent.trim()) : makeDomain('rss', url);
		};

		const createRssFeed = (url, title) => {
			const rssUrl = urlFromUser(url);
			for (let i = data.rssFolders.length - 1; i >= 0; i--)
				if (data.rssFolders[i].url === rssUrl)
					return brauzer.notifications.create('rss-error', {'type': 'basic', 'iconUrl': config.sidebarIcon, 'title': i18n.notification.rssFeedExistErrorTitle, 'message':  `${i18n.notification.rssFeedExistErrorText}
							${data.rssFolders[i].title}`});
			const xhttp  = new XMLHttpRequest();
			xhttp.open('GET', rssUrl, true);
			setUpdated(1);
			xhttp.send();
			xhttp.onreadystatechange = _ => {
				if (xhttp.readyState === 4) {
					if (xhttp.status === 200) {
						const parser     = new DOMParser();
						const xmlDoc     = parser.parseFromString(xhttp.responseText, 'text/xml');
						const head       = xmlDoc.querySelector('channel, feed');
						if (head === null) {
							brauzer.notifications.create('rss-error', {'type': 'basic', 'iconUrl': config.sidebarIcon, 'title': i18n.notification.rssNewFeedErrorTitle, 'message':  `${i18n.notification.rssNewFeedErrorText}
							${url}`});
							return setUpdated(-1);
						}
						let rssTitle     = '';
						if (typeof title === 'string' && title !== '')
							rssTitle = title;
						else {
							rssTitle = head.querySelector('title');
							rssTitle = rssTitle.textContent.trim();
						}
						let desc         = head.querySelector('description, subtitle');
						if (desc !== null)
							desc   = desc.textContent.trim();
						const guid       = guidFromUrl(rssUrl);
						const feed       = createFolderById('rss', guid, 'first');
						const rssDomain  = makeRssDomain(head.querySelector('image>url'), rssUrl);
						feed.folded      = false;
						feed.pid         = 0;
						feed.title       = rssTitle;
						feed.view        = 'domain';
						feed.description = desc;
						feed.domainUrl   = rssDomain.fav !== null ? guid : rssUrl;
						feed.domain      = rssDomain.id;
						feed.url         = rssUrl;
						feed.status      = 'complete';
						feed.itemsId     = [];
						feed.hideReaded  = false;
						feed.readed      = true;
						feed.lastUpdate  = Date.now();
						if (options.misc.rssMode.value === 'domain')
							send('sidebar', 'rss', 'createdFeed', {'feed': feed});
						injectRss(xmlDoc, feed);
						rssSetUpdate(feed, options.misc.rssUpdatePeriod.value);
						saveNow('rssFolders');
					}
					else
						brauzer.notifications.create('rss-error', {'type': 'basic', 'iconUrl': config.sidebarIcon, 'title': i18n.notification.rssNewFeedErrorTitle, 'message':  `${i18n.notification.rssNewFeedErrorText}
							${url}`});
					setUpdated(-1);
				}
			};
		};

		const updateRssFeed = id => {

			const feed  = getFolderById('rss', id);
			if (feed === false) return;
			setUpdated(1, feed);
			const xhttp = new XMLHttpRequest();
			xhttp.open('GET', feed.url, true);
			xhttp.send();
			xhttp.onreadystatechange = _ => {
				if (xhttp.readyState === 4) {
					if (xhttp.status === 200) {
						const parser    = new DOMParser();
						const xmlDoc    = parser.parseFromString(xhttp.responseText, 'text/xml');
						feed.lastUpdate = Date.now();
						injectRss(xmlDoc, feed);
						rssSetUpdate(feed, options.misc.rssUpdatePeriod.value);
						saveNow('rssFolders');
					}
					else {
						feed.lastUpdate = Date.now();
						rssSetUpdate(feed, 10);
					}
					setUpdated(-1, feed);
				}
			};
		};

		const rssSetUpdate = (feed, timeout) => {
			if (feed.lastUpdate < (Date.now() - (timeout * 60000)))
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
			if (rssItem === false) return;
			rssSetReaded('rssItem', rssItem);
			const feed   = getFolderById('rss', rssItem.pid);
			const index2 = feed.itemsId.indexOf(id);
			feed.itemsId.splice(index2, 1);
			deleteById('rss', id);
			send('sidebar', 'rss', 'rssItemDeleted', {'id': id});
		};

		const injectRss = (xml, feed) => {
			let newItems = [];
			for (let items = xml.querySelectorAll('item, entry'),
				i = items.length - 1 < options.misc.maxSavedRssPerFeed.value ? items.length - 1 : options.misc.maxSavedRssPerFeed.value; i >= 0; i--) {
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
						if (/^https?:\/\//i.test(link))
							item.link = link;
						else
							item.link = `${domainFromUrl(feed.url)}${link}`;
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
				if (item.id === '')
					item.id = guidFromUrl(item.link);
				if (!feed.itemsId.includes(item.id))
					newItems.push(createById('rss', item, 'date'));
			}
			if (newItems.length > 0) {
				newItems.sort((a, b) => a.date - b.date);
				for (let i = 0, l = newItems.length, r = data.rssId.length - 1; i < l; i++)
					newItems[i].index = r - data.rssId.indexOf(newItems[i].id);
				saveNow('rss');
				send('sidebar', 'rss', 'newItems', {'items': newItems});
				rssSetReaded('info');
			}
		};

		const rssSetReaded = (method, target, killOrSave) => {

			const setReaded = {
				rssItem : _ => {
					if (target.readed === true) return;
					target.readed = true;
					status.info.rssUnreaded--;
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
					saveNow('rss');
					send('sidebar', 'rss', 'rssReaded', {'id': target.id, 'feedReaded': feedReaded});
				},
				feed    : _ => {
					const childrensHandler = {
						kill : _ => {
							for (let itemsId = target.itemsId, i = itemsId.length - 1; i >= 0; i--) {
								const index = data.rssId.indexOf(itemsId[i]);
								if (index === -1) continue;
								if (data.rss[index].readed === false)
									status.info.rssUnreaded--;
								data.rss.splice(index, 1);
								data.rssId.splice(index, 1);
							}
						},
						save : _ => {
							for (let itemsId = target.itemsId, i = itemsId.length - 1; i >= 0; i--) {
								const rssItem = getById('rss', itemsId[i]);
								if (rssItem.readed === true)
									continue;
								rssItem.readed = true;
								status.info.rssUnreaded--;
							}
							saveNow('rss');
							send('sidebar', 'rss', 'rssReadedAll', {'id': target.id});
						}
					};

					childrensHandler[killOrSave]();
				},
				info   : _ => {},
				count  : _ => {
					status.info.rssUnreaded = 0;
					for (let i = data.rss.length - 1; i >= 0; i--)
						if (data.rss[i].readed === false)
							status.info.rssUnreaded++;
				},
				all    : _ => {
					status.info.rssUnreaded = 0;
					for (let i = data.rss.length - 1; i >= 0; i--)
						data.rss[i].readed = true;
					saveNow('rss');
					send('sidebar', 'rss', 'rssReadedAllFeeds', '');
				}
			};
			setReaded[method]();
			send('sidebar', 'info', 'rssUnreaded', {'unreaded': status.info.rssUnreaded});
			makeTimeStamp('rss', true);
		};

		const getRss = res => {

			let cleanFolders = false;
			if (res.hasOwnProperty('rssFolders'))
				if (res.hasOwnProperty('rss')) {
					data.rssFolders   = res.rssFolders;
					data.rssFoldersId = res.rssFoldersId;
					data.rss          = res.rss;
					data.rssId        = res.rssId;
					for (let i = data.rssFolders.length - 1; i >= 0; i--) {
						if (data.rssFolders[i].hasOwnProperty('domainUrl'))
							makeDomain('rss', data.rssFolders[i].domainUrl);
						else
							makeDomain('rss', data.rssFolders[i].url);
						rssSetUpdate(res.rssFolders[i], options.misc.rssUpdatePeriod.value);
						let j = 0;
						while (data.rssFolders[i].itemsId.length > options.misc.maxSavedRssPerFeed.value && j++ < options.misc.maxSavedRssPerFeed.range[1]) {
							const result = deleteById('rss', data.rssFolders[i].itemsId[0]);
							if (result === false) {
								cleanFolders = true;
								data.rssFolders[i].itemsId.shift();
							}
						}
					}
					rssSetReaded('count');
				}
			if (cleanFolders === true)
				saveNow('rssFolders');
			initRss();
			brauzer.alarms.onAlarm.addListener(alarm => {
				if (/rss-update\*\*/i.test(alarm.name)) {
					const id    = alarm.name.split('**').pop();
					const feed  = getFolderById('rss', id);
					if (feed === false) return;
					updateRssFeed(id);
				}
			});
		};

		if (start === true) {
			updateItem.rss = (newItem, item) => {
				newItem.readed      = item.readed;
				newItem.title       = item.title;
				newItem.link        = item.link;
				newItem.description = item.description.substring(0, 600);
				newItem.pid         = item.pid;
				newItem.domain      = item.domain;
				newItem.date        = item.date;
				status.info.rssUnreaded++;
				const feed  = getFolderById('rss', item.pid);
				feed.readed = false;
				let success = false;
				for (let i = 0, l = feed.itemsId.length; i < l; i++)
					if (item.date < feed.itemsId[i].date) {
						feed.itemsId.splice(i, 0, item.id);
						success = true;
						break;
					}
				if (success === false)
					feed.itemsId.push(item.id);
				if (status.init.rss === true)
					makeTimeStamp('rss', true);
				return newItem;
			};

			execMethod(brauzer.storage.local.get, getRss, ['rss', 'rssId', 'rssFolders', 'rssFoldersId']);
		}
		else {
			i18n.rss            = null;
			messageHandler.rss  = null;
			updateItem.rss      = null;
			modeData.rss        = null;
			data.rss            = [];
			data.rssId          = [];
			data.rssFolders     = [];
			data.rssFoldersId   = [];
			brauzer.alarms.clearAll();
			status.init.rss     = false;
		}
	},

	pocket    : start => {

		const pocketRequest = (type, info = {}) => {

			const links  = {
				add       : 'https://getpocket.com/v3/add',
				get       : 'https://getpocket.com/v3/get',
				sync      : 'https://getpocket.com/v3/get',
				check     : 'https://getpocket.com/v3/get',
				fav       : 'https://getpocket.com/v3/send',
				unfav     : 'https://getpocket.com/v3/send',
				archive   : 'https://getpocket.com/v3/send',
				unarchive : 'https://getpocket.com/v3/send',
				delete    : 'https://getpocket.com/v3/send',
				auth      : 'https://getpocket.com/v3/oauth/authorize',
				request   : 'https://getpocket.com/v3/oauth/request'
			};

			const toSend = {
				add      : {
					'consumer_key' : config.pocketConsumerKey,
					'access_token' : options.pocket.accessToken.value,
					'url'          : info.url,
					'title'        : info.title,
				},
				get      : {
					'consumer_key' : config.pocketConsumerKey,
					'access_token' : options.pocket.accessToken.value,
					'detailType'   : 'complete',
					'state'        : 'all',
					'since'        : 0
				},
				sync     : {
					'consumer_key' : config.pocketConsumerKey,
					'access_token' : options.pocket.accessToken.value,
					'detailType'   : 'complete',
					'state'        : 'all',
					'since'        : 0
				},
				check    : {
					'consumer_key' : config.pocketConsumerKey,
					'access_token' : options.pocket.accessToken.value,
					'sort'         : 'newest',
					'count'        : '1'
				},
				fav   : {
					'consumer_key' : config.pocketConsumerKey,
					'access_token' : options.pocket.accessToken.value,
					'actions'      : [{'item_id': info, 'action': 'favorite', 'time': Date.now()}]
				},
				unfav   : {
					'consumer_key' : config.pocketConsumerKey,
					'access_token' : options.pocket.accessToken.value,
					'actions'      : [{'item_id': info, 'action': 'unfavorite', 'time': Date.now()}]
				},
				archive : {
					'consumer_key' : config.pocketConsumerKey,
					'access_token' : options.pocket.accessToken.value,
					'actions'      : [{'item_id': info, 'action': 'archive', 'time': Date.now()}]
				},
				unarchive : {
					'consumer_key' : config.pocketConsumerKey,
					'access_token' : options.pocket.accessToken.value,
					'actions'      : [{'item_id': info, 'action': 'readd', 'time': Date.now()}]
				},
				delete   : {
					'consumer_key' : config.pocketConsumerKey,
					'access_token' : options.pocket.accessToken.value,
					'actions'      : [{'item_id': info, 'action': 'delete', 'time': Date.now()}]
				},
				auth     : {
					'consumer_key' : config.pocketConsumerKey,
					'code'         : status.pocketCode
				},
				request  : {
					'consumer_key' : config.pocketConsumerKey,
					'redirect_uri' : config.pocketRedirectPage
				}
			};

			const onReady = {
				add    : response => {
					parsePockets(response);
					if (response.hasOwnProperty('item'))
						pocketRequest('check', response.item.item_id);
				},
				get    : response => {
					parsePockets(response);
				},
				sync   : response => {
					resetPocket(true);
					parsePockets(response);
				},
				check  : response => {
					if (response.hasOwnProperty('list')) {
						const pocket = getById('pocket', info);
						if (pocket === false) return;
						send('sidebar', 'pocket', 'updated', updateItem.pocket(pocket, response.list[info]));
					}
				},
				fav  : response => {
					const pocket = getById('pocket', info);
					if (pocket === false) return;
					pocket.favorite = true;
					send('sidebar', 'pocket', 'fav', info);
				},
				unfav  : response => {
					const pocket = getById('pocket', info);
					if (pocket === false) return;
					pocket.favorite = false;
					send('sidebar', 'pocket', 'unfav', info);
				},
				archive : response => {
					const pocket = getById('pocket', info);
					if (pocket === false) return;
					pocket.status = 1;
					pocket.type   = 'archives';
					send('sidebar', 'pocket', 'archive', info);
					removeFromFolder('pocket', pocket);
				},
				unarchive : response => {
					const pocket = getById('pocket', info);
					if (pocket === false) return;
					pocket.status = 0;
					pocket.type   = detectType(pocket);
					updateFolder.pocket(pocket, getById('pocketDomains', pocket.domain));
					send('sidebar', 'pocket', 'unarchive', {'id': info, 'pid': pocket.type, 'domain': pocket.domain});
				},
				delete  : response => {
					const pocket = getById('pocket', info);
					if (pocket === false) return;
					send('sidebar', 'pocket', 'deleted', info);
					removeFromFolder('pocket', pocket, true);
					saveNow('pocket');
				},
				auth    : response => {
					if (!response.hasOwnProperty('access_token')) return;
					setOption('pocket', 'accessToken', response.access_token, false);
					if (response.hasOwnProperty('username'))
						setOption('pocket', 'username', response.username, false);
					setOption('pocket', 'auth', true, false);
					//
					send('sidebar', 'pocket', 'login', {'username': options.pocket.username.value});
					pocketRequest('get');
				},
				request : response => {
					status.pocketCode = response.code;
					brauzer.tabs.onUpdated.addListener(redirectFromPocket);
					brauzer.tabs.create({'url': `https://getpocket.com/auth/authorize?request_token=${status.pocketCode}&redirect_uri=${config.pocketRedirectPage}`, 'active': false});
				},
			};

			const xhttp  = new XMLHttpRequest();
			xhttp.open('POST', links[type], true);
			xhttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
			xhttp.setRequestHeader('X-Accept', 'application/json');
			xhttp.send(JSON.stringify(toSend[type]));
			send('sidebar', 'pocket', 'update', 'add');
			xhttp.onreadystatechange = _ => {
				if (xhttp.readyState === 4) {
					if (xhttp.status === 200) {
						const response = JSON.parse(xhttp.responseText);
						if (response.hasOwnProperty('status')) {
							if (parseInt(response.status) === 1)
								onReady[type](response);
						}
						else if (type === 'auth' || type === 'request') {
							onReady[type](response);
							makeTimeStamp('pocket');
						}
					}
					send('sidebar', 'pocket', 'update', 'remove');
				}
			};
		};

		const redirectFromPocket = (id, info, tab) => {
			if (tab.url === config.pocketRedirectPage) {
				brauzer.tabs.onUpdated.removeListener(redirectFromPocket);
				brauzer.tabs.remove(id);
				pocketRequest('auth');
			}
		};

		const updatePocket = _ => {
			if (options.pocket.auth.value === false)
				return;
			if (options.pocket.accessToken.value === '') {
				setOption('pocket', 'auth', false, false);
				return;
			}
			pocketRequest('get');
		};

		const parsePockets = response => {
			const toSend = [];
			if (response.hasOwnProperty('list'))
				for (let list in response.list)
					toSend.push(createPocket(response.list[list]));
			else if (response.hasOwnProperty('item'))
				toSend.push(createPocket(response.item));
			if (toSend.length > 0) {
				saveNow('pocket');
				saveNow('pocketFolders');
				setTimeout(_ => {send('sidebar', 'pocket', 'newItems', toSend);}, 50);
			}
		};

		const createPocket = item => {
			let newItem = getById('pocket', item.item_id);
			if (newItem === false) {
				item.id   = item.item_id;
				item.date = item.time_added;
				newItem   = createById('pocket', item, 'date');
			}
			else
				updateItem.pocket(newItem, item);
			return newItem;
		};

		const getPocket = res => {
			if (res.hasOwnProperty('pocket')) {
				data.pocket          = res.pocket;
				data.pocketId        = res.pocketId;
				data.pocketFolders   = res.pocketFolders;
				data.pocketFoldersId = res.pocketFoldersId;
				for (let i = data.pocket.length - 1; i >= 0; i--)
					makeDomain('pocket', data.pocket[i].url);
				updatePocket();
			}
			status.init.pocket     = true;
		};

		const resetPocket = (warn = false) => {
			data.pocket          = [];
			data.pocketId        = [];
			data.pocketFolders   = [
				{
					id      : 'articles',
					pid     : 0,
					title   : 'Articles',
					domain  : 'articles',
					view    : 'type',
					folded  : false,
					itemsId : []
				},
				{
					id      : 'videos',
					pid     : 0,
					title   : 'Videos',
					domain  : 'videos',
					view    : 'type',
					folded  : false,
					itemsId : []
				},
				{
					id      : 'pictures',
					pid     : 0,
					title   : 'Pictures',
					domain  : 'pictures',
					view    : 'type',
					folded  : false,
					itemsId : []
				},
				{
					id      : 'other',
					pid     : 0,
					title   : 'Other',
					domain  : 'other',
					view    : 'type',
					folded  : false,
					itemsId : []
				},
				{
					id      : 'archives',
					pid     : 0,
					title   : 'Archives',
					domain  : 'archives',
					view    : 'type',
					folded  : true,
					itemsId : []
				}
			];
			data.pocketFoldersId = ['articles', 'videos', 'pictures', 'other', 'archives'];
			saveNow('pocket');
			saveNow('pocketFolders');
			if (warn)
				send('sidebar', 'pocket', 'reset', {'folders': data.pocketFolders});
		};

		const logout     = _ => {
			resetPocket();
			setOption('pocket', 'auth', false, false);
			setOption('pocket', 'username', '', false);
			send('sidebar', 'pocket', 'logout', {'folders': data.pocketFolders});
		};

		const detectType = pocket => {
			if (parseInt(pocket.status) > 0)
				return 'archives';
			else if (parseInt(pocket.is_article) === 1)
				return 'articles';
			else if (parseInt(pocket.has_image) === 2)
				return 'images';
			else if (parseInt(pocket.has_video) === 2)
				return 'videos';
			return 'other';
		};

		if (start === true) {

			updateItem.pocket = (newItem, item) => {
				const domain        = makeDomain('pocket', item.given_url || item.resolved_url);
				newItem.description = item.hasOwnProperty('excerpt') ? item.excerpt : '';
				newItem.title       = item.given_title || item.resolved_title || item.given_url || item.resolved_url;
				newItem.url         = item.given_url || item.resolved_url;
				newItem.status      = parseInt(item.status) || 0;
				newItem.domain      = domain.id;
				newItem.favorite    = parseInt(item.favorite) === 0 ? false : true;
				newItem.type        = detectType(item);
				newItem.is_article  = item.is_article;
				newItem.has_image   = item.has_image;
				newItem.has_video   = item.has_video;
				if (newItem.status === 0)
					updateFolder.pocket(newItem, domain);
				return newItem;
			};

			updateFolder.pocket = (pocket, domain) => {
				let folder = getFolderById('pocket', domain.id);
				if (folder === false) {
					folder         = createFolderById('pocket', domain.id);
					folder.folded  = false;
					folder.view    = 'hidden';
					folder.title   = domain.title;
					folder.itemsId = [pocket.id];
					folder.domain  = domain.id;
					folder.pid     = domain.id;
					send('sidebar', 'pocket', 'newFolder', folder);
					return folder;
				}
				return addToFolder('pocket', pocket);
			};

			i18n.pocket = {
				loginText     : getI18n('pocketControlsLoginText'),
				login         : getI18n('pocketControlsLoginTitle'),
				logout        : getI18n('pocketControlsLogout'),
				new           : getI18n('pocketControlsNew'),
				fav           : getI18n('pocketControlsFav'),
				unfav         : getI18n('pocketControlsUnfav'),
				archive       : getI18n('pocketControlsArchive'),
				folderArchive : getI18n('pocketControlsFolderArchive'),
				unarchive     : getI18n('pocketControlsUnarchive'),
				delete        : getI18n('pocketControlsDelete'),
				folderDelete  : getI18n('pocketControlsFolderDelete'),
				move          : getI18n('pocketControlsMove'),
				plain         : getI18n('pocketPlainMode'),
				type          : getI18n('pocketTypeMode'),
				domain        : getI18n('pocketDomainMode'),
				reload        : getI18n('pocketReload')
			};

			messageHandler.pocket = {
				login     : message => {
					pocketRequest('request');
				},
				logout    : message => {
					logout();
				},
				add       : message => {
					pocketRequest('add', message.data);
				},
				fav       : message => {
					pocketRequest('fav', message.data);
				},
				unfav     : message => {
					pocketRequest('unfav', message.data);
				},
				archive   : message => {
					pocketRequest('archive', message.data);
				},
				folderArchive : message => {
					const domain = getFolderById('pocket', message.data);
					if (domain === false) return;
					for (let i = domain.itemsId.length - 1; i >= 0; i--)
						pocketRequest('archive', domain.itemsId[i]);
				},
				unarchive : message => {
					pocketRequest('unarchive', message.data);
				},
				delete    : message => {
					pocketRequest('delete', message.data);
				},
				folderDelete : message => {
					const domain = getFolderById('pocket', message.data);
					if (domain === false) return;
					for (let i = domain.itemsId.length - 1; i >= 0; i--)
						pocketRequest('delete', domain.itemsId[i]);
				},
				reloadAll : message => {
					pocketRequest('sync');
				},
				move      : message => {
					const oldIndex = data.pocketFoldersId.indexOf(message.data.id);
					if (oldIndex === -1) return;
					moveFromTo('pocketFolders', oldIndex, message.data.newIndex);
					send('sidebar', 'pocket', 'moved', {'id': message.data.id, 'newIndex': message.data.newIndex, 'oldIndex': oldIndex, 'isFolder': true});
				}
			};

			modeData.pocket    = _ => {
				return {
					mode             : 'pocket',
					timeStamp        : status.timeStamp.pocket,
					username         : optionsShort.pocket.username,
					auth             : optionsShort.pocket.auth,
					i18n             : i18n.pocket,
					pocket           : data.pocket,
					pocketFolders    : data.pocketFolders,
					domains          : data.pocketDomains
				};
			};

			if (options.pocket.auth.value === true)
				execMethod(brauzer.storage.local.get, getPocket, ['pocket', 'pocketId', 'pocketFolders', 'pocketFoldersId']);
			else {
				resetPocket();
				status.init.pocket = true;
			}
		}
		else {
			i18n.pocket           = null;
			updateItem.pocket     = null;
			updateFolder.pocket   = null;
			messageHandler.pocket = null;
			modeData.pocket       = null;
			data.pocket           = [];
			data.pocketId         = [];
			data.pocketFolders    = [];
			data.pocketFoldersId  = [];
			status.init.pocket    = false;
		}
	},

	search    : (start, mode = 'search') => {

		const target = mode === 'search' ? 'sidebar' : 'startpage';

		const search = (type, query, page = 0) => {

			const links   = {
				duckduckgo      : query => `https://duckduckgo.com/html/?q=${query}`,
				google          : query => `https://www.google.com/search?&q=${query}&start=${page * 10}`,
				yandex          : query => `https://yandex.com/search/?text=${query}&p=${page}`,
				bing            : query => `https://www.bing.com/search?q=${query}&first=${1 + page * 10}`,
				yahoo           : query => `https://search.yahoo.com/search?p=${query}&b=${1 + page * 10}`,
				wikipedia       : query => `https://${options.misc.wikiSearchLang.value}.wikipedia.org/w/index.php?search=${query}&profile=default&fulltext=1&limit=50`
			};

			const resultsSelectors = {
				duckduckgo      : '.links_main',
				google          : 'div.g',
				yandex          : '.serp-item',
				bing            : '.b_algo',
				yahoo           : '.dd.algo',
				wikipedia       : '.searchresults li'
			};

			const makeItem    = {
				duckduckgo : result => {
					const item        = {};
					const link        = result.querySelector('.result__title>a');
					if (link === null)
						return false;
					item.title        = makeCleanTitle(link.innerHTML, '<b>', '</b>');
					item.url          = link.getAttribute('href');
					if (item.url.match('://') === null)
						return false;
					const body        = link.parentNode.nextElementSibling;
					if (body === null)
						return item;
					item.description  = body.textContent;
					item.pid          = 'duckduckgo';
					return item;
				},
				google     : result => {
					const item        = {};
					const title       = result.querySelector('a>h3');
					if (title === null)
						return false;
					const link        = result.querySelector('div.r>a');
					if (link === null)
						return false;
					item.url          = link.href;
					item.title        = makeCleanTitle(title.innerHTML, '<b>', '</b>');
					if (!/:\/\//i.test(item.url))
						return false;
					const desc        = result.querySelector('.st');
					if (desc !== null)
						item.description  = desc.textContent;
					item.pid          = 'google';
					return item;
				},
				yandex     : result => {
					const item        = {};
					const link        = result.querySelector('h2>a');
					if (link === null)
						return false;
					link.removeChild(link.firstChild);
					const title       = link.hasChildNodes() ? link.firstChild.innerHTML : link.innerHTML;
					item.title        = makeCleanTitle(title, '<b class="needsclick">', '</b>');
					item.url          = link.getAttribute('href');
					if (item.url.match('://') === null)
						return false;
					const body        = link.parentNode.lastChild;
					if (body !== null)
						item.description  = body.textContent;
					item.pid          = 'yandex';
					return item;
				},
				bing       : result => {
					const item        = {};
					const link        = result.querySelector('h2>a:last-child');
					if (link === null)
						return false;
					item.title        = makeCleanTitle(link.innerHTML, '<strong>', '</strong>');
					item.url          = link.getAttribute('href');
					if (item.url.match('://') === null)
						return false;
					const body        = link.parentNode.lastChild;
					if (body !== null)
						item.description = body.textContent;
					item.pid          = 'bing';
					return item;
				},
				yahoo      : result => {
					const item        = {};
					const title       = result.querySelector('h3>a');
					if (title === null)
						return false;
					item.title        = makeCleanTitle(title.innerHTML, '<b>', '</b>');
					const link        = result.querySelector('h3+div>span');
					if (link === null)
						return false;
					item.url          = `https://${link.textContent}`;
					const body        = title.parentNode.parentNode.lastChild;
					if (body !== null)
						item.description  = body.textContent;
					item.pid          = 'yahoo';
					return item;
				},
				wikipedia  : result => {
					const item        = {};
					const title       = result.querySelector('div>a');
					if (title === null)
						return false;
					item.title        = makeCleanTitle(title.innerHTML, '<span class="searchmatch">', '</span>');
					item.url          = `https://${options.misc.wikiSearchLang.value}.wikipedia.org${title.getAttribute('href')}`;
					const body        = title.parentNode.nextElementSibling;
					if (body !== null)
						item.description  = body.textContent;
					item.pid          = 'wikipedia';
					return item;
				}
			};

			const makeCleanTitle = (string, openTag, closeTag) => {
				if (typeof string === 'undefined') return '';
				const l1   = openTag.length;
				const l2   = closeTag.length;
				let index1 = -l2;
				let index2 = string.indexOf(openTag);
				let result = [];
				while (index2 !== -1) {
					result.push(string.substring(index1 + l2, index2).replace(/<[^>]*>/ig, ''));
					index1 = string.indexOf(closeTag, index2);
					result.push(string.substring(index2 + l1, index1 !== -1 ? index1 : undefined).replace(/<[^>]*>/ig, ''));
					index2 = string.indexOf(openTag, index1);
				}
				result.push(string.substring(index1 + l2, undefined).replace(/<[^>]*>/ig, ''));
				return result;
			};

			const cleanse     = html => {

				const cutElement = (start, finish) => {
					index2 = body.indexOf(start, index1);
					if (index2 !== -1) {
						temp  += body.substring(index1, index2);
						index1 = body.indexOf(finish, index2);
						if (index1 !== -1) {
							index1 += finish.length;
							return cutElement(start, finish);
						}
						index1 = index2;
					}
					temp += body.substring(index1, body.length);
					index1  = 0;
					body    = temp;
					temp    = '';
				};

				let index1   = 0;
				let index2   = 0;
				let temp     = '';
				let body     = html;
				cutElement('<head>', '/head>');
				cutElement('<link', '>');
				cutElement('<script', '/script>');
				cutElement('<style', '/style>');
				cutElement('style="', '"');
				cutElement('style=\'', '\'');
				cutElement('<!--', '-->');
				cutElement('<iframe', '/iframe>');
				cutElement('onload="', '"');
				cutElement('onchange="', '"');
				cutElement('onclick="', '"');
				return body;
			};

			const specialItem = (folder, itemType) => {
				deleteById(mode, `${type}-00`);
				folder.itemsId = [];
				const item = {
					id          : `${folder.id}-00`,
					url         : `domain-${itemType}`,
					forceDomain : true,
					type        : folder.id,
					title       : [i18n.search[`${itemType}Title`]],
					description : i18n.search[`${itemType}Description`]
				};
				makeTimeStamp(mode);
				return [createById(mode, item, 'last')];
			};

			const xhttp       = new XMLHttpRequest();
			const searchLink  = links[type](query);
			const folder      = getFolderById(mode, type);
			if (folder === false) return;
			if (page === 0) {
				folder.searchLink = searchLink;
				send(target, 'search', 'newItems', {'items': specialItem(folder, 'loading'), 'searchLink': searchLink, 'target': type, 'newSearch': true});
			}
			xhttp.open('GET', searchLink, true);
			xhttp.send();
			xhttp.onreadystatechange = _ => {
				if (xhttp.readyState === 4) {
					if (xhttp.status === 200) {
						const parser  = new DOMParser();
						const html    = cleanse(xhttp.responseText).replace(/src=/ig, 'data-src=').replace(/image-src=/ig, 'data-src=').replace(/srcset=/ig, 'data-srcset=');
						const doc     = parser.parseFromString(html, 'text/html');
						let items     = [];
						const results = doc.querySelectorAll(resultsSelectors[type]);
						const l       = results.length;
						const folder  = getFolderById(mode, type);
						if (l > 0) {
							if (page === 0)
								deleteById(mode, `${type}-00`);
							for (let i = 0; i < l; i++) {
								const realId = `${page}${i}`;
								const item = makeItem[type](results[i]);
								if (folder.itemsId.length >= config.searchLength)
									break;
								if (item === false)
									continue;
								item.id    = `${type}-${realId}`;
								item.type  = type;
								items.push(createById(mode, item, 'last'));
							}
							makeTimeStamp(mode);
							send(target, 'search', 'newItems', {'items': items, 'searchLink': searchLink, 'target': type, 'newSearch': page === 0});
							if (page < 4)
								if (items.length * (1 + page) < config.searchLength)
									if (type !== 'duckduckgo')
										if (type !== 'wikipedia')
											search(type, query, 1 + page);
						}
						else if (page === 0)
							send(target, 'search', 'newItems', {'items': specialItem(folder, 'noResults'), 'searchLink': searchLink, 'target': type, 'newSearch': true});
					}
					else
						send(target, 'search', 'newItems', {'items': specialItem(folder, 'networkError'), 'searchLink': searchLink, 'target': type, 'newSearch': true});
				}
			};
		};

		const resetSearch = (shutdown = false) => {
			data[`${mode}Query`]     = '';
			data[mode]               = [];
			data[`${mode}Id`]        = [];
			data[`${mode}Folders`]   = [];
			data[`${mode}FoldersId`] = [];
			if (shutdown === false)
				for (let i = 0, l = config.searchTypes.length; i < l; i++)
					updateFolder[mode]({'pid': config.searchTypes[i]});
		};

		const clearSearch = (clearQuery = false) => {
			if (clearQuery)
				data[`${mode}Query`] = '';
			data[mode]        = [];
			data[`${mode}Id`] = [];
			for(let i = data[`${mode}Folders`].length - 1; i >= 0; i--)
				data[`${mode}Folders`][i].itemsId = [];
			send(target, 'search', 'clearSearch', clearQuery);
		};

		if (start === true) {

			updateItem[mode]     = (newItem, item) => {
				if (item.hasOwnProperty('forceDomain')) {
					newItem.domain      = item.url;
					newItem.description = item.description;
				}
				else {
					const domain        = makeDomain(mode, item.url);
					newItem.domain      = `${domain.id}-domain`;
					newItem.description = `${item.description}\n\n${item.url}`;
				}
				newItem.title       = item.title;
				newItem.url         = item.url;
				newItem.type        = item.type;
				newItem.viewed      = false;
				updateFolder[mode](item);
				return newItem;
			};

			updateFolder[mode]      = item => {
				let folder = getFolderById(mode, item.pid);
				if (folder !== false)
					folder.itemsId.push(item.id);
				else if (options.search.hasOwnProperty(item.pid)) {
					folder            = createFolderById(mode, item.pid);
					folder.pid        = 0;
					folder.title      = i18n.search[folder.id];
					folder.domain     = item.pid;
					folder.view       = 'type';
					folder.hidden     = !options[mode][folder.id].value;
					folder.searchLink = '';
					folder.itemsId    = [];
				}
			};

			i18n.search             = {
				duckduckgo              : getI18n('dialogDuckDuckGoLabel'),
				google                  : getI18n('dialogGoogleLabel'),
				yandex                  : getI18n('dialogYandexLabel'),
				bing                    : getI18n('dialogBingLabel'),
				yahoo                   : getI18n('dialogYahooLabel'),
				wikipedia               : getI18n('dialogWikipediaLabel'),
				searchPlaceholder       : getI18n('searchPlaceholder'),
				captchaTitle            : getI18n('searchCaptchaTitle'),
				captchaDescription      : getI18n('searchCaptchaDescription'),
				noResultsTitle          : getI18n('searchNoResultsTitle'),
				noResultsDescription    : getI18n('searchNoResultsDescription'),
				loadingTitle            : getI18n('searchLoadingTitle'),
				loadingDescription      : getI18n('searchLoadingDescription'),
				networkErrorTitle       : getI18n('searchNetworkErrorTitle'),
				networkErrorDescription : getI18n('searchNetworkErrorDescription'),
				clearSearchTitle        : getI18n('searchClearSearchTitle'),
				searchOptions           : getI18n('searchOptions')
			};

			messageHandler[mode]    = {
				query   : message => {
					makeTimeStamp(mode);
					if (mode === 'spSearch')
						if (options.startpage.mode.value === 'sites')
							setOption('startpage', 'mode', 'search', true);
					clearSearch();
					data[`${mode}Query`] = message.data;
					for (let i = config.searchTypes.length - 1; i >= 0; i--)
						if (options[mode][config.searchTypes[i]].value === true)
							search(config.searchTypes[i], data[`${mode}Query`]);
				},
				changeQuery : message => {
					makeTimeStamp(mode);
					data[`${mode}Query`] = message.data;
					if (mode === 'spSearch')
						if (message.data === '')
							setOption('startpage', 'mode', 'sites', true);
					send(target, 'search', 'changeQuery', message.data);
				},
				clearSearch: message => {
					clearSearch();
				},
				move   : message => {
					const oldIndex = data.searchFoldersId.indexOf(message.data.id);
					if (oldIndex === -1) return;
					moveFromTo('searchFolders', oldIndex, message.data.newIndex);
					send('sidebar', 'search', 'moved', {'id': message.data.id, 'newIndex': message.data.newIndex, 'oldIndex': oldIndex, 'isFolder': true});
				}
			};

			modeData[mode]          = _ => {
				return {
					mode             : 'search',
					timeStamp        : status.timeStamp[mode],
					i18n             : i18n.search,
					query            : data[`${mode}Query`],
					search           : data[mode],
					searchFolders    : data[`${mode}Folders`],
					domains          : data.searchDomains
				};
			};

			resetSearch(false);
			status.init[mode]     = true;
		}
		else {
			messageHandler[mode]  = null;
			updateItem[mode]      = null;
			i18n.search           = null;
			modeData[mode]        = null;
			resetSearch(true);
			status.init[mode]     = false;
		}
	}
};

function initWindow() {
	if (options.leftBar.method.value === 'window')
		createSidebarWindow('leftBar');
	if (options.rightBar.method.value === 'window')
		createSidebarWindow('rightBar');
}

function sideBarData(side, tab) {
	if (status.timeStamp[`${side}Cache`].data !== status.timeStamp[options[side].mode.value]) {
		status.timeStamp[`${side}Cache`].data = status.timeStamp[options[side].mode.value];
		data[side].data             = modeData[options[side].mode.value]();
		data[side].timeStamp        = status.timeStamp;
	}
	if (status.timeStamp[`${side}Cache`].info !== status.timeStamp.info) {
		status.timeStamp[`${side}Cache`].info = status.timeStamp.info;
		data[side].info             = status.info;
		data[side].timeStamp        = status.timeStamp;
	}
	if (status.timeStamp[`${side}Cache`].options !== status.timeStamp.options) {
		status.timeStamp[`${side}Cache`].options = status.timeStamp.options;
		data[side].options             = {
			'sidebar'  : optionsShort[side],
			'warnings' : optionsShort.warnings,
			'theme'    : optionsShort.theme,
			'misc'     : optionsShort.misc,
			'pocket'   : optionsShort.pocket,
			'search'   : optionsShort.search,
			'scroll'   : optionsShort.scroll,
			'services' : {
				'tabs'      : optionsShort.services.tabs,
				'bookmarks' : optionsShort.services.bookmarks,
				'history'   : optionsShort.services.history,
				'downloads' : optionsShort.services.downloads,
				'rss'       : optionsShort.services.rss,
				'pocket'    : optionsShort.services.pocket,
				'search'    : optionsShort.services.search
			},
			'clickActions' : {
				'tabs'      : optionsShort.tabsClickActions,
				'bookmarks' : optionsShort.bookmarksClickActions,
				'history'   : optionsShort.historyClickActions,
				'downloads' : optionsShort.downloadsClickActions,
				'rss'       : optionsShort.rssClickActions,
				'pocket'    : optionsShort.pocketClickActions,
				'search'    : optionsShort.searchClickActions
			},
			'hoverActions' : {
				'tabs'      : optionsShort.tabsHoverActions,
				'bookmarks' : optionsShort.bookmarksHoverActions,
				'history'   : optionsShort.historyHoverActions,
				'downloads' : optionsShort.downloadsHoverActions,
				'rss'       : optionsShort.rssHoverActions,
				'pocket'    : optionsShort.pocketHoverActions,
				'search'    : optionsShort.searchHoverActions
			},
		};
		data[side].i18n            = {
			'mainControls' : i18n.mainControls,
			'mode'         : i18n[options[side].mode.value]
		};
		data[side].data            = modeData[options[side].mode.value]();
		data[side].timeStamp       = status.timeStamp;
	}
	data[side].tabId = tab.id;
	data[side].zoom  = tab.zoom;
	return data[side];
}

function startpageData(tab) {
	if (options.services.startpage.value === true) {
		if (status.timeStamp.startpageCache.data !== status.timeStamp.startpage) {
			status.timeStamp.startpageCache.data = status.timeStamp.startpage;
			data.startpageData.sites        = data.startpage.slice(0, options.startpage.rows.value * options.startpage.columns.value);
			data.startpageData.timeStamp    = status.timeStamp.startpageCache;
		}
		if (status.timeStamp.startpageCache.options !== status.timeStamp.options) {
			status.timeStamp.startpageCache.options = status.timeStamp.options;
			data.startpageData.domains         = data.spSearchDomains;
			data.startpageData.options         = {
				'startpage'   : optionsShort.startpage,
				'search'      : optionsShort.spSearch,
				'theme'       : optionsShort.theme,
			};
			data.startpageData.i18n          = Object.assign(i18n.startpage, i18n.search);
			data.startpageData.timeStamp     = status.timeStamp.startpageCache;
		}
		if (status.timeStamp.startpageCache.search !== status.timeStamp.spSearch) {
			status.timeStamp.startpageCache.search = status.timeStamp.spSearch;
			data.startpageData.search         = data.spSearch;
			data.startpageData.searchFolders  = data.spSearchFolders;
			data.startpageData.searchQuery    = data.spSearchQuery;
			data.startpageData.timeStamp      = status.timeStamp.startpageCache;
		}
		data.startpageData.tabId = tab.id;
		data.startpageData.zoom  = tab.zoom;
		return data.startpageData;
	}
	else
		return {'options' : {'startpage': {'empty': true}}};
}

function send(target, subject, action, dataToSend) {

	const sendToSidebar = (target, subject, action, dataToSend) => {

		const sendByMethod = {
			native : _ => {
				if (status.nativeActive === true)
					brauzer.runtime.sendMessage({'target': target, 'subject': subject, 'action': action, 'data': dataToSend});
			},
			iframe : _ => {
				const tab = getById('tabs', status.activeTabsIds[status.activeWindow]);
				if (tab === false) return;
				if (tab.activated === false) return;
				sendToTab(status.activeTabsIds[status.activeWindow], target, subject, action, dataToSend);
			},
			window : _ => {
				sendToWindow(target, subject, action, dataToSend);
			},
			disabled : _ => {}
		};

		if (/tabs|bookmarks|history|downloads|rss|pocket|search/.test(subject)) {
			if (subject !== options[target].mode.value)
				return;
			if (status.init.hasOwnProperty(subject))
				if (status.init[subject] === false)
					return;
		}
		sendByMethod[options[target].method.value]();
	};

	const sendTo = {
		sidebar   : _ => {
			sendTo.leftBar();
			sendTo.rightBar();
		},
		leftBar   : _ => sendToSidebar('leftBar', subject, action, dataToSend),
		rightBar  : _ => sendToSidebar('rightBar', subject, action, dataToSend),
		startpage : _ => {
			sendToTab(status.activeTabsIds[status.activeWindow], 'startpage', subject, action, dataToSend);
		},
		content   : _ => {
			for (let i = data.windowsFoldersId.length - 1; i >= 0; i--)
				if (status.activeTabsIds.hasOwnProperty(data.windowsFoldersId[i]))
					sendToTab(status.activeTabsIds[data.windowsFoldersId[i]], 'content', subject, action, dataToSend);
		}
	};

	sendTo[target]();
}

function sendToWindow(target, subject, action, dataToSend) {
	if (status[target].tabId !== -1)
		brauzer.tabs.sendMessage(status[target].tabId, {'target': target, 'subject': subject, 'action': action, 'data': dataToSend});
}

function sendToTab(tabId, target, subject, action, dataToSend) {
	const tab = getById('tabs', tabId);
	if (tab === false) return;
	if (tabIsProtected(tab)) return;
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

	const favFromUrl = _ => {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon fill="${colorFromUrl(url)}" points="0,0 0,64 64,64 64,0"/></svg>`;
		return `data:image/svg+xml;base64,${btoa(svg)}`;
	};

	const domainsId = ['tabsDomainsId', 'bookmarksDomainsId', 'historyDomainsId', 'rssDomainsId', 'pocketDomainsId', 'searchDomainsId', 'spSearchDomainsId'];
	const domains   = ['tabsDomains', 'bookmarksDomains', 'historyDomains', 'rssDomains', 'pocketDomains', 'searchDomains', 'spSearchDomains'];

	let fav         = getById('favs', id);
	if (fav === false)
		fav = createById('favs', {id: id, fav: (typeof favIconUrl === 'string' && favIconUrl !== '') ? favIconUrl : favFromUrl()}, 'last');
	else if (typeof favIconUrl === 'string' && favIconUrl !== '') {
		fav.fav      = favIconUrl;
		fav.lastUsed = Date.now();
	}
	for (let targets = ['tabs', 'bookmarks', 'history', 'rss', 'pocket', 'search', 'spSearch'], i = targets.length - 1; i >= 0; i--) {
		if (data[`${targets[i]}Domains`].includes(id))
			data[`${targets[i]}Domains`].fav = fav;
		if (update === false) continue;
		for (let i = domainsId.length - 1; i >= 0; i--) {
			const index = data[domainsId[i]].indexOf(fav.id);
			if (index !== -1)
				data[domains[i]][index].fav = fav.fav;
		}
		if (options.leftBar.mode.value === targets[i])
			send('leftBar', 'info', 'updateDomain', fav);
		if (options.rightBar.mode.value === targets[i])
			send('rightBar', 'info', 'updateDomain', fav);
		if (options.startpage.mode.value === 'search')
			if (targets[i] === 'spSearch')
				send('startpage', 'info', 'updateDomain', fav);
	}
	saveLater('favs');
	return fav.fav;
}

function makeDomain(mode, url, fav) {
	let id       = '';
	let title    = '';
	if (url === '' || url === undefined)
		id = 'default';
	else if (url === 'chrome://startpage/extensions')
		id = 'system';
	else if (/\.pdf$/.test(url))
		id = 'pdf';
	else if (/^file:/.test(url))
		id = 'file';
	else if (/^ftp:/.test(url))
		id = 'ftp';
	else if (url.includes(config.defaultStartPage))
		id = 'startpage';
	else if (url.includes(config.extensionStartPage) || config.extensionStartPage.includes(url))
		id = 'startpage';
	else if (/^about:|^chrome:/.test(url))
		id = 'system';
	else if (/^chrome-extension:|^moz-extension:/i.test(url))
		id = 'extension';
	if (id !== '') {
		return {
			id    : id,
			title : i18n.domains[id]
		};
	}
	else {
		title = domainFromUrl(url);
		id    = title.replace(/\./g, '');
	}
	let domain = getById(`${mode}Domains`, id);
	if (domain === false) {
		domain = createById(`${mode}Domains`, {'id': id, 'fav': makeFav(id, url, fav, mode === 'spSearch'), title: title}, 'last');
		if (options.leftBar.mode.value === mode)
			send('leftBar', 'info', 'newDomain', {'domain': domain});
		if (options.rightBar.mode.value === mode)
			send('rightBar', 'info', 'newDomain', {'domain': domain});
		if (options.startpage.mode.value === 'search')
			send('startpage', 'info', 'newDomain', {'domain': domain});
	}
	else if (fav !== undefined)
		makeFav(id, url, fav, true);
	return domain;
}

function cleanFavs() {
	const favsCount     = data.favs.length;
	if (favsCount < 10000) return;
	const toDeleteCount = favsCount - 9800;
	let tempArray       = [];
	for (let i = favsCount - 1; i >= 0; i--) {
		if (!data.favs[i].hasOwnProperty('lastUsed'))
			data.favs[i].lastUsed = 0;
		tempArray.push(data.favs[i]);
	}
	tempArray = tempArray.sort((a, b) => a.lastUsed - b.lastUsed).slice(0, toDeleteCount);
	for (let i = tempArray.length - 1; i >= 0; i--)
		deleteById('favs', tempArray[i].id);
	saveLater('favs');
}

function createDialogWindow(type, dialogData) {
	status.dialogData = dialogData;
	status.dialogType = type;
	const activeTab = getById('tabs', status.activeTabsIds[status.activeWindow]);
	if (activeTab === false) return;
	status.dialogData.tabId = activeTab.id;
	status.dialogData.zoom  = activeTab.zoom;
	if (tabIsProtected(activeTab) === false)
		if (activeTab.status !== 'loading')
			return sendToTab(status.activeTabsIds[status.activeWindow], 'content', 'dialog', 'create', type);
	brauzer.tabs.create({'active': true});
}

function tabIsProtected(tab) {
	if (tab.activated === true)
		return false;
	if (tab.url === config.extensionStartPage)
		return false;
	if (firefox) {
		if (/^https:\/\/addons.mozilla.org/.test(tab.url))
			return true;
		if (/\.pdf$/.test(tab.url))
			return true;
	}
	else if (opera) {
		if (/^https:\/\/addons.opera.com/.test(tab.url))
			return true;
	}
	else if (/^https:\/\/chrome.google.com/.test(tab.url))
		return true;
	if (/^https?:|^ftp:|^file:/.test(tab.url))
		return false;
	return true;
}

function createSidebarWindow(side) {
	brauzer.windows.getCurrent({}, win => {
		const width  = Math.ceil(options[side].width.value * win.width / 100);
		if (side === 'rightBar')
			if (options.rightBar.left.value === -1)
				setOption('rightBar', 'left', win.width - width);
		const params = {
			'url'        : `sidebar.html#${side}-window`,
			'top'        : options[side].top.value,
			'left'       : options[side].left.value,
			'width'      : width,
			'height'     : win.height,
			'type'       : 'popup'
		};

		const onCreate = win => {
			status[side].windowId = win.id;
			status[side].tabId    = win.tabs[0].id;
			brauzer.windows.onFocusChanged.addListener(id => {
				const getCoordinates = win => {
					setOption(side, 'left', win.left);
					setOption(side, 'top', win.top);
				};
				if (id !== win.id) return;
				execMethod(brauzer.windows.get, getCoordinates, win.id);
			});
			brauzer.windows.onRemoved.addListener(id => {
				if (id === win.id) {
					status[side].windowId = -1;
					status[side].tabId    = -1;
					if (options[side].method.value === 'window') {
						setOption(side, 'method', 'disabled', false);
						setIcon();
					}
				}
			});
		};

		status.sidebarWindowCreating = true;
		execMethod(brauzer.windows.create, onCreate, params);

	});
}

function removeSidebarWindow(side) {
	brauzer.windows.remove(status[side].windowId);
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
		},
		id : _ => {
			for (let i = 0, l = data[`${mode}Id`].length; i < l; i++)
				if (item.id < data[`${mode}Id`][i]) {
					data[mode].splice(i, 0, {'id': item.id});
					data[`${mode}Id`].splice(i, 0, item.id);
					return data[mode][i];
				}
			data[mode].push({'id': item.id});
			const index = data[`${mode}Id`].push(item.id) - 1;
			return data[mode][index];
		},
		idReverse : _ => {
			for (let i = 0, l = data[mode].length; i < l; i++)
				if (item.id > data[`${mode}Id`][i]) {
					data[mode].splice(i, 0, {'id': item.id});
					data[`${mode}Id`].splice(i, 0, item.id);
					return data[mode][i];
				}
			data[mode].push({'id': item.id});
			const index = data[`${mode}Id`].push(item.id) - 1;
			return data[mode][index];
		}
	};

	let index = data[`${mode}Id`].indexOf(item.id);

	return index !== -1 ? data[mode][index] : updateItem[mode](insert[position](), item);
}

function deleteById(mode, id) {
	const index = data[`${mode}Id`].indexOf(id);
	if (index === -1) return false;
	const folder = getFolderById(mode, data[mode][index].pid);
	if (folder !== false)
		if (folder.hasOwnProperty('itemsId')) {
			const idIndex = folder.itemsId.indexOf(id);
			if (idIndex !== -1)
				folder.itemsId.splice(idIndex, 1);
		}
	data[mode].splice(index, 1);
	data[`${mode}Id`].splice(index, 1);
	return true;
}

function getById(mode, id) {
	const index = data[`${mode}Id`].indexOf(id);
	return index !== -1 ? data[mode][index] : false;
}

function getByUrl(mode, url) {
	let match = [];
	for (let i = data[mode].length - 1; i >= 0; i--)
		if (data[mode][i].url === url)
			match.push(data[mode][i]);
	return match;
}

function moveFromTo(mode, from, to) {
	const item = data[mode].splice(from, 1)[0];
	data[`${mode}Id`].splice(from, 1);
	data[mode].splice(to, 0, item);
	data[`${mode}Id`].splice(to, 0, item.id);
}

function createFolderById(mode, id, position = 'last') {

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
    let index = data[`${mode}FoldersId`].indexOf(id);
	return index !== -1 ? false : insert[position]();
}

function deleteFolderById(mode, id, killChildrens = false) {
	let index = data[`${mode}FoldersId`].indexOf(id);
	if (index === -1) return;
	if (killChildrens === true) {
		for (let maybeChildren = data[mode], i = maybeChildren.length - 1; i >= 0; i--)
			if (maybeChildren[i].pid === id)
				deleteById(mode, maybeChildren[i].id);
	}
	data[`${mode}Folders`].splice(index, 1);
	data[`${mode}FoldersId`].splice(index, 1);
	index = data.foldedId.indexOf(id);
	if (index === -1) return;
	data.foldedId.splice(index, 1);
	saveNow('foldedId');
}

function addToFolder(mode, item) {
	const folder = getFolderById(mode, item.pid);
	if (folder === false) return false;
	if (folder.itemsId.includes(item.id)) return folder;
	folder.itemsId.push(item.id);
	checkCount(mode, folder);
	return folder;
}

function removeFromFolder(mode, item, killItem = false) {
	const folder = getFolderById(mode, item.pid);
	if (folder === false) return false;
	const index = folder.itemsId.indexOf(item.id);
	if (index === -1) return false;
	folder.itemsId.splice(index, 1);
	if (killItem === true)
		deleteById(mode, item.id);
	checkCount(mode, folder);
	return true;
}

function checkCount(mode, folder) {
	const length  = folder.itemsId.length;
	const oldView = folder.view;
	if (length === 0) {
		deleteFolderById(mode, folder.id);
		if (options.misc[`${mode}Mode`].value === 'domain')
			send('sidebar', mode, 'folderRemoved', folder.id);
	}
	else {
		folder.view = length === 1 ? 'hidden' : 'domain';
		if (options.misc[`${mode}Mode`].value === 'domain') {
			if (oldView !== folder.view)
				send('sidebar', mode, 'domainCount', {id: folder.id, view: folder.view});
		}
	}
}

function getFolderById(mode, id) {
	const index = data[`${mode}FoldersId`].indexOf(id);
	return index !== -1 ? data[`${mode}Folders`][index] : false;
}

function getFolded(id) {
	return data.foldedId.includes(id) ? true : false;
}

function domainFromUrl(url) {
	if (url === undefined || url === '')
		return 'default';
	let domain = /\/\//.test(url) ? url.split('//')[1] : url;
	domain     = domain.split('/')[0];
	domain     = domain.match(/^([\da-zа-я.-]+)(\.([a-zа-я.]{2,6}))?/i);
	if (domain !== null)
		return domain[0];
	return 'default';
}

function colorFromUrl(url) {
	//optimize
	const t = url.replace(/www|https?:\/\//i, '').replace(/\n/g, '').replace(/\.|\//, '').substring(0, 6)
		.replace(/g|w/ig, '0').replace(/h|x|\s/ig, '1').replace(/i|y/ig, '2')
		.replace(/j|z/ig, '3').replace(/k|\./ig, '4').replace(/l|-/ig, '5')
		.replace(/m|\//ig, '6').replace(/n|:/ig, '7').replace(/o|v/ig, '8')
		.replace(/p|#/ig, '9').replace(/r|%/ig, 'a').replace(/s|~/ig, 'b')
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

	if (site !== undefined) {
		const url  = urlFromUser(site.url);
		let domen  = domainFromUrl(site.url).replace('/', '');
		domen      = domen.split('.', 6);
		let text   = ' ' + domen[0];
		const l    = domen.length;
		for (let i = 1; i < l; i++)
			text += `\n ${domen[i]}`;
		if (l < 3)
			text += '\n';
		data.startpage[index] = {
			color : site.hasOwnProperty('color') ? site.color : colorFromUrl(site.url),
			url   : url,
			text  : text,
			class : 'site'
		};
	}
	else
		data.startpage[index] = {
			color : '',
			url   : '',
			text  : ' \n+\n ',
			class : 'add-new'
		};
}

function setOption(section, option, newValue, warn = false) {
	makeTimeStamp('options');
	options[section][option].value = newValue;
	optionsShort[section][option]  = newValue;
	saveNow('options');
	if (warn === true)
		for (let i = options[section][option].targets.length - 1; i >= 0; i--)
			send(options[section][option].targets[i], 'options', option, {'section': section, 'option': option, 'value': newValue});
}

function makeTimeStamp(mode, info = false) {
	status.timeStamp[mode] = Date.now();
	if (info)
		status.timeStamp.info = Date.now();
}

function saveNow(what, noStamp = false) {
	const dataToSave = {
		options       : {'options': optionsShort},
		favs          : {'favs': data.favs, 'favsId': data.favsId},
		rss           : {'rss': data.rss, 'rssId': data.rssId},
		rssFolders    : {'rssFolders': data.rssFolders, 'rssFoldersId': data.rssFoldersId},
		pocket        : {'pocket': data.pocket, 'pocketId': data.pocketId},
		pocketFolders : {'pocketFolders': data.pocketFolders, 'pocketFoldersId': data.pocketFoldersId},
		startpage     : {'startpage': data.startpage},
		version       : {'version': config.version},
		foldedId      : {'foldedId': data.foldedId},
		openers       : {'tabsWithOpeners': data.tabsWithOpeners}
	};
	brauzer.storage.local.set(dataToSave[what]);
	if (noStamp === false)
		makeTimeStamp(what.replace('Folders', ''));
}

function saveLater(what, noStamp = false) {
	if (noStamp !== false)
		makeTimeStamp(what);
	if (status.toSave.hasOwnProperty(what))
		return;
	status.toSave[what] = true;
	if (status.saverActive === false) {
		status.saverActive = true;
		setTimeout(_ => {
			status.saverActive = false;
			for (let target in status.toSave) {
				delete status.toSave[target];
				saveNow(target, true);
			}
		}, 30000);
	}
}

function getVersion() {
	const version = brauzer.runtime.getManifest().version.split('.');
	return parseInt(version[0]) * 1000 + parseInt(version[1]) * 100 + parseInt(version[2]);
}

})();
