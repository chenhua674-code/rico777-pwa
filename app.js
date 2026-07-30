// RICO777 Store PWA - 交互脚本

// ====== 检测运行环境 ======
var isFileProtocol = window.location.protocol === 'file:';
var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// ====== 注册 Service Worker ======
if ('serviceWorker' in navigator && !isFileProtocol) {
  navigator.serviceWorker.register('/rico777-pwa/sw.js').then(function(reg) {
    console.log('SW registered:', reg.scope);
  }).catch(function(err) {
    console.warn('SW registration failed:', err);
  });
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
});

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
  // 有 deferredPrompt → 直接弹浏览器安装对话框
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choiceResult) {
      deferredPrompt = null;
    });
    return true;
  }

  // 无 deferredPrompt → 显示桌面版安装引导
  showDesktopInstallGuide();
  return false;
}

// ====== 桌面版安装引导（指向地址栏图标） ======
function showDesktopInstallGuide() {
  var existing = document.getElementById('installGuideDesktop');
  if (existing) return;

  var isMac = navigator.userAgent.indexOf('Mac OS X') !== -1;
  var isWin = navigator.userAgent.indexOf('Windows') !== -1;
  var isAndroid = /Android/.test(navigator.userAgent);

  var guideHtml = '';
  if (isAndroid) {
    guideHtml = 'Chrome 地址栏 → 点安装图标 📲';
  } else {
    // 桌面 Chrome
    guideHtml = '地址栏右侧点击 <b>安装</b> 图标 ' + (isMac ? '🔲' : '') + ' → 安装';
  }

  var el = document.createElement('div');
  el.id = 'installGuideDesktop';
  el.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#323232;color:#fff;padding:16px 28px;border-radius:14px;font-size:15px;z-index:99999;box-shadow:0 6px 30px rgba(0,0,0,0.35);animation:toastIn 0.3s ease;text-align:center;line-height:1.6;max-width:360px;';
  el.innerHTML = '📲 ' + guideHtml + '<br><span style="font-size:12px;opacity:0.7;display:block;margin-top:6px;">点击此提示关闭</span>';

  el.onclick = function() {
    el.style.transition = 'opacity 0.3s ease';
    el.style.opacity = '0';
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
  };

  document.body.appendChild(el);

  // 自动关闭
  setTimeout(function() {
    if (el.parentNode) {
      el.style.transition = 'opacity 0.3s ease';
      el.style.opacity = '0';
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }
  }, 6000);
}

// ====== Toast 动画 ======
var toastStyle = document.createElement('style');
toastStyle.textContent = '@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }';
document.head.appendChild(toastStyle);

// ====== 手动安装引导 ======
function getManualGuideHTML() {
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  var steps = '';
  if (isFileProtocol) {
    steps = '<div style="background:#fff3cd;padding:10px 14px;border-radius:8px;font-size:13px;color:#856404;text-align:left;">' +
      '⚠️ 当前以文件方式打开，PWA 安装不可用。<br><br>' +
      '请用终端启动本地服务器：<br>' +
      '<code style="background:#f0f0f0;padding:3px 8px;border-radius:4px;display:block;margin-top:6px;font-size:12px;">cd rico777-pwa && python3 -m http.server 8080</code><br>' +
      '然后浏览器访问 <b>http://localhost:8080</b></div>';
  } else if (isIOS || isSafari) {
    steps = '1. 点击底部「分享」按钮 📤<br>' +
            '2. 向下滑动选择「添加到主屏幕」🏠<br>' +
            '3. 点击右上角「添加」✅';
  } else if (deferredPrompt) {
    steps = '点击下方「安装」按钮，在浏览器弹窗中确认即可 ✅';
  } else {
    steps = 'Chrome: 地址栏右侧 ⋮ → 「安装应用」<br>' +
            'Edge: 地址栏右侧 ⋯ → 「应用」→「安装」';
  }
  return steps;
}

function showManualGuide() {
  var popup = document.getElementById('downloadPopup');
  if (!popup) return;
  var wrap = popup.querySelector('.popup-wrap');
  if (!wrap) return;
  wrap.innerHTML = '<div class="popup-title" style="font-size:18px;">📲 安装到桌面</div>' +
    '<div style="text-align:left;width:100%;line-height:1.8;font-size:14px;color:#3c4043;padding:0 4px;">' +
    getManualGuideHTML() + '</div>' +
    '<div class="loading-btn on" onclick="closePopup()" style="background:#5f6368;">' +
    '<span class="btn-text" style="font-size:14px;">知道了</span></div>';
}

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
      '<div class="loading-btn on" id="downloadBtn" onclick="startDownload()">' +
      '<span class="btn-text">Install</span></div>' +
      '<div style="text-align:center;margin-top:10px;font-size:12px;color:#5f6368;cursor:pointer;" onclick="showManualGuide()">📲 安装到桌面</div>' +
      '<div style="text-align:center;margin-top:6px;font-size:12px;color:#999;cursor:pointer;" onclick="closePopup()">Cancel</div>';
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

function startDownload() {
  if (deferredPrompt) {
    var btn = document.getElementById('downloadBtn');
    if (btn) {
      btn.innerHTML = '<div class="btn-spinner"></div><span class="btn-text" style="display:block;">Installing...</span>';
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choiceResult) {
      deferredPrompt = null;
      if (choiceResult.outcome === 'accepted') {
        closePopup();
      } else {
        var btn2 = document.getElementById('downloadBtn');
        if (btn2) btn2.innerHTML = '<span class="btn-text">Install</span>';
      }
    });
    return;
  }

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    window.location.href = 'https://apps.apple.com/app/rico777/id123456789';
  } else {
    window.location.href = 'https://www.rico777.com/download';
  }
}

function shareRICO777() {
  var shareData = {
    title: 'RICO777',
    text: 'Check out RICO777 - your ultimate app!',
    url: window.location.href
  };
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

// ====== 页面加载完成后标记 ======
function hideLoadingOverlay() {
  var overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(function() {
      overlay.style.display = 'none';
    }, 300);
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  hideLoadingOverlay();
} else {
  document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('page-loaded');
    hideLoadingOverlay();
  });
}
