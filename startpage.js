(function() {

'use strict';

const firefox = (typeof InstallTrigger !== 'undefined') ? true : false;
const brauzer = firefox ? browser : chrome;
const doc     = document.documentElement;

function send(target, subject, action, data, callback) {
	brauzer.runtime.sendMessage({'target': target, 'subject': subject, 'action': action, 'data': data}, callback);
}

init();

function init() {
	send('background', 'request', 'startpage', {needResponse: true}, response => {

		if (!response) return setTimeout(init, 400);

		if (response.startpage.empty) return;

		document.title = response.i18n.pageTitle;

		const status = {
			theme               : response.theme,
			options             : response.startpage,
			initDone            : false,
			siteSettingsChanged : false,
			bigFontSize         : 0,
			dragging            : false,
		};

		let sites = [];

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
		document.body.style.backgroundImage = `url(${status.theme.startpageImage})`;

		const setSearch = _ => {

			if (!status.options.searchEnabled) {
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
				event.stopPropagation();
				const subject    = searchField.value;
				const searchPath = {
					duckduckgo      : `https://duckduckgo.com/?q=`,
					google          : `https://www.google.com/?gfe_rd=cr&gws_rd=ssl#q=`,
					yandex          : `https://yandex.com/search/?text=`,
					bing            : `https://www.bing.com/search?q=`,
					yahoo           : `https://search.yahoo.com/search?p=`,
					wikipedia       : `https://${status.options.wikiSearchLang}.wikipedia.org/w/index.php?search=`,
					mdn             : `https://developer.mozilla.org/en/search?q=`,
					stackoverflow   : `https://stackoverflow.com/search?q=`,
					amazon          : `https://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Daps&field-keywords=`,
					ebay            : `https://www.ebay.com/sch/i.html?_nkw=`,
					aliexpress      : `https://www.aliexpress.com/wholesale?SearchText=`,
					googletranslate : `https://translate.google.com/#${status.options.translateFrom}/${status.options.translateTo}/`,
					yandextranslate : `https://translate.yandex.com/?lang=${status.options.translateFrom}-${status.options.translateTo}&text=`
				};
				if (subject)
					document.location.href = searchPath[status.options.searchEngine] + subject.replace(' ', '+');
			});

			searchField.addEventListener('keydown', event => {
				event.stopPropagation();
				if (event.key === 'Enter')
					letsSearch.click();
			});

			searchSelect.addEventListener('click', event => {
				event.stopPropagation();
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
					document.body.addEventListener('click', cancelSelection);
				}
			});

			if (document.body.firstChild)
				document.body.insertBefore(search, document.body.firstChild);
			else
				document.body.appendChild(search);
		};

		const setSearchEngine = _ => {
			searchContainer.classList = status.options.searchEngine;
			searchSelect.classList.remove('show-selection');
			if (/translate/i.test(status.options.searchEngine))
				searchField.placeholder = response.i18n.translatePlaceholder;
			else if (/aliexpress|ebay|amazon/i.test(status.options.searchEngine))
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
			const fontSize        = status.theme.fontSize  / window.devicePixelRatio * 1.6;
			const marginH         = status.options.marginH / window.devicePixelRatio;
			const marginV         = status.options.marginV / window.devicePixelRatio;
			const padding         = status.options.padding / window.devicePixelRatio;
			const containerHeight = window.innerHeight - (2 * padding) - (status.options.searchEnabled * (fontSize + padding));
			const sectionSize     = Math.round(((containerHeight - ((status.options.rows + 1) * marginV)) / status.options.rows));
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
			doc.style.setProperty('--rows', status.options.rows);
			doc.style.setProperty('--columns', status.options.columns);
			doc.style.setProperty('--searchDisplay', status.options.searchEnabled ? "block" : "none");
		};

		const initSites = sites => {
			for (let i = 0, l = sites.length; i < l; i++)
				insertSite(i, sites[i]);
			addFinisher();
		};

		const addFinisher = _ => {
			siteContainer.appendChild(document.createElement('div'));
			siteContainer.lastChild.id = `site-${status.options.rows * status.options.columns}`;
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
			setSiteProperties(sites[index], newSite);
			siteContainer.appendChild(sites[index]);
		};

		const setSiteProperties = (target, site) => {
			target.classList             = site.class;
			target.textContent           = site.text;
			target.title                 = site.url || response.i18n.addNewSiteTitle;
			target.style.backgroundColor = site.color;
			target.classList.add(`lines-${site.text.split('\n').length}`);
		};

		setStyle();
		setColor(response.theme);
		window.addEventListener('resize', setStyle);

		if (status.options.searchEnabled)
			setSearch();

		initSites(response.sites);

		const messageHandler = {
			options : {
				searchEngine          : data => {
					status.options.searchEngine = data.value;
					setSearchEngine();
				},
				searchEnabled         : data => {
					status.options.searchEnabled = data.value;
					setSearch();
					setStyle();
				},
				deleteSite            : data => {
					status.deleteSite = data;
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
					status.options.rows    = data.value;
					setStyle();
				},
				columns               : data => {
					status.options.columns = data.value;
					setStyle();
				},
				marginV               : data => {
					status.options.marginV = data.value;
					setStyle();
				},
				marginH               : data => {
					status.options.marginH = data.value;
					setStyle();
				},
				padding               : data => {
					status.options.padding = data.value;
					setStyle();
				},
				fontSize              : data => {
					status.theme.fontSize = data.value;
					setStyle();
				},
				startpageImage        : data => {
					document.body.style.backgroundImage = `url(${data.value})`;
				},
				wikiSearchLang        : data => {
						status.options.wikiSearchLang = data.value;
					},
				translateFrom         : data => {
						status.options.translateFrom = data.value;
					},
				translateTo           : data => {
						status.options.translateTo = data.value;
					}
				},
			site    : {
				changed       : data => {
					setSiteProperties(sites[data.index], data.site);
				},
				moved         : data => {
					if (status.dragging)
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
					const count = status.options.rows * status.options.columns;
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
				const lastColumn   = status.options.columns - 1;
				const lastRow      = status.options.rows - 1;
				const dx           = 1 / status.options.columns;
				const dy           = 1 / status.options.rows;
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
						newPosition = (lastRow * status.options.columns) + nx;
					else {
						const ny = Math.floor((y - topBorder) / height / dy);
						newPosition = ny * status.options.columns + nx;
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
				document.body.removeEventListener('mouseup', cancelDrag);
			};

			timer = setTimeout(makeDraggable, 500);
			document.body.addEventListener('mouseup', cancelDrag);
		});

		document.body.addEventListener('mouseover', event => {
			const target = event.target;
			if (status.dragging) return;
			if (target.classList.contains('site'))
				target.appendChild(editButton);
		});

		siteContainer.addEventListener('click', event => {
			event.stopPropagation();
			const target = event.target;
			if (target.classList.contains('add-new'))
				send('background', 'dialog', 'siteCreate', {'index': target.dataset.index});
			else if (target.classList.contains('site')) {
				if (event.ctrlKey)
					send('background', 'tabs', 'new', {'url': event.target.title});
				else if (event.shiftKey)
					send('background', 'tabs', 'new', {'url': event.target.title, 'newWindow': true});
				else
					document.location = event.target.title;
			}
		});

		editButton.addEventListener('click', event => {
			event.stopPropagation();
			event.preventDefault();
			send('background', 'dialog', 'siteChange', {index: editButton.parentNode.dataset.index});
		});
	});
}

})();