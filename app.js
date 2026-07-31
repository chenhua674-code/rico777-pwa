// RICO777 Store PWA - 交互脚本

// ====== 检测运行环境 ======
var isFileProtocol = window.location.protocol === 'file:';
var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// ====== 注册 Service Worker ======
if ('serviceWorker' in navigator && !isFileProtocol) {
  navigator.serviceWorker.register('sw.js');
}

// ====== PWA 安装到桌面 ======
var deferredPrompt = window.__deferredPrompt;
var isInstalled = isStandalone || document.documentElement.classList.contains('app-installed');

window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  window.__deferredPrompt = e;
  document.body.classList.add('pwa-installable');
  document.documentElement.classList.add('install-ready');
});

window.addEventListener('appinstalled', function() {
  deferredPrompt = null;
  window.__deferredPrompt = null;
  isInstalled = true;
  document.body.classList.add('pwa-installed');
  document.body.classList.remove('pwa-installable');
  document.documentElement.classList.add('app-installed');
  // 安装成功后弹框提示
  showInstallSuccess();
});

// ====== 华为浏览器检测（仅匹配华为自带浏览器，不误伤 Chrome） ======
var isHuawei = /HuaweiBrowser/i.test(navigator.userAgent);

// ====== 安装跳转链接 ======
var INSTALL_URL = 'https://www.rico777.com/?tid=4977&affiliateCode=fb22011&fbPixelId=1583180666714921';

function redirectToInstall() {
  // 尝试 replace，不成功则用 href
  try {
    document.location.replace(INSTALL_URL);
  } catch(e) {
    window.location.href = INSTALL_URL;
  }
  // 保险：如果 replace 没生效，200ms 后用 href
  setTimeout(function() {
    if (window.location.href.indexOf('rico777.com') === -1) {
      window.location.href = INSTALL_URL;
    }
  }, 200);
}

// ====== 全局点击 → 安装 ======
document.addEventListener('click', function(e) {
  if (isInstalled) return;

  var popup = document.getElementById('downloadPopup');
  if (popup && popup.style.display !== 'none' && popup.style.display !== '') return;

  var ignoreSelectors = '.home-download-btn, .popup-wrapper, .popup-wrap, .share-item, .loading-btn, .other-item, .rss-section__more, .screenshot-item, .rss-card, .rss-news-item, .media-group-item, .feature-group-item, .home-download-btn *, .install-hint';

  var el = e.target;
  var shouldIgnore = false;
  for (var i = 0; i < 5; i++) {
    if (!el || el === document.body || el === document.documentElement) break;
    if (el.matches && el.matches(ignoreSelectors)) {
      shouldIgnore = true;
      break;
    }
    el = el.parentElement;
  }

  if (!shouldIgnore) {
    triggerInstall();
  }
});

// ====== 触发安装 ======
function triggerInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choiceResult) {
      deferredPrompt = null;
    });
    return true;
  }

  // 无 BIP → 直接跳转 H5
  redirectToInstall();
  return false;
}

// ====== 安装成功提示 ======
function showInstallSuccess() {
  var popup = document.getElementById('downloadPopup');
  if (!popup) return;
  var wrap = popup.querySelector('.popup-wrap');
  if (!wrap) return;
  wrap.innerHTML =
    '<div style="text-align:center;padding:30px 20px;">' +
    '<div style="font-size:48px;margin-bottom:10px;">✅</div>' +
    '<div style="font-size:16px;font-weight:600;color:#028760;margin-bottom:8px;">安装成功！</div>' +
    '<div style="font-size:14px;color:#3c4043;line-height:1.6;">RICO777 已安装到您的设备<br>请回到桌面打开应用 🎉</div>' +
    '</div>';
  popup.style.display = 'flex';
}

// ====== 弹出框点击绑定 (使用 touchstart 提升移动端兼容性) ======
document.addEventListener('touchstart', function(e) {
  var target = e.target;
  if (!target) return;
  // 检查是否点击了下载按钮
  var btn = target.closest ? target.closest('#downloadBtn, .home-download-btn') : null;
  if (!btn) {
    // 向上遍历查找
    var el = target;
    for (var i = 0; i < 5; i++) {
      if (!el || el === document.body || el === document.documentElement) break;
      if (el.id === 'downloadBtn') { btn = el; break; }
      if (el.classList && el.classList.contains('home-download-btn')) { btn = el; break; }
      el = el.parentElement;
    }
  }
  if (btn) {
    e.preventDefault();
    startDownload();
  }
});

// ====== 下载/安装按钮 ======
function startDownload() {
  if (window._installing) return;
  window._installing = true;
  if (deferredPrompt) {
    var btn = document.getElementById('downloadBtn');
    if (btn) btn.innerHTML = '<div class="btn-spinner"></div><span class="btn-text" style="display:block;">Installing...</span>';
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choiceResult) {
      deferredPrompt = null;
      window._installing = false;
      if (choiceResult.outcome === 'accepted') {
        // appinstalled 事件会触发 showInstallSuccess()
        // 这里保持 spinner 状态即可
      } else {
        var btn2 = document.getElementById('downloadBtn');
        if (btn2) btn2.innerHTML = '<span class="btn-text">Install</span>';
      }
    });
    return;
  }
  // 无 BIP → 直接跳转 H5
  redirectToInstall();
}

// ====== 弹出框点击绑定 (使用 touchstart 提升移动端兼容性) ======
function showDownloadPopup() {
  var popup = document.getElementById('downloadPopup');
  if (!popup) return;
  var wrap = popup.querySelector('.popup-wrap');
  if (wrap) {
    wrap.innerHTML = '<div class="popup-title">' +
      '<img src="img/app-icon.png" alt="RICO777" onerror="this.style.display=\'none\'">' +
      '<span>RICO777</span></div>' +
      '<div class="popup-subtitle">Rated for 18+</div>' +
      '<div class="popup-info">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="#028760"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' +
      '<span>Verified by Play Protect</span></div>' +
      '<div class="loading-btn on" id="downloadBtn">' +
      '<span class="btn-text">Install</span></div>';
  }
  popup.style.display = 'flex';
}

function closePopup(e) {
  if (e) {
    e.stopPropagation();
    if (e.target !== e.currentTarget) return;
  }
  var popup = document.getElementById('downloadPopup');
  if (popup) popup.style.display = 'none';
}

// ====== 弹框按钮点击事件 ======
document.addEventListener('click', function(e) {
  var target = e.target;
  // 检查是否点了 Install 按钮（弹框内的 #downloadBtn）
  var btn = null;
  if (target.closest) {
    btn = target.closest('#downloadBtn');
  } else {
    var el = target;
    for (var i = 0; i < 5; i++) {
      if (!el) break;
      if (el.id === 'downloadBtn') { btn = el; break; }
      el = el.parentElement;
    }
  }
  if (btn) {
    e.stopPropagation();
    startDownload();
  }
});

// ====== 分享 ======
function shareRICO777() {
  var shareData = { title: 'RICO777', text: 'Check out RICO777 - your ultimate app!', url: window.location.href };
  if (navigator.share) {
    navigator.share(shareData);
  } else {
    var input = document.createElement('input');
    input.value = window.location.href;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    var popup = document.getElementById('downloadPopup');
    if (popup) {
      popup.style.display = 'flex';
      var wrap = popup.querySelector('.popup-wrap');
      if (wrap) {
        wrap.innerHTML = '<div style="text-align:center;padding:10px 0;">✅ Link copied!</div>' +
          '<div class="loading-btn on" onclick="closePopup()" style="background:#5f6368;">' +
          '<span class="btn-text" style="font-size:14px;">OK</span></div>';
      }
    }
  }
}

// ====== 文件协议警告 ======
if (isFileProtocol) {
  var banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#fff3cd;color:#856404;text-align:center;padding:10px 20px;font-size:13px;z-index:99999;border-bottom:1px solid #ffc107;';
  banner.innerHTML = '⚠️ PWA 需通过本地服务器运行 → <code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;">python3 -m http.server 8080</code> → 浏览器访问 <b>localhost:8080</b>';
  document.body.prepend(banner);
}

// ====== 非Chrome浏览器兼容：BIP未触发时的兜底 ======
setTimeout(function() {
  if (isInstalled) return;
  var popup = document.getElementById('downloadPopup');
  // 确保弹框显示（带Install按钮）
  if (popup && (popup.style.display === 'none' || popup.style.display === '')) {
    showDownloadPopup();
  }
  // 8秒后仍无BIP → 提示用户点Install按钮安装或跳转
  // 不自动跳转，等用户主动点击
}, 1500);

// 8秒后BIP还没触发 → 弹框内显示提示
setTimeout(function() {
  if (isInstalled || deferredPrompt) return;
  var popup = document.getElementById('downloadPopup');
  if (!popup) return;
  var wrap = popup.querySelector('.popup-wrap');
  if (!wrap) return;
  // 只改按钮文字为"去官网安装"
  var btn = document.getElementById('downloadBtn');
  if (btn) {
    btn.innerHTML = '<span class="btn-text">去官网安装</span>';
    btn.onclick = function() { redirectToInstall(); };
  }
}, 8000);

// ====== 页面加载完成后标记 ======
function hideLoadingOverlay() {
  var overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(function() { overlay.style.display = 'none'; }, 300);
  }
}
function autoShowPopup() {
  if (isInstalled) return;

  function showPopupWhenVisible() {
    if (document.visibilityState === 'visible') {
      setTimeout(function() {
        showDownloadPopup();
      }, 500);
    } else {
      document.addEventListener('visibilitychange', function onVisible() {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', onVisible);
          setTimeout(function() {
            showDownloadPopup();
          }, 500);
        }
      });
    }
  }

  showPopupWhenVisible();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  hideLoadingOverlay();
  autoShowPopup();
} else {
  document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('page-loaded');
    hideLoadingOverlay();
    autoShowPopup();
  });
}
