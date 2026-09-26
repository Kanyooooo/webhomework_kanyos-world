const state = {
    posts: [],
    categories: [],
    activeCategory: 'all',
    activePostId: '',
    query: ''
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(value) {
    if (!value) return 'unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'unknown';
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function normalizeText(value = '') {
    return String(value).toLowerCase();
}

function inlineMarkdown(text) {
    let output = escapeHtml(text);
    output = output.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
    output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    output = output.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
    output = output.replace(/\[\[([^\]]+)\]\]/g, '$1');
    output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
    output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return output;
}

function parseTable(lines, startIndex) {
    const tableLines = [];
    let index = startIndex;

    while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
        tableLines.push(lines[index]);
        index += 1;
    }

    if (tableLines.length < 2 || !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(tableLines[1])) {
        return null;
    }

    const splitRow = (line) => line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => inlineMarkdown(cell.trim()));

    const headers = splitRow(tableLines[0]);
    const rows = tableLines.slice(2).map(splitRow);
    const headHtml = headers.map((cell) => `<th>${cell}</th>`).join('');
    const bodyHtml = rows
        .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
        .join('');

    return {
        nextIndex: index,
        html: `<div class="reader-table-wrap"><table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`
    };
}

function markdownToHtml(markdown = '') {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let listOpen = false;
    let quoteOpen = false;
    let paragraph = [];
    let codeOpen = false;
    let codeBuffer = [];
    let codeLang = '';

    const flushParagraph = () => {
        if (!paragraph.length) return;
        html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
        paragraph = [];
    };

    const closeList = () => {
        if (listOpen) {
            html.push('</ul>');
            listOpen = false;
        }
    };

    const closeQuote = () => {
        if (quoteOpen) {
            html.push('</blockquote>');
            quoteOpen = false;
        }
    };

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];

        if (/^```/.test(line.trim())) {
            if (codeOpen) {
                html.push(`<pre><code class="language-${escapeHtml(codeLang)}">${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
                codeBuffer = [];
                codeOpen = false;
                codeLang = '';
            } else {
                flushParagraph();
                closeList();
                closeQuote();
                codeOpen = true;
                codeLang = line.trim().replace(/^```/, '').trim();
            }
            continue;
        }

        if (codeOpen) {
            codeBuffer.push(line);
            continue;
        }

        if (!line.trim()) {
            flushParagraph();
            closeList();
            closeQuote();
            continue;
        }

        const table = parseTable(lines, i);
        if (table) {
            flushParagraph();
            closeList();
            closeQuote();
            html.push(table.html);
            i = table.nextIndex - 1;
            continue;
        }

        const heading = line.match(/^(#{1,4})\s+(.+)$/);
        if (heading) {
            flushParagraph();
            closeList();
            closeQuote();
            const level = Math.min(4, heading[1].length + 1);
            html.push(`<h${level}>${inlineMarkdown(heading[2].trim())}</h${level}>`);
            continue;
        }

        const listItem = line.match(/^\s*[-*+]\s+(.+)$/);
        if (listItem) {
            flushParagraph();
            closeQuote();
            if (!listOpen) {
                html.push('<ul>');
                listOpen = true;
            }
            html.push(`<li>${inlineMarkdown(listItem[1])}</li>`);
            continue;
        }

        const quote = line.match(/^\s*>\s?(.+)$/);
        if (quote) {
            flushParagraph();
            closeList();
            if (!quoteOpen) {
                html.push('<blockquote>');
                quoteOpen = true;
            }
            html.push(`<p>${inlineMarkdown(quote[1])}</p>`);
            continue;
        }

        paragraph.push(line.trim());
    }

    if (codeOpen) {
        html.push(`<pre><code class="language-${escapeHtml(codeLang)}">${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
    }
    flushParagraph();
    closeList();
    closeQuote();

    return html.join('\n');
}

function filteredPosts() {
    const query = normalizeText(state.query);

    return state.posts.filter((post) => {
        const categoryMatch = state.activeCategory === 'all' || post.category === state.activeCategory;
        if (!categoryMatch) return false;
        if (!query) return true;

        return normalizeText([
            post.title,
            post.category,
            post.summary,
            post.sourcePath,
            (post.tags || []).join(' ')
        ].join(' ')).includes(query);
    });
}

function renderCategories() {
    const wrap = $('.blog-categories');
    const buttons = [
        `<button class="is-active" type="button" data-category="all">ALL <span>${state.posts.length}</span></button>`,
        ...state.categories.map((category) => (
            `<button type="button" data-category="${escapeHtml(category.name)}">${escapeHtml(category.name)} <span>${category.count}</span></button>`
        ))
    ];

    wrap.innerHTML = buttons.join('');
    wrap.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-category]');
        if (!button) return;
        state.activeCategory = button.dataset.category;
        $$('.blog-categories button').forEach((item) => {
            item.classList.toggle('is-active', item === button);
        });
        renderPostList();
    });
}

function renderPostList() {
    const posts = filteredPosts();
    const list = $('#post-list');
    $('#blog-count').textContent = `${posts.length} / ${state.posts.length} posts`;

    if (!posts.length) {
        list.innerHTML = '<div class="post-empty">no matching notes. try another keyword.</div>';
        return;
    }

    list.innerHTML = posts.map((post, index) => `
        <button class="post-card ${post.id === state.activePostId ? 'is-active' : ''}" type="button" data-post-id="${post.id}">
            <span class="post-index">${String(index).padStart(2, '0')}</span>
            <span class="post-card-main">
                <strong>${escapeHtml(post.title)}</strong>
                <small>${escapeHtml(post.category)} // ${formatDate(post.updatedAt)} // ${post.readingMinutes} min</small>
                <em>${escapeHtml(post.summary || 'no summary')}</em>
            </span>
        </button>
    `).join('');

    if (!state.activePostId || !posts.some((post) => post.id === state.activePostId)) {
        openPost(posts[0].id, false);
    }
}

function openPost(postId, shouldScroll = true) {
    const post = state.posts.find((item) => item.id === postId);
    if (!post) return;

    state.activePostId = postId;
    $$('.post-card').forEach((card) => {
        card.classList.toggle('is-active', card.dataset.postId === postId);
    });

    const tags = (post.tags || []).slice(0, 8).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
    $('#reader').innerHTML = `
        <div class="panel-title">READER</div>
        <header class="reader-head">
            <span>${escapeHtml(post.category)}</span>
            <h2>${escapeHtml(post.title)}</h2>
            <div class="reader-meta">
                <span>${formatDate(post.updatedAt)}</span>
                <span>${post.readingMinutes} min read</span>
                <span>${escapeHtml(post.sourcePath)}</span>
            </div>
            <div class="reader-tags">${tags}</div>
        </header>
        <div class="reader-content">${markdownToHtml(post.content || '')}</div>
    `;

    if (shouldScroll && window.innerWidth <= 980) {
        $('#reader').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function bindEvents() {
    $('#blog-search').addEventListener('input', (event) => {
        state.query = event.target.value;
        renderPostList();
    });

    $('#post-list').addEventListener('click', (event) => {
        const card = event.target.closest('[data-post-id]');
        if (!card) return;
        openPost(card.dataset.postId);
    });
}

async function initBlog() {
    try {
        const response = await fetch('blog-data.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        state.posts = Array.isArray(data.posts) ? data.posts : [];
        state.categories = Array.isArray(data.categories) ? data.categories : [];

        $('#blog-sync-state').textContent = `${data.source?.branch || 'main'} @ ${data.source?.commit || 'working tree'}`;
        $('#blog-sync-detail').textContent = data.source?.dirty ? 'vault has local changes included in this export' : 'vault export is clean';
        $('#blog-generated').textContent = `generated ${formatDate(data.generatedAt)}`;

        renderCategories();
        bindEvents();
        renderPostList();
    } catch (error) {
        $('#blog-sync-state').textContent = 'export missing';
        $('#blog-sync-detail').textContent = 'run tools/export-obsidian-blog.ps1 first';
        $('#post-list').innerHTML = `<div class="post-empty">failed to load blog-data.json: ${escapeHtml(error.message)}</div>`;
    }
}

window.addEventListener('DOMContentLoaded', initBlog);
