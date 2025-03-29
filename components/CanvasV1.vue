<script setup lang="ts">

import { ref, onMounted, shallowRef } from 'vue'

interface simState {
  x: number,
  y: number
}

const customCanvas = shallowRef<HTMLCanvasElement | null>(null)
const ctx = shallowRef<CanvasRenderingContext2D | null>(null)
const progSlider = ref<HTMLInputElement | null>(null)
let prog = ref(0.0)

onMounted(() => {
  ctx.value = customCanvas.value!.getContext('2d')
  draw(sim(prog.value))
})

function sim(p: number): simState {
  let w = customCanvas.value!.width
  let h = customCanvas.value!.height
  console.log(w, h, p)
  const min_x = 0.0;
  const min_y = 0.0;
  const max_x = w;
  const max_y = h;

  return {
    x: (1 - p) * min_x + p * max_x,
    y: (1 - p) * min_y + p * max_y
  }
}

function draw(state: simState) {
  let w = customCanvas.value!.width
  let h = customCanvas.value!.height
  ctx.value?.clearRect(0, 0, w, h)

  ctx.value?.fillRect(state.x - 75, state.y - 32.5, 150, 75)
}

function move() {
  prog.value = progSlider.value!.value
  prog.value = Math.min(prog.value, 1.0)
  draw(sim(prog.value))

}

console.log('test')

</script>

<template>
  <div flex="~ col" w="min" border="~ main rounded-md">
    <canvas ref="customCanvas" id='test' @click="move">
    </canvas>
    <input type="range" min=0.0 max=1.0 step=0.01 ref="progSlider" @input="move"></input>
  </div>
</template>
