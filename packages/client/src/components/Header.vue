<template>
    <div class="header">
        <div class="stack">
            <div class="split">
                <div class="logo no-select">
                    <img src="/ultra.svg" />
                </div>
                <div class="logo-spacer no-select">X</div>
                <div class="logo no-select">
                    <img src="/discord.svg" />
                </div>
            </div>
        </div>
        <template v-if="!props.header.asError">
            <h3 class="pt-2 no-select">{{ props.header.title }}</h3>
        </template>
        <template v-else>
            <h3 class="pt-2 error-header no-select">{{ props.header.title }}</h3>
        </template>

        <p class="no-select">{{ props.header.message }}</p>
    </div>
</template>

<script setup lang="ts">
import { HeaderInfo } from '../interfaces/header';

const props = defineProps<{ header: HeaderInfo }>();
</script>

<style scoped>
.error-header {
    margin-bottom: 0px !important;
    color: rgb(179, 129, 255);
}
</style>
