(function() {

'use strict';

const firefox = typeof InstallTrigger !== 'undefined';
const brauzer = firefox ? browser : chrome;

const doc     = document.documentElement;

const options = {
	leftBar: {
		width    : 0,
		method   : '',
		fixed    : false,
		wide     : false,
		open     : false,
		over     : false,
		resize   : false
	},
	rightBar: {
		width    : 0,
		method   : '',
		fixed    : false,
		wide     : false,
		open     : false,
		over     : false,
		resize   : false
	},
	theme : {
		fontSize          : 10,
		borderColor       : '#444',
		borderColorActive : '#000'
	},
	misc : {
		manualSwitch : false
	}
};

const status  = {
	leftBar: {
		over     : false,
		resize   : false,
		listeners: {
			over  : false,
			leave : false,
			click : false
		}
	},
	rightBar: {
		over     : false,
		resize   : false,
		listeners: {
			over  : false,
			leave : false,
			click : false
		}
	},
	initDone     : false,
	docReady     : false,
};

cleanOldStuff();

const mask     = document.createElement('div');
mask.id        = 'mask';
const sidebar  = {
	leftBar   : null,
	rightBar  : null
};
let dialog     = null;
let rightClick = false;

makeIframe('leftBar');
makeIframe('rightBar');

let initTimer  = -1;
init();

document.addEventListener('readystatechange', checkDocumentReady);
checkDocumentReady();

const messageHandler = {
	options : {
		wide              : info => {
			setSideBarWideMode(info.section, info.value);
		},
		width             : info => {
			setSideBarWidth(info.section, info.value);
		},
		fixed             : info => {
			setSideBarFixed(info.section, info.value);
		},
		open              : info => {
			options[info.section].open = info.value;
			setSideBarWidth(info.section);
		},
		borderColor       : info => {
			options.theme.borderColor = info.value;
			setColor();
		},
		borderColorActive : info => {
			options.theme.borderColorActive = info.value;
			setColor();
		}
	},
	iframe: {
		remove      : info => {
			deleteIframe(info.side);
		},
		add         : info => {
			injectIframe(info.side, info.width);
		}
	},
	reInit : {
		sideBar      : (info) => {

			const reInitSide = side => {
				if (info[side].method !== options[side].method) {
					if (info[side].method === 'iframe')
						injectIframe(side, info[side].width);
					else if (sidebar[side] !== null)
						deleteIframe(side);
				}
				if (info[side].fixed !== options[side].fixed)
					setSideBarFixed(side, info[side].fixed);
				if (info[side].wide !== options[side].wide)
					setSideBarWideMode(side, info[side].wide);
				if (info[side].width !== options[side].width)
					setSideBarWidth(side, info[side].width);
				if (info[side].open !== options[side].open) {
					options[side].open = info[side].open;
					setSideBarWidth(side);
				}
			};
			reInitSide('leftBar');
			reInitSide('rightBar');

			if (dialog !== null) {
				dialog.parentNode.removeChild(dialog);
				dialog = null;
			}
			if (options.theme.fontSize !== info.theme.fontSize) {
				options.theme.fontSize = info.theme.fontSize;
				if (options.leftBar.method === 'iframe')
					setSideBarWidth('leftBar');
				if (options.rightBar.method === 'iframe')
					setSideBarWidth('rightBar');
			}
			if (options.theme.borderColor !== info.theme.borderColor) {
				options.theme.borderColor = info.theme.borderColor;
				setColor();
			}
			if (options.theme.borderColorActive !== info.theme.borderColorActive) {
				options.theme.borderColorActive = info.theme.borderColorActive;
				setColor();
			}
			if (options.misc.manualSwitch !== info.misc.manualSwitch) {
				options.misc.manualSwitch = info.misc.manualSwitch;
				if (options.leftBar.method === 'iframe') {
					setSideBarWidth('leftBar');
					setEventListeners('leftBar');
				}
				if (options.rightBar.method === 'iframe') {
					setSideBarWidth('rightBar');
					setEventListeners('rightBar');
				}
			}
		}
	},
	dialog : {
		create      : info => {
			if (dialog !== null){
				dialog.parentNode.removeChild(dialog);
				dialog = null;
			}
			dialog     = document.createElement('iframe');
			dialog.id  = 'sbp-dialog';
			dialog.src = `${brauzer.extension.getURL('dialog.html')}#${info}`;
			document.body.appendChild(dialog);
		},
		remove      : info => {
			dialog.parentNode.removeChild(dialog);
			dialog = null;
		},
		checkRss    : info => {
			let rssUrl    = '';
			let rssTitle  = '';
			const rssLink = document.querySelector('link[type="application/rss+xml"]');
			if (rssLink !== null) {
				rssUrl   = rssLink.href;
				rssTitle = document.title;
			}
			else if (/\?xml/.test(doc.outerHTML.substring(0, 1000)))
				rssUrl   = document.location.href;
			send('background', 'dialog', 'rssUrlConfirmed', {'url': rssUrl, 'title': rssTitle});
		}
	},
	set    : {
		rightClick : info => {
			rightClick = true;
		}
	}
};

function init() {
	send('background', 'request', 'content', {needResponse: true}, response => {
		if (typeof response === 'undefined') {
			initTimer = setTimeout(init, 200);
			return;
		}

		brauzer.runtime.onMessage.addListener(message => {
			if (message.hasOwnProperty('target'))
				if (message.target === 'content')
					messageHandler[message.subject][message.action](message.data);
		});

		if (firefox) {
			doc.addEventListener('mouseleave', event => {
				send('background', 'sidebar', 'sideDetection', {'sender': 'content', 'action': 'leave', 'side': (event.x > doc.offsetWidth) ? 'rightBar' : 'leftBar'});
			});
			doc.addEventListener('mouseover', event => {
				send('background', 'sidebar', 'sideDetection',{'sender': 'content', 'action': 'over', 'side': (event.x > doc.offsetWidth) ? 'rightBar' : 'leftBar'});
			});
		}

		options.leftBar                 = response.leftBar;
		options.rightBar                = response.rightBar;
		options.theme.fontSize          = response.fontSize;
		options.theme.borderColor       = response.borderColor;
		options.theme.borderColorActive = response.borderColorActive;
		options.misc.manualSwitch       = response.manualSwitch;
		if (status.docReady === true) {
			injectElements();
			window.addEventListener('resize', event => {
				if (options.leftBar.method  === 'iframe') setSideBarWidth('leftBar');
				if (options.rightBar.method === 'iframe') setSideBarWidth('rightBar');
			});
		}
	});
}

function checkDocumentReady() {
	if (document.readyState === 'interactive' || document.readyState === 'complete') {
		document.removeEventListener('readystatechange', checkDocumentReady);
		status.docReady = true;
		injectElements();
	}
}

function injectIframe(side, width) {
	options[side].method = 'iframe';
	setSideBarWideMode(side);
	setSideBarFixed(side);
	setSideBarWidth(side, width);
	setColor();
	document.body.appendChild(sidebar[side]);
}

function deleteIframe(side) {
	options[side].method = 'disabled';
	doc.style.setProperty(`margin-${side.replace('Bar', '')}`, '0', 'important');
	setSideBarFixed(side, false);
	document.body.removeChild(sidebar[side]);
	sidebar[side] = null;
	makeIframe(side);
}

function cleanOldStuff() {
	const oldLeftBar = document.getElementById('sbp-leftBar');
	if (oldLeftBar !== null)
		oldLeftBar.parentNode.removeChild(oldLeftBar);
	const oldRightBar = document.getElementById('sbp-rightBar');
	if (oldRightBar !== null)
		oldRightBar.parentNode.removeChild(oldRightBar);
	const oldMask = document.getElementById('mask');
	if (oldMask !== null)
		oldMask.parentNode.removeChild(oldMask);
}

function injectElements() {
	if (options.leftBar.method === 'iframe' && sidebar.leftBar.style)
		injectIframe('leftBar');
	if (options.rightBar.method === 'iframe' && sidebar.rightBar.style)
		injectIframe('rightBar');
	doc.appendChild(mask);
}

function makeIframe(side) {
	sidebar[side]    = document.createElement('aside');
	sidebar[side].id = `sbp-${side}`;
	sidebar[side].classList.add('sbp-sidebar');
	const iframe     = document.createElement('iframe');
	iframe.src       = brauzer.extension.getURL(`sidebar.html#${side}-iframe`);
	const border     = document.createElement('div');
	sidebar[side].appendChild(border);
	sidebar[side].appendChild(iframe);
	border.addEventListener('mousedown', event => {
		if (options[side].fixed === false)
			if (options.misc.manualSwitch === true)
				if (options[side].open === false)
					return;
		if (event.which === 1)
			resizeSideBar(side);
	}, {'passive': true});
}

function setOpen(side, open) {
	send('background', 'options', 'handler', {'section': side, 'option': 'open', 'value': open});
}

function setSideBarFixed(side, value) {
	if (options[side].fixed === value)
		return;
	if (value !== undefined)
		options[side].fixed = value;
	setSideBarWidth(side);
	setEventListeners(side);
}

function setEventListeners(side) {

	const timer = {
		over  : 0,
		leave : 0
	};

	const cleanTimer = which => {
		clearTimeout(timer[which]);
		timer[which] = 0;
	};

	const mouseOver = event => {
		const realSide = (window.innerWidth >> 1) - event.screenX > 0 ? 'leftBar' : 'rightBar';
		rightClick = false;
		if (status[realSide].over === true)
			return;
		if (options.misc.manualSwitch === true)
			if (options[realSide].fixed === false)
				if (options[realSide].wide === false)
					return;
		status[realSide].over = true;
		if (timer.leave !== 0)
			cleanTimer('leave');
		else
			timer.over = setTimeout(_ => {
				if (!status[realSide].over)
					return cleanTimer('over');
				setOpen(realSide, true);
				cleanTimer('over');
			}, 50);
	};

	const mouseLeave = event => {
		if (rightClick)
			return;
		if (event.target !== sidebar.leftBar && event.target !== sidebar.rightBar)
			return;
		event.stopPropagation();
		const realSide = (window.innerWidth >> 1) - event.screenX > 0 ? 'leftBar' : 'rightBar';
		if (status[realSide].over === false || status[realSide].resize === true)
			return;
		status[realSide].over = false;
		if (options[realSide].fixed === true)
			return;
		if (timer.over !== 0)
			cleanTimer('over');
		else
			timer.leave = setTimeout(_ => {
				if (status[realSide].over === true)
					return cleanTimer('leave');
				setOpen(realSide, false);
				cleanTimer('leave');
			}, 200);
	};

	const borderClick = event => {
		event.stopPropagation();
		if (event.which !== 1)
			return;
		setOpen(side, true);
	};

	if (options[side].fixed === true) {
		sidebar[side].onmouseover        = null;
		sidebar[side].onmouseleave       = null;
		sidebar[side].firstChild.onclick = null;
		cleanTimer('leave');
		cleanTimer('over');
	}
	else if (options.misc.manualSwitch === true) {
		sidebar[side].onmouseover        = null;
		sidebar[side].onmouseleave       = null;
		sidebar[side].firstChild.onclick = options[side].open === false ? borderClick : null;
		cleanTimer('leave');
		cleanTimer('over');
	}
	else {
		sidebar[side].onmouseover        = mouseOver;
		sidebar[side].onmouseleave       = mouseLeave;
		sidebar[side].firstChild.onclick = borderClick;
	}
}

function setSideBarWideMode(side, value) {
	if (value !== undefined)
		options[side].wide = value;
	sidebar[side].classList[options[side].wide === true ? 'remove' : 'add']('narrow');
	setSideBarWidth(side);
	setEventListeners(side);
}

function setColor() {
	doc.style.setProperty('--sbp-border-color', options.theme.borderColor, 'important');
	doc.style.setProperty('--sbp-border-color-active', options.theme.borderColorActive, 'important');
}

function setSideBarWidth(side, value) {
	const openWide = {
		truetrue   : _ => {
			doc.style.setProperty(`margin-${trueSide}`, `${iconWidth}px`, 'important');
			sidebar[side].style.setProperty('width', `${options[side].width}%`, 'important');
			sidebar[side].firstChild.style.removeProperty('background-color');
		},
		truefalse  : _ => {
			doc.style.setProperty(`margin-${trueSide}`, `${borderWidth}px`, 'important');
			sidebar[side].style.setProperty('width', `${options[side].width}%`, 'important');
			sidebar[side].firstChild.style.removeProperty('background-color');
		},
		falsetrue  : _ => {
			doc.style.setProperty(`margin-${trueSide}`, `${iconWidth}px`, 'important');
			sidebar[side].style.setProperty('width', `${iconWidth}px`, 'important');
			sidebar[side].firstChild.style.removeProperty('background-color');
		},
		falsefalse : _ => {
			doc.style.setProperty(`margin-${trueSide}`, `${borderWidth}px`, 'important');
			sidebar[side].style.setProperty('width', `${borderWidth}px`, 'important');
			sidebar[side].firstChild.style.setProperty('background-color', 'transparent', 'important');
		}
	};

	const borderWidth = options.theme.fontSize / 8 / window.devicePixelRatio;
	const iconWidth   = options.theme.fontSize * 1.7 / window.devicePixelRatio;
	const trueSide    = side.replace('Bar', '');
	sidebar[side].firstChild.style.setProperty('width', `${borderWidth}px`, 'important');
	if (value !== undefined)
		options[side].width = value;
	if (options[side].fixed === true) {
		doc.style.setProperty(`margin-${trueSide}`, `${options[side].width}%`, 'important');
		sidebar[side].style.setProperty('width', `${options[side].width}%`, 'important');
		sidebar[side].firstChild.style.removeProperty('background-color');
	}
	else
		openWide[`${options[side].open === true}${options[side].wide === true}`]();
}

function resizeSideBar(side) {

	const isFixed    = options[side].fixed;
	const oldWidth   = options[side].width;
	const innerWidth = window.innerWidth;
	const inner100   = innerWidth / 100;
	let   oldX       = 0;

	const formula    = (side, pageX) => {
		const w = side === 'leftBar' ? pageX / inner100 : (innerWidth - pageX) / inner100;
		return w < 5 ? 5 : w > 40 ? 40 : w;
	};

	const resize = event => {
		if (Math.abs(event.pageX - oldX) > 5) {
			oldX = event.pageX;
			setSideBarWidth(side, formula(side, event.pageX));
		}
	};

	const finishResize = cancel => {
		document.removeEventListener('mouseup', stopResize);
		document.removeEventListener('mousemove', resize);
		document.removeEventListener('keydown', cancelResize);
		mask.classList.remove('active');
		status[side].resize = false;
		setSideBarFixed(side, isFixed);
		if (cancel === false)
			send('background', 'options', 'handler', {section: side, option: 'width', value: options[side].width});
	};

	const stopResize = _ => {
		finishResize(false);
	};

	const cancelResize = event => {
		if (event.key === 'Escape')
			finishResize(true);
	};

	if (firefox) {
		sidebar[side].style.display = 'none';
		setTimeout(_ => {sidebar[side].style.display = 'block';}, 1);
	}
	mask.classList.add('active');
	if (options[side].fixed === false)
		setSideBarFixed(side, true);
	status[side].resize = true;
	document.addEventListener('mouseup', stopResize, {'passive': true});
	document.addEventListener('keydown', cancelResize, {'passive': true});
	document.addEventListener('mousemove', resize, {'passive': true});
}

function send(target, subject, action, data = {}, callback = _ => {}) {
	brauzer.runtime.sendMessage({target: target, subject: subject, action: action, data: data}, callback);
}

})();