<script lang="ts" setup>
import { ref, $navigateBack } from 'nativescript-vue';

const items = ref(
  Array(1000)
    .fill(0)
    .map((_, index) => `Item ${index + 1}`),
);
</script>

<template>
  <Page actionBarHidden="true">
    <GridLayout rows="auto, *">
 
    </GridLayout>
  </Page>
</template>
