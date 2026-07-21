import './style.css';
import { curatedAssets, categories, queryAliases } from './data.js';
import { createModelViewer } from './scene.js';

const MAX_AUTO_LOAD = 12 * 1024 * 1024;
const MAX_DISCOVER_SIZE = 75 * 1024 * 1024;
const treeCache = new Map();
const commitCache = new Map();

const initialFeatured = curatedAssets.find((asset) => asset.id === 'clear-coat-car-paint') || curatedAssets[0];
const initialAssets = [initialFeatured, ...curatedAssets.filter((asset) => asset.id !== initialFeatured.id)];

const state = {
  assets: [...initialAssets],
  selected: initialFeatured,
  category: '全部',
  searching: false,
  rateRemaining: null,
  rateReset: null,
  lastQuery: '',
  stats: null,
};

let viewer;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function formatBytes(value) {
  if (!Number.isFinite(value)) return '未知大小';
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(value < 10240 ? 0 : 1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN', { notation: value > 9999 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value || 0);
}

function modelName(path) {
  return decodeURIComponent(path.split('/').pop().replace(/\.(glb|gltf)$/i, ''))
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferCategory(text) {
  const value = text.toLowerCase();
  if (/car|vehicle|truck|automotive|wheel|汽车/.test(value)) return '汽车';
  if (/camera|lens|相机/.test(value)) return '相机';
  if (/boombox|speaker|radio|electronic|digital|数码/.test(value)) return '数码';
  if (/gear|engine|motor|part|mechan|machine|industrial|tool|零件|机械/.test(value)) return '机械';
  if (/chair|sofa|pouf|vase|window|plant|furniture|home|家居/.test(value)) return '家居';
  if (/lamp|lantern|light|灯具/.test(value)) return '灯具';
  if (/shoe|watch|glasses|corset|wear|fashion|穿戴/.test(value)) return '穿戴';
  if (/shader|material|fibre|paint|材质/.test(value)) return '材质';
  if (/city|scene|environment|coals|场景/.test(value)) return '场景';
  if (/fox|duck|dragon|skull|character|creature|角色/.test(value)) return '角色';
  return '产品';
}

function licenseTone(license = '') {
  if (/CC0|MIT|Apache|BSD/i.test(license) && !/需复核|商标/.test(license)) return 'safe';
  if (/未声明|需复核|商标|NC|custom/i.test(license)) return 'warn';
  return 'info';
}

function icon(name) {
  const paths = {
    search: '<circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path>',
    github: '<path d="M12 2.6a9.4 9.4 0 0 0-3 18.3c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1 1.6 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.3-2.2-.3-4.6-1.1-4.6-4.9a3.8 3.8 0 0 1 1-2.7c-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.3 9.3 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7a3.8 3.8 0 0 1 1 2.7c0 3.8-2.3 4.7-4.6 4.9.4.3.7 1 .7 1.9v2.8c0 .3.2.6.7.5A9.4 9.4 0 0 0 12 2.6Z"></path>',
    file: '<path d="M6 2.5h8l4 4V21H6z"></path><path d="M14 2.5V7h4M9 12h6M9 16h6"></path>',
    download: '<path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 20h16"></path>',
    reset: '<path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6"></path><path d="M4 3.5v5h5"></path>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"></path><circle cx="12" cy="13" r="3.5"></circle>',
    pause: '<path d="M9 6v12M15 6v12"></path>',
    copy: '<rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"></path>',
    external: '<path d="M14 4h6v6M20 4l-9 9"></path><path d="M18 13v6H5V6h6"></path>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
}

function appTemplate() {
  return `
    <header class="topbar">
      <div class="brand"><span class="brand-cube">F</span><span>FORGE<span>3D</span></span></div>
      <div class="product-label">GitHub 真实模型浏览器</div>
      <div class="api-rate" id="api-rate"><i></i><span>GitHub API 未使用</span></div>
    </header>
    <main class="workspace">
      <aside class="browser-panel">
        <div class="browser-head">
          <span class="kicker">DISCOVER REAL ASSETS</span>
          <h1>直接加载 GitHub<br/>里的 3D 模型</h1>
          <p>搜索公开仓库中的 <code>.glb</code> / <code>.gltf</code> 文件，选中后在右侧真实渲染。</p>
        </div>
        <form class="search-form" id="search-form">
          <label>${icon('search')}<input id="search-input" placeholder="car、camera、机械零件，或 GitHub 模型链接" autocomplete="off"/></label>
          <button type="submit">搜索 GitHub</button>
        </form>
        <div class="search-hint"><span>试试：</span><button data-query="car">car</button><button data-query="camera">camera</button><button data-query="mechanical">mechanical</button></div>
        <div class="filter-row" id="filters"></div>
        <div class="results-meta"><span id="results-status">精选真实模型 · ${curatedAssets.length} 个</span><button id="reset-results" hidden>返回精选</button></div>
        <div class="asset-list" id="asset-list"></div>
      </aside>

      <section class="viewer-panel">
        <div class="viewer-stage">
          <canvas id="model-canvas"></canvas>
        <div class="viewer-topline">
            <span><i></i> LIVE GITHUB ASSET</span>
            <span id="viewer-source">raw.githubusercontent.com</span>
          </div>
          <div class="viewer-toolbar">
            <button id="reset-view" title="重置视角">${icon('reset')}<span>重置</span></button>
            <button id="toggle-animation" title="播放或暂停动画">${icon('pause')}<span>动画</span></button>
            <button id="take-screenshot" title="保存当前视图">${icon('camera')}<span>截图</span></button>
          </div>
          <div class="load-overlay" id="load-overlay">
            <div class="loader-ring"></div>
            <strong>准备加载真实模型</strong>
            <span>文件来自 GitHub，不使用占位几何体</span>
            <div class="progress-track"><i id="load-progress"></i></div>
          </div>
        </div>

        <div class="asset-detail">
          <div class="detail-main">
            <div class="detail-labels"><span class="format-badge" id="detail-format">GLB</span><span class="license-badge" id="detail-license">CC0</span></div>
            <h2 id="detail-name">—</h2>
            <a id="detail-repo" target="_blank" rel="noreferrer">—</a>
            <p id="detail-path">—</p>
            <div class="detail-actions">
              <a id="open-source" class="primary" target="_blank" rel="noreferrer">${icon('github')} 查看 GitHub 文件</a>
              <button id="download-asset">${icon('download')} 下载模型</button>
              <button id="copy-url">${icon('copy')} 复制模型地址</button>
            </div>
          </div>
          <div class="metadata-grid">
            <div><span>文件大小</span><strong id="meta-size">—</strong></div>
            <div><span>模型网格</span><strong id="meta-meshes">—</strong></div>
            <div><span>三角面</span><strong id="meta-triangles">—</strong></div>
            <div><span>材质</span><strong id="meta-materials">—</strong></div>
            <div><span>动画</span><strong id="meta-animations">—</strong></div>
            <div><span>版本</span><strong id="meta-ref">—</strong></div>
          </div>
          <div class="license-strip">
            <div><span>许可证与来源</span><strong id="license-text">—</strong><p id="attribution-text">—</p></div>
            <a id="license-link" target="_blank" rel="noreferrer">核验许可 ${icon('external')}</a>
          </div>
        </div>
      </section>
    </main>
    <div class="toast" id="toast"></div>`;
}

document.querySelector('#app').innerHTML = appTemplate();

viewer = createModelViewer(document.querySelector('#model-canvas'), {
  onLoading(asset) {
    asset.activeDelivery = null;
    showOverlay('loading', '正在加载模型', `${asset.name} · ${asset.delivery || 'GitHub'} · ${formatBytes(asset.size)}`);
    updateStats(null);
  },
  onFallback(asset, url) {
    const host = new URL(url).hostname;
    asset.activeDelivery = host.includes('jsdelivr') ? 'jsDelivr 回退' : 'GitHub Raw 回退';
    showOverlay('loading', '正在切换备用来源', `${asset.name} · ${asset.activeDelivery}`);
  },
  onProgress(asset, progress, loaded, total) {
    if (!asset.size && Number.isFinite(total)) asset.size = total;
    const percent = progress == null ? null : Math.round(progress * 100);
    document.querySelector('#load-progress').style.width = percent == null ? '18%' : `${percent}%`;
    const label = percent == null ? `已接收 ${formatBytes(loaded)}` : `${percent}% · ${formatBytes(loaded)}`;
    document.querySelector('#load-overlay span').textContent = label;
  },
  onLoaded(asset, stats) {
    state.stats = stats;
    hideOverlay();
    updateStats(stats);
    renderDetails(asset);
    document.querySelector('#toggle-animation').disabled = stats.animations === 0;
  },
  onError(asset, message) {
    const lfs = /Unexpected token|JSON|magic|fetch|404|403/i.test(message)
      ? '可能是 Git LFS 指针、外部纹理失效、CORS 或文件格式问题。'
      : message;
    showOverlay('error', '这个 GitHub 模型无法直接加载', lfs, true);
    updateStats(null);
  },
});

function filteredAssets() {
  return state.assets.filter((asset) => state.category === '全部' || asset.category === state.category);
}

function renderFilters() {
  document.querySelector('#filters').innerHTML = categories.map((category) => `
    <button class="${state.category === category ? 'active' : ''}" data-category="${category}">${category}</button>
  `).join('');
  document.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => {
    state.category = button.dataset.category;
    renderFilters();
    renderAssetList();
  }));
}

function renderAssetList() {
  const list = document.querySelector('#asset-list');
  const assets = filteredAssets();
  if (!assets.length) {
    list.innerHTML = '<div class="empty-result"><strong>没有找到可加载的模型文件</strong><span>换个关键词，或直接粘贴 GitHub 上的 .glb / .gltf 文件链接。</span></div>';
    return;
  }
  list.innerHTML = assets.map((asset) => `
    <button class="asset-row ${state.selected?.id === asset.id ? 'active' : ''}" data-asset-id="${escapeHtml(asset.id)}">
      <span class="file-icon">${icon('file')}<i>${escapeHtml(asset.format)}</i></span>
      <span class="asset-copy">
        <strong>${escapeHtml(asset.name)}</strong>
        <small>${escapeHtml(asset.nameEn || asset.repo)}</small>
        <em>${escapeHtml(asset.repo)} · ${escapeHtml(asset.path)}</em>
      </span>
      <span class="asset-facts"><b>${formatBytes(asset.size)}</b><i class="${licenseTone(asset.license)}">${escapeHtml(asset.license.split('·')[0])}</i></span>
    </button>
  `).join('');
  document.querySelectorAll('[data-asset-id]').forEach((button) => button.addEventListener('click', () => {
    const asset = state.assets.find((item) => item.id === button.dataset.assetId);
    if (asset) selectAsset(asset);
  }));
}

function renderDetails(asset) {
  document.querySelector('#detail-format').textContent = asset.format;
  const licenseBadge = document.querySelector('#detail-license');
  licenseBadge.textContent = asset.license;
  licenseBadge.className = `license-badge ${licenseTone(asset.license)}`;
  document.querySelector('#detail-name').textContent = asset.name;
  const repo = document.querySelector('#detail-repo');
  repo.textContent = asset.repo;
  repo.href = asset.repoUrl;
  document.querySelector('#detail-path').textContent = asset.nameEn ? `${asset.nameEn} · ${asset.path}` : asset.path;
  document.querySelector('#open-source').href = asset.sourceUrl;
  document.querySelector('#meta-size').textContent = formatBytes(asset.size);
  document.querySelector('#meta-ref').textContent = (asset.commitSha || asset.branch || 'HEAD').slice(0, 10);
  document.querySelector('#license-text').textContent = asset.license;
  const attribution = asset.attribution || '仓库许可证不等于模型许可证，请在下载和商用前核验文件来源。';
  document.querySelector('#attribution-text').textContent = asset.riskNote ? `${attribution} 风险提示：${asset.riskNote}` : attribution;
  const licenseLink = document.querySelector('#license-link');
  licenseLink.href = asset.licenseUrl || asset.repoUrl;
  document.querySelector('#viewer-source').textContent = asset.commitSha ? `${asset.activeDelivery || asset.delivery || 'GitHub'} · commit ${asset.commitSha.slice(0, 10)}` : `${asset.branch || 'HEAD'} · 未固定 commit`;
}

function updateStats(stats) {
  document.querySelector('#meta-meshes').textContent = stats ? formatNumber(stats.meshes) : '—';
  document.querySelector('#meta-triangles').textContent = stats ? formatNumber(stats.triangles) : '—';
  document.querySelector('#meta-materials').textContent = stats ? formatNumber(stats.materials) : '—';
  document.querySelector('#meta-animations').textContent = stats ? formatNumber(stats.animations) : '—';
}

async function selectAsset(asset) {
  state.selected = asset;
  state.stats = null;
  renderAssetList();
  renderDetails(asset);
  document.querySelector('#toggle-animation').disabled = true;
  if (!asset.commitSha && !asset.trusted) {
    showOverlay('loading', '正在固定仓库版本', `${asset.repo} / ${asset.branch}`);
    await pinAsset(asset);
    renderDetails(asset);
  }
  if (asset.size && asset.size > MAX_AUTO_LOAD) {
    showOverlay('large', `模型大小为 ${formatBytes(asset.size)}`, '大模型可能占用数倍显存和内存。', true);
    return;
  }
  loadSelectedAsset();
}

function loadSelectedAsset() {
  viewer.load(state.selected).catch(() => {});
}

function showOverlay(type, title, text, action = false) {
  const overlay = document.querySelector('#load-overlay');
  overlay.className = `load-overlay visible ${type}`;
  overlay.querySelector('strong').textContent = title;
  overlay.querySelector('span').textContent = text;
  document.querySelector('#load-progress').style.width = type === 'loading' ? '8%' : '0';
  overlay.querySelector('[data-overlay-action]')?.remove();
  if (action) {
    const button = document.createElement('button');
    button.dataset.overlayAction = 'true';
    if (type === 'large') {
      button.textContent = '仍然加载';
      button.addEventListener('click', loadSelectedAsset);
    } else {
      button.textContent = '打开 GitHub 文件';
      button.addEventListener('click', () => window.open(state.selected.sourceUrl, '_blank'));
    }
    overlay.append(button);
  }
}

function hideOverlay() {
  document.querySelector('#load-overlay').className = 'load-overlay';
}

function updateRate(response) {
  const remaining = response.headers.get('x-ratelimit-remaining');
  const reset = response.headers.get('x-ratelimit-reset');
  if (remaining != null) state.rateRemaining = Number(remaining);
  if (reset != null) state.rateReset = Number(reset) * 1000;
  const label = document.querySelector('#api-rate span');
  if (state.rateRemaining == null) return;
  if (state.rateRemaining === 0 && state.rateReset) {
    const time = new Date(state.rateReset).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    label.textContent = `API 限流至 ${time}`;
  } else {
    label.textContent = `GitHub API 剩余 ${state.rateRemaining} 次`;
  }
  document.querySelector('#api-rate').classList.toggle('low', state.rateRemaining < 10);
}

async function githubFetch(url) {
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } });
  updateRate(response);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 403 || response.status === 429) throw new Error('GitHub API 频率已达上限，请稍后再试。');
    throw new Error(body.message || `GitHub API 返回 ${response.status}`);
  }
  return response.json();
}

function translateQuery(input) {
  let output = input;
  Object.entries(queryAliases).forEach(([key, value]) => {
    output = output.replaceAll(key, value);
  });
  return output;
}

function searchIndexedAssets(input) {
  const translated = translateQuery(input).toLowerCase();
  const tokens = translated.split(/\s+/).filter((token) => token.length > 1 && !['gltf', 'glb', 'model'].includes(token));
  if (!tokens.length) return [];
  return curatedAssets.filter((asset) => {
    const haystack = `${asset.name} ${asset.nameEn || ''} ${asset.category} ${asset.path} ${asset.repo}`.toLowerCase();
    return tokens.some((token) => haystack.includes(token));
  });
}

function directAssetFromUrl(input) {
  const github = input.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+\.(?:glb|gltf))(?:\?.*)?$/i);
  const raw = input.match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+\.(?:glb|gltf))(?:\?.*)?$/i);
  const match = github || raw;
  if (!match) return null;
  const [, owner, repository, ref, path] = match;
  const repo = `${owner}/${repository}`;
  const encoded = encodePath(path);
  return {
    id: `direct:${repo}:${ref}:${path}`,
    name: modelName(path),
    category: inferCategory(path),
    format: path.toLowerCase().endsWith('.glb') ? 'GLB' : 'glTF',
    path,
    size: null,
    license: '模型许可需复核',
    attribution: '这是用户粘贴的 GitHub 文件链接，请自行核验资产许可证与来源。',
    repo,
    branch: ref,
    commitSha: /^[a-f0-9]{40}$/i.test(ref) ? ref : null,
    rawUrl: `https://raw.githubusercontent.com/${repo}/${ref}/${encoded}`,
    sourceUrl: `https://github.com/${repo}/blob/${ref}/${encoded}`,
    repoUrl: `https://github.com/${repo}`,
    licenseUrl: `https://github.com/${repo}`,
    trusted: false,
  };
}

function repositoryNameFromInput(input) {
  const url = input.match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+)\/?(?:[?#].*)?$/i);
  const short = input.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  const match = url || short;
  return match ? `${match[1]}/${match[2].replace(/\.git$/i, '')}` : null;
}

async function scanRepositoryInput(fullName) {
  const button = document.querySelector('#search-form button');
  button.disabled = true;
  button.textContent = '正在扫描仓库…';
  document.querySelector('#results-status').textContent = `读取 ${fullName} 的文件树…`;
  try {
    const repository = await githubFetch(`https://api.github.com/repos/${fullName}`);
    const assets = await scanRepository(repository);
    if (!assets.length) throw new Error('这个仓库里没有发现可直接加载的 .glb / .gltf 文件。');
    state.assets = assets;
    state.category = '全部';
    state.lastQuery = fullName;
    document.querySelector('#results-status').textContent = `在 ${fullName} 中发现 ${assets.length} 个真实模型`;
    document.querySelector('#reset-results').hidden = false;
    renderFilters();
    renderAssetList();
    selectAsset(assets[0]);
  } catch (error) {
    document.querySelector('#results-status').textContent = error.message;
    toast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = '搜索 GitHub';
  }
}

async function pinAsset(asset) {
  if (asset.commitSha) return asset;
  const key = `${asset.repo}:${asset.branch}`;
  try {
    let sha = commitCache.get(key);
    if (!sha) {
      const commit = await githubFetch(`https://api.github.com/repos/${asset.repo}/commits/${encodeURIComponent(asset.branch)}`);
      sha = commit.sha;
      commitCache.set(key, sha);
    }
    asset.commitSha = sha;
    const path = encodePath(asset.path);
    asset.rawUrl = `https://raw.githubusercontent.com/${asset.repo}/${sha}/${path}`;
    asset.sourceUrl = `https://github.com/${asset.repo}/blob/${sha}/${path}`;
  } catch (error) {
    toast(`${error.message}，暂时使用默认分支加载。`);
  }
  return asset;
}

function assetPriority(entry) {
  const path = entry.path.toLowerCase();
  let score = path.endsWith('.glb') ? 100 : 20;
  if (/gltf-binary|\/glb\/|models?\/|assets?\/|public\//.test(path)) score += 35;
  if (/car|camera|chair|watch|bottle|shoe|boombox|refrigerator|helmet|truck|sofa|lamp/.test(path)) score += 42;
  if (/draco|ktx|basis|embedded|test|fixture|cube|sphere|grid/.test(path)) score -= 38;
  if (entry.size && entry.size < 25 * 1024 * 1024) score += 10;
  return score;
}

async function scanRepository(repo) {
  const cacheKey = `${repo.full_name}:${repo.default_branch}`;
  if (treeCache.has(cacheKey)) return treeCache.get(cacheKey);
  const tree = await githubFetch(`https://api.github.com/repos/${repo.full_name}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`);
  const entries = (tree.tree || [])
    .filter((entry) => entry.type === 'blob' && /\.(glb|gltf)$/i.test(entry.path))
    .filter((entry) => !/(^|\/)node_modules\//i.test(entry.path))
    .filter((entry) => !entry.size || (entry.size > 500 && entry.size <= MAX_DISCOVER_SIZE))
    .sort((a, b) => assetPriority(b) - assetPriority(a));

  const seen = new Set();
  const assets = [];
  for (const entry of entries) {
    const key = entry.path.split('/').pop().replace(/\.(glb|gltf)$/i, '').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const path = encodePath(entry.path);
    const license = repo.license?.spdx_id ? `仓库 ${repo.license.spdx_id} · 模型需复核` : '仓库未声明许可 · 模型需复核';
    assets.push({
      id: `${repo.full_name}:${repo.default_branch}:${entry.path}`,
      name: modelName(entry.path),
      category: inferCategory(`${entry.path} ${repo.name} ${repo.description || ''}`),
      format: entry.path.toLowerCase().endsWith('.glb') ? 'GLB' : 'glTF',
      path: entry.path,
      size: entry.size || null,
      license,
      attribution: '由 GitHub 文件树自动发现；仓库级许可证不能证明该模型可再分发。',
      repo: repo.full_name,
      branch: repo.default_branch,
      commitSha: null,
      stars: repo.stargazers_count,
      updated: repo.updated_at?.slice(0, 10),
      description: repo.description || '',
      rawUrl: `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${path}`,
      sourceUrl: `https://github.com/${repo.full_name}/blob/${repo.default_branch}/${path}`,
      repoUrl: repo.html_url,
      licenseUrl: `${repo.html_url}/blob/${repo.default_branch}/LICENSE`,
      trusted: false,
      treeTruncated: Boolean(tree.truncated),
    });
    if (assets.length >= 6) break;
  }
  treeCache.set(cacheKey, assets);
  return assets;
}

async function searchGithub(input) {
  const direct = directAssetFromUrl(input.trim());
  if (direct) {
    state.assets = [direct];
    state.category = '全部';
    state.lastQuery = input.trim();
    document.querySelector('#results-status').textContent = '已识别 GitHub 模型链接';
    document.querySelector('#reset-results').hidden = false;
    renderFilters();
    renderAssetList();
    selectAsset(direct);
    return;
  }

  const repositoryName = repositoryNameFromInput(input.trim());
  if (repositoryName) {
    await scanRepositoryInput(repositoryName);
    return;
  }

  const localMatches = searchIndexedAssets(input.trim());
  if (localMatches.length) {
    state.assets = [...localMatches];
    state.category = '全部';
    state.lastQuery = input.trim();
    document.querySelector('#results-status').textContent = `已索引模型命中 ${localMatches.length} 个，正在补充扫描 GitHub…`;
    document.querySelector('#reset-results').hidden = false;
    renderFilters();
    renderAssetList();
    selectAsset(localMatches[0]);
  }

  if (state.rateRemaining === 0 && state.rateReset && state.rateReset > Date.now()) {
    const time = new Date(state.rateReset).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    document.querySelector('#results-status').textContent = localMatches.length
      ? `已从 GitHub 模型索引找到 ${localMatches.length} 个；在线 API 将在 ${time} 后恢复。`
      : `GitHub API 已限流，将在 ${time} 后恢复。你仍可粘贴模型文件链接直接加载。`;
    return;
  }

  state.searching = true;
  const button = document.querySelector('#search-form button');
  button.disabled = true;
  button.textContent = '正在扫描仓库…';
  document.querySelector('#results-status').textContent = '搜索 GitHub，并扫描仓库文件树…';
  try {
    const query = translateQuery(input.trim() || 'product');
    const search = await githubFetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(`${query} gltf in:name,description,readme`)}&sort=stars&order=desc&per_page=8`);
    const repositories = search.items.slice(0, 3);
    const scanned = await Promise.allSettled(repositories.map(scanRepository));
    const assets = scanned.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    if (!assets.length && !localMatches.length) throw new Error('这些仓库里没有发现可直接加载的 .glb / .gltf 文件。');
    const merged = [...localMatches, ...assets.filter((asset) => !localMatches.some((local) => local.rawUrl === asset.rawUrl))];
    state.assets = merged;
    state.category = '全部';
    state.lastQuery = input.trim();
    const truncated = assets.some((asset) => asset.treeTruncated);
    document.querySelector('#results-status').textContent = `索引命中 ${localMatches.length} 个；扫描 ${repositories.length} 个仓库后共得到 ${merged.length} 个真实模型${truncated ? '（部分大仓库结果不完整）' : ''}`;
    document.querySelector('#reset-results').hidden = false;
    renderFilters();
    renderAssetList();
    selectAsset(merged[0]);
  } catch (error) {
    if (localMatches.length) {
      document.querySelector('#results-status').textContent = `已从 GitHub 模型索引找到 ${localMatches.length} 个；在线扫描暂不可用：${error.message}`;
    } else {
      document.querySelector('#results-status').textContent = error.message;
      toast(error.message);
    }
  } finally {
    state.searching = false;
    button.disabled = false;
    button.textContent = '搜索 GitHub';
  }
}

async function downloadSelected() {
  const asset = state.selected;
  if (!asset) return;
  const button = document.querySelector('#download-asset');
  button.disabled = true;
  button.textContent = '正在下载…';
  try {
    if (asset.format === 'glTF' && !asset.packageUrl) {
      const directoryUrl = asset.sourceUrl?.replace('/blob/', '/tree/').replace(/\/[^/]+$/, '') || asset.repoUrl;
      window.open(directoryUrl, '_blank', 'noopener,noreferrer');
      toast('该 glTF 包含外部依赖，已打开 GitHub 完整目录。');
      return;
    }

    const urls = [...new Set((asset.packageUrl
      ? [asset.packageUrl]
      : [asset.rawUrl, asset.fallbackUrl, asset.githubRawUrl]).filter(Boolean))];
    let downloaded = null;
    let lastError = null;
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (blob.size < 300) {
          const text = await blob.text();
          if (text.includes('git-lfs.github.com/spec')) throw new Error('Git LFS pointer');
        }
        downloaded = { blob, url };
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!downloaded) throw new Error(`所有下载来源均不可用：${lastError?.message || '未知错误'}`);
    const url = URL.createObjectURL(downloaded.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = asset.packageUrl ? `${asset.id}-complete.zip` : asset.path.split('/').pop();
    anchor.click();
    URL.revokeObjectURL(url);
    const source = new URL(downloaded.url).hostname.includes('magic-builder') ? '妙笔 TOS' : new URL(downloaded.url).hostname;
    toast(`已从 ${source} 下载 ${asset.name}`);
  } catch (error) {
    toast(error.message);
  } finally {
    button.disabled = false;
    button.innerHTML = `${icon('download')} 下载模型`;
  }
}

let animationPlaying = true;
document.querySelector('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  searchGithub(document.querySelector('#search-input').value);
});
document.querySelectorAll('[data-query]').forEach((button) => button.addEventListener('click', () => {
  document.querySelector('#search-input').value = button.dataset.query;
  searchGithub(button.dataset.query);
}));
document.querySelector('#reset-results').addEventListener('click', () => {
  state.assets = [...initialAssets];
  state.category = '全部';
  state.lastQuery = '';
  document.querySelector('#search-input').value = '';
  document.querySelector('#results-status').textContent = `精选真实模型 · ${curatedAssets.length} 个`;
  document.querySelector('#reset-results').hidden = true;
  renderFilters();
  renderAssetList();
  selectAsset(initialFeatured);
});
document.querySelector('#reset-view').addEventListener('click', () => viewer.resetView());
document.querySelector('#toggle-animation').addEventListener('click', () => {
  animationPlaying = !animationPlaying;
  viewer.setAnimationsPlaying(animationPlaying);
  document.querySelector('#toggle-animation').classList.toggle('paused', !animationPlaying);
});
document.querySelector('#take-screenshot').addEventListener('click', () => viewer.screenshot(`${state.selected.id.replace(/[^a-z0-9]+/gi, '-')}.png`));
document.querySelector('#download-asset').addEventListener('click', downloadSelected);
document.querySelector('#copy-url').addEventListener('click', async () => {
  await navigator.clipboard.writeText(state.selected.rawUrl);
  toast('模型地址已复制');
});

let toastTimer;
function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 3200);
}

renderFilters();
renderAssetList();
selectAsset(state.selected);
