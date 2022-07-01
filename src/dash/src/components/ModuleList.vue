<script setup lang="ts">
const { exlg } = window
</script>

<template>
    <div>
        Modules
        <ul>
            <li v-for="mod of exlg.modules">
                {{ mod.id }}
                <input type="checkbox" :checked="mod.active" />
            </li>
        </ul>
    </div>
</template>
