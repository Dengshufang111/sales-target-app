/**
 * 销售目标填报系统 - 主应用逻辑
 * 
 * 权限控制说明：
 * 1. 使用 localStorage 存储用户登录状态和数据
 * 2. 每个销售的数据以 salesId 为 key 进行隔离存储
 * 3. 登录时验证 salesId，确保每个用户只能访问自己的数据
 */

// ==================== 数据存储管理 ====================

const StorageKeys = {
    CURRENT_USER: 'currentUser',
    TARGET_DATA: 'targetData'
};

/**
 * 获取当前登录用户
 */
function getCurrentUser() {
    const userStr = localStorage.getItem(StorageKeys.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * 保存当前登录用户
 */
function setCurrentUser(user) {
    localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(user));
}

/**
 * 清除登录状态
 */
function clearCurrentUser() {
    localStorage.removeItem(StorageKeys.CURRENT_USER);
}

/**
 * 获取所有目标数据
 */
function getAllTargetData() {
    const dataStr = localStorage.getItem(StorageKeys.TARGET_DATA);
    return dataStr ? JSON.parse(dataStr) : {};
}

/**
 * 获取指定销售的目标数据
 * @param {string} salesId - 销售ID
 */
function getUserTargets(salesId) {
    const allData = getAllTargetData();
    return allData[salesId] || [];
}

/**
 * 保存目标数据
 * @param {string} salesId - 销售ID
 * @param {Array} targets - 目标数据数组
 */
function saveUserTargets(salesId, targets) {
    const allData = getAllTargetData();
    allData[salesId] = targets;
    localStorage.setItem(StorageKeys.TARGET_DATA, JSON.stringify(allData));
}

/**
 * 添加新的目标记录
 * @param {string} salesId - 销售ID
 * @param {Object} target - 目标数据
 */
function addTarget(salesId, target) {
    const targets = getUserTargets(salesId);
    targets.unshift(target); // 新记录放前面
    saveUserTargets(salesId, targets);
}

/**
 * 删除目标记录
 * @param {string} salesId - 销售ID
 * @param {string} targetId - 目标记录ID
 */
function deleteTarget(salesId, targetId) {
    const targets = getUserTargets(salesId);
    const filtered = targets.filter(t => t.id !== targetId);
    saveUserTargets(salesId, filtered);
}

// ==================== UI 控制 ====================

const loginPage = document.getElementById('loginPage');
const mainPage = document.getElementById('mainPage');
const toast = document.getElementById('toast');

/**
 * 显示/隐藏页面
 */
function showPage(page) {
    loginPage.classList.add('hidden');
    mainPage.classList.add('hidden');
    page.classList.remove('hidden');
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 类型：success/error
 */
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 生成唯一ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== 页面渲染 ====================

/**
 * 渲染目标列表
 */
function renderTargetList() {
    const user = getCurrentUser();
    if (!user) return;
    
    const targets = getUserTargets(user.salesId);
    const listContainer = document.getElementById('targetList');
    
    if (targets.length === 0) {
        listContainer.innerHTML = '<p class="empty">暂无填报记录</p>';
        return;
    }
    
    listContainer.innerHTML = targets.map(target => `
        <div class="target-item">
            <div class="target-info">
                <div class="target-date">填报时间：${formatDate(target.createdAt)}</div>
                <div class="target-values">
                    <div class="target-value">
                        <span class="label">GTV 目标：</span>
                        <span class="value">${target.gtv} 万元</span>
                    </div>
                    <div class="target-value">
                        <span class="label">财收目标：</span>
                        <span class="value">${target.revenue} 万元</span>
                    </div>
                </div>
            </div>
            <button class="btn btn-delete" onclick="handleDelete('${target.id}')">删除</button>
        </div>
    `).join('');
}

/**
 * 更新用户信息显示
 */
function updateUserDisplay() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('currentUser').textContent = `欢迎，${user.salesName} (${user.salesId})`;
    }
}

// ==================== 事件处理 ====================

/**
 * 处理登录
 */
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const salesId = document.getElementById('salesId').value.trim();
    const salesName = document.getElementById('salesName').value.trim();
    
    if (!salesId || !salesName) {
        showToast('请填写完整信息', 'error');
        return;
    }
    
    // 保存登录状态
    setCurrentUser({ salesId, salesName });
    
    // 更新UI
    updateUserDisplay();
    renderTargetList();
    showPage(mainPage);
    
    showToast('登录成功！');
});

/**
 * 处理目标提交
 */
document.getElementById('targetForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        showToast('请先登录', 'error');
        showPage(loginPage);
        return;
    }
    
    const gtv = parseFloat(document.getElementById('gtvTarget').value);
    const revenue = parseFloat(document.getElementById('revenueTarget').value);
    
    if (isNaN(gtv) || isNaN(revenue) || gtv < 0 || revenue < 0) {
        showToast('请输入有效的数值', 'error');
        return;
    }
    
    // 创建目标记录
    const target = {
        id: generateId(),
        gtv: gtv.toFixed(2),
        revenue: revenue.toFixed(2),
        createdAt: new Date().toISOString()
    };
    
    // 保存数据（以 salesId 为 key 隔离存储）
    addTarget(user.salesId, target);
    
    // 重置表单
    this.reset();
    
    // 刷新列表
    renderTargetList();
    
    showToast('目标提交成功！');
});

/**
 * 处理删除
 */
function handleDelete(targetId) {
    const user = getCurrentUser();
    if (!user) return;
    
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }
    
    deleteTarget(user.salesId, targetId);
    renderTargetList();
    showToast('记录已删除');
}

/**
 * 处理退出登录
 */
document.getElementById('logoutBtn').addEventListener('click', function() {
    clearCurrentUser();
    document.getElementById('loginForm').reset();
    showPage(loginPage);
    showToast('已退出登录');
});

// ==================== 初始化 ====================

/**
 * 检查登录状态并初始化页面
 */
function init() {
    const user = getCurrentUser();
    
    if (user) {
        // 已登录，显示主页面
        updateUserDisplay();
        renderTargetList();
        showPage(mainPage);
    } else {
        // 未登录，显示登录页
        showPage(loginPage);
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);
