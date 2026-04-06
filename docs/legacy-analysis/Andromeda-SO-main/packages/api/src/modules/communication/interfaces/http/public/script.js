const messagesContainer = document.getElementById('messages-container');
const userInput = document.getElementById('user-input');
const jsonDisplay = document.getElementById('json-display');
const inspector = document.getElementById('inspector');

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function toggleInspector() {
    inspector.classList.toggle('active');
}

function appendMessage(role, text, meta = {}) {
    const div = document.createElement('div');
    div.className = `message ${role}`;

    let visualBadge = '';
    if (meta.visualState) {
        visualBadge = `<span class="visual-state state-${meta.visualState}">${meta.visualState}</span>`;
    }

    div.innerHTML = `
        ${text}
        <div class="meta">
            ${visualBadge}
            ${meta.taskId ? `<span>Task: ${meta.taskId}</span>` : ''}
            <span>${new Date().toLocaleTimeString()}</span>
        </div>
    `;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    const apiUrl = document.getElementById('api-url').value;
    const token = document.getElementById('token-input').value;
    const sessionId = document.getElementById('session-input').value;
    const userId = document.getElementById('user-id-input').value;

    appendMessage('user', text);
    userInput.value = '';

    try {
        const response = await fetch(`${apiUrl}/message`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel: 'web',
                sender: {
                    externalUserId: userId,
                    displayName: 'Admin User',
                    isAuthenticated: true
                },
                session: sessionId ? { id: sessionId } : {},
                content: {
                    type: 'text',
                    text: text
                },
                metadata: {
                    requestId: `web_${Date.now()}`
                }
            })
        });

        const data = await response.json();
        jsonDisplay.textContent = JSON.stringify(data, null, 2);

        if (response.ok) {
            if (data.sessionId) {
                document.getElementById('session-input').value = data.sessionId;
            }

            const respText = data.response?.text || `Mensagem aceita. Task ID: ${data.task?.id}`;
            appendMessage('assistant', respText, {
                visualState: data.visual?.state,
                taskId: data.task?.id
            });
        } else {
            appendMessage('assistant', `Erro: ${data.error?.message || 'Falha na comunicação'}`, { visualState: 'error' });
        }

    } catch (error) {
        appendMessage('assistant', `Erro de conexão: ${error.message}`, { visualState: 'error' });
    }
}

async function fetchTasks() {
    const explorer = document.getElementById('task-list');
    if (!explorer) return;

    try {
        const response = await fetch('http://localhost:5000/tasks');
        const tasks = await response.json();

        explorer.innerHTML = tasks.map(t => `
            <div class="task-item" style="padding: 12px; border-bottom: 1px solid var(--border); font-size: 0.8rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: var(--accent);">#${t.id.substring(0, 8)}</span>
                    <span class="visual-state" style="background: rgba(255,255,255,0.05);">${t.status}</span>
                </div>
                <div style="color: var(--text-main); margin-bottom: 10px;">${t.raw_request}</div>
                <button onclick="executeTask('${t.id}')" style="width: 100%; padding: 6px; background: var(--primary); border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                    EXECUTAR (MVP01)
                </button>
            </div>
        `).join('') || '<div style="padding: 20px; text-align: center; color: var(--text-dim);">Nenhuma task encontrada.</div>';
    } catch (error) {
        console.error('Erro ao buscar tasks:', error);
    }
}

async function executeTask(taskId) {
    try {
        const response = await fetch(`http://localhost:5000/tasks/${taskId}/execute`, {
            method: 'POST'
        });
        const data = await response.json();

        appendMessage('assistant', `Execução disparada para Task #${taskId.substring(0, 8)}. Novo status: ${data.status}`, {
            visualState: 'tool_execution',
            taskId: taskId
        });

        fetchTasks(); // Refresh list
    } catch (error) {
        appendMessage('assistant', `Erro ao executar task: ${error.message}`, { visualState: 'error' });
    }
}

// Inicializar busca de tasks e setar intervalo
setInterval(fetchTasks, 5000);
fetchTasks();

// Expose globally
window.sendMessage = sendMessage;
window.toggleInspector = toggleInspector;
window.executeTask = executeTask;
window.fetchTasks = fetchTasks;
