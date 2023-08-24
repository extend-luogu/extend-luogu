<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModules } from '@/stores/module'

const { utils, coreVersion } = window.exlg
const moduleStore = useModules()

const debug = ref(false)
const debugClickCount = ref(0)
function debugClick() {
    if (++debugClickCount.value === 5) {
        debug.value = true // 开启调试模式
        window.exlg.moduleControl = moduleStore.moduleControl
    }

    if (debugClickCount.value === 10) {
        utils.simpleAlert('尝试一下《Celeste 蔚蓝》吧！一款震撼心灵的游戏', {
            noCancel: true,
            title: 'To: Madeline'
        })
    }

    if (debugClickCount.value === 15) {
        utils.simpleAlert('……不要，不要再点了！QAQ', { noCancel: true })
    }
}

const newVersionURL = 'https://celeste.dl.exlg.cc/latest/dist/extend-luogu.min.user.js'

async function getLatestVersion() {
    const latest = (await utils.csGet(newVersionURL)).responseText
    const match = latest.match(/\/\/\s*@version\s*(\S+)/)
    if (match && match[1]) {
        return match[1]
    }
    return "0.0.0"
}

const newVersion = ref('')
const comparisonResult = computed(() => newVersion.value ? utils.semver.compare(newVersion.value, coreVersion) : 2)

function openUpdateTab() {
    const newTab = window.open(newVersionURL, '_blank')
    newTab?.focus()
}

async function updateVersion() {
    if (newVersion.value) {
        if (comparisonResult.value === -1) {
            utils.simpleAlert(`您当前的版本 ${ coreVersion } 更新，确定要降级脚本至 ${ newVersion.value } 吗？`, {
                title: '警告',
                onAccept: openUpdateTab
            })
        } else if (comparisonResult.value === 0) {
            utils.simpleAlert(`确定要重新安装 ${ newVersion.value } 吗？`, {
                title: '提示',
                onAccept: openUpdateTab
            })
        } else openUpdateTab()
        return
    }
    newVersion.value = await getLatestVersion()
}
</script>

<template>
    <div>
        core <span class="module-version">{{ coreVersion }}</span>
        <span v-if="comparisonResult === -1 && newVersion" style="color: #fe4c61;"> &lt;&lt; </span>
        <span v-else-if="comparisonResult === 0 && newVersion" style="color: #52c41a;"> == </span>
        <span v-else-if="comparisonResult === 1 && newVersion" style="color: #3498db;"> >> </span>
        <span v-if="newVersion"> {{ newVersion }} </span>
        <br>
        <button
            class="exlg-button"
            @click="updateVersion()"
        >
            {{ (newVersion) ? `下载 (${newVersion})` : '获取更新' }}
        </button>
        <hr class="exlg-hr">
        更新日志：
        <pre>{{ utils.updateLog }}</pre>
        <hr class="exlg-hr">
        <p
            class="debug-button"
            :class="{ debug }"
            @click.prevent="debugClick"
        >
            DEBUG
        </p>
    </div>
</template>

<style scoped>
.debug-button {
    user-select: none;
}

.debug-button.debug {
    color: var(--accent-color);
}
</style>
