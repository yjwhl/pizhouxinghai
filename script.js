const baseAngle = Math.PI / 360;
let radius = 200; // 初始半径
const minRadius = 100; // 最小半径
const maxRadius = 400; // 最大半径
let radiusStep = 20; // 每次滚轮滚动的半径变化量
let speed = 1;
let angleX = speed * baseAngle;
let angleY = -speed * baseAngle;
let focalLength = radius * 1.5;

// 数据结构：多个星球，使用 Map 存储
let planets = new Map();
let currentPlanet = null;

let isBatchMode = false;
let isFullscreen = false;
let isDarkMode = false; // 初始为非暗黑模式

// 新增变量：初始旋转速度
let initialRotationSpeed = 0.002;

// 新增变量：是否检测到鼠标动作
let mouseMoved = false;

class Tag {
    constructor(text, planet) {
        this.text = text;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.element = this.createElement();
        this.planet = planet; // 记录标签所属的星球
    }

    createElement() {
        const tagElement = document.createElement('a');
        tagElement.className = 'tag';
        tagElement.textContent = this.text;
        tagElement.style.color = '#' + Math.floor(Math.random() * 0x666666 + 0x333333).toString(16);

        // 确保在暗黑模式下标签颜色足够亮
        if (isDarkMode) {
            let colorValue = Math.floor(Math.random() * 0x666666 + 0x999999).toString(16);
            // 确保颜色值至少为 #999999
            tagElement.style.color = '#' + colorValue;
        }

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'X';

        deleteButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (confirm(`确定要删除标签 "${this.text}" 吗？`)) {
                this.deleteTag();
            }
        });

        tagElement.appendChild(deleteButton);
        document.getElementById('tagCloud').appendChild(tagElement);
        return tagElement;
    }

    updatePosition() {
        const scale = focalLength / (focalLength - this.z);
        const alpha = (this.z + radius) / (2 * radius);
        this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, ${this.z}px) scale(${scale})`;
        this.element.style.opacity = alpha + 0.5;
    }

    deleteTag() {
        this.element.remove();

        const planetTags = planets.get(this.planet);
        const index = planetTags.indexOf(this);
        if (index > -1) {
            planetTags.splice(index, 1);
        }

        recalculatePositions();
        //alert('标签已删除！'); // 添加提示信息
    }
}

function recalculatePositions() {
    if (!currentPlanet) return;

    const planetTags = planets.get(currentPlanet);
    if (!planetTags) return;

    const count = planetTags.length;
    planetTags.forEach((tag, index) => {
        // 使用标签总数量计算角度
        const angleA = Math.acos((2 * (index + 1) - 1) / count - 1);
        const angleB = angleA * Math.sqrt(count * Math.PI);
        tag.z = radius * Math.cos(angleA);
        tag.y = radius * Math.sin(angleA) * Math.sin(angleB);
        tag.x = radius * Math.sin(angleA) * Math.cos(angleB);
        tag.updatePosition();
        tag.element.style.display = 'inline-block'; // 确保标签可见
    });
}

function rotateTags() {
    if (!currentPlanet) return;

    const planetTags = planets.get(currentPlanet);
    if (!planetTags) return;

    let currentAngleX = angleX;
    let currentAngleY = angleY;

    // 如果没有检测到鼠标动作，则使用初始旋转速度
    if (!mouseMoved) {
        currentAngleX = initialRotationSpeed;
        currentAngleY = initialRotationSpeed;
    }

    const cosX = Math.cos(currentAngleX);
    const sinX = Math.sin(currentAngleX);
    const cosY = Math.cos(currentAngleY);
    const sinY = Math.sin(currentAngleY);

    planetTags.forEach(tag => {
        const y = tag.y * cosX - tag.z * sinX;
        const z = tag.z * cosX + tag.y * sinX;
        tag.y = y;
        tag.z = z;

        const x = tag.x * cosY - tag.z * sinY;
        tag.z = tag.z * cosY + tag.x * sinY;
        tag.x = x;

        tag.updatePosition();
    });
}

function animate() {
    rotateTags();
    requestAnimationFrame(animate);
}

function addTagFromInput() {
    if (!currentPlanet) return;

    const input = document.getElementById('tagInput');
    const tagValue = input.value.trim();
    if (tagValue) {
        const tag = new Tag(tagValue, currentPlanet);
        planets.get(currentPlanet).push(tag);
        recalculatePositions();
        input.value = '';
        //alert('标签添加成功！'); // 添加提示信息
    }
}

function addTagsFromList() {
    if (!currentPlanet) return;

    const tagListInput = document.getElementById('tagListInput');
    const tagValues = tagListInput.value.split('\n').map(tag => tag.trim()).filter(tag => tag !== '');

    tagValues.forEach(tagValue => {
        const tag = new Tag(tagValue, currentPlanet);
        planets.get(currentPlanet).push(tag);
    });

    recalculatePositions();
    tagListInput.value = '';
    //alert('标签批量添加成功！'); // 添加提示信息
}

function toggleBatchMode() {
    isBatchMode = !isBatchMode;

    const tagInput = document.getElementById('tagInput');
    const tagListInput = document.getElementById('tagListInput');
    const toggleBatchBtn = document.getElementById('toggleBatchBtn');

    if (isBatchMode) {
        tagInput.style.display = 'none';
        tagListInput.style.display = 'block';
        toggleBatchBtn.textContent = '单个添加';
    } else {
        tagInput.style.display = 'block';
        tagListInput.style.display = 'none';
        toggleBatchBtn.textContent = '批量添加';
    }
}

function exportTags() {
    if (!currentPlanet) return;

    const planetTags = planets.get(currentPlanet);
    const tagStrings = planetTags.map(tag => tag.text);
    const csvContent = "data:text/csv;charset=utf-8," + tagStrings.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tags.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
}

function toggleFullscreen() {
    if (!isFullscreen) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function handleFullscreenChange() {
    isFullscreen = !!(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    const container = document.getElementById('container');
    if (isFullscreen) {
        container.classList.add('fullscreen');
    } else {
        container.classList.remove('fullscreen');
    }
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');

    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.textContent = isDarkMode ? '明亮' : '暗黑'; // 修改按钮文本

    // 更新所有标签的颜色
    planets.forEach(planetTags => {
        planetTags.forEach(tag => {
            if (isDarkMode) {
                let colorValue = Math.floor(Math.random() * 0x666666 + 0x999999).toString(16);
                tag.element.style.color = '#' + colorValue;
            } else {
                tag.element.style.color = '#' + Math.floor(Math.random() * 0x666666 + 0x333333).toString(16);
            }
        });
    });
}

function switchPlanet(planetName) {
    // 隐藏当前星球的标签
    if (currentPlanet) {
        const currentTags = planets.get(currentPlanet);
        if (currentTags) {
            currentTags.forEach(tag => tag.element.style.display = 'none');
        }
    }

    currentPlanet = planetName;

    // 显示目标星球的标签
    recalculatePositions();

    // 更新 select 元素的值
    document.getElementById('planetSelect').value = planetName;
}

function addPlanet(planetName) {
    if (!planetName) return;

    if (planets.has(planetName)) {
        alert('星球已存在');
        return;
    }

    planets.set(planetName, []);

    // 添加初始标签
    const initialTags = ['创意', '灵感', '点子', '想法', '记忆', '纪念', '旅行', '美食', '电影', '音乐', '阅读', '运动']; // 增加初始标签数量
    initialTags.forEach(text => {
        const tag = new Tag(text, planetName);
        planets.get(planetName).push(tag);
    });

    const option = document.createElement('option');
    option.value = planetName;
    option.textContent = planetName;
    document.getElementById('planetSelect').appendChild(option);

    switchPlanet(planetName); // 切换到新星球

    document.getElementById('planetSelect').value = planetName;

    recalculatePositions(); // 重新计算标签位置
    // alert('星球添加成功！'); // 移除弹窗
}


function deletePlanet() {
    if (!currentPlanet) return;

    if (planets.size <= 1) {
        alert('至少需要保留一个星球');
        return;
    }

    if (confirm(`确定要删除星球 "${currentPlanet}" 吗？`)) {
        // 隐藏当前星球的所有标签
        const planetTags = planets.get(currentPlanet);
        if (planetTags) {
            planetTags.forEach(tag => tag.element.style.display = 'none');
        }

        // 从 select 元素中删除选项
        const selectElement = document.getElementById('planetSelect');
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].value === currentPlanet) {
                selectElement.remove(i);
                break;
            }
        }

        // 从 planets Map 中删除星球
        planets.delete(currentPlanet);

        // 切换到下一个星球
        const planetKeys = Array.from(planets.keys());
        if (planetKeys.length > 0) {
            switchPlanet(planetKeys[0]);
            document.getElementById('planetSelect').value = planetKeys[0];
        } else {
            currentPlanet = null; // 没有星球了
        }

        recalculatePositions();
    }
}

function renamePlanet() {
    if (!currentPlanet) return;

    const newPlanetName = document.getElementById('planetNameInput').value.trim();

    if (!newPlanetName) {
        alert('请输入新的星球名称');
        return;
    }

    if (planets.has(newPlanetName)) {
        alert('该星球名称已存在');
        return;
    }

    if (confirm(`确定要将星球 "${currentPlanet}" 重命名为 "${newPlanetName}" 吗？`)) {
        // 创建新的星球
        planets.set(newPlanetName, planets.get(currentPlanet));

        // 删除旧的星球
        planets.delete(currentPlanet);

        // 更新 select 元素
        const selectElement = document.getElementById('planetSelect');
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].value === currentPlanet) {
                selectElement.options[i].value = newPlanetName;
                selectElement.options[i].textContent = newPlanetName;
                break;
            }
        }

        // 切换到新的星球
        switchPlanet(newPlanetName);

        // 清空输入框
        document.getElementById('planetNameInput').value = '';
        //alert('星球重命名成功！'); // 添加提示信息
    }
}

function clearPlanetTags() {
    if (!currentPlanet) return;

    if (confirm(`确定要清除星球 "${currentPlanet}" 的所有标签吗？`)) {
        const planetTags = planets.get(currentPlanet);

        // 移除所有标签的 DOM 元素
        planetTags.forEach(tag => tag.element.remove());

        // 清空星球的标签数组
        planets.set(currentPlanet, []);

        recalculatePositions();
        //alert('星球标签已清除！'); // 添加提示信息
    }
}

// 鼠标滚轮事件处理函数
let lastWheelTime = 0;
const wheelThrottleInterval = 50; // 节流时间间隔，单位：毫秒

function handleWheel(event) {
    event.preventDefault(); // 阻止默认滚动行为

    const currentTime = Date.now();
    if (currentTime - lastWheelTime > wheelThrottleInterval) {
        const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail))); // 获取滚动方向

        radius += delta * (radiusStep / 2); // 更新半径，减小步长

        // 限制半径范围
        radius = Math.max(minRadius, Math.min(maxRadius, radius));

        focalLength = radius * 1.5; // 更新焦距

        recalculatePositions(); // 重新计算标签位置

        lastWheelTime = currentTime;
    }
}

function switchPrevPlanet() {
    const planetKeys = Array.from(planets.keys());
    const currentIndex = planetKeys.indexOf(currentPlanet);
    const prevIndex = (currentIndex - 1 + planetKeys.length) % planetKeys.length;
    switchPlanet(planetKeys[prevIndex]);
}

function switchNextPlanet() {
    const planetKeys = Array.from(planets.keys());
    const currentIndex = planetKeys.indexOf(currentPlanet);
    const nextIndex = (currentIndex + 1) % planetKeys.length;
    switchPlanet(planetKeys[nextIndex]);
}

document.getElementById('addTagBtn').addEventListener('click', () => {
    if (isBatchMode) {
        addTagsFromList();
    } else {
        addTagFromInput();
    }
});

document.getElementById('tagInput').addEventListener('click', (event) => {
    event.preventDefault();
    addTagFromInput();
});

document.getElementById('tagInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !isBatchMode) {
        event.preventDefault();
        addTagFromInput();
    }
});

document.getElementById('toggleBatchBtn').addEventListener('click', toggleBatchMode);

document.getElementById('exportTagsBtn').addEventListener('click', exportTags);

document.addEventListener('mousemove', (e) => {
    mouseMoved = true; // 检测到鼠标动作
    angleY = 2 * (e.clientX / window.innerWidth - 0.5) * speed * baseAngle;
    angleX = 2 * (e.clientY / window.innerHeight - 0.5) * speed * baseAngle;
});

// Fullscreen functionality
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('msfullscreenchange', handleFullscreenChange);

// Dark mode toggle
document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode); // 添加暗黑模式切换事件

// Add a button to toggle fullscreen (optional)
const fullscreenButton = document.getElementById('fullscreenButton');
fullscreenButton.addEventListener('click', toggleFullscreen);

// Music Functionality
const backgroundMusic = document.getElementById('backgroundMusic');
const playPauseBtn = document.getElementById('playPauseBtn');
let isPlaying = false;

playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        backgroundMusic.pause();
        playPauseBtn.textContent = '播放';
    } else {
        backgroundMusic.play();
        playPauseBtn.textContent = '暂停';
    }
    isPlaying = !isPlaying;
});

// Planet selection
document.getElementById('planetSelect').addEventListener('change', (event) => {
    switchPlanet(event.target.value);
});

// Add planet
document.getElementById('addPlanetBtn').addEventListener('click', () => {
    const planetName = document.getElementById('planetNameInput').value.trim();
    addPlanet(planetName);
    document.getElementById('planetNameInput').value = '';
});

// Rename planet
document.getElementById('planetActionBtn').addEventListener('click', () => {
    if (currentPlanet) {
        renamePlanet();
    } else {
        alert('请先选择一个星球');
    }
});

// Delete planet
document.getElementById('deletePlanetBtn').addEventListener('click', deletePlanet);

// Clear planet tags
document.getElementById('clearPlanetTagsBtn').addEventListener('click', clearPlanetTags);

// Previous/Next planet buttons
document.getElementById('prevPlanetBtn').addEventListener('click', switchPrevPlanet);
document.getElementById('nextPlanetBtn').addEventListener('click', switchNextPlanet);

// Keyboard event listener
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        switchPrevPlanet();
    } else if (event.key === 'ArrowRight') {
        switchNextPlanet();
    }
});

window.onload = () => {
    // 初始化星球数据
    addPlanet('星球1');
    addPlanet('星球2');

    const initialTagsPlanet1 = ['创意', '灵感', '点子', '想法', '记忆', '纪念', '旅行', '美食', '电影', '音乐', '阅读', '运动']; // 增加初始标签数量
    initialTagsPlanet1.forEach(text => {
        const tag = new Tag(text, '星球1');
        planets.get('星球1').push(tag);
    });

    const initialTagsPlanet2 = ['科技', '未来', '创新', '探索', '人工智能', '机器学习', '大数据', '云计算', '物联网', '区块链']; // 增加初始标签数量
    initialTagsPlanet2.forEach(text => {
        const tag = new Tag(text, '星球2');
        planets.get('星球2').push(tag);
    });

    switchPlanet('星球1'); // 初始显示星球 1
    document.getElementById('planetSelect').value = '星球1';

    // 初始时隐藏其他星球的标签
    planets.forEach((tags, planetName) => {
        if (planetName !== currentPlanet) {
            tags.forEach(tag => tag.element.style.display = 'none');
        }
    });

    recalculatePositions();
    animate();

    // 监听鼠标滚轮事件
    document.addEventListener('wheel', handleWheel);
};
