<template>
  <div>
    <h2>文件选择器示例</h2>
    <FilePicker
      title="请选择配置文件"
      buttonText="选择 JSON 文件"
      accept=".json"
      @select="onSelect"
    />
  </div>
</template>

<script setup lang="ts">
import FilePicker from './FilePicker.vue'

const onSelect = (files: string[]) => {
  console.log('选中的文件路径:', files)
}
</script>
