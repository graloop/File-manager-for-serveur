document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const form = document.getElementById('ssh-form');
    const statusDiv = document.getElementById('connection-status');
    const fileListTbody = document.getElementById('file-list-tbody');
    const breadcrumbBar = document.getElementById('breadcrumb-bar');
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const upBtn = document.getElementById('up-btn');
    const newFolderBtn = document.getElementById('new-folder-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const contextMenu = document.getElementById('context-menu');
    const menuOpen = document.getElementById('menu-open');
    const menuRename = document.getElementById('menu-rename');
    const menuDelete = document.getElementById('menu-delete');
    const itemCountStatus = document.getElementById('item-count-status');
    const selectedStatus = document.getElementById('selected-status');

    let currentPath = '/';
    let history = [];
    let historyIndex = -1;
    let fileList = [];
    let selectedFile = null;

    // Sorting state: { column: null | 'name' | 'date' | 'type' | 'size', direction: 0 | 1 | 2 }
    // direction: 0 = normal (original order), 1 = first click, 2 = second click
    let sortState = {
        column: null,
        direction: 0
    };

    // Connect form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const host = document.getElementById('host').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        statusDiv.textContent = 'Connecting...';
        statusDiv.style.color = '#ffa500';

        socket.emit('ssh-connect', { host, port: 22, username, password });
    });

    socket.on('connect_error', (err) => {
        statusDiv.textContent = 'Connection error';
        statusDiv.style.color = '#ff6b6b';
        console.error('Socket connection error:', err);
    });

    socket.on('ssh-status', (data) => {
        if (data.status === 'connected') {
            statusDiv.textContent = 'Connected';
            statusDiv.style.color = '#6ccb5f';
            backBtn.disabled = false;
            upBtn.disabled = false;
            newFolderBtn.disabled = false;
            refreshBtn.disabled = false;
        } else {
            statusDiv.textContent = data.message;
            statusDiv.style.color = '#ff6b6b';
        }
    });

    socket.on('file-list', (data) => {
        const targetPath = data.path;
        
        // Update navigation history if path changed
        if (currentPath !== targetPath) {
            // If we navigated from middle of history, slice forward history
            if (historyIndex < history.length - 1) {
                history = history.slice(0, historyIndex + 1);
            }
            history.push(targetPath);
            historyIndex = history.length - 1;
        } else if (history.length === 0) {
            history.push(targetPath);
            historyIndex = 0;
        }

        currentPath = targetPath;
        fileList = data.list;

        updateNavButtons();
        renderBreadcrumbs();
        renderFileList();
    });

    socket.on('action-success', (msg) => {
        console.log(msg);
        navigateTo(currentPath);
    });

    socket.on('file-error', (err) => {
        alert(err);
    });

    // Sorting headers & indicators
    const thName = document.getElementById('th-name');
    const thDate = document.getElementById('th-date');
    const thType = document.getElementById('th-type');
    const thSize = document.getElementById('th-size');
    const sortNameIndicator = document.getElementById('sort-name-indicator');
    const sortDateIndicator = document.getElementById('sort-date-indicator');
    const sortTypeIndicator = document.getElementById('sort-type-indicator');
    const sortSizeIndicator = document.getElementById('sort-size-indicator');

    function handleHeaderSort(column) {
        if (sortState.column === column) {
            sortState.direction = (sortState.direction + 1) % 3;
            if (sortState.direction === 0) {
                sortState.column = null;
            }
        } else {
            sortState.column = column;
            sortState.direction = 1;
        }
        renderFileList();
    }

    thName.addEventListener('click', () => handleHeaderSort('name'));
    thDate.addEventListener('click', () => handleHeaderSort('date'));
    thType.addEventListener('click', () => handleHeaderSort('type'));
    thSize.addEventListener('click', () => handleHeaderSort('size'));

    function navigateTo(path) {
        if (socket) {
            socket.emit('list-dir', path);
        }
    }

    function updateNavButtons() {
        backBtn.disabled = historyIndex <= 0;
        forwardBtn.disabled = historyIndex >= history.length - 1;
        upBtn.disabled = currentPath === '/';
    }

    backBtn.addEventListener('click', () => {
        if (historyIndex > 0) {
            historyIndex--;
            navigateTo(history[historyIndex]);
        }
    });

    forwardBtn.addEventListener('click', () => {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            navigateTo(history[historyIndex]);
        }
    });

    upBtn.addEventListener('click', () => {
        if (currentPath !== '/') {
            const parts = currentPath.split('/').filter(Boolean);
            parts.pop();
            const parent = '/' + parts.join('/');
            navigateTo(parent === '' ? '/' : parent);
        }
    });

    refreshBtn.addEventListener('click', () => {
        navigateTo(currentPath);
    });

    function renderBreadcrumbs() {
        const parts = currentPath.split('/').filter(Boolean);
        let html = `<span class="breadcrumb-crumb" data-path="/">📁 This PC</span>`;
        let accumulated = '';

        parts.forEach((part) => {
            accumulated += `/${part}`;
            html += ` / <span class="breadcrumb-crumb" data-path="${accumulated}">${part}</span>`;
        });

        breadcrumbBar.innerHTML = html;

        breadcrumbBar.querySelectorAll('.breadcrumb-crumb').forEach(el => {
            el.addEventListener('click', () => {
                navigateTo(el.getAttribute('data-path'));
            });
        });
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0 || isNaN(bytes)) return '';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function formatDate(ms) {
        if (!ms) return '';
        const date = new Date(ms);
        return date.toLocaleString();
    }

    function getFileType(file) {
        if (file.isDirectory) return 'File folder';
        if (file.isSymbolicLink) return 'Symbolic Link';
        const name = file.filename;
        const lastDot = name.lastIndexOf('.');
        if (lastDot > 0 && lastDot < name.length - 1) {
            const ext = name.substring(lastDot + 1).toUpperCase();
            return `${ext} File`;
        }
        return 'File';
    }

    function renderFileList() {
        let html = '';
        let count = 0;

        // Filter out . and ..
        let validList = fileList.filter(file => file.filename !== '.' && file.filename !== '..');

        // Apply sorting
        if (sortState.column && sortState.direction > 0) {
            validList.sort((a, b) => {
                if (sortState.column === 'name') {
                    const res = a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' });
                    return sortState.direction === 1 ? res : -res;
                } else if (sortState.column === 'date') {
                    const timeA = a.mtime ? new Date(a.mtime).getTime() : 0;
                    const timeB = b.mtime ? new Date(b.mtime).getTime() : 0;
                    // First click: most recent to oldest (descending)
                    // Second click: oldest to most recent (ascending)
                    return sortState.direction === 1 ? (timeB - timeA) : (timeA - timeB);
                } else if (sortState.column === 'type') {
                    const typeA = getFileType(a);
                    const typeB = getFileType(b);
                    const res = typeA.localeCompare(typeB, undefined, { sensitivity: 'base' }) ||
                                a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' });
                    // First click: Ascending (A-Z)
                    // Second click: Descending (Z-A)
                    return sortState.direction === 1 ? res : -res;
                } else if (sortState.column === 'size') {
                    const sizeA = a.isDirectory ? -1 : (Number(a.size) || 0);
                    const sizeB = b.isDirectory ? -1 : (Number(b.size) || 0);
                    // First click: Largest to smallest (descending)
                    // Second click: Smallest to largest (ascending)
                    if (sortState.direction === 1) {
                        return (sizeB !== sizeA) ? (sizeB - sizeA) : a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' });
                    } else {
                        return (sizeA !== sizeB) ? (sizeA - sizeB) : a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' });
                    }
                }
                return 0;
            });
        }

        // Update header indicators
        sortNameIndicator.textContent = '';
        sortDateIndicator.textContent = '';
        sortTypeIndicator.textContent = '';
        sortSizeIndicator.textContent = '';

        if (sortState.column === 'name') {
            if (sortState.direction === 1) sortNameIndicator.textContent = ' ▲';
            else if (sortState.direction === 2) sortNameIndicator.textContent = ' ▼';
        } else if (sortState.column === 'date') {
            if (sortState.direction === 1) sortDateIndicator.textContent = ' ▼'; // most recent first
            else if (sortState.direction === 2) sortDateIndicator.textContent = ' ▲'; // oldest first
        } else if (sortState.column === 'type') {
            if (sortState.direction === 1) sortTypeIndicator.textContent = ' ▲'; // A-Z
            else if (sortState.direction === 2) sortTypeIndicator.textContent = ' ▼'; // Z-A
        } else if (sortState.column === 'size') {
            if (sortState.direction === 1) sortSizeIndicator.textContent = ' ▼'; // largest first
            else if (sortState.direction === 2) sortSizeIndicator.textContent = ' ▲'; // smallest first
        }

        validList.forEach((file, index) => {
            count++;
            const icon = file.isDirectory ? '📁' : (file.isSymbolicLink ? '🔗' : '📄');
            const typeStr = getFileType(file);
            const sizeStr = file.isDirectory ? '' : formatBytes(file.size);
            const dateStr = formatDate(file.mtime);

            html += `<tr class="file-row" data-index="${index}" data-name="${file.filename}" data-isdir="${file.isDirectory}">
                <td>${icon} ${file.filename}</td>
                <td>${dateStr}</td>
                <td>${typeStr}</td>
                <td>${sizeStr}</td>
            </tr>`;
        });

        if (validList.length === 0) {
            html = `<tr><td colspan="4" style="text-align: center; color: #666; padding: 2rem;">This folder is empty.</td></tr>`;
        }

        fileListTbody.innerHTML = html;
        itemCountStatus.textContent = `${count} items`;
        selectedStatus.textContent = '';

        // Row interactions
        document.querySelectorAll('.file-row').forEach(row => {
            row.addEventListener('click', (e) => {
                document.querySelectorAll('.file-row').forEach(r => r.classList.remove('selected'));
                row.classList.add('selected');
                const name = row.getAttribute('data-name');
                const isDir = row.getAttribute('data-isdir') === 'true';
                selectedFile = { name, isDir };
                selectedStatus.textContent = `Selected: ${name}`;
            });

            row.addEventListener('dblclick', () => {
                const isDir = row.getAttribute('data-isdir') === 'true';
                const name = row.getAttribute('data-name');
                if (isDir) {
                    const target = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
                    navigateTo(target);
                }
            });

            row.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                row.click();
                contextMenu.style.display = 'block';
                contextMenu.style.left = `${e.pageX}px`;
                contextMenu.style.top = `${e.pageY}px`;
            });
        });
    }

    // Hide context menu on click elsewhere
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    });

    // Sidebar quick access clicks
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const targetPath = item.getAttribute('data-path');
            navigateTo(targetPath);
        });
    });

    // New Folder button
    newFolderBtn.addEventListener('click', () => {
        const folderName = prompt('Enter name for the new folder:');
        if (folderName) {
            const newPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
            if (socket) socket.emit('create-folder', newPath);
        }
    });

    // Context menu actions
    menuOpen.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        if (selectedFile && selectedFile.isDir) {
            const target = currentPath === '/' ? `/${selectedFile.name}` : `${currentPath}/${selectedFile.name}`;
            navigateTo(target);
        }
    });

    menuRename.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        if (selectedFile) {
            const oldPath = currentPath === '/' ? `/${selectedFile.name}` : `${currentPath}/${selectedFile.name}`;
            const newName = prompt('Enter new name:', selectedFile.name);
            if (newName && newName !== selectedFile.name) {
                const newPath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`;
                if (socket) socket.emit('rename-path', { oldPath, newPath });
            }
        }
    });

    menuDelete.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        if (selectedFile) {
            const filePath = currentPath === '/' ? `/${selectedFile.name}` : `${currentPath}/${selectedFile.name}`;
            if (confirm(`Are you sure you want to delete "${selectedFile.name}"?`)) {
                if (socket) socket.emit('delete-path', { filePath, isDir: selectedFile.isDir });
            }
        }
    });
});
