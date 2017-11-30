(function() {

'use strict';

const firefox = (typeof InstallTrigger !== 'undefined') ? true : false;
const brauzer = firefox ? browser : chrome;

const doc     = document.documentElement;

cleanOldStuff();

const mask    = document.createElement('div');
mask.id       = 'mask';
const sidebar = {
	leftBar   : null,
	rightBar  : null
};

if (firefox) {
	doc.addEventListener('mouseleave', event => {
		send('background', 'sidebar', 'sideDetection', {'sender': 'content', 'action': 'leave', 'side': (event.x > doc.offsetWidth) ? 'rightBar' : 'leftBar'});
	});
	doc.addEventListener('mouseover', event => {
		send('background', 'sidebar', 'sideDetection',{'sender': 'content', 'action': 'over', 'side': (event.x > doc.offsetWidth) ? 'rightBar' : 'leftBar'});
	});
}

const status = {
	leftBar: {
		width    : 0,
		method   : '',
		fixed    : false,
		wide     : false,
		hover    : false,
		over     : false,
		resize   : false
	},
	rightBar: {
		width    : 0,
		method   : '',
		fixed    : false,
		wide     : false,
		hover    : false,
		over     : false,
		resize   : false
	},
	initDone     : false,
	docReady     : false,
	fontSize     : 10,
	borderColor  : '#444',
	borderColorActive : '#000'
};

let dialog = null;

makeIframe('leftBar');
makeIframe('rightBar');
setStatus();
const checkBody = setInterval(
	_ => {if (document.body) {
		clearInterval(checkBody);
		status.docReady = true;
		injectElements();
	}}, 50);

const messageHandler = {
	options : {
		wide              : data => {
			setSideBarWideMode(data.section, data.value);
		},
		width             : data => {
			setSideBarWidth(data.section, data.value);
		},
		fixed             : data => {
			setSideBarFixed(data.section, data.value);
		},
		borderColor       : data => {
			status.borderColor = data.value;
			setColor();
		},
		borderColorActive : data => {
			status.borderColorActive = data.value;
			setColor();
		}
	},
	iframe: {
		remove      : data => {
			deleteIframe(data.side);
		},
		add         : data => {
			injectIframe(data.side, data.width);
		}
	},
	reInit : {
		sideBar      : (side, data) => {
			if (data.options.method !== status[side].method)
				if (data.options.method === 'iframe')
					injectIframe(side, data.options.width);
				else
					deleteIframe(side);
			if (data.options.fixed !== status[side].fixed)
				setSideBarFixed(side, data.options.fixed);
			if (data.options.wide !== status[side].wide)
				setSideBarWideMode(side, data.options.wide);
			if (data.options.width !== status[side].width)
				setSideBarWidth(side, data.options.width);
			if (status.fontSize !== data.theme.fontSize) {
				status.fontSize = data.theme.fontSize;
				setSideBarWidth(side);
			}
			if (status.borderColor !== data.theme.borderColor[0]) {
				status.borderColor = data.theme.borderColor[0];
				setColor();
			}
			if (status.borderColorActive !== data.theme.borderColorActive[0]) {
				status.borderColorActive = data.theme.borderColorActive[0];
				setColor();
			}
		},
		leftBar      : data => {
			messageHandler.reInit.sideBar('leftBar', data);
		},
		rightBar     : data => {
			messageHandler.reInit.sideBar('rightBar', data);
		}
	},
	dialog : {
		create      : data => {
			if (dialog !== null)
				document.body.removeChild(dialog);
			dialog     = document.createElement('iframe');
			dialog.id  = 'sbp-dialog';
			dialog.src = `${brauzer.extension.getURL('dialog.html')}#${data}`;
			document.body.appendChild(dialog);
		},
		remove      : data => {
			document.body.removeChild(dialog);
			dialog = null;
		},
		checkRss    : data => {
			let rssUrl    = '';
			let rssTitle  = '';
			const rssLink = document.querySelector('link[type="application/rss+xml"]');
			if (rssLink) {
				rssUrl   = rssLink.href;
				rssTitle = document.title;
			}
			else if (/\?xml/.test(doc.outerHTML.substring(0, 1000)))
				rssUrl   = document.location.href;
			send('background', 'dialog', 'rssUrlConfirmed', {'url': rssUrl, 'title': rssTitle});
		}
	}
};

brauzer.runtime.onMessage.addListener(message => {
	// console.log(message);
	if (message.hasOwnProperty('target'))
		if (message.target === 'content')
			messageHandler[message.subject][message.action](message.data);
});

function checkDocument() {
	if (document.body) {
		status.docReady = true;
		injectElements();
	}
}

function setStatus() {
	send('background', 'request', 'status', {needResponse: true}, response => {
		if (!response)
			return setTimeout(setStatus, 400);
		status.leftBar           = response.leftBar;
		status.rightBar          = response.rightBar;
		status.fontSize          = response.fontSize;
		status.borderColor       = response.borderColor;
		status.borderColorActive = response.borderColorActive;
		if (status.docReady) injectElements();
		window.onresize = _ => {
			if (status.leftBar.method  === 'iframe') setSideBarWidth('leftBar');
			if (status.rightBar.method === 'iframe') setSideBarWidth('rightBar');
		};
	});
}

function injectIframe(side, width = -1) {
	setSideBarWideMode(side);
	setSideBarFixed(side);
	setSideBarWidth(side, width);
	setColor();
	document.body.appendChild(sidebar[side]);
}

function deleteIframe(side) {
	document.body.removeChild(sidebar[side]);
	setSideBarWidth(side, 0);
}

function cleanOldStuff() {
	const oldLeftBar = document.getElementById('sbp-leftBar');
	if (oldLeftBar)
		oldLeftBar.parentNode.removeChild(oldLeftBar);
	const oldRightBar = document.getElementById('sbp-rightBar');
	if (oldRightBar)
		oldRightBar.parentNode.removeChild(oldRightBar);
	const oldMask = document.getElementById('mask');
	if (oldMask)
		oldMask.parentNode.removeChild(oldMask);
}

function injectElements() {
	if (status.leftBar.method === 'iframe' && sidebar.leftBar.style)
		injectIframe('leftBar');
	if (status.rightBar.method === 'iframe' && sidebar.rightBar.style)
		injectIframe('rightBar');
	doc.appendChild(mask);
}

function makeIframe(side) {
	sidebar[side]    = document.createElement('div');
	sidebar[side].id = `sbp-${side}`;
	sidebar[side].classList.add('sbp-sidebar');
	const iframe     = document.createElement('iframe');
	iframe.src       = chrome.extension.getURL(`sidebar.html#${side}-iframe`);
	const border     = document.createElement('div');
	sidebar[side].appendChild(border);
	sidebar[side].appendChild(iframe);
	border.addEventListener('mousedown', event => {
		if (event.which === 1)
			resizeSideBar(side);
	});
}

function setHover(side, hover) {
	send('background', 'set', 'hover', {side: side, hover: hover ? 'add' : 'remove', needResponse: true}, _ => {
		status[side].hover = hover;
		setSideBarWidth(side, -1);
	});
}

function setSideBarFixed(side, value = -1) {

	const timer = {
		over  : 0,
		leave : 0
	};

	const cleanTimer = which => {
		clearTimeout(timer[which]);
		timer[which] = 0;
	};

	const mouseOver = event => {
		if (event)
			event.stopPropagation();
		if (status[side].over)
			return;
		status[side].over = true;
		if (timer.leave)
			cleanTimer('leave');
		else
			timer.over = setTimeout(_ => {
				if (!status[side].over)
					return cleanTimer('over');
				setHover(side, true);
				cleanTimer('over');
			}, 100);
	};

	const mouseLeave = event => {
		if (event)
			event.stopPropagation();
		if (!status[side].over || status[side].resize)
			return;
		status[side].over = false;
		if (status[side].fixed)
			return;
		if (timer.over)
			cleanTimer('over');
		else
			timer.leave = setTimeout(_ => {
				if (status[side].over)
					return cleanTimer('leave');
				setHover(side, false);
				cleanTimer('leave');
			}, 200);
	};

	if (status[side].fixed === value)
		return;
	if (value !== -1)
		status[side].fixed = value;
	if (status[side].fixed) {
		sidebar[side].removeEventListener('mouseover', mouseOver);
		sidebar[side].removeEventListener('mouseleave', mouseLeave);
		cleanTimer('leave');
		cleanTimer('over');
	}
	else {
		sidebar[side].addEventListener('mouseover', mouseOver);
		sidebar[side].addEventListener('mouseleave', mouseLeave);
	}
	if (status[side].over)
		mouseOver();
	else
		mouseLeave();
	setSideBarWidth(side);
}

function setSideBarWideMode(side, value = -1) {
	if (value !== -1)
		status[side].wide = value;
	if (status[side].wide)
		sidebar[side].classList.add('wide');
	else
		sidebar[side].classList.remove('wide');
	setSideBarWidth(side);
}

function setColor() {
	doc.style.setProperty('--sbp-border-color', status.borderColor, 'important');
	doc.style.setProperty('--sbp-border-color-active', status.borderColorActive, 'important');
}

function setSideBarWidth(side, value = -1) {
	const borderWidth = status.fontSize / 8 / window.devicePixelRatio;
	const iconWidth   = status.fontSize * 1.7 / window.devicePixelRatio;
	sidebar[side].firstChild.style.setProperty('width', `${borderWidth}px`, 'important');
	sidebar[side].lastChild.style.setProperty(`margin-${side === 'leftBar' ? 'right' : 'left'}`, `${borderWidth}px`, 'important');
	const trueSide = side.replace('Bar', '');
	if (value !== -1)
		status[side].width = value;
	if (status[side].fixed) {
		doc.style.setProperty(`margin-${trueSide}`, `${status[side].width}%`, 'important');
		sidebar[side].style.setProperty('width', `${status[side].width}%`, 'important');
	}
	else {
		if (status[side].hover)
			sidebar[side].style.setProperty('width', `${status[side].width}%`, 'important');
		else if (status[side].wide) {
			doc.style.setProperty(`margin-${trueSide}`, `${iconWidth}px`, 'important');
			sidebar[side].style.setProperty('width', `${iconWidth}px`, 'important');
		}
		else {
			doc.style.setProperty(`margin-${trueSide}`, '0', 'important');
			sidebar[side].style.setProperty('width', `${borderWidth}px`, 'important');
		}
	}
}

function resizeSideBar(side) {

	const isFixed    = status[side].fixed;
	const oldWidth   = status[side].width;
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
		if (!isFixed)
			setHover(side, false);
		if (!cancel)
			send('background', 'options', 'handler', {section: side, option: 'width', value: status[side].width});
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
	if (!status[side].fixed)
		setSideBarFixed(side, true);
	status[side].resize = true;
	document.addEventListener('mouseup', stopResize);
	document.addEventListener('keydown', cancelResize);
	document.addEventListener('mousemove', resize);
}

function send(target, subject, action, data = {}, callback = _ => {}) {
	brauzer.runtime.sendMessage({target: target, subject: subject, action: action, data: data}, callback);
}

})();