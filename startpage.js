(function() {

'use strict';

const firefox = typeof InstallTrigger !== 'undefined';
const brauzer = firefox ? browser : chrome;
const doc     = document.documentElement;

let initTimer = -1;
tryToInit();

function tryToInit() {
	send('background', 'request', 'startpage', {needResponse: true}, response => {
		// console.log(response);
		if (response === undefined) {
			initTimer = setTimeout(tryToInit, 200);
			return;
		}
		if (response.startpage.empty === true) return;
		init(response);
	});
}

function init(response) {

		const status   = {
			initDone            : false,
			siteSettingsChanged : false,
			bigFontSize         : 0,
			dragging            : false,
		};

		const options  = {
			theme               : response.theme,
			startpage           : response.startpage,
		};

		let sites      = [];

		const setSearch = _ => {

			if (options.startpage.searchEnabled === false) {
				if (search !== null) {
					document.body.removeChild(search);
					search = null;
					return;
				}
			}

			const addSearchEngine = engine => {
				const element       = document.createElement('span');
				element.id          = engine.toLowerCase();
				element.textContent = response.i18n[`searchEngine${engine}`];
				element.classList.add('search-engine');
				searchSelect.appendChild(element);
			};

			const appendHr = _ => {
				const hr = document.createElement('hr');
				searchSelect.appendChild(hr);
			};

			search             = document.createElement('header');
			search.id          = 'search';
			searchContainer    = document.createElement('div');
			searchContainer.id = 'search-container';
			searchSelect       = document.createElement('div');
			searchSelect.id    = 'search-select';
			addSearchEngine('DuckDuckGo');
			addSearchEngine('Google');
			addSearchEngine('Yandex');
			addSearchEngine('Bing');
			addSearchEngine('Yahoo');
			appendHr();
			addSearchEngine('Wikipedia');
			addSearchEngine('Mdn');
			addSearchEngine('Stackoverflow');
			appendHr();
			addSearchEngine('Amazon');
			addSearchEngine('Ebay');
			addSearchEngine('Aliexpress');
			appendHr();
			addSearchEngine('GoogleTranslate');
			addSearchEngine('YandexTranslate');
			searchField        = document.createElement('input');
			searchField.id     = 'search-field';
			const letsSearch   = document.createElement('span');
			letsSearch.id      = 'lets-search';
			letsSearch.title   = response.i18n.searchButtonTitle;
			const icon         = document.createElement('span');
			letsSearch.appendChild(icon);
			searchContainer.appendChild(searchSelect);
			searchContainer.appendChild(searchField);
			searchContainer.appendChild(letsSearch);
			search.appendChild(searchContainer);
			setSearchEngine();

			letsSearch.addEventListener('click', event => {
				const subject    = searchField.value;
				const searchPath = {
					duckduckgo      : `https://duckduckgo.com/?q=`,
					google          : `https://www.google.com/?gfe_rd=cr&gws_rd=ssl#q=`,
					yandex          : `https://yandex.com/search/?text=`,
					bing            : `https://www.bing.com/search?q=`,
					yahoo           : `https://search.yahoo.com/search?p=`,
					wikipedia       : `https://${options.startpage.wikiSearchLang}.wikipedia.org/w/index.php?search=`,
					mdn             : `https://developer.mozilla.org/en/search?q=`,
					stackoverflow   : `https://stackoverflow.com/search?q=`,
					amazon          : `https://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Daps&field-keywords=`,
					ebay            : `https://www.ebay.com/sch/i.html?_nkw=`,
					aliexpress      : `https://www.aliexpress.com/wholesale?SearchText=`,
					googletranslate : `https://translate.google.com/#${options.startpage.translateFrom}/${options.startpage.translateTo}/`,
					yandextranslate : `https://translate.yandex.com/?lang=${options.startpage.translateFrom}-${options.startpage.translateTo}&text=`
				};
				if (subject !== '')
					document.location.href = searchPath[options.startpage.searchEngine] + subject.replace(' ', '+');
			}, {'passive': true});

			searchField.addEventListener('keydown', event => {
				if (event.key === 'Enter')
					letsSearch.click();
			}, {'passive': true});

			searchSelect.addEventListener('click', event => {
				const target = event.target;
				if (searchSelect.classList.contains('show-selection')) {
					if (target.classList.contains('search-engine')) {
						send('background', 'options', 'handler', {section: 'startpage', option: 'searchEngine', value: target.id});
						cancelSelection();
					}
				}
				else {
					searchSelect.classList.add('show-selection');
					const bodyHeight   = document.body.getClientRects()[0].height;
					const searchHeight = searchSelect.getClientRects()[0].height;
					const searchTop    = searchSelect.getClientRects()[0].top;
					const maxHeight    = bodyHeight - searchTop - 10;
					if (maxHeight < searchHeight) {
						searchSelect.style.setProperty('max-height', `${maxHeight}px`);
						searchSelect.style.setProperty('overflow-y', 'scroll');
					}
					setTimeout(_ => {document.body.addEventListener('click', cancelSelection, {'passive': true});}, 0);
				}
			}, {'passive': true});

			if (document.body.firstChild !== undefined)
				document.body.insertBefore(search, document.body.firstChild);
			else
				document.body.appendChild(search);
		};

		const setSearchEngine = _ => {
			searchContainer.classList = options.startpage.searchEngine;
			searchSelect.classList.remove('show-selection');
			if (/translate/i.test(options.startpage.searchEngine))
				searchField.placeholder = response.i18n.translatePlaceholder;
			else if (/aliexpress|ebay|amazon/i.test(options.startpage.searchEngine))
				searchField.placeholder = response.i18n.buyPlaceholder;
			else
				searchField.placeholder = response.i18n.searchPlaceholder;
			searchField.focus();
		};

		const setColor = colors => {
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
		};

		const setStyle = _ => {
			const fontSize        = options.theme.fontSize  / window.devicePixelRatio * 1.6;
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
			doc.style.setProperty('--bigFont2', `${sectionSize / 2}px`);
			doc.style.setProperty('--bigFont3', `${sectionSize / 3}px`);
			doc.style.setProperty('--bigFont4', `${sectionSize / 4}px`);
			doc.style.setProperty('--bigFont5', `${sectionSize / 5}px`);
			doc.style.setProperty('--bigFont6', `${sectionSize / 6}px`);
			doc.style.setProperty('--rows', options.startpage.rows);
			doc.style.setProperty('--columns', options.startpage.columns);
			doc.style.setProperty('--searchDisplay', options.startpage.searchEnabled ? "block" : "none");
		};

		const initSites = sites => {
			for (let i = 0, l = sites.length; i < l; i++)
				insertSite(i, sites[i]);
			addFinisher();
		};

		const addFinisher = _ => {
			siteContainer.appendChild(document.createElement('div'));
			siteContainer.lastChild.id = `site-${options.startpage.rows * options.startpage.columns}`;
			status.initDone = true;
		};

		const cancelSelection = _ => {
			document.body.removeEventListener('click', cancelSelection);
			searchSelect.classList.remove('show-selection');
			searchSelect.style.removeProperty('overflow-y');
			searchSelect.style.removeProperty('max-height');
		};

		const insertSite = (index, newSite) => {
			sites[index]               = document.createElement('section');
			sites[index].id            = `site-${index}`;
			sites[index].dataset.index = index;
			sites[index].appendChild(document.createElement('a'));
			setSiteProperties(sites[index], newSite);
			siteContainer.appendChild(sites[index]);
		};

		const setSiteProperties = (target, site) => {
			target.classList              = site.class;
			target.firstChild.textContent = site.text;
			if (site.url === '')
				target.title           = response.i18n.addNewSiteTitle;
			else {
				target.firstChild.href = site.url;
				target.title           = site.url;
			}
			target.style.backgroundColor  = site.color;
			target.classList.add(`lines-${site.text.split('\n').length}`);
		};

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

		const messageHandler = {
			options : {
				searchEngine          : data => {
					options.startpage.searchEngine = data.value;
					setSearchEngine();
				},
				searchEnabled         : data => {
					options.startpage.searchEnabled = data.value;
					setSearch();
					setStyle();
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
				rows                  : data => {
					options.startpage.rows    = data.value;
					setStyle();
				},
				columns               : data => {
					options.startpage.columns = data.value;
					setStyle();
				},
				marginV               : data => {
					options.startpage.marginV = data.value;
					setStyle();
				},
				marginH               : data => {
					options.startpage.marginH = data.value;
					setStyle();
				},
				padding               : data => {
					options.startpage.padding = data.value;
					setStyle();
				},
				fontSize              : data => {
					options.theme.fontSize = data.value;
					setStyle();
				},
				image                 : data => {
					document.body.style.backgroundImage = `url(${data.value})`;
				},
				imageStyle            : data => {
					setImageStyle[data.value]();
				},
				wikiSearchLang        : data => {
					options.startpage.wikiSearchLang = data.value;
				},
				translateFrom         : data => {
					options.startpage.translateFrom = data.value;
				},
				translateTo           : data => {
					options.startpage.translateTo = data.value;
				}
			},
			site    : {
				changed       : data => {
					setSiteProperties(sites[data.index], data.site);
				},
				moved         : data => {
					if (status.dragging === true)
						status.dragging = false;
					else {
						let beacon;
						if (data.from < data.to)
							beacon = sites[data.to + 1];
						else
							beacon = sites[data.to];
						siteContainer.insertBefore(sites[data.from], beacon);
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
					addFinisher();
				},
				addSites      : data => {
					siteContainer.removeChild(siteContainer.lastChild);
					const oldCount = siteContainer.children.length;
					for (let i = 0, l = data.sites.length; i < l; i ++)
						insertSite(i + oldCount, data.sites[i]);
					addFinisher();
				}
			}
		};

		document.title = response.i18n.pageTitle;
		const siteStyle       = document.createElement('style');
		siteStyle.id          = 'site-style';
		const siteContainer   = document.createElement('main');
		siteContainer.id      = 'site-container';
		const editButton      = document.createElement('span');
		editButton.id         = 'edit-button';
		editButton.title      = response.i18n.editButtonTitle;
		const icon            = document.createElement('span');
		editButton.appendChild(icon);
		const placeholder     = document.createElement('section');
		placeholder.id        = 'placeholder';
		let search            = null;
		let searchContainer   = null;
		let searchSelect      = null;
		let searchField       = null;
		document.head.appendChild(siteStyle);
		document.body.appendChild(siteContainer);
		document.body.appendChild(editButton);
		document.body.appendChild(placeholder);
		document.body.style.backgroundImage = `url(${options.startpage.image})`;
		setStyle();
		setColor(response.theme);
		setImageStyle[response.startpage.imageStyle]();
		window.addEventListener('resize', setStyle, {'passive': true});

		if (options.startpage.searchEnabled === true)
			setSearch();

		initSites(response.sites);

		chrome.runtime.onMessage.addListener(message => {
			// console.log(message);
			if (message.hasOwnProperty('target'))
				if (message.target === 'startpage')
					messageHandler[message.subject][message.action](message.data);
		});

		document.body.addEventListener('mousedown', event => {
			event.stopPropagation();
			if (event.button !== 0) return;
			if (event.target.nodeName !== 'SECTION') return;
			event.preventDefault();
			const target = event.target;
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

		document.body.addEventListener('mouseover', event => {
			const target = event.target;
			if (status.dragging === true) return;
			if (target.classList.contains('site'))
				target.appendChild(editButton);
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
}

function send(target, subject, action, data, callback) {
	brauzer.runtime.sendMessage({'target': target, 'subject': subject, 'action': action, 'data': data}, callback);
}

})();