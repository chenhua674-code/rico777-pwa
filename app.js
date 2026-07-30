// RICO777 Store PWA - 交互脚本

// ====== 检测运行环境 ======
var isFileProtocol = window.location.protocol === 'file:';
var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// ====== 注册 Service Worker（PWA 安装必要条件） ======
if ('serviceWorker' in navigator && !isFileProtocol) {
  navigator.serviceWorker.register('/rico777-pwa/sw.js').then(function(reg) {
    console.log('SW registered:', reg.scope);
  }).catch(function(err) {
    console.warn('SW registration failed:', err);
  });
}

// ====== PWA 安装到桌面 ======
// 使用在 <head> 中捕获的 deferredPrompt
var deferredPrompt = window.__deferredPrompt;
var isInstalled = isStandalone || document.documentElement.classList.contains('app-installed');

// 监听 beforeinstallprompt（补充，确保主脚本也能捕获）
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  window.__deferredPrompt = e;
  document.body.classList.add('pwa-installable');
  document.documentElement.classList.add('install-ready');
});

// 监听 appinstalled（补充）
window.addEventListener('appinstalled', function() {
  deferredPrompt = null;
  window.__deferredPrompt = null;
  isInstalled = true;
  document.body.classList.add('pwa-installed');
  document.body.classList.remove('pwa-installable');
  document.documentElement.classList.add('app-installed');
});

// ====== 全局点击 → 直接安装 ======
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

// ====== 触发安装（直接安装，不弹窗） ======
var _installTimer = null;
function triggerInstall() {
  // 如果已有 deferredPrompt，直接弹
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choiceResult) {
      deferredPrompt = null;
    });
    return true;
  }

  // 防止重复启动等待
  if (_installTimer) return false;

  // 显示"准备安装中…"状态
  showInstallWaiting();

  // 轮询等待 deferredPrompt（最长 10 秒）
  var retries = 0;
  var maxRetries = 60;
  _installTimer = setInterval(function() {
    retries++;
    if (deferredPrompt) {
      clearInterval(_installTimer);
      _installTimer = null;
      hideInstallWaiting();
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function(choiceResult) {
        deferredPrompt = null;
      });
      return;
    }
    if (retries >= maxRetries) {
      clearInterval(_installTimer);
      _installTimer = null;
      hideInstallWaiting();
      showInstallToast();
    }
  }, 500);

  return false;
}

// ====== 安装等待指示器 ======
function showInstallWaiting() {
  var existing = document.getElementById('installWaiting');
  if (existing) return;
  var el = document.createElement('div');
  el.id = 'installWaiting';
  el.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#01875f;color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;z-index:99999;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:toastIn 0.3s ease;';
  el.innerHTML = '<div class="waiting-spinner"></div><span>准备安装...</span>';
  document.body.appendChild(el);
}
function hideInstallWaiting() {
  var el = document.getElementById('installWaiting');
  if (el) {
    el.style.transition = 'opacity 0.3s ease';
    el.style.opacity = '0';
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
  }
}

// ====== 非阻塞式安装提示（底部小提示，不弹窗） ======
function showInstallToast() {
  var existing = document.getElementById('installToast');
  if (existing) {
    existing.style.display = 'block';
    existing.style.opacity = '1';
    existing.style.transform = 'translateY(0)';
    return;
  }

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  var guideText = '';
  var guideIcon = '';

  if (isFileProtocol) {
    guideIcon = '\uD83D\uDDA5\uFE0F';
    guideText = '\u8BF7\u7528\u672C\u5730\u670D\u52A1\u5668\u6253\u5F00\uFF1Apython3 -m http.server 8080';
  } else if (isIOS || isSafari) {
    guideIcon = '\uD83D\uDCF1';
    guideText = '\u70B9\u5E95\u90E8\u5206\u4EAB \u2192 \u6DFB\u52A0\u5230\u4E3B\u5C4F\u5E55';
  } else {
    guideIcon = '\uD83D\uDCF2';
    guideText = '\u70B9\u6D4F\u89C8\u5668\u83DC\u5355 \u22EE \u2192 \u5B89\u88C5\u5E94\u7528';
  }

  var toast = document.createElement('div');
  toast.id = 'installToast';
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#323232;color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;z-index:99999;display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);cursor:pointer;max-width:360px;text-align:center;line-height:1.4;animation:toastIn 0.3s ease;';
  toast.innerHTML = '<span>' + guideIcon + '</span><span>' + guideText + '</span>';

  toast.onclick = function() { hideToast(toast); };

  document.body.appendChild(toast);

  setTimeout(function() { hideToast(toast); }, 3500);
}

function hideToast(toast) {
  toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(-50%) translateY(20px)';
  setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
}

// ====== Toast 动画 ======
var toastStyle = document.createElement('style');
toastStyle.textContent = '@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } } @keyframes waitSpin { to { transform:rotate(360deg); } } .waiting-spinner { width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:waitSpin 0.8s linear infinite; }';
document.head.appendChild(toastStyle);

// ====== 手动安装引导（保留给下载按钮备用） ======
function getManualGuideHTML() {
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  var steps = '';
  if (isFileProtocol) {
    steps = '<div style="background:#fff3cd;padding:10px 14px;border-radius:8px;font-size:13px;color:#856404;text-align:left;">' +
      '\u26A0\uFE0F \u5F53\u524D\u4EE5\u6587\u4EF6\u65B9\u5F0F\u6253\u5F00\uFF0CPWA \u5B89\u88C5\u4E0D\u53EF\u7528\u3002<br><br>' +
      '\u8BF7\u7528\u7EC8\u7AEF\u542F\u52A8\u672C\u5730\u670D\u52A1\u5668\uFF1A<br>' +
      '<code style="background:#f0f0f0;padding:3px 8px;border-radius:4px;display:block;margin-top:6px;font-size:12px;">cd rico777-pwa && python3 -m http.server 8080</code><br>' +
      '\u7136\u540E\u6D4F\u89C8\u5668\u8BBF\u95EE <b>http://localhost:8080</b></div>';
  } else if (isIOS || isSafari) {
    steps = '1. \u70B9\u51FB\u5E95\u90E8\u300C\u5206\u4EAB\u300D\u6309\u94AE \uD83D\uDCE4<br>' +
            '2. \u5411\u4E0B\u6ED1\u52A8\u9009\u62E9\u300C\u6DFB\u52A0\u5230\u4E3B\u5C4F\u5E55\u300D \uD83C\uDFF0<br>' +
            '3. \u70B9\u51FB\u53F3\u4E0A\u89D2\u300C\u6DFB\u52A0\u300D\u2705';
  } else if (deferredPrompt) {
    steps = '\u70B9\u51FB\u4E0B\u65B9\u300C\u5B89\u88C5\u300D\u6309\u94AE\uFF0C\u5728\u6D4F\u89C8\u5668\u5F39\u7A97\u4E2D\u786E\u8BA4\u5373\u53EF \u2705';
  } else {
    steps = 'Chrome: \u5730\u5740\u680F\u53F3\u4FA7 \u22EE \u2192 \u300C\u5B89\u88C5\u5E94\u7528\u300D<br>' +
            'Edge: \u5730\u5740\u680F\u53F3\u4FA7 \u22EF \u2192 \u300C\u5E94\u7528\u300D\u2192\u300C\u5B89\u88C5\u300D';
  }
  return steps;
}

function showManualGuide() {
  var popup = document.getElementById('downloadPopup');
  if (!popup) return;
  var wrap = popup.querySelector('.popup-wrap');
  if (!wrap) return;
  wrap.innerHTML = '<div class="popup-title" style="font-size:18px;">\uD83D\uDCF2 \u5B89\u88C5\u5230\u684C\u9762</div>' +
    '<div style="text-align:left;width:100%;line-height:1.8;font-size:14px;color:#3c4043;padding:0 4px;">' +
    getManualGuideHTML() + '</div>' +
    '<div class="loading-btn on" onclick="closePopup()" style="background:#5f6368;">' +
    '<span class="btn-text" style="font-size:14px;">\u77E5\u9053\u4E86</span></div>';
}

// ====== 下载弹窗（保留为后备） ======
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
      '<div style="text-align:center;margin-top:10px;font-size:12px;color:#5f6368;cursor:pointer;" onclick="showManualGuide()">\uD83D\uDCF2 \u5B89\u88C5\u5230\u684C\u9762</div>' +
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

// ====== 下载按钮逻辑 ======
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

// ====== 分享功能 ======
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
        wrap.innerHTML = '<div style="text-align:center;padding:10px 0;">\u2705 Link copied!</div>' +
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
  banner.innerHTML = '\u26A0\uFE0F PWA \u9700\u901A\u8FC7\u672C\u5730\u670D\u52A1\u5668\u8FD0\u884C \u2192 <code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;">python3 -m http.server 8080</code> \u2192 \u6D4F\u89C8\u5668\u8BBF\u95EE <b>localhost:8080</b>';
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
