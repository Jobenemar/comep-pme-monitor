// App COMEP - Sistema de Gestão de Indicadores
// Inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Estado global da aplicação
let appState = {
    indicators: [],
    users: [],
    currentView: 'dashboard',
    editingId: null
};

// Inicialização do App
function initializeApp() {
    loadData();
    setupEventListeners();
    renderDashboard();
    initCharts();
}

// Carregar dados do JSON
async function loadData() {
    try {
        const response = await fetch('data/pme-data.json');
        const data = await response.json();
        appState.indicators = data.indicators || [];
        appState.users = data.users || [];
        updateStats();
        renderTable();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados', 'error');
        // Dados de exemplo caso falhe
        loadSampleData();
    }
}

// Dados de exemplo
function loadSampleData() {
    appState.indicators = [
        { id: 1, name: 'Taxa de Ocupação', category: 'Operacional', value: 85.5, target: 90, status: 'active', description: 'Percentual de ocupação dos leitos' },
        { id: 2, name: 'Satisfação do Cliente', category: 'Qualidade', value: 4.2, target: 4.5, status: 'pending', description: 'Avaliação média dos pacientes' },
        { id: 3, name: 'Faturamento Mensal', category: 'Financeiro', value: 1250000, target: 1300000, status: 'active', description: 'Receita total do mês' },
        { id: 4, name: 'Incidentes de Segurança', category: 'Segurança', value: 2, target: 0, status: 'pending', description: 'Número de incidentes reportados' },
        { id: 5, name: 'Tempo Médio de Espera', category: 'Operacional', value: 15, target: 10, status: 'active', description: 'Tempo médio em minutos' }
    ];
    appState.users = [
        { id: 1, name: 'João Silva', role: 'Administrador', email: 'joao@comep.com', status: 'active' },
        { id: 2, name: 'Maria Santos', role: 'Gestor', email: 'maria@comep.com', status: 'active' },
        { id: 3, name: 'Pedro Costa', role: 'Analista', email: 'pedro@comep.com', status: 'active' }
    ];
    updateStats();
    renderTable();
}

// Configurar event listeners
function setupEventListeners() {
    // Toggle menu mobile
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Navegação da sidebar
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1);
            changeView(target);

            // Atualizar active state
            document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
            link.parentElement.classList.add('active');
        });
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('indicatorModal');
        if (e.target === modal) {
            closeModal();
        }
    });

    // Pesquisa em tempo real
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTable(e.target.value);
        });
    }
}

// Mudar visualização
function changeView(view) {
    appState.currentView = view;
    const header = document.querySelector('.header h1');

    const titles = {
        'dashboard': 'Dashboard',
        'indicadores': 'Indicadores',
        'relatorios': 'Relatórios',
        'usuarios': 'Usuários',
        'configuracoes': 'Configurações'
    };

    if (header) {
        header.textContent = titles[view] || 'Dashboard';
    }

    // Aqui você pode implementar a lógica para mostrar/esconder seções
    showToast(`Visualização alterada para: ${titles[view]}`, 'success');
}

// Atualizar estatísticas
function updateStats() {
    const totalUsers = appState.users.length;
    const activeIndicators = appState.indicators.filter(i => i.status === 'active').length;
    const pendingItems = appState.indicators.filter(i => i.status === 'pending').length;

    // Animação de contagem
    animateValue('totalUsers', 0, totalUsers, 1000);
    animateValue('activeIndicators', 0, activeIndicators, 1000);
    animateValue('pendingItems', 0, pendingItems, 1000);
}

// Animação de contagem
function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        if (current === end) {
            clearInterval(timer);
        }
    }, Math.max(stepTime, 50));

    // Se o range for 0, mostrar valor final imediatamente
    if (range === 0) {
        element.textContent = end;
    }
}

// Renderizar tabela
function renderTable(data = appState.indicators) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    tbody.innerHTML = data.map(indicator => `
        <tr>
            <td>#${indicator.id}</td>
            <td>
                <div style="font-weight: 500;">${indicator.name}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${indicator.description || ''}</div>
            </td>
            <td>
                <span class="badge-category">${indicator.category}</span>
            </td>
            <td>
                <strong>${formatValue(indicator.value, indicator.category)}</strong>
            </td>
            <td>${formatValue(indicator.target, indicator.category)}</td>
            <td>
                <span class="status ${indicator.status}">
                    ${getStatusText(indicator.status)}
                </span>
            </td>
            <td>
                <button class="action-btn" onclick="editIndicator(${indicator.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="deleteIndicator(${indicator.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Formatar valor baseado na categoria
function formatValue(value, category) {
    if (category === 'Financeiro') {
        return 'R$ ' + value.toLocaleString('pt-BR');
    }
    return value;
}

// Texto do status
function getStatusText(status) {
    const texts = {
        'active': 'Ativo',
        'pending': 'Pendente',
        'inactive': 'Inativo'
    };
    return texts[status] || status;
}

// Filtrar tabela
function filterTable(searchTerm) {
    const filtered = appState.indicators.filter(indicator => 
        indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    renderTable(filtered);
}

// Inicializar gráficos
function initCharts() {
    initPerformanceChart();
    initDistributionChart();
}

// Gráfico de desempenho
function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
                label: 'Meta',
                data: [85, 87, 88, 90, 92, 95],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Realizado',
                data: [82, 88, 85, 91, 89, 93],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Gráfico de distribuição
function initDistributionChart() {
    const ctx = document.getElementById('distributionChart');
    if (!ctx) return;

    const categories = {};
    appState.indicators.forEach(ind => {
        categories[ind.category] = (categories[ind.category] || 0) + 1;
    });

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#2563eb',
                    '#10b981',
                    '#f59e0b',
                    '#8b5cf6',
                    '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Abrir modal para novo indicador
function addNewIndicator() {
    appState.editingId = null;
    document.getElementById('modalTitle').textContent = 'Novo Indicador';
    document.getElementById('indicatorForm').reset();
    document.getElementById('indicatorModal').classList.add('active');
}

// Editar indicador
function editIndicator(id) {
    const indicator = appState.indicators.find(i => i.id === id);
    if (!indicator) return;

    appState.editingId = id;
    document.getElementById('modalTitle').textContent = 'Editar Indicador';
    document.getElementById('indicatorName').value = indicator.name;
    document.getElementById('indicatorCategory').value = indicator.category;
    document.getElementById('indicatorValue').value = indicator.value;
    document.getElementById('indicatorTarget').value = indicator.target;
    document.getElementById('indicatorDescription').value = indicator.description || '';
    document.getElementById('indicatorModal').classList.add('active');
}

// Salvar indicador
function saveIndicator() {
    const name = document.getElementById('indicatorName').value;
    const category = document.getElementById('indicatorCategory').value;
    const value = parseFloat(document.getElementById('indicatorValue').value);
    const target = parseFloat(document.getElementById('indicatorTarget').value);
    const description = document.getElementById('indicatorDescription').value;

    if (!name || !category || isNaN(value) || isNaN(target)) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    if (appState.editingId) {
        // Editar existente
        const index = appState.indicators.findIndex(i => i.id === appState.editingId);
        if (index !== -1) {
            appState.indicators[index] = {
                ...appState.indicators[index],
                name,
                category,
                value,
                target,
                description
            };
            showToast('Indicador atualizado com sucesso!', 'success');
        }
    } else {
        // Criar novo
        const newId = Math.max(...appState.indicators.map(i => i.id), 0) + 1;
        appState.indicators.push({
            id: newId,
            name,
            category,
            value,
            target,
            description,
            status: 'active'
        });
        showToast('Indicador criado com sucesso!', 'success');
    }

    closeModal();
    renderTable();
    updateStats();
    initCharts(); // Atualizar gráficos
}

// Excluir indicador
function deleteIndicator(id) {
    if (confirm('Tem certeza que deseja excluir este indicador?')) {
        appState.indicators = appState.indicators.filter(i => i.id !== id);
        renderTable();
        updateStats();
        initCharts();
        showToast('Indicador excluído com sucesso!', 'success');
    }
}

// Fechar modal
function closeModal() {
    document.getElementById('indicatorModal').classList.remove('active');
}

// Exportar dados
function exportData() {
    const dataStr = JSON.stringify(appState.indicators, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'indicadores-comep.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Dados exportados com sucesso!', 'success');
}

// Mostrar toast notification
function showToast(message, type = 'success') {
    // Remover toast existente
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Criar novo toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 'exclamation-triangle';

    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Renderizar dashboard
function renderDashboard() {
    // Esta função pode ser expandida para renderizar componentes dinâmicos
    console.log('Dashboard renderizado');
}

// Funções utilitárias
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Salvar dados no localStorage (backup)
function saveToLocalStorage() {
    localStorage.setItem('comep_data', JSON.stringify(appState));
}

// Carregar dados do localStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem('comep_data');
    if (saved) {
        return JSON.parse(saved);
    }
    return null;
}

// Atualizar dados periodicamente
setInterval(() => {
    saveToLocalStorage();
}, 30000); // Salvar a cada 30 segundos

// Expor funções globais para eventos inline
window.addNewIndicator = addNewIndicator;
window.editIndicator = editIndicator;
window.deleteIndicator = deleteIndicator;
window.saveIndicator = saveIndicator;
window.closeModal = closeModal;
window.exportData = exportData;
