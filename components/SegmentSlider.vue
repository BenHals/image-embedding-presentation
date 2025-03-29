<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  segments: {
    default: [],
  },
  prog: Number
})
console.log(props)

const slider = ref<HTMLInputElement | null>(null)
const sliderMask = ref<HTMLDivElement | null>(null)
const emit = defineEmits(['prog-update'])

//const segments = ref([
//  { name: "Test1", length: 0.1, idx: 0 },
//  { name: "Test2", length: 0.3, idx: 1 },
//  { name: "Test3", length: 0.4, idx: 2 },
//])

function getColor(i: number) {
  const colors = [
    "#1971c2",
    "#f08c00",
    "#e03131",
    "#2f9e44",
  ]
  return colors[i % colors.length]
}

function input() {
  let v = parseFloat(slider.value!.value)
  emit('prog-update', v)
}

</script>

<template>
  <div class="multistepSlider" style="height: 30px">
    <div class="barContainer" style="display: flex; height: 30px">
      <template v-for="segment in props.segments">
        <div :style="`background: ${getColor(segment.idx)}; width: ${segment.length*100}%; border-radius: 5px;`">
          <div class="segmentName" :style="{color: getColor(segment.idx)}">
            {{ segment.name }}
          </div>
        </div>
      </template>
    </div>
    <div class="sliderContainer" style="position: relative; top: -30px">
      <div ref="sliderMask" class="slider-mask" :style="`left: ${props.prog*100}%; width: ${(1 - props.prog)*100}%`"></div>
      <input ref="slider" type="range" id="slider" min="0" max="1.0" step="0.01" :value="props.prog" style="width: 100%" @input="input"/>
    </div>
  </div>
</template>

<style>
@font-face {
    font-family: 'myFont';
    src: url('public/Excalifont-Regular.woff2');
}
.segmentName {
  position: relative;
  top: -20px;
  font-family: myFont;
}
.slider-mask {
  position: absolute;
  width: 100%;
  height: 30px;
  background: rgba(255, 255, 255, 0.5);
}

input[type='range'] {
  position: absolute;
  width: 100%;
  -webkit-appearance: none;
  background-color: transparent;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  border-radius: 20px;
  width: 30px;
  height: 30px;
  background: white;
  border: 1px solid gray;
  box-shadow: 0 0 5px gray;
  cursor: pointer;
}

</style>
